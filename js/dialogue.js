import { player } from "./player.js?v=14";

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

export function dialogueIsOpen() {
  return dialogueOpen;
}

export function handleSpace(npc) {
  if (dialogueOpen) {
    if (dialogueTimer) finishDialogue();
    else if (dialogueIndex < dialogueFull.length) continueDialogue();
    else closeDialogue();
    return;
  }
  if (npc) openDialogue(npc);
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
  const facePlayer = { up: "down", down: "up", left: "right", right: "left" };
  npc.facing = facePlayer[player.facing];
  stopDialogueTimer();
  dialogueWho.textContent = npc.name;
  dialogueFull = npc.line;
  dialoguePageStart = 0;
  dialogueIndex = 0;
  dialogueLine.textContent = "";
  dialogue.hidden = false;
  dialogueOpen = true;
  preparePage();
  startTyping();
}

function closeDialogue() {
  stopDialogueTimer();
  dialogue.hidden = true;
  dialogueOpen = false;
}
