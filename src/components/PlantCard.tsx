import "./PlantCard.css";

import type { DragEvent } from "react";

import type { Plant } from "../data/types";

interface PlantCardProps {
  plant: Plant;
}

export function PlantCard({ plant }: PlantCardProps) {
  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("plantId", plant.id);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      className={`plant-card plant-color-${plant.id}`}
      style={{ borderLeft: `0.25em solid ${plant.color}` }}
      draggable={true}
      onDragStart={handleDragStart}
    >
      <img className="plant-card-image" src={`/plants/${plant.imageFile}`} alt={plant.name} />

      <div className="plant-card-content">
        <span className="plant-card-name">{plant.name}</span>

        <div className="plant-card-meta-row">
          <span className="plant-card-growth">
            🌱 {plant.growDays} Tage{plant.regrowDays ? ` · 🔄 alle ${plant.regrowDays} Tage` : ""}
          </span>
          <span className="plant-card-price">💰 {plant.sellPrice} G</span>
        </div>
      </div>
    </div>
  );
}
