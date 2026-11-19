import { COLS, ROWS } from "./config.js?v=157";
import { healPlayer, player, resetPlayer } from "./player.js?v=157";
import { applyCrops, coinCanvas, cropSnapshot, heldItem, items, loafCanvas, resetItems, stores, takeBread } from "./items.js?v=157";
import { NPCS, resetNpcs } from "./npcs.js?v=157";
import { applySavedTerrain, areaIndex, areaList, enterArea, resetTerrain } from "./world.js?v=157";

const SAVE_KEY = "ancient-bob";
const OPTIONS = ["Items", "Map", "Save Game", "New Game", "Exit"];
const CONFIRM = ["Yes", "No"];
const ITEM_NAMES = { sword: "Sword", hoe: "Garden Hoe", bag: "Seed Bag", wheat: "Wheat bundle", bread: "Bread loaf" };
const FACINGS = ["up", "down", "left", "right"];
const CELL_PX = 6;
const MAP_GAP = 12;

const COLORS = {
  g: "#5f7c3a",
  p: "#5a5854",
  s: "#6b4630",
  w: "#2f7ea0",
  r: "#8e8c88",
  bush: "#2a4a22",
  building: "#8a3c2c",
  tree: "#4a3022",
  player: "#f6edd4",
};

const menu = document.getElementById("menu");
const menuTitle = document.getElementById("menu-title");
const menuBody = document.getElementById("menu-body");

let open = false;
let screen = "main";
let index = 0;
let itemIndex = 0;
let confirmIndex = 0;
let eatFull = false;
let note = "";
let painted = "";
let saved = false;

export function menuIsOpen() {
  return open;
}

export function openMenu() {
  if (open) return;
  open = true;
  screen = "main";
  index = 0;
  painted = "";
  saved = false;
  menu.hidden = false;
  paintMenu();
}

export function closeMenu() {
  open = false;
  painted = "";
  menu.hidden = true;
}

export function moveMenu(dy) {
  if (!open) return;
  if (screen === "note") return;
  if (screen === "eat" && eatFull) return;
  if (screen === "confirm" || screen === "eat") {
    confirmIndex = (confirmIndex + dy + CONFIRM.length) % CONFIRM.length;
    paintMenu();
    return;
  }
  if (screen === "items") {
    const count = itemEntries().length;
    if (count === 0) return;
    itemIndex = (itemIndex + dy + count) % count;
    paintMenu();
    return;
  }
  if (screen !== "main") return;
  saved = false;
  index = (index + dy + OPTIONS.length) % OPTIONS.length;
  paintMenu();
}

export function selectMenu() {
  if (!open) return;
  if (screen === "confirm") {
    if (confirmIndex === 0) beginNewGame();
    else {
      screen = "main";
      painted = "";
      paintMenu();
    }
    return;
  }
  if (screen === "note") {
    note = "";
    screen = "items";
    painted = "";
    paintMenu();
    return;
  }
  if (screen === "eat") {
    if (eatFull) {
      eatFull = false;
      screen = "items";
      painted = "";
      paintMenu();
      return;
    }
    if (confirmIndex === 0) eatBread();
    else {
      screen = "items";
      painted = "";
      paintMenu();
    }
    return;
  }
  if (screen === "items") {
    const kind = itemEntries()[itemIndex]?.kind;
    if (kind === "bread") {
      screen = "eat";
      confirmIndex = 0;
      painted = "";
      paintMenu();
    } else if (kind === "gold") {
      screen = "note";
      note = "Can't use this here";
      painted = "";
      paintMenu();
    }
    return;
  }
  if (screen !== "main") return;
  if (index === 0) {
    screen = "items";
    itemIndex = 0;
  }
  else if (index === 1) screen = "map";
  else if (index === 2) {
    saveGame();
    saved = true;
    painted = "";
    paintMenu();
    return;
  } else if (index === 3) {
    screen = "confirm";
    confirmIndex = 0;
    painted = "";
    paintMenu();
    return;
  } else {
    closeMenu();
    return;
  }
  painted = "";
  paintMenu();
}

function beginNewGame() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // The running game still returns to the start.
  }
  resetTerrain();
  resetPlayer();
  resetItems();
  resetNpcs();
  closeMenu();
}

export function backMenu() {
  if (!open) return;
  if (screen === "note" || screen === "eat") {
    note = "";
    eatFull = false;
    screen = "items";
    painted = "";
    paintMenu();
    return;
  }
  if (screen === "main") {
    closeMenu();
    return;
  }
  screen = "main";
  painted = "";
  saved = false;
  paintMenu();
}

function eatBread() {
  if (player.hp >= player.maxHp) {
    eatFull = true;
    painted = "";
    paintMenu();
    return;
  }
  if (takeBread()) healPlayer(5);
  const count = itemEntries().length;
  if (itemIndex >= count) itemIndex = Math.max(0, count - 1);
  screen = "items";
  painted = "";
  paintMenu();
}

