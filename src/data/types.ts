export type SeasonId = "spring" | "summer" | "fall" | "winter";

export type FertilizerType = "none" | "speed_gro" | "deluxe_speed_gro" | "hyper_speed_gro";

export interface Fertilizer {
  id: FertilizerType;
  label: string;
  bonus: number;
  color: string;
}

export interface Season {
  id: SeasonId;
  label: string;
  emoji: string;
  color: string;
}

export interface Plant {
  id: string;
  name: string;
  seasons: SeasonId[];
  growDays: number;
  regrowDays: number | null;
  sellPrice: number;
  seedPrice: number;
  yield: number;
  color: string;
  imageFile: string;
}

export interface Bed {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sprinklers: number;
  fertilizer: FertilizerType;
  plantings: Planting[];
}

export interface Planting {
  id: string;
  plantId: string;
  startDay: number;
}
