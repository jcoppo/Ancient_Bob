import { player } from "./player.js?v=132";
import { giveBread, heldItem, loafCanvas, takeHeldWheat } from "./items.js?v=132";

const BAKER_INTRO = "Hi, I am the baker. Here is a loaf! If you want more, bring me some wheat.";
const BAKER_AGAIN = "Bring me wheat, and I will bake you another loaf.";
const BAKER_TRADE = "Trade that wheat for a bread loaf?";
const BREAD_NOTICE = "You received a bread loaf";
const TRADE_CHOICES = ["Yes", "No"];
const FARMER_INTRO = "Careful where you step. I just finished telling that clod of dirt it was doing a fine job, and it gets shy around strangers. I am the farmer. Hold the hoe, stand on grass, and press Z. The grass turns to soil. Hold the bag of wheat seeds, stand on that soil, and press Z. Down go the seeds, and the wheat starts to grow. Wait until the wheat is fully grown. Then harvest it. Pull it early and all you get is a green mistake.";
const FARMER_AGAIN = "Hoe the grass, sow the soil, and harvest the wheat only when it is fully grown.";

const TYPE_MS = 15;

const dialogue = document.getElementById("dialogue");
const dialogueWho = document.getElementById("dialogue-who");
const dialogueLine = document.getElementById("dialogue-line");

let dialogueOpen = false;
let dialogueFull = "";
let dialogueIndex = 0;
let dialoguePageStart = 0;
let pageShownEnd = 0;
let pageLimit = 0;
let dialogueTimer = 0;
let typeLast = 0;
let noticeText = "";
let noticeNpc = null;
let tradeNpc = null;
let choiceIndex = -1;

export function dialogueIsOpen() {
  return dialogueOpen;
}

export function handleSpace(npc) {
  if (dialogueOpen) {
    if (dialogueTimer) finishDialogue();
    else if (dialogueIndex < dialogueFull.length) continueDialogue();
    else if (choiceIndex >= 0) confirmChoice();
    else if (noticeText) showNotice();
    else closeDialogue();
    return;
  }
  if (npc) openDialogue(npc);
}

export function moveDialogue(dy) {
  if (choiceIndex < 0) return;
  choiceIndex = (choiceIndex + dy + TRADE_CHOICES.length) % TRADE_CHOICES.length;
  renderChoices();
}

export function declineDialogue() {
  if (choiceIndex < 0) return;
  choiceIndex = -1;
  tradeNpc = null;
  closeDialogue();
}

function stopDialogueTimer() {
  cancelAnimationFrame(dialogueTimer);
  dialogueTimer = 0;
  typeLast = 0;
}

function pageOverflows() {
  return dialogueLine.scrollHeight > dialogueLine.clientHeight + 1;
}

function showPage(end, withCaret) {
  dialogueLine.textContent = dialogueFull.slice(dialoguePageStart, end);
  if (!withCaret) return;
  const caret = document.createElement("span");
  caret.className = "dialogue-caret";
  caret.textContent = " ▼";
  dialogueLine.appendChild(caret);
}

function endOfSentence(from) {
  let i = from;
  while (i < dialogueFull.length && dialogueFull[i] === " ") i += 1;
  for (; i < dialogueFull.length; i += 1) {
    if (!".!?".includes(dialogueFull[i])) continue;
    i += 1;
    while (i < dialogueFull.length && "\"')]".includes(dialogueFull[i])) i += 1;
    return i;
  }
  return dialogueFull.length;
}

function previousSentenceEnd(index) {
  let i = index - 1;
  while (i > dialoguePageStart && "\"')] ".includes(dialogueFull[i])) i -= 1;
  if (i > dialoguePageStart && ".!?".includes(dialogueFull[i])) i -= 1;
  while (i > dialoguePageStart) {
    if (".!?".includes(dialogueFull[i])) {
      let end = i + 1;
      while (end < index && "\"')]".includes(dialogueFull[end])) end += 1;
      return end;
    }
    i -= 1;
  }
  return dialoguePageStart;
}

function skipSpaces(index, limit) {
  let i = index;
  const stop = limit === undefined ? dialogueFull.length : limit;
  while (i < stop && dialogueFull[i] === " ") i += 1;
  return i;
}

function breakBeforeWord(overflowEnd) {
  let end = overflowEnd;
  while (end > dialoguePageStart && dialogueFull[end - 1] === " ") end -= 1;
  if (end <= dialoguePageStart) return dialoguePageStart;
  let wordStart = end - 1;
  while (wordStart > dialoguePageStart && dialogueFull[wordStart - 1] !== " ") wordStart -= 1;
  if (wordStart <= dialoguePageStart) return Math.max(dialoguePageStart, overflowEnd - 1);
  return wordStart;
}

function largestFit() {
  let low = dialoguePageStart;
  let high = dialogueFull.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    showPage(mid, false);
    if (pageOverflows()) high = mid - 1;
    else low = mid;
  }
  return low;
}

function trimToWord(fitEnd) {
  if (fitEnd >= dialogueFull.length || fitEnd <= dialoguePageStart) return fitEnd;
  const prev = dialogueFull[fitEnd - 1];
  const next = dialogueFull[fitEnd];
  if (prev !== " " && next !== " ") return breakBeforeWord(fitEnd + 1);
  return fitEnd;
}

