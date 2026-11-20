import { CELL } from "./config.js";
import { MAP } from "./world.js";

const SLIDE = 2;

export function playerInWater() {
  if (MAP[player.y]?.[player.x] === "w") return true;
  if (!player.wrap && (player.step > 0 || player.dx || player.dy)) {
    return MAP[player.y + player.dy]?.[player.x + player.dx] === "w";
  }
  return false;
}

function moveStep() {
  if (!playerInWater()) {
    player.swimBank = 0;
    if (!player.holding) {
      player.carryBank = 0;
      return SLIDE;
    }
    player.carryBank += 3;
    const step = Math.min(CELL - player.step, Math.floor(player.carryBank / 2));
    player.carryBank -= step * 2;
    return step;
  }
  let pace;
  if (!player.holding) {
    player.carryBank = 0;
    pace = SLIDE;
  } else {
    player.carryBank += 3;
    pace = Math.floor(player.carryBank / 2);
    player.carryBank -= pace * 2;
  }
  player.swimBank += pace;
  const step = Math.min(CELL - player.step, Math.floor(player.swimBank / 2));
  player.swimBank -= step * 2;
  return step;
}
const WALK_FRAMES = 4;
const WALK_FRAME_TICKS = 5;

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
  carryBank: 0,
  swimBank: 0,
  wrap: false,
  hp: 10,
  maxHp: 10,
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
  player.carryBank = 0;
  player.swimBank = 0;
  player.wrap = false;
  player.maxHp = 10;
  player.hp = player.maxHp;
  player.holding = null;
}

export function hurtPlayer(amount) {
  player.hp = Math.max(0, player.hp - amount);
}

export function healPlayer(amount) {
  player.hp = Math.min(player.maxHp, player.hp + amount);
}

function advanceWalk() {
  const rate = player.holding ? 0.75 : 1;
  player.walkClock += playerInWater() ? rate * 0.5 : rate;
  if (player.walkClock >= WALK_FRAME_TICKS) {
    player.walkClock -= WALK_FRAME_TICKS;
    player.walk = (player.walk + 1) % WALK_FRAMES;
  }
}

function stopWalk() {
  player.walking = false;
  player.walk = 0;
  player.walkClock = 0;
}

export function updatePlayer(dir, tryStep) {
  if (player.step > 0) {
    player.step = Math.min(CELL, player.step + moveStep());
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
  player.step = moveStep();
  player.walking = true;
  advanceWalk();
}
