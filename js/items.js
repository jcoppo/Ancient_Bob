import { CELL, COLS, FPS, ROWS } from "./config.js?v=75";
import { WHEAT_SPRITES } from "./pixels.js?v=75";
import { player } from "./player.js?v=75";
import { MAP, areaIndex, areaList, cutBush, tillGrass } from "./world.js?v=75";

export const items = [
  { kind: "sword", area: 0, x: player.x + 2, y: player.y - 1, held: false },
  { kind: "hoe", area: 1, x: 2, y: 10, held: false },
  { kind: "bag", area: 1, x: 3, y: 10, held: false },
];

export const stores = { bread: 0, gold: 5 };

export function giveBread() {
  stores.bread += 1;
}

export function takeBread() {
  if (stores.bread <= 0) return false;
  stores.bread -= 1;
  return true;
}

const LOAF = [
  "..cccccc..",
  ".cddddddc.",
  "cdddbbdddc",
  "cddddddddc",
  ".cccccccc.",
];
const LOAF_COLORS = { c: "#c4924a", d: "#f0d7a0", b: "#a56a38" };

export function loafCanvas() {
  return iconCanvas(LOAF, LOAF_COLORS, "menu-loaf");
}

const COIN = [
  "..hhhhhh..",
  ".hGGGGGGh.",
  "..ssssss..",
  ".hGGGGGGh.",
  "..ssssss..",
  ".hGGGGGGh.",
  ".ssssssss.",
];
const COIN_COLORS = { h: "#ffe9a0", G: "#e6c15a", s: "#a67c2e" };

export function coinCanvas() {
  return iconCanvas(COIN, COIN_COLORS, "menu-coin");
}

function iconCanvas(rows, colors, className) {
  const canvas = document.createElement("canvas");
  canvas.className = className;
  canvas.width = rows[0].length;
  canvas.height = rows.length;
  const ctx = canvas.getContext("2d");
  rows.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      if (!colors[pixel]) return;
      ctx.fillStyle = colors[pixel];
      ctx.fillRect(x, y, 1, 1);
    });
  });
  return canvas;
}

export function groundItems() {
  return items.filter((item) => !item.held && item.area === areaIndex);
}

export function heldItem() {
  return items.find((item) => item.held) || null;
}

export function itemInReach() {
  return groundItems().find((item) => item.x === player.x && item.y === player.y);
}

export function pickupItem(item) {
  item.held = true;
  player.holding = item.kind;
}

export function takeHeldWheat() {
  const item = heldItem();
  if (item?.kind !== "wheat") return false;
  const index = items.indexOf(item);
  if (index >= 0) items.splice(index, 1);
  player.holding = null;
  return true;
}

export function dropItem() {
  const item = heldItem();
  if (!item) return;
  if (groundItems().some((other) => other.x === player.x && other.y === player.y)) return;
  item.held = false;
  item.area = areaIndex;
  item.x = player.x;
  item.y = player.y;
  player.holding = null;
  thrust.frame = -1;
  scoop.frame = -1;
}

const SLASH_FRAMES = 6;

export const thrust = {
  frame: -1,
  facing: "down",
  x: 0,
  y: 0,
};

const LEAF_FALL = [
  [2, 3, "#2a4a22", 4, 0.12],
  [6, 2, "#3c6a30", 2, 0.18],
  [10, 3, "#4d7c3c", 3, 0.14],
  [13, 5, "#345c28", 4, 0.22],
  [3, 6, "#5a8a42", 2, 0.16],
  [7, 6, "#3c6a30", 3, 0.2],
  [11, 7, "#4d7c3c", 4, 0.15],
  [4, 9, "#2f5428", 2, 0.24],
  [8, 9, "#3c6a30", 3, 0.13],
  [12, 10, "#5a8a42", 2, 0.19],
  [5, 12, "#2a4a22", 4, 0.17],
  [9, 12, "#4d7c3c", 3, 0.21],
  [2, 11, "#345c28", 2, 0.14],
  [13, 12, "#3c6a30", 4, 0.18],
];

