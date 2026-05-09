import type { Bed, Plant } from "../data/types";
import { calcRevenue, getHarvestDays } from "../utils/calculations";
import "./BedInfoPanel.css";

interface BedInfoPanelProps {
  bed: Bed | null;
  plants: Plant[];
  selectedDay: number | null;
  currentDay: number;
}

export default function BedInfoPanel({ bed, plants, selectedDay, currentDay }: BedInfoPanelProps) {
  if (!bed || bed.plantings.length === 0) {
    return (
      <aside className="bed-info-panel bed-info-panel-empty">
        <p>Wähle ein Beet aus, um hier die Pflanzdetails zu sehen. 🌿</p>
      </aside>
    );
  }

  const dayToCheck = selectedDay !== null ? selectedDay : currentDay;

  const planting =
    dayToCheck !== null
      ? (bed.plantings.find((entry) => entry.startDay === dayToCheck) ??
        bed.plantings.find((entry) => {
          const plant = plants.find((candidate) => candidate.id === entry.plantId);
          if (!plant) return false;

          const harvestDays = getHarvestDays(entry, plant);
          const isGrowthPhase =
            dayToCheck >= entry.startDay && dayToCheck < entry.startDay + plant.growDays;
          const isHarvestDay = harvestDays.includes(dayToCheck);
          const isRegrowPhase =
            plant.regrowDays !== null &&
            dayToCheck >= entry.startDay + plant.growDays &&
            dayToCheck <= 28;

          return isGrowthPhase || isHarvestDay || isRegrowPhase;
        }) ??
        bed.plantings[bed.plantings.length - 1])
      : bed.plantings[bed.plantings.length - 1];
  const plant = plants.find((entry) => entry.id === planting.plantId) ?? null;

  if (!plant) {
    return (
      <aside className="bed-info-panel bed-info-panel-empty">
        <p>Zu diesem Beet konnte keine Pflanze gefunden werden.</p>
      </aside>
    );
  }

  const harvestDays = getHarvestDays(planting, plant);
  const harvestCount = harvestDays.length;
  const bedSize = bed.width * bed.height;
  const totalRevenue = calcRevenue(planting, plant) * bedSize;
  const seedCosts = plant.seedPrice * bedSize;
  const totalProfit = totalRevenue - seedCosts;

  return (
    <aside className="bed-info-panel">
      <div className="bed-info-header">
        <img className="bed-info-image" src={`/plants/${plant.imageFile}`} alt={plant.name} />
        <div className="bed-info-header-copy">
          <h3 className="bed-info-title">{plant.name}</h3>
          <p className="bed-info-planting-day">Pflanztag: Tag {planting.startDay}</p>
        </div>
      </div>

      <div className="bed-info-section">
        <h4>Ertrag</h4>
        <p className="bed-info-revenue">
          {harvestCount} Ernten × {plant.yield} Stk. × {plant.sellPrice} G × {bedSize} Kästchen ={" "}
          <strong>{totalRevenue} G</strong>
        </p>
      </div>

      <div className="bed-info-section">
        <h4>Samenkosten</h4>
        <p className="bed-info-costs">
          {plant.seedPrice} G × {bedSize} Kästchen = {seedCosts} G
        </p>
      </div>
      <div className="bed-info-section">
        <h4>Gewinn</h4>
        <p className="bed-info-profit">
          {totalRevenue} − {seedCosts} = <strong>{totalProfit} G</strong>
        </p>
      </div>
    </aside>
  );
}
