import type { Color, PieceSymbol } from "chess.js";
import { cn } from "@/lib/utils";

const NAMES: Record<PieceSymbol, string> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

export function Piece({
  color,
  type,
  className,
  ghost,
}: {
  color: Color;
  type: PieceSymbol;
  className?: string;
  ghost?: boolean;
}) {
  const file = `${color}${type.toUpperCase()}`;
  return (
    <img
      src={`/pieces/${file}.svg`}
      alt={`${color === "w" ? "White" : "Black"} ${NAMES[type]}`}
      draggable={false}
      className={cn(
        "piece-img pointer-events-none select-none",
        ghost && "piece-ghost",
        className,
      )}
    />
  );
}
