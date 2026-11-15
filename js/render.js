import { CELL, COLS, ROWS } from "./config.js";
import { BUSH, GRASS_TILE, HOLD_ARMS, OUTLINE, PALETTE, PATH_TILE, SPRITES, SWORD_PALETTE, SWORD_SPRITE, WALK_SPRITES, WATER_TILE } from "./pixels.js";
import { groundItems, heldItem } from "./items.js";
import { BUILDINGS, BUSHES, MAP, areaIndex, buildingRoofPixels } from "./world.js";
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

const STONE = "#e4dcc8";
const STONE_BASE = "#6e604e";
const TIMBER = "#5c4634";
const ROOF = "#a64b38";
const TILE = "#8a3c2c";
const DOOR = "#6b4630";
const OPENING = "#241c16";

function drawBuilding(building, part) {
  const left = building.x * CELL;
  const top = building.y * CELL;
  const width = building.w * CELL;
  const height = building.h * CELL;
  const roofHeight = buildingRoofPixels(building);

  if (part === "roof") {
    for (let row = 0; row < roofHeight; row++) {
      const inset = Math.floor(((roofHeight - row) * (width / 2 - 2)) / roofHeight);
      const x = left + inset;
      const w = width - inset * 2;
      ctx.fillStyle = row % 3 === 2 ? TILE : ROOF;
      ctx.fillRect(x, top + row, w, 1);
      ctx.fillStyle = TIMBER;
      ctx.fillRect(x, top + row, 1, 1);
      ctx.fillRect(x + w - 1, top + row, 1, 1);
    }
    return;
  }

  const wallTop = top + roofHeight;
  const wallH = height - roofHeight;
  ctx.fillStyle = STONE;
  ctx.fillRect(left + 2, wallTop, width - 4, wallH);
  ctx.fillStyle = STONE_BASE;
  ctx.fillRect(left + 2, top + height - 2, width - 4, 2);

  ctx.fillStyle = TIMBER;
  ctx.fillRect(left + 1, wallTop, width - 2, 2);
  ctx.fillRect(left + 2, wallTop, 2, wallH);
  ctx.fillRect(left + width - 4, wallTop, 2, wallH);
  if (building.w >= 4) {
    ctx.fillRect(left + 18, wallTop, 2, wallH);
    ctx.fillRect(left + width - 20, wallTop, 2, wallH);
  }
  if (building.h >= 4) {
    ctx.fillRect(left + 2, wallTop + Math.floor(wallH * 0.4), width - 4, 2);
  }

  const doorW = building.w >= 4 ? 8 : 6;
  const doorH = Math.min(building.h >= 4 ? 16 : 12, wallH - 6);
  const doorX = left + Math.floor((width - doorW) / 2);
  const doorY = top + height - doorH;
  ctx.fillStyle = TIMBER;
  ctx.fillRect(doorX - 1, doorY, doorW + 2, doorH);
  ctx.fillStyle = DOOR;
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.fillStyle = TIMBER;
  ctx.fillRect(doorX + Math.floor(doorW / 2), doorY, 1, doorH);

  const win = 4;
  const windows = building.w >= 4 ? [left + 10, left + width - 14] : [left + 8, left + width - 12];
  const rows = [wallTop + 6];
  if (building.h >= 4) rows.push(wallTop + Math.floor(wallH * 0.4) + 4);
  for (const winY of rows) {
    for (const wx of windows) {
      ctx.fillStyle = TIMBER;
      ctx.fillRect(wx - 1, winY - 1, win + 2, win + 2);
      ctx.fillStyle = OPENING;
      ctx.fillRect(wx, winY, win, win);
    }
  }
}

function drawBuildings(part) {
  for (const building of BUILDINGS) drawBuilding(building, part);
}

function drawGround() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ground = MAP[y][x] === "w" ? WATER_TILE : MAP[y][x] === "p" ? PATH_TILE : GRASS_TILE;
      drawTile(ground, x, y);
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

function drawSprite(sprite, palette, ox, oy, flip) {
  const width = sprite[0].length;
  const screenX = (x) => (flip ? ox + (width - 1 - x) : ox + x);

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

function characterSprite(person, frame) {
  const facingKey = person.facing === "right" ? "left" : person.facing;
  const base = frame === 0 ? SPRITES[facingKey] : WALK_SPRITES[frame - 1][facingKey];
  if (!person.holding) return base;
  const arms = HOLD_ARMS[facingKey];
  return base.map((row, index) => arms[index] || row);
}

function drawCharacter(person, palette, originX = person.x * CELL, originY = person.y * CELL, frame = 0) {
  const sprite = characterSprite(person, frame);
  drawSprite(sprite, palette, originX, originY, person.facing === "right");
}

function drawSword(ox, oy, flip) {
  drawSprite(SWORD_SPRITE, SWORD_PALETTE, ox, oy, flip);
}

export function render() {
  drawGround();
  drawBushes();
  drawBuildings("wall");
  if (showGrid) drawGrid();
  for (const item of groundItems()) {
    if (item.kind === "sword") drawSword(item.x * CELL, item.y * CELL, false);
  }
  if (areaIndex === 0) {
    for (const npc of NPCS) drawCharacter(npc, npc.palette);
  }
  const slideX = (player.wrap ? player.x - player.dx : player.x) * CELL + player.dx * player.step;
  const slideY = (player.wrap ? player.y - player.dy : player.y) * CELL + player.dy * player.step;
  drawCharacter(player, PALETTE, slideX, slideY, player.step > 0 ? player.walk + 1 : 0);
  if (heldItem()?.kind === "sword") {
    const [ox, oy] = { down: [4, -4], up: [4, -5], left: [-5, -4], right: [5, -4] }[player.facing];
    drawSword(slideX + ox, slideY + oy, false);
  }
  drawBuildings("roof");
}
