let audioCtx = null;
let masterGain = null;
let melodyFilter = null;
let noiseBuffer = null;
let parsedSong = null;
let musicStarted = false;
let musicMuted = false;
let nextLoopAt = 0;
let musicTimer = 0;

const songUrl = new URL("../assets/music/sombre-upbeat-percussion.mid", import.meta.url);
const songPromise = fetch(songUrl)
  .then((response) => {
    if (!response.ok) throw new Error("Could not load song.mid");
    return response.arrayBuffer();
  })
  .then(parseMidi);

songPromise.catch(() => {});

function readVlq(view, offset) {
  let value = 0;
  let pos = offset;
  let byte = 0;
  do {
    byte = view.getUint8(pos);
    pos += 1;
    value = (value << 7) | (byte & 0x7f);
  } while (byte & 0x80);
  return { value, offset: pos };
}

function parseMidi(buffer) {
  const view = new DataView(buffer);
  const header = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  if (header !== "MThd") throw new Error("Not a MIDI file");

  const ticksPerBeat = view.getUint16(12);
  let pos = 14;
  const open = new Map();
  const notes = [];
  let tempo = 500000;
  let tick = 0;
  let endTick = 0;

  const trackTag = String.fromCharCode(
    view.getUint8(pos),
    view.getUint8(pos + 1),
    view.getUint8(pos + 2),
    view.getUint8(pos + 3)
  );
  if (trackTag !== "MTrk") throw new Error("MIDI track missing");
  const trackEnd = pos + 8 + view.getUint32(pos + 4);
  pos += 8;

  while (pos < trackEnd) {
    const delta = readVlq(view, pos);
    pos = delta.offset;
    tick += delta.value;
    const status = view.getUint8(pos);
    pos += 1;

    if (status === 0xff) {
      const type = view.getUint8(pos);
      pos += 1;
      const length = readVlq(view, pos);
      pos = length.offset;
      if (type === 0x51 && length.value === 3) {
        tempo = (view.getUint8(pos) << 16) | (view.getUint8(pos + 1) << 8) | view.getUint8(pos + 2);
      }
      if (type === 0x2f) endTick = tick;
      pos += length.value;
      continue;
    }

    const command = status & 0xf0;
    const channel = status & 0x0f;
    const dataBytes = command === 0xc0 || command === 0xd0 ? 1 : 2;
    const data1 = view.getUint8(pos);
    const data2 = dataBytes === 2 ? view.getUint8(pos + 1) : 0;
    pos += dataBytes;

    if (command === 0x90 && data2 > 0) {
      open.set(`${channel}:${data1}`, { tick, velocity: data2, channel, midi: data1 });
    } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
      const key = `${channel}:${data1}`;
      const started = open.get(key);
      if (!started) continue;
      open.delete(key);
      notes.push({
        tick: started.tick,
        durationTicks: tick - started.tick,
        midi: started.midi,
        velocity: started.velocity,
        channel: started.channel,
      });
    }
  }

  const secondsPerTick = (tempo / 1000000) / ticksPerBeat;
  return {
    duration: endTick * secondsPerTick,
    notes: notes.map((note) => ({
      time: note.tick * secondsPerTick,
      duration: note.durationTicks * secondsPerTick,
      midi: note.midi,
      velocity: note.velocity,
      channel: note.channel,
    })),
  };
}

function midiToHz(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function getNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;
  const length = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

function percussionGain(when, peak, attack, decay) {
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), when + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  return gain;
}

