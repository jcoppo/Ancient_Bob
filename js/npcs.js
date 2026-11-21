import { COLS, ROWS } from "./config.js";
import { MAN_PALETTE, WOMAN_PALETTE, OLD_MAN_PALETTE } from "./pixels.js";
import { player } from "./player.js";
import { blockedCell } from "./collision.js";
import { MAP, areaIndex, buildingAt, bushAt, tillGrass, treeAt } from "./world.js";
import { items, soilOpen, sowSoil } from "./items.js";

const STEP_DIRS = [
  [0, -1, "up"],
  [0, 1, "down"],
  [-1, 0, "left"],
  [1, 0, "right"],
];

export const NPCS = [
  {
    name: "Bram",
    x: 14,
    y: 16,
    facing: "down",
    palette: MAN_PALETTE,
    wait: 80,
    line: "The north road folded shut at dusk. People who take it come back turned around, swearing they walked through a door that was never there. Something in this town is moving the paths. I followed my own footprints home, and they ended at a wall of trees that was not there in the morning. If you go looking, take a light, and do not trust the way back.",
  },
  {
    name: "Lila",
    x: 12,
    y: 16,
    facing: "left",
    palette: WOMAN_PALETTE,
    wait: 140,
    line: "Don't drink from the well. At dawn it went still, and I heard my own name spoken from under the water. If you came looking for an adventure, it has already started.",
  },
  {
    name: "Elder Otis",
    x: 4,
    y: 16,
    facing: "right",
    palette: OLD_MAN_PALETTE,
    wait: 200,
    line: "The stones under the square have started to hum. I have not heard that since the old gate was sealed. The town is remembering something it was meant to forget.",
  },
  {
    name: "Baker",
    x: 16,
    y: 8,
    homeX: 16,
    homeY: 8,
    facing: "down",
    wait: 160,
    met: false,
  },
  {
    name: "Farmer",
    area: 1,
    x: 10,
    y: 12,
    facing: "left",
    palette: MAN_PALETTE,
    holding: "hoe",
    tool: "hoe",
    wait: 40,
    phase: "till",
    swing: 0,
    sow: 0,
    bagT: 0,
    hoe: 0,
    hoeBack: false,
    route: 0,
    met: false,
  },
];

const NPC_START = NPCS.map((npc) => ({
  name: npc.name,
  x: npc.x,
  y: npc.y,
  facing: npc.facing,
  wait: npc.wait,
}));

export function resetNpcs() {
  for (const start of NPC_START) {
    const npc = NPCS.find((entry) => entry.name === start.name);
    npc.x = start.x;
    npc.y = start.y;
    npc.facing = start.facing;
    npc.wait = start.wait;
    npc.dead = false;
    npc.met = false;
    npc.hoe = 0;
    npc.hoeBack = false;
    if (npc.name === "Farmer") {
      npc.route = 0;
      npc.phase = "till";
      npc.hoeing = false;
      npc.sowing = false;
      npc.swing = 0;
      npc.sow = 0;
      npc.bagT = 0;
      npc.holding = "hoe";
      npc.tool = "hoe";
      npc.jobs = null;
      npc.plot = [];
      releaseGroundHoe();
    }
  }
}

export function npcInFront() {
  const offset = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.facing];
  const x = player.x + offset[0];
  const y = player.y + offset[1];
  return NPCS.find((npc) => !npc.dead && (npc.area ?? 0) === areaIndex && npc.x === x && npc.y === y);
}

const FARM_SWING = 20;
const FARM_SOW = 14;
const FARM_STEP = 24;
const FARM_GAP = 10;
const FARM_REST = 120;
const FARM_ROWS = 3;
const FARM_BAND = [3, 9];

function holdWait(npc) {
  if (!npc.holding) return FARM_STEP;
  npc.carryClock = ((npc.carryClock ?? 0) + 1) % 3;
  return FARM_STEP + (npc.carryClock === 0 ? 6 : 9);
}

function farmStep(npc, tx, ty) {
  const start = npc.y * COLS + npc.x;
  const goal = ty * COLS + tx;
  const dist = new Map([[start, 0]]);
  const prev = new Map([[start, null]]);
  const queue = [start];
  while (queue.length) {
    queue.sort((a, b) => dist.get(a) - dist.get(b));
    const cur = queue.shift();
    if (cur === goal) break;
    const x = cur % COLS;
    const y = Math.floor(cur / COLS);
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (blockedCell(nx, ny, player, NPCS, npc)) continue;
      const key = ny * COLS + nx;
      const cost = dist.get(cur) + (MAP[ny][nx] === "s" ? 8 : 1);
      if (dist.has(key) && dist.get(key) <= cost) continue;
      dist.set(key, cost);
      prev.set(key, cur);
      queue.push(key);
    }
  }
  if (!prev.has(goal)) return null;
  let cur = goal;
  let parent = prev.get(cur);
  while (parent !== start && parent != null) {
    cur = parent;
    parent = prev.get(cur);
  }
  return [cur % COLS - npc.x, Math.floor(cur / COLS) - npc.y];
}

