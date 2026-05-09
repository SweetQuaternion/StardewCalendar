# Stardew Valley Farm Planner – Vibe Coding Instructions für Copilot

## Projektübersicht

Wir bauen eine React-Webanwendung zur Farmplanung für Stardew Valley. Die App ist vollständig frontend-basiert (kein Backend, keine Datenbank). Alle Daten werden im `localStorage` gespeichert. Das Projekt wird schrittweise aufgebaut – jeder Schritt baut auf dem vorherigen auf.

Bitte erledige jeden Schritt einzeln. Fahre erst fort, wenn ich es dir sage. Wenn etwas unklar ist, frage immer nach.

**Tech-Stack:**

- React mit TypeScript (alle Dateien: `.tsx` / `.ts`)
- Vanilla CSS (`index.css` + komponentenspezifische `.css`-Dateien)
- Maßeinheiten: ausschließlich `em` (keine `px` für Abstände/Größen)
- Layout: ausschließlich Flexbox
- localStorage für Datenpersistenz
- HTML5 Drag and Drop API

**Ästhetik:** Warmer, rustikaler Farm-Look. Blasse Pastellfarben in Grün, Gelb und Braun. Kein Pixel-Font – stattdessen eine lesbare, leicht organische Serifenschrift wie `"Lora"` (Google Fonts). Alles wirkt sanft, geerdet und einladend.

**Farbpalette (CSS Custom Properties in `:root`):**

```css
--color-bg: #f0ede4; /* blasses Creme */
--color-sidebar: #e8e0cc; /* warmes helles Beige */
--color-panel: #f5f2ea; /* fast weißes Gelb */
--color-border: #c9bb99; /* gedämpftes Sandbraun */
--color-accent: #8fad6e; /* blasses Wiesengrün */
--color-accent2: #c8a96e; /* blasses Goldgelb */
--color-text: #4a3728; /* warmes dunkles Braun */
--color-text-light: #7a6252; /* helles Braun für sekundären Text */
--color-grass: #d4e8c2; /* blasses Mintgrün für die Farmkarte */
```

---

## Gesamtlayout der App

```
┌──────────────────────────────────────────────────────────────────┐
│                           HEADER                                 │
├──────────────┬───────────────────────────────┬───────────────────┤
│              │  Kalender + Infos + Aufgaben  │                   │
│  Linke       │  (oberer Mittelbereich)       │  Rechte Spalte    │
│  Spalte      ├───────────────────────────────┤  (Saison-         │
│  (Pflanzen   │                               │   übersicht,      │
│  & Saison)   │  Farmkarte                    │   fest)           │
│              │  (unterer Mittelbereich)      │                   │
│              │                               │                   │
│              │                               │                   │
│              │                               │                   │
└──────────────┴───────────────────────────────┴───────────────────┘
```

- **Header:** volle Breite, ganz oben
- **Linke Spalte:** feste Breite (~14em), scrollbar
- **Mittlerer Bereich:** `flex: 1`, oben Kalender+Info, unten Karte
- **Rechte Spalte:** feste Breite (~18em), Saisonübersicht, immer sichtbar

---

## Schritt 1: Projektstruktur, Header & Grundlayout

### Ziel

Erstelle die Dateistruktur, binde Fonts ein, definiere CSS-Variablen und baue das vollständige Layout-Gerüst inklusive Header.

### Anweisungen

1. Die React-App existiert bereits (Vite + React + TypeScript). Erstelle folgende Ordnerstruktur:

```
src/
  components/
  data/
  hooks/
  utils/
  App.tsx
  main.tsx
  index.css
```

2. Binde in `index.html` die Google Font `"Lora"` ein (weights 400 und 600):

```html
<link
  href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&display=swap"
  rel="stylesheet"
/>
```

3. Definiere in `index.css` alle CSS Custom Properties (siehe Farbpalette oben) auf `:root`. Setze außerdem:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: "Lora", serif;
  background: var(--color-bg);
  color: var(--color-text);
}
```

4. **App.tsx** rendert folgende Struktur:

```
<div class="app-root">           ← display: flex; flex-direction: column; height: 100vh
  <header class="app-header">   ← feste Höhe ~4em
  <div class="app-body">        ← display: flex; flex: 1; overflow: hidden
    <aside class="sidebar">     ← width: 14em; min-width: 14em; overflow-y: auto
    <main class="main-area">    ← flex: 1; display: flex; flex-direction: column; overflow: hidden
      <section class="bed-panel">   ← flex: 0 0 auto; min-height: 10em; display: flex
      <section class="map-area">    ← flex: 1; overflow: auto
    <aside class="season-panel">    ← width: 18em; min-width: 18em; overflow-y: auto
