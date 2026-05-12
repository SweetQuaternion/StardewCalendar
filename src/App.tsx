import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { PlantList } from "./components/PlantList.tsx";
import { SeasonSelector } from "./components/SeasonSelector.tsx";
import FarmMap from "./components/FarmMap";
import BedDialog from "./components/BedDialog.tsx";
import BedCalendar from "./components/BedCalendar.tsx";
import BedInfoPanel from "./components/BedInfoPanel.tsx";
import SeasonSummary from "./components/SeasonSummary.tsx";
import LanguagePicker from "./components/LanguagePicker.tsx";
import useLocalStorage from "./hooks/useLocalStorage.ts";
import { useI18n } from "./contexts/I18nContext.tsx";
import { PLANTS } from "./data/plants.ts";
import { prevSeason, calcGrowDays, isCarryover } from "./utils/calculations.ts";
import {
  buildSfpExportPayload,
  convertSfpToSeasonBeds,
  parseSfpImportPayload,
} from "./utils/sfpImportExport.ts";
import DayNavigator from "./components/DayNavigator";
import type { SeasonId, Bed, FertilizerType } from "./data/types.ts";
import { NO_FERTILIZER as DEFAULT_FERTILIZER } from "./data/types.ts";

type DialogMode = "create" | "rename" | "delete" | "action" | "collision";