function faceStep(dx, dy) {
  if (dx < 0) return "left";
  if (dx > 0) return "right";
  if (dy < 0) return "up";
  return "down";
}

function carriedItem(npc) {
  return items.find((item) => item.carrier === npc.name) || null;
}

function releaseGroundHoe() {
  const hoe = items.find((item) => item.kind === "hoe");
  if (hoe?.carrier === "Farmer") hoe.carrier = null;
}

function showHoe(npc) {
  npc.holding = "hoe";
  npc.tool = "hoe";
}

function syncCarry(npc) {
  const item = carriedItem(npc);
  if (item?.kind === "bag") {
    npc.holding = "bag";
    npc.tool = null;
    return;
  }
  if (npc.phase === "till" || npc.phase === "rest-till") showHoe(npc);
}

function takeTool(npc, kind) {
  const item = items.find((entry) => entry.kind === kind && !entry.held && !entry.carrier);
  if (!item) return false;
  item.carrier = npc.name;
  syncCarry(npc);
  return true;
}

function cellHasItem(area, x, y) {
  return items.some((item) => !item.held && !item.carrier && item.area === area && item.x === x && item.y === y);
}

function dropTool(npc) {
  const item = carriedItem(npc);
  if (!item) {
    syncCarry(npc);
    return true;
  }
  const area = npc.area ?? 0;
  if (cellHasItem(area, npc.x, npc.y)) return false;
  item.carrier = null;
  item.area = area;
  item.x = npc.x;
  item.y = npc.y;
  syncCarry(npc);
  return true;
}

function canTill(x, y) {
  const mark = MAP[y]?.[x];
  if (mark !== "g" && (typeof mark !== "string" || !"123456".includes(mark))) return false;
  return !bushAt(x, y) && !treeAt(x, y) && !buildingAt(x, y);
}

