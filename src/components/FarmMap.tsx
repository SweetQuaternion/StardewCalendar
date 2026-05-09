import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Bed, Plant, SeasonId } from "../data/types";
import { bedsOverlap, isCarryover, prevSeason } from "../utils/calculations";
import "./FarmMap.css";

interface Props {
  beds: Bed[];
  onBedCreate: (x: number, y: number, width: number, height: number) => void;
  onBedSelect: (bedId: string | null) => void;
  onBedRename: (bedId: string) => void;
  onBedDelete: (bedId: string) => void;
  selectedBedId: string | null;
  hoveredBedId?: string | null;
  currentSeason: SeasonId;
  bedsFromPrevSeason: Bed[];
  plants: Plant[];
}

const CELL_SIZE = 2; // em

export default function FarmMap({
  beds,
  onBedCreate,
  onBedSelect,
  onBedRename,
  onBedDelete,
  selectedBedId,
  hoveredBedId,
  currentSeason,
  bedsFromPrevSeason,
  plants,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [preview, setPreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    collision: boolean;
  } | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    bedId: string;
  } | null>(null);

  const getCellSizePx = () => {
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    return CELL_SIZE * rootFontSize;
  };

  /**
   * Prüfe ob ein Beet ein Carry-over aus der Vorsaison ist
   */
  const getCarryoverInfo = (bedId: string): { plant: Plant; prevSeasonLabel: string } | null => {
    const prevBed = bedsFromPrevSeason.find((b) => b.id === bedId);
    if (!prevBed || prevBed.plantings.length === 0) return null;

    const lastPlanting = prevBed.plantings[prevBed.plantings.length - 1];
    const plant = plants.find((p) => p.id === lastPlanting.plantId);
    if (!plant) return null;

    if (isCarryover(plant, currentSeason)) {
      const prevSeas = prevSeason(currentSeason);
      const seasonLabel = {
        spring: "Frühling",
        summer: "Sommer",
        fall: "Herbst",
        winter: "Winter",
      }[prevSeas];
      return { plant, prevSeasonLabel: seasonLabel };
    }

    return null;
  };

  const getGridBounds = () => {
    if (!gridRef.current) {
      return { cols: 1, rows: 1 };
    }
    const rect = gridRef.current.getBoundingClientRect();
    const cellPx = getCellSizePx();
    return {
      cols: Math.max(1, Math.floor(rect.width / cellPx)),
      rows: Math.max(1, Math.floor(rect.height / cellPx)),
    };
  };

  /**
   * Pixel zu Grid-Koordinaten (in Kästchen)
   */
  const pixelToGrid = (px: number) => {
    return Math.floor(px / getCellSizePx());
  };

  /**
   * Grid zu Pixel-Koordinaten
   */
  const gridToPixel = (cells: number) => {
    return cells * getCellSizePx();
  };

  /**
   * Prüfe Kollision mit bestehenden Beeten
   */
  const hasCollision = (x: number, y: number, width: number, height: number): boolean => {
    return beds.some(
      (bed) =>
        bedsOverlap(
          { x, y, width, height },
          { x: bed.x, y: bed.y, width: bed.width, height: bed.height },
        ) &&
        (selectedBedId === null || bed.id !== selectedBedId),
    );
  };

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // nur Linkklick
    if (!gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const { cols, rows } = getGridBounds();
    const x = Math.max(0, Math.min(cols - 1, pixelToGrid(e.clientX - rect.left)));
    const y = Math.max(0, Math.min(rows - 1, pixelToGrid(e.clientY - rect.top)));

    // Prüfe ob auf existierendem Beet geklickt wurde
    const clickedBed = beds.find(
      (bed) =>
        e.clientX - rect.left >= gridToPixel(bed.x) &&
        e.clientX - rect.left < gridToPixel(bed.x + bed.width) &&
        e.clientY - rect.top >= gridToPixel(bed.y) &&
        e.clientY - rect.top < gridToPixel(bed.y + bed.height),
    );

    if (clickedBed) {
      onBedSelect(clickedBed.id);
      return;
    }

    onBedSelect(null);

    setDragging(true);
    setStartX(x);
    setStartY(y);
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragging || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const { cols, rows } = getGridBounds();
    const x = Math.max(0, Math.min(cols - 1, pixelToGrid(e.clientX - rect.left)));
    const y = Math.max(0, Math.min(rows - 1, pixelToGrid(e.clientY - rect.top)));

    const left = Math.min(startX, x);
    const top = Math.min(startY, y);
    const width = Math.abs(x - startX) + 1;
    const height = Math.abs(y - startY) + 1;

    // Prüfe Grenzen
    const validWidth = Math.min(width, cols - left);
    const validHeight = Math.min(height, rows - top);

    const collision = hasCollision(left, top, validWidth, validHeight);

    setPreview({
      x: left,
      y: top,
      width: validWidth,
      height: validHeight,
      collision,
    });
  };

  const handleMouseUp = () => {
    if (
      !dragging ||
      !preview ||
      preview.collision ||
      (preview.width === 0 && preview.height === 0)
    ) {
      setDragging(false);
      setPreview(null);
      return;
    }

    onBedCreate(preview.x, preview.y, preview.width, preview.height);
    setDragging(false);
    setPreview(null);
  };

  const handleRightClick = (e: ReactMouseEvent<HTMLDivElement>, bedId: string) => {
    e.preventDefault();
    onBedSelect(bedId);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      bedId,
    });
  };

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  return (
    <div className="farm-map-container" ref={containerRef}>
      <div
        className="farm-grid"
        ref={gridRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Preview-Rechteck beim Drag */}
        {preview && (
          <div
            className={`farm-bed-preview ${preview.collision ? "collision" : ""}`}
            style={{
              left: `${gridToPixel(preview.x)}px`,
              top: `${gridToPixel(preview.y)}px`,
              width: `${gridToPixel(preview.width)}px`,
              height: `${gridToPixel(preview.height)}px`,
            }}
          />
        )}

        {/* Beete */}
        {beds.map((bed) => {
          const carryoverInfo = getCarryoverInfo(bed.id);
          const bedPlants = bed.plantings
            .map((planting) => plants.find((plant) => plant.id === planting.plantId))
            .filter((plant): plant is Plant => Boolean(plant));
          const rawDisplayPlants = carryoverInfo ? [carryoverInfo.plant] : bedPlants;
          const seenPlantIds = new Set<string>();
          const displayPlants = rawDisplayPlants.filter((plant) => {
            if (seenPlantIds.has(plant.id)) return false;
            seenPlantIds.add(plant.id);
            return true;
          });
          const tooltipText = carryoverInfo
            ? `🌽 ${carryoverInfo.plant.name} wächst noch (aus ${carryoverInfo.prevSeasonLabel})`
            : displayPlants.length > 0
              ? `${bed.name} · ${displayPlants.map((plant) => plant.name).join(", ")}`
              : bed.name;

          return (
            <div
              key={bed.id}
              className={`farm-bed ${selectedBedId === bed.id ? "selected" : ""} ${carryoverInfo ? "carryover" : ""} ${hoveredBedId === bed.id ? "hovered" : ""}`}
              style={{
                left: `${gridToPixel(bed.x)}px`,
                top: `${gridToPixel(bed.y)}px`,
                width: `${gridToPixel(bed.width)}px`,
                height: `${gridToPixel(bed.height)}px`,
              }}
              onClick={() => onBedSelect(bed.id)}
              onContextMenu={(e) => {
                if (!carryoverInfo) {
                  handleRightClick(e, bed.id);
                }
              }}
              title={tooltipText}
            >
              <span className="farm-bed-name">{bed.name}</span>
              {displayPlants.length > 0 && (
                <div className="farm-bed-plant-icons" aria-hidden="true">
                  {displayPlants.map((plant) => (
                    <img
                      key={plant.id}
                      className="farm-bed-plant-icon"
                      src={`/plants/${plant.imageFile}`}
                      alt=""
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Leerer Zustand */}
        {beds.length === 0 && !dragging && (
          <div className="farm-empty-state">Klicke und ziehe, um dein erstes Beet anzulegen 🌱</div>
        )}
      </div>

      {/* Kontextmenü */}
      {contextMenu && (
        <div
          className="farm-context-menu"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            className="farm-context-item"
            onClick={() => {
              onBedRename(contextMenu.bedId);
              setContextMenu(null);
            }}
          >
            ✏️ Umbenennen
          </button>
          <button
            className="farm-context-item farm-context-delete"
            onClick={() => {
              onBedDelete(contextMenu.bedId);
              setContextMenu(null);
            }}
          >
            🗑️ Löschen
          </button>
        </div>
      )}
    </div>
  );
}
