import type { Bed, Plant, Planting, SeasonId } from "../data/types";
import {
  calcGrowDays,
  calcExpectedHarvestValue,
  calcExpectedRevenue,
  getBedEffectiveArea,
  isCarryover,
  prevSeason,
} from "../utils/calculations";
import { FERTILIZERS, QUALITY_FERTILIZERS, RETAINING_FERTILIZERS } from "../data/fertilizers";
import { useI18n } from "../contexts/I18nContext";
import "./SeasonSummary.css";

interface SeasonSummaryProps {
  beds: Bed[];
  bedsFromPrevSeason: Bed[];
  selectedSeason: SeasonId;
  plants: Plant[];
  farmingLevel: number;
  agriculturist?: boolean;
}

type ShoppingRow = {
  plant: Plant;
  seedCount: number;
  totalSeedCost: number;
};

type YieldRow = {
  bedId: string;
  bedName: string;
  plantNames: string[];
  revenue: number;
  isCarryover: boolean;
  carryoverSeasonLabel?: string;
};

function calcCarryoverHarvestRevenue(
  planting: Planting,
  plant: Plant,
  fertilizer: Bed["fertilizer"],
  farmingLevel: number,
  agriculturist: boolean,
): number {
  const harvestDays: number[] = [];
  let harvestDay = planting.startDay + calcGrowDays(plant, fertilizer, agriculturist);

  while (harvestDay <= 56) {
    if (harvestDay > 28) {
      harvestDays.push(harvestDay - 28);
    }

    if (!plant.regrowDays) {
      break;
    }

    harvestDay += plant.regrowDays;
  }

  return harvestDays.length * calcExpectedHarvestValue(plant, fertilizer, farmingLevel);
}

