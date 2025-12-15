import type { RotationOption } from "./types";

export function getRotationLabel(value: number | null | undefined): string {
  if (value === undefined || value === null) return "Not set";
  if (value === 0) return "Never";
  if (value === 1) return "Every hole";
  return `Every ${value} holes`;
}

export const ROTATION_OPTIONS: RotationOption[] = [
  { value: 0, label: "Never", description: "Teams stay the same all game" },
  { value: 1, label: "Every 1", description: "Teams change every hole" },
  { value: 3, label: "Every 3", description: "Teams change every 3 holes" },
  { value: 6, label: "Every 6", description: "Teams change every 6 holes" },
  {
    value: -1,
    label: "Custom",
    description: "Enter custom rotation frequency",
  },
];
