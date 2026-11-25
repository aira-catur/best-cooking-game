// The screenshot scenes behind ?shot=start|play|end. Each scene builds a real kitchen state
// with the game's own rules and data (real orders, a real mid-assembly plate, a patty caught in
// the grill's golden window), so the frame is what an actual rush looks like and the same seed
// always stages the same frame.
import { recipeById } from './recipes.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function order(id, recipeId, patience, patienceMax) {
  return { id, recipe: recipeById(recipeId), patience, patienceMax };
}

function layer(ingredient, quality = 'fresh') {
  return { ingredient, quality };
}

/**
 * Set the kitchen to the named scene (start, play or end; any other name is start) and return
 * the screen to draw over it and the best score to show.
 */
export function stageShot(name, kitchen) {
  const state = kitchen.state;
  kitchen.reset();

  if (name === 'play') {
    // A rush in full swing: three live tickets, plate 1 mid-assembly for the Sunrise Stack,
    // plate 2 a finished Garden Crunch flagged ready to serve, a patty in the golden window,
    // a tomato half-chopped, and the last served dish still on the pass.
    state.orders = [
      order(7, 'sunrise', 38, 55),
      order(8, 'garden', 47, 58),
      order(9, 'double', 26, 50),
    ];
    state.plates[0] = [layer('bun'), layer('patty', 'perfect'), layer('cheese')];
    state.plates[1] = [layer('bun'), layer('lettuce'), layer('tomato'), layer('cheese')];
    state.activePlate = 0;
    state.grill[0] = { ingredient: 'patty', t: 3.2 };
    state.grill[1] = { ingredient: 'egg', t: 0.9 };
    state.chop = { ingredient: 'tomato', hits: 1, ready: false };
    state.passDish = {
      name: 'Classic Sizzle',
      points: 186,
      layers: [layer('bun'), layer('patty', 'perfect'), layer('lettuce')],
    };
    state.passT = 3.5;
    state.score = 1240;
    state.coins = 118;
    state.combo = 3;
    state.bestCombo = 3;
    state.served = 6;
    state.elapsed = 63;
    state.shiftLeft = 87;
    state.message = 'Plate 2 is a finished Garden Crunch — switch plates and SERVE it!';
    state.messageT = 999;
    return { screen: SCREEN_PLAY, best: 2310 };
  }

  if (name === 'end') {
    // The end of a good shift: fourteen dishes out, one order lost, the board still holding
    // the tickets that did not make it, and the summary panel over the kitchen.
    state.orders = [
      order(21, 'meadow', 12, 48),
      order(22, 'classic', 31, 52),
      order(23, 'sunrise', 44, 55),
    ];
    state.plates[0] = [layer('bun'), layer('egg', 'perfect')];
    state.plates[1] = [];
    state.grill[0] = { ingredient: 'patty', t: 5.1 };
    state.passDish = {
      name: 'Meadow Melt',
      points: 214,
      layers: [layer('bun'), layer('egg', 'perfect'), layer('lettuce'), layer('tomato'), layer('cheese')],
    };
    state.passT = 3.5;
    state.score = 2310;
    state.coins = 219;
    state.combo = 0;
    state.bestCombo = 6;
    state.served = 14;
    state.lost = 1;
    state.hearts = 2;
    state.elapsed = 150;
    state.shiftLeft = 0;
    state.over = true;
    return { screen: SCREEN_OVER, best: 2310 };
  }

  // Start: a fresh kitchen behind the title panel — full board, empty plates, grill cold.
  state.orders = [
    order(1, 'classic', 55, 58),
    order(2, 'sunrise', 58, 60),
    order(3, 'garden', 52, 56),
  ];
  return { screen: SCREEN_TITLE, best: 0 };
}
