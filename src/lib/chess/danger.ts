import { Chess, type PieceSymbol, type Square } from "chess.js";

/** True when the moved piece can be captured on the next ply. */
export function movesIntoDanger(
  fen: string,
  from: Square,
  to: Square,
  promotion?: PieceSymbol,
): boolean {
  const copy = new Chess(fen);
  try {
    copy.move({ from, to, promotion: promotion ?? "q" });
  } catch {
    return false;
  }
  const replies = copy.moves({ verbose: true });
  return replies.some((move) => move.to === to && Boolean(move.captured));
}

export function needsPromotion(fen: string, from: Square, to: Square): boolean {
  const copy = new Chess(fen);
  const piece = copy.get(from);
  if (!piece || piece.type !== "p") return false;
  const rank = to[1];
  return piece.color === "w" ? rank === "8" : rank === "1";
}
