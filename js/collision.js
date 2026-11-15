import { COLS, ROWS } from "./config.js?v=6";
import { MAP, areaIndex, buildingAt, bushAt } from "./world.js?v=6";

export function blockedCell(x, y, player, npcs, ignoreNpc) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  if (MAP[y][x] === "w" || buildingAt(x, y) || bushAt(x, y)) return true;
  if (player.x === x && player.y === y) return true;
  if (player.step > 0 && !player.wrap && x === player.x + player.dx && y === player.y + player.dy) return true;
  if (areaIndex !== 0) return false;
  return npcs.some((npc) => npc !== ignoreNpc && npc.x === x && npc.y === y);
}
