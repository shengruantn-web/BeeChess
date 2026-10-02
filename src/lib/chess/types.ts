import type { PieceSymbol, Square } from "chess.js";

export type AgeGroup = "kids" | "teens" | "adults";

export type EngineKind = "blunder" | "stockfish";

export type GameStatus = "player" | "engine" | "over";

export type GameResultKind = "checkmate" | "stalemate" | "draw";

export type GameResult = {
  kind: GameResultKind;
  winner: "player" | "bee" | null;
  reason: string;
};

export type AgeProfile = {
  id: AgeGroup;
  label: string;
  ages: string;
  tagline: string;
  difficulty: string;
  engine: EngineKind;
  /** Stockfish Skill Level 0–20. ~10 ≈ 1500 Elo. */
  skill: number;
  /** Search depth cap for Stockfish / minimax fallback. */
  depth: number;
  /** Thinking budget in milliseconds. */
  movetime: number;
  /** 0–1: chance the bot ignores the best move (kids). */
  blunderRate: number;
  highlights: boolean;
  dangerWarn: boolean;
  takebacks: boolean;
  showCaptured: boolean;
  showMoves: boolean;
  autoQueen: boolean;
};

export type LanMove = {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
};

export type LastMove = {
  from: Square;
  to: Square;
};

export type PendingDanger = {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
};

export type CapturedTray = {
  player: PieceSymbol[];
  bee: PieceSymbol[];
};
