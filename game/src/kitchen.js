// The kitchen's rules and state, with no drawing and no browser in it: order tickets with
// patience timers, the two grill slots, the chopping board, two plates built in parallel,
// serving, scoring and the shift clock. Actions return short event codes so the caller can
// play sounds and announcements without the kitchen knowing about either.
import {
  CHOP_HITS_NEEDED, GRILL, GRILL_SLOTS, HEARTS, ORDER_SLOTS, PLATE_MAX, SCORE, SHIFT_SECONDS,
} from './config.js';
import { INGREDIENTS, RECIPES, plateMatchesRecipe } from './recipes.js';

export const EVENT_SERVE = 1;
export const EVENT_EXPIRE = 2;
export const EVENT_OVER = 4;
export const EVENT_CHOP = 8;
export const EVENT_SIZZLE = 16;

export function grillQuality(slot) {
  if (slot === null) return 'empty';
  if (slot.t >= GRILL.burntAt) return 'burnt';
  if (slot.t >= GRILL.perfectFrom && slot.t <= GRILL.perfectTo) return 'perfect';
  if (slot.t > GRILL.perfectTo) return 'cooked';
  return 'raw';
}

export function createKitchen(random) {
  const state = {
    score: 0, coins: 0, combo: 0, bestCombo: 0, hearts: HEARTS,
    shiftLeft: SHIFT_SECONDS, elapsed: 0, served: 0, lost: 0,
    orders: [], grill: [null, null], chop: null,
    plates: [[], []], activePlate: 0, passDish: null, passT: 0,
    message: '', messageT: 0, shakeT: 0, flashT: 0, over: false,
  };
  let nextOrderId = 1;

  function patienceFor() {
    return Math.max(34, 62 - state.served * 1.4);
  }

  function spawnOrder() {
    const unlocked = RECIPES.filter((recipe) => state.served >= recipe.unlock);
    const recipe = unlocked[Math.floor(random() * unlocked.length)];
    const patience = patienceFor() * (0.9 + random() * 0.25);
    return { id: nextOrderId++, recipe, patience, patienceMax: patience };
  }

  function reset() {
    state.score = 0; state.coins = 0; state.combo = 0; state.bestCombo = 0;
    state.hearts = HEARTS; state.shiftLeft = SHIFT_SECONDS; state.elapsed = 0;
    state.served = 0; state.lost = 0; state.orders = [];
    state.grill = new Array(GRILL_SLOTS).fill(null);
    state.chop = null; state.plates = [[], []]; state.activePlate = 0;
    state.passDish = null; state.passT = 0;
    state.message = ''; state.messageT = 0; state.shakeT = 0; state.flashT = 0; state.over = false;
    for (let index = 0; index < ORDER_SLOTS; index += 1) state.orders.push(spawnOrder());
  }

  function say(text, seconds = 2.2) {
    state.message = text;
    state.messageT = seconds;
  }

  function activeItems() {
    return state.plates[state.activePlate];
  }

  /** Click an ingredient bin: ready food goes on the active plate, the rest starts its prep. */
  function addIngredient(id) {
    const ingredient = INGREDIENTS[id];
    if (!ingredient || state.over) return 0;
    if (ingredient.prep === 'grill') {
      const free = state.grill.indexOf(null);
      if (free === -1) { say('Grill is full! Collect or wait.'); return 0; }
      state.grill[free] = { ingredient: id, t: 0 };
      say(`${ingredient.name} on the grill…`);
      return EVENT_SIZZLE;
    }
    if (ingredient.prep === 'chop') {
      if (state.chop !== null) { say('Chopping board is busy!'); return 0; }
      state.chop = { ingredient: id, hits: 0, ready: false };
      say(`Tap the board to chop the ${ingredient.name.toLowerCase()}!`);
      return 0;
    }
    return plateLayer(id, 'fresh');
  }

  function plateLayer(id, quality) {
    const items = activeItems();
    if (items.length >= PLATE_MAX) { say('That plate is full!'); return 0; }
    items.push({ ingredient: id, quality });
    return 0;
  }

  /** Click the board: chop while it needs hits, collect onto the plate once it is ready. */
  function useBoard() {
    if (state.chop === null || state.over) return 0;
    if (!state.chop.ready) {
      state.chop.hits += 1;
      if (state.chop.hits >= CHOP_HITS_NEEDED) {
        state.chop.ready = true;
        say(`${INGREDIENTS[state.chop.ingredient].name} chopped! Click the board to plate it.`);
      }
      return EVENT_CHOP;
    }
    const id = state.chop.ingredient;
    state.chop = null;
    return plateLayer(id, 'fresh');
  }

  /** Click a grill slot: too soon warns, the perfect window plates a star layer, burnt is tossed. */
  function useGrill(index) {
    const slot = state.grill[index];
    if (slot === null || state.over) return 0;
    const quality = grillQuality(slot);
    if (quality === 'raw') { say('Still raw — give it a moment!'); return 0; }
    if (quality === 'burnt') {
      state.grill[index] = null;
      say('Burnt! Tossed in the bin.');
      return 0;
    }
    state.grill[index] = null;
    say(quality === 'perfect' ? 'Perfectly grilled!' : 'Grilled and plated.');
    return plateLayer(slot.ingredient, quality);
  }

  function selectPlate(index) {
    if (index === 0 || index === 1) state.activePlate = index;
  }

  function trashPlate() {
    if (activeItems().length === 0) { say('That plate is already empty.'); return; }
    state.plates[state.activePlate] = [];
    say('Plate cleared.');
  }

  /** Serve the active plate: it must match one order ticket exactly, layer for layer. */
  function serve() {
    if (state.over) return 0;
    const items = activeItems();
    if (items.length === 0) { say('The plate is empty — build a dish first!'); return 0; }
    for (let index = 0; index < state.orders.length; index += 1) {
      const order = state.orders[index];
      if (!plateMatchesRecipe(items, order.recipe)) continue;
      const perfects = items.filter((item) => item.quality === 'perfect').length;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      const multiplier = Math.min(SCORE.comboCap, 1 + (state.combo - 1) * SCORE.comboStep);
      const points = Math.round(
        (SCORE.base + SCORE.patienceBonus * (order.patience / order.patienceMax)
          + SCORE.perfectBonus * perfects) * multiplier,
      );
      state.score += points;
      state.coins += Math.floor(points / 10);
      state.served += 1;
      state.passDish = {
        name: order.recipe.name,
        points,
        layers: items.map((item) => ({ ingredient: item.ingredient, quality: item.quality })),
      };
      state.passT = 3.5;
      state.flashT = 0.35;
      state.plates[state.activePlate] = [];
      state.orders[index] = spawnOrder();
      say(`Served ${order.recipe.name}! +${points} pts`);
      return EVENT_SERVE;
    }
    state.shakeT = 0.3;
    say('No ticket matches this plate — check the order board!');
    return 0;
  }

  /** The recipe a plate already matches exactly, or null: the renderer flags it ready to serve. */
  function matchedRecipe(plateIndex) {
    const items = state.plates[plateIndex];
    if (items.length === 0) return null;
    for (const order of state.orders) {
      if (plateMatchesRecipe(items, order.recipe)) return order.recipe;
    }
    return null;
  }

  function step(dt) {
    if (state.over) return 0;
    let events = 0;
    state.elapsed += dt;
    state.shiftLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
    if (state.messageT > 0) state.messageT = Math.max(0, state.messageT - dt);
    if (state.shakeT > 0) state.shakeT = Math.max(0, state.shakeT - dt);
    if (state.flashT > 0) state.flashT = Math.max(0, state.flashT - dt);
    if (state.passT > 0) {
      state.passT = Math.max(0, state.passT - dt);
      if (state.passT === 0) state.passDish = null;
    }
    for (const slot of state.grill) if (slot !== null) slot.t += dt;
    for (let index = 0; index < state.orders.length; index += 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.hearts -= 1;
        state.lost += 1;
        state.combo = 0;
        events |= EVENT_EXPIRE;
        say(`Too slow! The ${order.recipe.name} order walked away.`);
        state.orders[index] = spawnOrder();
      }
    }
    if (state.shiftLeft <= 0 || state.hearts <= 0) {
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, step, addIngredient, useBoard, useGrill, selectPlate, trashPlate, serve, matchedRecipe, spawnOrder };
}
