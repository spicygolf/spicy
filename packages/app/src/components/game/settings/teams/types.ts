import type { RoundToGame } from "spicylib/schema";

export interface PlayerRoundItem {
  id: string;
  roundToGame: RoundToGame;
  playerName: string;
  handicap?: string;
}

export interface TeamSection {
  teamNumber: number;
  teamName: string;
  players: PlayerRoundItem[];
}

export interface RotationOption {
  value: number;
  label: string;
  description: string;
}

export type RotationChangeOption = "keep" | "clearExceptFirst" | "clearAll";
