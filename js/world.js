import { CELL, COLS, ROWS } from "./config.js";
import { TREE_SCALE, TREE_SPRITES } from "./pixels.js";

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
  { kind: "baker", x: 15, y: 5, w: 3, h: 3 },
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
  "....................",
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

// One row lower than the old plot. The top row is five tiles; the two under it are seven, one tile wider on each side.
const MEADOW_SOIL = [
  { y: 10, x0: 4, x1: 9 },
  { y: 11, x0: 3, x1: 10 },
  { y: 12, x0: 3, x1: 10 },
];

const MEADOW_WATER = [
  { y: 15, x0: 17, x1: 19 },
  { y: 16, x0: 16, x1: 19 },
  { y: 17, x0: 16, x1: 19 },
  { y: 18, x0: 17, x1: 19 },
];

// The old top row, so a saved meadow loses those five tiles.
const MEADOW_CLEARED = [
  { y: 9, x0: 4, x1: 9 },
];

function paintTiles(map, rows, from, to) {
  for (const plot of rows) {
    let row = map[plot.y];
    for (let x = plot.x0; x < plot.x1; x++) {
      if (row[x] !== from) continue;
      row = row.slice(0, x) + to + row.slice(x + 1);
    }
    map[plot.y] = row;
  }
}

function stampSoil(map, rows) {
  paintTiles(map, rows, "g", "s");
}

function stampWater(map, rows) {
  for (const pond of rows) {
    const row = map[pond.y];
    map[pond.y] = row.slice(0, pond.x0) + "w".repeat(pond.x1 - pond.x0) + row.slice(pond.x1);
  }
}

stampSoil(MEADOW_MAP, MEADOW_SOIL);
stampWater(MEADOW_MAP, MEADOW_WATER);

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
  ".b.................b",
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

// North of the village. The bottom row matches the village shore: four water tiles, then grass.
const RIDGE_MAP = [
  "wwwwrrrrggggrrgggrrr",
  "wwwwrrrgggggrrgggrrg",
  "wwwwrrggrrgggrggggrr",
  "wwwwggggrrggggrrrggg",
  "wwwwggggrrrrgggrgggg",
  "wwwwgggrrrrrrggggggr",
  "wwwwgggrrrrgggrrgggr",
  "wwwwgggggrrggggrrggr",
  "wwwwggrggggrrgggggrr",
  "wwwwggrgggggrggggggr",
  "wwwwgggrrrgggggggggg",
  "wwwwggrrrrrrggggrrgg",
  "wwwwggrrrrrrgggrrrrg",
  "wwwwgggrrrgggggrrrgg",
  "wwwwggggrrgggggrrggg",
  "wwwwggggrrrggggggggg",
  "wwwwrrgggrgggggggrrr",
  "wwwwrrrggggggggggrrr",
  "wwwwrrgggggrggggggrr",
  "wwwwgggggggggggggggg",
];

const RIDGE_BUSHES = Array.from({ length: 20 }, () => "....................");

