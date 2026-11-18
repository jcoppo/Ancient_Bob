import { COLS, FRAME_MS, ROWS } from "./config.js?v=92";
import { NPCS, updateNpcs } from "./npcs.js?v=92";
import { updateBarbarian } from "./enemies.js?v=92";
import { player, updatePlayer } from "./player.js?v=92";
import { blockedCell } from "./collision.js?v=92";
import { dialogueIsOpen } from "./dialogue.js?v=92";
import { areaNeighbor, crossingBlocked, enterArea } from "./world.js?v=92";
import { heldDirection } from "./input.js?v=92";
import { updateCrops, updateLeaves, updateScoop, updateSow, updateThrust } from "./items.js?v=92";
import { loadGame, paintMenu } from "./menu.js?v=92";
import { render, updateSmoke } from "./render.js?v=92";

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
  if (crossingBlocked(next, destX, destY, NPCS)) return false;
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

  let stepped = false;
  while (accumulator >= FRAME_MS) {
    update();
    accumulator -= FRAME_MS;
    stepped = true;
  }

  if (stepped) {
    render();
    paintMenu();
  }
}

loadGame();
render();
requestAnimationFrame(frame);
