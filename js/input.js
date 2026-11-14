import { moveQueue } from "./player.js";
import { npcInFront } from "./npcs.js";
import { dialogueIsOpen, handleSpace } from "./dialogue.js";

const status = document.getElementById("status");

export let showGrid = false;

const KEY_DIRS = {
  ArrowUp: [0, -1, "up"],
  ArrowDown: [0, 1, "down"],
  ArrowLeft: [-1, 0, "left"],
  ArrowRight: [1, 0, "right"],
  w: [0, -1, "up"],
  a: [-1, 0, "left"],
  s: [0, 1, "down"],
  d: [1, 0, "right"],
};

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (event.key === " ") {
    event.preventDefault();
    handleSpace(npcInFront());
    return;
  }

  if (dialogueIsOpen() && KEY_DIRS[key]) {
    event.preventDefault();
    return;
  }

  if (key === "q") {
    showGrid = !showGrid;
    status.textContent = showGrid
      ? "Grid on · Arrows or WASD move · Space talks · Q toggles the grid"
      : "Grid off · Arrows or WASD move · Space talks · Q toggles the grid";
    event.preventDefault();
    return;
  }

  const dir = KEY_DIRS[key];
  if (!dir) return;

  event.preventDefault();
  moveQueue.push(dir);
});
