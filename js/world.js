// w water, g grass, p rock path. The shore meets the top and left edges.
const VILLAGE_MAP = [
  "wwwwwwwwgggggggggggggggg",
  "wwwwwwwwgggggggggggggggg",
  "wwwwwwwwgggggggggggggggg",
  "wwwwwwwwgggggggggggggggg",
  "wwwwwwwggggggggggggggggg",
  "wwwwwwgggggggggggggggggg",
  "wwwwwwgggggggggggggggggg",
  "wwwwwggggggggggggggggggg",
  "wwwwwggggggggggggggggggg",
  "wwwwggppppppppppppgggggg",
  "wwwgggggggggpggggggggggg",
  "wgggggggggggpggggggggggg",
  "ggggggggggggpggggggggggg",
  "ggggggggggggpggggggggggg",
  "ggggggggggggpggggggggggg",
  "ggggggggggggpggggggggggg",
  "gggggggggppppggggggggggg",
  "ggggppppppppppppppppppgg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
];

// Placed once on open grass. Same spots every time the game loads.
const VILLAGE_BUILDINGS = [
  { x: 9, y: 13, w: 3, h: 3 },
  { x: 18, y: 14, w: 4, h: 3 },
  { x: 4, y: 13, w: 3, h: 4 },
  { x: 14, y: 5, w: 4, h: 4 },
  { x: 6, y: 6, w: 3, h: 3 },
];

// Fixed bushes. b is a bush on grass. Same layout every load.
const VILLAGE_BUSHES = [
  "......................b.",
  "........................",
  "........................",
  "........b.......b.......",
  "............b.b.........",
  ".......b....b.....b.....",
  "........................",
  ".............b..........",
  ".........b..............",
  "....bb..................",
  "....................b...",
  "........................",
  "....bb...b...........b..",
  "..b...........b....bb...",
  ".................b......",
  "...b...b..............b.",
  "b.......b....b..b.......",
  "........................",
  "......b.....b........bbb",
  "..b.....................",
  "................b.......",
  "..b.........b...........",
  "........................",
  "......bb................",
];

const MEADOW_MAP = Array.from({ length: 24 }, () => "gggggggggggggggggggggggg");

// Open on the left. Bushes seal the top, bottom, and right, with more scattered inside.
const MEADOW_BUSHES = [
  "bbbbbbbbbbbbbbbbbbbbbbbb",
  ".......................b",
  ".b.................b...b",
  ".................b.....b",
  "...............b.......b",
  ".......................b",
  "........b..............b",
  ".b.....................b",
  "........b..............b",
  ".................b.....b",
  ".......................b",
  "..b....................b",
  ".............b.........b",
  ".....b.................b",
  ".......................b",
  "...b...................b",
  "........b..............b",
  "...........b...........b",
  "..................b....b",
  ".......................b",
  ".b.....................b",
  ".....b.................b",
  ".......................b",
  "bbbbbbbbbbbbbbbbbbbbbbbb",
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

export function buildingAt(x, y) {
  return BUILDINGS.some((building) => (
    x >= building.x &&
    x < building.x + building.w &&
    y >= building.y &&
    y < building.y + building.h
  ));
}

function areaAt(index) {
  if (index < 0 || index >= AREAS.length) return null;
  return AREAS[index];
}

export function crossingBlocked(nextIndex, x, y, npcs) {
  const area = areaAt(nextIndex);
  if (!area) return true;
  if (area.map[y][x] === "w" || area.bushes[y][x] === "b") return true;
  if (area.buildings.some((building) => (
    x >= building.x &&
    x < building.x + building.w &&
    y >= building.y &&
    y < building.y + building.h
  ))) return true;
  if (nextIndex === 0 && npcs.some((npc) => npc.x === x && npc.y === y)) return true;
  return false;
}
