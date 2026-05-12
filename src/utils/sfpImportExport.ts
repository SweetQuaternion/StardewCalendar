import type { Bed, FertilizerType, Planting, SeasonId } from "../data/types";

const SEASONS: SeasonId[] = ["spring", "summer", "fall", "winter"];
const SFP_FORMAT = "stardew-farm-planner";
const SFP_VERSION = 1;

type BedLayout = Omit<Bed, "plantings">;
type PlantingsByBed = Record<string, Planting[]>;

type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface SfpData {
  currentSeason: SeasonId;
  currentDay: number;
  beds: BedLayout[];
  plantings: Record<SeasonId, PlantingsByBed>;
}

export interface SfpFile {
  version: number;
  format: string;
  exportDate: string;
  data: SfpData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isFertilizerType(value: unknown): value is FertilizerType {
  return (
    value === "none" ||
    value === "speed_gro" ||
    value === "deluxe_speed_gro" ||
    value === "hyper_speed_gro"
  );
}

function isSeasonId(value: unknown): value is SeasonId {
  return value === "spring" || value === "summer" || value === "fall" || value === "winter";
}

function isValidPlanting(value: unknown): value is Planting {
  if (!isRecord(value)) return false;
  if (!isNonEmptyString(value.id)) return false;
  if (!isNonEmptyString(value.plantId)) return false;
  const startDay = value.startDay;
  if (typeof startDay !== "number" || !Number.isInteger(startDay)) return false;
  return startDay >= 1 && startDay <= 28;
}

function isValidBedLayout(value: unknown): value is BedLayout {
  if (!isRecord(value)) return false;

  const sprinklers = value.sprinklers;
  const fertilizer = value.fertilizer;

  return (
    isNonEmptyString(value.id) &&
    typeof value.name === "string" &&
    isValidNumber(value.x) &&
    isValidNumber(value.y) &&
    isValidNumber(value.width) &&
    value.width > 0 &&
    isValidNumber(value.height) &&
    value.height > 0 &&
    (sprinklers === undefined ||
      (isValidNumber(sprinklers) && Number.isInteger(sprinklers) && sprinklers >= 0)) &&
    (fertilizer === undefined || isFertilizerType(fertilizer))
  );
}

export function buildSfpExportPayload(
  bedsBySeason: Record<SeasonId, Bed[]>,
  currentSeason: SeasonId,
  currentDay: number,
): SfpFile {
  const bedMap = new Map<string, BedLayout>();

  for (const season of SEASONS) {
    for (const bed of bedsBySeason[season]) {
      if (!bedMap.has(bed.id)) {
        const { plantings: _plantings, ...layout } = bed;
        bedMap.set(bed.id, layout);
      }
    }
  }

  const beds = Array.from(bedMap.values());

  const plantings: Record<SeasonId, PlantingsByBed> = {
    spring: {},
    summer: {},
    fall: {},
    winter: {},
  };

  for (const season of SEASONS) {
    for (const bed of bedsBySeason[season]) {
      if (!bedMap.has(bed.id)) continue;
      plantings[season][bed.id] = bed.plantings.map((planting) => ({ ...planting }));
    }

    for (const bed of beds) {
      if (!plantings[season][bed.id]) {
        plantings[season][bed.id] = [];
      }
    }
  }

  return {
    version: SFP_VERSION,
    format: SFP_FORMAT,
    exportDate: new Date().toISOString(),
    data: {
      currentSeason,
      currentDay,
      beds,
      plantings,
    },
  };
}

export function parseSfpImportPayload(value: unknown): ParseResult<SfpFile> {
  if (!isRecord(value)) {
    return { ok: false, error: "Datei ist kein gültiges JSON-Objekt." };
  }

  if (value.version !== SFP_VERSION) {
    return { ok: false, error: `Ungültige Version. Erwartet: ${SFP_VERSION}.` };
  }

  if (value.format !== SFP_FORMAT) {
    return { ok: false, error: "Ungültiges Dateiformat für Stardew Farm Planner." };
  }

  if (!isNonEmptyString(value.exportDate)) {
    return { ok: false, error: "Fehlendes oder ungültiges Export-Datum." };
  }

  if (!isRecord(value.data)) {
    return { ok: false, error: "Der Bereich 'data' fehlt oder ist ungültig." };
  }

  const bedsRaw = value.data.beds;
  const plantingsRaw = value.data.plantings;
  const currentSeasonRaw = value.data.currentSeason;
  const currentDayRaw = value.data.currentDay;

  if (!isSeasonId(currentSeasonRaw)) {
    return { ok: false, error: "'data.currentSeason' ist ungültig." };
  }

  if (typeof currentDayRaw !== "number" || !Number.isInteger(currentDayRaw)) {
    return { ok: false, error: "'data.currentDay' muss eine ganze Zahl sein." };
  }

  if (currentDayRaw < 1 || currentDayRaw > 28) {
    return { ok: false, error: "'data.currentDay' muss zwischen 1 und 28 liegen." };
  }

  if (!Array.isArray(bedsRaw)) {
    return { ok: false, error: "'data.beds' muss ein Array sein." };
  }

  const bedIds = new Set<string>();
  const beds: BedLayout[] = [];
  for (const bed of bedsRaw) {
    if (!isValidBedLayout(bed)) {
      return { ok: false, error: "Mindestens ein Beet in 'data.beds' ist ungültig." };
    }

    if (bedIds.has(bed.id)) {
      return { ok: false, error: "Doppelte Beet-ID in 'data.beds'." };
    }

    bedIds.add(bed.id);
    beds.push({
      ...bed,
      sprinklers: typeof bed.sprinklers === "number" ? bed.sprinklers : 0,
      fertilizer: isFertilizerType(bed.fertilizer) ? bed.fertilizer : "none",
    });
  }

  if (!isRecord(plantingsRaw)) {
    return { ok: false, error: "'data.plantings' muss ein Objekt sein." };
  }

  const validatedPlantings: Record<SeasonId, PlantingsByBed> = {
    spring: {},
    summer: {},
    fall: {},
    winter: {},
  };

  for (const season of SEASONS) {
    const seasonData = plantingsRaw[season];
    if (!isRecord(seasonData)) {
      return {
        ok: false,
        error: `Pflanzungen für '${season}' fehlen oder sind ungültig.`,
      };
    }

    for (const [bedId, plantingsValue] of Object.entries(seasonData)) {
      if (!bedIds.has(bedId)) {
        return {
          ok: false,
          error: `Pflanzungen referenzieren unbekannte Beet-ID '${bedId}'.`,
        };
      }

      if (!Array.isArray(plantingsValue)) {
        return {
          ok: false,
          error: `Pflanzungen für Beet '${bedId}' in '${season}' müssen ein Array sein.`,
        };
      }

      for (const planting of plantingsValue) {
        if (!isValidPlanting(planting)) {
          return {
            ok: false,
            error: `Ungültige Pflanzung für Beet '${bedId}' in '${season}'.`,
          };
        }
      }

      validatedPlantings[season][bedId] = plantingsValue.map((planting) => ({ ...planting }));
    }

    for (const bedId of bedIds) {
      if (!validatedPlantings[season][bedId]) {
        validatedPlantings[season][bedId] = [];
      }
    }
  }

  return {
    ok: true,
    value: {
      version: SFP_VERSION,
      format: SFP_FORMAT,
      exportDate: value.exportDate,
      data: {
        currentSeason: currentSeasonRaw,
        currentDay: currentDayRaw,
        beds,
        plantings: validatedPlantings,
      },
    },
  };
}

export function convertSfpToSeasonBeds(sfpFile: SfpFile): Record<SeasonId, Bed[]> {
  const { beds, plantings } = sfpFile.data;

  const createBedsForSeason = (season: SeasonId): Bed[] => {
    return beds.map((bed) => ({
      ...bed,
      plantings: (plantings[season][bed.id] ?? []).map((planting) => ({ ...planting })),
    }));
  };

  return {
    spring: createBedsForSeason("spring"),
    summer: createBedsForSeason("summer"),
    fall: createBedsForSeason("fall"),
    winter: createBedsForSeason("winter"),
  };
}
