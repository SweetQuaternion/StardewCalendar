import type { SeasonId } from "./types";

export type HolidayType = "birthday" | "festival" | "other";

export type Holiday = {
  date: number;
  name: string;
  type: HolidayType;
};

const springBirthdays: Record<number, Holiday> = {
  4: { date: 4, name: "person.kent", type: "birthday" },
  7: { date: 7, name: "person.lewis", type: "birthday" },
  10: { date: 10, name: "person.vincent", type: "birthday" },
  14: { date: 14, name: "person.haley", type: "birthday" },
  18: { date: 18, name: "person.pam", type: "birthday" },
  20: { date: 20, name: "person.shane", type: "birthday" },
  26: { date: 26, name: "person.pierre", type: "birthday" },
  27: { date: 27, name: "person.emily", type: "birthday" },
};

const summerBirthdays: Record<number, Holiday> = {
  4: { date: 4, name: "person.jas", type: "birthday" },
  8: { date: 8, name: "person.gus", type: "birthday" },
  10: { date: 10, name: "person.maru", type: "birthday" },
  13: { date: 13, name: "person.alex", type: "birthday" },
  17: { date: 17, name: "person.sam", type: "birthday" },
  19: { date: 19, name: "person.demetrius", type: "birthday" },
  22: { date: 22, name: "person.dwarf", type: "birthday" },
  24: { date: 24, name: "person.willy", type: "birthday" },
  26: { date: 26, name: "person.leo", type: "birthday" },
};

const fallBirthdays: Record<number, Holiday> = {
  2: { date: 2, name: "person.penny", type: "birthday" },
  5: { date: 5, name: "person.elliot", type: "birthday" },
  11: { date: 11, name: "person.jodi", type: "birthday" },
  13: { date: 13, name: "person.abigail", type: "birthday" },
  15: { date: 15, name: "person.sandy", type: "birthday" },
  18: { date: 18, name: "person.marnie", type: "birthday" },
  21: { date: 21, name: "person.robin", type: "birthday" },
  24: { date: 24, name: "person.george", type: "birthday" },
};

const winterBirthdays: Record<number, Holiday> = {
  1: { date: 1, name: "person.krobus", type: "birthday" },
  3: { date: 3, name: "person.linus", type: "birthday" },
  7: { date: 7, name: "person.caroline", type: "birthday" },
  10: { date: 10, name: "person.sebastian", type: "birthday" },
  14: { date: 14, name: "person.harvey", type: "birthday" },
  17: { date: 17, name: "person.wizard", type: "birthday" },
  20: { date: 20, name: "person.evelyn", type: "birthday" },
  23: { date: 23, name: "person.leah", type: "birthday" },
  26: { date: 26, name: "person.clint", type: "birthday" },
};

const springHolidays: Record<number, Holiday> = {
  13: { date: 13, name: "eggFestival", type: "festival" },
  14: { date: 14, name: "person.haley", type: "birthday" },
  15: { date: 15, name: "desertFestival", type: "other" },
  16: { date: 16, name: "desertFestival", type: "other" },
  17: { date: 17, name: "desertFestival", type: "other" },
  24: { date: 24, name: "flowerDance", type: "festival" },
};

const summerHolidays: Record<number, Holiday> = {
  11: { date: 11, name: "luau", type: "festival" },
  20: { date: 20, name: "troutDerby", type: "other" },
  21: { date: 21, name: "troutDerby", type: "other" },
  28: { date: 28, name: "moonlightJellies", type: "festival" },
};

const fallHolidays: Record<number, Holiday> = {
  16: { date: 16, name: "stardewValleyFair", type: "festival" },
  28: { date: 28, name: "spiritsEve", type: "festival" },
};

const winterHolidays: Record<number, Holiday> = {
  8: { date: 8, name: "festivalOfIce", type: "festival" },
  12: { date: 12, name: "squidFest", type: "other" },
  13: { date: 13, name: "squidFest", type: "other" },
  15: { date: 15, name: "nightMarket", type: "other" },
  16: { date: 16, name: "nightMarket", type: "other" },
  17: { date: 17, name: "nightMarket", type: "other" },
  25: { date: 25, name: "feastOfTheWinterStar", type: "festival" },
};

export const getHolidays = (season: SeasonId, day: number): Holiday | null => {
  switch (season) {
    case "spring":
      return springHolidays[day] || null;
    case "summer":
      return summerHolidays[day] || null;
    case "fall":
      return fallHolidays[day] || null;
    case "winter":
      return winterHolidays[day] || null;
    default:
      return null;
  }
};

export const getBirthday = (season: SeasonId, day: number): Holiday | null => {
  switch (season) {
    case "spring":
      return springBirthdays[day] || null;
    case "summer":
      return summerBirthdays[day] || null;
    case "fall":
      return fallBirthdays[day] || null;
    case "winter":
      return winterBirthdays[day] || null;
    default:
      return null;
  }
};
