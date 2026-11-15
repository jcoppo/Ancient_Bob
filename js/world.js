import { CELL, COLS, ROWS } from "./config.js?v=40";
import { TREE_SCALE, TREE_SPRITES } from "./pixels.js?v=40";

// w water, g grass, s soil, p rock path. The shore meets the top and left edges.
const VILLAGE_MAP = [
  "wwwwgggggggggggggggg",
  "wwwwgggggggggggggggg",
  "wwwggggggggggggggggg",
  "wwgggggggggggggggggg",
  "wwgggggggggggggggggg",
  "wggggggggggggggggggg",
  "wggggggggggggggggggg",
  "ggggppppppppppgggggg",
  "ggggggggggpggggggggg",
  "ggggggggggpggggggggg",
  "ggggggggggpggggggggg",
  "ggggggggggpggggggggg",
  "ggggggggggpggggggggg",
  "ggggggggggpggggggggg",
  "gggggggppppggggggggg",
  "ggppppppppppppppppgg",
  "gggggggggggggggggggg",
  "gggggggggggggggggggg",
  "gggggggggggggggggggg",
  "gggggggggggggggggggg",
];

// Placed once on open grass. Same spots every time the game loads.
const VILLAGE_BUILDINGS = [
  { x: 7, y: 11, w: 3, h: 3 },
  { x: 14, y: 12, w: 4, h: 3 },
  { x: 2, y: 11, w: 3, h: 4 },
  { x: 10, y: 3, w: 4, h: 4 },
  { x: 4, y: 4, w: 3, h: 3 },
];

// Fixed bushes. b is a bush on grass. Same layout every load.
const VILLAGE_BUSHES = [
  "....................",
  "....b.......b.......",
  "........b.b.........",
  "...b....b.....b.....",
  "....................",
  ".........b..........",
  "...b................",
  "bb..................",
  "................b...",
  "....................",
  "bb...b...........b..",
  "......b........bb...",
  ".............b......",
  ".....b............b.",
  ".b.........bb.......",
  "....................",
  "..b.....b........bbb",
  "....................",
  "............b.......",
  "........b...........",
];

const MEADOW_MAP = Array.from({ length: 20 }, () => "gggggggggggggggggggg");

// Open on the left. Bushes seal the top, bottom, and right, with more scattered inside.
const MEADOW_BUSHES = [
  "bbbbbbbbbbbbbbbbbbbb",
  "...................b",
  ".b............b.b..b",
  "............b......b",
  "...................b",
  ".......b...........b",
  ".b.................b",
  ".......b......b....b",
  "...................b",
  "..b................b",
  "...........b.......b",
  "....b..............b",
  "..b................b",
  ".......b...........b",
  ".........b.........b",
  "...............b...b",
  ".b.................b",
  "....b..............b",
  "...................b",
  "bbbbbbbbbbbbbbbbbbbb",
];

// Anchor cell is the foot of the trunk. Leaves hang past it and do not block.
const VILLAGE_TREES = [
  { kind: "oak", x: 17, y: 4 },
];

const MEADOW_TREES = [
  { kind: "oak", x: 16, y: 5 },
  { kind: "pine", x: 5, y: 8 },
  { kind: "round", x: 14, y: 13 },
];

const AREAS = [
  { name: "Village", map: VILLAGE_MAP, bushes: VILLAGE_BUSHES, buildings: VILLAGE_BUILDINGS, trees: VILLAGE_TREES },
  { name: "Meadow", map: MEADOW_MAP, bushes: MEADOW_BUSHES, buildings: [], trees: MEADOW_TREES },
];

export let areaIndex = 0;
export let MAP = AREAS[0].map;
export let BUSHES = AREAS[0].bushes;
export let BUILDINGS = AREAS[0].buildings;
export let TREES = AREAS[0].trees;

export function enterArea(index) {
  areaIndex = index;
  MAP = AREAS[index].map;
  BUSHES = AREAS[index].bushes;
  BUILDINGS = AREAS[index].buildings;
  TREES = AREAS[index].trees;
}

export function areaList() {
  return AREAS;
}

const START_TERRAIN = AREAS.map((area) => ({
  map: area.map.slice(),
  bushes: area.bushes.slice(),
}));

export function resetTerrain() {
  START_TERRAIN.forEach((area, index) => {
    area.map.forEach((row, y) => { AREAS[index].map[y] = row; });
    area.bushes.forEach((row, y) => { AREAS[index].bushes[y] = row; });
  });
  enterArea(0);
}

