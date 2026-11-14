import { COLS, ROWS } from "./config.js";

export const player = {
  x: Math.floor(COLS / 2) - 1,
  y: Math.floor(ROWS / 2) - 1,
  facing: "down",
};

export const moveQueue = [];

export function takeMove(blocked) {
  const dir = moveQueue.shift();
  if (!dir) return;

  const [dx, dy, facing] = dir;
  const nx = player.x + dx;
  const ny = player.y + dy;
  player.facing = facing;
  if (blocked(nx, ny)) return;

  player.x = nx;
  player.y = ny;
}
