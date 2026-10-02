import type { Color } from "chess.js";
import type { AgeGroup, AgeProfile } from "./types";
import { AGE_PROFILES } from "./profiles";

export type Difficulty = "beginner" | "casual" | "challenging" | "advanced";
export type Assistance = "guided" | "hints" | "none";
export type Settings = {
  theme: AgeGroup;
  difficulty: Difficulty;
  assistance: Assistance;
  side: Color | "random";
};
export const DEFAULT_SETTINGS: Settings = {
  theme: "adults",
  difficulty: "casual",
  assistance: "guided",
  side: "w",
};
export const THEME_NAMES = { kids: "Playful", teens: "Neon", adults: "Classic" };
export const DIFFICULTIES: Record<
  Difficulty,
  { label: string; description: string; base: AgeGroup; skill: number; depth: number }
> = {
  beginner: {
    label: "Beginner",
    description: "A gentle place to start",
    base: "kids",
    skill: 0,
    depth: 1,
  },
  casual: {
    label: "Casual",
    description: "A friendly challenge",
    base: "teens",
    skill: 3,
    depth: 5,
  },
  challenging: {
    label: "Challenging",
    description: "Think a few moves ahead",
    base: "teens",
    skill: 8,
    depth: 9,
  },
  advanced: {
    label: "Advanced",
    description: "Bring your best game",
    base: "adults",
    skill: 16,
    depth: 14,
  },
};
export function gameProfile(settings: Settings): AgeProfile {
  const difficulty = DIFFICULTIES[settings.difficulty];
  return {
    ...AGE_PROFILES[difficulty.base],
    id: settings.theme,
    label: THEME_NAMES[settings.theme],
    difficulty: difficulty.label,
    skill: difficulty.skill,
    depth: difficulty.depth,
    highlights: settings.assistance === "guided",
    dangerWarn: settings.assistance === "guided",
    takebacks: settings.assistance !== "none",
    showCaptured: true,
    showMoves: true,
    autoQueen: false,
  };
}
export function validSettings(value: unknown): value is Settings {
  if (!value || typeof value !== "object") return false;
  const s = value as Settings;
  return (
    ["kids", "teens", "adults"].includes(s.theme) &&
    Object.keys(DIFFICULTIES).includes(s.difficulty) &&
    ["guided", "hints", "none"].includes(s.assistance) &&
    ["w", "b", "random"].includes(s.side)
  );
}
