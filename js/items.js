import { CELL } from "./config.js?v=7";
import { player } from "./player.js?v=7";
import { areaIndex } from "./world.js?v=7";

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
  thrust.frame = -1;
}

const SLASH_FRAMES = 6;

export const thrust = {
  frame: -1,
  facing: "down",
  x: 0,
  y: 0,
};

export function startThrust() {
  if (!heldItem()) return;
  thrust.facing = player.facing;
  thrust.x = (player.wrap ? player.x - player.dx : player.x) * CELL + player.dx * player.step;
  thrust.y = (player.wrap ? player.y - player.dy : player.y) * CELL + player.dy * player.step;
  thrust.frame = 0;
}

export function updateThrust() {
  if (thrust.frame < 0) return;
  thrust.frame += 1;
  if (thrust.frame >= SLASH_FRAMES) thrust.frame = -1;
}

export function swordPose() {
  if (thrust.frame < 0) return { facing: player.facing, aimed: false, frame: -1, x: 0, y: 0 };
  return {
    facing: thrust.facing,
    aimed: thrust.frame <= 3,
    frame: thrust.frame,
    x: thrust.x,
    y: thrust.y,
  };
}