```

5. **Header (`app-header`):**
   - Volle Breite, Hintergrund `var(--color-accent)`, leichter Schatten nach unten
   - Links: App-Titel „🌾 Stardew Farm Planner" in `1.4em`, Schriftgewicht 600
   - Rechts: Platzhalter-Bereich für Export-Buttons (kommt in Schritt 8)
   - Padding: `0.5em 1.5em`, vertikal zentriert mit Flexbox (`align-items: center`, `justify-content: space-between`)

6. Trennlinien zwischen allen Bereichen: `1px solid var(--color-border)`.

7. Alle Bereiche zeigen zunächst nur einen kurzen Platzhalter-Text.

### Ergebnis von Schritt 1

Die App zeigt ein vollständiges Layout-Gerüst mit Header, drei Spalten und dem geteilten Mittelbereich. Alle Proportionen stimmen, keine Logik.

---

## Schritt 2: Pflanzendaten, Jahreszeiten & TypeScript-Typen

### Ziel

Erstelle alle TypeScript-Typen, Jahreszeitdaten und Pflanzendaten als statische Dateien.

### Anweisungen

1. Erstelle `src/data/types.ts`:

```ts
export type SeasonId = "spring" | "summer" | "fall" | "winter";

export interface Season {
  id: SeasonId;
  label: string;
  emoji: string;
  color: string;
}

export interface Plant {
  id: string;
  name: string;
  seasons: SeasonId[]; // Jahreszeiten, in denen die Pflanze wächst
  growDays: number; // Tage bis zur ersten Ernte
  regrowDays: number | null; // null = kein Regrow
  sellPrice: number;
  seedPrice: number;
  yield: number; // Menge pro Ernte
  color: string; // Hex-Farbe für Kalenderblock
  imageFile: string; // z.B. "parsnip.png", liegt in /public/plants/
}

export interface Bed {
  id: string;
  name: string;
  x: number; // Kästchen-Koordinate, linke obere Ecke
  y: number;
  width: number; // in Kästchen
  height: number; // in Kästchen
  color: string; // zufällige Farbe
  planting: Planting | null; // ein Beet hat immer genau eine oder keine Pflanzung
}

