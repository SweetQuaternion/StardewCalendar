import { useState } from "react";

import { PlantList } from "./components/PlantList.tsx";
import { SeasonSelector } from "./components/SeasonSelector.tsx";
import FarmMap from "./components/FarmMap";
import BedDialog from "./components/BedDialog.tsx";
import useLocalStorage from "./hooks/useLocalStorage.ts";
import type { SeasonId, Bed } from "./data/types.ts";

type DialogMode = "create" | "rename" | "delete" | "action" | "collision";

export default function App() {
  const [selectedSeason, setSelectedSeason] = useState<SeasonId>("spring");
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);

  // Beete pro Saison in localStorage
  const [bedsSpring, setBedsSpring] = useLocalStorage<Bed[]>("sdv-beds-spring", []);
  const [bedsSummer, setBedsSummer] = useLocalStorage<Bed[]>("sdv-beds-summer", []);
  const [bedsFall, setBedsFall] = useLocalStorage<Bed[]>("sdv-beds-fall", []);
  const [bedsWinter, setBedsWinter] = useLocalStorage<Bed[]>("sdv-beds-winter", []);

  // Dialog-State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [dialogInitialName, setDialogInitialName] = useState("");
  const [pendingBedData, setPendingBedData] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  /**
   * Hole Beete für aktuelle Saison
   */
  const getCurrentSeasonBeds = (): Bed[] => {
    switch (selectedSeason) {
      case "spring":
        return bedsSpring;
      case "summer":
        return bedsSummer;
      case "fall":
        return bedsFall;
      case "winter":
        return bedsWinter;
      default:
        return [];
    }
  };

  /**
   * Setze Beete für aktuelle Saison
   */
  const setCurrentSeasonBeds = (beds: Bed[]) => {
    switch (selectedSeason) {
      case "spring":
        setBedsSpring(beds);
        break;
      case "summer":
        setBedsSummer(beds);
        break;
      case "fall":
        setBedsFall(beds);
        break;
      case "winter":
        setBedsWinter(beds);
        break;
    }
  };

  const currentBeds = getCurrentSeasonBeds();

  /**
   * Neues Beet anlegen
   */
  const handleBedCreate = (x: number, y: number, width: number, height: number) => {
    setPendingBedData({ x, y, width, height });
    setDialogMode("create");
    setDialogInitialName("");
    setDialogOpen(true);
  };

  /**
   * Dialog speichern - neues Beet anlegen
   */
  const handleDialogSave = (name: string) => {
    if (dialogMode === "create" && pendingBedData) {
      const newBed: Bed = {
        id: crypto.randomUUID(),
        name,
        x: pendingBedData.x,
        y: pendingBedData.y,
        width: pendingBedData.width,
        height: pendingBedData.height,
        planting: null,
      };
      setCurrentSeasonBeds([...currentBeds, newBed]);
      setPendingBedData(null);
      setDialogOpen(false);
      setSelectedBedId(newBed.id);
    } else if (dialogMode === "rename" && selectedBedId) {
      const updated = currentBeds.map((bed) => (bed.id === selectedBedId ? { ...bed, name } : bed));
      setCurrentSeasonBeds(updated);
      setDialogOpen(false);
    }
  };

  /**
   * Dialog abbrechen
   */
  const handleDialogCancel = () => {
    setDialogOpen(false);
    setPendingBedData(null);
    setSelectedBedId(null);
  };

  /**
   * Beet umbenennen
   */
  const handleBedRename = (bedId: string) => {
    const bed = currentBeds.find((b) => b.id === bedId);
    if (!bed) return;
    setSelectedBedId(bedId);
    setDialogMode("rename");
    setDialogInitialName(bed.name);
    setDialogOpen(true);
  };

  /**
   * Beet löschen (mit Bestätigung)
   */
  const handleBedDelete = (bedId: string) => {
    setSelectedBedId(bedId);
    setDialogMode("delete");
    setDialogOpen(true);
  };

  /**
   * Bestätigung löschen
   */
  const handleDialogDelete = () => {
    if (selectedBedId) {
      const updated = currentBeds.filter((b) => b.id !== selectedBedId);
      setCurrentSeasonBeds(updated);
      setSelectedBedId(null);
      setDialogOpen(false);
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title">🌾 Stardew Farm Planner</div>
        <div className="header-actions placeholder">Export · Import (später)</div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <SeasonSelector selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} />
          <PlantList selectedSeason={selectedSeason} />
        </aside>

        <main className="main-area">
          <section className="bed-panel">
            <div className="placeholder bed-calendar-placeholder">Beet-Kalender (placeholder)</div>
            <div className="placeholder bed-info-placeholder">Beet-Info (placeholder)</div>
          </section>
          <section className="map-area">
            <FarmMap
              beds={currentBeds}
              onBedCreate={handleBedCreate}
              onBedSelect={setSelectedBedId}
              onBedRename={handleBedRename}
              onBedDelete={handleBedDelete}
              selectedBedId={selectedBedId}
            />
          </section>
        </main>

        <aside className="season-panel">
          <div className="placeholder">Saisonübersicht (placeholder)</div>
        </aside>
      </div>

      {/* BedDialog */}
      <BedDialog
        open={dialogOpen}
        mode={dialogMode}
        initialName={dialogInitialName}
        onCancel={handleDialogCancel}
        onSave={handleDialogSave}
        onDelete={handleDialogDelete}
        onRenameRequest={() => {
          setDialogMode("rename");
        }}
        onDeleteRequest={() => {
          setDialogMode("delete");
        }}
      />
    </div>
  );
}
