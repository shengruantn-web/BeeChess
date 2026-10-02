import { ArrowLeft, BookOpen, RotateCcw, Undo2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import type { Color } from "chess.js";
import { Board } from "./Board";
import { BeeMark } from "./BeeMark";
import { Piece } from "./Piece";
import { useChessGame } from "@/lib/chess/use-chess-game";
import { DIFFICULTIES, THEME_NAMES, type Settings } from "@/lib/chess/settings";
import type { LastMove } from "@/lib/chess/types";
import { setMuted, isMuted, unlockAudio } from "@/lib/chess/audio";
import { Coach } from "./v2/Coach";
import { Review } from "./v2/Review";
import { Modal } from "./v2/Modal";
export function GameScreen({
  settings,
  playerColor,
  initialPgn,
  onSave,
  onBack,
  saveOk,
}: {
  settings: Settings;
  playerColor: Color;
  initialPgn?: string;
  onSave: (pgn: string) => void;
  onBack: () => void;
  saveOk: boolean;
}) {
  const game = useChessGame(settings, playerColor, initialPgn, onSave);
  const [muted, setMutedUi] = useState(isMuted);
  const [hintMove, setHintMove] = useState<LastMove | null>(null);
  const [review, setReview] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const ownMoves = game.history.filter((m) => m.color === playerColor).length;
  if (review)
    return (
      <Review
        pgn={game.pgn}
        settings={settings}
        playerColor={playerColor}
        onClose={() => setReview(false)}
      />
    );
  return (
    <main data-theme={settings.theme} className="app-root game-root v2-game">
      <header className="game-top">
        <div className="game-brand">
          <button className="icon-btn" aria-label="Back to home" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <BeeMark className="text-accent size-8" />
          <div>
            <p className="brand-kicker">Play Chess with Bee</p>
            <p className="game-age-line">
              {DIFFICULTIES[settings.difficulty].label} · {THEME_NAMES[settings.theme]} ·{" "}
              {settings.assistance === "none"
                ? "Unassisted"
                : settings.assistance === "guided"
                  ? "Guided play"
                  : "Hints on request"}
            </p>
          </div>
        </div>
        <div className="game-actions">
          <button
            className="icon-btn"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={() => {
              unlockAudio();
              setMuted(!muted);
              setMutedUi(!muted);
            }}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {game.profile.takebacks && (
            <button
              className="ghost-btn"
              onClick={game.undo}
              disabled={game.status === "engine" || ownMoves === 0}
            >
              <Undo2 size={16} /> Take back
            </button>
          )}
          <button
            className="ghost-btn"
            onClick={() => setReview(true)}
            disabled={
              game.status === "engine" ||
              ownMoves === 0 ||
              (settings.assistance === "none" && !game.result)
            }
          >
            <BookOpen size={16} /> Review game
          </button>
          <button
            className="ghost-btn"
            onClick={() => (game.history.length ? setConfirmNew(true) : game.newGame())}
          >
            <RotateCcw size={16} /> New game
          </button>
        </div>
      </header>
      <div className="match-layout">
        <section className="board-wrap">
          <div className="opponent-strip">
            <div className="who">
              <img className="who-photo" src={`/mascots/bee-${settings.theme}.jpg`} alt="Bee" />
              <div>
                <p className="who-name">Bee</p>
                <p className="who-sub">
                  {playerColor === "w" ? "Black" : "White"} ·{" "}
                  {DIFFICULTIES[settings.difficulty].label}
                </p>
              </div>
            </div>
            <span className={`turn-indicator ${game.status === "engine" ? "active" : ""}`}>
              {game.status === "engine" ? "Thinking…" : "Your chess partner"}
            </span>
          </div>
          <Board
            {...game}
            hintMove={hintMove}
            onSelect={game.selectSquare}
            onDrop={game.tryPlayerMove}
            onPromote={game.choosePromotion}
            onCancelPromote={game.cancelPromotion}
          />
          <div className="opponent-strip">
            <div className="who">
              <span className="who-mark">{playerColor === "w" ? "W" : "B"}</span>
              <div>
                <p className="who-name">You</p>
                <p className="who-sub">{playerColor === "w" ? "White" : "Black"}</p>
              </div>
            </div>
            <span className={`turn-indicator ${game.status === "player" ? "active" : ""}`}>
              {game.status === "player"
                ? "Your turn"
                : game.status === "over"
                  ? "Game complete"
                  : "Bee’s turn"}
            </span>
          </div>
          {game.pendingDanger && (
            <div className="danger-banner" role="status">
              <p>Bee can capture that piece next. Play it anyway?</p>
              <div className="banner-row">
                <button className="solid-btn" onClick={game.confirmDanger}>
                  Play anyway
                </button>
                <button className="ghost-btn" onClick={game.cancelDanger}>
                  Pick another
                </button>
              </div>
            </div>
          )}
        </section>
        <aside className="match-sidebar">
          {game.result ? (
            <section className="side-card result-panel">
              <p className="eyebrow">{game.result.kind}</p>
              <h1>
                {game.result.winner === "player"
                  ? "You did it!"
                  : game.result.winner === "bee"
                    ? "A lesson for next time."
                    : "Shared honors."}
              </h1>
              <p>{game.result.reason}</p>
              <button
                className="solid-btn"
                onClick={() => setReview(true)}
                disabled={ownMoves === 0}
              >
                <BookOpen size={17} /> Learn from this game
              </button>
              <button className="ghost-btn" onClick={game.newGame}>
                Play again
              </button>
            </section>
          ) : (
            <section className="side-card">
              <div className="section-heading">
                <h2>Your next good move.</h2>
              </div>
              <p className="commentary" role="status">
                {game.commentary}
              </p>
              {settings.assistance !== "none" ? (
                <Coach
                  fen={game.fen}
                  disabled={game.status !== "player"}
                  onHighlight={setHintMove}
                />
              ) : (
                <p className="muted">
                  Unassisted play. Your game review will be available when you finish.
                </p>
              )}
            </section>
          )}
          <section className="side-card">
            <p className="eyebrow">Captured by you</p>
            <div className="tray-row">
              {game.captured.bee.length ? (
                game.captured.bee.map((p, i) => (
                  <span className="tray-piece" key={i}>
                    <Piece type={p} color={playerColor === "w" ? "b" : "w"} />
                  </span>
                ))
              ) : (
                <span className="muted">No captures yet.</span>
              )}
            </div>
            <p className="eyebrow">Captured by Bee</p>
            <div className="tray-row">
              {game.captured.player.length ? (
                game.captured.player.map((p, i) => (
                  <span className="tray-piece" key={i}>
                    <Piece type={p} color={playerColor} />
                  </span>
                ))
              ) : (
                <span className="muted">No captures yet.</span>
              )}
            </div>
          </section>
          <section className="side-card">
            <p className="eyebrow">
              Move notebook <span className="muted">{game.history.length} plies</span>
            </p>
            <ol className="move-list">
              {game.sanPairs.length === 0 ? (
                <li className="tray-empty">The story starts with your first move.</li>
              ) : (
                game.sanPairs.map((p) => (
                  <li key={p.n}>
                    <span className="mn">{p.n}.</span>
                    <span>{p.white}</span>
                    <span>{p.black || "…"}</span>
                  </li>
                ))
              )}
            </ol>
          </section>
          <p className="save-note" role="status">
            {saveOk
              ? "Your game saves automatically on this device."
              : "Device storage is unavailable. Keep this tab open to retain your game."}
          </p>
        </aside>
      </div>
      {confirmNew && (
        <Modal
          title="Start a fresh game?"
          description="Your current saved game will be replaced. You can review it first or keep playing."
          onClose={() => setConfirmNew(false)}
        >
          <div className="banner-row">
            <button className="ghost-btn" onClick={() => setConfirmNew(false)}>
              Keep playing
            </button>
            <button
              className="solid-btn"
              onClick={() => {
                setConfirmNew(false);
                setHintMove(null);
                game.newGame();
              }}
            >
              Start new game
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