export interface Planting {
  id: string;
  plantId: string;
  startDay: number; // Tag 1–28, Pflanztag
}
```

2. Erstelle `src/data/seasons.ts`:

```ts
import { Season } from "./types";
export const SEASON_DAYS = 28;
export const SEASONS: Season[] = [
  { id: "spring", label: "Frühling", emoji: "🌸", color: "#b8ddb0" },
  { id: "summer", label: "Sommer", emoji: "☀️", color: "#f0d080" },
  { id: "fall", label: "Herbst", emoji: "🍂", color: "#d4956a" },
  { id: "winter", label: "Winter", emoji: "❄️", color: "#b8d4e8" },
];
export const SEASON_ORDER: SeasonId[] = ["spring", "summer", "fall", "winter"];
```

3. Erstelle `src/data/plants.ts` mit `export const PLANTS: Plant[]`. Bilder liegen unter `/public/plants/<imageFile>`.

**Frühling:**

```ts
{ id: 'parsnip',     name: 'Pastinake',    seasons: ['spring'],           growDays: 4,  regrowDays: null, sellPrice: 35,  seedPrice: 20,  yield: 1, color: '#f0d878', imageFile: 'parsnip.png' },
{ id: 'strawberry',  name: 'Erdbeere',     seasons: ['spring'],           growDays: 8,  regrowDays: 4,    sellPrice: 120, seedPrice: 100, yield: 1, color: '#e85555', imageFile: 'strawberry.png' },
{ id: 'cauliflower', name: 'Blumenkohl',   seasons: ['spring'],           growDays: 12, regrowDays: null, sellPrice: 175, seedPrice: 80,  yield: 1, color: '#f0f0d0', imageFile: 'cauliflower.png' },
{ id: 'potato',      name: 'Kartoffel',    seasons: ['spring'],           growDays: 6,  regrowDays: null, sellPrice: 80,  seedPrice: 50,  yield: 1, color: '#d4b870', imageFile: 'potato.png' },
{ id: 'kale',        name: 'Kohl',         seasons: ['spring'],           growDays: 6,  regrowDays: null, sellPrice: 110, seedPrice: 70,  yield: 1, color: '#78c878', imageFile: 'kale.png' },
{ id: 'tulip',       name: 'Tulpe',        seasons: ['spring'],           growDays: 6,  regrowDays: null, sellPrice: 30,  seedPrice: 20,  yield: 1, color: '#e878a8', imageFile: 'tulip.png' },
{ id: 'bluejazz',    name: 'Blue Jazz',    seasons: ['spring'],           growDays: 7,  regrowDays: null, sellPrice: 50,  seedPrice: 30,  yield: 1, color: '#88a8e8', imageFile: 'bluejazz.png' },
{ id: 'coffee',      name: 'Kaffee',       seasons: ['spring', 'summer'], growDays: 10, regrowDays: 2,    sellPrice: 150, seedPrice: 2500,yield: 4, color: '#7a5030', imageFile: 'coffee.png' },
```

**Sommer:**

```ts
{ id: 'melon',       name: 'Melone',       seasons: ['summer'],           growDays: 12, regrowDays: null, sellPrice: 250, seedPrice: 80,  yield: 1, color: '#98d858', imageFile: 'melon.png' },
{ id: 'tomato',      name: 'Tomate',       seasons: ['summer'],           growDays: 11, regrowDays: 4,    sellPrice: 60,  seedPrice: 50,  yield: 1, color: '#e05030', imageFile: 'tomato.png' },
{ id: 'blueberry',   name: 'Heidelbeere',  seasons: ['summer'],           growDays: 13, regrowDays: 4,    sellPrice: 50,  seedPrice: 80,  yield: 3, color: '#6868c8', imageFile: 'blueberry.png' },
{ id: 'hotpepper',   name: 'Chili',        seasons: ['summer'],           growDays: 5,  regrowDays: 3,    sellPrice: 40,  seedPrice: 40,  yield: 1, color: '#e84020', imageFile: 'hotpepper.png' },
{ id: 'radish',      name: 'Radieschen',   seasons: ['summer'],           growDays: 6,  regrowDays: null, sellPrice: 90,  seedPrice: 40,  yield: 1, color: '#e068a0', imageFile: 'radish.png' },
{ id: 'redcabbage',  name: 'Roter Kohl',   seasons: ['summer'],           growDays: 9,  regrowDays: null, sellPrice: 260, seedPrice: 100, yield: 1, color: '#9840a0', imageFile: 'redcabbage.png' },
{ id: 'starfruit',   name: 'Sternfrucht',  seasons: ['summer'],           growDays: 13, regrowDays: null, sellPrice: 750, seedPrice: 400, yield: 1, color: '#f0e840', imageFile: 'starfruit.png' },
{ id: 'corn',        name: 'Mais',         seasons: ['summer', 'fall'],   growDays: 14, regrowDays: 4,    sellPrice: 50,  seedPrice: 150, yield: 1, color: '#f0c830', imageFile: 'corn.png' },
```

**Herbst:**

```ts
{ id: 'pumpkin',     name: 'Kürbis',       seasons: ['fall'],             growDays: 13, regrowDays: null, sellPrice: 320, seedPrice: 100, yield: 1, color: '#e87820', imageFile: 'pumpkin.png' },
{ id: 'yam',         name: 'Yam',          seasons: ['fall'],             growDays: 10, regrowDays: null, sellPrice: 160, seedPrice: 60,  yield: 1, color: '#c06840', imageFile: 'yam.png' },
{ id: 'cranberry',   name: 'Preiselbeere', seasons: ['fall'],             growDays: 7,  regrowDays: 5,    sellPrice: 75,  seedPrice: 240, yield: 2, color: '#c83050', imageFile: 'cranberry.png' },
{ id: 'artichoke',   name: 'Artischocke',  seasons: ['fall'],             growDays: 8,  regrowDays: null, sellPrice: 160, seedPrice: 30,  yield: 1, color: '#80a040', imageFile: 'artichoke.png' },
{ id: 'grape',       name: 'Traube',       seasons: ['fall'],             growDays: 10, regrowDays: 3,    sellPrice: 80,  seedPrice: 60,  yield: 1, color: '#9858c0', imageFile: 'grape.png' },
{ id: 'eggplant',    name: 'Aubergine',    seasons: ['fall'],             growDays: 5,  regrowDays: 5,    sellPrice: 60,  seedPrice: 20,  yield: 1, color: '#7030a0', imageFile: 'eggplant.png' },
{ id: 'amaranth',    name: 'Amaranth',     seasons: ['fall'],             growDays: 7,  regrowDays: null, sellPrice: 150, seedPrice: 70,  yield: 1, color: '#c060c0', imageFile: 'amaranth.png' },
{ id: 'bok_choy',    name: 'Pak Choi',     seasons: ['fall'],             growDays: 4,  regrowDays: null, sellPrice: 80,  seedPrice: 50,  yield: 1, color: '#70c870', imageFile: 'bok_choy.png' },
```

**Winter:**

```ts
{ id: 'crystalfruit', name: 'Pulvermelone', seasons: ['winter'],          growDays: 7,  regrowDays: null, sellPrice: 60,  seedPrice: 30,  yield: 1, color: '#c0e0f8', imageFile: 'crystalfruit.png' },
```

> **Hinweis zu mehrjährigen Pflanzen (Mais, Kaffee):**
> Diese haben mehrere Einträge in `seasons`. Wenn z.B. Mais im Sommer in einem Beet gepflanzt wird und der User zur Herbst-Ansicht wechselt, gilt dieses Beet als automatisch durch Mais belegt – der User muss das nicht erneut eintragen.

### Ergebnis von Schritt 2

Alle TypeScript-Typen und Datendateien sind vorhanden. Keine UI-Änderungen.

---

## Schritt 3: Jahreszeit-Auswahl & Pflanzenliste (Seitenleiste)

### Ziel

Fülle die linke Seitenleiste mit der Jahreszeit-Auswahl und der scrollbaren Pflanzenliste.

### Anweisungen

1. Erstelle `src/components/SeasonSelector.tsx`:
   - Props: `selectedSeason: SeasonId`, `onSeasonChange: (s: SeasonId) => void`
   - Rendert vier Buttons (Frühling, Sommer, Herbst, Winter), je mit Emoji + Label
   - Aktive Jahreszeit: Hintergrund `var(--color-accent)`, Schriftgewicht 600, Rahmen
   - Buttons in voller Breite der Seitenleiste, untereinander

2. Erstelle `src/components/PlantCard.tsx`:
   - Props: `plant: Plant`
   - Zeigt: kleines Pflanzenbild (`<img src={'/plants/' + plant.imageFile} />`, Höhe `1.8em`) + Name
   - Darunter: `🌱 ${plant.growDays} Tage` und falls `regrowDays`: `🔄 alle ${plant.regrowDays} Tage`
   - Darunter: `💰 ${plant.sellPrice} G`
   - Linker farbiger Streifen: `0.25em solid ${plant.color}`
   - `draggable={true}`, `onDragStart`: `dataTransfer.setData('plantId', plant.id)`
   - Hover: leichtes Lift (`transform: translateY(-0.1em)`, `box-shadow`)

3. Erstelle `src/components/PlantList.tsx`:
   - Props: `selectedSeason: SeasonId`
   - Filtert `PLANTS` nach `plant.seasons.includes(selectedSeason)`
   - Rendert scrollbare Liste von `PlantCard`-Komponenten
   - Überschrift: „Verfügbare Pflanzen"

4. State `selectedSeason` liegt in `App.tsx` (Default: `'spring'`).

5. Seitenleiste: oben `SeasonSelector`, darunter `PlantList` (scrollbar, `flex: 1`, `overflow-y: auto`).

### Ergebnis von Schritt 3

Linke Spalte vollständig: Jahreszeit wechselbar, Pflanzen draggable.

---

## Schritt 4: Farmkarte – Beete anlegen

### Ziel

Baue die interaktive Farmkarte im unteren Mittelbereich.

### Anweisungen

1. Erstelle `src/components/FarmMap.tsx`:
   - Zeigt ein Raster (Standard: 20×12 Kästchen), jedes Kästchen `2em × 2em`
   - Hintergrund: `var(--color-grass)`
   - Rasterlinien: `1px solid rgba(0,0,0,0.1)`
   - Container: `overflow: auto`

2. **Beet anlegen per Maus-Drag:**
   - `onMouseDown` → Startkoordinate merken (in Kästchen, nicht Pixel)
   - `onMouseMove` → halbtransparente Vorschau des Rechtecks zeichnen
   - `onMouseUp` → Kollisionsprüfung, dann Modal für Beet-Name

3. **Kollisionsprüfung (vor dem Anlegen):**
   - Formel: `a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y`
   - Bei Überlappung: Vorschau rot einfärben, kein Modal öffnen, Tooltip „Überlappung nicht erlaubt"

4. **Beet-Farbpalette** sanftes Gelb

5. **Beete rendern:**
   - Farbiges Rechteck, absolut positioniert auf dem Raster
   - Beet-Name zentriert, `0.7em`
   - Ausgewähltes Beet: `0.15em solid var(--color-text)` als Rahmen
   - Klick auf Beet → `selectedBedId` in `App.tsx` setzen

6. **Rechtsklick auf Beet** → Kontextmenü: „Umbenennen" / „Löschen"

7. **Mehrjährige Pflanzen – automatische Belegung:**
   - Beim Laden der Beete für die aktuelle Saison: prüfe Beete der Vorsaison
   - Wenn ein Vorsaison-Beet eine Pflanzung mit einer mehrjährigen Pflanze hat, die auch die aktuelle Saison einschließt (`plant.seasons.includes(currentSeason)`): markiere dieses Beet als „carry-over belegt"
   - Darstellung: diagonales Schraffur-Muster (`repeating-linear-gradient(45deg, transparent, transparent 0.3em, rgba(0,0,0,0.08) 0.3em, rgba(0,0,0,0.08) 0.6em)`), Tooltip „Belegt durch [Pflanzenname] (aus [Vorsaison])"
   - Carry-over-Beete können nicht neu bepflanzt oder verschoben werden

8. **Leerer Zustand:** „Klicke und ziehe, um dein erstes Beet anzulegen 🌱" zentriert auf der Karte

9. **Rastergrößen-Buttons:** `+ Spalte`, `− Spalte`, `+ Reihe`, `− Reihe` am Kartenrand. Key `"sdv-grid-size"` in localStorage.

10. Alle Beet-Daten **pro Jahreszeit** in localStorage:
    - Key-Schema: `"sdv-beds-spring"`, `"sdv-beds-summer"`, `"sdv-beds-fall"`, `"sdv-beds-winter"`
    - Jedes Beet enthält `planting: Planting | null`

### Ergebnis von Schritt 4

Beete anlegen, benennen, auswählen, löschen. Kollisionen verhindert. Mehrjährige Belegungen sichtbar.

---

## Schritt 5: Beet-Kalender mit Drag-and-Drop

### Ziel

Der obere Mittelbereich zeigt den Kalender des ausgewählten Beetes. Pflanzen können per Drag-and-Drop auf Tage gezogen werden.

### Anweisungen

1. Erstelle `src/components/BedCalendar.tsx`:
   - Props: `bed: Bed | null`, `selectedSeason: SeasonId`, `plants: Plant[]`, `onPlantingSet: (bedId: string, plantId: string, startDay: number) => void`, `onPlantingRemove: (bedId: string) => void`
   - Wenn kein Beet ausgewählt: Hinweistext „Wähle ein Beet auf der Karte aus, um es hier zu planen. 🌿"
   - Wenn carry-over belegt: Kalender mit Overlay „🌽 [Pflanzenname] wächst noch (aus [Vorsaison])" – kein Drag-and-Drop möglich

2. **Kalender-Reihe:**
   - 28 Tageskästchen in 4 Reihen, Tageszahl oben, jedes `~2em` breit, Drop-Ziel
   - jeweils vier Kalender nebeneinander (verschiedene Jahreszeiten)
   - Kalenderoptik mit Wochentagen oben drüber

3. **Drag-and-Drop:**
   - Drop auf Tag X → Prüfung: `startDay + plant.growDays > 28`? → ablehnen mit Tooltip „⚠️ Zu spät für diese Saison"
   - Wenn bereits Pflanzung vorhanden: Bestätigungs-Dialog „Vorhandene Pflanzung ersetzen?"
   - Sonst: `onPlantingSet(bed.id, plantId, dayX)` aufrufen

4. **Kalender-Visualisierung:**

   **Nicht-regrowing Pflanzen:**
   - Farbiger Block von `startDay` bis `startDay + growDays - 1` (Wachstumszeit, Beet belegt)
   - Letzter Tag des Blocks: Ernte-Icon ✂️
   - Tage danach: frei (grau/leer)

   **Regrowing Pflanzen:**
   - Erster Block: `startDay` bis `startDay + growDays - 1` (Wachstum)
   - Ab `startDay + growDays`: Beet ist dauerhaft belegt bis Tag 28
   - Erntetage (`startDay + growDays`, dann `+ regrowDays`, `+ regrowDays`, …) sind hervorgehoben: etwas dunklerer Farbton + ✂️-Icon
   - Wachstumsphasen zwischen Ernten: hellerer Farbton der Pflanzenfarbe

   **Allgemein:**
   - Block zeigt Pflanzenbild (`1em`) + abgekürzten Namen
   - Hover → Tooltip mit: Name, Pflanztag, alle Erntetage, Gesamtertrag

5. **Rechtsklick auf Pflanzung** → „Pflanzung entfernen"

6. Drop-Ziel-Highlight beim Drag-Over: leichte Hintergrundfärbung des Tageskästchens

### Ergebnis von Schritt 5

Drag-and-Drop funktioniert, Kalender zeigt Wachstum und Ernten farbig und übersichtlich.

---

## Schritt 6: Beet-Infopanel

### Ziel

Neben dem Kalender erscheinen detaillierte Informationen zur Pflanzung des ausgewählten Beetes.

### Anweisungen

1. Erstelle `src/components/BedInfoPanel.tsx`:
   - Props: `bed: Bed | null`, `plants: Plant[]`
   - Wenn kein Beet ausgewählt oder keine Pflanzung vorhanden: kurzer Hinweistext

2. Wenn Beet + Pflanzung vorhanden:
   - Pflanzenbild + Name, Pflanztag
   - Alle Erntetage: „Tag X, Tag Y, …"
   - Anzahl Ernten, Gesamtertrag: `X Ernten × Y Stk. × Z G = W G`
   - Samenkosten: `1 × seedPrice G`
   - Gewinn: Ertrag − Samenkosten
   - Freie Tage (bei nicht-regrow): Tage nach Ernte bis Tag 28

3. Platzierung: im `bed-panel`-Bereich als Flexbox-Zeile. Kalender links (`flex: 1`), Info-Panel rechts (`width: 16em; min-width: 16em`). Getrennt durch `1px solid var(--color-border)`.

### Ergebnis von Schritt 6

Alle Beet-Kennzahlen auf einen Blick, neben dem Kalender.

---

## Schritt 7: Saison-Gesamtübersicht (rechte Spalte)

### Ziel

Die rechte Spalte zeigt permanent die Einkaufsliste und Ertragsübersicht für die aktuelle Saison.

### Anweisungen

1. Erstelle `src/components/SeasonSummary.tsx`:
   - Props: `beds: Bed[]`, `selectedSeason: SeasonId`, `plants: Plant[]`
   - Feste Breite (`18em`), volle Höhe, scrollbar, Hintergrund `var(--color-sidebar)`

2. **Einkaufsliste:**
   - Überschrift: „🛒 Einkaufsliste"
   - Alle Samen werden am ersten Tag der Saison komplett gekauft (kein späteres Nachkaufen)
   - Aggregiere alle Pflanzungen über alle Beete der aktuellen Saison, gruppiere nach `plantId`
   - Zeige: Pflanzenbild + Name | Anzahl Beete | Kosten/Samen | Gesamt
   - **Ausnahme mehrjährige Pflanzen:** Carry-over-Beete (z.B. Mais im Herbst aus dem Sommer) tauchen **nicht** in der Einkaufsliste auf – die Samen wurden bereits in der Vorsaison gekauft
   - Gesamtsumme: „Gesamt: X G 🪙"

3. **Ertragsübersicht:**
   - Überschrift: „📈 Erwarteter Ertrag"
   - Pro Beet (mit Pflanzung): Beet-Name | Pflanze | Ertrag in G
   - Summe aller Beete + Gewinn (Ertrag − Samenkosten)

4. Wenn keine Pflanzungen: „Pflanze deine Beete, um eine Übersicht zu sehen. 🌱"

### Ergebnis von Schritt 7

Rechte Spalte liefert jederzeit aktuelle Zahlen ohne extra Navigation.

---

## Schritt 8: Tagesaufgaben-Panel

### Ziel

Rechts in der oberen Leiste steht das Spiel-Datum und alle Aufgaben, die an diesem Tag zu tun sind.

### Anweisungen

#### 1. State & localStorage

Füge in `App.tsx` zwei neue States hinzu:

```ts
const [currentDay, setCurrentDay] = useLocalStorage<number>("sdv-current-day", 1);
const [selectedSeason, setSelectedSeason] = useLocalStorage<SeasonId>(
  "sdv-selected-season",
  "spring",
);
```

> **Wichtig:** `selectedSeason` war bisher ein normaler `useState`. Ersetze ihn durch `useLocalStorage`, damit die zuletzt angezeigte Saison beim Seitenladen wiederhergestellt wird.

Beim Wechsel der Jahreszeit (`onSeasonChange`) wird `currentDay` auf `1` zurückgesetzt:

```ts
function handleSeasonChange(season: SeasonId) {
  setSelectedSeason(season);
  setCurrentDay(1);
}
```

#### 2. Komponente `DayNavigator.tsx`

Erstelle `src/components/DayNavigator.tsx`.

**Props:**

```ts
interface DayNavigatorProps {
  currentDay: number;
  selectedSeason: SeasonId;
  onDayChange: (day: number) => void;
  beds: Bed[];
  plants: Plant[];
}
```

**Oberer Teil – Tagesanzeige:**

- Großer zentrierter Text: `Tag ${currentDay}` in `2em`, Schriftgewicht 600
- Darunter: Saisonname + Emoji in `1em`, Farbe `var(--color-text-light)`
- Links daneben: Pfeil-Button `‹` (Tag − 1, deaktiviert wenn `currentDay === 1`)
- Rechts daneben: Pfeil-Button `›` (Tag + 1, deaktiviert wenn `currentDay === 28`)
- Layout: `display: flex; align-items: center; justify-content: space-between; gap: 0.5em`
- Pfeil-Buttons: schlicht, kein Rahmen, `1.5em` groß, Cursor Pointer, disabled-State ausgegraut
  **Unterer Teil – Tagesaufgaben:**

Berechne die Aufgaben für den aktuellen Tag aus allen Beeten der aktuellen Saison. Für jedes Beet mit einer Pflanzung:

```ts
const harvestDays = getHarvestDays(planting, plant); // aus calculations.ts
const shouldHarvest = harvestDays.includes(currentDay);
const shouldPlant = planting.startDay === currentDay;
```

Zeige pro Beet mit Aufgaben einen Eintrag. Formulierungsregeln:

- Erntetag + Pflanztag gleichzeitig: „[Pflanze A] ernten · [Pflanze B] aussäen"
- Wenn gleiche Pflanze ernten und säen: "[Pflanze] ernten und neu aussäen"
- Nur Erntetag: „[Pflanze] ernten"
- Nur Pflanztag: „[Pflanze] säen"
- Carry-over-Beete (mehrjährige aus Vorsaison): nur Erntetage, kein Säen
- Keine Aufgaben: „Heute ist nichts zu tun. Genieße den Tag! 🌤️"

**Format jeder Aufgabenzeile:**

- Beet-Name in Schriftgewicht 600
- Aufgabentext in `var(--color-text-light)`
- Vertikaler Abstand zwischen Zeilen: `0.5em`

#### 3. Berechnung in `calculations.ts` ergänzen

```ts
export interface DayTask {
  bedId: string;
  bedName: string;
  bedColor: string;
  harvest: Plant | null; // Pflanze die heute geerntet wird
  sow: Plant | null; // Pflanze die heute gesät wird
}

