import { useEffect, useState } from "react";

import { PlantList } from "./components/PlantList.tsx";
import { SeasonSelector } from "./components/SeasonSelector.tsx";
import FarmMap from "./components/FarmMap";
import BedDialog from "./components/BedDialog.tsx";
import BedCalendar from "./components/BedCalendar.tsx";
import BedInfoPanel from "./components/BedInfoPanel.tsx";
import SeasonSummary from "./components/SeasonSummary.tsx";
import useLocalStorage from "./hooks/useLocalStorage.ts";
import { PLANTS } from "./data/plants.ts";
import { prevSeason } from "./utils/calculations.ts";
import DayNavigator from "./components/DayNavigator";
import type { SeasonId, Bed } from "./data/types.ts";

type DialogMode = "create" | "rename" | "delete" | "action" | "collision";

export default function App() {
  const [selectedSeason, setSelectedSeason] = useLocalStorage<SeasonId>(
    "sdv-selected-season",
    "spring",
  );
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [currentDay, setCurrentDay] = useLocalStorage<number>("sdv-current-day", 1);
  const [draggedPlantId, setDraggedPlantId] = useState<string | null>(null);
  const [hoveredBedId, setHoveredBedId] = useState<string | null>(null);
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

  /**
   * Normalisiere alte Beete-Struktur zu neuer Struktur
   */
  const normalizeBed = (bed: any): Bed => {
    // Falls noch alte Struktur mit 'planting' statt 'plantings'
    if (!bed.plantings && bed.planting !== undefined) {
      return {
        ...bed,
        plantings: bed.planting ? [bed.planting] : [],
      };
    }
    // Falls plantings undefined ist (sollte nicht vorkommen, aber sicher ist sicher)
    if (!bed.plantings) {
      return {
        ...bed,
        plantings: [],
      };
    }
    return bed;
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

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title">🌾 Stardew Farm Planner</div>
        <div className="header-actions placeholder">Export · Import (später)</div>
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
                onDaySelect={setSelectedCalendarDay}
                draggedPlantId={draggedPlantId}
                bedsFromPrevSeason={prevSeasonBeds}
              />
            </div>
            <BedInfoPanel
              bed={selectedBed}
              plants={PLANTS}
              selectedDay={selectedCalendarDay}
              currentDay={currentDay}
            />
            <aside className="season-overview-panel placeholder">
              <DayNavigator
                currentDay={currentDay}
                selectedSeason={selectedSeason}
                onDayChange={setCurrentDay}
                beds={currentBeds}
                plants={PLANTS}
                bedsFromPrevSeason={prevSeasonBeds}
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
              selectedBedId={selectedBedId}
              hoveredBedId={hoveredBedId}
              currentSeason={selectedSeason}
              bedsFromPrevSeason={prevSeasonBeds}
              plants={PLANTS}
            />
          </section>
        </main>

        <aside className="season-panel">
          <SeasonSummary
            beds={currentBeds}
            bedsFromPrevSeason={prevSeasonBeds}
            selectedSeason={selectedSeason}
            plants={PLANTS}
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
