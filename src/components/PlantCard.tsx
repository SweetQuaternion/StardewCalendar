import "./PlantCard.css";

import type { DragEvent } from "react";
import { useI18n } from "../contexts/I18nContext";
import { calcGrowDays } from "../utils/calculations";
import { NO_FERTILIZER } from "../data/types";

import type { Plant } from "../data/types";

interface PlantCardProps {
  plant: Plant;
  onDragStart?: (plantId: string) => void;
  onDragEnd?: () => void;
  agriculturist?: boolean;
  tiller?: boolean;
}

export function PlantCard({
  plant,
  onDragStart,
  onDragEnd,
  agriculturist = false,
  tiller = false,
}: PlantCardProps) {
  const { t } = useI18n();
  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    onDragStart?.(plant.id);
    event.dataTransfer.setData("plantId", plant.id);
    event.dataTransfer.setData("text/plain", `plant:${plant.id}`);
    event.dataTransfer.effectAllowed = "copy";
  };

  const displayGrowDays = calcGrowDays(plant, NO_FERTILIZER, agriculturist);
  const displayPrice = Math.round(plant.sellPrice * (tiller ? 1.1 : 1));

  return (
    <div
      className={`plant-card plant-color-${plant.id}`}
      style={{ borderLeft: `0.25em solid ${plant.color}` }}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <img
        className="plant-card-image"
        src={`/plants/${plant.imageFile}`}
        alt={t(`plant.name.${plant.id}`)}
      />

      <div className="plant-card-content">
        <span className="plant-card-name">{t(`plant.name.${plant.id}`)}</span>

        <div className="plant-card-meta-row">
          <span className="plant-card-growth">
            🌱 {displayGrowDays} {t("plant.days")}
            {plant.regrowDays
              ? ` · ${t("plant.regrow")} ${t("plant.every")} ${plant.regrowDays} ${t("plant.days")}`
              : ""}
          </span>
          <span className="plant-card-price">
            {t("plant.price")} {displayPrice} G
          </span>
        </div>
      </div>
    </div>
  );
}