export default function SeasonSummary({
  beds,
  bedsFromPrevSeason,
  selectedSeason,
  plants,
  farmingLevel,
  agriculturist = false,
}: SeasonSummaryProps) {
  const { t } = useI18n();
  const SEASON_LABELS: Record<SeasonId, string> = {
    spring: t("season.spring"),
    summer: t("season.summer"),
    fall: t("season.fall"),
    winter: t("season.winter"),
  };
  const plantMap = new Map(plants.map((plant) => [plant.id, plant]));

  const currentPlantings = beds.flatMap((bed) =>
    bed.plantings
      .map((planting) => {
        const plant = plantMap.get(planting.plantId);
        if (!plant) return null;

        return {
          bed,
          plant,
          planting,
        };
      })
      .filter((entry): entry is { bed: Bed; plant: Plant; planting: Planting } => entry !== null),
  );

  const carryoverPlantings = bedsFromPrevSeason.flatMap((prevBed) => {
    const currentBed = beds.find((bed) => bed.id === prevBed.id);
    const lastPlanting = prevBed.plantings[prevBed.plantings.length - 1];
    if (!currentBed || !lastPlanting) return [];

    const plant = plantMap.get(lastPlanting.plantId);
    if (!plant || !isCarryover(plant, selectedSeason)) return [];

    const previousSeasonId = prevSeason(selectedSeason);

    return [
      {
        bed: currentBed,
        plant,
        planting: lastPlanting,
        previousSeasonId,
      },
    ];
  });

  const shoppingRows = currentPlantings.reduce<ShoppingRow[]>((rows, entry) => {
    const quantity = getBedEffectiveArea(entry.bed);
    const totalSeedCost = quantity * entry.plant.seedPrice;
    const existingRow = rows.find((row) => row.plant.id === entry.plant.id);

    if (existingRow) {
      existingRow.seedCount += quantity;
      existingRow.totalSeedCost += totalSeedCost;
      return rows;
    }

    rows.push({
      plant: entry.plant,
      seedCount: quantity,
      totalSeedCost,
    });
    return rows;
  }, []);

  // Fertilizer counts (per tile) - sum effective area of beds using each fertilizer
  const fertilizerMap = new Map<string, number>();
  for (const bed of beds) {
    if (bed.fertilizer.type === "none") continue;
    const qty = getBedEffectiveArea(bed);
    const key = `${bed.fertilizer.category}-${bed.fertilizer.type}`;
    fertilizerMap.set(key, (fertilizerMap.get(key) ?? 0) + qty);
  }

  type FertilizerRow = {
    key: string;
    count: number;
    label: string;
    imageFile: string;
    category: "speed" | "quality" | "retaining";
  };

  const fertilizerRows: FertilizerRow[] = Array.from(fertilizerMap.entries())
    .map(([key, count]) => {
      const [category, type] = key.split("-");
      if (category === "speed") {
        const fert = FERTILIZERS.find((f) => f.id === type);
        if (!fert) return null;
        const imagePath =
          type === "speed_gro"
            ? "Speed-Gro.png"
            : type === "deluxe_speed_gro"
              ? "Deluxe_Speed-Gro.png"
              : "Hyper_Speed-Gro.png";
        return {
          key,
          count,
          label: fert.label,
          imageFile: imagePath,
          category: "speed" as const,
        };
      }
      if (category === "quality") {
        const fert = QUALITY_FERTILIZERS.find((f) => f.id === type);
        if (!fert || fert.imageFile === "") return null;
        return {
          key,
          count,
          label: fert.label,
          imageFile: fert.imageFile,
          category: "quality" as const,
        };
      }
      if (category === "retaining") {
        const fert = RETAINING_FERTILIZERS.find((f) => f.id === type);
        if (!fert || fert.imageFile === "") return null;
        return {
          key,
          count,
          label: fert.label,
          imageFile: fert.imageFile,
          category: "retaining" as const,
        };
      }
      return null;
    })
    .filter((row): row is FertilizerRow => row !== null);

  const yieldRows = [
    ...beds
      .map<YieldRow | null>((bed) => {
        const bedPlantings = bed.plantings
          .map((planting) => ({ planting, plant: plantMap.get(planting.plantId) ?? null }))
          .filter((entry): entry is { planting: Planting; plant: Plant } => entry.plant !== null);

        if (bedPlantings.length === 0) return null;

        return {
          bedId: bed.id,
          bedName: bed.name,
          plantNames: Array.from(
            new Set(bedPlantings.map((entry) => t(`plant.name.${entry.plant.id}`))),
          ),
          revenue: bedPlantings.reduce(
            (sum, entry) =>
              sum +
              calcExpectedRevenue(
                entry.planting,
                entry.plant,
                bed.fertilizer,
                farmingLevel,
                agriculturist,
              ) *
                getBedEffectiveArea(bed),
            0,
          ),
          isCarryover: false,
        };
      })
      .filter((row): row is YieldRow => row !== null),
    ...carryoverPlantings.map<YieldRow>((entry) => ({
      bedId: entry.bed.id,
      bedName: entry.bed.name,
      plantNames: [t(`plant.name.${entry.plant.id}`)],
      revenue:
        calcCarryoverHarvestRevenue(
          entry.planting,
          entry.plant,
          entry.bed.fertilizer,
          farmingLevel,
          agriculturist,
        ) * getBedEffectiveArea(entry.bed),
      isCarryover: true,
      carryoverSeasonLabel: SEASON_LABELS[entry.previousSeasonId],
    })),
  ];

  const totalSeedCosts = shoppingRows.reduce((sum, row) => sum + row.totalSeedCost, 0);
  const totalRevenue = yieldRows.reduce((sum, row) => sum + row.revenue, 0);
  const totalProfit = totalRevenue - totalSeedCosts;

  const hasAnyPlantings = shoppingRows.length > 0 || yieldRows.length > 0;

  return (
    <div className="season-summary">
      <div className="season-summary-header">
        <h2 className="season-summary-title">{t("summary.title")}</h2>
        <p className="season-summary-subtitle">
          {SEASON_LABELS[selectedSeason]} · {t("summary.subtitle")}
        </p>
      </div>

      {!hasAnyPlantings ? (
        <div className="season-summary-empty">{t("summary.empty")}</div>
      ) : (
        <>
          <section className="season-summary-section">
            <h3 className="season-summary-section-title">{t("summary.shoppingList")}</h3>
            {shoppingRows.length === 0 ? (
              <p className="season-summary-note">{t("summary.noNewSeeds")}</p>
            ) : (
              <div className="season-summary-list">
                {shoppingRows.map((row) => (
                  <article key={row.plant.id} className="season-summary-row">
                    <img
                      className="season-summary-image"
                      src={`/plants/${row.plant.imageFile}`}
                      alt={t(`plant.name.${row.plant.id}`)}
                    />
                    <div className="season-summary-row-main">
                      <div className="season-summary-row-title">
                        {t(`plant.name.${row.plant.id}`)}
                      </div>
                    </div>
                    <div className="season-summary-row-total">
                      {row.seedCount} {t("summary.seeds")}
                    </div>
                  </article>
                ))}
                {fertilizerRows.length > 0 &&
                  fertilizerRows.map((f) => {
                    const type = f.key.split("-")[1] ?? "";
                    const label =
                      f.category === "speed"
                        ? t(`fertilizer.${type}`)
                        : f.category === "quality"
                          ? t(`qualityFertilizer.${type}`)
                          : t(`retainingFertilizer.${type}`);

                    return (
                      <article key={f.key} className="season-summary-row">
                        <img
                          className="season-summary-image"
                          src={`/fertilizers/${f.imageFile}`}
                          alt={label}
                        />
                        <div className="season-summary-row-main">
                          <div className="season-summary-row-title">{label}</div>
                        </div>
                        <div className="season-summary-row-total">{f.count}</div>
                      </article>
                    );
                  })}
              </div>
            )}

            <div className="season-summary-total">
              {t("summary.total")}
              <strong>
                {shoppingRows.reduce((sum, row) => sum + row.seedCount, 0)} {t("summary.seeds")}
              </strong>
              <span>
                <strong>{totalSeedCosts} G 🪙</strong>
              </span>
            </div>
          </section>

          <section className="season-summary-section">
            <h3 className="season-summary-section-title">{t("summary.expectedYield")}</h3>
            <div className="season-summary-list">
              {yieldRows.map((row) => (
                <article
                  key={`${row.bedId}-${row.plantNames.join("-")}-${row.isCarryover ? "carry" : "current"}`}
                  className="season-summary-row"
                >
                  <div className="season-summary-row-bullet">{row.isCarryover ? "🌽" : "🌾"}</div>
                  <div className="season-summary-row-main">
                    <div className="season-summary-row-title">{row.bedName}</div>
                    <div className="season-summary-row-meta">
                      {row.plantNames.join(", ")}
                      {row.isCarryover && row.carryoverSeasonLabel
                        ? ` · ${t("summary.from")} ${row.carryoverSeasonLabel}`
                        : ""}
                    </div>
                  </div>
                  <div className="season-summary-row-total">{Math.round(row.revenue)} G</div>
                </article>
              ))}
            </div>

            <div className="season-summary-total season-summary-total-stack">
              <span>
                {t("summary.yield")} <strong>{Math.round(totalRevenue)} G</strong>
              </span>
              <span>
                {t("summary.profit")} <strong>{Math.round(totalProfit)} G</strong>
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
