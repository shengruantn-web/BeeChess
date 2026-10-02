import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { LESSONS } from "../src/lib/chess/adventure.ts";
import { rankMoves, reviewGame } from "../src/lib/chess/analysis.ts";

test("all 20 lesson lines are legal, exact, and achieve their stated mating goals", () => {
  assert.equal(LESSONS.length, 20);
  assert.equal(new Set(LESSONS.map((l) => l.id)).size, 20);
  for (const lesson of LESSONS) {
    const chess = new Chess(lesson.fen);
    assert.equal(chess.turn(), "w");
    assert.equal(lesson.line.length % 2, 1);
    for (const san of lesson.line) assert.equal(chess.move(san).san, san, `Lesson ${lesson.id}`);
    if (/checkmate|mate/i.test(lesson.goal)) assert.ok(chess.isCheckmate(), lesson.title);
  }
});
test("en passant, promotion, castling, and fork lessons teach the actual rules", () => {
  const ep = new Chess(LESSONS[3].fen);
  ep.move(LESSONS[3].line[0]);
  assert.equal(ep.get("d5"), undefined);
  assert.equal(ep.get("d6").type, "p");
  const promo = new Chess(LESSONS[4].fen);
  promo.move(LESSONS[4].line[0]);
  assert.equal(promo.get("b8").type, "q");
  const castle = new Chess(LESSONS[10].fen);
  castle.move("O-O");
  assert.equal(castle.get("g1").type, "k");
  assert.equal(castle.get("f1").type, "r");
  const fork = new Chess(LESSONS[8].fen);
  fork.move("Nf6+");
  assert.ok(fork.isCheck());
  assert.ok(fork.isAttacked("h7", "w"));
});
test("coach finds mate for both colors and never suggests illegal moves", () => {
  for (const fen of ["6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1", "4r1k1/8/8/8/8/8/5PPP/6K1 b - - 0 1"]) {
    const best = rankMoves(fen, 2, 2000)[0];
    const chess = new Chess(fen);
    chess.move(best.san);
    assert.ok(chess.isCheckmate(), `${fen}: ${best.san}`);
  }
});
test("coach avoids losing a queen to an immediate recapture", () => {
  const best = rankMoves("4k3/8/2p5/3p4/3Q4/8/8/4K3 w - - 0 1", 2, 3000)[0];
  assert.notEqual(best.san, "Qxd5");
});
test("PGN restoration preserves en passant and repetition history", () => {
  const chess = new Chess();
  for (const san of ["e4", "a6", "e5", "d5"]) chess.move(san);
  const restored = new Chess();
  restored.loadPgn(chess.pgn());
  assert.equal(restored.fen(), chess.fen());
  assert.ok(restored.moves().includes("exd6"));
  const repeated = new Chess();
  for (const san of ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"]) repeated.move(san);
  restored.loadPgn(repeated.pgn());
  assert.ok(restored.isThreefoldRepetition());
});
test("reviews return up to three distinct, replayable moments from the player’s moves", () => {
  const chess = new Chess();
  for (const san of ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]) chess.move(san);
  const moments = reviewGame(chess.pgn(), "w");
  assert.equal(moments.length, 3);
  assert.equal(new Set(moments.map((m) => m.ply)).size, 3);
  for (const m of moments) {
    assert.equal(new Chess(m.fen).turn(), "w");
    assert.ok(new Chess(m.fen).move(m.suggested.san));
  }
  assert.equal(reviewGame(new Chess().pgn(), "b").length, 0);
});
