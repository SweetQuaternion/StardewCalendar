import type { Fertilizer, QualityFertilizerType, RetainingFertilizerType } from "./types";

export const FERTILIZERS: Fertilizer[] = [
  { id: "none", label: "Kein Dünger", bonus: 0, color: "#b9b1a2" },
  { id: "speed_gro", label: "Geschwind-Wachs", bonus: 0.1, color: "#9bcf8f" },
  { id: "deluxe_speed_gro", label: "Luxus-Geschwind-Wachs", bonus: 0.25, color: "#e6c36f" },
  { id: "hyper_speed_gro", label: "Hyper-Speed-Zücht", bonus: 0.33, color: "#d88bb0" },
];

export const QUALITY_FERTILIZER_LEVEL: Record<QualityFertilizerType, number> = {
  none: 0,
  basic: 1,
  quality: 2,
  deluxe: 3,
};

export const QUALITY_FERTILIZERS: {
  id: QualityFertilizerType;
  label: string;
  color: string;
  imageFile: string;
}[] = [
  { id: "none", label: "Kein Qualitäts-Dünger", color: "#ccc", imageFile: "" },
  { id: "basic", label: "Standarddünger", color: "#c8e6b0", imageFile: "Basic_Fertilizer.png" },
  {
    id: "quality",
    label: "Qualitätsdünger",
    color: "#f0d080",
    imageFile: "Quality_Fertilizer.png",
  },
  { id: "deluxe", label: "Deluxe-Dünger", color: "#d0a8f8", imageFile: "Deluxe_Fertilizer.png" },
];

export const RETAINING_FERTILIZERS: {
  id: RetainingFertilizerType;
  label: string;
  imageFile: string;
  color: string;
}[] = [
  { id: "none", label: "Kein Hydrogel", imageFile: "", color: "#ccc" },
  {
    id: "basic",
    label: "Hydrogel (Standard)",
    imageFile: "Basic_Retaining_Soil.png",
    color: "#b0d4f0",
  },
  {
    id: "quality",
    label: "Hydrogel (Qualität)",
    imageFile: "Quality_Retaining_Soil.png",
    color: "#80b8e8",
  },
  {
    id: "deluxe",
    label: "Deluxe-Hydro-Boden",
    imageFile: "Deluxe_Retaining_Soil.png",
    color: "#5090d0",
  },
];
