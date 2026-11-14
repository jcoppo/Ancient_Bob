// w water, g grass, p rock path. The shore meets the top and left edges.
export const MAP = [
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
export const BUILDINGS = [
  { x: 9, y: 13, w: 3, h: 3 },
  { x: 18, y: 14, w: 4, h: 3 },
  { x: 4, y: 13, w: 3, h: 4 },
  { x: 14, y: 5, w: 4, h: 4 },
  { x: 6, y: 6, w: 3, h: 3 },
];

// Fixed bushes. b is a bush on grass. Same layout every load.
export const BUSHES = [
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
