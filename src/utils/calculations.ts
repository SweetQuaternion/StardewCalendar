import type { FertilizerType, Plant, Planting, SeasonId } from "../data/types";
import { NO_FERTILIZER } from "../data/types";
import { QUALITY_FERTILIZER_LEVEL } from "../data/fertilizers";
import { SEASON_DAYS, SEASON_ORDER } from "../data/seasons";

function getFertilizerBonus(fertilizer: FertilizerType): number {
  if (fertilizer.category === "speed") {
    switch (fertilizer.type) {
      case "speed_gro":
        return 0.1;
      case "deluxe_speed_gro":
        return 0.25;
      case "hyper_speed_gro":
        return 0.33;
      default:
        return 0;
    }
  }
  return 0;
}

export function calcGrowDays(
  plant: Plant,
  fertilizer: FertilizerType,
  agriculturist: boolean,
): number {
  const bonus = getFertilizerBonus(fertilizer) + (agriculturist ? 0.1 : 0);

  if (bonus <= 0) {
    return plant.growDays;
  }

  return Math.max(1, plant.growDays - Math.ceil(plant.growDays * bonus));
}

export interface QualityDistribution {
  normal: number;
  silver: number;
  gold: number;
  iridium: number;
}

const QUALITY_MULTIPLIER = {
  normal: 1,
  silver: 1.25,
  gold: 1.5,
  iridium: 2,
} as const;

function getQualityFertilizerLevel(fertilizer: FertilizerType): number {
  if (fertilizer.category !== "quality") return 0;
  return QUALITY_FERTILIZER_LEVEL[fertilizer.type] ?? 0;
}

export function calcQualityDistribution(
  farmingLevel: number,
  fertilizerLevel: number,
): QualityDistribution {
  const safeFarmingLevel = Number.isFinite(farmingLevel) ? Math.max(0, farmingLevel) : 0;
  const safeFertilizerLevel = Number.isFinite(fertilizerLevel)
    ? Math.max(0, Math.min(3, fertilizerLevel))
    : 0;
  const chanceGold = Math.min(
    1,
    0.2 * (safeFarmingLevel / 10) +
      0.2 * safeFertilizerLevel * ((safeFarmingLevel + 2) / 12) +
      0.01,
  );
  const chanceSilver = Math.min(0.75, chanceGold * 2);

  if (safeFertilizerLevel === 3) {
    const iridium = chanceGold / 2;
    const gold = (1 - iridium) * chanceGold;
    const silver = Math.max(0, 1 - iridium - gold);
    return { normal: 0, silver, gold, iridium };
  }

  const gold = chanceGold;
  const silver = (1 - chanceGold) * chanceSilver;
  return { normal: Math.max(0, 1 - gold - silver), silver, gold, iridium: 0 };
}

export function expectedSellPrice(basePrice: number, dist: QualityDistribution): number {
  if (!Number.isFinite(basePrice)) return 0;
  return (
    basePrice *
    (dist.normal * QUALITY_MULTIPLIER.normal +
      dist.silver * QUALITY_MULTIPLIER.silver +
      dist.gold * QUALITY_MULTIPLIER.gold +
      dist.iridium * QUALITY_MULTIPLIER.iridium)
  );
}

export function calcExpectedHarvestValue(
  plant: Plant,
  fertilizer: FertilizerType,
  farmingLevel: number,
): number {
  const fertilizerLevel = getQualityFertilizerLevel(fertilizer);
  const qualityDistribution = calcQualityDistribution(farmingLevel, fertilizerLevel);
  const oneFruitValue = expectedSellPrice(plant.sellPrice, qualityDistribution);

  if (plant.yield <= 1) {
    return oneFruitValue * plant.yield;
  }

  return oneFruitValue + (plant.yield - 1) * plant.sellPrice;
}

export function calcExpectedRevenue(
  planting: Planting,
  plant: Plant,
  fertilizer?: FertilizerType,
  farmingLevel = 0,
  agriculturist = false,
): number {
  const harvestCount = getHarvestDays(planting, plant, fertilizer, agriculturist).length;
  if (!Number.isFinite(harvestCount)) return 0;
  return harvestCount * calcExpectedHarvestValue(plant, fertilizer ?? NO_FERTILIZER, farmingLevel);
}

/**
 * Letzter Pflanztag, damit Ernte noch in die Saison fällt
 */
export function lastPlantDay(
  plant: Plant,
  fertilizer?: FertilizerType,
  agriculturist = false,
): number {
  return SEASON_DAYS - calcGrowDays(plant, fertilizer ?? NO_FERTILIZER, agriculturist) + 1;
}

/**
 * Alle Erntetage innerhalb der Saison
 */
export function getHarvestDays(
  planting: Planting,
  plant: Plant,
  fertilizer?: FertilizerType,
  agriculturist = false,
): number[] {
  const days: number[] = [];
  const growDays = calcGrowDays(plant, fertilizer ?? NO_FERTILIZER, agriculturist);
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
  fertilizer?: FertilizerType,
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
  fertilizer?: FertilizerType,
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

      const harvestDays = getHarvestDays(planting, plant, bed.fertilizer, agriculturist);
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
    const fertilizer = prevBed.fertilizer ?? NO_FERTILIZER;

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
