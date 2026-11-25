// Drawing only: the kitchen's state and the current screen in, pixels out. Everything is drawn
// with canvas shapes (no image assets, no emoji font needed): each ingredient has its own drawn
// look, a dish is a visible stack of layers, and the order board, grill, chopping board, pass
// shelf, counter bins and both plates are all on screen at once, readable at a glance.
import { FIELD, FONT, GRILL, PALETTE, ZONES } from './config.js';
import { BIN_ORDER, INGREDIENTS } from './recipes.js';
import { grillQuality } from './kitchen.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** One ingredient's drawn look, centred at (cx, cy) inside a box of size s. */
export function drawFoodIcon(ctx, id, cx, cy, s) {
  const ing = INGREDIENTS[id];
  ctx.save();
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.08, s * 0.42, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - s * 0.42, cy + s * 0.08, s * 0.84, s * 0.16);
    ctx.fillStyle = '#fff0c9';
    for (const [dx, dy] of [[-0.2, -0.18], [0.02, -0.28], [0.22, -0.14], [-0.05, -0.08]]) {
      ctx.beginPath(); ctx.arc(cx + dx * s, cy + dy * s, s * 0.045, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.44, s * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.05, s * 0.36, s * 0.17, 0, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6);
    ctx.restore();
    ctx.fillStyle = ing.dark;
    ctx.beginPath(); ctx.arc(cx - s * 0.12, cy - s * 0.05, s * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s * 0.14, cy + s * 0.12, s * 0.05, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath(); ctx.arc(cx + i * s * 0.18, cy + (i % 2 === 0 ? -s * 0.08 : s * 0.06), s * 0.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = ing.dark;
    ctx.fillRect(cx - s * 0.4, cy + s * 0.02, s * 0.8, s * 0.07);
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.04, s * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(cx - s * 0.14, cy - s * 0.1, s * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f8f2f';
    ctx.fillRect(cx - s * 0.04, cy - s * 0.44, s * 0.08, s * 0.12);
  } else if (id === 'egg') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s * 0.18, cy + s * 0.16, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath(); ctx.arc(cx + s * 0.02, cy + s * 0.02, s * 0.19, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** A plate and its stack of layers, bottom layer first, drawn at plate centre cx on baseY. */
function drawDishStack(ctx, items, cx, baseY, width) {
  ctx.fillStyle = '#e8e4da';
  ctx.beginPath(); ctx.ellipse(cx, baseY, width * 0.52, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9c2b2';
  ctx.beginPath(); ctx.ellipse(cx, baseY, width * 0.4, 8, 0, 0, Math.PI * 2); ctx.fill();
  let y = baseY - 8;
  for (const item of items) {
    const ing = INGREDIENTS[item.ingredient];
    const w = width * (item.ingredient === 'patty' ? 0.86 : 0.78);
    const h = item.ingredient === 'cheese' || item.ingredient === 'lettuce' ? 9 : 14;
    ctx.fillStyle = ing.color;
    ctx.strokeStyle = 'rgba(43,20,4,0.55)';
    ctx.lineWidth = 1.5;
    if (item.ingredient === 'lettuce') {
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath(); ctx.arc(cx + i * w * 0.19, y - h / 2, h * 0.75, 0, Math.PI * 2); ctx.fill();
      }
    } else if (item.ingredient === 'egg') {
      roundRect(ctx, cx - w / 2, y - h, w, h, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.dark;
      ctx.beginPath(); ctx.arc(cx, y - h / 2, 5.5, 0, Math.PI * 2); ctx.fill();
    } else {
      roundRect(ctx, cx - w / 2, y - h, w, h, 5); ctx.fill(); ctx.stroke();
      if (item.ingredient === 'cheese') {
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.2, y); ctx.lineTo(cx - w * 0.1, y); ctx.lineTo(cx - w * 0.15, y + 6);
        ctx.moveTo(cx + w * 0.15, y); ctx.lineTo(cx + w * 0.25, y); ctx.lineTo(cx + w * 0.2, y + 6);
        ctx.fill();
      }
      if (item.ingredient === 'tomato') {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.arc(cx - w * 0.25, y - h / 2, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (item.quality === 'perfect') {
      ctx.fillStyle = '#ffd23e';
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('★', cx + w / 2 + 3, y - 1);
    }
    y -= h + 2;
  }
  return y;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    return {
      x: ((clientX - rect.left) * ratio - view.x) / view.scale,
      y: ((clientY - rect.top) * ratio - view.y) / view.scale,
    };
  }

  function text(value, x, y, size, color, align = 'left', bold = false) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }

  function bar(x, y, w, h, frac, color, back = 'rgba(0,0,0,0.35)') {
    ctx.fillStyle = back;
    roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
    if (frac > 0) {
      ctx.fillStyle = color;
      roundRect(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2); ctx.fill();
    }
  }

  function drawHeart(cx, cy, s, filled) {
    ctx.fillStyle = filled ? PALETTE.bad : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.85);
    ctx.bezierCurveTo(cx - s * 1.2, cy, cx - s * 0.55, cy - s, cx, cy - s * 0.3);
    ctx.bezierCurveTo(cx + s * 0.55, cy - s, cx + s * 1.2, cy, cx, cy + s * 0.85);
    ctx.fill();
  }

  function drawHeader(state) {
    ctx.fillStyle = '#241407';
    ctx.fillRect(0, 0, FIELD.width, ZONES.header.h);
    ctx.fillStyle = PALETTE.accent;
    ctx.fillRect(0, ZONES.header.h - 3, FIELD.width, 3);
    text('SIZZLE STREET', 18, 40, 26, PALETTE.accent, 'left', true);
    text(`Score ${state.score}`, 330, 40, 25, PALETTE.text, 'left', true);
    text(`Coins ${state.coins}`, 545, 40, 25, '#ffd23e', 'left', true);
    text(state.combo > 1 ? `Combo x${state.combo}` : 'Combo —', 720, 40, 25, state.combo > 1 ? '#ff9d5c' : PALETTE.muted, 'left', true);
    for (let i = 0; i < 3; i += 1) drawHeart(905 + i * 30, 22, 11, i < state.hearts);
    const seconds = Math.ceil(state.shiftLeft);
    const label = `SHIFT ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    text(label, 1270, 32, 22, seconds <= 20 ? PALETTE.bad : PALETTE.text, 'right', true);
    bar(1010, 40, 260, 10, state.shiftLeft / 150, seconds <= 20 ? PALETTE.bad : PALETTE.good);
  }

  function drawOrders(state) {
    const z = ZONES.orders;
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, z.x, z.y, z.w, z.h, 14); ctx.fill();
    ctx.strokeStyle = '#1d3448'; ctx.lineWidth = 3; ctx.stroke();
    text('ORDER BOARD', z.x + z.w / 2, z.y + 34, 24, '#ffe9b8', 'center', true);
    state.orders.forEach((order, index) => {
      const tx = z.x + 14;
      const ty = ZONES.ticket.firstY + index * (ZONES.ticket.h + ZONES.ticket.gap);
      const tw = ZONES.ticket.w;
      const th = ZONES.ticket.h;
      ctx.fillStyle = PALETTE.boardPanel;
      roundRect(ctx, tx, ty, tw, th, 10); ctx.fill();
      ctx.fillStyle = '#e84c3d';
      ctx.beginPath(); ctx.arc(tx + tw / 2, ty + 2, 6, 0, Math.PI * 2); ctx.fill();
      text(`#${order.id}  ${order.recipe.name}`, tx + 12, ty + 32, 21, PALETTE.ink, 'left', true);
      // Mini preview of the finished stack, right side of the ticket.
      drawDishStack(ctx, order.recipe.layers.map((id) => ({ ingredient: id, quality: 'fresh' })), tx + tw - 46, ty + 104, 54);
      // Layer checklist: what the dish needs, bottom first.
      order.recipe.layers.forEach((id, layerIndex) => {
        const ly = ty + 58 + layerIndex * 23;
        drawFoodIcon(ctx, id, tx + 24, ly - 5, 20);
        text(INGREDIENTS[id].name, tx + 42, ly, 17, PALETTE.ink);
      });
      const frac = Math.max(0, order.patience / order.patienceMax);
      const color = frac > 0.5 ? PALETTE.good : frac > 0.25 ? PALETTE.warn : PALETTE.bad;
      bar(tx + 12, ty + th - 24, tw - 90, 12, frac, color, 'rgba(0,0,0,0.15)');
      text(`${Math.ceil(order.patience)}s`, tx + tw - 12, ty + th - 12, 18, color, 'right', true);
    });
  }

  function drawGrill(state, now) {
    const z = ZONES.grill;
    ctx.fillStyle = '#33383e';
    roundRect(ctx, z.x, z.y, z.w, z.h, 12); ctx.fill();
    ctx.fillStyle = PALETTE.steelDark;
    ctx.fillRect(z.x, z.y, z.w, 40);
    text('GRILL', z.x + 16, z.y + 29, 22, PALETTE.text, 'left', true);
    text('click when GOLDEN!', z.x + z.w - 16, z.y + 29, 17, PALETTE.accent, 'right', true);
    for (let i = 0; i < 2; i += 1) {
      const sx = ZONES.grillSlot.firstX + i * (ZONES.grillSlot.w + ZONES.grillSlot.gap);
      const sy = ZONES.grillSlot.y;
      const sw = ZONES.grillSlot.w; const sh = ZONES.grillSlot.h;
      ctx.fillStyle = '#1c1f23';
      roundRect(ctx, sx, sy, sw, sh, 10); ctx.fill();
      ctx.strokeStyle = '#565e66'; ctx.lineWidth = 2;
      for (let line = 1; line < 4; line += 1) {
        ctx.beginPath(); ctx.moveTo(sx + 10, sy + line * (sh / 4)); ctx.lineTo(sx + sw - 10, sy + line * (sh / 4)); ctx.stroke();
      }
      const slot = state.grill[i];
      if (slot === null) {
        text('empty', sx + sw / 2, sy + sh / 2 + 6, 18, '#7d868f', 'center');
        continue;
      }
      const quality = grillQuality(slot);
      const bounce = quality === 'raw' || quality === 'perfect' ? Math.sin(now / 130 + i * 2) * 2 : 0;
      // A pale sizzle plate under the food so dark patties read against the black grill.
      ctx.fillStyle = 'rgba(230,225,210,0.28)';
      ctx.beginPath(); ctx.ellipse(sx + sw / 2, sy + 46, 42, 14, 0, 0, Math.PI * 2); ctx.fill();
      drawFoodIcon(ctx, slot.ingredient, sx + sw / 2, sy + 40 + bounce, 50);
      // Doneness bar with the golden window marked.
      const bx = sx + 12; const bw = sw - 24;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(bx, sy + sh - 24, bw, 10);
      ctx.fillStyle = 'rgba(255,210,62,0.55)';
      ctx.fillRect(bx + bw * (GRILL.perfectFrom / GRILL.burntAt), sy + sh - 24, bw * ((GRILL.perfectTo - GRILL.perfectFrom) / GRILL.burntAt), 10);
      ctx.fillStyle = quality === 'burnt' ? PALETTE.bad : quality === 'raw' ? '#cfd6dd' : PALETTE.good;
      ctx.fillRect(bx, sy + sh - 24, bw * Math.min(1, slot.t / GRILL.burntAt), 10);
      const label = { raw: 'RAW…', perfect: 'PERFECT! CLICK!', cooked: 'COOKED — click', burnt: 'BURNT! click to toss' }[quality];
      text(label, sx + sw / 2, sy + sh - 32, 15, quality === 'perfect' ? '#ffd23e' : PALETTE.text, 'center', quality === 'perfect');
    }
  }

  function drawBoardStation(state, now) {
    const z = ZONES.boardStation;
    ctx.fillStyle = '#5d3a1a';
    roundRect(ctx, z.x, z.y, z.w, z.h, 12); ctx.fill();
    ctx.fillStyle = '#4a2d13';
    ctx.fillRect(z.x, z.y, z.w, 40);
    text('CHOPPING BOARD', z.x + z.w / 2, z.y + 29, 20, PALETTE.text, 'center', true);
    ctx.fillStyle = '#c98f4e';
    roundRect(ctx, z.x + 28, z.y + 50, z.w - 56, 88, 10); ctx.fill();
    ctx.strokeStyle = '#a06a33'; ctx.lineWidth = 2; ctx.stroke();
    if (state.chop === null) {
      text('Click a green or red', z.x + z.w / 2, z.y + 88, 16, '#5d3a1a', 'center');
      text('ingredient to start', z.x + z.w / 2, z.y + 110, 16, '#5d3a1a', 'center');
    } else {
      const wobble = state.chop.ready ? 0 : Math.sin(now / 90) * 2;
      drawFoodIcon(ctx, state.chop.ingredient, z.x + z.w / 2 + wobble, z.y + 94, 58);
      for (let pip = 0; pip < 3; pip += 1) {
        ctx.fillStyle = pip < state.chop.hits ? PALETTE.good : 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.arc(z.x + z.w / 2 - 22 + pip * 22, z.y + 156, 8, 0, Math.PI * 2); ctx.fill();
      }
      text(
        state.chop.ready ? 'CHOPPED! click to plate it' : `Keep clicking to chop! ${state.chop.hits}/3`,
        z.x + z.w / 2, z.y + 186, 15, PALETTE.text, 'center', true,
      );
    }
  }

  function drawPass(state, now) {
    const z = ZONES.pass;
    ctx.fillStyle = '#274b2d';
    roundRect(ctx, z.x, z.y, z.w, z.h, 12); ctx.fill();
    ctx.fillStyle = '#1c3821';
    ctx.fillRect(z.x, z.y, z.w, 40);
    text('PASS', z.x + 16, z.y + 29, 22, PALETTE.text, 'left', true);
    text('READY TO SERVE', z.x + z.w - 16, z.y + 29, 16, '#9fe870', 'right', true);
    // The service bell.
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath(); ctx.arc(z.x + 44, z.y + 66, 13, Math.PI, 0); ctx.fill();
    ctx.fillRect(z.x + 28, z.y + 66, 32, 4);
    ctx.beginPath(); ctx.arc(z.x + 44, z.y + 52, 4, 0, Math.PI * 2); ctx.fill();
    if (state.passDish !== null) {
      const recipeLayers = state.passDish.layers;
      if (recipeLayers) drawDishStack(ctx, recipeLayers, z.x + z.w / 2 + 20, z.y + 158, 120);
      text(state.passDish.name, z.x + z.w / 2 + 20, z.y + 76, 20, PALETTE.text, 'center', true);
      text(`SERVED  +${state.passDish.points} pts`, z.x + z.w / 2 + 20, z.y + 188 - 6, 17, '#9fe870', 'center', true);
    } else {
      text('Finished dishes land here', z.x + z.w / 2, z.y + 108, 17, '#b9d6ba', 'center');
      text('when you press SERVE', z.x + z.w / 2, z.y + 132, 17, '#b9d6ba', 'center');
    }
  }

  function drawBins(state) {
    text('INGREDIENTS — click to add, grill or chop  (keys 1-6)', ZONES.bins.firstX, ZONES.bins.y - 12, 19, PALETTE.text, 'left', true);
    BIN_ORDER.forEach((id, index) => {
      const bx = ZONES.bins.firstX + index * (ZONES.bins.w + ZONES.bins.gap);
      const by = ZONES.bins.y;
      ctx.fillStyle = '#f7ead2';
      roundRect(ctx, bx, by, ZONES.bins.w, ZONES.bins.h, 12); ctx.fill();
      ctx.strokeStyle = '#caa06a'; ctx.lineWidth = 2; ctx.stroke();
      drawFoodIcon(ctx, id, bx + ZONES.bins.w / 2, by + 44, 62);
      text(INGREDIENTS[id].name, bx + ZONES.bins.w / 2, by + 96, 20, PALETTE.ink, 'center', true);
      const prep = INGREDIENTS[id].prep;
      const tag = prep === 'grill' ? '→ GRILL' : prep === 'chop' ? '→ CHOP' : 'READY';
      ctx.fillStyle = prep === 'none' ? PALETTE.good : prep === 'grill' ? '#e07b2a' : '#4a9c31';
      roundRect(ctx, bx + 24, by + 104, ZONES.bins.w - 48, 18, 9); ctx.fill();
      text(tag, bx + ZONES.bins.w / 2, by + 118, 13, '#ffffff', 'center', true);
      text(String(index + 1), bx + 12, by + 24, 15, '#a3804f', 'left', true);
    });
  }

  function drawPlates(state, match0, match1, now) {
    const matches = [match0, match1];
    for (let p = 0; p < 2; p += 1) {
      const px = ZONES.plate.firstX + p * (ZONES.plate.w + ZONES.plate.gap);
      const py = ZONES.plates.y;
      const active = state.activePlate === p;
      const matched = matches[p];
      ctx.fillStyle = matched ? '#2f5d33' : active ? '#472a12' : '#38220f';
      roundRect(ctx, px, py, ZONES.plate.w, ZONES.plate.h, 12); ctx.fill();
      if (active) { ctx.strokeStyle = PALETTE.accent; ctx.lineWidth = 3; ctx.stroke(); }
      const title = matched ? `PLATE ${p + 1} — READY TO SERVE!` : `PLATE ${p + 1}${active ? ' — BUILDING' : ' — click to use'}`;
      text(title, px + ZONES.plate.w / 2, py + 28, 19, matched ? '#b6ffb0' : PALETTE.text, 'center', true);
      const items = state.plates[p];
      if (items.length === 0) {
        text('Empty plate', px + 130, py + 96, 19, PALETTE.muted, 'center');
        text('click ingredients above!', px + 130, py + 122, 16, PALETTE.muted, 'center');
      } else {
        drawDishStack(ctx, items, px + 108, py + 138, 130);
        items.forEach((item, layerIndex) => {
          const ly = py + 62 + layerIndex * 22;
          drawFoodIcon(ctx, item.ingredient, px + 218, ly - 5, 19);
          text(INGREDIENTS[item.ingredient].name + (item.quality === 'perfect' ? ' ★' : ''), px + 234, ly, 16, PALETTE.text);
        });
      }
    }
    // Serve and trash buttons beside the plates.
    const s = ZONES.serveButton;
    const activeMatched = matches[state.activePlate];
    const pulse = activeMatched ? 1 + Math.sin(now / 160) * 0.04 : 1;
    ctx.save();
    ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = activeMatched ? PALETTE.good : '#3f7a3a';
    roundRect(ctx, -s.w / 2, -s.h / 2, s.w, s.h, 12); ctx.fill();
    ctx.restore();
    text('SERVE', s.x + s.w / 2, s.y + 36, 26, '#ffffff', 'center', true);
    text('(Enter)', s.x + s.w / 2, s.y + 58, 14, '#dff5d8', 'center');
    const t = ZONES.trashButton;
    ctx.fillStyle = '#6e3a34';
    roundRect(ctx, t.x, t.y, t.w, t.h, 12); ctx.fill();
    text('Trash plate', t.x + t.w / 2, t.y + 33, 19, '#f3d9d5', 'center', true);
  }

  function drawMessage(state) {
    if (state.messageT <= 0 || state.message === '') return;
    ctx.font = `bold 20px ${FONT}`;
    const w = Math.min(920, ctx.measureText(state.message).width + 44);
    const x = (FIELD.width - w) / 2 + 130;
    ctx.fillStyle = 'rgba(20,10,4,0.9)';
    roundRect(ctx, x, 646, w, 36, 18); ctx.fill();
    ctx.strokeStyle = PALETTE.accent; ctx.lineWidth = 1.5; ctx.stroke();
    text(state.message, x + w / 2, 670, 20, '#ffe9b8', 'center', true);
  }

  function drawKitchen(state, screen, now, match0, match1) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.wallTrim;
    ctx.fillRect(0, 292, FIELD.width, 8);
    ctx.fillStyle = PALETTE.counter;
    ctx.fillRect(320, 300, 960, 420);
    ctx.fillStyle = PALETTE.counterEdge;
    ctx.fillRect(320, 300, 960, 6);
    drawHeader(state);
    drawOrders(state);
    drawGrill(state, now);
    drawBoardStation(state, now);
    drawPass(state, now);
    drawBins(state);
    drawPlates(state, match0, match1, now);
    text('Keys: 1-6 ingredients · Q/W grill · C chop board · Tab switch plate · Enter serve · Backspace trash · P pause', ZONES.hint.x, 712, 16, PALETTE.muted);
    drawMessage(state);
    if (state.flashT > 0) {
      ctx.fillStyle = `rgba(120,255,120,${(state.flashT / 0.35) * 0.14})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
  }

  function drawPanel(title, lines, prompt, titleSize = 46) {
    const w = 680;
    const h = 138 + lines.length * 32 + 78;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    ctx.fillStyle = 'rgba(24,12,4,0.9)';
    roundRect(ctx, x, y, w, h, 18); ctx.fill();
    ctx.strokeStyle = PALETTE.accent; ctx.lineWidth = 3; ctx.stroke();
    text(title, FIELD.width / 2, y + 76, titleSize, PALETTE.accent, 'center', true);
    lines.forEach((line, index) => {
      text(line, FIELD.width / 2, y + 126 + index * 32, 20, PALETTE.text, 'center');
    });
    text(prompt, FIELD.width / 2, y + h - 30, 23, '#9fe870', 'center', true);
  }

  function draw(state, screen, best, match0, match1) {
    const now = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    if (state.shakeT > 0) ctx.translate(Math.sin(now / 22) * 5 * (state.shakeT / 0.3), 0);
    drawKitchen(state, screen, now, match0, match1);
    if (screen === SCREEN_TITLE) {
      drawPanel('Sizzle Street', [
        'RUSH KITCHEN — a 150-second service. Beat the rush!',
        'Read the ORDER BOARD, build each dish layer by layer.',
        'Grill patties & eggs until GOLDEN, chop greens & tomato,',
        'run TWO plates at once, and SERVE before patience runs out.',
        best > 0 ? `Best score so far: ${best}` : 'Perfect grilling earns ★ bonus points. Combos multiply!',
      ], 'Press Space or click to start the shift');
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', ['The rush waits for no one… except now.'], 'Press P to resume');
    } else if (screen === SCREEN_OVER) {
      drawPanel('Shift over!', [
        `Dishes served: ${state.served}    Orders lost: ${state.lost}`,
        `Final score: ${state.score}    Coins earned: ${state.coins}`,
        `Best combo: x${Math.max(1, state.bestCombo)}    Best score ever: ${best}`,
        state.hearts <= 0 ? 'Three orders walked away — the kitchen closed early.' : 'The last ticket is done. Great service!',
      ], 'Press Space or click to work another shift', 46);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toLogical };
}
