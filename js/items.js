import { player } from "./player.js";
import { areaIndex } from "./world.js";

export const items = [
  { kind: "sword", area: 0, x: player.x + 3, y: player.y, held: false },
];

export function groundItems() {
  return items.filter((item) => !item.held && item.area === areaIndex);
}

export function heldItem() {
  return items.find((item) => item.held) || null;
}

export function itemInReach() {
  return groundItems().find((item) => item.x === player.x && item.y === player.y);
}

export function pickupItem(item) {
  item.held = true;
  player.holding = item.kind;
}

export function dropItem() {
  const item = heldItem();
  if (!item) return;
  item.held = false;
  item.area = areaIndex;
  item.x = player.x;
  item.y = player.y;
  player.holding = null;
}
