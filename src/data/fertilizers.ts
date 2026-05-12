import type { Fertilizer } from "./types";

export const FERTILIZERS: Fertilizer[] = [
  { id: "none", label: "Kein Dünger", bonus: 0, color: "#b9b1a2" },
  { id: "speed_gro", label: "Speed-Gro", bonus: 0.1, color: "#9bcf8f" },
  { id: "deluxe_speed_gro", label: "Deluxe Speed-Gro", bonus: 0.25, color: "#e6c36f" },
  { id: "hyper_speed_gro", label: "Hyper Speed-Gro", bonus: 0.33, color: "#d88bb0" },
];
