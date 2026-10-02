import { rankMoves, reviewGame } from "./analysis";
self.onmessage = (
  event: MessageEvent<{
    id: number;
    kind: "hint" | "review";
    fen: string;
    pgn: string;
    color: "w" | "b";
  }>,
) => {
  const { id, kind, fen, pgn, color } = event.data;
  try {
    const result =
      kind === "hint"
        ? rankMoves(fen, 3, 700)[0]
        : reviewGame(pgn, color, (done, total) =>
            self.postMessage({ id, progress: { done, total } }),
          );
    self.postMessage({ id, result });
  } catch {
    self.postMessage({ id, error: "Bee could not analyze this position. Please try again." });
  }
};
