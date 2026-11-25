// Boot and the one loop: input events are drained every frame, the kitchen advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and shift over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|end (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createKitchen, EVENT_EXPIRE, EVENT_OVER, EVENT_SERVE, EVENT_CHOP, EVENT_SIZZLE,
} from './kitchen.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const kitchen = createKitchen(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, kitchen);
  let painted = 0;
  function paint() {
    renderer.draw(
      kitchen.state, scene.screen, scene.best,
      kitchen.matchedRecipe(0), kitchen.matchedRecipe(1),
    );
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, renderer.toLogical);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startShift() {
    kitchen.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Shift started. Three orders on the board.');
  }

  function endShift() {
    screen = SCREEN_OVER;
    if (kitchen.state.score > best) {
      best = kitchen.state.score;
      saveBest(best);
    }
    announce(`Shift over. Score ${kitchen.state.score}. Served ${kitchen.state.served} dishes.`);
  }

  function applyEvent(event) {
    if (event.type === 'confirm') {
      sound.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startShift();
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      return;
    }
    if (event.type === 'pause') {
      if (screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    if (event.type === 'bin') {
      if (kitchen.addIngredient(event.id) & EVENT_SIZZLE) sound.sizzle();
      else sound.plate();
    } else if (event.type === 'grill') {
      kitchen.useGrill(event.index);
      sound.plate();
    } else if (event.type === 'board') {
      if (kitchen.useBoard() & EVENT_CHOP) sound.chop();
      else sound.plate();
    } else if (event.type === 'plate') {
      kitchen.selectPlate(event.index);
    } else if (event.type === 'switch') {
      kitchen.selectPlate(1 - kitchen.state.activePlate);
    } else if (event.type === 'serve') {
      if (kitchen.serve() & EVENT_SERVE) sound.ding();
      else sound.error();
    } else if (event.type === 'trash') {
      kitchen.trashPlate();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    for (const event of input.takeEvents()) applyEvent(event);
    if (input.takeTabHidden() && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        const events = kitchen.step(STEP);
        accumulator -= STEP;
        if (events & EVENT_SERVE) sound.ding();
        if (events & EVENT_EXPIRE) sound.expire();
        if (events & EVENT_OVER) endShift();
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(
      kitchen.state, screen, best,
      kitchen.matchedRecipe(0), kitchen.matchedRecipe(1),
    );
  }

  announce('Sizzle Street Rush Kitchen. Press Space or click to start the shift.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
