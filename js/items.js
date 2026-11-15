import { CELL } from "./config.js?v=36";
import { player } from "./player.js?v=36";
import { areaIndex, cutBush, tillGrass } from "./world.js?v=36";

export const items = [
  { kind: "sword", area: 0, x: player.x + 2, y: player.y - 1, held: false },
  { kind: "hoe", area: 0, x: player.x, y: player.y - 1, held: false },
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
  scoop.frame = -1;
}

const SLASH_FRAMES = 6;

export const thrust = {
  frame: -1,
  facing: "down",
  x: 0,
  y: 0,
};

const LEAF_FALL = [
  [2, 3, "#2a4a22", 4, 0.12],
  [6, 2, "#3c6a30", 2, 0.18],
  [10, 3, "#4d7c3c", 3, 0.14],
  [13, 5, "#345c28", 4, 0.22],
  [3, 6, "#5a8a42", 2, 0.16],
  [7, 6, "#3c6a30", 3, 0.2],
  [11, 7, "#4d7c3c", 4, 0.15],
  [4, 9, "#2f5428", 2, 0.24],
  [8, 9, "#3c6a30", 3, 0.13],
  [12, 10, "#5a8a42", 2, 0.19],
  [5, 12, "#2a4a22", 4, 0.17],
  [9, 12, "#4d7c3c", 3, 0.21],
  [2, 11, "#345c28", 2, 0.14],
  [13, 12, "#3c6a30", 4, 0.18],
];

const LEAF_LIFE = 28;

export const leaves = [];

function burstLeaves(cellX, cellY) {
  const ox = cellX * CELL;
  const oy = cellY * CELL;
  for (const [px, py, color, size, fall] of LEAF_FALL) {
    const dx = px + size / 2 - 8;
    const dy = py + size / 2 - 8;
    const dist = Math.hypot(dx, dy) || 1;
    leaves.push({
      x: ox + px,
      y: oy + py,
      vx: (dx / dist) * 0.7,
      vy: (dy / dist) * 0.7,
      fall,
      color,
      size,
      life: LEAF_LIFE,
      max: LEAF_LIFE,
    });
  }
}

export function updateLeaves() {
  for (let i = leaves.length - 1; i >= 0; i--) {
    const leaf = leaves[i];
    leaf.x += leaf.vx;
    leaf.y += leaf.vy + leaf.fall;
    leaf.vx *= 0.72;
    leaf.vy *= 0.72;
    leaf.life -= 1;
    if (leaf.life <= 0) leaves.splice(i, 1);
  }
}

export function startThrust() {
  if (heldItem()?.kind !== "sword") return;
  thrust.facing = player.facing;
  thrust.x = (player.wrap ? player.x - player.dx : player.x) * CELL + player.dx * player.step;
  thrust.y = (player.wrap ? player.y - player.dy : player.y) * CELL + player.dy * player.step;
  thrust.frame = 0;
  const offset = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.facing];
  const bushX = player.x + offset[0];
  const bushY = player.y + offset[1];
  if (cutBush(bushX, bushY) === "break") burstLeaves(bushX, bushY);
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

const SCOOP_FRAMES = 6;

export const scoop = {
  frame: -1,
  facing: "down",
};

export function startScoop() {
  if (heldItem()?.kind !== "hoe") return;
  scoop.facing = player.facing;
  scoop.frame = 0;
  tillGrass(player.x, player.y);
}

export function updateScoop() {
  if (scoop.frame < 0) return;
  scoop.frame += 1;
  if (scoop.frame >= SCOOP_FRAMES) scoop.frame = -1;
}

export function hoePose() {
  const facing = scoop.frame < 0 ? player.facing : scoop.facing;
  const t = scoop.frame < 0 ? 0 : Math.sin(((scoop.frame + 0.5) / SCOOP_FRAMES) * Math.PI);
  return { facing, frame: scoop.frame, t };
}