export function getDayTasks(
  day: number,
  beds: Bed[],
  plants: Plant[],
  currentSeason: SeasonId,
): DayTask[] {
  const tasks: DayTask[] = [];

  for (const bed of beds) {
    if (!bed.planting) continue;
    const plant = plants.find((p) => p.id === bed.planting!.plantId);
    if (!plant) continue;

    const harvestDays = getHarvestDays(bed.planting, plant);
    const harvest = harvestDays.includes(day) ? plant : null;
    const sow = bed.planting.startDay === day ? plant : null;

    if (harvest || sow) {
      tasks.push({ bedId: bed.id, bedName: bed.name, bedColor: bed.color, harvest, sow });
    }
  }

  return tasks;
}
```

#### 4. Integration in `App.tsx`

- Übergib `currentDay`, `onDayChange={setCurrentDay}`, `beds` und `plants` an `DayNavigator`

### Ergebnis von Schritt 9

Der User sieht immer den aktuellen Spieltag und bekommt eine klare, beetweise Aufgabenliste: was heute geerntet und gesät werden muss. Tag und Saison werden in localStorage gespeichert und beim Seitenladen wiederhergestellt. 🌱

---

## Schritt 9: localStorage-Hook, Feinschliff & Export

### Ziel

Datenpersistenz kapseln, UX polieren, Export/Import hinzufügen.

### Anweisungen

1. **`src/hooks/useLocalStorage.ts`:**

```ts
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void];
// Liest beim Start aus localStorage (JSON.parse), schreibt bei Änderungen zurück
// Fehler beim Parsen → initialValue zurückgeben
```

Ersetze alle bisherigen manuellen `localStorage`-Zugriffe durch diesen Hook.

2. **Tooltips:** Einfache CSS-Tooltips (`position: absolute`, erscheinen bei `:hover` auf dem Elternelement) für:
   - Pflanzenkarten (alle Pflanzdetails)
   - Kalenderblöcke (alle Erntetage, Ertrag)
   - Carry-over-Beete auf der Karte

3. **Animationen (CSS only):**
   - `PlantCard` Hover: `transition: transform 0.15s ease, box-shadow 0.15s ease`
   - Neue Pflanzung im Kalender: `@keyframes popIn { from { transform: scaleX(0); } to { transform: scaleX(1); } }`, `transform-origin: left`
   - Drop-Ziel aktiv: sanfte Hintergrundfarbe via `transition`

4. **Export/Import** (Buttons im Header, rechte Seite):
   - „💾 Export": Alle `sdv-*` localStorage-Keys als `farm-plan.json` herunterladen
   - „📂 Import": `<input type="file" accept=".json">`, JSON einlesen, alle Keys zurückschreiben, dann `window.location.reload()`

5. **Jahreszeit-Wechsel Toast:**
   - Wenn mehrjährige Carry-over-Belegungen in der neuen Saison existieren: kleines Toast-Banner oben (3 Sekunden): „🌽 Mais wächst noch in X Beet(en) weiter."

6. **Saisonende-Warnung:**
   - Pflanzungen mit `startDay + plant.growDays > 28`: rote Markierung im Kalender + Tooltip „⚠️ Kein Ertrag mehr in dieser Saison"

### Ergebnis von Schritt 9

Die App ist vollständig, stabil, persistent und exportierbar. 🎉

---

## Technische Konventionen (gelten für alle Schritte)

- **TypeScript:** Immer. Alle Dateien `.tsx` / `.ts`. Keine `any`-Typen.
- **CSS:** Vanilla CSS. Nur `em` als Einheit. Nur Flexbox für Layout. Keine Pixel-Größen.
- **State:** Nur React Hooks. Kein Redux, kein Context (außer wenn unumgänglich).
- **IDs:** Immer `crypto.randomUUID()`. Keine manuellen Zähler.
- **Komponentengröße:** Über ~150 Zeilen → aufteilen.
- **Berechnungen:** Alle reinen Berechnungen in `src/utils/calculations.ts` als pure functions – nie direkt in Komponenten.

---

## Berechnungs-Referenz `src/utils/calculations.ts`

```ts
import { Plant, Planting, SeasonId } from "../data/types";
import { SEASON_DAYS, SEASON_ORDER } from "../data/seasons";

