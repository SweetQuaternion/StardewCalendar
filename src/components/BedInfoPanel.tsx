import type { Bed, Plant } from "../data/types";
import { FERTILIZERS } from "../data/fertilizers";
import {
  calcGrowDays,
  calcRevenue,
  getBedEffectiveArea,
  getHarvestDays,
} from "../utils/calculations";
import "./BedInfoPanel.css";

interface BedInfoPanelProps {
  bed: Bed | null;
  plants: Plant[];
  selectedDay: number | null;
  currentDay: number;
  agriculturist: boolean;
}

export default function BedInfoPanel({
  bed,
  plants,
  selectedDay,
  currentDay,
  agriculturist,
}: BedInfoPanelProps) {
  if (!bed) {
    return (
      <aside className="bed-info-panel">
        <div className="bed-info-panel-empty">
          <p>Wähle ein Beet aus, um hier die Pflanzdetails zu sehen. 🌿</p>
        </div>
      </aside>
    );
  }

  const dayToCheck = selectedDay !== null ? selectedDay : currentDay;

  const planting =
    dayToCheck !== null
      ? bed.plantings.find((entry) => {
          const plant = plants.find((candidate) => candidate.id === entry.plantId);
          if (!plant) return false;

          const harvestDays = getHarvestDays(entry, plant, bed.fertilizer, agriculturist);
          const growDays = calcGrowDays(plant, bed.fertilizer, agriculturist);
          const isGrowthPhase =
            dayToCheck >= entry.startDay && dayToCheck < entry.startDay + growDays;
          const isHarvestDay = harvestDays.includes(dayToCheck);
          const isRegrowPhase =
            plant.regrowDays !== null &&
            dayToCheck >= entry.startDay + growDays &&
            dayToCheck <= 28;

          return isGrowthPhase || isHarvestDay || isRegrowPhase;
        })
      : null;

  const plant = planting ? (plants.find((entry) => entry.id === planting.plantId) ?? null) : null;
  const fertilizer = FERTILIZERS.find((entry) => entry.id === bed.fertilizer) ?? null;
  const harvestDays =
    plant && planting ? getHarvestDays(planting, plant, bed.fertilizer, agriculturist) : [];
  const harvestCount = harvestDays.length;
  const bedSize = getBedEffectiveArea(bed);
  const totalRevenue =
    plant && planting ? calcRevenue(planting, plant, bed.fertilizer, agriculturist) * bedSize : 0;
  const seedCosts = plant ? plant.seedPrice * bedSize : 0;
  const totalProfit = totalRevenue - seedCosts;

  return (
    <aside className="bed-info-panel">
      {bed.plantings.length === 0 ? (
        <div className="bed-info-panel-empty">
          <p>
            Dieses Beet ist noch leer. Zieh eine Pflanze hinein, um hier die Details zu sehen. 🌱
          </p>
        </div>
      ) : !planting ? (
        <div className="bed-info-panel-empty">
          <p>In diesem Beet wächst an diesem Tag nichts. Es ist gerade leer. 🌱</p>
        </div>
      ) : !plant ? (
        <div className="bed-info-panel-empty">
          <p>Zu diesem Beet konnte keine Pflanze gefunden werden.</p>
        </div>
      ) : (
        <>
          <div className="bed-info-header">
            <img className="bed-info-image" src={`/plants/${plant.imageFile}`} alt={plant.name} />
            <div className="bed-info-header-copy">
              <h3 className="bed-info-title">{plant.name}</h3>
              <p className="bed-info-fertilizer-meta">
                Pflanztag: Tag {planting.startDay}, Wachstum:{" "}
                {calcGrowDays(plant, bed.fertilizer, agriculturist)} Tage
              </p>
              {fertilizer && fertilizer.id !== "none" && (
                <p className="bed-info-fertilizer-meta">Dünger: {fertilizer.label}</p>
              )}
            </div>
          </div>

          <div className="bed-info-section">
            <h4>Ertrag</h4>
            <p className="bed-info-revenue">
              {harvestCount} Ernten × {plant.yield} Stk. × {plant.sellPrice} G × {bedSize} Kästchen
              = <strong>{totalRevenue} G</strong>
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
        </>
      )}
    </aside>
  );
}
