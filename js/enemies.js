import { CELL, COLS, ROWS } from "./config.js";
import { BARBARIAN_PALETTE, HOOD_SPRITES, HOOD_WALK } from "./pixels.js";
import { hurtPlayer, player } from "./player.js";
import { NPCS } from "./npcs.js";
import { blockedCell } from "./collision.js";
import { areaIndex, buildingAt, bushAt, MAP, treeAt } from "./world.js";

const BARBARIAN_ACTIVE = true;
const RIDGE = 2;
const SLIDE = 2;

function moveStep() {
  if (!barbarian.holding) return SLIDE;
  barbarian.carryClock = (barbarian.carryClock + 1) % 4;
  return barbarian.carryClock === 0 ? 1 : SLIDE;
}
const SLASH_FRAMES = 6;
const GUESS_TILES = 8;

let searching = false;
let saw = null;
let hunt = null;

export const barbarian = {
  x: 12,
  y: 3,
  facing: "down",
  palette: BARBARIAN_PALETTE,
  sprites: HOOD_SPRITES,
  walkSprites: HOOD_WALK,
  holding: "sword",
  dx: 0,
  dy: 0,
  step: 0,
  walk: 0,
  carryClock: 0,
  arrive: 0,
  entered: true,
  attack: { frame: -1, facing: "left", x: 0, y: 0 },
};

function sightBlocked(x, y) {
  return MAP[y][x] === "w" || MAP[y][x] === "r" || buildingAt(x, y) || bushAt(x, y) || treeAt(x, y);
}

function sees(x1, y1) {
  let x = barbarian.x;
  let y = barbarian.y;
  if (x === x1 && y === y1) return true;
  const dx = Math.abs(x1 - x);
  const dy = Math.abs(y1 - y);
  const sx = x < x1 ? 1 : -1;
  const sy = y < y1 ? 1 : -1;
  let err = dx - dy;
  while (x !== x1 || y !== y1) {
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
    if (x === x1 && y === y1) return true;
    if (sightBlocked(x, y)) return false;
  }
  return true;
}

function guessSpot(x, y, dx, dy) {
  let sx = Math.sign(dx);
  let sy = Math.sign(dy);
  if (!sx && !sy) {
    const face = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.facing];
    sx = face ? face[0] : 0;
    sy = face ? face[1] : 1;
  }
  let bestX = x;
  let bestY = y;
  for (let i = 0; i < GUESS_TILES; i++) {
    const nx = bestX + sx;
    const ny = bestY + sy;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || sightBlocked(nx, ny)) break;
    bestX = nx;
    bestY = ny;
  }
  return { x: bestX, y: bestY };
}

function giveUp() {
  searching = false;
  hunt = null;
  barbarian.walk = 0;
}

function walkToward(tx, ty, continuing) {
  if (barbarian.x === tx && barbarian.y === ty) return "arrived";
  const step = stepToward(tx, ty);
  if (!step) {
    barbarian.walk = 0;
    return "stuck";
  }
  barbarian.facing = step[2];
  barbarian.dx = step[0];
  barbarian.dy = step[1];
  barbarian.step = moveStep();
  if (!continuing) barbarian.walk = 1;
  return "moving";
}
function facingOf(dx, dy) {
  if (dx < 0) return "left";
  if (dx > 0) return "right";
  if (dy < 0) return "up";
  return "down";
}

function stepToward(tx, ty) {
  const dx = Math.sign(tx - barbarian.x);
  const dy = Math.sign(ty - barbarian.y);
  const xFirst = Math.abs(tx - barbarian.x) >= Math.abs(ty - barbarian.y);
  const options = [];
  if (dx && xFirst) options.push([dx, 0]);
  if (dy) options.push([0, dy]);
  if (dx && !xFirst) options.push([dx, 0]);
  const crowd = NPCS.concat(barbarian);
  for (const [sx, sy] of options) {
    if (!blockedCell(barbarian.x + sx, barbarian.y + sy, player, crowd, barbarian)) {
      return [sx, sy, facingOf(sx, sy)];
    }
  }
  return null;
}

