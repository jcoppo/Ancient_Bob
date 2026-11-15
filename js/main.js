import { COLS, FRAME_MS, ROWS } from "./config.js?v=22";
import { NPCS, updateNpcs } from "./npcs.js?v=22";
import { updateBarbarian } from "./enemies.js?v=22";
import { player, updatePlayer } from "./player.js?v=22";
import { blockedCell } from "./collision.js?v=22";
import { dialogueIsOpen } from "./dialogue.js?v=22";
import { areaIndex, crossingBlocked, enterArea } from "./world.js?v=22";
import { heldDirection } from "./input.js?v=22";
import { updateLeaves, updateThrust } from "./items.js?v=22";
import { render } from "./render.js?v=22";

function tryStep(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (ny < 0 || ny >= ROWS) return false;
  if (nx < 0 || nx >= COLS) {
    const next = nx < 0 ? areaIndex - 1 : areaIndex + 1;
    const destX = nx < 0 ? COLS - 1 : 0;
    if (crossingBlocked(next, destX, ny, NPCS)) return false;
    enterArea(next);
    player.x = destX;
    player.y = ny;
    player.wrap = true;
    return true;
  }
  player.wrap = false;
  return !blockedCell(nx, ny, player, NPCS);
}

function update() {
  if (!dialogueIsOpen()) {
    updateNpcs();
    updateBarbarian();
  }
  updateThrust();
  updateLeaves();
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

  if (stepped) render();
}

render();
requestAnimationFrame(frame);
