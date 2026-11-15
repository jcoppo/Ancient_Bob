import { CELL, COLS, ROWS } from "./config.js";
import { BUSH, GRASS_TILE, HOLD_ARMS, OUTLINE, PALETTE, PATH_TILE, SPRITES, SWORD_PALETTE, SWORD_SPRITE, WALK_SPRITES, WATER_TILE } from "./pixels.js";
import { groundItems, heldItem, swordPose } from "./items.js";
import { BUILDINGS, BUSHES, MAP, areaIndex, buildingRoofPixels } from "./world.js";
import { player } from "./player.js";
import { NPCS } from "./npcs.js";
import { showGrid } from "./input.js?v=4";

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
  const at = (x, y) => spritePixel(sprite, x, y);

  ctx.fillStyle = OUTLINE;
  for (let y = 0; y < sprite.length; y++) {
    for (let x = 0; x < sprite[y].length; x++) {
      if (!palette[at(x, y)]) continue;
      const px = screenX(x);
      const py = oy + y;
      if (!palette[at(x - 1, y)]) ctx.fillRect(screenX(x - 1), py, 1, 1);
      if (!palette[at(x + 1, y)]) ctx.fillRect(screenX(x + 1), py, 1, 1);
      if (!palette[at(x, y - 1)]) ctx.fillRect(px, py - 1, 1, 1);
      if (!palette[at(x, y + 1)]) ctx.fillRect(px, py + 1, 1, 1);
    }
  }

  for (let y = 0; y < sprite.length; y++) {
    const row = sprite[y];
    for (let x = 0; x < row.length; x++) {
      const color = palette[at(x, y)];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(screenX(x), oy + y, 1, 1);
    }
  }
}

function facingPixel(sprite, x, y, facing) {
  const width = sprite[0].length;
  const height = sprite.length;
  if (facing === "down") return spritePixel(sprite, x, height - 1 - y);
  if (facing === "left") return spritePixel(sprite, width - 1 - y, x);
  if (facing === "right") return spritePixel(sprite, y, height - 1 - x);
  return spritePixel(sprite, x, y);
}

function drawPointedSprite(sprite, palette, ox, oy, facing) {
  const width = sprite[0].length;
  const height = sprite.length;
  const turned = facing === "left" || facing === "right";
  const dw = turned ? height : width;
  const dh = turned ? width : height;
  const at = (x, y) => (x < 0 || y < 0 || x >= dw || y >= dh ? "" : facingPixel(sprite, x, y, facing));

  ctx.fillStyle = OUTLINE;
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      if (!palette[at(x, y)]) continue;
      if (!palette[at(x - 1, y)]) ctx.fillRect(ox + x - 1, oy + y, 1, 1);
      if (!palette[at(x + 1, y)]) ctx.fillRect(ox + x + 1, oy + y, 1, 1);
      if (!palette[at(x, y - 1)]) ctx.fillRect(ox + x, oy + y - 1, 1, 1);
      if (!palette[at(x, y + 1)]) ctx.fillRect(ox + x, oy + y + 1, 1, 1);
    }
  }

  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const color = palette[at(x, y)];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
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

const SWORD_HOLD = {
  up: [4, -5],
  down: [4, -4],
  left: [-5, -4],
  right: [5, -4],
};

const SWORD_PIVOT = [7, 12];

const SLASH_TURN = {
  right: Math.PI / 2,
  left: -Math.PI / 2,
  down: Math.PI,
  up: 0,
};

const SLASH_LINES = {
  right: [[16, 3, 24, 11], [16, 7, 24, 15], [18, 1, 26, 9]],
  left: [[0, 3, -8, 11], [0, 7, -8, 15], [-2, 1, -10, 9]],
  up: [[3, 0, 11, -8], [7, 0, 15, -8], [1, -2, 9, -10]],
  down: [[3, 16, 11, 24], [7, 16, 15, 24], [1, 18, 9, 26]],
};

function drawSword(ox, oy, facing) {
  drawPointedSprite(SWORD_SPRITE, SWORD_PALETTE, ox, oy, facing);
}

function drawHeldSwordAt(slideX, slideY, pose) {
  const facing = pose.frame >= 0 ? pose.facing : player.facing;
  const [hx, hy] = SWORD_HOLD[facing];
  const [pivotX, pivotY] = SWORD_PIVOT;
  const lift = pose.aimed && facing === "up" ? -7 : 0;
  drawHeldSword(
    slideX + hx + pivotX,
    slideY + hy + pivotY + lift,
    pose.aimed && facing !== "up" ? SLASH_TURN[facing] : 0,
  );
}

function drawHeldSword(gripX, gripY, angle) {
  const [pivotX, pivotY] = SWORD_PIVOT;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dots = [];
  for (let y = 0; y < SWORD_SPRITE.length; y++) {
    for (let x = 0; x < SWORD_SPRITE[y].length; x++) {
      const color = SWORD_PALETTE[SWORD_SPRITE[y][x]];
      if (!color) continue;
      const dx = x - pivotX;
      const dy = y - pivotY;
      dots.push([
        Math.round(gripX + dx * cos - dy * sin),
        Math.round(gripY + dx * sin + dy * cos),
        color,
      ]);
    }
  }
  const filled = new Set(dots.map(([x, y]) => `${x},${y}`));
  ctx.fillStyle = OUTLINE;
  for (const [x, y] of dots) {
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (!filled.has(`${nx},${ny}`)) ctx.fillRect(nx, ny, 1, 1);
    }
  }
  for (const [x, y, color] of dots) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }
}

function slashLine(x0, y0, x1, y1) {
  const points = [];
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    points.push([
      Math.round(x0 + ((x1 - x0) * i) / steps),
      Math.round(y0 + ((y1 - y0) * i) / steps),
    ]);
  }
  return points;
}

function drawSlash(worldX, worldY, facing, frame) {
  if (frame < 1 || frame > 4) return;
  ctx.fillStyle = frame < 3 ? "#fff6d6" : "#e6c15a";
  for (const [x0, y0, x1, y1] of SLASH_LINES[facing]) {
    for (const [x, y] of slashLine(x0, y0, x1, y1)) {
      ctx.fillRect(worldX + x, worldY + y, 1, 1);
    }
  }
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
  const pose = heldItem()?.kind === "sword" ? swordPose() : null;
  const swordFacing = pose ? (pose.frame >= 0 ? pose.facing : player.facing) : null;
  const swordBehind = swordFacing === "up";
  if (pose && swordBehind) drawHeldSwordAt(slideX, slideY, pose);
  drawCharacter(player, PALETTE, slideX, slideY, player.step > 0 ? player.walk + 1 : 0);
  if (pose && pose.frame >= 0) drawSlash(pose.x, pose.y, pose.facing, pose.frame);
  if (pose && !swordBehind) drawHeldSwordAt(slideX, slideY, pose);
  drawBuildings("roof");
}
