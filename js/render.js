import { CELL, COLS, ROWS } from "./config.js?v=98";
import { BAG_PALETTE, BAG_SPRITE, BUSH, BUSH_STAGES, CORPSE, GRASS_TILE, HOE_PALETTE, HOE_SPRITE, HOLD_ARMS, OUTLINE, PALETTE, PATH_TILE, ROCK_PIXELS, SOIL_TILE, SPRITES, SWORD_PALETTE, SWORD_SPRITE, TREE_PALETTE, TREE_SCALE, TREE_SPRITES, WALK_SPRITES, WATER_TILE, WHEAT_GROWTH_PIXELS, WHEAT_PALETTE, WHEAT_SPRITES } from "./pixels.js?v=98";
import { bagPose, crops, groundItems, heldItem, hoePose, leaves, seeds, swordPose } from "./items.js?v=98";
import { BUILDINGS, BUSHES, MAP, TREES, areaIndex, buildingRoofPixels } from "./world.js?v=98";
import { player } from "./player.js?v=98";
import { NPCS } from "./npcs.js?v=98";
import { barbarian } from "./enemies.js?v=98";
import { showGrid } from "./input.js?v=98";

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

function drawTrees(part) {
  const leaves = part === "leaf";
  for (const tree of TREES) {
    const sprite = TREE_SPRITES[tree.kind];
    const scale = TREE_SCALE;
    const width = sprite[0].length * scale;
    const height = sprite.length * scale;
    const ox = tree.x * CELL + Math.floor((CELL - width) / 2);
    const oy = (tree.y + 1) * CELL - height;
    for (let y = 0; y < sprite.length; y++) {
      const row = sprite[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === ".") continue;
        const trunk = ch === "t" || ch === "k";
        if (trunk === leaves) continue;
        ctx.fillStyle = TREE_PALETTE[ch];
        ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    }
  }
}