// Letzter Pflanztag, damit Ernte noch in die Saison fällt
export function lastPlantDay(plant: Plant): number {
  return SEASON_DAYS - plant.growDays + 1;
}

// Alle Erntetage innerhalb der Saison
export function getHarvestDays(planting: Planting, plant: Plant): number[] {
  const days: number[] = [];
  let harvest = planting.startDay + plant.growDays;
  while (harvest <= SEASON_DAYS) {
    days.push(harvest);
    if (!plant.regrowDays) break;
    harvest += plant.regrowDays;
  }
  return days;
}

// Gesamtertrag in Gold
export function calcRevenue(planting: Planting, plant: Plant): number {
  return getHarvestDays(planting, plant).length * plant.yield * plant.sellPrice;
}

// Gewinn (Ertrag minus Samenkosten)
export function calcProfit(planting: Planting, plant: Plant): number {
  return calcRevenue(planting, plant) - plant.seedPrice;
}

// Kollisionsprüfung zweier Beete
export function bedsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Gibt die Vorsaison zurück (zyklisch)
export function prevSeason(season: SeasonId): SeasonId {
  const idx = SEASON_ORDER.indexOf(season);
  return SEASON_ORDER[(idx + SEASON_ORDER.length - 1) % SEASON_ORDER.length];
}

// Prüft ob eine Pflanzung aus der Vorsaison in die aktuelle Saison hineinwächst
export function isCarryover(plant: Plant, currentSeason: SeasonId): boolean {
  const prev = prevSeason(currentSeason);
  return plant.seasons.includes(prev) && plant.seasons.includes(currentSeason);
}
```

---

## Viel Spaß beim Coden! 🌾

Jeder Schritt ist einzeln an Copilot übergebbar und hinterlässt eine funktionsfähige App-Version. Pflanzbilder liegen unter `/public/plants/<imageFile>` und werden als vorhanden vorausgesetzt.
