# Sizzle Street: Rush Kitchen

[![Competition](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/aira-catur/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/aira-catur/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

Entry for the [Best Cooking Game](https://make.fun/bounty/best-cooking-game-20261125-0137) competition on make.fun: an original 150-second cooking rush game that runs in the browser from plain static files — no build step, no network requests, no libraries.

## The game

You run the Sizzle Street kitchen for one 150-second shift. Three order tickets sit on the board at all times, each with its own patience timer. Build every dish layer by layer, exactly as its ticket lists:

- **Counter bins** — bun and cheese plate instantly; patties and eggs go to the **grill** (two slots — click when the doneness bar is in the golden window for a ★ perfect layer, but don't let them burn); lettuce and tomato go to the **chopping board** (click it three times to chop).
- **Two plates at once** — start one dish, switch plates, and build the next while the grill works. A plate that matches a ticket exactly lights up READY TO SERVE.
- **Serve** before patience runs out: points grow with remaining patience, ★ perfect layers and your combo multiplier. An expired ticket costs a heart; lose three hearts (or run out the shift clock) and the shift ends.

Five original dishes (Classic Sizzle, Sunrise Stack, Garden Crunch, Double Sizzle, Meadow Melt) unlock and speed up as you serve more. Sound effects are synthesized live with WebAudio — no audio files.

## How to play

Mouse: click bins, grill slots, the chopping board, plates, SERVE and Trash.
Keyboard: `1-6` ingredients · `Q`/`W` grill slots · `C` chopping board · `Tab` switch plate · `Enter` serve · `Backspace` trash · `P` pause · `Space` start/restart.

Run it locally with `node serve.ts`, then open http://localhost:8080.

## Layout

- `main.ts` — entrypoint run by the grader (`node main.ts`, Node 22): copies `game/` and `screenshots/` to the output and writes the dossier.
- `game/index.html` — the page; `game/src/` holds the game, one job per file: `config.js` (tuning, colours, screen zones), `recipes.js` (ingredients and dishes), `kitchen.js` (rules and state), `render.js` (all drawing), `input.js` (mouse and keyboard), `sound.js` (synthesized effects), `shots.js` (the staged screenshot scenes), `main.js` (boot and the game loop), `random.js` (seeded RNG).
- `screenshots/` — three real renders of the game (title, mid-rush, shift over).
- `vendor/makefun-game.ts` — the kit's dossier library, vendored byte for byte.

## License

MIT — see `LICENSE`.
