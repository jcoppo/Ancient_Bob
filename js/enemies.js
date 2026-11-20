import { CELL, COLS, ROWS } from "./config.js";
import { BARBARIAN_PALETTE, HOOD_SPRITES, HOOD_WALK } from "./pixels.js";
import { hurtPlayer, player } from "./player.js";
import { NPCS } from "./npcs.js";
import { blockedCell } from "./collision.js";
import { areaIndex, buildingAt, bushAt, MAP, treeAt } from "./world.js";

const BARBARIAN_ACTIVE = true;
const RIDGE = 2;
const SHORE = 3;
const SLIDE = 2;

function moveStep(enemy) {
  if (!enemy.holding) {
    enemy.carryBank = 0;
    return SLIDE;
  }
  enemy.carryBank += 3;
  const step = Math.min(CELL - enemy.step, Math.floor(enemy.carryBank / 2));
  enemy.carryBank -= step * 2;
  return step;
}

function travelStep(enemy) {
  const run = moveStep(enemy);
  if (enemy.gait !== "walk") return run;
  enemy.walkBank += run;
  const pay = Math.floor(enemy.walkBank / 2);
  enemy.walkBank -= pay * 2;
  return pay;
}
const SLASH_FRAMES = 6;
const GUESS_TILES = 8;

const DIRS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function makeEnemy(area, x, y, facing) {
  return {
    area,
    x,
    y,
    facing,
    palette: BARBARIAN_PALETTE,
    sprites: HOOD_SPRITES,
    walkSprites: HOOD_WALK,
    holding: "sword",
    dx: 0,
    dy: 0,
    step: 0,
    walk: 0,
    carryBank: 0,
    arrive: 0,
    entered: true,
    attack: { frame: -1, tick: 0, facing: "left", x: 0, y: 0 },
    alert: null,
    gait: "run",
    walkBank: 0,
    searching: false,
    saw: null,
    hunt: null,
    idle: null,
  };
}

export const enemies = [
  makeEnemy(RIDGE, 12, 3, "down"),
  makeEnemy(SHORE, 1, 5, "down"),
  makeEnemy(SHORE, 8, 3, "left"),
];

function crowd() {
  return NPCS.concat(enemies);
}

function sightBlocked(x, y) {
  return MAP[y][x] === "w" || MAP[y][x] === "r" || buildingAt(x, y) || bushAt(x, y) || treeAt(x, y);
}

