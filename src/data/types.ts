export type SeasonId = "spring" | "summer" | "fall" | "winter";

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
  planting: Planting | null;
}

export interface Planting {
  id: string;
  plantId: string;
  startDay: number;
}