function strike() {
  const offset = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[barbarian.attack.facing];
  const x = barbarian.x + offset[0];
  const y = barbarian.y + offset[1];
  const npc = NPCS.find((person) => !person.dead && (person.area ?? 0) === RIDGE && person.x === x && person.y === y);
  if (npc) npc.dead = true;
  const onPlayer = player.x === x && player.y === y;
  const slidingIn = player.step > 0 && !player.wrap && player.x + player.dx === x && player.y + player.dy === y;
  if (onPlayer || slidingIn) hurtPlayer(2);
}

function beginEntrance() {
  const crowd = NPCS.concat(barbarian);
  for (const y of [1, 0, 2]) {
    if (blockedCell(COLS - 1, y, player, crowd, barbarian)) continue;
    barbarian.x = COLS;
    barbarian.y = y;
    barbarian.facing = "left";
    barbarian.dx = -1;
    barbarian.dy = 0;
    barbarian.step = moveStep();
    barbarian.walk = 1;
    return true;
  }
  return false;
}

function beginSlash(facing) {
  barbarian.facing = facing;
  barbarian.walk = 0;
  barbarian.attack.facing = facing;
  barbarian.attack.x = barbarian.x * CELL;
  barbarian.attack.y = barbarian.y * CELL;
  barbarian.attack.frame = 0;
}

export function updateBarbarian() {
  if (!BARBARIAN_ACTIVE) return;
  if (!barbarian.entered) {
    if (barbarian.arrive > 0) {
      barbarian.arrive -= 1;
      return;
    }
    if (areaIndex !== RIDGE || !beginEntrance()) return;
    barbarian.entered = true;
    return;
  }
  if (areaIndex !== RIDGE) return;
  const attack = barbarian.attack;
  if (attack.frame >= 0) {
    attack.frame += 1;
    if (attack.frame === 1) strike();
    if (attack.frame >= SLASH_FRAMES) attack.frame = -1;
    return;
  }

  let continuing = false;
  if (barbarian.step > 0) {
    barbarian.step = Math.min(CELL, barbarian.step + moveStep());
    if (barbarian.step % (CELL / 2) === 0) barbarian.walk ^= 1;
    if (barbarian.step < CELL) return;
    barbarian.x += barbarian.dx;
    barbarian.y += barbarian.dy;
    barbarian.step = 0;
    barbarian.dx = 0;
    barbarian.dy = 0;
    continuing = true;
  }

  const dx = player.x - barbarian.x;
  const dy = player.y - barbarian.y;
  if (sees(player.x, player.y)) {
    searching = true;
    if (!saw) saw = { x: player.x, y: player.y, dx: 0, dy: 0 };
    saw.x = player.x;
    saw.y = player.y;
    if (player.dx || player.dy) {
      saw.dx = player.dx;
      saw.dy = player.dy;
    }
    hunt = null;
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      beginSlash(facingOf(dx, dy));
      return;
    }
    if (walkToward(player.x, player.y, continuing) === "stuck") barbarian.walk = 0;
    return;
  }

  if (!searching || !saw) {
    barbarian.walk = 0;
    return;
  }

  if (!hunt) hunt = { phase: "last", x: saw.x, y: saw.y };
  if (barbarian.x === hunt.x && barbarian.y === hunt.y) {
    if (hunt.phase === "guess") {
      giveUp();
      return;
    }
    const dest = guessSpot(saw.x, saw.y, saw.dx, saw.dy);
    if (dest.x === saw.x && dest.y === saw.y) {
      giveUp();
      return;
    }
    hunt = { phase: "guess", x: dest.x, y: dest.y };
  }

  if (walkToward(hunt.x, hunt.y, continuing) === "stuck") giveUp();
}
