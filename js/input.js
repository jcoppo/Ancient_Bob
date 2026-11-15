import { npcInFront } from "./npcs.js";
import { dialogueIsOpen, handleSpace } from "./dialogue.js";
import { dropItem, itemInReach, pickupItem } from "./items.js";

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

const heldDirs = [];

function holdDirection(key) {
  const index = heldDirs.indexOf(key);
  if (index !== -1) heldDirs.splice(index, 1);
  heldDirs.push(key);
}

function releaseDirection(key) {
  const index = heldDirs.indexOf(key);
  if (index !== -1) heldDirs.splice(index, 1);
}

export function heldDirection() {
  if (dialogueIsOpen()) return null;
  const key = heldDirs.at(-1);
  return key ? KEY_DIRS[key] : null;
}

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (KEY_DIRS[key]) {
    event.preventDefault();
    if (!event.repeat && !dialogueIsOpen()) holdDirection(key);
    return;
  }

  if (event.repeat) return;

  if (key === " " || key === "z") {
    event.preventDefault();
    if (dialogueIsOpen()) {
      handleSpace();
      return;
    }
    const item = itemInReach();
    if (item) {
      pickupItem(item);
      return;
    }
    handleSpace(npcInFront());
    return;
  }

  if (key === "x") {
    event.preventDefault();
    if (!dialogueIsOpen()) dropItem();
    return;
  }

  if (key === "q") {
    showGrid = !showGrid;
    status.textContent = showGrid
      ? "Grid on · Arrows or WASD move · Space or Z acts · X drops · Q toggles the grid"
      : "Grid off · Arrows or WASD move · Space or Z acts · X drops · Q toggles the grid";
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  releaseDirection(key);
});

window.addEventListener("blur", () => {
  heldDirs.length = 0;
});
