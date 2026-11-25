// The menu of Sizzle Street: six ingredients and the five original dishes built from them.
// An ingredient is either ready to plate, needs the grill, or needs the chopping board; a dish
// is an ordered stack of ingredient ids, drawn bottom-first exactly as listed here.

export const INGREDIENTS = {
  bun: { id: 'bun', name: 'Bun', prep: 'none', color: '#e8a54b', dark: '#c47f2a' },
  patty: { id: 'patty', name: 'Patty', prep: 'grill', color: '#7a4a21', dark: '#5d3717' },
  cheese: { id: 'cheese', name: 'Cheese', prep: 'none', color: '#ffd23e', dark: '#e0aa12' },
  lettuce: { id: 'lettuce', name: 'Lettuce', prep: 'chop', color: '#69c24a', dark: '#4a9c31' },
  tomato: { id: 'tomato', name: 'Tomato', prep: 'chop', color: '#e84c3d', dark: '#c23327' },
  egg: { id: 'egg', name: 'Egg', prep: 'grill', color: '#fff3d6', dark: '#f2b63c' },
};

/** The counter's bins, left to right: the order the player learns to reach for them. */
export const BIN_ORDER = ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'egg'];

export const RECIPES = [
  { id: 'classic', name: 'Classic Sizzle', layers: ['bun', 'patty', 'lettuce'], unlock: 0 },
  { id: 'sunrise', name: 'Sunrise Stack', layers: ['bun', 'patty', 'cheese', 'egg'], unlock: 0 },
  { id: 'garden', name: 'Garden Crunch', layers: ['bun', 'lettuce', 'tomato', 'cheese'], unlock: 0 },
  { id: 'double', name: 'Double Sizzle', layers: ['bun', 'patty', 'patty', 'cheese'], unlock: 3 },
  { id: 'meadow', name: 'Meadow Melt', layers: ['bun', 'egg', 'lettuce', 'tomato', 'cheese'], unlock: 6 },
];

export function recipeById(id) {
  for (const recipe of RECIPES) if (recipe.id === id) return recipe;
  return RECIPES[0];
}

/** True when a plate's layers are exactly a recipe's layers, in the same order. */
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.layers.length) return false;
  for (let index = 0; index < recipe.layers.length; index += 1) {
    if (plateItems[index].ingredient !== recipe.layers[index]) return false;
  }
  return true;
}
