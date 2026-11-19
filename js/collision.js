import { COLS, ROWS } from "./config.js?v=122";
import { MAP, areaIndex, buildingAt, bushAt, treeAt } from "./world.js?v=122";
import { barbarian } from "./enemies.js?v=122";

export function blockedCell(x, y, player, npcs, ignoreNpc) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  if (MAP[y][x] === "w" || MAP[y][x] === "r" || buildingAt(x, y) || bushAt(x, y) || treeAt(x, y)) return true;
  if (player.x === x && player.y === y) return true;
  if (player.step > 0 && !player.wrap && x === player.x + player.dx && y === player.y + player.dy) return true;
  if (areaIndex === 0 && barbarian !== ignoreNpc && barbarian.x === x && barbarian.y === y) return true;
  if (areaIndex === 0 && barbarian !== ignoreNpc && barbarian.step > 0 && x === barbarian.x + barbarian.dx && y === barbarian.y + barbarian.dy) return true;
  return npcs.some((npc) => npc !== ignoreNpc && (npc.area ?? 0) === areaIndex && npc.x === x && npc.y === y);
}
