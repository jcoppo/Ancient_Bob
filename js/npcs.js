import { MAN_PALETTE, WOMAN_PALETTE, OLD_MAN_PALETTE } from "./pixels.js";
import { player } from "./player.js";
import { blockedCell } from "./collision.js";
import { areaIndex } from "./world.js";

const STEP_DIRS = [
  [0, -1, "up"],
  [0, 1, "down"],
  [-1, 0, "left"],
  [1, 0, "right"],
];

export const NPCS = [
  {
    name: "Bram",
    x: 19,
    y: 8,
    facing: "down",
    palette: MAN_PALETTE,
    wait: 80,
    line: "The north road folded shut at dusk. People who take it come back turned around, swearing they walked through a door that was never there. Something in this town is moving the paths. I followed my own footprints home, and they ended at a wall of trees that was not there in the morning. If you go looking, take a light, and do not trust the way back.",
  },
  {
    name: "Lila",
    x: 16,
    y: 18,
    facing: "left",
    palette: WOMAN_PALETTE,
    wait: 140,
    line: "Don't drink from the well. At dawn it went still, and I heard my own name spoken from under the water. If you came looking for an adventure, it has already started.",
  },
  {
    name: "Elder Otis",
    x: 8,
    y: 18,
    facing: "right",
    palette: OLD_MAN_PALETTE,
    wait: 200,
    line: "The stones under the square have started to hum. I have not heard that since the old gate was sealed. The town is remembering something it was meant to forget.",
  },
];

export function npcInFront() {
  if (areaIndex !== 0) return undefined;
  const offset = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.facing];
  const x = player.x + offset[0];
  const y = player.y + offset[1];
  return NPCS.find((npc) => npc.x === x && npc.y === y);
}

export function updateNpcs() {
  if (areaIndex !== 0) return;
  for (const npc of NPCS) {
    npc.wait -= 1;
    if (npc.wait > 0) continue;

    npc.wait = 120 + Math.floor(Math.random() * 180);
    const options = STEP_DIRS.filter(([dx, dy]) => !blockedCell(npc.x + dx, npc.y + dy, player, NPCS, npc));
    if (options.length === 0) continue;

    const [dx, dy, facing] = options[Math.floor(Math.random() * options.length)];
    npc.x += dx;
    npc.y += dy;
    npc.facing = facing;
  }
}
