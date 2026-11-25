// Every tuning number, colour and screen zone in one place. The kitchen is a fixed 1280x720
// logical area; the renderer scales it to the window, so no rule depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Length of one shift, in seconds. Serve as many orders as you can before it ends. */
export const SHIFT_SECONDS = 150;

/** Hearts lost when an order's patience runs out. The shift ends early at zero. */
export const HEARTS = 3;

/** How many order tickets the board holds at once. */
export const ORDER_SLOTS = 3;

/** Grill slots and the one chopping board: prep capacity the player routes around. */
export const GRILL_SLOTS = 2;
export const CHOP_HITS_NEEDED = 3;

/** Grill timing, in seconds: perfect window first, then merely cooked, then burnt. */
export const GRILL = { perfectFrom: 2.0, perfectTo: 4.4, burntAt: 6.2 };

/** A plate holds at most this many layers; the longest recipe needs five. */
export const PLATE_MAX = 6;

/** Scoring: a served dish pays the base, a patience bonus, and a bonus per perfect layer. */
export const SCORE = { base: 100, patienceBonus: 60, perfectBonus: 25, comboStep: 0.1, comboCap: 2 };

export const PALETTE = {
  backdrop: '#1d130c',
  wall: '#3a2417',
  wallTrim: '#54341e',
  floor: '#6b4423',
  counter: '#8a5a2b',
  counterEdge: '#a06a33',
  steel: '#9aa3ad',
  steelDark: '#6e767f',
  board: '#2e4a67',
  boardPanel: '#f7ead2',
  ink: '#2b1c10',
  text: '#fff6e8',
  muted: '#d8c3a5',
  accent: '#ffb02e',
  good: '#58c14f',
  warn: '#ffb02e',
  bad: '#e5534b',
  patience: '#58c14f',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Screen zones the renderer paints and the input maps clicks into. One source for both. */
export const ZONES = {
  header: { x: 0, y: 0, w: 1280, h: 60 },
  orders: { x: 14, y: 72, w: 292, h: 636 },
  ticket: { w: 264, h: 190, gap: 10, firstY: 118 },
  grill: { x: 330, y: 84, w: 380, h: 196 },
  grillSlot: { w: 168, h: 108, gap: 16, firstX: 352, y: 138 },
  boardStation: { x: 726, y: 84, w: 236, h: 196 },
  pass: { x: 978, y: 84, w: 288, h: 196 },
  bins: { y: 316, h: 128, w: 148, gap: 9, firstX: 330 },
  plates: { y: 470, h: 168 },
  plate: { w: 356, h: 168, firstX: 330, gap: 16 },
  serveButton: { x: 1094, y: 486, w: 172, h: 66 },
  trashButton: { x: 1094, y: 564, w: 172, h: 52 },
  hint: { x: 330, y: 690 },
};

export const BEST_KEY = 'sizzle-street.best';