function sees(enemy, x1, y1) {
  let x = enemy.x;
  let y = enemy.y;
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

const ALERT_LIFE = 14;

function spotPlayer(enemy) {
  if (enemy.searching) return;
  enemy.alert = { life: ALERT_LIFE, max: ALERT_LIFE };
}

function tickAlert(enemy) {
  if (!enemy.alert) return;
  enemy.alert.life -= 1;
  if (enemy.alert.life <= 0) enemy.alert = null;
}

function giveUp(enemy) {
  enemy.searching = false;
  enemy.hunt = null;
  enemy.idle = null;
  enemy.walk = 0;
}

function openFacing(enemy) {
  const people = crowd();
  const open = Object.keys(DIRS).filter((facing) => {
    const [sx, sy] = DIRS[facing];
    return !blockedCell(enemy.x + sx, enemy.y + sy, player, people, enemy);
  });
  if (open.length === 0) return null;
  return open[Math.floor(Math.random() * open.length)];
}

function chooseIdle(enemy) {
  const roll = Math.random();
  if (roll < 0.4) {
    enemy.idle = { kind: "wait", ticks: 20 + Math.floor(Math.random() * 80) };
    return;
  }
  if (roll < 0.65) {
    const options = Object.keys(DIRS).filter((facing) => facing !== enemy.facing);
    enemy.facing = options[Math.floor(Math.random() * options.length)];
    enemy.walk = 0;
    enemy.idle = { kind: "wait", ticks: 12 + Math.floor(Math.random() * 50) };
    return;
  }
  const facing = openFacing(enemy);
  if (!facing) {
    enemy.idle = { kind: "wait", ticks: 20 + Math.floor(Math.random() * 40) };
    return;
  }
  enemy.idle = { kind: "walk", facing, tiles: 1 + Math.floor(Math.random() * 4) };
}

function wander(enemy, continuing) {
  if (!enemy.idle) chooseIdle(enemy);
  if (enemy.idle.kind === "wait") {
    enemy.walk = 0;
    enemy.idle.ticks -= 1;
    if (enemy.idle.ticks <= 0) enemy.idle = null;
    return;
  }
  const [sx, sy] = DIRS[enemy.idle.facing];
  const people = crowd();
  if (enemy.idle.tiles <= 0 || blockedCell(enemy.x + sx, enemy.y + sy, player, people, enemy)) {
    enemy.idle = null;
    enemy.walk = 0;
    return;
  }
  enemy.gait = "walk";
  const step = travelStep(enemy);
  if (step === 0) return;
  enemy.facing = enemy.idle.facing;
  enemy.dx = sx;
  enemy.dy = sy;
  enemy.step = step;
  if (!continuing) enemy.walk = 1;
  enemy.idle.tiles -= 1;
}

function walkToward(enemy, tx, ty, continuing) {
  if (enemy.x === tx && enemy.y === ty) return "arrived";
  const step = stepToward(enemy, tx, ty);
  if (!step) {
    enemy.walk = 0;
    return "stuck";
  }
  enemy.gait = "run";
  enemy.facing = step[2];
  enemy.dx = step[0];
  enemy.dy = step[1];
  enemy.step = travelStep(enemy);
  if (!continuing) enemy.walk = 1;
  return "moving";
}
function facingOf(dx, dy) {
  if (dx < 0) return "left";
  if (dx > 0) return "right";
  if (dy < 0) return "up";
  return "down";
}

function stepToward(enemy, tx, ty) {
  const dx = Math.sign(tx - enemy.x);
  const dy = Math.sign(ty - enemy.y);
  const xFirst = Math.abs(tx - enemy.x) >= Math.abs(ty - enemy.y);
  const options = [];
  if (dx && xFirst) options.push([dx, 0]);
  if (dy) options.push([0, dy]);
  if (dx && !xFirst) options.push([dx, 0]);
  const people = crowd();
  for (const [sx, sy] of options) {
    if (!blockedCell(enemy.x + sx, enemy.y + sy, player, people, enemy)) {
      return [sx, sy, facingOf(sx, sy)];
    }
  }
  return null;
}

function strike(enemy) {
  const offset = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[enemy.attack.facing];
  const x = enemy.x + offset[0];
  const y = enemy.y + offset[1];
  const npc = NPCS.find((person) => !person.dead && (person.area ?? 0) === enemy.area && person.x === x && person.y === y);
  if (npc) npc.dead = true;
  const onPlayer = player.x === x && player.y === y;
  const slidingIn = player.step > 0 && !player.wrap && player.x + player.dx === x && player.y + player.dy === y;
  if (onPlayer || slidingIn) hurtPlayer(2);
}

function beginEntrance(enemy) {
  const people = crowd();
  for (const y of [1, 0, 2]) {
    if (blockedCell(COLS - 1, y, player, people, enemy)) continue;
    enemy.x = COLS;
    enemy.y = y;
    enemy.gait = "run";
    enemy.facing = "left";
    enemy.dx = -1;
    enemy.dy = 0;
    enemy.step = travelStep(enemy);
    enemy.walk = 1;
    return true;
  }
  return false;
}

function beginSlash(enemy, facing) {
  enemy.facing = facing;
  enemy.walk = 0;
  enemy.attack.facing = facing;
  enemy.attack.x = enemy.x * CELL;
  enemy.attack.y = enemy.y * CELL;
  enemy.attack.frame = 0;
  enemy.attack.tick = 0;
}

function updateEnemy(enemy) {
  if (!enemy.entered) {
    if (enemy.arrive > 0) {
      enemy.arrive -= 1;
      return;
    }
    if (areaIndex !== enemy.area || !beginEntrance(enemy)) return;
    enemy.entered = true;
    return;
  }
  if (areaIndex !== enemy.area) return;
  tickAlert(enemy);
  if (enemy.alert) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    if (sees(enemy, player.x, player.y)) enemy.facing = facingOf(dx, dy);
    enemy.walk = 0;
    return;
  }
  const attack = enemy.attack;
  if (attack.frame >= 0) {
    attack.tick += 1;
    if (attack.tick % 2 !== 0) return;
    attack.frame += 1;
    if (attack.frame === 1) strike(enemy);
    if (attack.frame >= SLASH_FRAMES) attack.frame = -1;
    return;
  }

  let continuing = false;
  if (enemy.step > 0) {
    const step = travelStep(enemy);
    if (step > 0) {
      enemy.step = Math.min(CELL, enemy.step + step);
      if (enemy.step % (CELL / 2) === 0) enemy.walk ^= 1;
    }
    if (enemy.step < CELL) return;
    enemy.x += enemy.dx;
    enemy.y += enemy.dy;
    enemy.step = 0;
    enemy.dx = 0;
    enemy.dy = 0;
    continuing = true;
  }

  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  if (sees(enemy, player.x, player.y)) {
    spotPlayer(enemy);
    enemy.searching = true;
    enemy.idle = null;
    if (!enemy.saw) enemy.saw = { x: player.x, y: player.y, dx: 0, dy: 0 };
    enemy.saw.x = player.x;
    enemy.saw.y = player.y;
    if (player.dx || player.dy) {
      enemy.saw.dx = player.dx;
      enemy.saw.dy = player.dy;
    }
    enemy.hunt = null;
    if (enemy.alert) {
      enemy.facing = facingOf(dx, dy);
      enemy.walk = 0;
      return;
    }
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      beginSlash(enemy, facingOf(dx, dy));
      return;
    }
    if (walkToward(enemy, player.x, player.y, continuing) === "stuck") enemy.walk = 0;
    return;
  }

  if (!enemy.searching || !enemy.saw) {
    wander(enemy, continuing);
    return;
  }

  if (!enemy.hunt) enemy.hunt = { phase: "last", x: enemy.saw.x, y: enemy.saw.y };
  if (enemy.x === enemy.hunt.x && enemy.y === enemy.hunt.y) {
    if (enemy.hunt.phase === "guess") {
      giveUp(enemy);
      return;
    }
    const dest = guessSpot(enemy.saw.x, enemy.saw.y, enemy.saw.dx, enemy.saw.dy);
    if (dest.x === enemy.saw.x && dest.y === enemy.saw.y) {
      giveUp(enemy);
      return;
    }
    enemy.hunt = { phase: "guess", x: dest.x, y: dest.y };
  }

  if (walkToward(enemy, enemy.hunt.x, enemy.hunt.y, continuing) === "stuck") giveUp(enemy);
}

export function updateBarbarian() {
  if (!BARBARIAN_ACTIVE) return;
  for (const enemy of enemies) updateEnemy(enemy);
}