function drawBushes() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const pixels = BUSH_STAGES[BUSHES[y][x]];
      if (!pixels) continue;
      const ox = x * CELL;
      const oy = y * CELL;
      for (let py = 0; py < CELL; py++) {
        const row = pixels[py];
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
const BRICK = "#c45c3c";
const MORTAR = "#6e4538";
const CHIMNEY_X = 4;
const CHIMNEY_W = 8;
const CHIMNEY_RISE = 12;

function drawRoof(building) {
  const left = building.x * CELL;
  const top = building.y * CELL;
  const width = building.w * CELL;
  const roofHeight = buildingRoofPixels(building);
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
}

function drawBricks(x, y, w, h) {
  for (let row = 0; row < h; row++) {
    const course = Math.floor(row / 3);
    for (let col = 0; col < w; col++) {
      const seam = row % 3 === 2 || (col + (course % 2) * 2) % 4 === 0;
      ctx.fillStyle = seam ? MORTAR : BRICK;
      ctx.fillRect(x + col, y + row, 1, 1);
    }
  }
}

function drawBaker(building, part) {
  const left = building.x * CELL;
  const top = building.y * CELL;
  const width = building.w * CELL;
  const height = building.h * CELL;
  const roofHeight = buildingRoofPixels(building);
  const wallTop = top + roofHeight;
  const wallH = height - roofHeight;
  const chimneyX = left + CHIMNEY_X;

  if (part === "roof") {
    drawRoof(building);
    drawBricks(chimneyX, top - CHIMNEY_RISE, CHIMNEY_W, height + CHIMNEY_RISE);
    return;
  }

  ctx.fillStyle = STONE;
  ctx.fillRect(left + 2, wallTop, width - 4, wallH);
  ctx.fillStyle = STONE_BASE;
  ctx.fillRect(left + 2, top + height - 3, width - 4, 3);

  ctx.fillStyle = TIMBER;
  ctx.fillRect(left + 1, wallTop, width - 2, 2);
  ctx.fillRect(left + 2, wallTop, 2, wallH);
  ctx.fillRect(left + width - 4, wallTop, 2, wallH);
  ctx.fillRect(left + 14, wallTop + 10, width - 18, 2);
  for (const post of [16, 26, 36]) ctx.fillRect(left + post, wallTop, 2, 12);

  const ovenX = left + 22;
  const ovenY = top + height - 14;
  ctx.fillStyle = STONE_BASE;
  ctx.fillRect(ovenX - 1, ovenY - 2, 12, 13);
  ctx.fillStyle = OPENING;
  ctx.fillRect(ovenX, ovenY, 10, 10);
  ctx.fillStyle = STONE;
  ctx.fillRect(ovenX, ovenY, 2, 2);
  ctx.fillRect(ovenX + 8, ovenY, 2, 2);
}

const smokes = [];
let smokeClock = 0;

export function updateSmoke() {
  smokeClock += 1;
  if (areaIndex === 0 && smokeClock % 14 === 0) {
    for (const building of BUILDINGS) {
      if (building.kind !== "baker") continue;
      smokes.push({
        x: building.x * CELL + CHIMNEY_X + 2,
        y: building.y * CELL - CHIMNEY_RISE,
        drift: Math.random() < 0.5 ? -0.18 : 0.18,
        life: 42,
        max: 42,
        size: 2,
      });
    }
  }
  for (let i = smokes.length - 1; i >= 0; i--) {
    const puff = smokes[i];
    puff.y -= 0.4;
    puff.x += puff.drift;
    if (puff.life < 24) puff.size = 3;
    puff.life -= 1;
    if (puff.life <= 0) smokes.splice(i, 1);
  }
}

function drawSmoke() {
  if (areaIndex !== 0) return;
  for (const puff of smokes) {
    ctx.globalAlpha = puff.life / puff.max;
    ctx.fillStyle = puff.life > 28 ? "#f4f0e8" : "#d4cdc2";
    ctx.fillRect(Math.round(puff.x), Math.round(puff.y), puff.size, puff.size);
  }
  ctx.globalAlpha = 1;
}

function drawBuilding(building, part) {
  const left = building.x * CELL;
  const top = building.y * CELL;
  const width = building.w * CELL;
  const height = building.h * CELL;
  const roofHeight = buildingRoofPixels(building);

  if (part === "roof") {
    drawRoof(building);
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
  for (const building of BUILDINGS) {
    if (building.kind === "baker") drawBaker(building, part);
    else drawBuilding(building, part);
  }
}

function drawRock(gridX, gridY) {
  const ox = gridX * CELL;
  const oy = gridY * CELL;
  for (let y = 0; y < CELL; y++) {
    const row = ROCK_PIXELS[y];
    for (let x = 0; x < CELL; x++) {
      ctx.fillStyle = row[x];
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

function drawGround() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const mark = MAP[y][x];
      if (mark === "r") {
        drawRock(x, y);
        continue;
      }
      const ground = mark === "w" ? WATER_TILE : mark === "p" ? PATH_TILE : mark === "s" ? SOIL_TILE : GRASS_TILE;
      drawTile(ground, x, y);
    }
  }
}

function drawWheatPhase(pixels, gridX, gridY) {
  const ox = gridX * CELL;
  const oy = (gridY + 1) * CELL - pixels.length;
  for (let y = 0; y < pixels.length; y++) {
    const row = pixels[y];
    for (let x = 0; x < row.length; x++) {
      const color = row[x];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

function drawCrops(ripeOnly) {
  const here = crops.filter((crop) => crop.area === areaIndex).sort((a, b) => a.y - b.y);
  const last = WHEAT_GROWTH_PIXELS.length - 1;
  for (const crop of here) {
    const stage = Math.min(crop.stage, last);
    if ((stage === last) !== ripeOnly) continue;
    const phase = WHEAT_GROWTH_PIXELS[stage];
    if (phase) {
      drawWheatPhase(phase, crop.x, crop.y);
      continue;
    }
    const sprite = WHEAT_SPRITES[stage];
    if (!sprite) continue;
    const ox = crop.x * CELL + Math.floor((CELL - sprite[0].length) / 2);
    drawSprite(sprite, WHEAT_PALETTE, ox, (crop.y + 1) * CELL - sprite.length, false);
  }
}

function drawWater() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (MAP[y][x] === "w") drawTile(WATER_TILE, x, y);
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
  if (person.dead) return CORPSE;
  const facingKey = person.facing === "right" ? "left" : person.facing;
  const stand = person.sprites || SPRITES;
  const walks = person.walkSprites || WALK_SPRITES;
  const base = frame === 0 ? stand[facingKey] : walks[frame - 1][facingKey];
  if (!person.holding) return base;
  const arms = HOLD_ARMS[facingKey];
  return base.map((row, index) => arms[index] || row);
}

function drawCharacter(person, palette, originX = person.x * CELL, originY = person.y * CELL, frame = 0) {
  const sprite = characterSprite(person, frame);
  drawSprite(sprite, palette, originX, originY, !person.dead && person.facing === "right");
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

const HOE_HOLD = {
  up: [4, 3],
  down: [5, 3],
  left: [-3, 3],
  right: [6, 3],
};

function drawHoe(ox, oy) {
  drawSprite(HOE_SPRITE, HOE_PALETTE, ox, oy, false);
}

function drawHeldHoe(slideX, slideY, pose) {
  const [hx, hy] = HOE_HOLD[pose.facing];
  drawHoe(slideX + hx, slideY + hy + Math.round(4 * pose.t));
}

const BAG_HOLD = {
  up: [0, 2],
  down: [0, 6],
  left: [-4, 6],
  right: [4, 6],
};

function drawBag(ox, oy) {
  drawSprite(BAG_SPRITE, BAG_PALETTE, ox, oy, false);
}

function drawHeldBag(slideX, slideY, pose) {
  const [hx, hy] = BAG_HOLD[pose.facing];
  drawBag(slideX + hx, slideY + hy + Math.round(3 * pose.t));
}

const WHEAT_HOLD = {
  up: [0, -9],
  down: [4, -7],
  left: [-7, -6],
  right: [7, -6],
};

const WHEAT_BUNDLE_WIDTH = 16;
const WHEAT_BUNDLE_HEIGHT = 22;
const wheatBundleImage = new Image();
wheatBundleImage.src = new URL("../assets/images/wheat/wheat_bundle.png?v=98", import.meta.url).href;

function drawWheatBundle(ox, oy) {
  if (!wheatBundleImage.complete || !wheatBundleImage.naturalWidth) return;
  ctx.drawImage(wheatBundleImage, ox, oy);
}

function drawHeldWheat(slideX, slideY, facing) {
  const [hx, hy] = WHEAT_HOLD[facing];
  drawWheatBundle(slideX + hx, slideY + hy);
}

function drawSeeds() {
  for (const seed of seeds) {
    const t = 1 - seed.life / seed.max;
    const x = Math.round(seed.x0 + (seed.x1 - seed.x0) * t);
    const y = Math.round(seed.y0 + (seed.y1 - seed.y0) * t + Math.sin(t * Math.PI) * -4);
    ctx.fillStyle = seed.color;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawHeldSwordAt(slideX, slideY, pose) {
  const facing = pose.facing;
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

function drawNpc(npc) {
  const x = npc.x * CELL;
  const y = npc.y * CELL;
  const hoe = npc.tool === "hoe" ? { facing: npc.facing, t: npc.hoe || 0 } : null;
  if (hoe && npc.facing === "up") drawHeldHoe(x, y, hoe);
  drawCharacter(npc, npc.palette);
  if (hoe && npc.facing !== "up") drawHeldHoe(x, y, hoe);
}

function drawBarbarian() {
  if (!barbarian.entered) return;
  const attack = barbarian.attack;
  const pose = attack.frame < 0
    ? { facing: barbarian.facing, aimed: false, frame: -1 }
    : { facing: attack.facing, aimed: attack.frame <= 3, frame: attack.frame };
  const x = barbarian.x * CELL + barbarian.dx * barbarian.step;
  const y = barbarian.y * CELL + barbarian.dy * barbarian.step;
  const frame = barbarian.step > 0 ? barbarian.walk + 1 : 0;
  const behind = pose.facing === "up";
  if (behind) drawHeldSwordAt(x, y, pose);
  drawCharacter(barbarian, barbarian.palette, x, y, frame);
  if (pose.frame >= 0) drawSlash(attack.x, attack.y, attack.facing, pose.frame);
  if (!behind) drawHeldSwordAt(x, y, pose);
}

export function render() {
  drawGround();
  drawCrops(false);
  if (showGrid) drawGrid();
  for (const item of groundItems()) {
    if (item.kind === "sword") drawSword(item.x * CELL, item.y * CELL, false);
    if (item.kind === "hoe") drawHoe(item.x * CELL, item.y * CELL + CELL - HOE_SPRITE.length);
    if (item.kind === "bag") drawBag(item.x * CELL, item.y * CELL + CELL - BAG_SPRITE.length);
    if (item.kind === "wheat") {
      const ox = item.x * CELL + Math.floor((CELL - WHEAT_BUNDLE_WIDTH) / 2);
      drawWheatBundle(ox, (item.y + 1) * CELL - WHEAT_BUNDLE_HEIGHT);
    }
  }
  for (const npc of NPCS) {
    if ((npc.area ?? 0) !== areaIndex) continue;
    if (npc.dead) drawCharacter(npc, npc.palette);
  }
  for (const npc of NPCS) {
    if ((npc.area ?? 0) !== areaIndex || npc.dead) continue;
    drawNpc(npc);
  }
  if (areaIndex === 0) drawBarbarian();
  const slideX = (player.wrap ? player.x - player.dx : player.x) * CELL + player.dx * player.step;
  const slideY = (player.wrap ? player.y - player.dy : player.y) * CELL + player.dy * player.step;
  const held = heldItem();
  const pose = held?.kind === "sword" ? swordPose() : null;
  const swordFacing = pose ? (pose.frame >= 0 ? pose.facing : player.facing) : null;
  const swordBehind = swordFacing === "up";
  const hoe = held?.kind === "hoe" ? hoePose() : null;
  const hoeBehind = hoe?.facing === "up";
  const bag = held?.kind === "bag" ? bagPose() : null;
  const bagBehind = bag?.facing === "up";
  const wheatBehind = held?.kind === "wheat" && player.facing === "up";
  if (pose && swordBehind) drawHeldSwordAt(slideX, slideY, pose);
  if (hoe && hoeBehind) drawHeldHoe(slideX, slideY, hoe);
  if (bag && bagBehind) drawHeldBag(slideX, slideY, bag);
  if (wheatBehind) drawHeldWheat(slideX, slideY, player.facing);
  drawCharacter(player, PALETTE, slideX, slideY, player.step > 0 ? player.walk + 1 : 0);
  if (pose && pose.frame >= 0) drawSlash(pose.x, pose.y, pose.facing, pose.frame);
  for (const leaf of leaves) {
    ctx.globalAlpha = leaf.life / leaf.max;
    ctx.fillStyle = leaf.color;
    ctx.fillRect(Math.round(leaf.x), Math.round(leaf.y), leaf.size, leaf.size);
  }
  ctx.globalAlpha = 1;
  if (pose && !swordBehind) drawHeldSwordAt(slideX, slideY, pose);
  if (hoe && !hoeBehind) drawHeldHoe(slideX, slideY, hoe);
  if (bag && !bagBehind) drawHeldBag(slideX, slideY, bag);
  if (held?.kind === "wheat" && !wheatBehind) drawHeldWheat(slideX, slideY, player.facing);
  drawCrops(true);
  drawSeeds();
  drawWater();
  drawBushes();
  drawBuildings("wall");
  drawTrees("trunk");
  drawBuildings("roof");
  drawTrees("leaf");
  drawSmoke();
  drawHealth();
}

const HEART = [
  ".#.#.",
  "#####",
  "#####",
  ".###.",
  "..#..",
];

const DIGITS = {
  0: ["###", "#.#", "#.#", "#.#", "###"],
  1: [".#.", "##.", ".#.", ".#.", "###"],
  2: ["###", "..#", "###", "#..", "###"],
  3: ["###", "..#", "###", "..#", "###"],
  4: ["#.#", "#.#", "###", "..#", "..#"],
  5: ["###", "#..", "###", "..#", "###"],
  6: ["###", "#..", "###", "#.#", "###"],
  7: ["###", "..#", "..#", "..#", "..#"],
  8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "###"],
  "/": ["..#", "..#", ".#.", "#..", "#.."],
};

function drawGlyph(rows, ox, oy, color) {
  ctx.fillStyle = "#1a140f";
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] !== "#") continue;
      ctx.fillRect(ox + x - 1, oy + y, 1, 1);
      ctx.fillRect(ox + x + 1, oy + y, 1, 1);
      ctx.fillRect(ox + x, oy + y - 1, 1, 1);
      ctx.fillRect(ox + x, oy + y + 1, 1, 1);
    }
  }
  ctx.fillStyle = color;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] === "#") ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

function drawHealth() {
  const x0 = 4;
  const y0 = 4;
  drawGlyph(HEART, x0, y0, "#c4473a");
  let textX = x0 + HEART[0].length + 3;
  for (const ch of `${player.hp}/${player.maxHp}`) {
    const glyph = DIGITS[ch];
    drawGlyph(glyph, textX, y0, "#f6edd4");
    textX += glyph[0].length + 1;
  }
  const barY = y0 + HEART.length + 2;
  const barW = 5 * 6;
  const barH = 3;
  const filled = Math.round((Math.min(player.hp, 5) / 5) * barW);
  ctx.fillStyle = "#1a140f";
  ctx.fillRect(x0 - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = "#3a2e28";
  ctx.fillRect(x0, barY, barW, barH);
  ctx.fillStyle = "#c4473a";
  ctx.fillRect(x0, barY, filled, barH);
}
