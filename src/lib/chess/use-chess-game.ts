import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Move, type PieceSymbol, type Square, type Color } from "chess.js";
import { movesIntoDanger, needsPromotion } from "./danger";
import { pickBeeMove, warmupEngines } from "./engine";
import { gameProfile, type Settings } from "./settings";
import { sfx } from "./audio";
import type { GameResult, LastMove, PendingDanger } from "./types";

export function resultFrom(chess: Chess, playerColor: Color): GameResult | null {
  if (!chess.isGameOver()) return null;
  if (chess.isCheckmate()) {
    const winner = chess.turn() !== playerColor ? "player" : "bee";
    return {
      kind: "checkmate",
      winner,
      reason: winner === "player" ? "Checkmate — you win." : "Checkmate — Bee wins.",
    };
  }
  if (chess.isStalemate())
    return { kind: "stalemate", winner: null, reason: "Stalemate — neither side wins." };
  const reason = chess.isThreefoldRepetition()
    ? "Draw by repetition."
    : chess.isInsufficientMaterial()
      ? "Draw — insufficient material."
      : chess.isDrawByFiftyMoves()
        ? "Draw — fifty-move rule."
        : "Draw.";
  return { kind: "draw", winner: null, reason };
}
export function useChessGame(
  settings: Settings,
  playerColor: Color,
  initialPgn = "",
  onSave?: (pgn: string) => void,
) {
  const profile = useMemo(() => gameProfile(settings), [settings]);
  const [chess] = useState(() => {
    const c = new Chess();
    if (initialPgn) {
      try {
        c.loadPgn(initialPgn);
      } catch {
        c.reset();
      }
    }
    return c;
  });
  const [fen, setFen] = useState(chess.fen());
  const [epoch, setEpoch] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingDanger, setPendingDanger] = useState<PendingDanger | null>(null);
  const [promotion, setPromotion] = useState<PendingDanger | null>(null);
  const [commentary, setCommentary] = useState("Find your next move.");
  const [shake, setShake] = useState(0);
  const generation = useRef(0);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const result = resultFrom(chess, playerColor);
  const status: "over" | "player" | "engine" = result
    ? "over"
    : chess.turn() === playerColor
      ? "player"
      : "engine";
  const history = chess.history({ verbose: true });
  const last = history.at(-1);
  const lastMove: LastMove | null = last ? { from: last.from, to: last.to } : null;
  const legal = selected ? chess.moves({ square: selected, verbose: true }) : [];
  const checkSquare = chess.isCheck()
    ? chess.findPiece({ type: "k", color: chess.turn() })[0]
    : null;
  const sync = useCallback(
    (voice = "Your move.") => {
      setSelected(null);
      setPendingDanger(null);
      setPromotion(null);
      setFen(chess.fen());
      setCommentary(voice);
      const over = resultFrom(chess, playerColor);
      if (over?.winner === "player") sfx.win();
      else if (over?.winner === "bee") sfx.lose();
      else if (over) sfx.draw();
    },
    [chess, playerColor],
  );
  const applyMove = useCallback(
    (from: Square, to: Square, promote?: PieceSymbol) => {
      if (chess.turn() !== playerColor || chess.isGameOver()) return;
      try {
        const move = chess.move({ from, to, promotion: promote });
        if (move.captured) sfx.capture();
        else sfx.move();
        sync(chess.isCheck() ? "Check! Bee has to respond." : "Bee is thinking…");
      } catch {
        sfx.illegal();
        setShake((n) => n + 1);
      }
    },
    [chess, playerColor, sync],
  );
  const tryPlayerMove = useCallback(
    (from: Square, to: Square) => {
      if (chess.turn() !== playerColor || chess.isGameOver()) return;
      if (!chess.moves({ square: from, verbose: true }).some((m) => m.to === to)) {
        sfx.illegal();
        setShake((n) => n + 1);
        return;
      }
      if (needsPromotion(chess.fen(), from, to)) {
        setPromotion({ from, to });
        return;
      }
      if (profile.dangerWarn && movesIntoDanger(chess.fen(), from, to)) {
        setPendingDanger({ from, to });
        sfx.warn();
        return;
      }
      applyMove(from, to);
    },
    [applyMove, chess, playerColor, profile.dangerWarn],
  );
  const selectSquare = (square: Square) => {
    if (status !== "player" || promotion) return;
    setPendingDanger(null);
    if (selected && legal.some((m) => m.to === square)) {
      tryPlayerMove(selected, square);
      return;
    }
    setSelected(chess.get(square)?.color === playerColor ? square : null);
  };
  const choosePromotion = (piece: PieceSymbol) => {
    if (!promotion || !["q", "r", "b", "n"].includes(piece)) return;
    if (profile.dangerWarn && movesIntoDanger(chess.fen(), promotion.from, promotion.to, piece)) {
      setPendingDanger({ ...promotion, promotion: piece });
      setPromotion(null);
      return;
    }
    applyMove(promotion.from, promotion.to, piece);
  };
  const undo = () => {
    if (!profile.takebacks || status === "engine" || !history.some((m) => m.color === playerColor))
      return;
    generation.current++;
    chess.undo();
    if (chess.turn() !== playerColor) chess.undo();
    sync("Try a different idea.");
  };
  const newGame = () => {
    generation.current++;
    chess.reset();
    setEpoch((n) => n + 1);
    sync(playerColor === "w" ? "Your move." : "Bee plays first.");
  };
  useEffect(() => {
    warmupEngines();
  }, []);
  useEffect(() => {
    saveRef.current?.(chess.pgn());
  }, [chess, fen, epoch]);
  useEffect(() => {
    if (status !== "engine") return;
    const gen = generation.current;
    let cancelled = false;
    void (async () => {
      let move;
      try {
        move = await pickBeeMove(fen, profile);
      } catch {
        move = undefined;
      }
      if (
        cancelled ||
        gen !== generation.current ||
        chess.turn() === playerColor ||
        chess.isGameOver()
      )
        return;
      let played: Move;
      try {
        if (!move) throw new Error("No move");
        played = chess.move(move);
      } catch {
        const fallback = chess.moves({ verbose: true })[0];
        if (!fallback) return;
        played = chess.move(fallback);
      }
      if (played.captured) sfx.capture();
      else sfx.move();
      sync(chess.isCheck() ? "Check! Keep your king safe." : "Your move.");
    })();
    return () => {
      cancelled = true;
    };
  }, [chess, epoch, fen, playerColor, profile, status, sync]);
  const captured: { player: PieceSymbol[]; bee: PieceSymbol[] } = { player: [], bee: [] };
  for (const move of history)
    if (move.captured) captured[move.color === playerColor ? "bee" : "player"].push(move.captured);
  const sanPairs = [];
  for (let i = 0; i < history.length; i += 2)
    sanPairs.push({ n: i / 2 + 1, white: history[i].san, black: history[i + 1]?.san });
  return {
    profile,
    fen,
    board: chess.board(),
    selected,
    legal,
    status,
    result,
    lastMove,
    pendingDanger,
    promotion,
    history,
    captured,
    sanPairs,
    commentary: result?.reason || commentary,
    shake,
    checkSquare: checkSquare || null,
    playerColor,
    pgn: chess.pgn(),
    selectSquare,
    tryPlayerMove,
    choosePromotion,
    undo,
    newGame,
    confirmDanger: () =>
      pendingDanger && applyMove(pendingDanger.from, pendingDanger.to, pendingDanger.promotion),
    cancelDanger: () => setPendingDanger(null),
    cancelPromotion: () => setPromotion(null),
  };
}
