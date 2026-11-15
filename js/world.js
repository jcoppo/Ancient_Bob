import { CELL } from "./config.js?v=7";

// w water, g grass, p rock path. The shore meets the top and left edges.
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

const AREAS = [
  { map: VILLAGE_MAP, bushes: VILLAGE_BUSHES, buildings: VILLAGE_BUILDINGS },
  { map: MEADOW_MAP, bushes: MEADOW_BUSHES, buildings: [] },
];

export let areaIndex = 0;
export let MAP = AREAS[0].map;
export let BUSHES = AREAS[0].bushes;
export let BUILDINGS = AREAS[0].buildings;

export function enterArea(index) {
  areaIndex = index;
  MAP = AREAS[index].map;
  BUSHES = AREAS[index].bushes;
  BUILDINGS = AREAS[index].buildings;
}

export function bushAt(x, y) {
  return BUSHES[y][x] === "b";
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
  if (area.map[y][x] === "w" || area.bushes[y][x] === "b") return true;
  if (hitsWall(area.buildings, x, y)) return true;
  if (nextIndex === 0 && npcs.some((npc) => npc.x === x && npc.y === y)) return true;
  return false;
}
