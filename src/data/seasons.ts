import type { Season, SeasonId } from "./types";

export const SEASON_DAYS = 28;

// Note: Labels are now handled by i18n through useI18n hook.
// Components should use t() function to get translated season labels.
export const SEASONS: Season[] = [
  { id: "spring", label: "spring", emoji: "🌸", color: "#b8ddb0" },
  { id: "summer", label: "summer", emoji: "☀️", color: "#f0d080" },
  { id: "fall", label: "fall", emoji: "🍂", color: "#d4956a" },
  { id: "winter", label: "winter", emoji: "❄️", color: "#b8d4e8" },
];

export const SEASON_ORDER: SeasonId[] = ["spring", "summer", "fall", "winter"];
