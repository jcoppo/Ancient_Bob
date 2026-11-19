import { CELL } from "./config.js?v=116";

const SLIDE = 2;
const WALK_FRAMES = 6;
const IDLE_FRAMES = 6;
const IDLE_FRAME_TICKS = 10;

export const player = {
  x: 7,
  y: 7,
  facing: "down",
  dx: 0,
  dy: 0,
  step: 0,
  walk: 0,
  idleFrame: 0,
  idleClock: 0,
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
  player.idleFrame = 0;
  player.idleClock = 0;
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

function advanceIdle() {
  player.idleClock += 1;
  if (player.idleClock < IDLE_FRAME_TICKS) return;
  player.idleClock = 0;
  player.idleFrame = (player.idleFrame + 1) % IDLE_FRAMES;
}

export function updatePlayer(dir, tryStep) {
  let continuing = false;

  if (player.step > 0) {
    player.idleFrame = 0;
    player.idleClock = 0;
    player.step += SLIDE;
    if (player.step % (CELL / 2) === 0) player.walk = (player.walk + 1) % WALK_FRAMES;
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
    advanceIdle();
    return;
  }

  const [dx, dy, facing] = dir;
  player.facing = facing;
  if (!tryStep(dx, dy)) {
    advanceIdle();
    return;
  }

  player.dx = dx;
  player.dy = dy;
  player.step = SLIDE;
  player.idleFrame = 0;
  player.idleClock = 0;
  if (!continuing) player.walk = 0;
}