function itemEntries() {
  const entries = [];
  const held = heldItem();
  if (held) entries.push({ kind: held.kind, label: ITEM_NAMES[held.kind] || held.kind });
  if (stores.bread > 0) {
    entries.push({ kind: "bread", label: `Bread loaf x ${stores.bread}` });
  }
  if (stores.gold > 0) {
    entries.push({ kind: "gold", label: `Gold x ${stores.gold}` });
  }
  return entries;
}

export function paintMenu() {
  if (!open) return;
  if (screen === "map") {
    if (painted !== "map") buildMap();
    drawMap();
    return;
  }

  if (screen === "note") {
    if (painted === "note") return;
    painted = "note";
    menuTitle.textContent = "Gold";
    menuBody.replaceChildren();
    const line = document.createElement("p");
    line.className = "menu-row";
    line.textContent = note;
    menuBody.appendChild(line);
    return;
  }

  if (screen === "eat") {
    const signature = `eat:${confirmIndex}:${eatFull ? 1 : 0}`;
    if (signature === painted) return;
    painted = signature;
    menuTitle.textContent = "Bread loaf";
    menuBody.replaceChildren();
    const ask = document.createElement("p");
    ask.className = "menu-row";
    ask.textContent = eatFull ? "Your health is full." : "Eat to raise health 5 hp?";
    menuBody.appendChild(ask);
    if (eatFull) return;
    CONFIRM.forEach((label, option) => {
      const row = document.createElement("p");
      row.className = option === confirmIndex ? "menu-row selected" : "menu-row";
      const mark = document.createElement("span");
      mark.className = "menu-mark";
      mark.textContent = option === confirmIndex ? ">" : "";
      row.append(mark, document.createTextNode(label));
      menuBody.appendChild(row);
    });
    return;
  }

  if (screen === "confirm") {
    const signature = `confirm:${confirmIndex}`;
    if (signature === painted) return;
    painted = signature;
    menuTitle.textContent = "New Game";
    menuBody.replaceChildren();
    const ask = document.createElement("p");
    ask.className = "menu-row";
    ask.textContent = "Erase your save and start over?";
    menuBody.appendChild(ask);
    CONFIRM.forEach((label, option) => {
      const row = document.createElement("p");
      row.className = option === confirmIndex ? "menu-row selected" : "menu-row";
      const mark = document.createElement("span");
      mark.className = "menu-mark";
      mark.textContent = option === confirmIndex ? ">" : "";
      row.append(mark, document.createTextNode(label));
      menuBody.appendChild(row);
    });
    return;
  }

  const signature = screen === "main"
    ? `main:${index}:${saved ? 1 : 0}`
    : `items:${heldItem()?.kind || ""}:${stores.bread}:${stores.gold}:${itemIndex}`;
  if (signature === painted) return;
  painted = signature;

  if (screen === "main") {
    menuTitle.textContent = "Menu";
    menuBody.replaceChildren();
    OPTIONS.forEach((label, option) => {
      const row = document.createElement("p");
      row.className = option === index ? "menu-row selected" : "menu-row";
      const mark = document.createElement("span");
      mark.className = "menu-mark";
      mark.textContent = option === index ? ">" : "";
      const text = option === 2 && saved ? "Saved" : label;
      row.append(mark, document.createTextNode(text));
      menuBody.appendChild(row);
    });
    return;
  }

  menuTitle.textContent = "Items";
  menuBody.replaceChildren();
  const entries = itemEntries();
  if (entries.length === 0) {
    const row = document.createElement("p");
    row.className = "menu-row";
    row.textContent = "No Items";
    menuBody.appendChild(row);
    return;
  }
  if (itemIndex >= entries.length) itemIndex = entries.length - 1;
  entries.forEach((entry, option) => {
    const row = document.createElement("p");
    row.className = option === itemIndex ? "menu-row selected" : "menu-row";
    const mark = document.createElement("span");
    mark.className = "menu-mark";
    mark.textContent = option === itemIndex ? ">" : "";
    const icon = document.createElement("span");
    icon.className = "menu-icon";
    if (entry.kind === "bread") icon.append(loafCanvas());
    if (entry.kind === "gold") icon.append(coinCanvas());
    row.append(mark, icon, document.createTextNode(entry.label));
    menuBody.appendChild(row);
  });
}

const MAP_LABEL = 16;

function mapSpan(areas) {
  const cols = Math.max(...areas.map((area) => area.col)) + 1;
  const rows = Math.max(...areas.map((area) => area.row)) + 1;
  const blockW = COLS * CELL_PX;
  const blockH = MAP_LABEL + ROWS * CELL_PX;
  return {
    cols,
    rows,
    blockW,
    blockH,
    width: cols * blockW + (cols - 1) * MAP_GAP,
    height: rows * blockH + (rows - 1) * MAP_GAP,
  };
}

function buildMap() {
  painted = "map";
  menuTitle.textContent = "Map";
  menuBody.replaceChildren();
  const canvas = document.createElement("canvas");
  const span = mapSpan(areaList());
  canvas.width = span.width;
  canvas.height = span.height;
  menuBody.append(canvas);
}

