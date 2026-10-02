/**
 * Stockfish 10 (nmrugg/niklasf JS build) running as a classic Web Worker.
 * Skill Level ≈ Elo band: 0 ~800, 6 ~1200, 10 ~1500, 20 max.
 * Falls back by rejecting so the caller can run minimax.
 */

type Listener = (line: string) => void;

class StockfishEngine {
  private worker: Worker | null = null;
  private listeners = new Set<Listener>();
  private ready: Promise<boolean> | null = null;
  private usable = false;

  private onMessage = (event: MessageEvent<unknown>) => {
    const line =
      typeof event.data === "string" ? event.data : event.data != null ? String(event.data) : "";
    if (!line) return;
    for (const listener of this.listeners) listener(line);
  };

  private attach(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private send(cmd: string): void {
    this.worker?.postMessage(cmd);
  }

  private waitFor(pred: (line: string) => boolean, ms: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        stop();
        reject(new Error("stockfish timeout"));
      }, ms);
      const stop = this.attach((line) => {
        if (!pred(line)) return;
        window.clearTimeout(timer);
        stop();
        resolve(line);
      });
    });
  }

  async init(): Promise<boolean> {
    if (this.ready) return this.ready;
    this.ready = this.boot();
    return this.ready;
  }

  private async boot(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      this.worker = new Worker("/engines/stockfish.js");
      this.worker.addEventListener("message", this.onMessage);
      this.worker.addEventListener("error", () => {
        this.usable = false;
      });
      this.send("uci");
      await this.waitFor((line) => line.includes("uciok"), 8000);
      this.send("isready");
      await this.waitFor((line) => line.includes("readyok"), 8000);
      this.usable = true;
      return true;
    } catch {
      this.dispose();
      this.usable = false;
      return false;
    }
  }

  private queue: Promise<unknown> = Promise.resolve();

  go(opts: {
    fen: string;
    skill: number;
    depth: number;
    movetime: number;
  }): Promise<string | null> {
    const next = this.queue.then(() => this.search(opts));
    this.queue = next.catch(() => null);
    return next;
  }

  private async search(opts: {
    fen: string;
    skill: number;
    depth: number;
    movetime: number;
  }): Promise<string | null> {
    const ok = await this.init();
    if (!ok || !this.worker) return null;
    const skill = Math.max(0, Math.min(20, Math.round(opts.skill)));
    this.send(`setoption name Skill Level value ${skill}`);
    this.send("setoption name UCI_LimitStrength value false");
    this.send("ucinewgame");
    this.send("isready");
    try {
      await this.waitFor((line) => line.includes("readyok"), 4000);
    } catch {
      return null;
    }
    this.send(`position fen ${opts.fen}`);
    this.send(`go depth ${opts.depth} movetime ${opts.movetime}`);
    try {
      const line = await this.waitFor((l) => l.startsWith("bestmove"), opts.movetime + 4000);
      const match = line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
      return match?.[1] ?? null;
    } catch {
      this.send("stop");
      return null;
    }
  }

  dispose(): void {
    this.listeners.clear();
    if (this.worker) {
      this.worker.removeEventListener("message", this.onMessage);
      this.worker.terminate();
      this.worker = null;
    }
    this.ready = null;
    this.usable = false;
  }

  get available(): boolean {
    return this.usable;
  }
}

export const stockfish = new StockfishEngine();
