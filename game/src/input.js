// Keyboard and pointer input, translated into game events the loop drains once a frame:
// { type: 'bin', id } from an ingredient bin or keys 1-6, { type: 'grill', index } from a grill
// slot or Q/W, { type: 'board' } from the chopping board or C, { type: 'plate', index },
// { type: 'serve' }, { type: 'trash' }, { type: 'confirm' } and { type: 'pause' }.
// Click zones come from the same ZONES table the renderer paints, so they cannot drift apart.
import { ZONES } from './config.js';
import { BIN_ORDER } from './recipes.js';

function inside(point, x, y, w, h) {
  return point.x >= x && point.x < x + w && point.y >= y && point.y < y + h;
}

export function hitTest(point) {
  for (let index = 0; index < BIN_ORDER.length; index += 1) {
    const bx = ZONES.bins.firstX + index * (ZONES.bins.w + ZONES.bins.gap);
    if (inside(point, bx, ZONES.bins.y, ZONES.bins.w, ZONES.bins.h)) return { type: 'bin', id: BIN_ORDER[index] };
  }
  for (let index = 0; index < 2; index += 1) {
    const sx = ZONES.grillSlot.firstX + index * (ZONES.grillSlot.w + ZONES.grillSlot.gap);
    if (inside(point, sx, ZONES.grillSlot.y, ZONES.grillSlot.w, ZONES.grillSlot.h)) return { type: 'grill', index };
  }
  if (inside(point, ZONES.boardStation.x, ZONES.boardStation.y, ZONES.boardStation.w, ZONES.boardStation.h)) return { type: 'board' };
  for (let index = 0; index < 2; index += 1) {
    const px = ZONES.plate.firstX + index * (ZONES.plate.w + ZONES.plate.gap);
    if (inside(point, px, ZONES.plates.y, ZONES.plate.w, ZONES.plate.h)) return { type: 'plate', index };
  }
  const s = ZONES.serveButton;
  if (inside(point, s.x, s.y, s.w, s.h)) return { type: 'serve' };
  const t = ZONES.trashButton;
  if (inside(point, t.x, t.y, t.w, t.h)) return { type: 'trash' };
  return { type: 'confirm' };
}

const KEY_EVENTS = {
  Digit1: { type: 'bin', id: 'bun' },
  Digit2: { type: 'bin', id: 'patty' },
  Digit3: { type: 'bin', id: 'cheese' },
  Digit4: { type: 'bin', id: 'lettuce' },
  Digit5: { type: 'bin', id: 'tomato' },
  Digit6: { type: 'bin', id: 'egg' },
  KeyQ: { type: 'grill', index: 0 },
  KeyW: { type: 'grill', index: 1 },
  KeyC: { type: 'board' },
  Tab: { type: 'switch' },
  Enter: { type: 'serve' },
  Backspace: { type: 'trash' },
  Delete: { type: 'trash' },
  Space: { type: 'confirm' },
  KeyP: { type: 'pause' },
  Escape: { type: 'pause' },
};

export function createInput(canvas, toLogical) {
  const queue = [];

  window.addEventListener('keydown', (event) => {
    const mapped = KEY_EVENTS[event.code];
    if (!mapped) return;
    event.preventDefault();
    if (!event.repeat) queue.push({ ...mapped });
  });
  canvas.addEventListener('pointerdown', (event) => {
    queue.push(hitTest(toLogical(event.clientX, event.clientY)));
  });
  // Losing the tab mid-rush pauses the game (handled by the loop via this flag).
  let tabHidden = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) tabHidden = true;
  });

  return {
    /** Every queued event since the last call, in order. */
    takeEvents() {
      const taken = queue.slice();
      queue.length = 0;
      return taken;
    },
    /** True once after the tab was hidden, so the loop can pause a running shift. */
    takeTabHidden() {
      const taken = tabHidden;
      tabHidden = false;
      return taken;
    },
  };
}
