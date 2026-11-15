import { CELL } from "./config.js?v=22";

const SLIDE = 2;

export const player = {
  x: 7,
  y: 7,
  facing: "down",
  dx: 0,
  dy: 0,
  step: 0,
  walk: 0,
  wrap: false,
};

export function updatePlayer(dir, tryStep) {
  let continuing = false;

  if (player.step > 0) {
    player.step += SLIDE;
    if (player.step % (CELL / 2) === 0) player.walk ^= 1;
    if (player.step < CELL) return;

    if (!player.wrap) {
      player.x += player.dx;
      player.y += player.dy;
    }
    player.step = 0;
    player.dx = 0;
    player.dy = 0;
    player.wrap = false;
    continuing = true;
  }

  if (!dir) {
    player.walk = 0;
    return;
  }

  const [dx, dy, facing] = dir;
  player.facing = facing;
  if (!tryStep(dx, dy)) return;

  player.dx = dx;
  player.dy = dy;
  player.step = SLIDE;
  if (!continuing) player.walk = 1;
}
