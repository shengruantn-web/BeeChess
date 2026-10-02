import { AGE_ORDER, AGE_PROFILES } from "@/lib/chess/profiles";
import type { AgeGroup } from "@/lib/chess/types";
import { BeeMark } from "./BeeMark";
import { unlockAudio, sfx } from "@/lib/chess/audio";

const MASCOT: Record<AgeGroup, { src: string; alt: string }> = {
  kids: { src: "/mascots/bee-kids.jpg", alt: "Friendly cartoon Bee" },
  teens: { src: "/mascots/bee-teens.jpg", alt: "Neon Bee" },
  adults: { src: "/mascots/bee-adults.jpg", alt: "Classic Bee" },
};

const FEATURES: Record<AgeGroup, string[]> = {
  kids: ["Legal moves light up", "Bee warns you about traps", "Takebacks allowed"],
  teens: ["Legal-move hints", "Captured-piece tray", "Medium Stockfish"],
  adults: ["No hints or takebacks", "Wooden board, quiet chrome", "Club-level Bee (~1500)"],
};

export function Onboarding({ onSelect }: { onSelect: (age: AgeGroup) => void }) {
  return (
    <div data-theme="brand" className="app-root onboarding">
      <div className="hive-wash" aria-hidden="true" />
      <header className="onb-top stagger-item">
        <BeeMark className="text-accent size-9" />
        <span className="brand-kicker">Play Chess with Bee</span>
      </header>

      <section className="onb-hero">
        <div className="onb-copy">
          <p className="eyebrow stagger-item">A chess partner that grows with you</p>
          <h1 className="stagger-item">Meet Bee. Pick how old you are.</h1>
          <p className="lede stagger-item">
            Bee changes the way the board looks, the help you get, and how hard
            the engine thinks — from first-game friendly to a quiet 1500-rated
            opponent.
          </p>
        </div>
        <div className="onb-portrait stagger-item">
          <img
            src="/mascots/bee-hero.jpg"
            alt="Bee, the chess opponent"
            width={1408}
            height={1408}
          />
        </div>
      </section>

      <div className="age-grid">
        {AGE_ORDER.map((id, i) => {
          const profile = AGE_PROFILES[id];
          const mascot = MASCOT[id];
          return (
            <button
              key={id}
              type="button"
              data-age={id}
              className="age-card stagger-item"
              style={{ animationDelay: `${120 + i * 80}ms` }}
              onClick={() => {
                unlockAudio();
                sfx.ui();
                onSelect(id);
              }}
            >
              <span className="age-photo">
                <img src={mascot.src} alt={mascot.alt} width={1408} height={1408} />
              </span>
              <span className="age-meta">
                <span className="age-range">{profile.ages}</span>
                <span className="age-title">{profile.label}</span>
                <span className="age-diff">{profile.difficulty}</span>
                <span className="age-tag">{profile.tagline}</span>
                <ul>
                  {FEATURES[id].map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </span>
              <span className="age-cta">Play as {profile.label}</span>
            </button>
          );
        })}
      </div>

      <p className="onb-foot stagger-item">
        You always play White. Bee plays Black. You can switch ages after any game.
      </p>
    </div>
  );
}
