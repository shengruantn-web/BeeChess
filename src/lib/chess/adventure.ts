export type Lesson = {
  id: number;
  world: number;
  title: string;
  goal: string;
  lesson: string;
  fen: string;
  line: string[];
  hints: [string, string, string];
  takeaway: string;
};
export const WORLDS = [
  { name: "Pawn Meadow", subtitle: "Small steps. Big possibilities.", piece: "p" },
  { name: "Knight Forest", subtitle: "Find the unexpected move.", piece: "n" },
  { name: "Castle Mountain", subtitle: "Build a position that lasts.", piece: "r" },
  { name: "Queen’s Hive", subtitle: "Bring every idea together.", piece: "q" },
] as const;
const raw: Omit<Lesson, "id" | "world">[] = [
  {
    title: "First steps",
    goal: "Move the e-pawn two squares.",
    lesson: "On its first move, a pawn can advance two squares if both are empty.",
    fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
    line: ["e4"],
    hints: [
      "Start with the pawn in front of your king.",
      "A pawn can advance twice from its starting square.",
      "Move the pawn from e2 to e4.",
    ],
    takeaway: "Pawns can move two squares on their first move.",
  },
  {
    title: "A diagonal surprise",
    goal: "Capture the black pawn.",
    lesson: "Pawns move straight ahead, but capture one square diagonally.",
    fen: "4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1",
    line: ["exd5"],
    hints: [
      "A capture uses a different direction.",
      "Look diagonally ahead of your e4 pawn.",
      "Move e4 to d5.",
    ],
    takeaway: "Pawns capture diagonally, never straight ahead.",
  },
  {
    title: "The promotion",
    goal: "Promote your pawn to a queen.",
    lesson:
      "Reach the far end of the board and your pawn becomes a queen, rook, bishop, or knight.",
    fen: "7k/P7/8/8/8/8/8/4K3 w - - 0 1",
    line: ["a8=Q+"],
    hints: [
      "Your pawn is one step from the last rank.",
      "Advance on the a-file.",
      "Move a7 to a8 and choose the queen.",
    ],
    takeaway: "A passed pawn can become your strongest piece.",
  },
  {
    title: "Passing capture",
    goal: "Capture en passant.",
    lesson:
      "Black just moved d7–d5. Your pawn can capture it as if it had moved only one square. This works only immediately after the double move.",
    fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2",
    line: ["exd6"],
    hints: [
      "The black pawn has just passed your pawn.",
      "The capture lands on an empty square.",
      "Move e5 to d6.",
    ],
    takeaway: "En passant is available for one turn only.",
  },
  {
    title: "Meadow checkpoint",
    goal: "Capture the rook and promote to a queen.",
    lesson: "A pawn can capture diagonally onto the last rank and promote in the same move.",
    fen: "1r5k/P7/8/8/8/8/8/4K3 w - - 0 1",
    line: ["axb8=Q+"],
    hints: [
      "Do more than just advance.",
      "Capture the rook on the promotion rank.",
      "Move a7 to b8 and choose the queen.",
    ],
    takeaway: "Look for a capture before pushing a pawn straight to promotion.",
  },
  {
    title: "The L-shaped leap",
    goal: "Move your knight to f3.",
    lesson:
      "Knights move two squares in one direction, then one sideways. They can jump over other pieces.",
    fen: "4k3/8/8/8/8/8/5PPP/4K1N1 w - - 0 1",
    line: ["Nf3"],
    hints: ["Use the knight next to your king.", "It can jump over your pawns.", "Move g1 to f3."],
    takeaway: "Knights can jump over pieces, even their own.",
  },
  {
    title: "Double trouble",
    goal: "Check the king and attack the rook with one knight move.",
    lesson: "A fork attacks two pieces at once. A checking fork forces the king to respond first.",
    fen: "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1",
    line: ["Nc7+"],
    hints: [
      "Find a square that attacks both the king and rook.",
      "The fork is on the seventh rank.",
      "Move b5 to c7.",
    ],
    takeaway: "A checking fork can win material while the king escapes.",
  },
  {
    title: "Collect the reward",
    goal: "Use your knight to take the rook.",
    lesson: "The king escaped your fork. Finish the tactic by collecting the other target.",
    fen: "r4k2/2N5/8/8/8/8/8/4K3 w - - 1 2",
    line: ["Nxa8"],
    hints: [
      "Your knight is already in position.",
      "The rook is on a corner square.",
      "Move c7 to a8.",
    ],
    takeaway: "Follow through after the first move of a tactic.",
  },
  {
    title: "Royal fork",
    goal: "Fork the king and queen.",
    lesson:
      "The knight can attack pieces much more valuable than itself. Look for a check that also attacks the queen.",
    fen: "4k3/7q/8/8/4N3/8/8/4K3 w - - 0 1",
    line: ["Nf6+"],
    hints: [
      "Look for a checking jump that also attacks the queen.",
      "The fork is on the sixth rank.",
      "Move e4 to f6.",
    ],
    takeaway: "Always verify both targets of a fork.",
  },
  {
    title: "Forest checkpoint",
    goal: "Find the knight fork, then win the queen.",
    lesson: "Plan the whole sequence: check first, then capture after the king moves.",
    fen: "3q3k/8/8/4N3/8/8/8/K7 w - - 0 1",
    line: ["Nf7+", "Kg8", "Nxd8"],
    hints: [
      "Your knight can check and attack the queen at once.",
      "Jump toward the king, then return for the queen.",
      "Play e5–f7. After ...Kg8, play f7–d8.",
    ],
    takeaway: "Calculate your follow-up before you play the first move.",
  },
  {
    title: "A safe home",
    goal: "Castle kingside.",
    lesson:
      "Castling moves your king two squares toward a rook, then places the rook beside it. Neither piece may have moved, and the king cannot castle out of, through, or into check.",
    fen: "4k3/8/8/8/8/8/5PPP/4K2R w K - 0 1",
    line: ["O-O"],
    hints: [
      "The path between your king and rook is clear.",
      "Select the king to castle.",
      "Move e1 to g1.",
    ],
    takeaway: "Castling protects your king and brings a rook into play.",
  },
  {
    title: "Across the board",
    goal: "Capture the queen with your rook.",
    lesson: "Rooks travel along files and ranks. Open lines let them reach distant targets.",
    fen: "4k3/8/8/q7/8/8/8/R3K3 w - - 0 1",
    line: ["Rxa5"],
    hints: [
      "Your rook and the queen share a file.",
      "There are no pieces between them.",
      "Move a1 to a5.",
    ],
    takeaway: "Rooks become powerful on open files.",
  },
  {
    title: "Block the check",
    goal: "Use your bishop to block the rook’s check on e2.",
    lesson:
      "You can answer a check by moving the king, capturing the attacker, or blocking the attack.",
    fen: "k3r3/8/8/8/8/8/8/3BK3 w - - 0 1",
    line: ["Be2"],
    hints: [
      "The rook attacks your king along the e-file.",
      "A bishop can stand between the rook and king.",
      "Move d1 to e2.",
    ],
    takeaway: "A block is one of three ways to answer a sliding-piece check.",
  },
  {
    title: "Back-rank finish",
    goal: "Deliver checkmate in one move.",
    lesson:
      "A king can be trapped by its own pawns. A rook on the back rank may leave it no escape.",
    fen: "6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1",
    line: ["Re8#"],
    hints: [
      "The black pawns block the king’s escape.",
      "Your rook can reach the eighth rank.",
      "Move e1 to e8.",
    ],
    takeaway: "Always check whether a king has an escape square.",
  },
  {
    title: "Mountain checkpoint",
    goal: "Capture the defender, then deliver back-rank mate.",
    lesson: "Trade off a defender to open a line for your second rook.",
    fen: "r5k1/5ppp/8/8/8/8/4R3/4R1K1 w - - 0 1",
    line: ["Re8+", "Rxe8", "Rxe8#"],
    hints: [
      "Use one rook to draw the black rook away.",
      "The rook on e1 will recapture after the rook on e2 draws out the defender.",
      "Play e2–e8; after ...Ra8xe8, play e1–e8.",
    ],
    takeaway: "Two rooks can cooperate to remove a defender.",
  },
  {
    title: "Queen and king",
    goal: "Deliver checkmate in one move.",
    lesson: "Your king can protect your queen as she closes in on the opposing king.",
    fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    line: ["Qg7#"],
    hints: [
      "Bring your queen next to the black king.",
      "Keep her protected by your king.",
      "Move g6 to g7.",
    ],
    takeaway: "The king is an important attacking piece in the endgame.",
  },
  {
    title: "The diagonal finish",
    goal: "Deliver checkmate with your queen.",
    lesson: "A bishop can protect the queen along a long diagonal.",
    fen: "6kr/5ppp/8/7Q/2B5/8/8/6K1 w - - 0 1",
    line: ["Qxf7#"],
    hints: [
      "The bishop on c4 supports f7.",
      "Aim the queen at a square the bishop protects.",
      "Move h5 to f7.",
    ],
    takeaway: "Coordinate queen and bishop to attack protected squares.",
  },
  {
    title: "A quiet escape",
    goal: "Escape check by capturing the attacking queen.",
    lesson: "Before moving your king, check whether another piece can capture the attacker.",
    fen: "k7/8/8/8/8/4q3/3B4/4K3 w - - 0 1",
    line: ["Bxe3"],
    hints: [
      "The queen is giving check along the e-file.",
      "Your bishop can remove the threat.",
      "Move d2 to e3.",
    ],
    takeaway: "Capturing the checking piece can turn defense into an advantage.",
  },
  {
    title: "Ladder mate",
    goal: "Use both rooks to deliver mate in two moves.",
    lesson: "Two rooks can take turns cutting off ranks and pushing the king toward the edge.",
    fen: "7k/8/8/8/8/8/1R6/R5K1 w - - 0 1",
    line: ["Ra7", "Kg8", "Rb8#"],
    hints: [
      "One rook cuts off the seventh rank.",
      "Then the other rook checks along the eighth rank.",
      "Play a1–a7. After ...Kg8, play b2–b8.",
    ],
    takeaway: "Rooks can build a ladder that drives the king to the edge.",
  },
  {
    title: "Queen Bee’s final",
    goal: "Play Qg3 to restrict the king, then find checkmate.",
    lesson:
      "A quiet move can be as powerful as a check. Take away escape squares, let the king move, and finish with a protected queen.",
    fen: "7k/8/5K2/4Q3/8/8/8/8 w - - 0 1",
    line: ["Qg3", "Kh7", "Qg7#"],
    hints: [
      "First take the g-file away without giving check.",
      "Bring your queen to the third rank.",
      "Play e5–g3. After ...Kh7, play g3–g7.",
    ],
    takeaway: "Use forcing moves and your king’s support to finish the game.",
  },
];
export const LESSONS: Lesson[] = raw.map((lesson, i) => ({
  ...lesson,
  id: i + 1,
  world: Math.floor(i / 5),
}));
