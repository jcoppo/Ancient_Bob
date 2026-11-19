import { CELL } from "./config.js?v=156";

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
  walking: false,
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
  player.walking = false;
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

function advanceWalk() {
  if (player.walkClock >= WALK_FRAME_TICKS) {
    player.walkClock = 0;
    player.walk = (player.walk + 1) % WALK_FRAMES;
  }
  player.walkClock += 1;
}

function stopWalk() {
  player.walking = false;
  player.walk = 0;
  player.walkClock = 0;
}

export function updatePlayer(dir, tryStep) {
  if (player.step > 0) {
    player.step += SLIDE;
    advanceWalk();
    if (player.step < CELL) return;

    if (!player.wrap) {
      player.x += player.dx;
      player.y += player.dy;
    }
    player.step = 0;
    player.dx = 0;
    player.dy = 0;
    player.wrap = false;
    if (!dir) stopWalk();
    else player.facing = dir[2];
    return;
  }

  if (!dir) {
    stopWalk();
    return;
  }

  const [dx, dy, facing] = dir;
  player.facing = facing;
  if (!tryStep(dx, dy)) {
    stopWalk();
    return;
  }

  player.dx = dx;
  player.dy = dy;
  player.step = SLIDE;
  player.walking = true;
  advanceWalk();
}
