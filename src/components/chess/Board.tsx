import { useRef, useState } from "react";
import type { Color, Move, Piece as ChessPiece, PieceSymbol, Square } from "chess.js";
import { Piece } from "./Piece";
import { cn } from "@/lib/utils";
import type { AgeProfile, LastMove, PendingDanger } from "@/lib/chess/types";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

type DragState = {
  from: Square;
  piece: ChessPiece;
  x: number;
  y: number;
  size: number;
  dragging: boolean;
};

export function Board({
  board,
  playerColor = "w",
  orientation = playerColor,
  hintMove,
  profile,
  selected,
  legal,
  lastMove,
  checkSquare,
  pendingDanger,
  promotion,
  status,
  shake,
  onSelect,
  onDrop,
  onPromote,
  onCancelPromote,
}: {
  board: ({ square: Square; type: PieceSymbol; color: Color } | null)[][];
  playerColor?: Color;
  orientation?: Color;
  hintMove?: LastMove | null;
  profile: AgeProfile;
  selected: Square | null;
  legal: Move[];
  lastMove: LastMove | null;
  checkSquare: Square | null;
  pendingDanger: PendingDanger | null;
  promotion: PendingDanger | null;
  status: "player" | "engine" | "over";
  shake: number;
  onSelect: (square: Square) => void;
  onDrop: (from: Square, to: Square) => void;
  onPromote: (piece: PieceSymbol) => void;
  onCancelPromote: () => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const skipClick = useRef(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverSq, setHoverSq] = useState<Square | null>(null);
  const legalTo = new Set(legal.map((m) => m.to));
  const captureTo = new Set(legal.filter((m) => m.captured).map((m) => m.to));
  const locked = status !== "player";
  const ranks = orientation === "w" ? [...RANKS] : [...RANKS].reverse();
  const files = orientation === "w" ? [...FILES] : [...FILES].reverse();

  const squareAt = (clientX: number, clientY: number): Square | null => {
    const el = document.elementFromPoint(clientX, clientY);
    const sq = el?.closest("[data-square]")?.getAttribute("data-square");
    return (sq as Square | undefined) ?? null;
  };

  const endDrag = () => {
    setDrag(null);
    setHoverSq(null);
  };

  return (
    <div className={cn("board-frame", shake > 0 && "is-shake")} key={shake}>
      <div className="board-ranks" aria-hidden="true">
        {ranks.map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
      <div className="board-stack">
        <div
          ref={boardRef}
          className={cn("board", locked && "is-locked")}
          role="grid"
          aria-label={`Chessboard, you play ${playerColor === "w" ? "white" : "black"}`}
          onPointerMove={(e) => {
            if (!drag) return;
            const dx = e.clientX - drag.x;
            const dy = e.clientY - drag.y;
            const dragging = drag.dragging || dx * dx + dy * dy > 36;
            setDrag({
              ...drag,
              x: e.clientX,
              y: e.clientY,
              dragging,
            });
            if (dragging) {
              const over = squareAt(e.clientX, e.clientY);
              if (over !== hoverSq) setHoverSq(over);
            }
          }}
          onPointerUp={(e) => {
            if (!drag) return;
            const target = squareAt(e.clientX, e.clientY);
            if (drag.dragging && target && target !== drag.from) {
              skipClick.current = true;
              onDrop(drag.from, target);
            }
            endDrag();
          }}
          onPointerCancel={endDrag}
        >
          {ranks.map((rank, r) =>
            files.map((file, f) => {
              const square = `${file}${rank}` as Square;
              const piece = board[8 - rank]?.[FILES.indexOf(file)] ?? null;
              const dark = (r + f) % 2 === 1;
              const isLegal = legalTo.has(square);
              const isCapture = captureTo.has(square);
              return (
                <button
                  key={square}
                  type="button"
                  data-square={square}
                  role="gridcell"
                  aria-label={square}
                  disabled={locked && !promotion}
                  className={cn(
                    "sq",
                    dark ? "sq-dark" : "sq-light",
                    selected === square && "is-selected",
                    hintMove && (hintMove.from === square || hintMove.to === square) && "is-hint",
                    lastMove && (lastMove.from === square || lastMove.to === square) && "is-last",
                    checkSquare === square && "is-check",
                    pendingDanger?.to === square && "is-danger",
                    profile.highlights && isLegal && "is-legal",
                    profile.highlights && isCapture && "is-capture",
                    drag?.dragging && hoverSq === square && isLegal && "is-drop",
                  )}
                  onPointerDown={(e) => {
                    if (locked) return;
                    if (!piece || piece.color !== playerColor) return;
                    const rect = boardRef.current?.getBoundingClientRect();
                    const size = rect ? rect.width / 8 : 56;
                    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                    setDrag({
                      from: square,
                      piece,
                      x: e.clientX,
                      y: e.clientY,
                      size,
                      dragging: false,
                    });
                    onSelect(square);
                  }}
                  onClick={() => {
                    if (skipClick.current) {
                      skipClick.current = false;
                      return;
                    }
                    onSelect(square);
                  }}
                >
                  {piece && !(drag && drag.from === square && drag.dragging) && (
                    <Piece color={piece.color} type={piece.type} />
                  )}
                  {profile.highlights && isLegal && !isCapture && !piece && (
                    <span className="legal-dot" />
                  )}
                </button>
              );
            }),
          )}
          {promotion && (
            <div className="promo-overlay" role="dialog" aria-label="Choose promotion">
              <div className="promo-card">
                <p>Promote pawn</p>
                <div className="promo-row">
                  {(["q", "r", "b", "n"] as PieceSymbol[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-label={`Promote to ${{ q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn", k: "king" }[type]}`}
                      className="promo-btn"
                      onClick={() => onPromote(type)}
                    >
                      <Piece color={playerColor} type={type} />
                    </button>
                  ))}
                </div>
                <button type="button" className="text-btn" onClick={onCancelPromote}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="board-files" aria-hidden="true">
          {files.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </div>
      {drag?.dragging && (
        <div
          className="drag-ghost"
          style={{
            width: drag.size,
            height: drag.size,
            left: drag.x,
            top: drag.y,
          }}
        >
          <Piece color={drag.piece.color} type={drag.piece.type} ghost />
        </div>
      )}
    </div>
  );
}