export default function App() {
  const { t } = useI18n();
  const [selectedSeason, setSelectedSeason] = useLocalStorage<SeasonId>(
    "sdv-selected-season",
    "spring",
  );
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [currentDay, setCurrentDay] = useLocalStorage<number>("sdv-current-day", 1);
  const [draggedPlantId, setDraggedPlantId] = useState<string | null>(null);
  const [hoveredBedId, setHoveredBedId] = useState<string | null>(null);
  const [agriculturist, setAgriculturist] = useLocalStorage<boolean>("sdv-agriculturist", false);
  const [farmingLevel, setFarmingLevel] = useLocalStorage<number>("sdv-farming-level", 0);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const seasonOrder: SeasonId[] = ["spring", "summer", "fall", "winter"];

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

  const normalizeFertilizer = (fertilizer: unknown): Bed["fertilizer"] => {
    if (!fertilizer || typeof fertilizer !== "object") {
      return DEFAULT_FERTILIZER;
    }

    const candidate = fertilizer as { category?: unknown; type?: unknown };
    if (candidate.category === "speed") {
      if (
        candidate.type === "none" ||
        candidate.type === "speed_gro" ||
        candidate.type === "deluxe_speed_gro" ||
        candidate.type === "hyper_speed_gro"
      ) {
        return { category: "speed", type: candidate.type };
      }
    }

    if (candidate.category === "quality") {
      if (
        candidate.type === "none" ||
        candidate.type === "basic" ||
        candidate.type === "quality" ||
        candidate.type === "deluxe"
      ) {
        return { category: "quality", type: candidate.type };
      }
    }

    if (candidate.category === "retaining") {
      if (
        candidate.type === "none" ||
        candidate.type === "basic" ||
        candidate.type === "quality" ||
        candidate.type === "deluxe"
      ) {
        return { category: "retaining", type: candidate.type };
      }
    }

    return DEFAULT_FERTILIZER;
  };

  /**
   * Normalisiere alte Beete-Struktur zu neuer Struktur
   */
  const normalizeBed = (bed: any): Bed => {
    // Falls noch alte Struktur mit 'planting' statt 'plantings'
    if (!bed.plantings && bed.planting !== undefined) {
      return {
        ...bed,
        sprinklers: typeof bed.sprinklers === "number" ? bed.sprinklers : 0,
        fertilizer: normalizeFertilizer(bed.fertilizer),
        plantings: bed.planting ? [bed.planting] : [],
      };
    }
    // Falls plantings undefined ist (sollte nicht vorkommen, aber sicher ist sicher)
    if (!bed.plantings) {
      return {
        ...bed,
        sprinklers: typeof bed.sprinklers === "number" ? bed.sprinklers : 0,
        fertilizer: normalizeFertilizer(bed.fertilizer),
        plantings: [],
      };
    }
    return {
      ...bed,
      sprinklers: typeof bed.sprinklers === "number" ? bed.sprinklers : 0,
      fertilizer: normalizeFertilizer(bed.fertilizer),
    };
  };

  const stripPlantings = (bed: Bed): Bed => ({
    ...bed,
    plantings: [],
  });

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

  const setBedLayoutsForAllSeasons = (updater: (beds: Bed[]) => Bed[]) => {
    setBedsSpring(updater(bedsSpring.map(normalizeBed)));
    setBedsSummer(updater(bedsSummer.map(normalizeBed)));
    setBedsFall(updater(bedsFall.map(normalizeBed)));
    setBedsWinter(updater(bedsWinter.map(normalizeBed)));
  };

  const incrementSprinklersForBed = (bedId: string) => {
    setBedLayoutsForAllSeasons((beds) =>
      beds.map((bed) =>
        bed.id === bedId
          ? {
              ...bed,
              sprinklers: (bed.sprinklers ?? 0) + 1,
            }
          : bed,
      ),
    );
  };

  const changeSprinklersForBed = (bedId: string, delta: number) => {
    setBedLayoutsForAllSeasons((beds) =>
      beds.map((bed) =>
        bed.id === bedId
          ? {
              ...bed,
              sprinklers: Math.max(0, (bed.sprinklers ?? 0) + delta),
            }
          : bed,
      ),
    );
  };

  const setFertilizerForBed = (bedId: string, fertilizer: FertilizerType) => {
    const updated = currentBeds.map((bed) =>
      bed.id === bedId
        ? {
            ...bed,
            fertilizer,
          }
        : bed,
    );
    setCurrentSeasonBeds(updated);
  };

  /**
   * Pflanzung in Beet setzen
   */
  const handlePlantingSet = (bedId: string, plantId: string, startDay: number) => {
    const updated = currentBeds.map((bed) => {
      if (bed.id === bedId) {
        return {
          ...bed,
          plantings: [
            ...bed.plantings,
            {
              id: crypto.randomUUID(),
              plantId,
              startDay,
            },
          ],
        };
      }
      return bed;
    });
    setCurrentSeasonBeds(updated);
  };

  const getBedLayoutsForSeason = (season: SeasonId): Bed[] => {
    return getBedsForSeason(season).map(normalizeBed).map(stripPlantings);
  };

  const currentBeds = getCurrentSeasonBeds().map(normalizeBed);

  /**
   * Hole Beete für eine bestimmte Saison
   */
  const getBedsForSeason = (season: SeasonId): Bed[] => {
    switch (season) {
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

  const prevSeasonBeds = getBedsForSeason(prevSeason(selectedSeason)).map(normalizeBed);
  const selectedBed = currentBeds.find((b) => b.id === selectedBedId) || null;

  useEffect(() => {
    setSelectedCalendarDay(null);
  }, [selectedBedId]);

  useEffect(() => {
    const currentSeasonBeds = getCurrentSeasonBeds().map(normalizeBed);
    if (currentSeasonBeds.length > 0) return;

    const sourceSeason = seasonOrder.find((season) => getBedsForSeason(season).length > 0);
    if (!sourceSeason) return;

    const sourceLayouts = getBedLayoutsForSeason(sourceSeason);
    if (sourceLayouts.length === 0) return;

    setCurrentSeasonBeds(sourceLayouts);
  }, [selectedSeason, bedsSpring, bedsSummer, bedsFall, bedsWinter]);

  const handleSeasonChange = (season: SeasonId) => {
    setSelectedSeason(season);
    setCurrentDay(1);
  };

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
        sprinklers: 0,
        fertilizer: DEFAULT_FERTILIZER,
        plantings: [],
      };
      setBedLayoutsForAllSeasons((beds) => [...beds, newBed]);
      setPendingBedData(null);
      setDialogOpen(false);
      setSelectedBedId(newBed.id);
    } else if (dialogMode === "rename" && selectedBedId) {
      setBedLayoutsForAllSeasons((beds) =>
        beds.map((bed) => (bed.id === selectedBedId ? { ...bed, name } : bed)),
      );
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
      setBedLayoutsForAllSeasons((beds) => beds.filter((bed) => bed.id !== selectedBedId));
      setSelectedBedId(null);
      setDialogOpen(false);
    }
  };

  /**
   * Plant drop onto a bed: insert at earliest possible start day
   */
  const handlePlantDropToBed = (bedId: string, plantId: string) => {
    const bed = currentBeds.find((b) => b.id === bedId);
    if (!bed) return;

    // Check carryover from prev season
    const prevBed = prevSeasonBeds.find((b) => b.id === bedId);
    if (prevBed && prevBed.plantings.length > 0) {
      const last = prevBed.plantings[prevBed.plantings.length - 1];
      const plantPrev = PLANTS.find((p) => p.id === last.plantId);
      if (plantPrev && isCarryover(plantPrev, selectedSeason)) {
        window.alert(t("alert.carryoverBlocked"));
        return;
      }
    }

    const plant = PLANTS.find((p) => p.id === plantId);
    if (!plant) return;

    // helper: check whether the new plant (with its growDays) can be placed at `day`
    const canPlaceAt = (dayNumber: number): boolean => {
      const newGrow = calcGrowDays(plant, bed.fertilizer, agriculturist);
      const endDay = Math.min(28, dayNumber + newGrow - 1);

      for (let t = dayNumber; t <= endDay; t++) {
        for (const planting of bed.plantings) {
          const pl = PLANTS.find((p) => p.id === planting.plantId);
          if (!pl) continue;
          const epStart = planting.startDay;
          const epGrow = calcGrowDays(pl, bed.fertilizer, agriculturist);
          const epFirstHarvest = epStart + epGrow;

          // growth phase of existing planting
          if (t >= epStart && t < epStart + epGrow) return false;

          // existing planting has regrow -> any harvest/regrow day is occupied
          if (pl.regrowDays) {
            if (t >= epFirstHarvest && (t - epFirstHarvest) % pl.regrowDays === 0) return false;
          } else {
            // single harvest day: occupied unless we're starting exactly on that harvest day
            if (t === epFirstHarvest && t !== dayNumber) return false;
          }
        }
      }
      return true;
    };

    // getNextSeason helper inline
    const SEASON_ORDER: SeasonId[] = ["spring", "summer", "fall", "winter"];
    const getNextSeason = (s: SeasonId) =>
      SEASON_ORDER[(SEASON_ORDER.indexOf(s) + 1) % SEASON_ORDER.length];
    const next = getNextSeason(selectedSeason);

    // Find earliest day 1..28 where planting fits without overlapping existing plantings
    for (let day = 1; day <= 28; day++) {
      const growsIntoNextSeason =
        plant.seasons.includes(selectedSeason) && plant.seasons.includes(next);
      const growDays = calcGrowDays(plant, bed.fertilizer, agriculturist);
      if (day + growDays - 1 > 28 && !growsIntoNextSeason) continue;

      if (!canPlaceAt(day)) continue;

      // found suitable day
      handlePlantingSet(bedId, plantId, day);
      setSelectedBedId(bedId);
      setSelectedCalendarDay(day);
      return;
    }

    window.alert(t("calendar.noFreePlantingDay"));
  };

  /**
   * Eine Pflanzung aus Beet entfernen
   */
  const handlePlantingRemove = (bedId: string, plantingId: string) => {
    const updated = currentBeds.map((bed) => {
      if (bed.id === bedId) {
        return {
          ...bed,
          plantings: bed.plantings.filter((planting) => planting.id !== plantingId),
        };
      }
      return bed;
    });
    setCurrentSeasonBeds(updated);
  };

  /**
   * Starttag einer bestehenden Pflanzung verschieben
   */
  const handlePlantingMove = (bedId: string, plantingId: string, startDay: number) => {
    const updated = currentBeds.map((bed) => {
      if (bed.id === bedId) {
        return {
          ...bed,
          plantings: bed.plantings.map((planting) =>
            planting.id === plantingId ? { ...planting, startDay } : planting,
          ),
        };
      }
      return bed;
    });
    setCurrentSeasonBeds(updated);
  };

  const handleExport = () => {
    const payload = buildSfpExportPayload(
      {
        spring: bedsSpring.map(normalizeBed),
        summer: bedsSummer.map(normalizeBed),
        fall: bedsFall.map(normalizeBed),
        winter: bedsWinter.map(normalizeBed),
      },
      selectedSeason,
      currentDay,
    );

    const fileContent = JSON.stringify(payload, null, 2);
    const blob = new Blob([fileContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "farm-plan.sfp";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const rawText = await file.text();
      const json = JSON.parse(rawText) as unknown;
      const parsed = parseSfpImportPayload(json);

      if (!parsed.ok) {
        window.alert(`${t("alert.importFailed")} ${parsed.error}`);
        return;
      }

      const confirmOverwrite = window.confirm(t("confirm.importOverwrite"));
      if (!confirmOverwrite) return;

      const seasonBeds = convertSfpToSeasonBeds(parsed.value);
      localStorage.setItem("sdv-beds-spring", JSON.stringify(seasonBeds.spring));
      localStorage.setItem("sdv-beds-summer", JSON.stringify(seasonBeds.summer));
      localStorage.setItem("sdv-beds-fall", JSON.stringify(seasonBeds.fall));
      localStorage.setItem("sdv-beds-winter", JSON.stringify(seasonBeds.winter));
      localStorage.setItem("sdv-selected-season", JSON.stringify(parsed.value.data.currentSeason));
      localStorage.setItem("sdv-current-day", JSON.stringify(parsed.value.data.currentDay));

      window.location.reload();
    } catch {
      window.alert(t("alert.importJsonError"));
    } finally {
      input.value = "";
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="flex-row">
          <img className="app-logo" src="/plants/Starfruit.png" alt="App Logo" />
          <div className="app-title">Stardew Farm Planner</div>
        </div>
        <div className="header-actions">
          <LanguagePicker />
          <button className="header-action-button" type="button" onClick={handleExport}>
            💾 {t("header.export")}
          </button>
          <button className="header-action-button" type="button" onClick={handleImportClick}>
            📂 {t("header.import")}
          </button>
          <input
            ref={importInputRef}
            className="header-import-input"
            type="file"
            accept=".sfp,application/json"
            onChange={handleImportFileChange}
          />
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <SeasonSelector selectedSeason={selectedSeason} onSeasonChange={handleSeasonChange} />
          <PlantList
            selectedSeason={selectedSeason}
            onPlantDragStart={setDraggedPlantId}
            onPlantDragEnd={() => setDraggedPlantId(null)}
          />
        </aside>

        <main className="main-area">
          <section className="bed-panel">
            <div className="bed-calendar-pane">
              <BedCalendar
                bed={selectedBed}
                selectedSeason={selectedSeason}
                plants={PLANTS}
                onPlantingSet={handlePlantingSet}
                onPlantingRemove={handlePlantingRemove}
                onPlantingMove={handlePlantingMove}
                onDaySelect={setSelectedCalendarDay}
                draggedPlantId={draggedPlantId}
                bedsFromPrevSeason={prevSeasonBeds}
                agriculturist={agriculturist}
              />
            </div>
            <BedInfoPanel
              bed={selectedBed}
              plants={PLANTS}
              selectedSeason={selectedSeason}
              selectedDay={selectedCalendarDay}
              currentDay={currentDay}
              farmingLevel={farmingLevel}
              agriculturist={agriculturist}
            />
            <aside className="season-overview-panel placeholder">
              <DayNavigator
                currentDay={currentDay}
                selectedSeason={selectedSeason}
                onDayChange={setCurrentDay}
                beds={currentBeds}
                plants={PLANTS}
                bedsFromPrevSeason={prevSeasonBeds}
                agriculturist={agriculturist}
                onTaskHover={(id) => setHoveredBedId(id)}
                onTaskClick={(id) => setSelectedBedId(id)}
              />
            </aside>
          </section>
          <section className="map-area">
            <FarmMap
              beds={currentBeds}
              onBedCreate={handleBedCreate}
              onBedSelect={setSelectedBedId}
              onBedRename={handleBedRename}
              onBedDelete={handleBedDelete}
              onSprinklerDrop={incrementSprinklersForBed}
              onSprinklerChange={changeSprinklersForBed}
              onFertilizerDrop={setFertilizerForBed}
              onPlantDropToBed={handlePlantDropToBed}
              selectedBedId={selectedBedId}
              hoveredBedId={hoveredBedId}
              currentSeason={selectedSeason}
              bedsFromPrevSeason={prevSeasonBeds}
              plants={PLANTS}
              agriculturist={agriculturist}
              onAgriculturistChange={setAgriculturist}
              farmingLevel={farmingLevel}
              onFarmingLevelChange={setFarmingLevel}
            />
          </section>
        </main>

        <aside className="season-panel">
          <SeasonSummary
            beds={currentBeds}
            bedsFromPrevSeason={prevSeasonBeds}
            selectedSeason={selectedSeason}
            plants={PLANTS}
            farmingLevel={farmingLevel}
            agriculturist={agriculturist}
          />
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
