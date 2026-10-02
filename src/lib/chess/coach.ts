import type { Moment, Suggestion } from "./analysis";
export function startAnalysis<T extends Suggestion | Moment[]>(
  request: { kind: "hint" | "review"; fen?: string; pgn?: string; color?: "w" | "b" },
  onProgress?: (done: number, total: number) => void,
) {
  const worker = new Worker(new URL("./coach.worker.ts", import.meta.url), { type: "module" });
  let rejectPending: (error: Error) => void = () => {};
  const promise = new Promise<T>((resolve, reject) => {
    rejectPending = reject;
    worker.onmessage = (event) => {
      if (event.data.progress) {
        onProgress?.(event.data.progress.done, event.data.progress.total);
        return;
      }
      worker.terminate();
      if (event.data.error || !event.data.result)
        reject(new Error(event.data.error || "No suggestion available."));
      else resolve(event.data.result);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error("Bee could not analyze this position. Please try again."));
    };
    worker.postMessage({ ...request, id: 1 });
  });
  return {
    promise,
    cancel: () => {
      worker.terminate();
      rejectPending(new Error("Analysis cancelled."));
    },
  };
}