const LEAF_LIFE = 28;

export const leaves = [];

function burstLeaves(cellX, cellY) {
  const ox = cellX * CELL;
  const oy = cellY * CELL;
  for (const [px, py, color, size, fall] of LEAF_FALL) {
    const dx = px + size / 2 - 8;
    const dy = py + size / 2 - 8;
    const dist = Math.hypot(dx, dy) || 1;
    leaves.push({
      x: ox + px,
      y: oy + py,
      vx: (dx / dist) * 0.7,
      vy: (dy / dist) * 0.7,
      fall,
      color,
      size,
      life: LEAF_LIFE,
      max: LEAF_LIFE,
    });
  }
}

export function updateLeaves() {
  for (let i = leaves.length - 1; i >= 0; i--) {
    const leaf = leaves[i];
    leaf.x += leaf.vx;
    leaf.y += leaf.vy + leaf.fall;
    leaf.vx *= 0.72;
    leaf.vy *= 0.72;
    leaf.life -= 1;
    if (leaf.life <= 0) leaves.splice(i, 1);
  }
}

export function startThrust() {
  if (heldItem()?.kind !== "sword") return;
  thrust.facing = player.facing;
  thrust.x = (player.wrap ? player.x - player.dx : player.x) * CELL + player.dx * player.step;
  thrust.y = (player.wrap ? player.y - player.dy : player.y) * CELL + player.dy * player.step;
  thrust.frame = 0;
  const offset = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.facing];
  const bushX = player.x + offset[0];
  const bushY = player.y + offset[1];
  if (cutBush(bushX, bushY) === "break") burstLeaves(bushX, bushY);
}

export function updateThrust() {
  if (thrust.frame < 0) return;
  thrust.frame += 1;
  if (thrust.frame >= SLASH_FRAMES) thrust.frame = -1;
}

export function swordPose() {
  if (thrust.frame < 0) return { facing: player.facing, aimed: false, frame: -1, x: 0, y: 0 };
  return {
    facing: thrust.facing,
    aimed: thrust.frame <= 3,
    frame: thrust.frame,
    x: thrust.x,
    y: thrust.y,
  };
}

const SCOOP_FRAMES = 6;

export const scoop = {
  frame: -1,
  facing: "down",
};

export function startScoop() {
  if (heldItem()?.kind !== "hoe") return;
  scoop.facing = player.facing;
  scoop.frame = 0;
  tillGrass(player.x, player.y);
}

export function updateScoop() {
  if (scoop.frame < 0) return;
  scoop.frame += 1;
  if (scoop.frame >= SCOOP_FRAMES) scoop.frame = -1;
}

export function hoePose() {
  const facing = scoop.frame < 0 ? player.facing : scoop.facing;
  const t = scoop.frame < 0 ? 0 : Math.sin(((scoop.frame + 0.5) / SCOOP_FRAMES) * Math.PI);
  return { facing, frame: scoop.frame, t };
}

const SOW_FRAMES = 14;
const SEED_SPOTS = [
  [3, 11],
  [6, 13],
  [9, 10],
  [12, 12],
  [5, 14],
  [8, 8],
  [11, 14],
  [4, 9],
];
const SEED_COLORS = ["#e6c15a", "#c4924a", "#8a5a32", "#f0d7a0"];

export const sow = { frame: -1 };
export const seeds = [];

const STAGE_FRAMES = FPS * 4;

export const crops = [];

function plantWheat(x, y) {
  if (crops.some((crop) => crop.area === areaIndex && crop.x === x && crop.y === y)) return;
  crops.push({ area: areaIndex, x, y, stage: 0, wait: STAGE_FRAMES });
}

export function updateCrops() {
  const last = WHEAT_SPRITES.length - 1;
  for (const crop of crops) {
    if (crop.stage > last) crop.stage = last;
    if (crop.stage >= last) continue;
    crop.wait -= 1;
    if (crop.wait > 0) continue;
    crop.stage += 1;
    crop.wait = STAGE_FRAMES;
  }
}

