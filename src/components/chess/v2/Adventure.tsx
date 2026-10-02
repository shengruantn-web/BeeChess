import { useState } from "react";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import { ArrowLeft, ArrowRight, Lightbulb, RotateCcw, Star, CheckCircle2 } from "lucide-react";
import { LESSONS, WORLDS, type Lesson } from "@/lib/chess/adventure";
import { gameProfile, type Settings } from "@/lib/chess/settings";
import { Board } from "../Board";
import { sfx } from "@/lib/chess/audio";
import type { LastMove, PendingDanger } from "@/lib/chess/types";

export function Adventure({
  lesson,
  settings,
  onBack,
  onComplete,
  onNext,
}: {
  lesson: Lesson;
  settings: Settings;
  onBack: () => void;
  onComplete: (id: number, stars: number) => void;
  onNext: () => void;
}) {
  const [chess] = useState(() => new Chess(lesson.fen));
  const [fen, setFen] = useState(lesson.fen);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [hint, setHint] = useState(0);
  const [maxHint, setMaxHint] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("Take your time. You play White.");
  const [promotion, setPromotion] = useState<PendingDanger | null>(null);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [shake, setShake] = useState(0);
  const done = index >= lesson.line.length;
  const stars = maxHint === 3 ? 1 : maxHint > 0 || mistakes > 0 ? 2 : 3;
  const profile = gameProfile({ ...settings, assistance: "guided" });
  const legal = selected ? chess.moves({ square: selected, verbose: true }) : [];
  const expected = !done
    ? (() => {
        const c = new Chess(fen);
        return c.move(lesson.line[index]);
      })()
    : null;
  const commit = (from: Square, to: Square, promote?: PieceSymbol) => {
    if (done) return;
    const candidate = new Chess(fen);
    let move;
    try {
      move = candidate.move({ from, to, promotion: promote });
    } catch {
      setFeedback("That move is not legal. Select a piece to see its moves.");
      return;
    }
    setPromotion(null);
    if (move.san !== lesson.line[index]) {
      setMistakes((n) => n + 1);
      setShake((n) => n + 1);
      sfx.illegal();
      setFeedback(
        `That is legal, but try a move that meets the goal: ${lesson.goal.toLowerCase()}`,
      );
      setSelected(null);
      return;
    }
    const played = chess.move(move);
    let next = index + 1;
    if (next < lesson.line.length) {
      chess.move(lesson.line[next]);
      next++;
    }
    setLastMove({ from: played.from, to: played.to });
    setFen(chess.fen());
    setSelected(null);
    setHint(0);
    setIndex(next);
    sfx.move();
    if (next >= lesson.line.length) {
      setFeedback(lesson.takeaway);
      onComplete(lesson.id, stars);
      sfx.win();
    } else setFeedback(`Good move! Bee replied ${lesson.line[next - 1]}. Now finish the idea.`);
  };
  const tryMove = (from: Square, to: Square) => {
    const moves = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (moves.some((m) => m.promotion)) {
      setPromotion({ from, to });
      return;
    }
    commit(from, to);
  };
  const select = (square: Square) => {
    if (done || promotion) return;
    if (selected && legal.some((m) => m.to === square)) {
      tryMove(selected, square);
      return;
    }
    setSelected(chess.get(square)?.color === "w" ? square : null);
  };
  const reset = () => {
    chess.load(lesson.fen);
    setFen(lesson.fen);
    setIndex(0);
    setSelected(null);
    setHint(0);
    setMaxHint(0);
    setMistakes(0);
    setPromotion(null);
    setLastMove(null);
    setFeedback("Fresh start. You play White.");
  };
  return (
    <main className="app-root adventure-screen" data-theme={settings.theme}>
      <header className="lesson-top">
        <button className="ghost-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Adventure map
        </button>
        <span>
          {WORLDS[lesson.world].name} · Level {lesson.id} of 20
        </span>
        <button className="icon-btn" onClick={reset} aria-label="Restart lesson">
          <RotateCcw size={18} />
        </button>
      </header>
      <div className="lesson-layout">
        <section className="board-wrap">
          <div className="lesson-board-heading">
            <span className="eyebrow">{done ? "Lesson complete" : "Your challenge"}</span>
            <h1>{lesson.title}</h1>
            <p>{lesson.goal}</p>
          </div>
          <Board
            board={chess.board()}
            profile={profile}
            selected={selected}
            legal={legal}
            lastMove={lastMove}
            hintMove={hint === 3 && expected ? { from: expected.from, to: expected.to } : null}
            checkSquare={
              chess.isCheck() ? chess.findPiece({ color: chess.turn(), type: "k" })[0] : null
            }
            pendingDanger={null}
            promotion={promotion}
            status={done ? "over" : "player"}
            shake={shake}
            onSelect={select}
            onDrop={tryMove}
            onPromote={(p) => promotion && commit(promotion.from, promotion.to, p)}
            onCancelPromote={() => setPromotion(null)}
          />
        </section>
        <aside className="lesson-coach side-card">
          <div className="who">
            <img className="who-photo" src="/mascots/bee-kids.jpg" alt="Bee your coach" />
            <div>
              <p className="who-name">Let’s learn together.</p>
              <p className="who-sub">One idea at a time.</p>
            </div>
          </div>
          <p className="lesson-explainer">{lesson.lesson}</p>
          <div className={done ? "lesson-success" : "commentary"} aria-live="polite">
            {done && <CheckCircle2 size={24} />}
            <p>{done ? "You’ve got it!" : "Bee says"}</p>
            <span>{feedback}</span>
          </div>
          {done ? (
            <>
              <div className="earned-stars" aria-label={`${stars} of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <Star key={n} size={32} fill={n <= stars ? "currentColor" : "none"} />
                ))}
              </div>
              <p className="muted">
                {stars === 3
                  ? "Solved independently. Beautiful work."
                  : stars === 2
                    ? "You learned the idea. Replay without hints for three stars."
                    : "Lesson complete. Try again when you’re ready to solve it yourself."}
              </p>
              <button className="solid-btn" onClick={onNext}>
                {lesson.id === LESSONS.length ? "Return to the hive" : "Next challenge"}
                <ArrowRight size={16} />
              </button>
              <button className="ghost-btn" onClick={reset}>
                Practice again
              </button>
            </>
          ) : (
            <>
              {hint > 0 && (
                <div className="hint-copy" aria-live="polite">
                  <span className="eyebrow">Hint {hint} of 3</span>
                  <p>
                    {index === 0
                      ? lesson.hints[hint - 1]
                      : hint === 1
                        ? "Return to the goal. The first move has prepared your next one."
                        : hint === 2
                          ? `Look at the piece on ${expected?.from}.`
                          : `Play ${expected?.san}: ${expected?.from} to ${expected?.to}.`}
                  </p>
                </div>
              )}
              <button
                className="ghost-btn"
                disabled={hint === 3}
                onClick={() => {
                  const next = Math.min(3, hint + 1);
                  setHint(next);
                  setMaxHint((n) => Math.max(n, next));
                }}
              >
                <Lightbulb size={17} />
                {hint === 0
                  ? "Give me a hint"
                  : hint < 3
                    ? "Another nudge"
                    : "Solution highlighted"}
              </button>
              <small>
                3 stars: solve independently · 2: learn with help · 1: follow the solution
              </small>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
