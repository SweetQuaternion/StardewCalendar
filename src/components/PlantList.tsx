import "./PlantList.css";

import { PLANTS } from "../data/plants";
import type { SeasonId } from "../data/types";
import { PlantCard } from "./PlantCard";
import { useI18n } from "../contexts/I18nContext";

interface PlantListProps {
  selectedSeason: SeasonId;
  onPlantDragStart?: (plantId: string) => void;
  onPlantDragEnd?: () => void;
  agriculturist?: boolean;
  tiller?: boolean;
}

export function PlantList({
  selectedSeason,
  onPlantDragStart,
  onPlantDragEnd,
  agriculturist = false,
  tiller = false,
}: PlantListProps) {
  const { t } = useI18n();
  const seasonPlants = PLANTS.filter((plant) => plant.seasons.includes(selectedSeason));

  return (
    <section className="plant-list">
      <h2 className="plant-list-title">{t("plantList.title")}</h2>
      <div className="plant-list-scroll">
        {seasonPlants.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            onDragStart={onPlantDragStart}
            onDragEnd={onPlantDragEnd}
            agriculturist={agriculturist}
            tiller={tiller}
          />
        ))}
      </div>
    </section>
  );
}
