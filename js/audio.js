'use strict';

// ============================================================
// SOUND ENGINE (Web Audio API only — procedural, no external files)
// ============================================================
const Sound = (() => {
  let ctx = null;
  let masterGain = null, sfxGain = null;
  let musicGainA = null, musicGainB = null;
  let activeGainNode = null;
  let muted = localStorage.getItem('googlimon_muted') === '1';
  let currentTrackName = null;
  let activePlayer = null;
  let trackGen = 0;

  function ensureCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);
    musicGainA = ctx.createGain(); musicGainA.gain.value = 0; musicGainA.connect(masterGain);
    musicGainB = ctx.createGain(); musicGainB.gain.value = 0; musicGainB.connect(masterGain);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(masterGain);
    activeGainNode = musicGainA;
  }

  function unlock() {
    ensureCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function toggleMute() {
    ensureCtx();
    muted = !muted;
    localStorage.setItem('googlimon_muted', muted ? '1' : '0');
    if (masterGain) masterGain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.04);
    return muted;
  }
  function isMuted() { return muted; }

  // ── Note name → frequency (equal temperament, A4 = 440Hz) ──
  function noteFreq(name) {
    if (!name) return null;
    const m = /^([A-G])(#?)(-?\d)$/.exec(name);
    if (!m) return null;
    const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const semitone = SEMI[m[1]] + (m[2] ? 1 : 0);
    const octave = parseInt(m[3], 10);
    const midi = (octave + 1) * 12 + semitone;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // ── Low-level synthesis helpers ─────────────────────────────
  function playTone(when, freq, dur, { type = 'square', gain = 0.12, attack = 0.005, release = 0.05, destination = null } = {}) {
    if (!ctx || !freq) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + attack);
    g.gain.linearRampToValueAtTime(0, when + dur + release);
    osc.connect(g);
    g.connect(destination || sfxGain);
    osc.start(when);
    osc.stop(when + dur + release + 0.02);
  }

  function playNoiseBurst(when, dur, { gain = 0.18, destination = null } = {}) {
    if (!ctx) return;
    const size = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.connect(g);
    g.connect(destination || sfxGain);
    src.start(when);
    src.stop(when + dur + 0.02);
  }

  // ── One-shot sound effects ──────────────────────────────────
  function sfxCursor()  { ensureCtx(); playTone(ctx.currentTime, 660, 0.045, { type: 'square', gain: 0.10 }); }
  function sfxConfirm() { ensureCtx(); const t = ctx.currentTime; playTone(t, 880, 0.05, { type: 'square', gain: 0.12 }); playTone(t + 0.05, 1320, 0.06, { type: 'square', gain: 0.10 }); }
  function sfxCancel()  { ensureCtx(); playTone(ctx.currentTime, 330, 0.09, { type: 'square', gain: 0.12 }); }
  function sfxText()    { ensureCtx(); playTone(ctx.currentTime, 1100, 0.018, { type: 'square', gain: 0.05, release: 0.01 }); }
  function sfxFaint()   { ensureCtx(); const t = ctx.currentTime; [580, 460, 360, 260, 160].forEach((f, i) => playTone(t + i * 0.08, f, 0.09, { type: 'sawtooth', gain: 0.12 })); }
  function sfxCatch()   { ensureCtx(); const t = ctx.currentTime; [440, 554, 659, 880].forEach((f, i) => playTone(t + i * 0.07, f, 0.09, { type: 'square', gain: 0.12 })); }
  function sfxLevelUp() { ensureCtx(); const t = ctx.currentTime; [523, 659, 784, 1046].forEach((f, i) => playTone(t + i * 0.06, f, 0.1, { type: 'triangle', gain: 0.13 })); }
  function sfxGlitch()  { ensureCtx(); playNoiseBurst(ctx.currentTime, 0.12, { gain: 0.16 }); playTone(ctx.currentTime, 90, 0.1, { type: 'sawtooth', gain: 0.08 }); }

  // ── Music: step-sequenced chiptune tracks ───────────────────
  function buildTrack({ stepDur, steps, lead = [], bass = [], drum = [], leadType = 'square', bassType = 'triangle', leadGain = 0.085, bassGain = 0.07, drumGain = 0.10 }) {
    const notes = [];
    function addRow(row, type, gain, isDrum) {
      for (let i = 0; i < steps; i++) {
        const cell = row[i];
        if (!cell) continue;
        const dur = stepDur * 0.85;
        if (isDrum) notes.push({ t: i * stepDur, kind: 'drum', dur, gain });
        else {
          const freq = noteFreq(cell);
          if (freq) notes.push({ t: i * stepDur, kind: 'tone', freq, dur, type, gain });
        }
      }
    }
    addRow(lead, leadType, leadGain, false);
    addRow(bass, bassType, bassGain, false);
    addRow(drum, null, drumGain, true);
    notes.sort((a, b) => a.t - b.t);
    return { notes, loopDur: steps * stepDur };
  }

  const TRACKS = {
    title: buildTrack({
      stepDur: 0.20, steps: 16,
      bass: ['A2', null, null, null, 'A2', null, null, null, 'E2', null, null, null, 'F2', null, null, null],
      lead: [null, null, 'C4', null, null, null, 'E4', null, null, 'D4', null, null, 'A4', null, null, null],
      leadType: 'square', bassType: 'sine', leadGain: 0.07, bassGain: 0.09,
    }),
    over_cache: buildTrack({
      stepDur: 0.16, steps: 16,
      bass: ['C3', null, 'G3', null, 'C3', null, 'G3', null, 'A2', null, 'E3', null, 'A2', null, 'E3', null],
      lead: ['E4', null, 'G4', null, 'C5', null, 'G4', null, 'F4', null, 'A4', null, 'C5', null, 'A4', null],
      leadType: 'sine', bassType: 'triangle', leadGain: 0.09, bassGain: 0.07,
    }),
    over_route1: buildTrack({
      stepDur: 0.13, steps: 16,
      bass: ['G3', null, 'G3', null, 'D3', null, 'D3', null, 'E3', null, 'E3', null, 'C3', null, 'C3', null],
      lead: ['G4', 'A4', 'B4', 'D5', 'B4', 'A4', 'G4', 'E4', 'D4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4', null],
      leadType: 'square', bassType: 'triangle', leadGain: 0.09, bassGain: 0.075,
    }),
    over_crawler: buildTrack({
      stepDur: 0.22, steps: 16,
      bass: ['D2', null, null, null, 'D2', null, null, 'C#2', null, null, null, 'D2', null, null, 'C2', null],
      lead: [null, null, null, 'F4', null, null, null, null, 'F#4', null, null, null, null, 'E4', null, null],
      drum: [null, null, null, null, null, null, null, null, null, null, null, null, 'x', null, null, null],
      leadType: 'sawtooth', bassType: 'sine', leadGain: 0.06, bassGain: 0.08, drumGain: 0.05,
    }),
    over_searchburg: buildTrack({
      stepDur: 0.12, steps: 16,
      bass: ['C3', 'C3', null, 'G3', 'C3', 'C3', null, 'G3', 'A2', 'A2', null, 'E3', 'A2', 'A2', null, 'E3'],
      lead: ['C5', null, 'E5', 'G5', null, 'E5', 'C5', null, 'A4', null, 'C5', 'E5', null, 'C5', 'A4', null],
      leadType: 'square', bassType: 'triangle', leadGain: 0.085, bassGain: 0.075,
    }),
    over_browser_bay: buildTrack({
      stepDur: 0.14, steps: 16,
      bass: ['A2','A2',null,'E3','A2',null,'E3',null,'G2','G2',null,'D3','G2',null,'D3',null],
      lead: ['E4',null,'G4','A4',null,'G4','E4',null,'C4',null,'E4','G4','A4',null,'E4',null],
      drum: [null,null,null,null,'x',null,null,null,null,null,null,null,'x',null,null,null],
      leadType: 'sine', bassType: 'triangle', leadGain: 0.09, bassGain: 0.075, drumGain: 0.06,
    }),
    over_streamport: buildTrack({
      stepDur: 0.115, steps: 16,
      bass: ['F2',null,'C3','F2',null,'F2','C3',null,'D2',null,'A2','D2',null,'D2','A2',null],
      lead: ['F4','A4','C5','A4','F4',null,'C5','A4','D4','F4','A4','F4','D4',null,'A4',null],
      drum: ['x',null,null,null,'x',null,null,'x','x',null,null,null,'x',null,null,null],
      leadType: 'square', bassType: 'triangle', leadGain: 0.09, bassGain: 0.08, drumGain: 0.07,
    }),
    over_cloud_city: buildTrack({
      stepDur: 0.20, steps: 16,
      bass: ['C2',null,null,'G2',null,null,'A1',null,null,'E2',null,null,'F2',null,null,null],
      lead: ['G4',null,'C5',null,'E5',null,'C5',null,'A4',null,'E5',null,'G5',null,'E5',null],
      leadType: 'sine', bassType: 'sine', leadGain: 0.08, bassGain: 0.07,
    }),
    over_crisis: buildTrack({
      stepDur: 0.26, steps: 16,
      bass: ['D2',null,null,'D2',null,'C#2',null,null,'D2',null,null,'E2',null,null,null,'D2'],
      lead: [null,'F3',null,null,'E3',null,null,'D#3',null,null,'D3',null,'C#3',null,null,null],
      drum: ['x',null,null,null,'x',null,null,null,'x',null,null,null,'x',null,'x',null],
      leadType: 'sawtooth', bassType: 'sine', leadGain: 0.07, bassGain: 0.08, drumGain: 0.06,
    }),
    gym2: buildTrack({
      stepDur: 0.095, steps: 16,
      bass: ['A2','A2','E2','E2','A2','A2','F2','F2','G2','G2','D2','D2','E2','E2','B1','B1'],
      lead: ['A4','C5','E5','C5','A4','E4','A4','C5','G4','B4','D5','B4','G4','E4','F4','E4'],
      drum: [null,null,null,'x',null,null,'x',null,null,null,null,'x',null,'x',null,null],
      leadType: 'sawtooth', bassType: 'triangle', leadGain: 0.095, bassGain: 0.085, drumGain: 0.09,
    }),
    gym3: buildTrack({
      stepDur: 0.085, steps: 16,
      bass: ['F2','F2','C2','C2','F2','F2','G2','G2','D2','D2','A2','A2','C2','C2','G1','G1'],
      lead: ['F4','A4','C5','A4','F4','C4','F4','A4','D4','F4','A4','F4','C5','A4','G4','F4'],
      drum: ['x',null,null,'x','x',null,null,'x','x',null,null,'x','x',null,'x','x'],
      leadType: 'sawtooth', bassType: 'triangle', leadGain: 0.10, bassGain: 0.09, drumGain: 0.10,
    }),
    gym4: buildTrack({
      stepDur: 0.08, steps: 16,
      bass: ['D2','D2','D2','A1','D2','D2','E2','E2','F2','F2','C2','C2','D2','D2','A1','A1'],
      lead: ['D5','F5','A5','F5','D5','F5','E5','D5','F5','A5','C6','A5','D5','F5','A5','D5'],
      drum: ['x',null,'x',null,'x',null,'x',null,'x',null,'x',null,'x',null,'x',null],
      leadType: 'sawtooth', bassType: 'triangle', leadGain: 0.10, bassGain: 0.09, drumGain: 0.11,
    }),
    battle_wild: buildTrack({
      stepDur: 0.11, steps: 16,
      bass: ['E3', 'E3', 'E3', 'E3', 'C3', 'C3', 'C3', 'C3', 'G3', 'G3', 'G3', 'G3', 'D3', 'D3', 'D3', 'D3'],
      lead: ['E5', null, 'G5', null, 'E5', null, 'B4', null, 'C5', null, 'E5', null, 'G5', null, 'C5', null],
      leadType: 'square', bassType: 'triangle', leadGain: 0.095, bassGain: 0.08,
    }),
    battle_trainer: buildTrack({
      stepDur: 0.095, steps: 16,
      bass: ['A2', 'A2', 'A2', 'A2', 'F2', 'F2', 'F2', 'F2', 'G2', 'G2', 'G2', 'G2', 'E2', 'E2', 'E2', 'E2'],
      lead: ['A4', 'C5', 'A4', 'E5', null, 'C5', 'A4', 'G4', 'F4', 'A4', 'F4', 'C5', null, 'A4', 'G4', 'E4'],
      drum: [null, null, null, null, 'x', null, null, null, null, null, null, null, 'x', null, null, null],
      leadType: 'sawtooth', bassType: 'triangle', leadGain: 0.095, bassGain: 0.085, drumGain: 0.09,
    }),
    gym: buildTrack({
      stepDur: 0.085, steps: 16,
      bass: ['D2', 'D2', 'A2', 'A2', 'D2', 'D2', 'F2', 'F2', 'D2', 'D2', 'A2', 'A2', 'C2', 'C2', 'A#1', 'A#1'],
      lead: ['D5', 'F5', 'A5', 'F5', 'D5', 'A4', 'D5', 'F5', 'C5', 'E5', 'G5', 'E5', 'C5', 'A4', 'A#4', 'C5'],
      drum: ['x', null, null, 'x', 'x', null, null, 'x', 'x', null, null, 'x', 'x', null, 'x', 'x'],
      leadType: 'sawtooth', bassType: 'triangle', leadGain: 0.10, bassGain: 0.09, drumGain: 0.10,
    }),
  };

  function fadeGainNode(node, target, dur) {
    if (!ctx || !node) return;
    const now = ctx.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(node.gain.value, now);
    node.gain.linearRampToValueAtTime(target, now + dur);
  }

  function scheduleEvent(when, ev, destNode) {
    if (ev.kind === 'drum') playNoiseBurst(when, ev.dur, { gain: ev.gain, destination: destNode });
    else playTone(when, ev.freq, ev.dur, { type: ev.type, gain: ev.gain, destination: destNode });
  }

  function stopMusic(fadeDur = 0.4) {
    trackGen++;
    if (activeGainNode) fadeGainNode(activeGainNode, 0, fadeDur);
    currentTrackName = null;
    activePlayer = null;
  }

  function playTrack(name, { fade = 0.6 } = {}) {
    ensureCtx();
    if (!ctx) return;
    if (muted && masterGain) masterGain.gain.setValueAtTime(0, ctx.currentTime);
    if (name === currentTrackName) return;
    const def = TRACKS[name];
    if (!def) { stopMusic(); return; }
    trackGen++;
    const myGen = trackGen;
    currentTrackName = name;
    const newNode = activeGainNode === musicGainA ? musicGainB : musicGainA;
    const oldNode = activeGainNode;
    if (oldNode && oldNode !== newNode) fadeGainNode(oldNode, 0, fade);
    newNode.gain.cancelScheduledValues(ctx.currentTime);
    newNode.gain.setValueAtTime(0, ctx.currentTime);
    newNode.gain.linearRampToValueAtTime(1, ctx.currentTime + fade);
    activeGainNode = newNode;

    let idx = 0;
    let cycleStart = ctx.currentTime + 0.05;
    activePlayer = {
      tick() {
        if (myGen !== trackGen) return;
        const lookahead = ctx.currentTime + 0.25;
        let guard = 0;
        while (cycleStart + def.notes[idx].t < lookahead && guard < 64) {
          scheduleEvent(cycleStart + def.notes[idx].t, def.notes[idx], newNode);
          idx++;
          if (idx >= def.notes.length) { idx = 0; cycleStart += def.loopDur; }
          guard++;
        }
      },
    };
  }

  function playVictory() {
    ensureCtx();
    if (!ctx) return;
    stopMusic(0.15);
    const dest = activeGainNode;
    if (dest) { dest.gain.cancelScheduledValues(ctx.currentTime); dest.gain.setValueAtTime(1, ctx.currentTime); }
    const t = ctx.currentTime;
    const seq = [
      { f: 'C5', d: 0.18 }, { f: 'E5', d: 0.18 }, { f: 'G5', d: 0.18 }, { f: 'C6', d: 0.5 },
      { f: 'G5', d: 0.18 }, { f: 'C6', d: 0.9 },
    ];
    let when = t;
    seq.forEach(n => { playTone(when, noteFreq(n.f), n.d, { type: 'square', gain: 0.16, destination: dest }); when += n.d; });
    playTone(t, noteFreq('C3'), 1.8, { type: 'triangle', gain: 0.10, destination: dest });
  }

  function update() { if (activePlayer) activePlayer.tick(); }

  return {
    unlock, toggleMute, isMuted, update,
    playTrack, stopMusic, playVictory,
    sfxCursor, sfxConfirm, sfxCancel, sfxText, sfxFaint, sfxCatch, sfxLevelUp, sfxGlitch,
  };
})();
