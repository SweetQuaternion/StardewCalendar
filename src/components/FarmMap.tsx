import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Bed, FertilizerType, Plant, SeasonId } from "../data/types";
import { FERTILIZERS, QUALITY_FERTILIZERS, RETAINING_FERTILIZERS } from "../data/fertilizers";
import { bedsOverlap, isCarryover, prevSeason } from "../utils/calculations";
import { useI18n } from "../contexts/I18nContext";
import "./FarmMap.css";

interface Props {
  beds: Bed[];
  onBedCreate: (x: number, y: number, width: number, height: number) => void;
  onBedSelect: (bedId: string | null) => void;
  onBedRename: (bedId: string) => void;
  onBedDelete: (bedId: string) => void;
  onSprinklerDrop: (bedId: string) => void;
  onSprinklerChange: (bedId: string, delta: number) => void;
  onFertilizerDrop: (bedId: string, fertilizer: FertilizerType) => void;
  onPlantDropToBed?: (bedId: string, plantId: string) => void;
  selectedBedId: string | null;
  hoveredBedId?: string | null;
  currentSeason: SeasonId;
  bedsFromPrevSeason: Bed[];
  plants: Plant[];
  agriculturist: boolean;
  onAgriculturistChange: (value: boolean) => void;
  tiller: boolean;
  onTillerChange: (value: boolean) => void;
  farmingLevel: number;
  onFarmingLevelChange: (value: number) => void;
}

const CELL_SIZE = 2; // em

