'use strict';

// ============================================================
// CANVAS + CORE CONFIG
// ============================================================
const W   = 480;   // logical canvas width  (CSS doubles to 960)
const H   = 320;   // logical canvas height (CSS doubles to 640)
const TS  = 16;    // tile size in canvas pixels (= 32px on screen)
const VW  = 30;    // viewport width  in tiles (30 × 16 = 480)
const VH  = 13;    // viewport height in tiles (13 × 16 = 208)
const UI_Y = VH * TS; // 208 — dividing line between map area and UI strip

// ============================================================
// COLOR PALETTE
// ============================================================
const PAL = {
  // Void / backgrounds
  BG:        '#050d1a',
  VOID:      '#020509',
  // Map tiles
  PATH:      '#1c2a1c',
  GRASS:     '#1a3a1a',
  TALL:      '#0b4a0b',
  WATER:     '#0a1a5a',
  TREE:      '#0a2a0a',
  WALL_BG:   '#1a1208',
  DOOR_BG:   '#3a2800',
  FLOOR:     '#1e1e2e',
  GYM:       '#0d1e1e',
  COUNTER:   '#2a1a08',
  SIGN:      '#2a2000',
  // UI panels
  PANEL:     '#070e1a',
  PANEL2:    '#0a1628',
  BORDER:    '#005577',
  BORDER2:   '#002233',
  BORDER_HI: '#00aacc',
  // Accent / highlight
  ACCENT:    '#00d4ff',
  ACCENT2:   '#0088bb',
  GOLD:      '#f5c542',
  // Text
  TEXT:      '#c8e8ff',
  TEXT_DIM:  '#3a5a77',
  TEXT_DARK: '#1a2a3a',
  TEXT_RED:  '#ff4455',
  TEXT_YLW:  '#ffdd44',
  // HP / EXP bars
  HP_HI:     '#00ee77',
  HP_MED:    '#ffdd00',
  HP_LOW:    '#ff2244',
  EXP:       '#0088ff',
  // Status conditions
  CORRUPTED: '#aa00ff',
  LAGGED:    '#ffaa00',
  CRASHED:   '#4488ff',
  BURNED:    '#ff5500',
  FROZEN:    '#88ddff',
  // Type colors (14 types)
  T_SEARCH:  '#f5c542',
  T_BROWSER: '#4286f4',
  T_CLOUD:   '#a0d8ef',
  T_DATA:    '#9c27b0',
  T_MEDIA:   '#e91e63',
  T_AI:      '#8855cc',
  T_SEC:     '#4caf50',
  T_GAMING:  '#ff5722',
  T_SOCIAL:  '#00bcd4',
  T_HW:      '#8d6e63',
  T_ELEC:    '#ffeb3b',
  T_VIRUS:   '#76bc3a',
  T_QUANT:   '#3f51b5',
  T_COSMIC:  '#b0a0ff',
};

// Shorthand type→color lookup used throughout the game
const TYPE_COL = {
  Search:   PAL.T_SEARCH,  Browser:  PAL.T_BROWSER,
  Cloud:    PAL.T_CLOUD,   Data:     PAL.T_DATA,
  Media:    PAL.T_MEDIA,   AI:       PAL.T_AI,
  Security: PAL.T_SEC,     Gaming:   PAL.T_GAMING,
  Social:   PAL.T_SOCIAL,  Hardware: PAL.T_HW,
  Electric: PAL.T_ELEC,    Virus:    PAL.T_VIRUS,
  Quantum:  PAL.T_QUANT,   Cosmic:   PAL.T_COSMIC,
};

// ============================================================
// TILE SYSTEM
// ============================================================
const T = {
  PATH:    0,   // walkable — dirt/stone path
  GRASS:   1,   // walkable — short grass, no encounter
  TALL:    2,   // walkable — tall grass, triggers wild encounter
  WATER:   3,   // impassable
  TREE:    4,   // impassable — tree canopy
  WALL:    5,   // impassable — building exterior / rock face
  DOOR:    6,   // walkable — triggers map transition
  FLOOR:   7,   // walkable — indoor floor
  COUNTER: 8,   // impassable — shop counter / desk
  GYM:     9,   // walkable — gym floor tile
  SIGN:    10,  // impassable — interactable sign post
  PC:      11,  // impassable — PC terminal (interactable)
  STAIR:   12,  // walkable — staircase
  FLOWER:  13,  // walkable — decorative flowers (no encounter)
  SAND:    14,  // walkable — sandy path
  PORTAL:  15,  // walkable — warp pad (gym portal maze)
  LEDGE_E: 16,  // one-way east ledge: hop 2 east when approached from west; impassable all other directions
};

const WALKABLE = new Set([
  T.PATH, T.GRASS, T.TALL, T.DOOR, T.FLOOR,
  T.GYM, T.STAIR, T.FLOWER, T.SAND, T.PORTAL,
]);
const ENCOUNTER_TILES = new Set([T.TALL]);

// Per-tile visual definition: { bg, det }
const TILE_DEF = {
  [T.PATH]:    { bg: '#1c2a1c', det: '#162216' },
  [T.GRASS]:   { bg: '#1a3a1a', det: '#132813' },
  [T.TALL]:    { bg: '#0b4a0b', det: '#083808' },
  [T.WATER]:   { bg: '#0a1a5a', det: '#0a1270' },
  [T.TREE]:    { bg: '#0a2a0a', det: '#1a4a1a' },
  [T.WALL]:    { bg: '#1a1208', det: '#251a0a' },
  [T.DOOR]:    { bg: '#3a2800', det: '#4a3800' },
  [T.FLOOR]:   { bg: '#1e1e2e', det: '#181828' },
  [T.COUNTER]: { bg: '#2a1a08', det: '#3a2a10' },
  [T.GYM]:     { bg: '#0d1e1e', det: '#0a2828' },
  [T.SIGN]:    { bg: '#2a2000', det: '#3a3000' },
  [T.PC]:      { bg: '#001e3a', det: '#002a50' },
  [T.STAIR]:   { bg: '#282818', det: '#383828' },
  [T.FLOWER]:  { bg: '#1a3a1a', det: '#1a3a1a' },
  [T.SAND]:    { bg: '#2a2210', det: '#322a18' },
  [T.PORTAL]:  { bg: '#001428', det: '#0066cc' },
  [T.LEDGE_E]: { bg: '#1c2a1c', det: '#7a9a44' },
};