function drawMap() {
  const canvas = menuBody.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const span = mapSpan(areaList());
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "12px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  areaList().forEach((area, areaNumber) => {
    const ox = area.col * (span.blockW + MAP_GAP);
    const oy = area.row * (span.blockH + MAP_GAP);
    ctx.fillStyle = areaNumber === areaIndex ? "#e6c15a" : "#a89880";
    ctx.fillText(area.name.toUpperCase(), ox + span.blockW / 2, oy + MAP_LABEL / 2);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = cellColor(area, areaNumber, x, y);
        ctx.fillRect(ox + x * CELL_PX, oy + MAP_LABEL + y * CELL_PX, CELL_PX, CELL_PX);
      }
    }
  });
}

function cellColor(area, areaNumber, x, y) {
  if (areaNumber === areaIndex && player.x === x && player.y === y) return COLORS.player;
  if (area.trees.some((tree) => tree.x === x && tree.y === y)) return COLORS.tree;
  if (area.buildings.some((building) => (
    (x >= building.x && x < building.x + building.w && y >= building.y && y < building.y + building.h) ||
    (building.kind === "baker" && x === building.x && y === building.y - 1)
  ))) return COLORS.building;
  if ("b1234".includes(area.bushes[y][x])) return COLORS.bush;
  return COLORS[area.map[y][x]] || COLORS.g;
}

function cellNumber(value) {
  return Number.isInteger(value) && value >= 0 && value < COLS;
}

function saveGame() {
  const data = {
    area: areaIndex,
    player: { x: player.x, y: player.y, facing: player.facing, hp: player.hp },
    items: items.map((item) => ({
      kind: item.kind,
      area: item.area,
      x: item.x,
      y: item.y,
      held: item.held,
    })),
    areas: areaList().map((area) => ({ map: area.map.slice(), bushes: area.bushes.slice() })),
    npcs: NPCS.map((npc) => ({
      name: npc.name,
      x: npc.x,
      y: npc.y,
      facing: npc.facing,
      dead: !!npc.dead,
      wait: npc.wait,
      met: !!npc.met,
    })),
    stores: { bread: stores.bread, gold: stores.gold },
    crops: cropSnapshot(),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // The menu still closes when storage is unavailable.
  }
}

export function loadGame() {
  let data;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    data = JSON.parse(raw);
  } catch {
    return;
  }
  if (!data || !cellNumber(data.area) || data.area >= areaList().length) return;
  if (!cellNumber(data.player?.x) || !cellNumber(data.player?.y)) return;
  if (!FACINGS.includes(data.player.facing)) return;
  if (!applySavedTerrain(data.areas)) return;

  enterArea(data.area);
  player.x = data.player.x;
  player.y = data.player.y;
  player.facing = data.player.facing;
  player.hp = Math.max(0, Math.min(player.maxHp, data.player.hp | 0));
  player.dx = 0;
  player.dy = 0;
  player.step = 0;
  player.walking = false;
  player.walk = 0;
  player.walkClock = 0;
  player.wrap = false;

  if (Array.isArray(data.items)) {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].kind === "wheat") items.splice(i, 1);
    }
    for (const saved of data.items) {
      if (saved?.kind === "wheat") {
        if (!cellNumber(saved.x) || !cellNumber(saved.y)) continue;
        if (!cellNumber(saved.area) || saved.area >= areaList().length) continue;
        items.push({ kind: "wheat", area: saved.area, x: saved.x, y: saved.y, held: !!saved.held });
        continue;
      }
      const item = items.find((entry) => entry.kind === saved?.kind);
      if (!item || !cellNumber(saved.x) || !cellNumber(saved.y)) continue;
      if (!cellNumber(saved.area) || saved.area >= areaList().length) continue;
      if (item.kind === "hoe" && !saved.held && saved.area === 0 && saved.x === 7 && saved.y === 6) continue;
      item.area = saved.area;
      item.x = saved.x;
      item.y = saved.y;
      item.held = !!saved.held;
    }
    let holding = null;
    for (const item of items) {
      if (!item.held || holding) item.held = false;
      else holding = item.kind;
    }
    player.holding = holding;
  }

  if (Number.isInteger(data.stores?.bread) && data.stores.bread >= 0) stores.bread = data.stores.bread;
  if (Number.isInteger(data.stores?.gold) && data.stores.gold >= 0) stores.gold = data.stores.gold;
  applyCrops(data.crops);

  if (!Array.isArray(data.npcs)) return;
  for (const saved of data.npcs) {
    const npc = NPCS.find((entry) => entry.name === saved?.name);
    if (!npc || !cellNumber(saved.x) || !cellNumber(saved.y)) continue;
    if (!FACINGS.includes(saved.facing)) continue;
    const oldPlot = npc.name === "Farmer" && (saved.y === 9 || (saved.x === 6 && saved.y === 11));
    npc.x = oldPlot ? 10 : saved.x;
    npc.y = oldPlot ? 12 : saved.y;
    if (npc.name === "Farmer") {
      npc.route = -1;
      npc.till = 0;
      npc.hoe = 0;
      npc.hoeBack = false;
    }
    npc.facing = saved.facing;
    npc.dead = !!saved.dead;
    npc.met = !!saved.met;
    if (Number.isInteger(saved.wait) && saved.wait > 0) npc.wait = saved.wait;
  }
}
