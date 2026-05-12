import type { FertilizerType, Plant, Planting, SeasonId } from "../data/types";
import { SEASON_DAYS, SEASON_ORDER } from "../data/seasons";

const FERTILIZER_BONUS: Record<FertilizerType, number> = {
  none: 0,
  speed_gro: 0.1,
  deluxe_speed_gro: 0.25,
  hyper_speed_gro: 0.33,
};

export function calcGrowDays(
  plant: Plant,
  fertilizer: FertilizerType,
  agriculturist: boolean,
): number {
  const bonus = FERTILIZER_BONUS[fertilizer] + (agriculturist ? 0.1 : 0);

  if (bonus <= 0) {
    return plant.growDays;
  }

  return Math.max(1, plant.growDays - Math.ceil(plant.growDays * bonus));
}

/**
 * Letzter Pflanztag, damit Ernte noch in die Saison fällt
 */
export function lastPlantDay(
  plant: Plant,
  fertilizer: FertilizerType = "none",
  agriculturist = false,
): number {
  return SEASON_DAYS - calcGrowDays(plant, fertilizer, agriculturist) + 1;
}

/**
 * Alle Erntetage innerhalb der Saison
 */
export function getHarvestDays(
  planting: Planting,
  plant: Plant,
  fertilizer: FertilizerType = "none",
  agriculturist = false,
): number[] {
  const days: number[] = [];
  const growDays = calcGrowDays(plant, fertilizer, agriculturist);
  let harvest = planting.startDay + growDays;
  while (harvest <= SEASON_DAYS) {
    days.push(harvest);
    if (!plant.regrowDays) break;
    harvest += plant.regrowDays;
  }
  return days;
}

/**
 * Gesamtertrag in Gold
 */
export function calcRevenue(
  planting: Planting,
  plant: Plant,
  fertilizer: FertilizerType = "none",
  agriculturist = false,
): number {
  return (
    getHarvestDays(planting, plant, fertilizer, agriculturist).length *
    plant.yield *
    plant.sellPrice
  );
}

/**
 * Gewinn (Ertrag minus Samenkosten)
 */
export function calcProfit(
  planting: Planting,
  plant: Plant,
  fertilizer: FertilizerType = "none",
  agriculturist = false,
): number {
  return calcRevenue(planting, plant, fertilizer, agriculturist) - plant.seedPrice;
}

/**
 * Effektive Beetgröße nach Abzug von Sprinklern
 */
export function getBedEffectiveArea(bed: {
  width: number;
  height: number;
  sprinklers: number;
}): number {
  return Math.max(0, bed.width * bed.height - bed.sprinklers);
}

/**
 * Kollisionsprüfung zweier Beete
 */
export function bedsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/**
 * Gibt die Vorsaison zurück (zyklisch)
 */
export function prevSeason(season: SeasonId): SeasonId {
  const idx = SEASON_ORDER.indexOf(season);
  return SEASON_ORDER[(idx + SEASON_ORDER.length - 1) % SEASON_ORDER.length];
}

/**
 * Prüft ob eine Pflanzung aus der Vorsaison in die aktuelle Saison hineinwächst
 */
export function isCarryover(plant: Plant, currentSeason: SeasonId): boolean {
  const prev = prevSeason(currentSeason);
  return plant.seasons.includes(prev) && plant.seasons.includes(currentSeason);
}

export interface DayTask {
  bedId: string;
  bedName: string;
  bedColor?: string;
  harvest: Plant | null;
  sow: Plant | null;
}

/**
 * Sammle Tagesaufgaben (Ernte / Säen) für alle Beete der aktuellen Saison.
 * Berücksichtigt auch Carry-over aus der Vorsaison (nur Ernteaufgaben).
 */
export function getDayTasks(
  day: number,
  beds: {
    id: string;
    name: string;
    color?: string;
    fertilizer?: FertilizerType;
    plantings: Planting[];
  }[],
  plants: Plant[],
  currentSeason: SeasonId,
  bedsFromPrevSeason: { id: string; fertilizer?: FertilizerType; plantings: Planting[] }[] = [],
  agriculturist = false,
): DayTask[] {
  const plantMap = new Map(plants.map((p) => [p.id, p]));
  const tasks: DayTask[] = [];

  // Current-season plantings
  for (const bed of beds) {
    let harvest: Plant | null = null;
    let sow: Plant | null = null;

    for (const planting of bed.plantings) {
      const plant = plantMap.get(planting.plantId);
      if (!plant) continue;

      const harvestDays = getHarvestDays(planting, plant, bed.fertilizer ?? "none", agriculturist);
      if (harvestDays.includes(day)) harvest = plant;
      if (planting.startDay === day) sow = plant;
    }

    if (harvest || sow) {
      tasks.push({ bedId: bed.id, bedName: bed.name, bedColor: bed.color, harvest, sow });
    }
  }

  // Carry-over from prev season (only harvests)
  for (const prevBed of bedsFromPrevSeason) {
    const lastPlanting = prevBed.plantings[prevBed.plantings.length - 1];
    if (!lastPlanting) continue;
    const plant = plantMap.get(lastPlanting.plantId);
    if (!plant) continue;
    if (!isCarryover(plant, currentSeason)) continue;
    const fertilizer = prevBed.fertilizer ?? "none";

    // compute harvest days that fall into current season
    const firstHarvestAbsolute =
      lastPlanting.startDay + calcGrowDays(plant, fertilizer, agriculturist);
    // harvest days may be >28 and <=56
    const harvestsInCurrent: number[] = [];
    if (!plant.regrowDays) {
      if (firstHarvestAbsolute > 28 && firstHarvestAbsolute <= 56) {
        harvestsInCurrent.push(firstHarvestAbsolute - 28);
      }
    } else {
      for (let h = firstHarvestAbsolute; h <= 56; h += plant.regrowDays) {
        if (h > 28) harvestsInCurrent.push(h - 28);
      }
    }

    if (harvestsInCurrent.includes(day)) {
      // try to find matching bed in current beds to show bed name
      const bed = beds.find((b) => b.id === prevBed.id);
      const bedName = bed ? bed.name : prevBed.id;
      tasks.push({ bedId: prevBed.id, bedName, bedColor: undefined, harvest: plant, sow: null });
    }
  }

  return tasks;
}