function shoreRoll(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeShore() {
  const rand = shoreRoll(0xA11CE);
  const cells = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => "g"));
  for (let y = 0; y <= 6; y++) cells[y][COLS - 1] = "w";
  for (let walk = 0; walk < 18; walk++) {
    let x = COLS - 1;
    let y = Math.floor(rand() * 7);
    const steps = 10 + Math.floor(rand() * 16);
    for (let step = 0; step < steps; step++) {
      if (x < COLS - 1) cells[y][x] = "w";
      const roll = rand();
      if (roll < 0.42) x = Math.max(0, x - 1);
      else if (roll < 0.68) y = Math.min(ROWS - 1, y + 1);
      else if (roll < 0.9) y = Math.max(0, y - 1);
      else x = Math.min(COLS - 2, x + 1);
    }
  }
  const grown = cells.map((row) => row.slice());
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS - 1; x++) {
      if (cells[y][x] === "w") continue;
      let wet = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && cells[ny][nx] === "w") wet += 1;
      }
      if (wet >= 3) grown[y][x] = "w";
    }
  }
  for (let y = 0; y < ROWS; y++) grown[y][COLS - 1] = y <= 6 ? "w" : "g";

  const grass = (x, y) => y >= 0 && y < ROWS && x >= 0 && x < COLS - 1 && grown[y][x] === "g";
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const pick = (zones, ok) => {
    for (const [x0, x1, y0, y1] of zones) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const x = x0 + Math.floor(rand() * (x1 - x0));
        const y = y0 + Math.floor(rand() * (y1 - y0));
        if (ok(x, y)) return [x, y];
      }
    }
    return null;
  };
  const grow = (spot, size, ok, place) => {
    const pile = [spot];
    place(spot[0], spot[1]);
    for (let n = 1; n < size; n++) {
      const [sx, sy] = pile[Math.floor(rand() * pile.length)];
      const steps = dirs.slice();
      for (let i = steps.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [steps[i], steps[j]] = [steps[j], steps[i]];
      }
      const step = steps.find(([dx, dy]) => ok(sx + dx, sy + dy));
      if (!step) break;
      const nx = sx + step[0];
      const ny = sy + step[1];
      place(nx, ny);
      pile.push([nx, ny]);
    }
  };

  for (const zone of [[1, 8, 1, 8], [1, 8, 12, 19], [10, 18, 14, 19], [6, 14, 10, 15]]) {
    const spot = pick([zone], grass);
    if (spot) grow(spot, 4 + Math.floor(rand() * 5), grass, (x, y) => { grown[y][x] = "r"; });
  }

  const bushRows = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => "."));
  const bushOk = (x, y) => grass(x, y) && bushRows[y][x] === ".";
  for (const zone of [[1, 8, 0, 7], [1, 9, 8, 13], [10, 18, 8, 14], [1, 8, 14, 19], [9, 17, 15, 19]]) {
    const spot = pick([zone], bushOk);
    if (spot) grow(spot, 3 + Math.floor(rand() * 4), bushOk, (x, y) => { bushRows[y][x] = "b"; });
  }

  const trees = [];
  const kinds = ["oak", "pine", "round"];
  const treeOk = (x, y) => bushOk(x, y) && trees.every((tree) => Math.abs(tree.x - x) + Math.abs(tree.y - y) >= 4);
  for (const zone of [[2, 8, 2, 8], [2, 8, 10, 18], [10, 17, 1, 8], [10, 17, 12, 18], [5, 12, 8, 14], [1, 6, 14, 19]]) {
    const spot = pick([zone], treeOk);
    if (spot) trees.push({ kind: kinds[trees.length % kinds.length], x: spot[0], y: spot[1] });
  }

  // Close the one-tile grass bridge at column 12, row 9. The water notch above it becomes grass.
  grown[7][11] = "g";
  grown[7][12] = "g";

  return {
    map: grown.map((row) => row.join("")),
    bushes: bushRows.map((row) => row.join("")),
    trees,
  };
}

const SHORE = makeShore();

const BAY_MAP = [
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwgggwwwwwwwwwwwwwww",
  "wwggggwwwwwwwwwwwwww",
  "wwwggwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwww",
  "wwwwwwgwwwwwwwwwwwww",
  "wwwwwgggwwwwwwwwwwww",
  "wwwwwggggwwwwwwwwwww",
  "wwwwwwgggwwwwwwwwwww",
];

const BAY_BUSHES = Array.from({ length: ROWS }, () => ".".repeat(COLS));

const AREAS = [
  { name: "Village", col: 0, row: 1, map: VILLAGE_MAP, bushes: VILLAGE_BUSHES, buildings: VILLAGE_BUILDINGS, trees: VILLAGE_TREES },
  { name: "Meadow", col: 1, row: 1, map: MEADOW_MAP, bushes: MEADOW_BUSHES, buildings: [], trees: MEADOW_TREES },
  { name: "Ridge", col: 0, row: 0, map: RIDGE_MAP, bushes: RIDGE_BUSHES, buildings: [], trees: [] },
  { name: "Shore", col: -1, row: 1, map: SHORE.map, bushes: SHORE.bushes, buildings: [], trees: SHORE.trees },
  { name: "Bay", col: -1, row: 0, map: BAY_MAP, bushes: BAY_BUSHES, buildings: [], trees: [] },
];

