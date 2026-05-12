import type { Bed, Plant, SeasonId } from "../data/types";
import { QUALITY_FERTILIZER_LEVEL } from "../data/fertilizers";
import {
  calcGrowDays,
  calcExpectedHarvestValue,
  calcExpectedRevenue,
  calcQualityDistribution,
  getBedEffectiveArea,
  getHarvestDays,
} from "../utils/calculations";
import { useI18n } from "../contexts/I18nContext";
import "./BedInfoPanel.css";

interface BedInfoPanelProps {
  bed: Bed | null;
  plants: Plant[];
  selectedSeason: SeasonId;
  selectedDay: number | null;
  currentDay: number;
  farmingLevel: number;
  agriculturist: boolean;
}

export default function BedInfoPanel({
  bed,
  plants,
  selectedSeason,
  selectedDay,
  currentDay,
  farmingLevel,
  agriculturist,
}: BedInfoPanelProps) {
  const { t, language } = useI18n();
  const formatSeasonDay = (day: number) =>
    language === "en"
      ? `${t(`season.${selectedSeason}`)} ${day}`
      : `${day}. ${t(`season.${selectedSeason}`)}`;

  if (!bed) {
    return (
      <aside className="bed-info-panel">
        <div className="bed-info-panel-empty">
          <p>{t("bedInfo.selectBed")}</p>
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
  const fertilizerLabel =
    bed.fertilizer.category === "speed"
      ? t(`fertilizer.${bed.fertilizer.type}`)
      : bed.fertilizer.category === "quality"
        ? t(`qualityFertilizer.${bed.fertilizer.type}`)
        : bed.fertilizer.category === "retaining"
          ? t(`retainingFertilizer.${bed.fertilizer.type}`)
          : "";
  const qualityFertilizerLevel =
    bed.fertilizer.category === "quality" ? QUALITY_FERTILIZER_LEVEL[bed.fertilizer.type] : 0;
  const qualityDistribution = calcQualityDistribution(farmingLevel, qualityFertilizerLevel);
  const harvestDays =
    plant && planting ? getHarvestDays(planting, plant, bed.fertilizer, agriculturist) : [];
  const harvestCount = harvestDays.length;
  const bedSize = getBedEffectiveArea(bed);
  const totalRevenue =
    plant && planting
      ? calcExpectedRevenue(planting, plant, bed.fertilizer, farmingLevel, agriculturist) * bedSize
      : 0;
  const expectedHarvestValue =
    plant && planting ? calcExpectedHarvestValue(plant, bed.fertilizer, farmingLevel) : 0;
  const seedCosts = plant ? plant.seedPrice * bedSize : 0;
  const totalProfit = totalRevenue - seedCosts;

  return (
    <aside className="bed-info-panel">
      {bed.plantings.length === 0 ? (
        <div className="bed-info-panel-empty">
          <p>{t("bedInfo.emptyBed")}</p>
        </div>
      ) : !planting ? (
        <div className="bed-info-panel-empty">
          <p>{t("bedInfo.nothingGrowing")}</p>
        </div>
      ) : !plant ? (
        <div className="bed-info-panel-empty">
          <p>{t("bedInfo.plantNotFound")}</p>
        </div>
      ) : (
        <>
          <div className="bed-info-header">
            <img
              className="bed-info-image"
              src={`/plants/${plant.imageFile}`}
              alt={t(`plant.name.${plant.id}`)}
            />
            <div className="bed-info-header-copy">
              <h3 className="bed-info-title">{t(`plant.name.${plant.id}`)}</h3>
              <p className="bed-info-fertilizer-meta">
                {t("bedInfo.plantingDay")} {formatSeasonDay(planting.startDay)},{" "}
                {t("bedInfo.growth")} {calcGrowDays(plant, bed.fertilizer, agriculturist)}{" "}
                {t("bedInfo.days")}
              </p>
              {bed.fertilizer.type !== "none" && (
                <p className="bed-info-fertilizer-meta">
                  {t("bedInfo.fertilizer")} {fertilizerLabel}
                </p>
              )}
            </div>
          </div>

          <div className="bed-info-section">
            <h4>{t("bedInfo.yield")}</h4>
            <p className="bed-info-revenue">
              {harvestCount != 1 && `${harvestCount} ${t("bedInfo.harvests")} ×`} ∅{" "}
              {Math.round(expectedHarvestValue)} G × {bedSize} {t("general.tiles")} ={" "}
              <strong>{Math.round(totalRevenue)} G</strong>
            </p>
            <p className="bed-info-fertilizer-meta">
              ⭐ {Math.round(qualityDistribution.normal * 100)}% · ⭐⭐{" "}
              {Math.round(qualityDistribution.silver * 100)}% · ⭐⭐⭐{" "}
              {Math.round(qualityDistribution.gold * 100)}%
              {qualityDistribution.iridium > 0
                ? ` · 💎 ${Math.round(qualityDistribution.iridium * 100)}%`
                : ""}
            </p>
          </div>

          <div className="bed-info-section">
            <h4>{t("bedInfo.seedCosts")}</h4>
            <p className="bed-info-costs">
              {plant.seedPrice} G × {bedSize} {t("general.tiles")} = {seedCosts} G
            </p>
          </div>
          <div className="bed-info-section">
            <h4>{t("bedInfo.profit")}</h4>
            <p className="bed-info-profit">
              {Math.round(totalRevenue)} − {seedCosts} ={" "}
              <strong>{Math.round(totalProfit)} G</strong>
            </p>
          </div>
        </>
      )}
    </aside>
  );
}
