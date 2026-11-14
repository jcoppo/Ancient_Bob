import { CELL, COLS, ROWS } from "./config.js";
import { BUSH, GRASS_TILE, OUTLINE, PALETTE, SPRITES, WATER_TILE } from "./pixels.js";
import { BUILDINGS, BUSHES, MAP } from "./world.js";
import { player } from "./player.js";
import { NPCS } from "./npcs.js";
import { showGrid } from "./input.js";

const canvas = document.getElementById("game");
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

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

function drawBushes() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (BUSHES[y][x] !== "b") continue;
      const ox = x * CELL;
      const oy = y * CELL;
      for (let py = 0; py < CELL; py++) {
        const row = BUSH.pixels[py];
        for (let px = 0; px < CELL; px++) {
          const color = BUSH[row[px]];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(ox + px, oy + py, 1, 1);
        }
      }
    }
  }
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

function drawCharacter(person, palette) {
  const sprite = person.facing === "right" ? SPRITES.left : SPRITES[person.facing];
  const flip = person.facing === "right";
  const ox = person.x * CELL;
  const oy = person.y * CELL;

  const screenX = (x) => (flip ? ox + (CELL - 1 - x) : ox + x);

  ctx.fillStyle = OUTLINE;
  for (let y = 0; y < sprite.length; y++) {
    for (let x = 0; x < sprite[y].length; x++) {
      if (!palette[spritePixel(sprite, x, y)]) continue;
      const px = screenX(x);
      const py = oy + y;
      if (!palette[spritePixel(sprite, x - 1, y)]) ctx.fillRect(screenX(x - 1), py, 1, 1);
      if (!palette[spritePixel(sprite, x + 1, y)]) ctx.fillRect(screenX(x + 1), py, 1, 1);
      if (!palette[spritePixel(sprite, x, y - 1)]) ctx.fillRect(px, py - 1, 1, 1);
      if (!palette[spritePixel(sprite, x, y + 1)]) ctx.fillRect(px, py + 1, 1, 1);
    }
  }

  for (let y = 0; y < sprite.length; y++) {
    const row = sprite[y];
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(screenX(x), oy + y, 1, 1);
    }
  }
}

export function render() {
  drawGround();
  drawBushes();
  drawBuildings();
  if (showGrid) drawGrid();
  for (const npc of NPCS) drawCharacter(npc, npc.palette);
  drawCharacter(player, PALETTE);
}
