import type { Bed, Plant, Planting, SeasonId } from "../data/types";
import { calcGrowDays, getHarvestDays, isCarryover, prevSeason } from "../utils/calculations";
import { SEASONS } from "../data/seasons";
import { useState, useEffect } from "react";
import "./BedCalendar.css";

interface Props {
  bed: Bed | null;
  selectedSeason: SeasonId;
  plants: Plant[];
  onPlantingSet: (bedId: string, plantId: string, startDay: number) => void;
  onPlantingRemove: (bedId: string, plantingId: string) => void;
  onPlantingMove: (bedId: string, plantingId: string, startDay: number) => void;
  onDaySelect?: (dayNumber: number) => void;
  draggedPlantId?: string | null;
  bedsFromPrevSeason: Bed[];
  agriculturist: boolean;
}

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const SEASON_ORDER: SeasonId[] = ["spring", "summer", "fall", "winter"];

function getNextSeason(season: SeasonId): SeasonId {
  const index = SEASON_ORDER.indexOf(season);
  return SEASON_ORDER[(index + 1) % SEASON_ORDER.length];
}

export default function BedCalendar({
  bed,
  selectedSeason,
  plants,
  bedsFromPrevSeason,
  onPlantingSet,
  onPlantingRemove,
  onPlantingMove,
  onDaySelect,
  draggedPlantId,
  agriculturist,
}: Props) {
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingPlanting, setPendingPlanting] = useState<{
    plantId: string;
    startDay: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    dayNumber: number;
  } | null>(null);

  type DayStatus = {
    type: "growth" | "harvest" | "regrow";
    plant: Plant;
    planting: Planting;
    fromCarryover?: boolean;
  };

  /**
   * Prüfe, ob das aktuelle Beet durch eine mehrjährige Pflanzung aus der Vorsaison belegt ist
   */
  const getCarryoverPlant = (): {
    plant: Plant;
    planting: Planting;
    fertilizer: Bed["fertilizer"];
    prevSeasonLabel: string;
  } | null => {
    if (!bed) return null;

    const prevSeasonId = prevSeason(selectedSeason);
    const prevSeasonLabel = SEASONS.find((s) => s.id === prevSeasonId)?.label || "unbekannt";
    const prevBed = bedsFromPrevSeason.find((b) => b.id === bed.id);

    if (!prevBed || prevBed.plantings.length === 0) return null;

    // Prüfe das letzte Planting aus der Vorsaison
    const lastPlanting = prevBed.plantings[prevBed.plantings.length - 1];
    const plant = plants.find((p) => p.id === lastPlanting.plantId);
    if (!plant) return null;

    // Prüfe ob die Pflanze in beiden Jahreszeiten wächst
    if (isCarryover(plant, selectedSeason)) {
      return { plant, planting: lastPlanting, fertilizer: prevBed.fertilizer, prevSeasonLabel };
    }

    return null;
  };

  const carryoverInfo = getCarryoverPlant();

  const getHarvestReplantInfo = (
    dayNumber: number,
  ): { oldPlant: Plant; newPlant: Plant } | null => {
    if (!bed) return null;

    const newPlanting = [...bed.plantings]
      .reverse()
      .find((planting) => planting.startDay === dayNumber);
    if (!newPlanting) return null;

    const newPlant = plants.find((plant) => plant.id === newPlanting.plantId);
    if (!newPlant) return null;

    const oldPlanting = bed.plantings.find((planting) => {
      if (planting.id === newPlanting.id) return false;
      const plant = plants.find((entry) => entry.id === planting.plantId);
      if (!plant || plant.regrowDays !== null) return false;
      return getHarvestDays(planting, plant, bed.fertilizer, agriculturist).includes(dayNumber);
    });

    if (!oldPlanting) return null;

    const oldPlant = plants.find((plant) => plant.id === oldPlanting.plantId);
    if (!oldPlant) return null;

    return { oldPlant, newPlant };
  };

  const getDragHarvestPreviewInfo = (
    dayNumber: number,
  ): { oldPlant: Plant; newPlant: Plant } | null => {
    if (!bed || !draggedPlantId) return null;

    const draggedPlant = plants.find((plant) => plant.id === draggedPlantId);
    if (!draggedPlant) return null;

    const dayStatus = getDayStatus(dayNumber);
    if (!dayStatus || dayStatus.type !== "harvest" || dayStatus.plant.regrowDays !== null) {
      return null;
    }

    return { oldPlant: dayStatus.plant, newPlant: draggedPlant };
  };

  const getPlantingStartingOnDay = (dayNumber: number): Planting | null => {
    if (!bed) return null;
    return [...bed.plantings].reverse().find((planting) => planting.startDay === dayNumber) ?? null;
  };

  /**
   * Handle Drop auf Kalender-Tag
   */
  const handleDrop = (dayNumber: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDay(null);

    const draggedPlantingIdDirect = e.dataTransfer.getData("plantingId");
    const draggedTextPlain = e.dataTransfer.getData("text/plain");
    const draggedPlantingIdFromText = draggedTextPlain.startsWith("planting:")
      ? draggedTextPlain.slice("planting:".length)
      : "";
    const draggedPlantingId = draggedPlantingIdDirect || draggedPlantingIdFromText;
    if (draggedPlantingId && bed) {
      const draggedPlanting = bed.plantings.find((planting) => planting.id === draggedPlantingId);
      if (!draggedPlanting) return;
      if (draggedPlanting.startDay === dayNumber) return;

      const draggedPlant = plants.find((plant) => plant.id === draggedPlanting.plantId);
      if (!draggedPlant) return;

      const nextSeason = getNextSeason(selectedSeason);
      const growsIntoNextSeason =
        draggedPlant.seasons.includes(selectedSeason) && draggedPlant.seasons.includes(nextSeason);
      const growDays = calcGrowDays(draggedPlant, bed.fertilizer, agriculturist);

      if (dayNumber + growDays - 1 > 28 && !growsIntoNextSeason) {
        alert(
          `⚠️ Zu spät für diese Saison! ${draggedPlant.name} braucht ${growDays} Tage zum Wachsen.`,
        );
        return;
      }

      if (carryoverInfo) {
        alert(
          "🚫 Dieses Beet ist durch eine mehrjährige Pflanzung belegt und kann nicht umpflanzt werden.",
        );
        return;
      }

      const dayStatus = getDayStatus(dayNumber);
      const canPlantOnHarvestDay =
        dayStatus?.type === "harvest" && dayStatus.plant.regrowDays === null;

      if (dayStatus && dayStatus.planting.id !== draggedPlanting.id && !canPlantOnHarvestDay) {
        alert("🚫 Dieser Tag ist bereits belegt.");
        return;
      }

      onPlantingMove(bed.id, draggedPlanting.id, dayNumber);
      return;
    }

    const plantId = e.dataTransfer.getData("plantId");
    if (!plantId || !bed) return;

    const plant = plants.find((p) => p.id === plantId);
    if (!plant) return;
    const nextSeason = getNextSeason(selectedSeason);

    const dayStatus = getDayStatus(dayNumber);
    const canPlantOnHarvestDay =
      dayStatus?.type === "harvest" && dayStatus.plant.regrowDays === null;

    // Prüfe ob Pflanztag + Wachstum noch in die Saison passt
    const growsIntoNextSeason =
      plant.seasons.includes(selectedSeason) && plant.seasons.includes(nextSeason);
    const growDays = calcGrowDays(plant, bed.fertilizer, agriculturist);
    if (dayNumber + growDays - 1 > 28 && !growsIntoNextSeason) {
      alert(`⚠️ Zu spät für diese Saison! ${plant.name} braucht ${growDays} Tage zum Wachsen.`);
      return;
    }

    // Wenn Carry-over aktiv ist, kann man nicht pflanzen
    if (carryoverInfo) {
      alert(
        "🚫 Dieses Beet ist durch eine mehrjährige Pflanzung belegt und kann nicht umpflanzt werden.",
      );
      return;
    }

    // Prüfe ob dieser Tag bereits belegt ist (von einer anderen Pflanzung)
    if (dayStatus && !canPlantOnHarvestDay) {
      setShowReplaceDialog(true);
      setPendingPlanting({ plantId, startDay: dayNumber });
      return;
    }

    // Sonst: direkt pflanzen
    onPlantingSet(bed.id, plantId, dayNumber);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const isPlantingDrag =
      e.dataTransfer.types.includes("plantingId") || e.dataTransfer.types.includes("text/plain");
    e.dataTransfer.dropEffect = isPlantingDrag ? "move" : "copy";
  };

  const handleDragEnter = (dayNumber: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverDay(dayNumber);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setDragOverDay(null);
    }
  };

  const handlePlantingDragStart = (plantingId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("plantingId", plantingId);
    e.dataTransfer.setData("text/plain", `planting:${plantingId}`);
    e.dataTransfer.effectAllowed = "move";
  };

  const handlePlantingDragEnd = () => {
    setDragOverDay(null);
  };

  const handleRightClick = (dayNumber: number, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dayStatus = getDayStatus(dayNumber);
    if (dayStatus && !dayStatus.fromCarryover) {
      setContextMenu({ x: e.clientX, y: e.clientY, dayNumber });
    }
  };

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  /**
   * Bestimme den Status eines Kalender-Tages (kann mehrere Plantings haben)
   */
  const getCarryoverDayStatus = (dayNumber: number): DayStatus | null => {
    if (!carryoverInfo) return null;

    const { plant, planting, fertilizer } = carryoverInfo;
    const dayAbsolute = dayNumber + 28; // aktueller Saison-Tag als absoluter Tag über 2 Saisons
    const firstHarvestAbsolute = planting.startDay + calcGrowDays(plant, fertilizer, agriculturist);

    // Noch Wachstum aus Vorsaison
    if (dayAbsolute >= planting.startDay && dayAbsolute < firstHarvestAbsolute) {
      return { type: "growth", plant, planting, fromCarryover: true };
    }

    // Kein Regrow: nur ein einzelner Erntetag
    if (!plant.regrowDays) {
      if (dayAbsolute === firstHarvestAbsolute) {
        return { type: "harvest", plant, planting, fromCarryover: true };
      }
      return null;
    }

    // Mit Regrow: nach erster Ernte dauerhaft belegt, Ernte alle regrowDays
    if (dayAbsolute >= firstHarvestAbsolute) {
      const delta = dayAbsolute - firstHarvestAbsolute;
      if (delta % plant.regrowDays === 0) {
        return { type: "harvest", plant, planting, fromCarryover: true };
      }
      return { type: "regrow", plant, planting, fromCarryover: true };
    }

    return null;
  };

  const getCarryoverHarvestDaysCurrentSeason = (): number[] => {
    if (!carryoverInfo) return [];

    const { plant, planting, fertilizer } = carryoverInfo;
    const days: number[] = [];
    const firstHarvestAbsolute = planting.startDay + calcGrowDays(plant, fertilizer, agriculturist);

    if (!plant.regrowDays) {
      if (firstHarvestAbsolute > 28 && firstHarvestAbsolute <= 56) {
        days.push(firstHarvestAbsolute - 28);
      }
      return days;
    }

    for (let harvest = firstHarvestAbsolute; harvest <= 56; harvest += plant.regrowDays) {
      if (harvest > 28) {
        days.push(harvest - 28);
      }
    }

    return days;
  };

  const getDayStatus = (dayNumber: number): DayStatus | null => {
    if (!bed || bed.plantings.length === 0) {
      return getCarryoverDayStatus(dayNumber);
    }

    // Suche die erste Planting die diesen Tag betrifft
    for (const planting of bed.plantings) {
      const plant = plants.find((p) => p.id === planting.plantId);
      if (!plant) continue;

      const startDay = planting.startDay;
      const growDays = calcGrowDays(plant, bed.fertilizer, agriculturist);
      const regrowDays = plant.regrowDays;
      const harvestDays = getHarvestDays(planting, plant, bed.fertilizer, agriculturist);

      // Prüfe ob dieser Tag in der Wachstumsphase ist
      if (dayNumber >= startDay && dayNumber < startDay + growDays) {
        return { type: "growth", plant, planting };
      }

      // Prüfe ob dieser Tag ein Erntetag ist
      if (harvestDays.includes(dayNumber)) {
        return { type: "harvest", plant, planting };
      }

      // Prüfe ob dieser Tag in der Regrow-Phase ist
      if (regrowDays && dayNumber >= startDay + growDays && dayNumber <= 28) {
        return { type: "regrow", plant, planting };
      }
    }

    return getCarryoverDayStatus(dayNumber);
  };

  if (!bed) {
    return (
      <div className="bed-calendar-container">
        <div className="bed-calendar-empty">
          Wähle ein Beet auf der Karte aus, um es hier zu planen. 🌿
        </div>
      </div>
    );
  }

  return (
    <div className="bed-calendar-container">
      <div className="bed-calendar-wrapper">
        {/* Kalender-Header mit Wochentagen */}
        <div className="bed-calendar">
          <div className="bed-calendar-header">
            {WEEKDAY_LABELS.map((day, idx) => (
              <div key={idx} className="bed-calendar-weekday">
                {day}
              </div>
            ))}
          </div>

          {/* Kalender-Grid: 4 Wochen */}
          <div className="bed-calendar-grid">
            {Array.from({ length: 28 }).map((_, dayIdx) => {
              const dayNumber = dayIdx + 1; // 1-28
              const dayStatus = getDayStatus(dayNumber);
              const startingPlanting = getPlantingStartingOnDay(dayNumber);
              const harvestReplantInfo = getHarvestReplantInfo(dayNumber);
              const dragHarvestPreviewInfo =
                dragOverDay === dayNumber ? getDragHarvestPreviewInfo(dayNumber) : null;
              const mixedHarvestInfo = harvestReplantInfo ?? dragHarvestPreviewInfo;
              const harvestDays = bed?.plantings.length
                ? bed.plantings.flatMap((p) => {
                    const plant = plants.find((pl) => pl.id === p.plantId);
                    return plant ? getHarvestDays(p, plant, bed.fertilizer, agriculturist) : [];
                  })
                : [];
              const carryoverHarvestDays = getCarryoverHarvestDaysCurrentSeason();
              const isHarvest =
                harvestDays.includes(dayNumber) || carryoverHarvestDays.includes(dayNumber);
              const tooltipText = dayStatus
                ? `${dayStatus.plant.name}: ${dayStatus.type === "growth" ? "Wachstum" : dayStatus.type === "harvest" ? "Ernte ✂️" : "Nachwuchs"}`
                : `Tag ${dayNumber}`;

              return (
                <div
                  key={dayNumber}
                  className={`bed-calendar-day ${dragOverDay === dayNumber ? "drag-over" : ""} ${dayStatus ? `planted planted-${dayStatus.type}` : ""} ${isHarvest ? "harvest-day" : ""} ${startingPlanting ? "planting-start-day" : ""}`}
                  data-harvest-replant={mixedHarvestInfo ? "true" : undefined}
                  style={
                    mixedHarvestInfo
                      ? ({
                          backgroundColor: mixedHarvestInfo.oldPlant.color,
                          ["--replant-old-color" as never]: mixedHarvestInfo.oldPlant.color,
                          ["--replant-new-color" as never]: mixedHarvestInfo.newPlant.color,
                          ["--replant-overlay-opacity" as never]: harvestReplantInfo
                            ? "0.9"
                            : "0.72",
                          opacity: 0.94,
                        } as React.CSSProperties)
                      : dayStatus
                        ? {
                            backgroundColor: dayStatus.plant.color,
                            opacity:
                              dayStatus.type === "harvest"
                                ? 0.9 // Erntetag
                                : dayStatus.type === "regrow"
                                  ? 0.6 // Nachwuchs
                                  : 0.6, // normales Wachstum
                          }
                        : {}
                  }
                  title={
                    mixedHarvestInfo
                      ? `${mixedHarvestInfo.oldPlant.name} → ${mixedHarvestInfo.newPlant.name}`
                      : tooltipText
                  }
                  onDrop={(e) => handleDrop(dayNumber, e)}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(dayNumber, e)}
                  onDragLeave={handleDragLeave}
                  onClick={() => onDaySelect?.(dayNumber)}
                  onContextMenu={(e) => handleRightClick(dayNumber, e)}
                  draggable={Boolean(startingPlanting && !carryoverInfo)}
                  onDragStart={
                    startingPlanting
                      ? (e) => handlePlantingDragStart(startingPlanting.id, e)
                      : undefined
                  }
                  onDragEnd={startingPlanting ? handlePlantingDragEnd : undefined}
                >
                  <span className="bed-calendar-day-number">{dayNumber}</span>
                  {dayStatus && !isHarvest && dayStatus.plant.imageFile && (
                    <img
                      src={`/plants/${dayStatus.plant.imageFile}`}
                      alt={dayStatus.plant.name}
                      className="bed-calendar-day-faded-plant-icon"
                    />
                  )}
                  {isHarvest && <span className="bed-calendar-harvest-icon">✂️</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Carry-over Overlay */}
        {carryoverInfo && (
          <div className="bed-calendar-overlay">
            <div className="bed-calendar-overlay-badge">
              🌽 {carryoverInfo.plant.name} wächst noch (aus {carryoverInfo.prevSeasonLabel})
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="bed-calendar-context-menu"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
            onClick={() => setContextMenu(null)}
          >
            <button
              className="bed-calendar-context-item bed-calendar-context-delete"
              onClick={() => {
                if (bed) {
                  const dayStatus = getDayStatus(contextMenu.dayNumber);
                  if (dayStatus) {
                    onPlantingRemove(bed.id, dayStatus.planting.id);
                  }
                }
                setContextMenu(null);
              }}
            >
              🗑️ Diese Pflanzung entfernen
            </button>
          </div>
        )}
      </div>

      {/* Bestätigungs-Dialog für Pflanzung ersetzen */}
      {showReplaceDialog && pendingPlanting && (
        <div className="bed-calendar-dialog-overlay" onClick={() => setShowReplaceDialog(false)}>
          <div className="bed-calendar-dialog" onClick={(e) => e.stopPropagation()}>
            <p>Die vorhandene Pflanzung ersetzen?</p>
            <div className="bed-calendar-dialog-buttons">
              <button
                className="bed-calendar-dialog-cancel"
                onClick={() => {
                  setShowReplaceDialog(false);
                  setPendingPlanting(null);
                }}
              >
                Abbrechen
              </button>
              <button
                className="bed-calendar-dialog-confirm"
                onClick={() => {
                  if (bed && pendingPlanting) {
                    onPlantingSet(bed.id, pendingPlanting.plantId, pendingPlanting.startDay);
                  }
                  setShowReplaceDialog(false);
                  setPendingPlanting(null);
                }}
              >
                Ersetzen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
