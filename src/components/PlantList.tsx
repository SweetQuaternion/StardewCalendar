import "./PlantList.css";

import { PLANTS } from "../data/plants";
import type { SeasonId } from "../data/types";
import { PlantCard } from "./PlantCard";

interface PlantListProps {
  selectedSeason: SeasonId;
}

export function PlantList({ selectedSeason }: PlantListProps) {
  const seasonPlants = PLANTS.filter((plant) => plant.seasons.includes(selectedSeason));

  return (
    <section className="plant-list">
      <h2 className="plant-list-title">Verfügbare Pflanzen</h2>
      <div className="plant-list-scroll">
        {seasonPlants.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </div>
    </section>
  );
}
