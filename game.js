const COLS = 24;
const ROWS = 24;
const CELL = 16;
const FPS = 30;
const FRAME_MS = 1000 / FPS;

const PALETTE = {
  H: "#2b1d16",
  S: "#f2c7a0",
  E: "#1c1410",
  M: "#c47b6a",
  T: "#8c3d2f",
  B: "#2a211c",
  G: "#e6c15a",
  L: "#4a3728",
  K: "#1c1612",
};

const SPRITES = {
  down: [
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "....HHSSSSHH....",
    "....HSEESEEH....",
    "....HSSMMSSH....",
    "......SSSS......",
    "...SSSTTTTSSS...",
    "..SSTTTTTTTSS...",
    "..SSTTTTTTTSS...",
    "...TTTTTTTTT....",
    "...TTBGGGBTT....",
    "....LLL..LLL....",
    "....LL....LL....",
    "....KK....KK....",
    "....KK....KK....",
  ],
  up: [
    "................",
    "......HHHH......",
    "....HHHHHHHH....",
    "....HHHHHHHH....",
    "....HHHHHHHH....",
    "....HHHHHHHH....",
    "......HHHH......",
    "...SSSTTTTSSS...",
    "..SSTTTTTTTSS...",
    "..SSTTTTTTTSS...",
    "...TTTTTTTTT....",
    "...TTTTTTTTT....",
    "....LLL..LLL....",
    "....LL....LL....",
    "....KK....KK....",
    "....KK....KK....",
  ],
  left: [
    "................",
    ".....HHHHH......",
    "....HHHHHHHH....",
    ".....SSSSHHH....",
    ".....SSEEEHH....",
    "......SSSHHH....",
    ".......SSS......",
    ".......STTTT....",
    "......TTTTTTTT..",
    ".....TTTTTTTTT..",
    ".....TTGGGBTTT..",
    "......TTTTTTT...",
    "........LLLL....",
    ".........LLL....",
    "........KKKK....",
    ".........KKK....",
  ],
};

const OUTLINE = "#1a140f";

const GRASS_TILE = {
  g: "#5f7c3a",
  d: "#567433",
  pixels: [
    "gggggggggggggggg",
    "ggggggdggggggggg",
    "gggggggggggggggg",
    "ggggggggggggdggg",
    "gggggggggggggggg",
    "ggdggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggggggdgggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggdgggggggggg",
    "gggggggggggggggg",
    "ggggggggggggggdg",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ],
};

const WATER_TILE = {
  w: "#2f7ea0",
  l: "#3890b4",
  pixels: [
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wlwwwwlwwwwlwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwlwwwwlwwwwlw",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
  ],
};

// One fixed shore. It meets the top and left edges and runs off the map.
const MAP = [
  "wwwwwwwwgggggggggggggggg",
  "wwwwwwwwgggggggggggggggg",
  "wwwwwwwwgggggggggggggggg",
  "wwwwwwwwgggggggggggggggg",
  "wwwwwwwggggggggggggggggg",
  "wwwwwwgggggggggggggggggg",
  "wwwwwwgggggggggggggggggg",
  "wwwwwggggggggggggggggggg",
  "wwwwwggggggggggggggggggg",
  "wwwwgggggggggggggggggggg",
  "wwwggggggggggggggggggggg",
  "wggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
  "gggggggggggggggggggggggg",
];

// Placed once on open grass. Same spots every time the game loads.
const BUILDINGS = [
  { x: 9, y: 13, w: 3, h: 3 },
  { x: 18, y: 14, w: 4, h: 3 },
  { x: 4, y: 13, w: 3, h: 4 },
  { x: 14, y: 5, w: 4, h: 4 },
  { x: 6, y: 6, w: 3, h: 3 },
];

const canvas = document.getElementById("game");
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");
ctx.imageSmoothingEnabled = false;

const player = {
  x: Math.floor(COLS / 2) - 1,
  y: Math.floor(ROWS / 2) - 1,
  facing: "down",
};
let showGrid = true;
const moveQueue = [];

const KEY_DIRS = {
  ArrowUp: [0, -1, "up"],
  ArrowDown: [0, 1, "down"],
  ArrowLeft: [-1, 0, "left"],
  ArrowRight: [1, 0, "right"],
  w: [0, -1, "up"],
  a: [-1, 0, "left"],
  s: [0, 1, "down"],
  d: [1, 0, "right"],
};

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === "q") {
    showGrid = !showGrid;
    status.textContent = showGrid
      ? "Grid on · Arrows or WASD move one square · Q toggles the grid"
      : "Grid off · Arrows or WASD move one square · Q toggles the grid";
    event.preventDefault();
    return;
  }

  const dir = KEY_DIRS[key];
  if (!dir) return;

  event.preventDefault();
  moveQueue.push(dir);
});

