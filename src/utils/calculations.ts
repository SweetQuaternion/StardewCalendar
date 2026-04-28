import type { Plant, Planting, SeasonId } from "../data/types";
import { SEASON_DAYS, SEASON_ORDER } from "../data/seasons";

/**
 * Letzter Pflanztag, damit Ernte noch in die Saison fällt
 */
export function lastPlantDay(plant: Plant): number {
  return SEASON_DAYS - plant.growDays + 1;
}

/**
 * Alle Erntetage innerhalb der Saison
 */
export function getHarvestDays(planting: Planting, plant: Plant): number[] {
  const days: number[] = [];
  let harvest = planting.startDay + plant.growDays;
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
export function calcRevenue(planting: Planting, plant: Plant): number {
  return getHarvestDays(planting, plant).length * plant.yield * plant.sellPrice;
}

/**
 * Gewinn (Ertrag minus Samenkosten)
 */
export function calcProfit(planting: Planting, plant: Plant): number {
  return calcRevenue(planting, plant) - plant.seedPrice;
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