const AREA_LINKS = [
  { east: 1, north: 2, west: 3 },
  { west: 0 },
  { south: 0, west: 4 },
  { east: 0, north: 4 },
  { east: 2, south: 3 },
];

export function linkedArea(index, dx, dy) {
  const link = AREA_LINKS[index];
  if (!link) return null;
  if (dx < 0) return link.west ?? null;
  if (dx > 0) return link.east ?? null;
  if (dy < 0) return link.north ?? null;
  if (dy > 0) return link.south ?? null;
  return null;
}

export function areaNeighbor(dx, dy) {
  return linkedArea(areaIndex, dx, dy);
}

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
  if (!Array.isArray(saved) || saved.length === 0 || saved.length > AREAS.length) return false;
  for (const area of saved) {
    if (!validRows(area?.map, "wgspr123456") || !validRows(area?.bushes, ".b1234")) return false;
  }
  saved.forEach((area, index) => {
    area.map.forEach((row, y) => { AREAS[index].map[y] = row; });
    area.bushes.forEach((row, y) => { AREAS[index].bushes[y] = row; });
  });
  if (AREAS[0].bushes.every((row) => !/[b1234]/.test(row))) {
    START_TERRAIN[0].bushes.forEach((row, y) => { AREAS[0].bushes[y] = row; });
  }
  RIDGE_MAP.forEach((row, y) => {
    let saved = AREAS[2].map[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "r" && saved[x] === "g") saved = saved.slice(0, x) + "r" + saved.slice(x + 1);
    }
    AREAS[2].map[y] = saved;
  });
  const shoreRow = AREAS[3]?.map[7];
  if (shoreRow) {
    let row = shoreRow;
    for (const x of [11, 12]) {
      if (row[x] === "w") row = row.slice(0, x) + "g" + row.slice(x + 1);
    }
    AREAS[3].map[7] = row;
  }
  paintTiles(AREAS[1].map, MEADOW_CLEARED, "s", "g");
  stampSoil(AREAS[1].map, MEADOW_SOIL);
  stampWater(AREAS[1].map, MEADOW_WATER);
  const bushRow = AREAS[1].bushes[11];
  if (bushRow?.[4] === "b" && bushRow[1] === ".") {
    AREAS[1].bushes[11] = `${bushRow.slice(0, 1)}b${bushRow.slice(2, 4)}.${bushRow.slice(5)}`;
  }
  enterArea(areaIndex);
  return true;
}

const BUSH_MARKS = "b1234";
const TILL_MARKS = "123456";

export function bushAt(x, y) {
  return BUSH_MARKS.includes(BUSHES[y][x]);
}

export function tillGrass(x, y, strokes = 1) {
  if (y < 0 || x < 0 || y >= MAP.length || x >= MAP[y].length) return false;
  if (!Number.isInteger(strokes) || strokes < 1) return false;
  const mark = MAP[y][x];
  if ((mark !== "g" && !TILL_MARKS.includes(mark)) || bushAt(x, y) || buildingAt(x, y) || treeAt(x, y)) return false;
  const current = mark === "g" ? 0 : Number(mark);
  const next = Math.min(7, current + strokes);
  const row = MAP[y];
  MAP[y] = row.slice(0, x) + (next === 7 ? "s" : String(next)) + row.slice(x + 1);
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

export function areaTerrainBlocked(index, x, y, allowWater = false) {
  const area = areaAt(index);
  if (!area || x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  const mark = area.map[y][x];
  if (mark === "r" || (!allowWater && mark === "w") || BUSH_MARKS.includes(area.bushes[y][x])) return true;
  if (area.trees.some((tree) => trunkHits(tree, x, y))) return true;
  if (hitsWall(area.buildings, x, y)) return true;
  return false;
}

export function crossingBlocked(nextIndex, x, y, npcs, allowWater = false) {
  if (areaTerrainBlocked(nextIndex, x, y, allowWater)) return true;
  if (npcs.some((npc) => (npc.area ?? 0) === nextIndex && npc.x === x && npc.y === y)) return true;
  return false;
}
