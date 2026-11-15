import { COLS, FRAME_MS, ROWS } from "./config.js";
import { NPCS, updateNpcs } from "./npcs.js";
import { player, updatePlayer } from "./player.js";
import { blockedCell } from "./collision.js";
import { dialogueIsOpen } from "./dialogue.js";
import { areaIndex, crossingBlocked, enterArea } from "./world.js";
import { heldDirection } from "./input.js";
import { render } from "./render.js";

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
  if (!dialogueIsOpen()) updateNpcs();
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
