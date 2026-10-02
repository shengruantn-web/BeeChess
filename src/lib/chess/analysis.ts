import { Chess, type Move, type PieceSymbol } from "chess.js";
export const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};
const VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
export type Suggestion = {
  from: string;
  to: string;
  promotion?: PieceSymbol;
  san: string;
  score: number;
  explanation: string;
};
export type Moment = {
  ply: number;
  fen: string;
  played: string;
  suggested: Suggestion;
  loss: number;
  title: string;
  explanation: string;
};
function evaluation(chess: Chess): number {
  if (chess.isCheckmate()) return -100000;
  if (chess.isDraw()) return 0;
  const side = chess.turn();
  let score = 0;
  for (const row of chess.board())
    for (const piece of row) {
      if (!piece) continue;
      const file = piece.square.charCodeAt(0) - 97;
      const rank = Number(piece.square[1]);
      const center = 7 - Math.abs(file - 3.5) - Math.abs(rank - 4.5);
      const advance = piece.color === "w" ? rank - 2 : 7 - rank;
      const position =
        piece.type === "p"
          ? advance * 9 + center * 3
          : ["n", "b"].includes(piece.type)
            ? center * 9
            : 0;
      score += (VALUES[piece.type] + position) * (piece.color === side ? 1 : -1);
    }
  return score;
}
function ordered(chess: Chess): Move[] {
  return chess.moves({ verbose: true }).sort((a, b) => {
    const priority = (m: Move) =>
      (m.captured ? VALUES[m.captured] * 10 - VALUES[m.piece] : 0) +
      (m.promotion ? VALUES[m.promotion] : 0) +
      (m.san.includes("#") ? 100000 : 0);
    return priority(b) - priority(a);
  });
}
const timedOut = Symbol("search deadline");
function search(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
): number {
  if (performance.now() > deadline) throw timedOut;
  if (depth === 0 || chess.isGameOver()) return evaluation(chess);
  let best = -Infinity;
  for (const move of ordered(chess)) {
    chess.move(move);
    let value: number;
    try {
      value = -search(chess, depth - 1, -beta, -alpha, deadline);
    } finally {
      chess.undo();
    }
    best = Math.max(best, value);
    alpha = Math.max(alpha, value);
    if (alpha >= beta) break;
  }
  return Number.isFinite(best) ? best : evaluation(chess);
}
export function explainMove(move: Move): string {
  if (move.san.includes("#"))
    return "This move gives checkmate: the king is attacked and has no legal escape.";
  if (move.promotion)
    return `Your pawn promotes to a ${PIECE_NAMES[move.promotion]}, adding a powerful new piece.`;
  if (move.isKingsideCastle() || move.isQueensideCastle())
    return "Castling moves the king toward safety and brings your rook into play.";
  if (move.captured)
    return `This captures a ${PIECE_NAMES[move.captured]}${move.san.includes("+") ? " and gives check" : ""}. Check the possible recaptures before you commit.`;
  if (move.san.includes("+"))
    return "This gives check, so your opponent must deal with the threat to their king.";
  return `Move your ${PIECE_NAMES[move.piece]} from ${move.from} to ${move.to}. This is a promising continuation in a short search.`;
}
export function rankMoves(fen: string, maxDepth = 2, budget = 350): Suggestion[] {
  const chess = new Chess(fen);
  if (chess.isGameOver()) return [];
  const moves = ordered(chess);
  const deadline = performance.now() + budget;
  let completed: Suggestion[] = [];
  for (let depth = 1; depth <= maxDepth; depth++) {
    const scores: Suggestion[] = [];
    try {
      for (const move of moves) {
        chess.move(move);
        let score: number;
        try {
          score = -search(chess, depth - 1, -Infinity, Infinity, depth === 1 ? Infinity : deadline);
        } finally {
          chess.undo();
        }
        scores.push({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: move.san,
          score,
          explanation: explainMove(move),
        });
      }
      completed = scores.sort((a, b) => b.score - a.score);
    } catch (error) {
      if (error !== timedOut) throw error;
      break;
    }
    if (performance.now() > deadline) break;
  }
  return completed;
}
export function reviewGame(
  pgn: string,
  playerColor: "w" | "b",
  progress?: (done: number, total: number) => void,
): Moment[] {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const history = chess.history({ verbose: true });
  const candidates: Moment[] = [];
  const own = history
    .map((move, ply) => ({ move, ply }))
    .filter(({ move }) => move.color === playerColor);
  for (let i = 0; i < own.length; i++) {
    const { move, ply } = own[i];
    const ranked = rankMoves(move.before, 2, 140);
    const best = ranked[0];
    const actual = ranked.find(
      (m) => m.from === move.from && m.to === move.to && m.promotion === move.promotion,
    );
    if (!best || !actual) continue;
    const loss = Math.max(0, best.score - actual.score);
    candidates.push({
      ply,
      fen: move.before,
      played: move.san,
      suggested: best,
      loss,
      title: loss >= 150 ? "An opportunity to revisit" : "A move to build on",
      explanation:
        loss >= 150
          ? `${move.san} scored below ${best.san} in this short search. Try the suggested continuation and compare the position.`
          : explainMove(move),
    });
    progress?.(i + 1, own.length);
  }
  if (!candidates.length) return [];
  const good = [...candidates].sort((a, b) => a.loss - b.loss || b.ply - a.ply)[0];
  const missed = [...candidates].filter((m) => m !== good).sort((a, b) => b.loss - a.loss)[0];
  const practice = [...candidates]
    .filter((m) => m !== good && m !== missed)
    .sort((a, b) => b.loss - a.loss)[0];
  return [good, missed, practice]
    .filter((x): x is Moment => !!x)
    .map((m, i) => ({ ...m, title: i === 2 ? "Your next practice position" : m.title }));
}
