import { COLS, FRAME_MS, ROWS } from "./config.js";
import { NPCS, updateNpcs } from "./npcs.js";
import { player, takeMove } from "./player.js";
import { blockedCell } from "./collision.js";
import { dialogueIsOpen } from "./dialogue.js";
import { areaIndex, crossingBlocked, enterArea } from "./world.js";
import { render } from "./render.js";
import "./input.js";

function crossedEdge(nx, ny) {
  if (ny < 0 || ny >= ROWS) return false;
  if (nx >= COLS) {
    if (!crossingBlocked(areaIndex + 1, 0, ny, NPCS)) {
      enterArea(areaIndex + 1);
      player.x = 0;
      player.y = ny;
    }
    return true;
  }
  if (nx < 0) {
    if (!crossingBlocked(areaIndex - 1, COLS - 1, ny, NPCS)) {
      enterArea(areaIndex - 1);
      player.x = COLS - 1;
      player.y = ny;
    }
    return true;
  }
  return false;
}

function update() {
  if (!dialogueIsOpen()) updateNpcs();
  takeMove((x, y) => crossedEdge(x, y) || blockedCell(x, y, player, NPCS));
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