function update() {
  const dir = moveQueue.shift();
  if (!dir) return;

  const [dx, dy, facing] = dir;
  const nx = player.x + dx;
  const ny = player.y + dy;
  player.facing = facing;
  if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return;
  if (MAP[ny][nx] === "w" || buildingAt(nx, ny)) return;

  player.x = nx;
  player.y = ny;
}

function drawTile(tile, gridX, gridY) {
  const ox = gridX * CELL;
  const oy = gridY * CELL;
  for (let y = 0; y < CELL; y++) {
    const row = tile.pixels[y];
    for (let x = 0; x < CELL; x++) {
      ctx.fillStyle = tile[row[x]];
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

function buildingAt(x, y) {
  return BUILDINGS.some((building) => (
    x >= building.x &&
    x < building.x + building.w &&
    y >= building.y &&
    y < building.y + building.h
  ));
}

function drawBuilding(building) {
  const left = building.x * CELL;
  const top = building.y * CELL;
  const width = building.w * CELL;
  const height = building.h * CELL;
  const roofHeight = Math.max(8, Math.floor(height * 0.34));

  ctx.fillStyle = "#8d4034";
  for (let row = 0; row < roofHeight; row++) {
    const inset = Math.floor(((roofHeight - row) * (width / 2 - 1)) / roofHeight);
    ctx.fillRect(left + inset, top + row, width - inset * 2, 1);
  }

  const wallTop = top + roofHeight;
  ctx.fillStyle = "#d7c09a";
  ctx.fillRect(left + 1, wallTop, width - 2, height - roofHeight);
  ctx.fillStyle = "#4a3424";
  ctx.fillRect(left + 1, wallTop, width - 2, 2);

  const doorWidth = 6;
  const doorHeight = Math.min(12, height - roofHeight - 4);
  ctx.fillStyle = "#3a2618";
  ctx.fillRect(
    left + Math.floor((width - doorWidth) / 2),
    top + height - doorHeight,
    doorWidth,
    doorHeight
  );

  ctx.fillStyle = "#6eb4c8";
  const windowY = wallTop + 4;
  ctx.fillRect(left + 5, windowY, 6, 6);
  if (building.w >= 4) ctx.fillRect(left + width - 11, windowY, 6, 6);
}

function drawBuildings() {
  for (const building of BUILDINGS) drawBuilding(building);
}

function drawGround() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      drawTile(MAP[y][x] === "w" ? WATER_TILE : GRASS_TILE, x, y);
    }
  }
}

function drawGrid() {
  ctx.fillStyle = "rgba(18, 28, 10, 0.55)";
  for (let i = 0; i <= COLS; i++) {
    const p = Math.min(i * CELL, canvas.width - 1);
    ctx.fillRect(p, 0, 1, canvas.height);
    ctx.fillRect(0, p, canvas.width, 1);
  }
}

function spritePixel(sprite, x, y) {
  if (x < 0 || y < 0 || y >= sprite.length || x >= sprite[y].length) return "";
  return sprite[y][x];
}

function drawPlayer() {
  const sprite = player.facing === "right" ? SPRITES.left : SPRITES[player.facing];
  const flip = player.facing === "right";
  const ox = player.x * CELL;
  const oy = player.y * CELL;

  const screenX = (x) => (flip ? ox + (CELL - 1 - x) : ox + x);

  ctx.fillStyle = OUTLINE;
  for (let y = 0; y < sprite.length; y++) {
    for (let x = 0; x < sprite[y].length; x++) {
      if (!PALETTE[spritePixel(sprite, x, y)]) continue;
      const px = screenX(x);
      const py = oy + y;
      if (!PALETTE[spritePixel(sprite, x - 1, y)]) ctx.fillRect(screenX(x - 1), py, 1, 1);
      if (!PALETTE[spritePixel(sprite, x + 1, y)]) ctx.fillRect(screenX(x + 1), py, 1, 1);
      if (!PALETTE[spritePixel(sprite, x, y - 1)]) ctx.fillRect(px, py - 1, 1, 1);
      if (!PALETTE[spritePixel(sprite, x, y + 1)]) ctx.fillRect(px, py + 1, 1, 1);
    }
  }

  for (let y = 0; y < sprite.length; y++) {
    const row = sprite[y];
    for (let x = 0; x < row.length; x++) {
      const color = PALETTE[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(screenX(x), oy + y, 1, 1);
    }
  }
}

function render() {
  drawGround();
  drawBuildings();
  if (showGrid) drawGrid();
  drawPlayer();
}

let lastTime = 0;
let accumulator = 0;

function frame(now) {
  requestAnimationFrame(frame);
  if (!lastTime) lastTime = now;

  accumulator += now - lastTime;
  lastTime = now;
  if (accumulator > FRAME_MS * 5) accumulator = FRAME_MS * 5;

  let stepped = false;
  while (accumulator >= FRAME_MS) {
    update();
    accumulator -= FRAME_MS;
    stepped = true;
  }

  if (stepped) render();
}

render();
requestAnimationFrame(frame);
