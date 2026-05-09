import "./PlantList.css";

import { PLANTS } from "../data/plants";
import type { SeasonId } from "../data/types";
import { PlantCard } from "./PlantCard";

interface PlantListProps {
  selectedSeason: SeasonId;
  onPlantDragStart?: (plantId: string) => void;
  onPlantDragEnd?: () => void;
}

export function PlantList({ selectedSeason, onPlantDragStart, onPlantDragEnd }: PlantListProps) {
  const seasonPlants = PLANTS.filter((plant) => plant.seasons.includes(selectedSeason));

  return (
    <section className="plant-list">
      <h2 className="plant-list-title">Verfügbare Pflanzen</h2>
      <div className="plant-list-scroll">
        {seasonPlants.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            onDragStart={onPlantDragStart}
            onDragEnd={onPlantDragEnd}
          />
        ))}
      </div>
    </section>
  );
}
