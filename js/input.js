import { npcInFront } from "./npcs.js?v=98";
import { declineDialogue, dialogueIsOpen, handleSpace, moveDialogue } from "./dialogue.js?v=98";
import { destroyYoungWheat, dropItem, harvestWheat, heldItem, itemInReach, pickupItem, startScoop, startSow, startThrust } from "./items.js?v=98";
import { backMenu, closeMenu, menuIsOpen, moveMenu, openMenu, selectMenu } from "./menu.js?v=98";

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

  if (menuIsOpen() && KEY_DIRS[key]) {
    event.preventDefault();
    const dy = KEY_DIRS[key][1];
    if (dy !== 0) moveMenu(dy);
    return;
  }

  if (KEY_DIRS[key]) {
    event.preventDefault();
    if (dialogueIsOpen()) {
      const dy = KEY_DIRS[key][1];
      if (dy !== 0) moveDialogue(dy);
      return;
    }
    if (!event.repeat) holdDirection(key);
    return;
  }

  if (event.repeat) return;

  if (key === "Enter") {
    event.preventDefault();
    if (menuIsOpen()) closeMenu();
    else if (!dialogueIsOpen()) openMenu();
    return;
  }

  if (key === " " || key === "z") {
    event.preventDefault();
    if (menuIsOpen()) {
      selectMenu();
      return;
    }
    if (dialogueIsOpen()) {
      handleSpace();
      return;
    }
    const npc = npcInFront();
    if (npc) {
      handleSpace(npc);
      return;
    }
    if (destroyYoungWheat()) return;
    if (harvestWheat()) return;
    const held = heldItem();
    if (held?.kind === "sword") {
      startThrust();
      return;
    }
    if (held?.kind === "hoe") {
      startScoop();
      return;
    }
    if (held?.kind === "bag") {
      startSow();
      return;
    }
    if (!held) {
      const item = itemInReach();
      if (item) pickupItem(item);
    }
    return;
  }

  if (key === "x") {
    event.preventDefault();
    if (menuIsOpen()) {
      backMenu();
      return;
    }
    if (dialogueIsOpen()) {
      declineDialogue();
      return;
    }
    dropItem();
    return;
  }

  if (key === "q") {
    showGrid = !showGrid;
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
