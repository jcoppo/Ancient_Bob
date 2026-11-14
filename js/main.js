import { FRAME_MS } from "./config.js";
import { NPCS, updateNpcs } from "./npcs.js";
import { player, takeMove } from "./player.js";
import { blockedCell } from "./collision.js";
import { dialogueIsOpen } from "./dialogue.js";
import { render } from "./render.js";
import "./input.js";

function update() {
  if (!dialogueIsOpen()) updateNpcs();
  takeMove((x, y) => blockedCell(x, y, player, NPCS));
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
