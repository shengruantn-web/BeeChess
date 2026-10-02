import { Chess, type Color } from "chess.js";
import { DEFAULT_SETTINGS, validSettings, type Settings } from "./settings";
export type SavedGame = { settings: Settings; playerColor: Color; pgn: string; updatedAt: number };
export type Progress = {
  version: 2;
  settings: Settings;
  stars: Record<string, number>;
  savedGame: SavedGame | null;
};
export const STORAGE_KEY = "bee-chess-v2";
export const freshProgress = (): Progress => ({
  version: 2,
  settings: { ...DEFAULT_SETTINGS },
  stars: {},
  savedGame: null,
});
export function readProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (value?.version !== 2) return freshProgress();
    const stars: Record<string, number> = {};
    for (const [id, score] of Object.entries(value.stars || {})) {
      if (/^\d+$/.test(id) && typeof score === "number" && [1, 2, 3].includes(score))
        stars[id] = score;
    }
    let savedGame: SavedGame | null = null;
    if (
      value.savedGame &&
      validSettings(value.savedGame.settings) &&
      ["w", "b"].includes(value.savedGame.playerColor) &&
      typeof value.savedGame.pgn === "string" &&
      value.savedGame.pgn.length < 100000
    ) {
      const chess = new Chess();
      chess.loadPgn(value.savedGame.pgn);
      savedGame = { ...value.savedGame, updatedAt: Number(value.savedGame.updatedAt) || 0 };
    }
    return {
      version: 2,
      settings: validSettings(value.settings) ? value.settings : { ...DEFAULT_SETTINGS },
      stars,
      savedGame,
    };
  } catch {
    return freshProgress();
  }
}
export function writeProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
