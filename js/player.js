import { CELL } from "./config.js?v=132";

const SLIDE = 2;
const WALK_FRAMES = 4;
const WALK_FRAME_TICKS = 6;

export const player = {
  x: 7,
  y: 7,
  facing: "down",
  dx: 0,
  dy: 0,
  step: 0,
  walk: 0,
  walkClock: 0,
  wrap: false,
  hp: 5,
  maxHp: 5,
};

export function resetPlayer() {
  player.x = 7;
  player.y = 7;
  player.facing = "down";
  player.dx = 0;
  player.dy = 0;
  player.step = 0;
  player.walk = 0;
  player.walkClock = 0;
  player.wrap = false;
  player.maxHp = 5;
  player.hp = player.maxHp;
  player.holding = null;
}

export function hurtPlayer(amount) {
  player.hp = Math.max(0, player.hp - amount);
}

export function healPlayer(amount) {
  player.hp = Math.min(5, player.hp + amount);
}

export function updatePlayer(dir, tryStep) {
  let continuing = false;

  if (player.step > 0) {
    player.step += SLIDE;
    player.walkClock += 1;
    if (player.walkClock >= WALK_FRAME_TICKS) {
      player.walkClock = 0;
      player.walk = (player.walk + 1) % WALK_FRAMES;
    }
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
    player.walkClock = 0;
    return;
  }

  const [dx, dy, facing] = dir;
  player.facing = facing;
  if (!tryStep(dx, dy)) return;

  player.dx = dx;
  player.dy = dy;
  player.step = SLIDE;
  if (!continuing) {
    player.walk = 0;
    player.walkClock = 0;
  }
}
