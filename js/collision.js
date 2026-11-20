import { COLS, ROWS } from "./config.js";
import { MAP, areaIndex, buildingAt, bushAt, treeAt } from "./world.js";
import { enemies } from "./enemies.js";

export function blockedCell(x, y, player, npcs, ignoreNpc, allowWater = false) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  const mark = MAP[y][x];
  if (mark === "r" || (!allowWater && mark === "w") || buildingAt(x, y) || bushAt(x, y) || treeAt(x, y)) return true;
  if (player.x === x && player.y === y) return true;
  if (player.step > 0 && !player.wrap && x === player.x + player.dx && y === player.y + player.dy) return true;
  for (const enemy of enemies) {
    if (enemy.area !== areaIndex || enemy === ignoreNpc) continue;
    if (enemy.x === x && enemy.y === y) return true;
    if (enemy.step > 0 && !enemy.wrap && x === enemy.x + enemy.dx && y === enemy.y + enemy.dy) return true;
  }
  return npcs.some((npc) => npc !== ignoreNpc && (npc.area ?? 0) === areaIndex && npc.x === x && npc.y === y);
}
