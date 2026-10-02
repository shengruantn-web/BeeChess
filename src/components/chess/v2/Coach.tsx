import { useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Lightbulb } from "lucide-react";
import { startAnalysis } from "@/lib/chess/coach";
import { PIECE_NAMES, type Suggestion } from "@/lib/chess/analysis";
import type { LastMove } from "@/lib/chess/types";
export function Coach({
  fen,
  disabled,
  onHighlight,
}: {
  fen: string;
  disabled: boolean;
  onHighlight: (move: LastMove | null) => void;
}) {
  const [step, setStep] = useState(0);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const task = useRef<ReturnType<typeof startAnalysis<Suggestion>> | null>(null);
  const generation = useRef(0);
  const highlightRef = useRef(onHighlight);
  highlightRef.current = onHighlight;
  useEffect(() => {
    generation.current++;
    task.current?.cancel();
    task.current = null;
    setStep(0);
    setSuggestion(null);
    setBusy(false);
    setError("");
    highlightRef.current(null);
    return () => {
      generation.current++;
      task.current?.cancel();
    };
  }, [fen]);
  const request = async () => {
    if (busy || disabled) return;
    if (suggestion) {
      const next = Math.min(3, step + 1);
      setStep(next);
      if (next === 3) onHighlight({ from: suggestion.from as Square, to: suggestion.to as Square });
      return;
    }
    const gen = generation.current;
    setBusy(true);
    setError("");
    try {
      const work = startAnalysis<Suggestion>({ kind: "hint", fen });
      task.current = work;
      const move = await work.promise;
      if (gen !== generation.current) return;
      setSuggestion(move);
      setStep(1);
    } catch (e) {
      if (gen === generation.current) setError((e as Error).message);
    } finally {
      if (gen === generation.current) setBusy(false);
    }
  };
  const chess = new Chess(fen);
  const piece = suggestion ? chess.get(suggestion.from as Square) : null;
  const clue = chess.isCheck()
    ? "Your king is in check. Look for a capture, a block, or a safe escape."
    : suggestion?.san.includes("#")
      ? "There is a checkmate available. Look at the king’s escape squares."
      : suggestion?.san.includes("x")
        ? "Look for a capture. Check what your opponent could recapture."
        : "Look for an active move. Consider checks, threats, and the center.";
  return (
    <section className="coach-panel" aria-label="Bee Coach">
      <p className="eyebrow">
        <Lightbulb size={16} /> Bee Coach
      </p>
      <p aria-live="polite">
        {busy
          ? "Bee is studying your position…"
          : error ||
            (step === 0
              ? "A little nudge, when you need one. Hints reveal one step at a time."
              : step === 1
                ? clue
                : step === 2
                  ? `Look at your ${piece ? PIECE_NAMES[piece.type] : "piece"} on ${suggestion?.from}. Where could it help most?`
                  : `${suggestion?.san}: ${suggestion?.explanation}`)}
      </p>
      <button className="ghost-btn" disabled={disabled || busy || step === 3} onClick={request}>
        <Lightbulb size={16} />
        {busy
          ? "Thinking…"
          : step === 0
            ? "Give me a hint"
            : step === 1
              ? "Which piece?"
              : step === 2
                ? "Show the move"
                : "Move highlighted"}
        {step > 0 && ` · ${step}/3`}
      </button>
      {step > 0 && <small>A short engine search; explore the idea before moving.</small>}
    </section>
  );
}
