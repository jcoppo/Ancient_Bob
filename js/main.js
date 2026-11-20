import { COLS, FRAME_MS, ROWS } from "./config.js";
import { NPCS, updateNpcs } from "./npcs.js";
import { enemyBlocks, updateBarbarian } from "./enemies.js";
import { player, updatePlayer } from "./player.js";
import { blockedCell } from "./collision.js";
import { dialogueIsOpen } from "./dialogue.js";
import { areaNeighbor, crossingBlocked, enterArea } from "./world.js";
import { heldAction, heldDirection } from "./input.js";
import { startScoop, updateCrops, updateLeaves, updateScoop, updateSow, updateThrust } from "./items.js";
import { loadGame, paintMenu } from "./menu.js";
import { render, updateSmoke } from "./render.js";

function tryStep(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
    player.wrap = false;
    return !blockedCell(nx, ny, player, NPCS);
  }
  const next = areaNeighbor(dx, dy);
  if (next == null) return false;
  const destX = nx < 0 ? COLS - 1 : nx >= COLS ? 0 : nx;
  const destY = ny < 0 ? ROWS - 1 : ny >= ROWS ? 0 : ny;
  if (crossingBlocked(next, destX, destY, NPCS) || enemyBlocks(next, destX, destY)) return false;
  enterArea(next);
  player.x = destX;
  player.y = destY;
  player.wrap = true;
  return true;
}

function update() {
  if (!dialogueIsOpen()) {
    updateNpcs();
    updateBarbarian();
  }
  updateThrust();
  updateScoop();
  if (heldAction()) startScoop();
  updateSow();
  updateCrops();
  updateLeaves();
  updateSmoke();
  updatePlayer(heldDirection(), tryStep);
}

let lastTime = 0;
let accumulator = 0;

function frame(now) {
  requestAnimationFrame(frame);
  if (!lastTime) lastTime = now;

  accumulator += now - lastTime;
  lastTime = now;
  if (accumulator > FRAME_MS * 5) accumulator = FRAME_MS * 5;

  if (accumulator >= FRAME_MS) {
    update();
    accumulator %= FRAME_MS;
    render();
    paintMenu();
  }
}

loadGame();
render();
requestAnimationFrame(frame);