function schedulePercussion(when, note) {
  const level = note.velocity / 127;

  if (note.midi === 36 || note.midi === 35) {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(170, when);
    osc.frequency.exponentialRampToValueAtTime(48, when + 0.08);
    const gain = percussionGain(when, level * 0.32, 0.004, 0.12);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(when);
    osc.stop(when + 0.22);
    return;
  }

  if (note.midi === 38 || note.midi === 40) {
    const noise = audioCtx.createBufferSource();
    noise.buffer = getNoiseBuffer();
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.6;
    const gain = percussionGain(when, level * 0.16, 0.003, 0.09);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(when);
    noise.stop(when + 0.16);

    const body = audioCtx.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(180, when);
    const bodyGain = percussionGain(when, level * 0.07, 0.003, 0.06);
    body.connect(bodyGain);
    bodyGain.connect(masterGain);
    body.start(when);
    body.stop(when + 0.12);
    return;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = getNoiseBuffer();
  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 6500;
  const gain = percussionGain(when, level * 0.045, 0.002, 0.03);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(when);
  noise.stop(when + 0.06);
}

function scheduleNote(when, note) {
  if (note.channel === 9) {
    schedulePercussion(when, note);
    return;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const isMelody = note.channel === 0;
  osc.type = isMelody ? "triangle" : "sine";
  osc.frequency.setValueAtTime(midiToHz(note.midi), when);

  const peak = (note.velocity / 127) * (isMelody ? 0.08 : 0.06);
  const attack = 0.09;
  const release = 0.42;
  const hold = Math.max(attack, note.duration - 0.05);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + attack);
  gain.gain.setValueAtTime(peak, when + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + hold + release);

  osc.connect(gain);
  if (isMelody) {
    const bloom = audioCtx.createOscillator();
    const bloomGain = audioCtx.createGain();
    bloom.type = "sine";
    bloom.frequency.setValueAtTime(midiToHz(note.midi), when);
    bloom.detune.setValueAtTime(7, when);
    bloomGain.gain.value = 0.35;
    bloom.connect(bloomGain);
    bloomGain.connect(gain);
    bloom.start(when);
    bloom.stop(when + hold + release + 0.05);
  }

  gain.connect(melodyFilter);
  osc.start(when);
  osc.stop(when + hold + release + 0.05);
}

function scheduleLoop(startTime) {
  for (const note of parsedSong.notes) {
    scheduleNote(startTime + note.time, note);
  }
}

function pumpMusic() {
  if (!audioCtx || audioCtx.state !== "running" || !parsedSong) return;
  const now = audioCtx.currentTime;
  if (nextLoopAt < now - 0.2) nextLoopAt = now + 0.05;
  const horizon = now + 1.5;
  while (nextLoopAt < horizon) {
    scheduleLoop(nextLoopAt);
    nextLoopAt += parsedSong.duration;
  }
}

function applyMusicMute() {
  if (!masterGain || !audioCtx) return;
  masterGain.gain.setTargetAtTime(musicMuted ? 0 : 1, audioCtx.currentTime, 0.08);
}

function startBackgroundMusic() {
  if (musicStarted) return;
  musicStarted = true;

  audioCtx = new AudioContext();
  const resumed = audioCtx.resume();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = musicMuted ? 0 : 1;

  masterGain.connect(audioCtx.destination);

  melodyFilter = audioCtx.createBiquadFilter();
  melodyFilter.type = "lowpass";
  melodyFilter.frequency.value = 1400;
  melodyFilter.Q.value = 0.4;
  melodyFilter.connect(masterGain);

  songPromise
    .then((song) => {
      parsedSong = song;
      return resumed;
    })
    .then(() => {
      nextLoopAt = audioCtx.currentTime + 0.08;
      pumpMusic();
      musicTimer = window.setInterval(pumpMusic, 400);
    })
    .catch(() => {
      musicStarted = false;
      syncSpeakerButton();
    });
}

function musicIsOn() {
  return musicStarted && !musicMuted;
}

function syncSpeakerButton() {
  const button = document.getElementById("music");
  if (!button) return;
  const on = musicIsOn();
  button.classList.toggle("is-on", on);
  button.setAttribute("aria-pressed", on ? "true" : "false");
  button.setAttribute("aria-label", on ? "Turn music off" : "Turn music on");
}

function toggleBackgroundMusic() {
  if (!musicStarted) {
    startBackgroundMusic();
  } else {
    musicMuted = !musicMuted;
    applyMusicMute();
  }
  syncSpeakerButton();
}

document.getElementById("music").addEventListener("click", toggleBackgroundMusic);