function preparePage() {
  const capacity = largestFit();
  let stopAt = null;
  let cursor = dialoguePageStart;
  while (cursor < dialogueFull.length) {
    const sentenceEnd = endOfSentence(cursor);
    if (sentenceEnd > capacity) break;
    const resume = skipSpaces(sentenceEnd);
    if (resume >= dialogueFull.length) break;
    if (endOfSentence(resume) > capacity) {
      stopAt = sentenceEnd;
      break;
    }
    cursor = resume;
  }

  if (stopAt !== null) {
    showPage(stopAt, true);
    if (!pageOverflows()) {
      pageShownEnd = stopAt;
      pageLimit = skipSpaces(stopAt);
    } else {
      const earlier = previousSentenceEnd(stopAt);
      pageShownEnd = earlier > dialoguePageStart ? earlier : stopAt;
      pageLimit = skipSpaces(pageShownEnd);
    }
  } else {
    const cut = trimToWord(capacity);
    let shown = cut;
    while (shown > dialoguePageStart && dialogueFull[shown - 1] === " ") shown -= 1;
    pageShownEnd = shown;
    pageLimit = shown >= dialogueFull.length ? dialogueFull.length : skipSpaces(shown);
  }

  dialogueIndex = dialoguePageStart;
  dialogueLine.textContent = "";
}

function showPageEnd() {
  const more = pageLimit < dialogueFull.length;
  showPage(pageShownEnd, more);
  dialogueIndex = more ? pageLimit : dialogueFull.length;
  if (!more && tradeNpc) showChoices();
}

function renderChoices() {
  dialogueLine.replaceChildren();
  const ask = document.createElement("span");
  ask.style.display = "block";
  ask.textContent = dialogueFull;
  dialogueLine.append(ask);
  TRADE_CHOICES.forEach((label, option) => {
    const row = document.createElement("span");
    row.className = "dialogue-choice";
    const mark = document.createElement("span");
    mark.className = "dialogue-caret";
    mark.textContent = option === choiceIndex ? ">" : "";
    row.append(mark, document.createTextNode(label));
    dialogueLine.append(row);
  });
}

function showChoices() {
  if (!tradeNpc || choiceIndex >= 0) return;
  choiceIndex = 0;
  dialogueLine.style.height = "auto";
  renderChoices();
}

function confirmChoice() {
  const yes = choiceIndex === 0;
  const npc = tradeNpc;
  choiceIndex = -1;
  tradeNpc = null;
  dialogueLine.style.height = "";
  if (yes && takeHeldWheat()) {
    noticeText = BREAD_NOTICE;
    noticeNpc = npc;
    showNotice();
    return;
  }
  closeDialogue();
}

function typeDialogue(now) {
  if (!typeLast) typeLast = now;
  let count = Math.floor((now - typeLast) / TYPE_MS);
  if (count < 1) {
    dialogueTimer = requestAnimationFrame(typeDialogue);
    return;
  }
  if (count > 24) count = 24;
  typeLast += count * TYPE_MS;

  dialogueIndex = Math.min(pageShownEnd, dialogueIndex + count);
  if (dialogueIndex >= pageShownEnd) {
    showPageEnd();
    stopDialogueTimer();
    return;
  }
  showPage(dialogueIndex, false);
  dialogueTimer = requestAnimationFrame(typeDialogue);
}

function finishDialogue() {
  stopDialogueTimer();
  showPageEnd();
}

function startTyping() {
  stopDialogueTimer();
  typeLast = performance.now();
  dialogueTimer = requestAnimationFrame(typeDialogue);
}

function continueDialogue() {
  dialogueIndex = skipSpaces(dialogueIndex);
  dialoguePageStart = dialogueIndex;
  preparePage();
  startTyping();
}

function openDialogue(npc) {
  if (npc.name !== "Baker" && npc.name !== "Farmer" && !npc.line) return;
  const facePlayer = { up: "down", down: "up", left: "right", right: "left" };
  npc.facing = facePlayer[player.facing];
  stopDialogueTimer();
  dialogueWho.hidden = false;
  dialogueWho.textContent = npc.name;
  noticeText = "";
  noticeNpc = null;
  tradeNpc = null;
  choiceIndex = -1;
  dialogueLine.style.height = "";
  if (npc.name === "Baker" && heldItem()?.kind === "wheat") {
    dialogueFull = BAKER_TRADE;
    tradeNpc = npc;
  } else if (npc.name === "Baker" && !npc.met) {
    dialogueFull = BAKER_INTRO;
    noticeText = BREAD_NOTICE;
    noticeNpc = npc;
  } else if (npc.name === "Baker") {
    dialogueFull = BAKER_AGAIN;
  } else if (npc.name === "Farmer" && !npc.met) {
    dialogueFull = FARMER_INTRO;
    npc.met = true;
  } else if (npc.name === "Farmer") {
    dialogueFull = FARMER_AGAIN;
  } else {
    dialogueFull = npc.line;
  }
  dialoguePageStart = 0;
  dialogueIndex = 0;
  dialogueLine.textContent = "";
  dialogue.hidden = false;
  dialogueOpen = true;
  preparePage();
  startTyping();
}

function showNotice() {
  const npc = noticeNpc;
  noticeNpc = null;
  dialogueFull = noticeText;
  noticeText = "";
  if (npc) {
    npc.met = true;
    giveBread();
  }
  stopDialogueTimer();
  dialogueWho.hidden = true;
  dialogueWho.textContent = "";
  dialoguePageStart = 0;
  dialogueIndex = dialogueFull.length;
  pageShownEnd = dialogueFull.length;
  pageLimit = dialogueFull.length;
  showPage(dialogueFull.length, false);
  dialogueLine.append(loafCanvas());
}

function closeDialogue() {
  stopDialogueTimer();
  noticeText = "";
  noticeNpc = null;
  tradeNpc = null;
  choiceIndex = -1;
  dialogueLine.style.height = "";
  dialogueWho.hidden = false;
  dialogue.hidden = true;
  dialogueOpen = false;
}
