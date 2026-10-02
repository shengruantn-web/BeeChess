import { useCallback, useEffect, useRef, useState } from "react";
import type { Color } from "chess.js";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Flag,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { BeeMark } from "./BeeMark";
import { Piece } from "./Piece";
import { GameScreen } from "./GameScreen";
import { Adventure } from "./v2/Adventure";
import { Modal } from "./v2/Modal";
import { LESSONS, WORLDS } from "@/lib/chess/adventure";
import {
  DIFFICULTIES,
  THEME_NAMES,
  type Settings,
  type Difficulty,
  type Assistance,
} from "@/lib/chess/settings";
import {
  freshProgress,
  readProgress,
  writeProgress,
  type Progress,
  type SavedGame,
} from "@/lib/chess/storage";
import { unlockAudio } from "@/lib/chess/audio";

type Screen =
  | { kind: "home" }
  | { kind: "lesson"; id: number }
  | { kind: "match"; game: SavedGame; key: number };
export function ChessApp() {
  const [progress, setProgress] = useState<Progress>(freshProgress);
  const progressRef = useRef(progress);
  const [ready, setReady] = useState(false);
  const [saveOk, setSaveOk] = useState(true);
  const [screen, setScreen] = useState<Screen>({ kind: "home" });
  const [confirmReplace, setConfirmReplace] = useState(false);
  useEffect(() => {
    const loaded = readProgress();
    progressRef.current = loaded;
    setProgress(loaded);
    setReady(true);
  }, []);
  const update = useCallback((fn: (p: Progress) => Progress) => {
    const next = fn(progressRef.current);
    progressRef.current = next;
    setProgress(next);
    setSaveOk(writeProgress(next));
  }, []);
  const changeSettings = (patch: Partial<Settings>) =>
    update((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
  const home = () => {
    setScreen({ kind: "home" });
    window.scrollTo(0, 0);
  };
  const launchLesson = (id: number) => {
    unlockAudio();
    setScreen({ kind: "lesson", id });
    window.scrollTo(0, 0);
  };
  const startGame = () => {
    unlockAudio();
    const settings = progressRef.current.settings;
    const playerColor: Color =
      settings.side === "random" ? (Math.random() < 0.5 ? "w" : "b") : settings.side;
    const game = { settings: { ...settings }, playerColor, pgn: "", updatedAt: Date.now() };
    update((p) => ({ ...p, savedGame: game }));
    setScreen({ kind: "match", game, key: Date.now() });
    setConfirmReplace(false);
    window.scrollTo(0, 0);
  };
  const saveGame = useCallback(
    (pgn: string) =>
      update((p) =>
        p.savedGame ? { ...p, savedGame: { ...p.savedGame, pgn, updatedAt: Date.now() } } : p,
      ),
    [update],
  );
  const totalStars = Object.values(progress.stars).reduce((sum, n) => sum + n, 0);
  const completed = LESSONS.filter((l) => progress.stars[l.id]).length;
  const nextLesson = LESSONS.find((l) => !progress.stars[l.id]) || LESSONS[0];
  if (screen.kind === "lesson")
    return (
      <Adventure
        key={screen.id}
        lesson={LESSONS[screen.id - 1]}
        settings={progress.settings}
        onBack={home}
        onComplete={(id, stars) =>
          update((p) => ({ ...p, stars: { ...p.stars, [id]: Math.max(p.stars[id] || 0, stars) } }))
        }
        onNext={() => (screen.id === LESSONS.length ? home() : launchLesson(screen.id + 1))}
      />
    );
  if (screen.kind === "match")
    return (
      <GameScreen
        key={screen.key}
        settings={screen.game.settings}
        playerColor={screen.game.playerColor}
        initialPgn={screen.game.pgn}
        onSave={saveGame}
        onBack={home}
        saveOk={saveOk}
      />
    );
  return (
    <div data-theme="brand" className="app-root hive-home">
      <header className="hive-header">
        <a className="hive-brand" href="#" aria-label="Play Chess with Bee home">
          <BeeMark />
          <span>
            Play Chess <em>with Bee</em>
          </span>
          <span className="version-tag">V2</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#adventure">Adventure</a>
          <a href="#play">
            Play Bee <ArrowRight size={15} />
          </a>
        </nav>
      </header>
      <main className="hive-main">
        <section className="hive-hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="small-rule" /> A chess partner that grows with you
            </p>
            <h1>
              Little moves.
              <br />
              <em>Big adventures.</em>
            </h1>
            <p>
              Find your next good move with Bee. Explore four worlds, learn one idea at a time, and
              bring it to the board.
            </p>
            <div className="banner-row">
              <button
                className="solid-btn hero-button"
                disabled={!ready}
                onClick={() => launchLesson(nextLesson.id)}
              >
                {completed === 20
                  ? "Revisit the adventure"
                  : completed
                    ? "Continue adventure"
                    : "Start your adventure"}
                <ArrowRight size={18} />
              </button>
              <span className="hero-caption">20 challenges. Your own pace.</span>
            </div>
          </div>
          <div className="hero-art">
            <img
              src="/mascots/bee-hero.jpg"
              alt="Bee, your friendly chess companion"
              width={480}
              height={480}
            />
            <div className="hero-art-caption">
              <span>YOUR NEXT MOVE STARTS HERE</span>
              <span>01 — 20</span>
            </div>
          </div>
        </section>
        <section className="progress-strip" aria-label="Adventure progress">
          <div>
            <Flag size={20} />
            <span>
              <strong>
                {completed}
                <small> / 20</small>
              </strong>{" "}
              challenges completed
            </span>
          </div>
          <div>
            <Star size={20} />
            <span>
              <strong>
                {totalStars}
                <small> / 60</small>
              </strong>{" "}
              stars collected
            </span>
          </div>
          <div>
            <BookOpen size={20} />
            <span>
              <strong>
                {completed === 20 ? "All four worlds" : WORLDS[nextLesson.world].name}
              </strong>
              {completed === 20 ? " Ready to revisit" : " Your next chapter"}
            </span>
          </div>
          <span className="device-note">
            <ShieldCheck size={15} /> Saved on this device
          </span>
        </section>
        {!saveOk && (
          <p className="storage-warning" role="status">
            Device storage is unavailable. You can keep playing, but progress will not survive
            closing this tab.
          </p>
        )}
        <div className="hive-columns">
          <section id="adventure" className="adventure-map">
            <div className="section-heading">
              <div>
                <p className="eyebrow">The adventure</p>
                <h2>A little wiser at every stop.</h2>
              </div>
              <span className="map-count">{completed}/20</span>
            </div>
            {completed === 20 && (
              <div className="journey-complete">
                <Trophy />
                <div>
                  <strong>The hive is yours.</strong>
                  <p>
                    You finished every challenge. Revisit a level for more stars, or put your skills
                    to work against Bee.
                  </p>
                </div>
              </div>
            )}
            {WORLDS.map((world, wi) => {
              const lessons = LESSONS.filter((l) => l.world === wi);
              const worldCompleted = lessons.every((l) => progress.stars[l.id]);
              return (
                <section
                  className={`world-card ${worldCompleted ? "world-complete" : ""}`}
                  key={world.name}
                  aria-label={world.name}
                >
                  <div className="world-heading">
                    <span className="world-piece">
                      <Piece color="w" type={world.piece} />
                    </span>
                    <div>
                      <p className="eyebrow">Chapter 0{wi + 1}</p>
                      <h3>{world.name}</h3>
                      <p>{world.subtitle}</p>
                    </div>
                    <span className="world-status">
                      {worldCompleted ? (
                        <Check size={18} />
                      ) : (
                        `${lessons.filter((l) => progress.stars[l.id]).length}/5`
                      )}
                    </span>
                  </div>
                  <div className="level-path">
                    {lessons.map((lesson) => {
                      const unlocked = lesson.id === 1 || !!progress.stars[lesson.id - 1];
                      const score = progress.stars[lesson.id] || 0;
                      return (
                        <div
                          className={`level-stop ${unlocked ? "unlocked" : "locked"} ${score ? "completed" : ""}`}
                          key={lesson.id}
                        >
                          <button
                            className="level-node"
                            disabled={!ready || !unlocked}
                            aria-label={`Level ${lesson.id}: ${lesson.title}${!unlocked ? `. Complete level ${lesson.id - 1} to unlock` : score ? `. ${score} stars` : ""}`}
                            onClick={() => launchLesson(lesson.id)}
                          >
                            {score ? (
                              <Check size={22} />
                            ) : unlocked ? (
                              lesson.id
                            ) : (
                              <LockKeyhole size={17} />
                            )}
                          </button>
                          <span className="level-name">{lesson.title}</span>
                          <span className="level-stars" aria-label={`${score} of 3 stars`}>
                            {[1, 2, 3].map((n) => (
                              <Star key={n} size={11} fill={n <= score ? "currentColor" : "none"} />
                            ))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </section>
          <aside id="play" className="play-sidebar">
            <section className="play-card">
              <div className="section-heading">
                <p className="eyebrow">
                  <Play size={14} /> The practice board
                </p>
                <span className="live-dot" />
              </div>
              <h2>Just you and Bee.</h2>
              <p className="muted">A friendly match, set up your way.</p>
              {progress.savedGame && (
                <button
                  className="resume-card"
                  onClick={() => {
                    unlockAudio();
                    setScreen({ kind: "match", game: progress.savedGame!, key: Date.now() });
                    window.scrollTo(0, 0);
                  }}
                >
                  <span>
                    <strong>Resume your saved game</strong>
                    <small>
                      {DIFFICULTIES[progress.savedGame.settings.difficulty].label} · You play{" "}
                      {progress.savedGame.playerColor === "w" ? "White" : "Black"}
                    </small>
                  </span>
                  <ChevronRight size={20} />
                </button>
              )}
              <fieldset>
                <legend>Playing strength</legend>
                <div className="difficulty-options">
                  {Object.entries(DIFFICULTIES).map(([id, item]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={progress.settings.difficulty === id}
                      className={`setting-option ${progress.settings.difficulty === id ? "selected" : ""}`}
                      onClick={() => changeSettings({ difficulty: id as Difficulty })}
                    >
                      <span>
                        {item.label}
                        <small>{item.description}</small>
                      </span>
                      <span className="radio-mark">
                        {progress.settings.difficulty === id && <span />}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="select-setting">
                Bee’s help
                <select
                  value={progress.settings.assistance}
                  onChange={(e) => changeSettings({ assistance: e.target.value as Assistance })}
                >
                  <option value="guided">Guided · hints & danger warnings</option>
                  <option value="hints">Hints only when I ask</option>
                  <option value="none">Unassisted · no hints or takebacks</option>
                </select>
              </label>
              <fieldset>
                <legend>Your side</legend>
                <div className="segmented">
                  {(["w", "b", "random"] as const).map((side) => (
                    <button
                      key={side}
                      aria-pressed={progress.settings.side === side}
                      className={progress.settings.side === side ? "selected" : ""}
                      onClick={() => changeSettings({ side })}
                    >
                      {side === "w" ? "White" : side === "b" ? "Black" : "Random"}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>
                  Board style <span>Independent of difficulty</span>
                </legend>
                <div className="theme-options">
                  {(["kids", "teens", "adults"] as const).map((theme) => (
                    <button
                      key={theme}
                      className={progress.settings.theme === theme ? "selected" : ""}
                      aria-pressed={progress.settings.theme === theme}
                      onClick={() => changeSettings({ theme })}
                    >
                      <span className={`theme-swatch swatch-${theme}`} />
                      {THEME_NAMES[theme]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <button
                className="solid-btn full-button"
                disabled={!ready}
                onClick={() => (progress.savedGame?.pgn ? setConfirmReplace(true) : startGame())}
              >
                Play a new game
                <ArrowRight size={17} />
              </button>
              <p className="play-foot">No clock. No pressure. Room to think.</p>
            </section>
            <section className="coach-teaser">
              <Sparkles size={21} />
              <div>
                <h3>Meet your second chance.</h3>
                <p>
                  Review your game with Bee, discover the moments that mattered, and try a better
                  move.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>
      <footer className="hive-footer">
        <BeeMark />
        <span>A little practice. A little courage. A better next move.</span>
      </footer>
      {confirmReplace && (
        <Modal
          title="Start a new game?"
          description="This replaces your saved match. Your adventure stars will stay safe."
          onClose={() => setConfirmReplace(false)}
        >
          <div className="banner-row">
            <button className="ghost-btn" onClick={() => setConfirmReplace(false)}>
              Keep saved game
            </button>
            <button className="solid-btn" onClick={startGame}>
              Start new game
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
