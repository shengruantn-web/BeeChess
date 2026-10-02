import { useEffect, useMemo, useState } from "react";
import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { startAnalysis } from "@/lib/chess/coach";
import type { Moment } from "@/lib/chess/analysis";
import { gameProfile, type Settings } from "@/lib/chess/settings";
import { Board } from "../Board";
import type { PendingDanger } from "@/lib/chess/types";
export function Review({
  pgn,
  settings,
  playerColor,
  onClose,
}: {
  pgn: string;
  settings: Settings;
  playerColor: Color;
  onClose: () => void;
}) {
  const history = useMemo(() => {
    const c = new Chess();
    c.loadPgn(pgn);
    return c.history({ verbose: true });
  }, [pgn]);
  const [cursor, setCursor] = useState(history.length);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [progress, setProgress] = useState("Finding your learning moments…");
  const [error, setError] = useState("");
  const [moment, setMoment] = useState<Moment | null>(null);
  const [practiceFen, setPracticeFen] = useState<string | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<PendingDanger | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [attempted, setAttempted] = useState(false);
  useEffect(() => {
    let active = true;
    const task = startAnalysis<Moment[]>(
      { kind: "review", pgn, color: playerColor },
      (done, total) => {
        if (active) setProgress(`Reviewing your moves · ${done}/${total}`);
      },
    );
    void task.promise
      .then((result) => {
        if (active) {
          setMoments(result);
          setProgress("");
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setProgress("");
        }
      });
    return () => {
      active = false;
      task.cancel();
    };
  }, [pgn, playerColor]);
  const fen =
    practiceFen ||
    (cursor === 0 ? history[0]?.before || new Chess().fen() : history[cursor - 1].after);
  const chess = new Chess(fen);
  const legal = selected ? chess.moves({ square: selected, verbose: true }) : [];
  const practice = (m: Moment) => {
    setMoment(m);
    setCursor(m.ply);
    setPracticeFen(m.fen);
    setSelected(null);
    setPromotion(null);
    setAttempted(false);
    setShowSuggestion(false);
    setFeedback("Try a move in this position. Your saved game stays as it was.");
  };
  const commit = (from: Square, to: Square, promote?: PieceSymbol) => {
    if (!practiceFen || !moment || attempted) return;
    try {
      const played = chess.move({ from, to, promotion: promote });
      setPracticeFen(chess.fen());
      setSelected(null);
      setPromotion(null);
      setAttempted(true);
      setShowSuggestion(false);
      setFeedback(
        played.san === moment.suggested.san
          ? `You found ${played.san}. ${moment.suggested.explanation}`
          : `${played.san} is legal. Bee suggested ${moment.suggested.san}. Reset the position to compare that idea.`,
      );
    } catch {
      setFeedback("Try a legal move. Select a piece to see its moves.");
    }
  };
  const tryMove = (from: Square, to: Square) => {
    if (chess.moves({ square: from, verbose: true }).some((m) => m.to === to && m.promotion)) {
      setPromotion({ from, to });
      return;
    }
    commit(from, to);
  };
  const navigate = (next: number) => {
    setCursor(next);
    setPracticeFen(null);
    setMoment(null);
    setSelected(null);
    setPromotion(null);
    setShowSuggestion(false);
    setFeedback("");
  };
  return (
    <main className="app-root adventure-screen" data-theme={settings.theme}>
      <header className="lesson-top">
        <button className="ghost-btn" onClick={onClose}>
          <ArrowLeft size={16} /> Back to game
        </button>
        <span>Learn from your game</span>
      </header>
      <div className="lesson-layout">
        <section className="board-wrap">
          <div className="lesson-board-heading">
            <p className="eyebrow">Bee’s notebook</p>
            <h1>Every game teaches you.</h1>
            <p>
              {practiceFen
                ? "Try the position again."
                : cursor === 0
                  ? "Starting position"
                  : `After ${Math.ceil(cursor / 2)}${cursor % 2 ? "." : "…"} ${history[cursor - 1].san}`}
            </p>
          </div>
          <Board
            board={chess.board()}
            profile={gameProfile({ ...settings, assistance: "guided" })}
            playerColor={playerColor}
            selected={selected}
            legal={legal}
            lastMove={!practiceFen && cursor > 0 ? history[cursor - 1] : null}
            hintMove={
              showSuggestion && moment
                ? { from: moment.suggested.from as Square, to: moment.suggested.to as Square }
                : null
            }
            checkSquare={
              chess.isCheck() ? chess.findPiece({ color: chess.turn(), type: "k" })[0] : null
            }
            pendingDanger={null}
            promotion={promotion}
            status={practiceFen && !attempted ? "player" : "over"}
            shake={0}
            onSelect={(square) => {
              if (selected && legal.some((m) => m.to === square)) tryMove(selected, square);
              else setSelected(chess.get(square)?.color === playerColor ? square : null);
            }}
            onDrop={tryMove}
            onPromote={(p) => promotion && commit(promotion.from, promotion.to, p)}
            onCancelPromote={() => setPromotion(null)}
          />
          <div className="replay-controls">
            <button
              className="icon-btn"
              aria-label="Previous move"
              disabled={cursor === 0}
              onClick={() => navigate(cursor - 1)}
            >
              <ChevronLeft size={20} />
            </button>
            <label>
              Move {cursor} / {history.length}
              <input
                type="range"
                aria-label="Replay position"
                min={0}
                max={history.length}
                value={cursor}
                onChange={(e) => navigate(Number(e.target.value))}
              />
            </label>
            <button
              className="icon-btn"
              aria-label="Next move"
              disabled={cursor === history.length}
              onClick={() => navigate(cursor + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </section>
        <aside className="review-panel side-card">
          <p className="eyebrow">Your learning moments</p>
          <h2>Pause. Notice. Try again.</h2>
          <p className="muted">
            A quick engine review of your moves. Short searches offer practice ideas, not a complete
            assessment.
          </p>
          <p role="status">{progress || error}</p>
          {!progress && !error && moments.length === 0 && (
            <p>Make at least one move to create a learning moment.</p>
          )}
          {moments.map((m, i) => (
            <button
              key={m.ply}
              className={`moment-card ${moment === m ? "active" : ""}`}
              onClick={() => practice(m)}
            >
              <span className="eyebrow">
                0{i + 1} · Move {Math.floor(m.ply / 2) + 1} · {m.played}
              </span>
              <strong>{m.title}</strong>
              <span>{m.explanation}</span>
              <span className="moment-cta">
                Try this position <ChevronRight size={15} />
              </span>
            </button>
          ))}
          {moment && (
            <section className="coach-panel">
              <p aria-live="polite">{feedback}</p>
              <div className="banner-row">
                <button className="ghost-btn" onClick={() => practice(moment)}>
                  <RotateCcw size={15} /> Reset position
                </button>
                {!attempted && (
                  <button className="ghost-btn" onClick={() => setShowSuggestion(true)}>
                    Show suggested move
                  </button>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