export function cropSnapshot() {
  return crops.map((crop) => ({
    area: crop.area,
    x: crop.x,
    y: crop.y,
    stage: crop.stage,
    wait: crop.wait,
  }));
}

export function applyCrops(saved) {
  crops.length = 0;
  if (!Array.isArray(saved)) return;
  const last = WHEAT_SPRITES.length - 1;
  for (const crop of saved) {
    if (!Number.isInteger(crop?.area) || crop.area < 0 || crop.area >= areaList().length) continue;
    if (!Number.isInteger(crop.x) || crop.x < 0 || crop.x >= COLS) continue;
    if (!Number.isInteger(crop.y) || crop.y < 0 || crop.y >= ROWS) continue;
    if (!Number.isInteger(crop.stage) || crop.stage < 0) continue;
    if (areaList()[crop.area].map[crop.y]?.[crop.x] !== "s") continue;
    const stage = Math.min(crop.stage, last);
    const wait = Number.isInteger(crop.wait) && crop.wait > 0 ? crop.wait : STAGE_FRAMES;
    crops.push({ area: crop.area, x: crop.x, y: crop.y, stage, wait });
  }
}

export function clearCrops() {
  crops.length = 0;
}

function wheatAt(x, y) {
  return crops.findIndex((crop) => crop.area === areaIndex && crop.x === x && crop.y === y);
}

export function destroyYoungWheat() {
  if (heldItem()) return false;
  if (MAP[player.y]?.[player.x] !== "s") return false;
  const index = wheatAt(player.x, player.y);
  if (index < 0 || crops[index].stage >= WHEAT_SPRITES.length - 1) return false;
  crops.splice(index, 1);
  burstLeaves(player.x, player.y);
  return true;
}

export function harvestWheat() {
  if (heldItem()) return false;
  if (MAP[player.y]?.[player.x] !== "s") return false;
  const index = wheatAt(player.x, player.y);
  if (index < 0 || crops[index].stage < WHEAT_SPRITES.length - 1) return false;
  crops.splice(index, 1);
  items.push({ kind: "wheat", area: areaIndex, x: player.x, y: player.y, held: true });
  player.holding = "wheat";
  return true;
}

export function startSow() {
  if (heldItem()?.kind !== "bag" || sow.frame >= 0) return;
  if (MAP[player.y]?.[player.x] !== "s") return;
  plantWheat(player.x, player.y);
  sow.frame = 0;
  const ox = player.x * CELL;
  const oy = player.y * CELL;
  SEED_SPOTS.forEach(([px, py], index) => {
    seeds.push({
      x0: ox + 7,
      y0: oy + 6,
      x1: ox + px,
      y1: oy + py,
      color: SEED_COLORS[index % SEED_COLORS.length],
      life: SOW_FRAMES,
      max: SOW_FRAMES,
    });
  });
}

export function updateSow() {
  if (sow.frame >= 0) {
    sow.frame += 1;
    if (sow.frame >= SOW_FRAMES) sow.frame = -1;
  }
  for (let i = seeds.length - 1; i >= 0; i--) {
    seeds[i].life -= 1;
    if (seeds[i].life <= 0) seeds.splice(i, 1);
  }
}

export function bagPose() {
  const t = sow.frame < 0 ? 0 : Math.sin((sow.frame / SOW_FRAMES) * Math.PI);
  return { facing: player.facing, t };
}

const ITEM_START = items.map((item) => ({
  kind: item.kind,
  area: item.area,
  x: item.x,
  y: item.y,
}));

export function resetItems() {
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].kind === "wheat") items.splice(i, 1);
  }
  for (const start of ITEM_START) {
    const item = items.find((entry) => entry.kind === start.kind);
    item.area = start.area;
    item.x = start.x;
    item.y = start.y;
    item.held = false;
  }
  player.holding = null;
  thrust.frame = -1;
  scoop.frame = -1;
  sow.frame = -1;
  seeds.length = 0;
  clearCrops();
  leaves.length = 0;
  stores.bread = 0;
  stores.gold = 5;
}