function grassRows(x0, x1) {
  const rows = [];
  for (let y = 1; y < ROWS - 1; y++) {
    const cells = [];
    for (let x = x0; x <= x1; x++) {
      if (canTill(x, y)) cells.push({ x, y });
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function planJobs() {
  const band = grassRows(FARM_BAND[0], FARM_BAND[1]);
  const rows = band.length ? band : grassRows(1, COLS - 2);
  const below = rows.filter((cells) => cells[0].y > 12);
  const pool = below.length ? below : rows.filter((cells) => cells[0].y < 10);
  pool.sort((a, b) => Math.abs(a[0].y - 12) - Math.abs(b[0].y - 12) || a[0].y - b[0].y);
  const chosen = pool.slice(0, FARM_ROWS).sort((a, b) => a[0].y - b[0].y);
  const jobs = [];
  chosen.forEach((cells, index) => {
    jobs.push(...(index % 2 ? cells.slice().reverse() : cells));
  });
  return jobs;
}

function beginTill(npc) {
  npc.phase = "till";
  npc.plot = [];
  npc.jobs = planJobs();
  npc.route = 0;
  showHoe(npc);
}

function walkTo(npc, x, y) {
  if (npc.x === x && npc.y === y) return true;
  const step = farmStep(npc, x, y);
  if (!step) {
    npc.wait = 12;
    return false;
  }
  npc.x += step[0];
  npc.y += step[1];
  npc.facing = faceStep(step[0], step[1]);
  npc.wait = holdWait(npc);
  return false;
}

function putDown(npc, nextPhase) {
  if (!carriedItem(npc)) {
    npc.phase = nextPhase;
    return;
  }
  if (dropTool(npc)) {
    npc.phase = nextPhase;
    npc.wait = 8;
    return;
  }
  const area = npc.area ?? 0;
  const spot = STEP_DIRS.find(([dx, dy]) => {
    const x = npc.x + dx;
    const y = npc.y + dy;
    return !blockedCell(x, y, player, NPCS, npc) && !cellHasItem(area, x, y);
  });
  if (!spot) {
    npc.wait = 12;
    return;
  }
  npc.x += spot[0];
  npc.y += spot[1];
  npc.facing = spot[2];
  npc.wait = holdWait(npc);
}

function fetchTool(npc, kind, nextPhase) {
  if (carriedItem(npc)?.kind === kind) {
    npc.phase = nextPhase;
    npc.route = 0;
    return;
  }
  if (carriedItem(npc)) {
    putDown(npc, npc.phase);
    return;
  }
  const item = items.find((entry) => entry.kind === kind && !entry.held && !entry.carrier);
  if (!item || item.area !== (npc.area ?? 0)) {
    npc.wait = 20;
    return;
  }
  if (!walkTo(npc, item.x, item.y)) return;
  takeTool(npc, kind);
  npc.jobs = (npc.plot || []).filter((cell) => soilOpen(cell.x, cell.y));
  npc.phase = nextPhase;
  npc.route = 0;
}

function workRoute(npc, mode) {
  const jobs = npc.jobs || [];
  if (npc.route >= jobs.length) {
    npc.phase = mode === "till" ? "rest-till" : "rest-sow";
    npc.wait = FARM_REST;
    npc.facing = "down";
    npc.jobs = null;
    return;
  }
  const next = jobs[npc.route];
  if (npc.x !== next.x || npc.y !== next.y) {
    walkTo(npc, next.x, next.y);
    return;
  }
  if (mode === "till" && canTill(next.x, next.y)) {
    npc.hoeing = true;
    npc.swing = 0;
    tickHoe(npc);
    return;
  }
  if (mode === "sow" && soilOpen(next.x, next.y)) {
    npc.sowing = true;
    npc.sow = 0;
    tickSow(npc);
    return;
  }
  npc.route += 1;
  npc.wait = 4;
}

function tickHoe(npc) {
  npc.facing = "down";
  const frame = npc.swing;
  npc.hoe = Math.sin(((frame + 0.5) / FARM_SWING) * Math.PI);
  npc.hoeBack = frame >= Math.ceil(FARM_SWING / 2);
  npc.swing += 1;
  if (npc.swing < FARM_SWING) return;
  if (!tillGrass(npc.x, npc.y, 1)) npc.route += 1;
  else if (MAP[npc.y][npc.x] === "s") {
    npc.plot = npc.plot || [];
    npc.plot.push({ x: npc.x, y: npc.y });
  }
  npc.hoeing = false;
  npc.hoe = 0;
  npc.hoeBack = false;
  npc.wait = FARM_GAP;
}

function tickSow(npc) {
  npc.facing = "down";
  const frame = npc.sow;
  npc.bagT = Math.sin(((frame + 0.5) / FARM_SOW) * Math.PI);
  npc.sow += 1;
  if (npc.sow < FARM_SOW) return;
  sowSoil(npc.x, npc.y);
  npc.sowing = false;
  npc.bagT = 0;
  npc.wait = 8;
}

function updateFarmer(npc) {
  if (npc.phase === "get-hoe") npc.phase = "till";
  syncCarry(npc);
  if (npc.hoeing) {
    tickHoe(npc);
    return;
  }
  if (npc.sowing) {
    tickSow(npc);
    return;
  }
  npc.hoe = 0;
  npc.hoeBack = false;
  npc.bagT = 0;
  if (npc.wait > 0) {
    npc.wait -= 1;
    return;
  }

  if (npc.phase === "till") {
    if (!npc.jobs) {
      beginTill(npc);
      if (!npc.jobs.length) {
        npc.jobs = null;
        npc.wait = FARM_REST;
        return;
      }
    }
    workRoute(npc, "till");
    return;
  }
  if (npc.phase === "rest-till") {
    npc.phase = "drop-hoe";
    return;
  }
  if (npc.phase === "drop-hoe") {
    npc.holding = null;
    npc.tool = null;
    npc.phase = "get-bag";
    return;
  }
  if (npc.phase === "get-bag") {
    if (!npc.plot?.length) {
      beginTill(npc);
      return;
    }
    fetchTool(npc, "bag", "sow");
    return;
  }
  if (npc.phase === "sow") {
    if (carriedItem(npc)?.kind !== "bag") {
      npc.phase = "get-bag";
      return;
    }
    if (!npc.jobs?.length) {
      npc.phase = "rest-sow";
      npc.wait = FARM_REST;
      return;
    }
    workRoute(npc, "sow");
    return;
  }
  if (npc.phase === "rest-sow") {
    npc.phase = "drop-bag";
    return;
  }
  if (npc.phase === "drop-bag") {
    if (carriedItem(npc)) {
      putDown(npc, "till");
      npc.jobs = null;
      return;
    }
    beginTill(npc);
    return;
  }
  beginTill(npc);
}

releaseGroundHoe();

export function syncNpcTools() {
  releaseGroundHoe();
  for (const npc of NPCS) {
    if (npc.name === "Farmer") syncCarry(npc);
  }
}

function updateBaker(npc) {
  npc.wait -= 1;
  if (npc.wait > 0) return;
  const dirs = [-1, 1].filter((dx) => {
    const nx = npc.x + dx;
    return Math.abs(nx - npc.homeX) <= 1 && npc.y === npc.homeY && !blockedCell(nx, npc.y, player, NPCS, npc);
  });
  npc.wait = 180 + Math.floor(Math.random() * 220);
  if (dirs.length === 0) return;
  const dx = dirs[Math.floor(Math.random() * dirs.length)];
  npc.x += dx;
  npc.facing = npc.x === npc.homeX ? "down" : (dx < 0 ? "left" : "right");
}

export function updateNpcs() {
  for (const npc of NPCS) {
    if (npc.dead || (npc.area ?? 0) !== areaIndex) continue;
    if (npc.name === "Farmer") {
      updateFarmer(npc);
      continue;
    }
    if (npc.homeX !== undefined) {
      updateBaker(npc);
      continue;
    }
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
