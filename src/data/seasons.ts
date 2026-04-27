import type { Season, SeasonId } from "./types";

export const SEASON_DAYS = 28;

export const SEASONS: Season[] = [
  { id: "spring", label: "Frühling", emoji: "🌸", color: "#b8ddb0" },
  { id: "summer", label: "Sommer", emoji: "☀️", color: "#f0d080" },
  { id: "fall", label: "Herbst", emoji: "🍂", color: "#d4956a" },
  { id: "winter", label: "Winter", emoji: "❄️", color: "#b8d4e8" },
];

export const SEASON_ORDER: SeasonId[] = ["spring", "summer", "fall", "winter"];
