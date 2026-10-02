import { Chess, type PieceSymbol, type Square } from "chess.js";
import type { AgeProfile, LanMove } from "./types";
import { stockfish } from "./stockfish";

type MiniRes = {
  id: number;
  from?: string;
  to?: string;
  promotion?: PieceSymbol;
  error?: string;
};

let mini: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (res: MiniRes) => void>();

function getMini(): Worker | null {
  if (typeof window === "undefined") return null;
  if (mini) return mini;
  try {
    mini = new Worker(new URL("./minimax.worker.ts", import.meta.url), {
      type: "module",
    });
    mini.onmessage = (event: MessageEvent<MiniRes>) => {
      const resolve = pending.get(event.data.id);
      if (resolve) {
        pending.delete(event.data.id);
        resolve(event.data);
      }
    };
    mini.onerror = () => {
      /* caller falls back */
    };
    return mini;
  } catch {
    mini = null;
    return null;
  }
}

function lanToMove(lan: string): LanMove | null {
  const match = lan.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/i);
  if (!match) return null;
  return {
    from: match[1] as Square,
    to: match[2] as Square,
    promotion: match[3]?.toLowerCase() as PieceSymbol | undefined,
  };
}

const BLACK_REPLIES: Record<string, string[]> = {
  e4: ["e5", "c5", "e6", "c6"],
  d4: ["d5", "Nf6", "e6"],
  c4: ["e5", "c5", "Nf6"],
  Nf3: ["d5", "Nf6", "c5"],
};

/** Infer White's first move from the position — FEN has no SAN history. */
function openingKey(chess: Chess): string | null {
  const isWhite = (sq: Square, type: PieceSymbol) => {
    const piece = chess.get(sq);
    return piece?.type === type && piece.color === "w";
  };
  if (isWhite("e4", "p") && !chess.get("e2")) return "e4";
  if (isWhite("d4", "p") && !chess.get("d2")) return "d4";
  if (isWhite("c4", "p") && !chess.get("c2")) return "c4";
  if (isWhite("f3", "n") && !chess.get("g1")) return "Nf3";
  return null;
}

function bookMove(fen: string): LanMove | null {
  const chess = new Chess(fen);
  if (chess.turn() !== "b") return null;
  if (chess.moveNumber() !== 1) return null;
  const key = openingKey(chess);
  const replies = key ? BLACK_REPLIES[key] : undefined;
  if (!replies?.length) return null;
  const san = replies[Math.floor(Math.random() * replies.length)];
  try {
    const played = chess.move(san);
    return {
      from: played.from,
      to: played.to,
      promotion: played.promotion,
    };
  } catch {
    return null;
  }
}

function randomCaptureBias(fen: string): LanMove {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  const captures = moves.filter((m) => m.captured);
  const pool = captures.length && Math.random() < 0.55 ? captures : moves;
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? moves[0];
  return { from: pick.from, to: pick.to, promotion: pick.promotion };
}

function minimaxMove(
  fen: string,
  profile: AgeProfile,
): Promise<LanMove | null> {
  const worker = getMini();
  if (!worker) return Promise.resolve(null);
  const id = nextId;
  nextId += 1;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      resolve(null);
    }, profile.movetime + 3500);
    pending.set(id, (res) => {
      window.clearTimeout(timer);
      if (!res.from || !res.to) {
        resolve(null);
        return;
      }
      resolve({
        from: res.from as Square,
        to: res.to as Square,
        promotion: res.promotion,
      });
    });
    worker.postMessage({
      id,
      fen,
      depth: profile.depth,
      movetime: profile.movetime,
      blunderRate: profile.blunderRate,
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function pickBeeMove(
  fen: string,
  profile: AgeProfile,
): Promise<LanMove> {
  const think = 280 + Math.random() * Math.max(200, profile.movetime * 0.5);
  const wait = delay(think);

  if (profile.engine === "blunder") {
    const booked = Math.random() < 0.7 ? bookMove(fen) : null;
    await wait;
    if (booked) return booked;
    const searched = await minimaxMove(fen, { ...profile, depth: 1 });
    if (searched) return searched;
    return randomCaptureBias(fen);
  }

  const stock = stockfish.go({
    fen,
    skill: profile.skill,
    depth: profile.depth,
    movetime: profile.movetime,
  });
  const [lan] = await Promise.all([stock, wait]);
  if (lan) {
    const parsed = lanToMove(lan);
    if (parsed) return parsed;
  }

  const booked = bookMove(fen);
  if (booked && profile.id === "teens") return booked;

  const searched = await minimaxMove(fen, {
    ...profile,
    depth: Math.min(profile.depth, 3),
    blunderRate: profile.blunderRate,
  });
  if (searched) return searched;
  return randomCaptureBias(fen);
}

export function warmupEngines(): void {
  void stockfish.init();
  getMini();
}
