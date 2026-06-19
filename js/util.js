'use strict';

const STEP_FRAMES = 10;  // frames per tile step

// ── Map row builder ───────────────────────────────────────────
function mkRow(str) {
  return str.split('').map(c => {
    switch(c) {
      case '.': return T.PATH;
      case 'g': return T.GRASS;
      case 'G': return T.TALL;
      case 'W': return T.WALL;
      case 'B': return T.WALL;   // building facade (solid)
      case 'D': return T.DOOR;
      case 'F': return T.FLOOR;
      case 'C': return T.COUNTER;
      case 'T': return T.TREE;
      case '~': return T.WATER;
      case 'f': return T.FLOWER;
      case 'P': return T.PORTAL;
      case '>': return T.LEDGE_E;
      default:  return T.PATH;
    }
  });
}

// ── Camera ────────────────────────────────────────────────────
function getCam(map) {
  const cx = PLAYER.x * TS - (VW * TS) / 2 + TS / 2;
  const cy = PLAYER.y * TS - (VH * TS) / 2 + TS / 2;
  const maxX = map.w * TS - VW * TS;
  const maxY = map.h * TS - VH * TS;
  return {
    x: Math.max(0, Math.min(cx, maxX)),
    y: Math.max(0, Math.min(cy, maxY))
  };
}

// ── Googlidex helpers ─────────────────────────────────────────
function dexSee(name) {
  if (!SAVE.dex[name]) SAVE.dex[name] = { seen: false, caught: false };
  SAVE.dex[name].seen = true;
}
function dexCatch(name) {
  if (!SAVE.dex[name]) SAVE.dex[name] = { seen: false, caught: false };
  SAVE.dex[name].seen = true;
  SAVE.dex[name].caught = true;
}

// ── Wild Googlimon generator ──────────────────────────────────
function xpToLevel(lv) { return Math.floor(lv * lv * 5); }

function levelUpMon(mon) {
  mon.level++;
  mon.xp = 0;
  mon.xpToNext = xpToLevel(mon.level + 1);
  mon.maxHp += 4; mon.hp = Math.min(mon.hp + 4, mon.maxHp);
  mon.atk = (mon.atk || 5) + 1;
  mon.def = (mon.def || 5) + 1;
  mon.spd = (mon.spd || 5) + 1;
  const sp = SPECIES[mon.name];
  if (sp) {
    sp.learnset.filter(e => e.lv === mon.level).forEach(entry => {
      const mv = Object.assign({}, entry.move, { ppLeft: entry.move.pp });
      if (!mon.moves) mon.moves = [];
      if (mon.moves.length < 4) mon.moves.push(mv);
      else mon.moves[mon.moves.length - 1] = mv;
    });
  }
  // Check evolution
  const evo = EVOLUTIONS[mon.name];
  if (evo && mon.level >= evo.at) {
    const newSp = SPECIES[evo.into];
    if (newSp) {
      const sc = 1 + (mon.level - 1) * 0.12;
      const newMaxHp = Math.max(10, Math.floor(newSp.baseHp * sc));
      mon.hp = Math.min(mon.hp + (newMaxHp - mon.maxHp), newMaxHp);
      mon.maxHp = newMaxHp;
      mon.atk = Math.max(1, Math.floor(newSp.baseAtk * sc));
      mon.def = Math.max(1, Math.floor(newSp.baseDef * sc));
      mon.spd = Math.max(1, Math.floor(newSp.baseSpd * sc));
      mon.type1 = newSp.type1;
      if (newSp.type2) mon.type2 = newSp.type2; else delete mon.type2;
      mon.name = evo.into;
      return evo.into;
    }
  }
  return null;
}

function generateWild(name, level) {
  const sp = SPECIES[name];
  if (!sp) return null;
  const sc = 1 + (level - 1) * 0.12;
  const maxHp = Math.max(10, Math.floor(sp.baseHp * sc));
  const moves = sp.learnset
    .filter(e => e.lv <= level)
    .map(e => Object.assign({}, e.move, { ppLeft: e.move.pp }))
    .slice(-4);
  return {
    name, level,
    type1: sp.type1, type2: sp.type2 || null,
    maxHp, hp: maxHp,
    atk: Math.max(5, Math.floor(sp.baseAtk * sc)),
    def: Math.max(5, Math.floor(sp.baseDef * sc)),
    spd: Math.max(5, Math.floor(sp.baseSpd * sc)),
    moves, catchRate: sp.catchRate, xpYield: sp.xpYield,
    status: null, revealedStats: new Set(),
  };
}

function checkWildEncounter() {
  if (!SAVE.starterChosen) return;
  if (!PLAYER.party.length) return;
  const map = MAPS[PLAYER.mapId];
  if (!map || !map.encounterPool) return;
  const tile = map.tiles[PLAYER.y] && map.tiles[PLAYER.y][PLAYER.x];
  if (!ENCOUNTER_TILES.has(tile)) return;
  if (Math.random() >= 1/6) return;

  const pool = map.encounterPool;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.floor(Math.random() * total);
  const pick = pool.find(e => { r -= e.weight; return r < 0; }) || pool[0];
  const level = pick.minLv + Math.floor(Math.random() * (pick.maxLv - pick.minLv + 1));
  const wild = generateWild(pick.name, level);
  if (!wild) return;
  setState('battle', { wild, fighter: PLAYER.party[0] });
}
