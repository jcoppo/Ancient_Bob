import { FARM_SPRITES, FARMER_PALETTE, MAN_PALETTE, WOMAN_PALETTE, OLD_MAN_PALETTE } from "./pixels.js?v=153";
import { player } from "./player.js?v=153";
import { blockedCell } from "./collision.js?v=153";
import { MAP, areaIndex, tillGrass } from "./world.js?v=153";

function hat(sprite, rows) {
  return rows.concat(sprite.slice(rows.length));
}

const FARMER_SPRITES = {
  down: hat(FARM_SPRITES.down, [
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
  ]),
  up: hat(FARM_SPRITES.up, [
    "...HHHHHHHHHH...",
    "..HHHHHHHHHHHH..",
  ]),
  left: hat(FARM_SPRITES.left, [
    "...HHHHHHHH.....",
    "....HHHHHHH.....",
  ]),
};

const STEP_DIRS = [
  [0, -1, "up"],
  [0, 1, "down"],
  [-1, 0, "left"],
  [1, 0, "right"],
];

export const NPCS = [
  {
    name: "Bram",
    x: 14,
    y: 16,
    facing: "down",
    palette: MAN_PALETTE,
    wait: 80,
    line: "The north road folded shut at dusk. People who take it come back turned around, swearing they walked through a door that was never there. Something in this town is moving the paths. I followed my own footprints home, and they ended at a wall of trees that was not there in the morning. If you go looking, take a light, and do not trust the way back.",
  },
  {
    name: "Lila",
    x: 12,
    y: 16,
    facing: "left",
    palette: WOMAN_PALETTE,
    wait: 140,
    line: "Don't drink from the well. At dawn it went still, and I heard my own name spoken from under the water. If you came looking for an adventure, it has already started.",
  },
  {
    name: "Elder Otis",
    x: 4,
    y: 16,
    facing: "right",
    palette: OLD_MAN_PALETTE,
    wait: 200,
    line: "The stones under the square have started to hum. I have not heard that since the old gate was sealed. The town is remembering something it was meant to forget.",
  },
  {
    name: "Baker",
    x: 16,
    y: 8,
    homeX: 16,
    homeY: 8,
    facing: "down",
    wait: 160,
    met: false,
  },
  {
    name: "Farmer",
    area: 1,
    x: 10,
    y: 12,
    facing: "left",
    palette: FARMER_PALETTE,
    sprites: FARMER_SPRITES,
    holding: "hoe",
    tool: "hoe",
    wait: 40,
    till: 0,
    hoe: 0,
    hoeBack: false,
    route: 0,
    met: false,
  },
];

const NPC_START = NPCS.map((npc) => ({
  name: npc.name,
  x: npc.x,
  y: npc.y,
  facing: npc.facing,
  wait: npc.wait,
}));

export function resetNpcs() {
  for (const start of NPC_START) {
    const npc = NPCS.find((entry) => entry.name === start.name);
    npc.x = start.x;
    npc.y = start.y;
    npc.facing = start.facing;
    npc.wait = start.wait;
    npc.dead = false;
    npc.met = false;
    npc.till = 0;
    npc.hoe = 0;
    npc.hoeBack = false;
    if (npc.name === "Farmer") npc.route = 0;
  }
}

export function npcInFront() {
  const offset = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.facing];
  const x = player.x + offset[0];
  const y = player.y + offset[1];
  return NPCS.find((npc) => !npc.dead && (npc.area ?? 0) === areaIndex && npc.x === x && npc.y === y);
}

// New rows under the meadow plot. Bushes at (7, 13) and (9, 14) stay grass, so he steps around them.
const FARM_ROUTE = [
  { x: 9, y: 13, till: true },
  { x: 8, y: 13, till: true },
  { x: 8, y: 12 },
  { x: 6, y: 12 },
  { x: 6, y: 13, till: true },
  { x: 5, y: 13, till: true },
  { x: 4, y: 13, till: true },
  { x: 3, y: 13, till: true },
  { x: 3, y: 14, till: true },
  { x: 4, y: 14, till: true },
  { x: 5, y: 14, till: true },
  { x: 6, y: 14, till: true },
  { x: 7, y: 14, till: true },
  { x: 8, y: 14, till: true },
  { x: 8, y: 15, till: true },
  { x: 9, y: 15, till: true },
  { x: 7, y: 15, till: true },
  { x: 6, y: 15, till: true },
  { x: 5, y: 15, till: true },
  { x: 4, y: 15, till: true },
  { x: 3, y: 15, till: true },
  { x: 10, y: 12 },
];