export default function FarmMap({
  beds,
  onBedCreate,
  onBedSelect,
  onBedRename,
  onBedDelete,
  onSprinklerDrop,
  onSprinklerChange,
  onFertilizerDrop,
  selectedBedId,
  hoveredBedId,
  currentSeason,
  bedsFromPrevSeason,
  plants,
  agriculturist,
  onAgriculturistChange,
  tiller,
  onTillerChange,
  onPlantDropToBed,
  farmingLevel,
  onFarmingLevelChange,
}: Props) {
  const { t } = useI18n();
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
  const [previewTooltipPos, setPreviewTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    bedId: string;
  } | null>(null);
  const [sprinklerDropBedId, setSprinklerDropBedId] = useState<string | null>(null);
  const [fertilizerDropBedId, setFertilizerDropBedId] = useState<string | null>(null);
  const [plantDropBedId, setPlantDropBedId] = useState<string | null>(null);
  const [sprinklerMenu, setSprinklerMenu] = useState<{
    x: number;
    y: number;
    bedId: string;
    value: number;
  } | null>(null);
  const sprinklerMenuRef = useRef<HTMLDivElement | null>(null);

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
        spring: t("season.spring"),
        summer: t("season.summer"),
        fall: t("season.fall"),
        winter: t("season.winter"),
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
    setPreviewTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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
    setPreviewTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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
      setPreviewTooltipPos(null);
      return;
    }

    onBedCreate(preview.x, preview.y, preview.width, preview.height);
    setDragging(false);
    setPreview(null);
    setPreviewTooltipPos(null);
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

  useEffect(() => {
    if (!sprinklerMenu) return;

    const handleClickOutside = () => setSprinklerMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [sprinklerMenu]);

  useEffect(() => {
    if (sprinklerMenuRef.current) {
      sprinklerMenuRef.current.focus();
    }
  }, [sprinklerMenu]);

  const handleSprinklerDragStart = (e: React.DragEvent<HTMLImageElement>) => {
    e.dataTransfer.setData("application/x-sdv-sprinkler", "sprinkler");
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleFertilizerDragStart = (
    fertilizer: FertilizerType,
    e: React.DragEvent<HTMLImageElement>,
  ) => {
    e.dataTransfer.setData("application/x-sdv-fertilizer", JSON.stringify(fertilizer));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleBedDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const types = Array.from(e.dataTransfer.types || []);
    const isSprinkler = types.includes("application/x-sdv-sprinkler");
    const isFertilizer = types.includes("application/x-sdv-fertilizer");
    const isPlant = types.includes("plantId") || types.includes("text/plain");

    if (isSprinkler || isFertilizer || isPlant) {
      e.preventDefault();
      e.dataTransfer.dropEffect = isPlant ? "copy" : "copy";
    }
  };

  const handleBedDragEnter = (bedId: string, e: React.DragEvent<HTMLDivElement>) => {
    const types = Array.from(e.dataTransfer.types || []);
    const isSprinkler = types.includes("application/x-sdv-sprinkler");
    const isFertilizer = types.includes("application/x-sdv-fertilizer");
    const isPlant = types.includes("plantId") || types.includes("text/plain");

    if (isSprinkler) {
      e.preventDefault();
      setSprinklerDropBedId(bedId);
    } else if (isFertilizer) {
      e.preventDefault();
      setFertilizerDropBedId(bedId);
    } else if (isPlant) {
      e.preventDefault();
      setPlantDropBedId(bedId);
    }
  };

  const handleBedDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setSprinklerDropBedId(null);
      setFertilizerDropBedId(null);
      setPlantDropBedId(null);
    }
  };

  const handleBedDrop = (bedId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setSprinklerDropBedId(null);
    setFertilizerDropBedId(null);

    if (e.dataTransfer.types.includes("application/x-sdv-sprinkler")) {
      onSprinklerDrop(bedId);
      return;
    }

    // Plant drop (from PlantList)
    const plantIdDirect = e.dataTransfer.getData("plantId");
    const textPlain = e.dataTransfer.getData("text/plain") || "";
    const plantIdFromText = textPlain.startsWith("plant:") ? textPlain.slice("plant:".length) : "";
    const plantId = plantIdDirect || plantIdFromText;
    if (plantId) {
      // select the bed so the calendar shows the updated plantings
      onBedSelect(bedId);
      onPlantDropToBed?.(bedId, plantId);
      return;
    }

    if (e.dataTransfer.types.includes("application/x-sdv-fertilizer")) {
      const fertilizerJson = e.dataTransfer.getData("application/x-sdv-fertilizer");
      try {
        const fertilizer = JSON.parse(fertilizerJson) as FertilizerType;
        onFertilizerDrop(bedId, fertilizer);
      } catch {
        // ignore parse error
      }
    }
  };

  const openSprinklerMenu = (bedId: string, value: number, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(null);
    setSprinklerMenu({
      bedId,
      value,
      x: e.clientX,
      y: e.clientY,
    });
  };

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
          <>
            <div
              className={`farm-bed-preview ${preview.collision ? "collision" : ""}`}
              style={{
                left: `${gridToPixel(preview.x)}px`,
                top: `${gridToPixel(preview.y)}px`,
                width: `${gridToPixel(preview.width)}px`,
                height: `${gridToPixel(preview.height)}px`,
              }}
            />
            {previewTooltipPos && (
              <div
                className="farm-bed-size-tooltip"
                style={{
                  left: `${previewTooltipPos.x + 12}px`,
                  top: `${previewTooltipPos.y + 12}px`,
                }}
              >
                {preview.width} × {preview.height}
              </div>
            )}
          </>
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
            ? `🌽 ${t(`plant.name.${carryoverInfo.plant.id}`)} ${t("calendar.growsFrom")} ${carryoverInfo.prevSeasonLabel})`
            : displayPlants.length > 0
              ? `${bed.name} · ${displayPlants.map((plant) => t(`plant.name.${plant.id}`)).join(", ")}`
              : bed.name;

          return (
            <div
              key={bed.id}
              className={`farm-bed ${selectedBedId === bed.id ? "selected" : ""} ${carryoverInfo ? "carryover" : ""} ${hoveredBedId === bed.id ? "hovered" : ""} ${sprinklerDropBedId === bed.id ? "sprinkler-drop-target" : ""} ${fertilizerDropBedId === bed.id ? "fertilizer-drop-target" : ""} ${plantDropBedId === bed.id ? "plant-drop-target" : ""}`}
              style={{
                left: `${gridToPixel(bed.x)}px`,
                top: `${gridToPixel(bed.y)}px`,
                width: `${gridToPixel(bed.width)}px`,
                height: `${gridToPixel(bed.height)}px`,
              }}
              onClick={() => onBedSelect(bed.id)}
              onDragOver={handleBedDragOver}
              onDragEnter={(e) => handleBedDragEnter(bed.id, e)}
              onDragLeave={handleBedDragLeave}
              onDrop={(e) => handleBedDrop(bed.id, e)}
              onContextMenu={(e) => {
                if (!carryoverInfo) {
                  handleRightClick(e, bed.id);
                }
              }}
              title={tooltipText}
            >
              <span className="farm-bed-name">{bed.name}</span>
              {bed.sprinklers > 0 && (
                <div
                  className="farm-bed-sprinkler-count"
                  title={`${bed.sprinklers} Sprinkler`}
                  onClick={(e) => openSprinklerMenu(bed.id, bed.sprinklers, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <span className="farm-bed-sprinkler-number">{bed.sprinklers}</span>
                  <img
                    className="farm-bed-sprinkler-icon"
                    src="/Quality_Sprinkler.png"
                    alt=""
                    aria-hidden="true"
                  />
                </div>
              )}
              {bed.fertilizer.type !== "none" && (
                <div
                  className="farm-bed-fertilizer-badge"
                  title="Klick zum Entfernen"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFertilizerDrop(bed.id, { category: bed.fertilizer.category, type: "none" });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <img
                    className="farm-bed-fertilizer-icon"
                    src={
                      bed.fertilizer.category === "speed"
                        ? bed.fertilizer.type === "speed_gro"
                          ? "/fertilizers/Speed-Gro.png"
                          : bed.fertilizer.type === "deluxe_speed_gro"
                            ? "/fertilizers/Deluxe_Speed-Gro.png"
                            : "/fertilizers/Hyper_Speed-Gro.png"
                        : bed.fertilizer.category === "quality"
                          ? bed.fertilizer.type === "basic"
                            ? "/fertilizers/Basic_Fertilizer.png"
                            : bed.fertilizer.type === "quality"
                              ? "/fertilizers/Quality_Fertilizer.png"
                              : "/fertilizers/Deluxe_Fertilizer.png"
                          : bed.fertilizer.type === "basic"
                            ? "/fertilizers/Basic_Retaining_Soil.png"
                            : bed.fertilizer.type === "quality"
                              ? "/fertilizers/Quality_Retaining_Soil.png"
                              : "/fertilizers/Deluxe_Retaining_Soil.png"
                    }
                    alt=""
                    aria-hidden="true"
                  />
                </div>
              )}
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

        <div className="farm-tool-palette" onMouseDown={(e) => e.stopPropagation()}>
          <div className="farm-farming-level-control">
            <label htmlFor="farming-level-input" className="farm-farming-level-label">
              <span className="farm-farming-level-label-icon">🚜</span>
              <span className="farm-farming-level-label-text">{t("farmMap.level")}</span>
            </label>
            <button
              className="farm-farming-level-button farm-farming-level-button-minus"
              onClick={() => onFarmingLevelChange(Math.max(0, farmingLevel - 1))}
              disabled={farmingLevel <= 0}
              title={t("farmMap.decreaseLevel")}
            >
              ‹
            </button>
            <input
              id="farming-level-input"
              type="number"
              min="0"
              value={farmingLevel}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!Number.isNaN(val) && val >= 0) {
                  onFarmingLevelChange(val);
                }
              }}
              className="farm-farming-level-input"
              title={t("farmMap.farmingLevel")}
            />
            <button
              className="farm-farming-level-button farm-farming-level-button-plus"
              onClick={() => onFarmingLevelChange(farmingLevel + 1)}
              title={t("farmMap.increaseLevel")}
            >
              ›
            </button>
          </div>

          <div className="checkboxes">
            <label className="farm-agriculturist-toggle">
              <input
                type="checkbox"
                checked={tiller}
                onChange={(e) => onTillerChange(e.target.checked)}
              />
              <span>{t("farmMap.tiller")}</span>
            </label>
            <label className="farm-agriculturist-toggle">
              <input
                type="checkbox"
                checked={agriculturist}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onAgriculturistChange(checked);
                  onTillerChange(checked);
                }}
              />
              <span>{t("farmMap.agriculturist")}</span>
            </label>
          </div>

          <div className="farm-tool-row">
            <img
              className="farm-tool-source farm-tool-sprinkler-source"
              src="/Quality_Sprinkler.png"
              alt={t("farmMap.sprinklerLabel")}
              title={`${t("farmMap.sprinklerLabel")} ${t("farmMap.dragTipSuffix")}`}
              draggable={true}
              onDragStart={handleSprinklerDragStart}
            />
            {FERTILIZERS.filter((entry) => entry.id !== "none").map((entry) => (
              <img
                key={entry.id}
                className="farm-tool-source farm-tool-fertilizer-source"
                src={
                  entry.id === "speed_gro"
                    ? "/fertilizers/Speed-Gro.png"
                    : entry.id === "deluxe_speed_gro"
                      ? "/fertilizers/Deluxe_Speed-Gro.png"
                      : "/fertilizers/Hyper_Speed-Gro.png"
                }
                alt={t(`fertilizer.${entry.id}`)}
                title={`${t(`fertilizer.${entry.id}`)} ${t("farmMap.dragTipSuffix")}`}
                draggable={true}
                onDragStart={(e) =>
                  handleFertilizerDragStart({ category: "speed", type: entry.id }, e)
                }
              />
            ))}

            {QUALITY_FERTILIZERS.filter((entry) => entry.id !== "none").map((entry) => (
              <img
                key={`quality-${entry.id}`}
                className="farm-tool-source farm-tool-fertilizer-source"
                src={`/fertilizers/${entry.imageFile}`}
                alt={t(`qualityFertilizer.${entry.id}`)}
                title={`${t(`qualityFertilizer.${entry.id}`)} ${t("farmMap.dragTipSuffix")}`}
                draggable={true}
                onDragStart={(e) =>
                  handleFertilizerDragStart({ category: "quality", type: entry.id }, e)
                }
              />
            ))}

            {RETAINING_FERTILIZERS.filter((entry) => entry.id !== "none").map((entry) => (
              <img
                key={`retaining-${entry.id}`}
                className="farm-tool-source farm-tool-fertilizer-source"
                src={`/fertilizers/${entry.imageFile}`}
                alt={t(`retainingFertilizer.${entry.id}`)}
                title={`${t(`retainingFertilizer.${entry.id}`)} ${t("farmMap.dragTipSuffix")}`}
                draggable={true}
                onDragStart={(e) =>
                  handleFertilizerDragStart({ category: "retaining", type: entry.id }, e)
                }
              />
            ))}
          </div>
        </div>
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

      {sprinklerMenu && (
        <div
          ref={sprinklerMenuRef}
          className="farm-context-menu farm-sprinkler-menu"
          style={{
            left: `${sprinklerMenu.x}px`,
            top: `${sprinklerMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          tabIndex={0}
          onKeyDown={(e) => {
            if (!sprinklerMenu) return;
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              onSprinklerChange(sprinklerMenu.bedId, -1);
              setSprinklerMenu((s) => (s ? { ...s, value: Math.max(0, s.value - 1) } : s));
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              onSprinklerChange(sprinklerMenu.bedId, 1);
              setSprinklerMenu((s) => (s ? { ...s, value: s.value + 1 } : s));
            } else if (e.key === "Escape") {
              setSprinklerMenu(null);
            }
          }}
        >
          <div className="farm-sprinkler-menu-row">
            <span className="farm-sprinkler-menu-label">Sprinkler</span>
            <span className="farm-sprinkler-menu-value">{sprinklerMenu.value}</span>
          </div>
          <div className="farm-sprinkler-menu-actions">
            <button
              className="farm-context-item farm-sprinkler-arrow"
              onClick={() => {
                onSprinklerChange(sprinklerMenu.bedId, -1);
                setSprinklerMenu((s) => (s ? { ...s, value: Math.max(0, s.value - 1) } : s));
              }}
              disabled={sprinklerMenu.value <= 0}
            >
              ←
            </button>
            <button
              className="farm-context-item farm-sprinkler-arrow"
              onClick={() => {
                onSprinklerChange(sprinklerMenu.bedId, 1);
                setSprinklerMenu((s) => (s ? { ...s, value: s.value + 1 } : s));
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
