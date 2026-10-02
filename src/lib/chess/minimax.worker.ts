/**
 * Alpha-beta + piece-square tables, used when Stockfish is unavailable
 * and for the kids 1-ply "Bee is learning" personality.
 */
import { Chess, type Move, type PieceSymbol } from "chess.js";

type Req = {
  id: number;
  fen: string;
  depth: number;
  movetime: number;
  blunderRate: number;
};

type Res = {
  id: number;
  from?: string;
  to?: string;
  promotion?: PieceSymbol;
  error?: string;
};

const VALUE: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const PST: Record<PieceSymbol, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5,
    10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20,
    -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10,
    0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10,
    5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0,
    -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10,
    -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0,
    0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0,
    5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0,
    0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
    -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30,
    -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0,
    10, 30, 20,
  ],
};

let deadline = 0;

function idx(file: number, rankFromWhite: number): number {
  return rankFromWhite * 8 + file;
}

function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) return -100000;
  if (chess.isDraw()) return 0;
  let score = 0;
  const rows = chess.board();
  for (let r = 0; r < 8; r += 1) {
    for (let f = 0; f < 8; f += 1) {
      const piece = rows[r]?.[f];
      if (!piece) continue;
      const rankFromWhite = 7 - r;
      const tableIndex = piece.color === "w" ? idx(f, rankFromWhite) : idx(f, 7 - rankFromWhite);
      const pst = PST[piece.type][tableIndex] ?? 0;
      const val = VALUE[piece.type] + pst;
      score += piece.color === "w" ? val : -val;
    }
  }
  score += chess.moves().length * (chess.turn() === "w" ? 2 : -2);
  return score * (chess.turn() === "w" ? 1 : -1);
}

function order(moves: Move[]): Move[] {
  return moves
    .map((move) => {
      let s = 0;
      if (move.captured) {
        s += 10 * VALUE[move.captured] - VALUE[move.piece];
      }
      if (move.promotion) s += VALUE[move.promotion];
      return { move, s };
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.move);
}

function quiesce(chess: Chess, alpha: number, beta: number, qdepth: number): number {
  const stand = evaluate(chess);
  if (performance.now() > deadline || chess.isGameOver()) return stand;
  if (qdepth <= 0) return stand;
  if (stand >= beta) return beta;
  let a = Math.max(alpha, stand);
  const captures = order(chess.moves({ verbose: true })).filter((m) => m.captured);
  for (const move of captures) {
    chess.move(move);
    const score = -quiesce(chess, -beta, -a, qdepth - 1);
    chess.undo();
    if (score >= beta) return beta;
    if (score > a) a = score;
  }
  return a;
}

function negamax(chess: Chess, depth: number, alpha: number, beta: number): number {
  if (performance.now() > deadline) return evaluate(chess);
  if (chess.isGameOver()) return evaluate(chess);
  if (depth <= 0) return quiesce(chess, alpha, beta, 4);
  let a = alpha;
  let best = -Infinity;
  const moves = order(chess.moves({ verbose: true }));
  if (moves.length === 0) return evaluate(chess);
  for (const move of moves) {
    chess.move(move);
    const score = -negamax(chess, depth - 1, -beta, -a);
    chess.undo();
    if (score > best) best = score;
    if (score > a) a = score;
    if (a >= beta) break;
  }
  return best;
}

function search(req: Req): Res {
  const chess = new Chess(req.fen);
  const moves = order(chess.moves({ verbose: true }));
  if (moves.length === 0) {
    return { id: req.id, error: "no moves" };
  }
  deadline = performance.now() + Math.max(80, req.movetime);
  const scored: { move: Move; score: number }[] = [];
  const maxDepth = Math.max(1, req.depth);

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    if (performance.now() > deadline && scored.length) break;
    scored.length = 0;
    let alpha = -Infinity;
    const beta = Infinity;
    for (const move of moves) {
      chess.move(move);
      const raw = -negamax(chess, depth - 1, -beta, -alpha);
      chess.undo();
      const score = raw;
      scored.push({ move, score });
      if (raw > alpha) alpha = raw;
    }
    scored.sort((a, b) => b.score - a.score);
  }

  if (!scored.length) {
    const fallback = moves[0];
    return {
      id: req.id,
      from: fallback.from,
      to: fallback.to,
      promotion: fallback.promotion,
    };
  }

  let pick = scored[0];
  if (req.blunderRate > 0 && Math.random() < req.blunderRate && scored.length > 1) {
    const weakStart = Math.max(1, Math.floor(scored.length * 0.4));
    const pool = scored.slice(weakStart);
    pick = pool[Math.floor(Math.random() * pool.length)] ?? scored[scored.length - 1];
  } else if (req.blunderRate > 0 && scored.length > 1 && Math.random() < 0.22) {
    pick = scored[1] ?? scored[0];
  }

  return {
    id: req.id,
    from: pick.move.from,
    to: pick.move.to,
    promotion: pick.move.promotion,
  };
}

type MiniPort = {
  onmessage: ((event: MessageEvent<Req>) => void) | null;
  postMessage: (message: Res) => void;
};

const workerScope = self as unknown as MiniPort;

workerScope.onmessage = (event: MessageEvent<Req>) => {
  try {
    workerScope.postMessage(search(event.data));
  } catch (err) {
    workerScope.postMessage({
      id: event.data.id,
      error: err instanceof Error ? err.message : "search failed",
    });
  }
};
