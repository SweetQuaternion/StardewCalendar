import type { Bed, Plant, Planting, SeasonId } from "../data/types";
import {
  calcGrowDays,
  calcRevenue,
  getBedEffectiveArea,
  isCarryover,
  prevSeason,
} from "../utils/calculations";
import { FERTILIZERS } from "../data/fertilizers";
import "./SeasonSummary.css";

interface SeasonSummaryProps {
  beds: Bed[];
  bedsFromPrevSeason: Bed[];
  selectedSeason: SeasonId;
  plants: Plant[];
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

const SEASON_LABELS: Record<SeasonId, string> = {
  spring: "Frühling",
  summer: "Sommer",
  fall: "Herbst",
  winter: "Winter",
};

function calcCarryoverHarvestRevenue(
  planting: Planting,
  plant: Plant,
  fertilizer: Bed["fertilizer"],
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

  return harvestDays.length * plant.yield * plant.sellPrice;
}

export default function SeasonSummary({
  beds,
  bedsFromPrevSeason,
  selectedSeason,
  plants,
  agriculturist = false,
}: SeasonSummaryProps) {
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
    if (!bed.fertilizer || bed.fertilizer === "none") continue;
    const qty = getBedEffectiveArea(bed);
    fertilizerMap.set(bed.fertilizer, (fertilizerMap.get(bed.fertilizer) ?? 0) + qty);
  }
  const fertilizerRows = Array.from(fertilizerMap.entries()).map(([id, count]) => ({
    id,
    count,
    label: FERTILIZERS.find((f) => f.id === id)?.label ?? id,
  }));

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
          plantNames: Array.from(new Set(bedPlantings.map((entry) => entry.plant.name))),
          revenue: bedPlantings.reduce(
            (sum, entry) =>
              sum +
              calcRevenue(entry.planting, entry.plant, bed.fertilizer, agriculturist) *
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
      plantNames: [entry.plant.name],
      revenue:
        calcCarryoverHarvestRevenue(
          entry.planting,
          entry.plant,
          entry.bed.fertilizer,
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
        <h2 className="season-summary-title">📋 Saisonübersicht</h2>
        <p className="season-summary-subtitle">
          {SEASON_LABELS[selectedSeason]} · Einkaufsliste und Ertragsvorschau
        </p>
      </div>

      {!hasAnyPlantings ? (
        <div className="season-summary-empty">
          Pflanze deine Beete, um eine Übersicht zu sehen. 🌱
        </div>
      ) : (
        <>
          <section className="season-summary-section">
            <h3 className="season-summary-section-title">🛒 Einkaufsliste</h3>
            {shoppingRows.length === 0 ? (
              <p className="season-summary-note">
                Keine neuen Samen nötig – nur Carry-over vorhanden.
              </p>
            ) : (
              <div className="season-summary-list">
                {shoppingRows.map((row) => (
                  <article key={row.plant.id} className="season-summary-row">
                    <img
                      className="season-summary-image"
                      src={`/plants/${row.plant.imageFile}`}
                      alt={row.plant.name}
                    />
                    <div className="season-summary-row-main">
                      <div className="season-summary-row-title">{row.plant.name}</div>
                    </div>
                    <div className="season-summary-row-total">{row.seedCount} Samen</div>
                  </article>
                ))}

                {fertilizerRows.length > 0 &&
                  fertilizerRows.map((f) => (
                    <article key={f.id} className="season-summary-row">
                      <img
                        className="season-summary-image"
                        src={
                          f.id === "speed_gro"
                            ? "/fertilizer/Speed-Gro.png"
                            : f.id === "deluxe_speed_gro"
                              ? "/fertilizer/Deluxe_Speed-Gro.png"
                              : "/fertilizer/Hyper_Speed-Gro.png"
                        }
                        alt={f.label}
                      />
                      <div className="season-summary-row-main">
                        <div className="season-summary-row-title">{f.label}</div>
                      </div>
                      <div className="season-summary-row-total">{f.count}</div>
                    </article>
                  ))}
              </div>
            )}

            <div className="season-summary-total">
              Gesamt:{" "}
              <strong>{shoppingRows.reduce((sum, row) => sum + row.seedCount, 0)} Samen</strong>
              <span>
                <strong>{totalSeedCosts} G 🪙</strong>
              </span>
            </div>
          </section>

          <section className="season-summary-section">
            <h3 className="season-summary-section-title">📈 Erwarteter Ertrag</h3>
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
                        ? ` · aus ${row.carryoverSeasonLabel}`
                        : ""}
                    </div>
                  </div>
                  <div className="season-summary-row-total">{row.revenue} G</div>
                </article>
              ))}
            </div>

            <div className="season-summary-total season-summary-total-stack">
              <span>
                Ertrag: <strong>{totalRevenue} G</strong>
              </span>
              <span>
                Gewinn: <strong>{totalProfit} G</strong>
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