function validRows(rows, alphabet) {
  if (!Array.isArray(rows) || rows.length !== ROWS) return false;
  return rows.every((row) => (
    typeof row === "string" &&
    row.length === COLS &&
    [...row].every((ch) => alphabet.includes(ch))
  ));
}

export function applySavedTerrain(saved) {
  if (!Array.isArray(saved) || saved.length !== AREAS.length) return false;
  for (const area of saved) {
    if (!validRows(area?.map, "wgsp") || !validRows(area?.bushes, ".b1234")) return false;
  }
  saved.forEach((area, index) => {
    area.map.forEach((row, y) => { AREAS[index].map[y] = row; });
    area.bushes.forEach((row, y) => { AREAS[index].bushes[y] = row; });
  });
  enterArea(areaIndex);
  return true;
}

const BUSH_MARKS = "b1234";

export function bushAt(x, y) {
  return BUSH_MARKS.includes(BUSHES[y][x]);
}

export function tillGrass(x, y) {
  if (y < 0 || x < 0 || y >= MAP.length || x >= MAP[y].length) return false;
  if (MAP[y][x] !== "g" || bushAt(x, y) || buildingAt(x, y) || treeAt(x, y)) return false;
  const row = MAP[y];
  MAP[y] = row.slice(0, x) + "s" + row.slice(x + 1);
  return true;
}

const TRUNK_BOX = {};
for (const [kind, sprite] of Object.entries(TREE_SPRITES)) {
  let minX = sprite[0].length;
  let minY = sprite.length;
  let maxX = 0;
  let maxY = 0;
  sprite.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== "t" && row[x] !== "k") continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  });
  TRUNK_BOX[kind] = { minX, minY, maxX, maxY, cols: sprite[0].length, rows: sprite.length };
}

function trunkHits(tree, x, y) {
  const box = TRUNK_BOX[tree.kind];
  const width = box.cols * TREE_SCALE;
  const height = box.rows * TREE_SCALE;
  const ox = tree.x * CELL + Math.floor((CELL - width) / 2);
  const oy = (tree.y + 1) * CELL - height;
  const left = ox + box.minX * TREE_SCALE;
  const top = oy + box.minY * TREE_SCALE;
  const right = ox + (box.maxX + 1) * TREE_SCALE;
  const bottom = oy + (box.maxY + 1) * TREE_SCALE;
  const cellLeft = x * CELL;
  const cellTop = y * CELL;
  return left < cellLeft + CELL && right > cellLeft && top < cellTop + CELL && bottom > cellTop;
}

export function treeAt(x, y) {
  return TREES.some((tree) => trunkHits(tree, x, y));
}

export function cutBush(x, y) {
  if (y < 0 || x < 0 || y >= BUSHES.length || x >= BUSHES[y].length) return null;
  const stage = BUSH_MARKS.indexOf(BUSHES[y][x]);
  if (stage < 0) return null;
  const next = stage === BUSH_MARKS.length - 1 ? "." : BUSH_MARKS[stage + 1];
  const row = BUSHES[y];
  BUSHES[y] = row.slice(0, x) + next + row.slice(x + 1);
  return next === "." ? "break" : "hit";
}

export function buildingRoofPixels(building) {
  const width = building.w * CELL;
  const height = building.h * CELL;
  return Math.max(12, Math.min(Math.floor(width * 0.34), Math.floor(height * 0.42)));
}

function hitsWall(buildings, x, y) {
  return buildings.some((building) => (
    x >= building.x &&
    x < building.x + building.w &&
    y >= building.y + Math.floor(buildingRoofPixels(building) / CELL) &&
    y < building.y + building.h
  ));
}

export function buildingAt(x, y) {
  return hitsWall(BUILDINGS, x, y);
}

function areaAt(index) {
  if (index < 0 || index >= AREAS.length) return null;
  return AREAS[index];
}

export function crossingBlocked(nextIndex, x, y, npcs) {
  const area = areaAt(nextIndex);
  if (!area) return true;
  if (area.map[y][x] === "w" || BUSH_MARKS.includes(area.bushes[y][x])) return true;
  if (area.trees.some((tree) => trunkHits(tree, x, y))) return true;
  if (hitsWall(area.buildings, x, y)) return true;
  if (nextIndex === 0 && npcs.some((npc) => npc.x === x && npc.y === y)) return true;
  return false;
}
