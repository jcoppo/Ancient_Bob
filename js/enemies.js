import { CELL, COLS, FPS } from "./config.js?v=67";
import { BARBARIAN_PALETTE, HOOD_SPRITES, HOOD_WALK } from "./pixels.js?v=67";
import { hurtPlayer, player } from "./player.js?v=67";
import { NPCS } from "./npcs.js?v=67";
import { blockedCell } from "./collision.js?v=67";
import { areaIndex } from "./world.js?v=67";

const BARBARIAN_ACTIVE = false;
const SLIDE = 2;
const SLASH_FRAMES = 6;

const ARRIVE_FRAMES = FPS * 30;

export const barbarian = {
  x: COLS,
  y: 1,
  facing: "left",
  palette: BARBARIAN_PALETTE,
  sprites: HOOD_SPRITES,
  walkSprites: HOOD_WALK,
  holding: "sword",
  dx: 0,
  dy: 0,
  step: 0,
  walk: 0,
  arrive: ARRIVE_FRAMES,
  entered: false,
  attack: { frame: -1, facing: "left", x: 0, y: 0 },
};

function nearestTarget() {
  const people = [{ x: player.x, y: player.y }, ...NPCS.filter((npc) => !npc.dead && (npc.area ?? 0) === 0)];
  let best = null;
  let bestDist = Infinity;
  for (const person of people) {
    const dist = Math.abs(person.x - barbarian.x) + Math.abs(person.y - barbarian.y);
    if (dist < bestDist) {
      best = person;
      bestDist = dist;
    }
  }
  return best;
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
  const npc = NPCS.find((person) => !person.dead && (person.area ?? 0) === 0 && person.x === x && person.y === y);
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
    barbarian.step = SLIDE;
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
    if (areaIndex !== 0 || !beginEntrance()) return;
    barbarian.entered = true;
    return;
  }
  if (areaIndex !== 0) return;
  const attack = barbarian.attack;
  if (attack.frame >= 0) {
    attack.frame += 1;
    if (attack.frame === 1) strike();
    if (attack.frame >= SLASH_FRAMES) attack.frame = -1;
    return;
  }

  let continuing = false;
  if (barbarian.step > 0) {
    barbarian.step += SLIDE;
    if (barbarian.step % (CELL / 2) === 0) barbarian.walk ^= 1;
    if (barbarian.step < CELL) return;
    barbarian.x += barbarian.dx;
    barbarian.y += barbarian.dy;
    barbarian.step = 0;
    barbarian.dx = 0;
    barbarian.dy = 0;
    continuing = true;
  }

  const target = nearestTarget();
  if (!target) {
    barbarian.walk = 0;
    return;
  }

  const dx = target.x - barbarian.x;
  const dy = target.y - barbarian.y;
  if (Math.abs(dx) + Math.abs(dy) === 1) {
    beginSlash(facingOf(dx, dy));
    return;
  }

  const step = stepToward(target.x, target.y);
  if (!step) {
    barbarian.walk = 0;
    return;
  }
  barbarian.facing = step[2];
  barbarian.dx = step[0];
  barbarian.dy = step[1];
  barbarian.step = SLIDE;
  if (!continuing) barbarian.walk = 1;
}