const FARM_TILL = 10;
const FARM_STEP = 8;
const FARM_GAP = 10;

function farmStep(npc, tx, ty) {
  const dx = Math.sign(tx - npc.x);
  const dy = Math.sign(ty - npc.y);
  const options = [];
  if (dx && Math.abs(tx - npc.x) >= Math.abs(ty - npc.y)) options.push([dx, 0]);
  if (dy) options.push([0, dy]);
  if (dx && Math.abs(tx - npc.x) < Math.abs(ty - npc.y)) options.push([dx, 0]);
  for (const [sx, sy] of options) {
    if (!blockedCell(npc.x + sx, npc.y + sy, player, NPCS, npc)) return [sx, sy];
  }
  return null;
}

function faceStep(dx, dy) {
  if (dx < 0) return "left";
  if (dx > 0) return "right";
  if (dy < 0) return "up";
  return "down";
}

function updateFarmer(npc) {
  if (npc.till > 0) {
    npc.till -= 1;
    npc.facing = "down";
    const frame = FARM_TILL - npc.till - 1;
    npc.hoe = Math.sin(((frame + 0.5) / FARM_TILL) * Math.PI);
    npc.hoeBack = frame >= Math.ceil(FARM_TILL / 2);
    if (npc.till === 0) npc.wait = FARM_GAP;
    return;
  }
  npc.hoe = 0;
  npc.hoeBack = false;
  if (npc.route < 0) {
    const nextGrass = FARM_ROUTE.findIndex((cell) => cell.till && "g123456".includes(MAP[cell.y][cell.x]));
    npc.route = nextGrass >= 0 ? nextGrass : FARM_ROUTE.length;
  }
  if (npc.route >= FARM_ROUTE.length) {
    npc.facing = "left";
    return;
  }
  npc.wait -= 1;
  if (npc.wait > 0) return;

  const next = FARM_ROUTE[npc.route];
  if (npc.x === next.x && npc.y === next.y) {
    npc.route += 1;
    if (next.till && tillGrass(npc.x, npc.y, 7)) {
      npc.till = FARM_TILL;
      npc.facing = "down";
      return;
    }
    if (npc.route >= FARM_ROUTE.length) {
      npc.facing = "left";
      return;
    }
    npc.wait = 4;
    return;
  }

  const step = farmStep(npc, next.x, next.y);
  if (!step) {
    npc.wait = 12;
    return;
  }
  npc.x += step[0];
  npc.y += step[1];
  npc.facing = faceStep(step[0], step[1]);
  npc.wait = FARM_STEP;
}

function updateBaker(npc) {
  npc.wait -= 1;
  if (npc.wait > 0) return;
  const dirs = [-1, 1].filter((dx) => {
    const nx = npc.x + dx;
    return Math.abs(nx - npc.homeX) <= 1 && npc.y === npc.homeY && !blockedCell(nx, npc.y, player, NPCS, npc);
  });
  npc.wait = 180 + Math.floor(Math.random() * 220);
  if (dirs.length === 0) return;
  const dx = dirs[Math.floor(Math.random() * dirs.length)];
  npc.x += dx;
  npc.facing = npc.x === npc.homeX ? "down" : (dx < 0 ? "left" : "right");
}

export function updateNpcs() {
  for (const npc of NPCS) {
    if (npc.dead || (npc.area ?? 0) !== areaIndex) continue;
    if (npc.name === "Farmer") {
      updateFarmer(npc);
      continue;
    }
    if (npc.homeX !== undefined) {
      updateBaker(npc);
      continue;
    }
    npc.wait -= 1;
    if (npc.wait > 0) continue;

    npc.wait = 120 + Math.floor(Math.random() * 180);
    const options = STEP_DIRS.filter(([dx, dy]) => !blockedCell(npc.x + dx, npc.y + dy, player, NPCS, npc));
    if (options.length === 0) continue;

    const [dx, dy, facing] = options[Math.floor(Math.random() * options.length)];
    npc.x += dx;
    npc.y += dy;
    npc.facing = facing;
  }
}
