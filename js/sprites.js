'use strict';

// ============================================================
// SPRITE CACHE  (preload PNGs from GitHub, fall back to canvas primitives)
// ============================================================
const SPRITE_BASE   = "https://raw.githubusercontent.com/rjohnsonmm317/googlimon/main/assets/sprites/";
const SPRITE_CACHE  = {};
const SPRITE_FAILED = new Set();

let spritesTotal = 0;
let spritesDone  = 0;

function loadSprite(key, filename) {
  if (SPRITE_CACHE[key] || SPRITE_FAILED.has(key)) return;
  spritesTotal++;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload  = () => { SPRITE_CACHE[key] = img; spritesDone++; };
  img.onerror = () => { SPRITE_FAILED.add(key); spritesDone++; };
  img.src = SPRITE_BASE + filename;
}

function getSprite(key) { return SPRITE_CACHE[key] || null; }

// ============================================================
// DRAW UTILITIES
// ============================================================

// Solid rectangle
function fr(x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x, y, w, h);
}

// Outlined rectangle (1-px inset so it aligns on pixels)
function sr(x, y, w, h, col, lw = 1) {
  ctx.strokeStyle = col;
  ctx.lineWidth = lw;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

// Draw a UI panel: filled bg with double border
function drawPanel(x, y, w, h, {
  bg     = PAL.PANEL,
  outer  = PAL.BORDER2,
  inner  = PAL.BORDER,
} = {}) {
  fr(x, y, w, h, bg);
  // outer edge (dark)
  fr(x,         y,         w, 1, outer);
  fr(x,         y + h - 1, w, 1, outer);
  fr(x,         y,         1, h, outer);
  fr(x + w - 1, y,         1, h, outer);
  // inner highlight
  fr(x + 1,     y + 1,     w - 2, 1, inner);
  fr(x + 1,     y + h - 2, w - 2, 1, inner);
  fr(x + 1,     y + 1,     1, h - 2, inner);
  fr(x + w - 2, y + 1,     1, h - 2, inner);
}

// Draw pixel-style text using Courier New (monospace = consistent widths)
function drawText(str, x, y, {
  color  = PAL.TEXT,
  size   = 8,
  align  = 'left',
  shadow = true,
  alpha  = 1,
} = {}) {
  ctx.globalAlpha = alpha;
  ctx.font        = `${size}px 'Courier New', monospace`;
  ctx.textAlign   = align;
  ctx.textBaseline = 'top';
  if (shadow) {
    ctx.fillStyle = '#000000dd';
    ctx.fillText(str, x + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.globalAlpha = 1;
}

function drawTextC(str, y, opts = {}) {
  drawText(str, W / 2, y, { align: 'center', ...opts });
}

// Word-wrap a string to fit within maxWidth, breaking at spaces
function wrapText(str, maxWidth, size = 8) {
  const prevFont = ctx.font;
  ctx.font = `${size}px 'Courier New', monospace`;
  const words = String(str).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (cur && ctx.measureText(test).width > maxWidth) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur || !lines.length) lines.push(cur);
  ctx.font = prevFont;
  return lines;
}

// Draw word-wrapped text; returns the number of lines drawn
function drawTextWrapped(str, x, y, maxWidth, opts = {}) {
  const { size = 8, lineHeight = size + 4 } = opts;
  const lines = wrapText(str, maxWidth, size);
  lines.forEach((line, i) => drawText(line, x, y + i * lineHeight, opts));
  return lines.length;
}

// HP/EXP bar
function drawBar(x, y, w, h, ratio, hiCol, bg = '#111122') {
  fr(x, y, w, h, bg);
  fr(x + 1, y + 1, Math.max(0, Math.floor((w - 2) * Math.min(1, ratio))), h - 2, hiCol);
  sr(x, y, w, h, PAL.BORDER2);
}

function drawHPBar(x, y, w, h, cur, max) {
  const r = Math.max(0, cur / max);
  const col = r > 0.5 ? PAL.HP_HI : r > 0.25 ? PAL.HP_MED : PAL.HP_LOW;
  drawBar(x, y, w, h, r, col);
}

// Small type badge  (e.g. [SEARCH])
function drawTypeBadge(type, x, y) {
  const col = TYPE_COL[type] ?? PAL.TEXT_DIM;
  const w = 36, h = 10;
  fr(x, y, w, h, col + '33');
  sr(x, y, w, h, col);
  drawText(type.toUpperCase().slice(0, 6), x + w / 2, y + 1, {
    color: col, size: 6, align: 'center',
  });
}

// ============================================================
// TILE DRAWER
// ============================================================

// Draw one tile at canvas-pixel position (px, py)
function drawTile(id, px, py, tick) {
  const def = TILE_DEF[id] ?? TILE_DEF[T.PATH];
  ctx.fillStyle = def.bg;
  ctx.fillRect(px, py, TS, TS);

  const d = def.det;

  switch (id) {
    case T.PATH: {
      // Subtle cobblestone — alternating stone blocks
      const pRow2 = (Math.floor(py / TS) + Math.floor(px / TS)) % 2;
      ctx.fillStyle = pRow2 ? '#181e18' : '#161c16';
      ctx.fillRect(px, py, TS, TS);
      // Mortar lines
      ctx.fillStyle = '#0e140e';
      ctx.fillRect(px, py, TS, 1);
      ctx.fillRect(px, py, 1, TS);
      // Stone highlight
      ctx.fillStyle = '#20281888';
      ctx.fillRect(px + 1, py + 1, TS - 3, 1);
      break;
    }

    case T.GRASS: {
      // Base with slight variation based on position
      const gVar = (Math.floor(px / TS) * 3 + Math.floor(py / TS) * 7) % 4;
      ctx.fillStyle = ['#1a3a1a','#193818','#1b3c1b','#183619'][gVar];
      ctx.fillRect(px, py, TS, TS);
      // Short blades
      ctx.fillStyle = d;
      ctx.fillRect(px + 3,  py + 4, 1, 5);
      ctx.fillRect(px + 7,  py + 3, 1, 6);
      ctx.fillRect(px + 11, py + 5, 1, 4);
      ctx.fillRect(px + 14, py + 2, 1, 7);
      // Bright tips
      ctx.fillStyle = '#226a22';
      ctx.fillRect(px + 3,  py + 4, 1, 2);
      ctx.fillRect(px + 7,  py + 3, 1, 2);
      ctx.fillRect(px + 11, py + 5, 1, 2);
      break;
    }

    case T.TALL:
      // Blades + animated sway shimmer
      ctx.fillStyle = d;
      ctx.fillRect(px + 2,  py + 2,  2, 10);
      ctx.fillRect(px + 6,  py + 1,  2, 12);
      ctx.fillRect(px + 10, py + 2,  2, 11);
      ctx.fillRect(px + 14, py + 3,  2,  9);
      // Bright tips
      ctx.fillStyle = '#1a6a1a';
      ctx.fillRect(px + 2,  py + 2,  2, 2);
      ctx.fillRect(px + 6,  py + 1,  2, 2);
      ctx.fillRect(px + 10, py + 2,  2, 2);
      ctx.fillRect(px + 14, py + 3,  2, 2);
      // Subtle shimmer pulse every ~60 ticks
      if (tick && Math.floor(tick / 40) % 3 === ((px / TS + py / TS) % 3)) {
        ctx.fillStyle = '#00ee0022';
        ctx.fillRect(px, py, TS, TS);
      }
      break;

    case T.WATER: {
      // Animated horizontal ripples
      const wo = Math.floor((tick ?? 0) / 18) % 8;
      ctx.fillStyle = '#0c1f7a';
      ctx.fillRect(px + ((0 + wo) % TS), py + 4, 6, 2);
      ctx.fillRect(px + ((8 + wo) % TS), py + 4, 6, 2);
      ctx.fillRect(px + ((4 + wo) % TS), py + 11, 5, 2);
      ctx.fillRect(px + ((12 + wo) % TS), py + 11, 5, 2);
      // Glint
      ctx.fillStyle = '#1a3aaa44';
      ctx.fillRect(px + 1, py + 1, TS - 2, 2);
      break;
    }

    case T.TREE:
      // Layered canopy
      ctx.fillStyle = '#1a4a1a';
      ctx.fillRect(px + 1, py + 1, 14, 14);
      ctx.fillStyle = '#226a22';
      ctx.fillRect(px + 3, py + 3, 10, 8);
      ctx.fillStyle = '#2a7a2a';
      ctx.fillRect(px + 5, py + 5,  6, 5);
      ctx.fillStyle = '#0a2a0a';
      ctx.fillRect(px + 6, py + 0,  4, 3);  // treetop spike
      break;

    case T.WALL: {
      // Dark stone base
      ctx.fillStyle = '#14100a';
      ctx.fillRect(px, py, TS, TS);
      // Brick rows — offset by alternating row
      const brickRow = Math.floor(py / TS) % 2;
      const brickOff = brickRow ? 8 : 0;
      ctx.fillStyle = '#1e1608';
      // Two horizontal mortar lines at y=5 and y=11
      ctx.fillRect(px, py + 5,  TS, 1);
      ctx.fillRect(px, py + 11, TS, 1);
      // Vertical mortar splits (per brick)
      ctx.fillStyle = '#18120600';
      for (let bxb = 0; bxb < TS; bxb += 8) {
        const bx2 = (bxb + brickOff) % TS;
        ctx.fillStyle = '#1c1408';
        ctx.fillRect(px + bx2, py,     Math.min(7, TS - bx2), 5);
        ctx.fillRect(px + bx2, py + 6, Math.min(7, TS - bx2), 5);
        ctx.fillRect(px + bx2, py + 12,Math.min(7, TS - bx2), 4);
      }
      // Top-edge highlight
      ctx.fillStyle = '#3a2a1444';
      ctx.fillRect(px, py, TS, 2);
      // Right-edge subtle shadow
      ctx.fillStyle = '#0a080444';
      ctx.fillRect(px + TS - 1, py, 1, TS);
      break;
    }

    case T.DOOR: {
      // Dark stone door frame
      ctx.fillStyle = '#1a1208';
      ctx.fillRect(px, py, TS, TS);
      // Frame sides + top
      ctx.fillStyle = '#3a2200';
      ctx.fillRect(px + 1, py + 1, 2, TS - 1);   // left pillar
      ctx.fillRect(px + TS - 3, py + 1, 2, TS - 1); // right pillar
      ctx.fillRect(px + 1, py + 1, TS - 2, 3);   // top lintel
      // Door panel (warm amber)
      ctx.fillStyle = '#6b4500';
      ctx.fillRect(px + 3, py + 4, TS - 6, TS - 5);
      // Door wood grain
      ctx.fillStyle = '#7a5010';
      ctx.fillRect(px + 4, py + 5, 3, 8);
      ctx.fillRect(px + 9, py + 5, 3, 8);
      // Arched top cutout
      ctx.fillStyle = '#3a2200';
      ctx.fillRect(px + 4, py + 4, TS - 8, 3);
      ctx.fillStyle = '#5a3800';
      ctx.fillRect(px + 5, py + 4, TS - 10, 2);
      // Handle (gold knob)
      ctx.fillStyle = '#d4a017';
      ctx.fillRect(px + 7, py + 9, 2, 2);
      // Bottom threshold highlight
      ctx.fillStyle = '#c8a040';
      ctx.fillRect(px + 3, py + TS - 1, TS - 6, 1);
      break;
    }

    case T.FLOOR:
      // Subtle tile grid
      ctx.fillStyle = d;
      ctx.fillRect(px,          py,          TS, 1);
      ctx.fillRect(px,          py,          1,  TS);
      ctx.fillRect(px + TS - 1, py,          1,  TS);
      ctx.fillRect(px,          py + TS - 1, TS, 1);
      break;

    case T.COUNTER:
      ctx.fillStyle = '#4a3010';
      ctx.fillRect(px + 1, py + 1, TS - 2, TS - 2);
      ctx.fillStyle = '#6a4820';
      ctx.fillRect(px + 2, py + 2, TS - 4, 4);
      break;

    case T.GYM: {
      // Checkerboard teal pattern
      const checker = (Math.floor(px / TS) + Math.floor(py / TS)) % 2 === 0;
      ctx.fillStyle = checker ? '#0d2828' : '#0a1e1e';
      ctx.fillRect(px, py, TS, TS);
      ctx.fillStyle = '#00aaaa18';
      ctx.fillRect(px, py, TS, 1);
      ctx.fillRect(px, py, 1, TS);
      break;
    }

    case T.SIGN:
      ctx.fillStyle = '#4a3a00';
      ctx.fillRect(px + 3,  py + 2,  10, 8);  // sign board
      ctx.fillStyle = '#2a1a00';
      ctx.fillRect(px + 7,  py + 10, 2,  6);  // post
      ctx.fillStyle = '#6a5a00';
      ctx.fillRect(px + 4,  py + 3,  8,  6);  // board face
      break;

    case T.PC:
      ctx.fillStyle = '#002a4a';
      ctx.fillRect(px + 2, py + 2, 12, 10);
      ctx.fillStyle = PAL.ACCENT + '88';
      ctx.fillRect(px + 3, py + 3, 10,  8);
      // Blinking cursor
      if (tick && Math.floor(tick / 30) % 2 === 0) {
        ctx.fillStyle = PAL.ACCENT;
        ctx.fillRect(px + 5, py + 5,  2,  4);
      }
      break;

    case T.STAIR:
      ctx.fillStyle = d;
      for (let s = 0; s < 4; s++) {
        ctx.fillRect(px + s * 3, py + s * 3, TS - s * 3, 3);
      }
      break;

    case T.FLOWER:
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(px, py, TS, TS);
      // Small flowers
      const flowerCols = ['#ff88aa', '#ffdd44', '#aa88ff'];
      const fc = flowerCols[(Math.floor(px / TS) + Math.floor(py / TS)) % 3];
      ctx.fillStyle = fc;
      ctx.fillRect(px + 2,  py + 3,  2, 2);
      ctx.fillRect(px + 8,  py + 7,  2, 2);
      ctx.fillRect(px + 12, py + 2,  2, 2);
      ctx.fillStyle = '#ffff88';
      ctx.fillRect(px + 3,  py + 4,  1, 1);
      ctx.fillRect(px + 9,  py + 8,  1, 1);
      ctx.fillRect(px + 13, py + 3,  1, 1);
      break;

    case T.SAND:
      ctx.fillStyle = d;
      ctx.fillRect(px + 1,  py + 5,  2, 1);
      ctx.fillRect(px + 6,  py + 10, 3, 1);
      ctx.fillRect(px + 11, py + 3,  2, 1);
      break;

    case T.PORTAL: {
      // Pulsing cyan warp pad
      const pPulse = tick ? Math.sin(tick * 0.08 + (px + py) * 0.2) * 0.5 + 0.5 : 0.5;
      ctx.fillStyle = `rgba(0,80,${Math.floor(160 + pPulse * 95)},0.9)`;
      ctx.fillRect(px + 2, py + 2, TS - 4, TS - 4);
      ctx.fillStyle = '#00ccff55';
      ctx.fillRect(px + 4, py + 4, TS - 8, TS - 8);
      // Rotating chevron arrows
      const arrowBright = Math.floor(pPulse * 200 + 55);
      ctx.fillStyle = `rgb(0,${arrowBright},255)`;
      ctx.fillRect(px + 6, py + 5, 4, 2);
      ctx.fillRect(px + 7, py + 7, 2, 2);
      ctx.fillRect(px + 6, py + 9, 4, 2);
      break;
    }

    case T.LEDGE_E: {
      // One-way east ledge — raised ground with visible east drop edge
      ctx.fillStyle = '#263426';
      ctx.fillRect(px, py, TS, TS - 4);
      ctx.fillStyle = '#1c2a1c';
      ctx.fillRect(px, py + TS - 4, TS, 4);
      // Bright east-edge lip showing the drop
      ctx.fillStyle = '#7a9a44';
      ctx.fillRect(px + TS - 3, py + 1, 2, TS - 5);
      ctx.fillStyle = '#aaddaa';
      ctx.fillRect(px + TS - 2, py + 1, 1, TS - 5);
      // Small east-pointing arrow hint
      ctx.fillStyle = '#ccffaa';
      ctx.fillRect(px + TS - 6, py + 5, 3, 1);
      ctx.fillRect(px + TS - 5, py + 6, 3, 1);
      ctx.fillRect(px + TS - 4, py + 7, 3, 1);
      ctx.fillRect(px + TS - 5, py + 8, 3, 1);
      ctx.fillRect(px + TS - 6, py + 9, 3, 1);
      break;
    }
  }
}

// ============================================================
// SPRITE DRAWERS — player, NPCs, leaders, objects
// ============================================================

function drawPlayerBoy(px, py, dir, frame) {
  const x = Math.floor(px), y = Math.floor(py);
  const bob = frame % 2 === 0 ? 0 : 1;
  ctx.globalAlpha = 0.3; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x+8, y+15+bob, 5, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // Sneakers
  fr(x+4,  y+13+bob, 4, 2, '#dddddd');
  fr(x+9,  y+13+bob, 4, 2, '#dddddd');
  // Pants
  if (dir===1) { fr(x+6, y+9, 3, 5, '#1a2244'); fr(x+9, y+9+bob, 3, 5, '#1a2244'); }
  else if (dir===3) { fr(x+5, y+9+bob, 3, 5, '#1a2244'); fr(x+8, y+9, 3, 5, '#1a2244'); }
  else { fr(x+5, y+9+bob, 3, 5, '#1a2244'); fr(x+9, y+9+bob, 3, 5, '#1a2244'); }
  // Red hoodie
  fr(x+3, y+4, 11, 7, '#cc3300');
  fr(x+6, y+9, 5, 2, '#aa2200');  // front pocket
  // White stripe on sleeve (side-facing)
  if (dir===1) fr(x+13, y+5, 1, 5, '#ffffff');
  if (dir===3) fr(x+3,  y+5, 1, 5, '#ffffff');
  // Head
  fr(x+4, y+0, 9, 6, '#ffcc99');
  // Spiky hair
  fr(x+3, y+0, 11, 2, '#cc8833');
  fr(x+4, y-1,  3, 2, '#cc8833');
  fr(x+7, y-2,  3, 2, '#cc8833');
  fr(x+10,y-1,  2, 2, '#cc8833');
  // Eyes
  if (dir===2) { fr(x+6, y+2, 2, 2, '#222'); fr(x+10, y+2, 2, 2, '#222'); }
  else if (dir===1) fr(x+11, y+2, 2, 2, '#222');
  else if (dir===3) fr(x+4,  y+2, 2, 2, '#222');
  // Backpack (back-facing)
  if (dir===0) fr(x+2, y+5, 3, 5, '#884400');
}

function drawPlayerGirl(px, py, dir, frame) {
  const x = Math.floor(px), y = Math.floor(py);
  const bob = frame % 2 === 0 ? 0 : 1;
  ctx.globalAlpha = 0.3; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x+8, y+15+bob, 5, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // Boots
  fr(x+4,  y+12+bob, 4, 3, '#cc6688');
  fr(x+9,  y+12+bob, 4, 3, '#cc6688');
  // Shorts / skirt
  if (dir===1) { fr(x+6, y+9, 3, 4, '#7744bb'); fr(x+9, y+9+bob, 3, 4, '#7744bb'); }
  else if (dir===3) { fr(x+5, y+9+bob, 3, 4, '#7744bb'); fr(x+8, y+9, 3, 4, '#7744bb'); }
  else { fr(x+4, y+9+bob, 9, 4, '#7744bb'); }
  // Teal jacket
  fr(x+3, y+4, 11, 7, '#33aaaa');
  fr(x+5, y+4, 7, 2, '#55cccc');  // lighter collar
  // Head
  fr(x+4, y+0, 9, 6, '#ffcc99');
  // Purple hair — top and sides
  fr(x+3, y+0, 11, 3, '#553388');
  fr(x+3, y+3,  2, 4, '#553388');
  fr(x+12,y+3,  2, 6, '#553388');  // longer right side / ponytail
  // Pink bow
  fr(x+5, y+0, 3, 2, '#ff44aa');
  fr(x+9, y+0, 3, 2, '#ff44aa');
  // Eyes (violet)
  if (dir===2) { fr(x+6, y+2, 2, 2, '#553388'); fr(x+10, y+2, 2, 2, '#553388'); }
  else if (dir===1) fr(x+11, y+2, 2, 2, '#553388');
  else if (dir===3) fr(x+4,  y+2, 2, 2, '#553388');
  // Bag strap (side-facing)
  if (dir===1) fr(x+4, y+5, 1, 6, '#ff44aa');
  if (dir===3) fr(x+12,y+5, 1, 6, '#ff44aa');
}

function drawPlayer(px, py, dir, frame) {
  if (SAVE.playerGender === 'girl') drawPlayerGirl(px, py, dir, frame);
  else drawPlayerBoy(px, py, dir, frame);
}

function drawNPC(px, py, dir, color) {
  const x = Math.floor(px);
  const y = Math.floor(py);

  // Shadow
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x+8, y+15, 4, 2, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Legs
  fr(x+5, y+10, 3, 5, '#555566');
  fr(x+9, y+10, 3, 5, '#555566');
  // Body
  fr(x+4, y+5, 9, 7, color);
  // Head
  fr(x+4, y+0, 9, 6, '#ffcc99');
  // Eyes
  if (dir === 2) {
    fr(x+6, y+2, 2, 2, '#222');
    fr(x+10, y+2, 2, 2, '#222');
  } else if (dir === 1) {
    fr(x+11, y+2, 2, 2, '#222');
  } else if (dir === 3) {
    fr(x+4, y+2, 2, 2, '#222');
  }
  // Hair
  fr(x+4, y+0, 9, 2, '#443322');
}

// Scout — gold trench coat, detective hat, dark brown hair
function drawLeaderScout(px, py, dir, frame) {
  const x = Math.floor(px), y = Math.floor(py);
  const bob = frame % 2 === 0 ? 0 : 1;
  ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x+8, y+15+bob, 5, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // Boots
  fr(x+4, y+13+bob, 4, 2, '#553300');
  fr(x+9, y+13+bob, 4, 2, '#553300');
  // Legs
  if (dir===1) { fr(x+6, y+9, 3, 5, '#443300'); fr(x+9, y+9+bob, 3, 5, '#443300'); }
  else if (dir===3) { fr(x+5, y+9+bob, 3, 5, '#443300'); fr(x+8, y+9, 3, 5, '#443300'); }
  else { fr(x+5, y+9+bob, 3, 5, '#443300'); fr(x+9, y+9+bob, 3, 5, '#443300'); }
  // Gold trench coat
  fr(x+3, y+4, 11, 7, '#cc9900');
  fr(x+3, y+4,  2, 7, '#aa7700');  // left lapel shadow
  fr(x+12,y+4,  2, 7, '#aa7700');  // right lapel shadow
  fr(x+6, y+4,  5, 3, '#eecc33');  // chest highlight
  // Trench coat flap sides
  if (dir===1) fr(x+13, y+6, 2, 5, '#cc9900');
  if (dir===3) fr(x+2,  y+6, 2, 5, '#cc9900');
  // Head
  fr(x+4, y+0, 9, 6, '#ffcc99');
  // Dark brown hair
  fr(x+4, y+1, 9, 2, '#332211');
  // Detective hat (wide brim + crown)
  fr(x+2, y-2, 13, 2, '#885500');   // brim
  fr(x+5, y-5,  7, 4, '#aa7700');   // crown
  fr(x+4, y-5,  1, 4, '#cc9900');   // band highlight
  // Eyes
  if (dir===2) { fr(x+6, y+2, 2, 2, '#222'); fr(x+10, y+2, 2, 2, '#222'); }
  else if (dir===1) fr(x+11, y+2, 2, 2, '#222');
  else if (dir===3) fr(x+4,  y+2, 2, 2, '#222');
}

// Tabitha — navy nautical jacket, blonde hair, captain's cap
function drawLeaderTabitha(px, py, dir, frame) {
  const x = Math.floor(px), y = Math.floor(py);
  const bob = frame % 2 === 0 ? 0 : 1;
  ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x+8, y+15+bob, 5, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // White boots
  fr(x+4, y+13+bob, 4, 2, '#ddeeff');
  fr(x+9, y+13+bob, 4, 2, '#ddeeff');
  // Navy trousers
  if (dir===1) { fr(x+6, y+9, 3, 5, '#112244'); fr(x+9, y+9+bob, 3, 5, '#112244'); }
  else if (dir===3) { fr(x+5, y+9+bob, 3, 5, '#112244'); fr(x+8, y+9, 3, 5, '#112244'); }
  else { fr(x+5, y+9+bob, 3, 5, '#112244'); fr(x+9, y+9+bob, 3, 5, '#112244'); }
  // Navy nautical jacket
  fr(x+3, y+4, 11, 7, '#1a3a6e');
  fr(x+6, y+4,  5, 2, '#ffffff');  // white shirt collar
  fr(x+5, y+4,  2, 7, '#2255aa');  // left button stripe
  // Gold epaulettes on shoulders
  fr(x+3, y+4, 2, 2, '#ffcc00');
  fr(x+12,y+4, 2, 2, '#ffcc00');
  // Head + blonde hair
  fr(x+4, y+0, 9, 6, '#ffddbb');
  fr(x+3, y+2, 11, 3, '#eebb33');  // blonde side hair
  fr(x+11,y+2,  3, 6, '#ddaa22');  // hair flowing right
  // Captain's cap (navy with white top band)
  fr(x+3, y-2, 11, 2, '#1a3a6e');  // brim
  fr(x+5, y-5,  7, 4, '#1a3a6e');  // cap body
  fr(x+5, y-5,  7, 1, '#ffffff');  // white cap band
  fr(x+7, y-6,  3, 2, '#ffcc00');  // gold anchor badge
  // Eyes (blue)
  if (dir===2) { fr(x+6, y+2, 2, 2, '#2255aa'); fr(x+10, y+2, 2, 2, '#2255aa'); }
  else if (dir===1) fr(x+11, y+2, 2, 2, '#2255aa');
  else if (dir===3) fr(x+4,  y+2, 2, 2, '#2255aa');
}

// Liv — cyan jacket, teal-streaked hair, headset microphone
function drawLeaderLiv(px, py, dir, frame) {
  const x = Math.floor(px), y = Math.floor(py);
  const bob = frame % 2 === 0 ? 0 : 1;
  ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x+8, y+15+bob, 5, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // Sneakers
  fr(x+4, y+13+bob, 4, 2, '#00ddbb');
  fr(x+9, y+13+bob, 4, 2, '#00ddbb');
  // Leggings
  if (dir===1) { fr(x+6, y+9, 3, 5, '#222233'); fr(x+9, y+9+bob, 3, 5, '#222233'); }
  else if (dir===3) { fr(x+5, y+9+bob, 3, 5, '#222233'); fr(x+8, y+9, 3, 5, '#222233'); }
  else { fr(x+5, y+9+bob, 3, 5, '#222233'); fr(x+9, y+9+bob, 3, 5, '#222233'); }
  // Cyan jacket
  fr(x+3, y+4, 11, 7, '#00aacc');
  fr(x+5, y+4,  7, 2, '#00ccee');  // collar highlight
  fr(x+3, y+7,  2, 4, '#009ab8');  // left sleeve shadow
  fr(x+12,y+7,  2, 4, '#009ab8');  // right sleeve shadow
  // Head + black hair with teal streak
  fr(x+4, y+0, 9, 6, '#ffcc99');
  fr(x+3, y+0, 11, 2, '#222222');  // dark hair base
  fr(x+5, y+0,  3, 4, '#00bbaa');  // teal streak front
  fr(x+12,y+0,  2, 5, '#222222');  // hair side
  // Headset arc over top
  fr(x+3, y-1, 11, 1, '#555555');  // headset band
  fr(x+3, y-1,  2, 3, '#444444');  // left ear cup
  fr(x+12,y-1,  2, 3, '#444444');  // right ear cup
  // Mic boom (face-front only)
  if (dir===2) fr(x+12, y+1, 3, 1, '#888888');
  // Eyes (teal)
  if (dir===2) { fr(x+6, y+2, 2, 2, '#00aaaa'); fr(x+10, y+2, 2, 2, '#00aaaa'); }
  else if (dir===1) fr(x+11, y+2, 2, 2, '#00aaaa');
  else if (dir===3) fr(x+4,  y+2, 2, 2, '#00aaaa');
}

// Nimbus — pale flowing robes, white hair, cloud wisp accent
function drawLeaderNimbus(px, py, dir, frame) {
  const x = Math.floor(px), y = Math.floor(py);
  const bob = frame % 2 === 0 ? 0 : 1;
  const drift = Math.floor(frame / 2) % 2;  // gentle float effect
  ctx.globalAlpha = 0.15; ctx.fillStyle = '#aaddff';
  ctx.beginPath(); ctx.ellipse(x+8, y+15+bob, 6, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // Robe hem (wide, flowing)
  fr(x+2, y+12+bob, 13, 3, '#cce8ff');
  fr(x+1, y+11+bob, 15, 2, '#ddf0ff');
  // Robe body
  fr(x+2, y+4, 13, 9, '#e8f4ff');
  fr(x+2, y+4,  2, 9, '#cce0f0');  // left shadow fold
  fr(x+13,y+4,  2, 9, '#cce0f0');  // right shadow fold
  // Inner robe / chest
  fr(x+5, y+4,  7, 5, '#f5f9ff');
  fr(x+6, y+6,  5, 3, '#ddeeff');  // sapphire brooch accent
  fr(x+7, y+7,  3, 2, '#6699cc');  // brooch gem
  // Head (pale complexion)
  fr(x+4, y+0, 9, 6, '#ffeedd');
  // White flowing hair
  fr(x+3, y+0, 11, 2, '#eeeeff');
  fr(x+3, y+2,  2, 6, '#ddddef');  // left hair fall
  fr(x+12,y+2,  2, 7, '#ddddef');  // right hair fall (longer)
  // Cloud wisp floating beside head (animated drift)
  ctx.globalAlpha = 0.7;
  fr(x+13+drift, y-1+drift, 5, 2, '#c8e8ff');
  fr(x+12+drift, y-2+drift, 7, 2, '#e0f0ff');
  ctx.globalAlpha = 1;
  // Eyes (pale silver-blue)
  if (dir===2) { fr(x+6, y+2, 2, 2, '#8899bb'); fr(x+10, y+2, 2, 2, '#8899bb'); }
  else if (dir===1) fr(x+11, y+2, 2, 2, '#8899bb');
  else if (dir===3) fr(x+4,  y+2, 2, 2, '#8899bb');
  // Star/sparkle on brow
  fr(x+8, y+0, 1, 1, '#aaccff');
}

const GYM_LEADER_DRAWERS = {
  scout_searcher: drawLeaderScout,
  tabitha:        drawLeaderTabitha,
  liv_streamport: drawLeaderLiv,
  nimbus:         drawLeaderNimbus,
};

// Draw a starter pedestal
function drawPedestal(px, py, label) {
  // Pillar base
  fr(px+2, py+10, 12, 4, '#446677');
  fr(px+4, py+6,  8,  5, '#557788');
  // Poke-ball style orb on top
  ctx.fillStyle = '#aa3333';
  ctx.beginPath(); ctx.arc(px+8, py+4, 4, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#eeeeee';
  ctx.beginPath(); ctx.arc(px+8, py+4, 4, 0, Math.PI); ctx.fill();
  sr(px+4, py+0, 8, 8, '#fff', 1);
  // Line across middle
  fr(px+4, py+3, 8, 2, '#222');
  // Label
  drawText(label, px+8, py+16, { color: PAL.TEXT, size: 5, align:'center' });
}

// ── Starter Sprites (canvas primitives) ──────────────────────
function drawStarterSprite(idx, cx, cy) {
  if (idx === 0) {
    // Querycub — teal bear cub with magnifying glass
    // Ears
    fr(cx-12, cy-24, 8, 8, '#44aacc');
    fr(cx+4, cy-24, 8, 8, '#44aacc');
    fr(cx-10, cy-23, 5, 5, '#ff9988');
    fr(cx+5, cy-23, 5, 5, '#ff9988');
    // Head
    fr(cx-10, cy-20, 20, 16, '#44aacc');
    // Eyes
    fr(cx-7, cy-16, 3, 3, '#eef');
    fr(cx+4, cy-16, 3, 3, '#eef');
    fr(cx-6, cy-15, 2, 2, '#113');
    fr(cx+5, cy-15, 2, 2, '#113');
    // Nose
    fr(cx-2, cy-11, 4, 3, '#1a3344');
    // Body
    fr(cx-11, cy-5, 22, 18, '#3399aa');
    // Magnifying glass
    ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx+10, cy+2, 6, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+15, cy+7); ctx.lineTo(cx+19, cy+11); ctx.stroke();
    ctx.lineWidth = 1;
    // Paws
    fr(cx-16, cy+4, 7, 5, '#3399aa');
    fr(cx+9, cy+4, 7, 5, '#3399aa');
    // Feet
    fr(cx-9, cy+11, 8, 5, '#3399aa');
    fr(cx+1, cy+11, 8, 5, '#3399aa');
  } else if (idx === 1) {
    // Puffbit — fluffy cloud creature
    const cl = '#c0e8f8', cd = '#7aafc8';
    ctx.fillStyle = cl;
    ctx.beginPath(); ctx.arc(cx,    cy-10, 14, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx-14, cy-4,  10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+14, cy-4,  10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx-7,  cy+6,  11, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+7,  cy+6,  11, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx,    cy+10, 12, 0, Math.PI*2); ctx.fill();
    // Highlight sheen
    ctx.fillStyle = '#e8f8ff';
    ctx.beginPath(); ctx.arc(cx-4, cy-14, 5, 0, Math.PI*2); ctx.fill();
    // Eyes
    fr(cx-6, cy-13, 3, 4, '#2255aa');
    fr(cx+3, cy-13, 3, 4, '#2255aa');
    // Smile
    ctx.strokeStyle = '#2255aa'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy-7, 5, 0.2, Math.PI-0.2); ctx.stroke();
    ctx.lineWidth = 1;
    // Rosy cheeks
    ctx.fillStyle = '#ffaabb88';
    ctx.beginPath(); ctx.arc(cx-10, cy-8, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+10, cy-8, 4, 0, Math.PI*2); ctx.fill();
    // Little foot nubs
    ctx.fillStyle = cl;
    ctx.beginPath(); ctx.arc(cx-7, cy+18, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+7, cy+18, 5, 0, Math.PI*2); ctx.fill();
  } else {
    // Thinklet — angular neural AI creature
    const tc = '#8855cc', tl = '#cc99ff';
    // Core body
    fr(cx-8, cy-10, 16, 20, tc);
    // Top triangle cap
    ctx.fillStyle = tc;
    ctx.beginPath();
    ctx.moveTo(cx, cy-22); ctx.lineTo(cx-8, cy-10); ctx.lineTo(cx+8, cy-10);
    ctx.fill();
    // Bottom triangle
    ctx.beginPath();
    ctx.moveTo(cx, cy+18); ctx.lineTo(cx-8, cy+10); ctx.lineTo(cx+8, cy+10);
    ctx.fill();
    // Neural arm lines
    ctx.strokeStyle = tl; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx-8, cy-4); ctx.lineTo(cx-20, cy-8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+8, cy-4); ctx.lineTo(cx+20, cy-8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-8, cy+4); ctx.lineTo(cx-20, cy+8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+8, cy+4); ctx.lineTo(cx+20, cy+8); ctx.stroke();
    ctx.lineWidth = 1;
    // Node dots
    ctx.fillStyle = tl;
    ctx.beginPath(); ctx.arc(cx-22, cy-10, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+22, cy-10, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx-22, cy+10, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+22, cy+10, 3, 0, Math.PI*2); ctx.fill();
    // Glowing eyes
    fr(cx-6, cy-7, 4, 4, '#ffffff');
    fr(cx+2, cy-7, 4, 4, '#ffffff');
    fr(cx-5, cy-6, 2, 2, tc);
    fr(cx+3, cy-6, 2, 2, tc);
    // Central spark
    ctx.fillStyle = '#ffff88';
    ctx.beginPath(); ctx.arc(cx, cy+3, 3, 0, Math.PI*2); ctx.fill();
  }
}

// npcDialogue shape: { lines:[], lineIdx:0, revealed:0, timer:0, doneWait:0 }
function drawDialogueBox(dlg) {
  const bx = 4, by = UI_Y - 76, bw = W - 8, bh = 76;
  ctx.fillStyle = 'rgba(2,8,20,0.92)';
  ctx.fillRect(bx, by, bw, bh);
  drawPanel(bx, by, bw, bh, { bg: 'rgba(5,12,26,0.95)', outer: PAL.ACCENT, inner: PAL.BORDER });

  const line = dlg.lines[dlg.lineIdx] || '';
  const text = line.slice(0, dlg.revealed);
  drawTextWrapped(text, bx + 12, by + 14, bw - 24, { color: '#c8e8ff', size: 14, shadow: true, lineHeight: 18 });

  const fullyRevealed = dlg.revealed >= line.length;
  const readyToAdvance = fullyRevealed && (dlg.doneWait || 0) >= 10;
  if (fullyRevealed) {
    const bl = (G_TICK % 30) < 20;
    if (bl) {
      if (dlg.lineIdx < dlg.lines.length - 1) {
        drawText('▼', bx + bw - 16, by + 52, { color: PAL.ACCENT, size: 10 });
      } else {
        drawText('[ Enter ]', bx + 12, by + 56, { color: PAL.GOLD, size: 10 });
      }
    }
  }
  drawText(`${dlg.lineIdx + 1}/${dlg.lines.length}`, bx + bw - 12, by + 60,
    { color: PAL.TEXT_DIM, size: 7, align: 'right' });
}

// ── Sprite filename builder: ###_Name.png ─────────────────────
function getSpriteFilename(name) {
  const idx = DEX_LIST.indexOf(name);
  if (idx < 0) return null;
  return String(idx + 1).padStart(3, '0') + '_' + name + '.png';
}

// One file per species; cache it under both front and back keys
function tryLoadBattleSprites(name) {
  const file = getSpriteFilename(name);
  if (!file) return;
  loadSprite(`${name}_front`, file);
  loadSprite(`${name}_back`,  file);
}

// Preload every known species' sprites at boot
function preloadAllSprites() {
  DEX_LIST.forEach(name => { if (name) tryLoadBattleSprites(name); });
}

// ── Draw sprite or fall back to canvas primitive ──────────────
function drawBattleSprite(name, cx, cy, side, size) {
  const key = `${name}_${side}`;
  const img = getSprite(key);
  if (img) {
    ctx.imageSmoothingEnabled = false;
    if (side === 'back') {
      // Flip horizontally so the player's mon faces away from the camera
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -size/2, -size/2, size, size);
      ctx.restore();
    } else {
      ctx.drawImage(img, cx - size/2, cy - size/2, size, size);
    }
    return;
  }
  // Fallback: generic silhouette
  ctx.fillStyle = TYPE_COL[(SPECIES[name] && SPECIES[name].type1) || 'Search'] + 'aa';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff55';
  ctx.beginPath();
  ctx.arc(cx - size*0.08, cy - size*0.1, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
  drawText(name.slice(0, 8), cx, cy + size*0.35, { color: PAL.TEXT, size: 7, align: 'center', shadow: true });
}

// ── Speaker mute icon (game loop overlay) ────────────────────
function drawSpeakerIcon() {
  const x = W - 16, y = 5, muted = Sound.isMuted();
  ctx.globalAlpha = 0.85;
  fr(x - 2, y - 2, 16, 12, '#05080f');
  ctx.fillStyle = muted ? PAL.TEXT_DIM : PAL.ACCENT;
  // speaker body
  ctx.fillRect(x, y + 2, 3, 4);
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 2); ctx.lineTo(x + 7, y - 1); ctx.lineTo(x + 7, y + 9); ctx.lineTo(x + 3, y + 6);
  ctx.closePath(); ctx.fill();
  if (muted) {
    // diagonal mute slash
    ctx.strokeStyle = PAL.TEXT_RED; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + 9, y - 1); ctx.lineTo(x + 13, y + 9); ctx.stroke();
  } else {
    // sound waves
    ctx.strokeStyle = PAL.ACCENT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x + 6, y + 4, 5, -0.5, 0.5); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ── Gym leaders 5-7 ──────────────────────────────────────────

// Cipher — dark security uniform, visor, angular crop
function drawLeaderCipher(px, py, dir, frame) {
  const x = Math.floor(px), y = Math.floor(py);
  const bob = frame % 2 === 0 ? 0 : 1;
  ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x+8, y+15+bob, 5, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  fr(x+4, y+13+bob, 4, 2, '#220033');
  fr(x+9, y+13+bob, 4, 2, '#220033');
  if (dir===1) { fr(x+6, y+9, 3, 5, '#220033'); fr(x+9, y+9+bob, 3, 5, '#220033'); }
  else if (dir===3) { fr(x+5, y+9+bob, 3, 5, '#220033'); fr(x+8, y+9, 3, 5, '#220033'); }
  else { fr(x+5, y+9+bob, 3, 5, '#220033'); fr(x+9, y+9+bob, 3, 5, '#220033'); }
  // Dark security jacket + purple trim
  fr(x+3, y+4, 11, 7, '#1a0033');
  fr(x+3, y+4,  2, 7, '#550088');
  fr(x+12,y+4,  2, 7, '#550088');
  fr(x+6, y+4,  5, 2, '#330055');
  // Head
  fr(x+4, y+0, 9, 6, '#ccbbdd');
  fr(x+4, y+0, 9, 2, '#110022');  // dark hair
  // Visor / eyewear
  fr(x+3, y+2, 11, 3, '#330066');
  fr(x+3, y+2, 11, 1, '#9944ff');
  if (dir===2) { fr(x+4, y+2, 4, 2, '#cc44ff'); fr(x+8, y+2, 4, 2, '#cc44ff'); }
  else if (dir===1) fr(x+10, y+2, 3, 2, '#cc44ff');
  else if (dir===3) fr(x+4,  y+2, 3, 2, '#cc44ff');
}

// Player One — neon hoodie, stylized hair, gaming gloves
function drawLeaderPlayerOne(px, py, dir, frame) {
  const x = Math.floor(px), y = Math.floor(py);
  const bob = frame % 2 === 0 ? 0 : 1;
  ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x+8, y+15+bob, 5, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  fr(x+4, y+13+bob, 4, 2, '#ee6600');
  fr(x+9, y+13+bob, 4, 2, '#ee6600');
  if (dir===1) { fr(x+6, y+9, 3, 5, '#222222'); fr(x+9, y+9+bob, 3, 5, '#222222'); }
  else if (dir===3) { fr(x+5, y+9+bob, 3, 5, '#222222'); fr(x+8, y+9, 3, 5, '#222222'); }
  else { fr(x+5, y+9+bob, 3, 5, '#222222'); fr(x+9, y+9+bob, 3, 5, '#222222'); }
  // Neon orange hoodie
  fr(x+3, y+4, 11, 7, '#cc4400');
  fr(x+5, y+9, 7, 3, '#ff6622');  // hoodie pocket
  fr(x+6, y+4, 5, 2, '#ff8833');  // collar
  // Gaming gloves on side-facing
  if (dir===1) fr(x+13, y+6, 2, 4, '#ff6600');
  if (dir===3) fr(x+2,  y+6, 2, 4, '#ff6600');
  // Head
  fr(x+4, y+0, 9, 6, '#ffddaa');
  // Wild styled hair — dark with neon highlights
  fr(x+3, y+0, 11, 2, '#111111');
  fr(x+4, y-2, 3, 3, '#111111');  // spiky top
  fr(x+9, y-2, 2, 2, '#ff6600');  // neon spike tip
  fr(x+12,y+0,  2, 4, '#333333');
  // Eyes (gold, intense)
  if (dir===2) { fr(x+5, y+2, 3, 2, '#ffaa00'); fr(x+9, y+2, 3, 2, '#ffaa00'); }
  else if (dir===1) fr(x+11, y+2, 2, 2, '#ffaa00');
  else if (dir===3) fr(x+4,  y+2, 2, 2, '#ffaa00');
}

// Dr. Prompt — white lab coat, silver hair, tablet/hologram
function drawLeaderDrPrompt(px, py, dir, frame) {
  const x = Math.floor(px), y = Math.floor(py);
  const bob = frame % 2 === 0 ? 0 : 1;
  const pulse = Math.floor(frame / 3) % 2;
  ctx.globalAlpha = 0.2; ctx.fillStyle = '#88aaff';
  ctx.beginPath(); ctx.ellipse(x+8, y+15+bob, 6, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  fr(x+4, y+13+bob, 4, 2, '#aabbcc');
  fr(x+9, y+13+bob, 4, 2, '#aabbcc');
  if (dir===1) { fr(x+6, y+9, 3, 5, '#334455'); fr(x+9, y+9+bob, 3, 5, '#334455'); }
  else if (dir===3) { fr(x+5, y+9+bob, 3, 5, '#334455'); fr(x+8, y+9, 3, 5, '#334455'); }
  else { fr(x+5, y+9+bob, 3, 5, '#334455'); fr(x+9, y+9+bob, 3, 5, '#334455'); }
  // White lab coat
  fr(x+3, y+4, 11, 7, '#ddeeff');
  fr(x+5, y+4,  7, 2, '#aabbcc');  // coat lapels
  fr(x+3, y+4,  2, 7, '#c0d8ee');
  fr(x+12,y+4,  2, 7, '#c0d8ee');
  // Hologram tablet (side visible)
  if (dir===1) { ctx.globalAlpha=0.8; fr(x+13,y+5,3,5,pulse?'#4488ff':'#2255cc'); ctx.globalAlpha=1; }
  if (dir===3) { ctx.globalAlpha=0.8; fr(x+1, y+5,3,5,pulse?'#4488ff':'#2255cc'); ctx.globalAlpha=1; }
  // Head (fair skin, glasses)
  fr(x+4, y+0, 9, 6, '#ffeedd');
  fr(x+3, y+0, 11, 2, '#ccccdd');  // silver hair
  fr(x+3, y+1,  2, 4, '#bbbbcc');
  fr(x+12,y+1,  2, 5, '#bbbbcc');
  // Glasses
  if (dir===2) { sr(x+5, y+2, 4, 3, '#88aacc', 1); sr(x+9, y+2, 4, 3, '#88aacc', 1); fr(x+9,y+3,1,1,'#88aacc'); }
  else if (dir===1) { sr(x+10, y+2, 4, 3, '#88aacc', 1); }
  else if (dir===3) { sr(x+3,  y+2, 4, 3, '#88aacc', 1); }
  // Eyes (blue, sharp)
  if (dir===2) { fr(x+6, y+3, 2, 1, '#4488cc'); fr(x+10, y+3, 2, 1, '#4488cc'); }
  else if (dir===1) fr(x+12, y+3, 2, 1, '#4488cc');
  else if (dir===3) fr(x+4,  y+3, 2, 1, '#4488cc');
}

GYM_LEADER_DRAWERS.cipher_ff   = drawLeaderCipher;
GYM_LEADER_DRAWERS.player_one  = drawLeaderPlayerOne;
GYM_LEADER_DRAWERS.dr_prompt   = drawLeaderDrPrompt;

// ── Nexus Gym Leader sprite ───────────────────────────────────
function drawLeaderNexus(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  const bob=frame%2===0?0:1;
  const pulse=Math.floor(frame/2)%3;
  ctx.globalAlpha=0.2; ctx.fillStyle='#00ffcc';
  ctx.beginPath(); ctx.ellipse(x+8,y+15+bob,6,2,0,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;
  // Legs
  fr(x+4,y+13+bob,4,2,'#112233'); fr(x+9,y+13+bob,4,2,'#112233');
  if(dir===1){fr(x+6,y+9,3,5,'#001a22');fr(x+9,y+9+bob,3,5,'#001a22');}
  else if(dir===3){fr(x+5,y+9+bob,3,5,'#001a22');fr(x+8,y+9,3,5,'#001a22');}
  else{fr(x+5,y+9+bob,3,5,'#001a22');fr(x+9,y+9+bob,3,5,'#001a22');}
  // Nexus suit — dark teal with glowing circuit trim
  fr(x+3,y+4,11,7,'#001a1a');
  fr(x+3,y+4,2,7,pulse===0?'#00ffcc':'#00aabb');
  fr(x+12,y+4,2,7,pulse===1?'#00ffcc':'#00aabb');
  fr(x+5,y+4,7,1,pulse===2?'#00ffcc':'#004455');
  // Arms with data-stream bands
  if(dir===1){ctx.globalAlpha=0.8;fr(x+13,y+5,2,5,pulse===0?'#00ffcc':'#003344');ctx.globalAlpha=1;}
  if(dir===3){ctx.globalAlpha=0.8;fr(x+2,y+5,2,5,pulse===1?'#00ffcc':'#003344');ctx.globalAlpha=1;}
  // Head
  fr(x+4,y+0,9,6,'#cceedd');
  fr(x+3,y+0,11,2,'#001a1a');
  fr(x+3,y+1,2,4,'#002233');
  fr(x+12,y+1,2,5,'#002233');
  // Eyes — glowing circuit teal
  if(dir===2){fr(x+5,y+2,3,2,pulse===2?'#00ffcc':'#00aacc');fr(x+9,y+2,3,2,pulse===0?'#00ffcc':'#00aacc');}
  else if(dir===1)fr(x+11,y+2,2,2,'#00ffcc');
  else if(dir===3)fr(x+4,y+2,2,2,'#00ffcc');
}
GYM_LEADER_DRAWERS.nexus = drawLeaderNexus;

// ============================================================
// PUZZLE OBJECT SPRITES — gates, terminals, consoles, boards
// ============================================================

function drawObjectGate(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  const pulse=Math.floor(frame/10)%2;
  fr(x+0, y+2, 3, 12, '#552200'); fr(x+13, y+2, 3, 12, '#552200');
  fr(x+0, y+6, 16, 4, '#cc4400'); fr(x+2, y+7, 12, 2, '#ff6622');
  for(let i=0;i<6;i++){if(i%2===0)fr(x+2+i*2,y+7,2,2,'#ffaa00');}
  fr(x+1, y+4, 2, 2, pulse?'#ff4400':'#882200');
  fr(x+13,y+4, 2, 2, pulse?'#ff4400':'#882200');
}

function drawObjectScheduleBoard(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  fr(x+6, y+12, 4, 4, '#441155');
  fr(x+1, y+0, 14, 12, '#1a0028'); sr(x+1, y+0, 14, 12, '#cc44ff', 1);
  fr(x+2, y+1, 12, 10, '#0d0020');
  fr(x+3, y+2, 8, 1, '#cc44ff'); fr(x+3, y+2, 4, 1, '#ee88ff');
  fr(x+3, y+4, 11, 1, '#664488'); fr(x+3, y+6, 10, 1, '#664488');
  fr(x+3, y+8, 9, 1, '#664488');
  drawText('SCHED', x+8, y+14, {color:'#cc44ff', size:5, align:'center'});
}

function drawObjectBookingTerminal(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  fr(x+4, y+12, 8, 4, '#330044'); fr(x+5, y+10, 6, 2, '#440055');
  fr(x+2, y+0, 12, 10, '#1a0028'); sr(x+2, y+0, 12, 10, '#cc44ff', 2);
  fr(x+3, y+1, 10, 8, '#080014');
  fr(x+4, y+2, 8, 1, '#cc44ff');
  fr(x+4, y+4, 7, 1, '#664488'); fr(x+4, y+6, 6, 1, '#664488');
  const blink=(frame%30)<20; if(blink)fr(x+4,y+7,2,1,'#ffcc00');
  drawText('BOOK', x+8, y+14, {color:'#cc44ff', size:5, align:'center'});
}

function drawObjectRoutingNode(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  const pulse=Math.floor(frame/8)%3;
  fr(x+5, y+12, 6, 4, '#112244');
  fr(x+2, y+3, 12, 10, '#001133'); sr(x+2, y+3, 12, 10, '#4488ff', 1);
  ctx.fillStyle=pulse===0?'#2266cc':'#1a4488';
  ctx.beginPath(); ctx.arc(x+8,y+8,4,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#88ccff'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x+8,y+8,4,0,Math.PI*2); ctx.stroke();
  fr(x+0, y+7, 3, 2, '#224488'); fr(x+13, y+7, 3, 2, '#224488');
  fr(x+7, y+1, 2, 2, pulse===2?'#4488ff':'#112244');
  drawText('NODE', x+8, y+14, {color:'#4488ff', size:5, align:'center'});
}

function drawObjectFileScanner(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  fr(x+3, y+7, 10, 8, '#1a0028'); sr(x+3, y+7, 10, 8, '#cc66ff', 1);
  fr(x+4, y+8, 8, 6, '#080010');
  const scanY=y+8+Math.floor(frame/4)%6; fr(x+4,scanY,8,1,'rgba(180,80,255,0.6)');
  fr(x+5, y+1, 6, 6, '#ffffff'); fr(x+8, y+1, 3, 3, '#aaaaaa');
  fr(x+6, y+3, 4, 1, '#555566'); fr(x+6, y+4, 4, 1, '#555566');
  drawText('SCAN', x+8, y+14, {color:'#cc66ff', size:5, align:'center'});
}

function drawObjectPatternTerminal(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  fr(x+5, y+12, 6, 4, '#001122');
  fr(x+1, y+1, 14, 11, '#000c1c'); sr(x+1, y+1, 14, 11, '#2288cc', 1);
  fr(x+2, y+2, 12, 9, '#000810');
  const cols=['#44aaff','#88ccff','#44aaff','#88ccff'];
  cols.forEach((c,i)=>{ fr(x+3+i*3,y+4,2,2,c); fr(x+3+i*3,y+7,1,1,c); });
  fr(x+13,y+5,2,2,'#ffcc00');
  drawText('TERM', x+8, y+14, {color:'#2288cc', size:5, align:'center'});
}

function drawObjectMasterConsole(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  const idx=Math.floor(frame/8)%8;
  fr(x+1, y+1, 14, 13, '#001122'); sr(x+1, y+1, 14, 13, '#00ccff', 2);
  fr(x+2, y+2, 12, 10, '#000a14');
  for(let r=0;r<2;r++) for(let c=0;c<4;c++){
    fr(x+3+c*3,y+3+r*3,2,2,(r*4+c)<=idx?'#00ffcc':'#112233');
  }
  drawText('NEXUS', x+8, y+14, {color:'#00ccff', size:5, align:'center'});
}

function makeDrawLoreTerminal(color) {
  return function(px, py, dir, frame) {
    const x=Math.floor(px), y=Math.floor(py);
    fr(x+5, y+12, 6, 4, '#111122');
    fr(x+2, y+1, 12, 11, '#050510'); sr(x+2, y+1, 12, 11, color, 1);
    fr(x+3, y+2, 10, 9, '#030308');
    fr(x+4, y+3, 8, 1, color);
    fr(x+4, y+5, 7, 1, '#334455'); fr(x+4, y+7, 6, 1, '#334455'); fr(x+4, y+9, 5, 1, '#334455');
    drawText('ECHO', x+8, y+14, {color:color, size:5, align:'center'});
  };
}

// Register all puzzle object sprites
GYM_LEADER_DRAWERS.gym3_gate      = drawObjectGate;
GYM_LEADER_DRAWERS.gym3_schedule  = drawObjectScheduleBoard;
GYM_LEADER_DRAWERS.gym3_booking   = drawObjectBookingTerminal;
GYM_LEADER_DRAWERS.gym4_gate_1    = drawObjectGate;
GYM_LEADER_DRAWERS.gym4_gate_2    = drawObjectGate;
GYM_LEADER_DRAWERS.gym4_router_a  = drawObjectRoutingNode;
GYM_LEADER_DRAWERS.gym4_router_b  = drawObjectRoutingNode;
GYM_LEADER_DRAWERS.gym5_gate      = drawObjectGate;
GYM_LEADER_DRAWERS.gym5_scanner   = drawObjectFileScanner;
GYM_LEADER_DRAWERS.gym7_gate      = drawObjectGate;
GYM_LEADER_DRAWERS.gym7_terminal  = drawObjectPatternTerminal;
GYM_LEADER_DRAWERS.gym8_gate      = drawObjectGate;
GYM_LEADER_DRAWERS.gym8_console   = drawObjectMasterConsole;
GYM_LEADER_DRAWERS.gym8_lore_1    = makeDrawLoreTerminal('#00aa33');
GYM_LEADER_DRAWERS.gym8_lore_2    = makeDrawLoreTerminal('#00ccff');
GYM_LEADER_DRAWERS.gym8_lore_3    = makeDrawLoreTerminal('#cc44ff');
GYM_LEADER_DRAWERS.gym8_lore_4    = makeDrawLoreTerminal('#4488ff');
GYM_LEADER_DRAWERS.gym8_lore_5    = makeDrawLoreTerminal('#ff4466');
GYM_LEADER_DRAWERS.gym8_lore_6    = makeDrawLoreTerminal('#ff6622');
GYM_LEADER_DRAWERS.gym8_lore_7    = makeDrawLoreTerminal('#88aaff');

// Item ball sprite — red/white pokéball-style, used for collectible item NPCs
function drawItemBall(px, py, dir, frame) {
  const cx = px + 8, cy = py + 10;
  // White bottom half
  ctx.fillStyle = '#eeeeee';
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI); ctx.fill();
  // Red top half
  ctx.fillStyle = '#cc2222';
  ctx.beginPath(); ctx.arc(cx, cy, 5, Math.PI, 0); ctx.fill();
  // Black seam
  ctx.fillStyle = '#222222';
  ctx.fillRect(cx - 5, cy - 1, 10, 2);
  // Center button (white ring + inner dot)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#cc2222';
  ctx.beginPath(); ctx.arc(cx, cy, 1, 0, Math.PI * 2); ctx.fill();
  // Sparkle highlights
  ctx.fillStyle = '#ffeeaacc';
  ctx.fillRect(cx + 2, cy - 6, 1, 1);
  ctx.fillRect(cx + 3, cy - 4, 1, 1);
}
GYM_LEADER_DRAWERS.r1_item_ball = drawItemBall;

// ── E4 Leader sprite draw functions ───────────────────────────
function drawLeaderCache(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  const b=frame%2===0?0:1;
  // Amber robes
  fr(x+3,y+4,10,9,'#885500'); fr(x+4,y+4,8,2,'#cc9933');
  fr(x+2,y+9,12,3,'#663300');
  // Legs
  fr(x+4,y+12+b,4,3,'#442200'); fr(x+8,y+12+b,4,3,'#442200');
  // Arms holding books
  fr(x+1,y+6,3,6,'#885500'); fr(x+12,y+6,3,6,'#885500');
  fr(x+0,y+7,3,4,'#ffffcc'); fr(x+11,y+7,3,4,'#ffffcc');
  // Head
  fr(x+4,y+0,8,5,'#ddbb88'); fr(x+3,y+0,10,2,'#7a5500');
  // Glasses and eyes
  if(dir===2){ fr(x+5,y+2,2,2,'#336699'); fr(x+9,y+2,2,2,'#336699'); fr(x+7,y+3,2,1,'#553300'); }
  else if(dir===1){ fr(x+10,y+2,2,2,'#336699'); }
  else if(dir===3){ fr(x+4,y+2,2,2,'#336699'); }
  else { fr(x+4,y+2,8,1,'#885500'); }
}
GYM_LEADER_DRAWERS.cache_e4 = drawLeaderCache;

function drawLeaderFirewall(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  const b=frame%2===0?0:1;
  const p=Math.floor(frame/2)%4;
  // Heavy armor body
  fr(x+2,y+4,12,9,'#445566'); fr(x+3,y+4,10,2,'#cc3300');
  fr(x+2,y+4,2,9,'#667788'); fr(x+12,y+4,2,9,'#667788');
  // Chest emblem
  fr(x+6,y+6,4,4,p<2?'#ff4400':'#cc2200');
  // Shield arm
  if(dir===3||dir===2){ fr(x+0,y+5,2,7,'#cc3300'); fr(x+0,y+5,2,2,'#ff6600'); }
  if(dir===1||dir===2){ fr(x+14,y+5,2,7,'#889baa'); fr(x+14,y+5,2,2,'#bbccdd'); }
  // Boots
  fr(x+4,y+12+b,4,4,'#223344'); fr(x+8,y+12+b,4,4,'#223344');
  // Helmet
  fr(x+3,y+0,10,6,'#445566'); fr(x+3,y+0,10,2,'#667788');
  // Visor
  if(dir===2){ fr(x+4,y+2,8,3,'#ff4400'); }
  else if(dir===1){ fr(x+9,y+2,5,3,'#ff4400'); }
  else if(dir===3){ fr(x+3,y+2,5,3,'#ff4400'); }
  else { fr(x+4,y+1,8,2,'#444444'); }
}
GYM_LEADER_DRAWERS.firewall_e4 = drawLeaderFirewall;

function drawLeaderVector(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  const b=frame%2===0?0:1;
  // Industrial jumpsuit
  fr(x+3,y+4,10,9,'#334455'); fr(x+3,y+4,10,2,'#ffcc00');
  // Cable harness
  fr(x+5,y+5,2,8,'#ffcc00'); fr(x+9,y+5,2,8,'#ffcc00');
  // Tool belt
  fr(x+2,y+10,12,2,'#221a00');
  fr(x+3,y+10,2,2,'#ffaa00'); fr(x+7,y+10,2,2,'#ff6600'); fr(x+10,y+10,2,2,'#ffaa00');
  // Boots
  fr(x+4,y+12+b,4,4,'#223344'); fr(x+8,y+12+b,4,4,'#223344');
  // Head + hard hat
  fr(x+4,y+0,8,5,'#ccaa88'); fr(x+3,y+0,10,3,'#ffcc00');
  // Goggles
  if(dir===2){ fr(x+4,y+2,4,2,'#00ccff'); fr(x+8,y+2,4,2,'#00ccff'); }
  else if(dir===1){ fr(x+9,y+2,4,2,'#00ccff'); }
  else if(dir===3){ fr(x+3,y+2,4,2,'#00ccff'); }
  else { fr(x+4,y+1,8,2,'#224400'); }
}
GYM_LEADER_DRAWERS.vector_e4 = drawLeaderVector;

function drawLeaderOracle(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  const b=frame%2===0?0:1;
  const p=Math.floor(frame/2)%3;
  // Ethereal aura
  ctx.globalAlpha=0.18+p*0.04; ctx.fillStyle='#8833cc';
  ctx.beginPath(); ctx.ellipse(x+8,y+8,10,12,0,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;
  // Flowing robe
  fr(x+3,y+5,10,10,'#220044'); fr(x+4,y+5,8,2,'#cc44ff');
  fr(x+2,y+6,2,8,p===0?'#9933cc':'#550099');
  fr(x+12,y+6,2,8,p===1?'#cc44ff':'#770099');
  // Legs fade into robe
  fr(x+5,y+13+b,3,3,'#110022'); fr(x+8,y+13+b,3,3,'#110022');
  // Head
  fr(x+4,y+0,8,6,'#ccaaee'); fr(x+3,y+0,10,2,'#220044');
  // Large glowing eyes
  if(dir===2){
    fr(x+4,y+2,4,3,p===2?'#cc44ff':'#8833cc');
    fr(x+9,y+2,3,3,p===0?'#cc44ff':'#8833cc');
  } else if(dir===1){ fr(x+10,y+2,3,3,'#cc44ff'); }
  else if(dir===3){ fr(x+3,y+2,3,3,'#cc44ff'); }
  else { fr(x+4,y+2,8,2,'#440066'); }
}
GYM_LEADER_DRAWERS.oracle_e4 = drawLeaderOracle;

function drawLeaderProfSearch(px, py, dir, frame) {
  const x=Math.floor(px), y=Math.floor(py);
  const b=frame%2===0?0:1;
  const p=Math.floor(frame/2)%3;
  // Labcoat over champion undershirt
  fr(x+3,y+4,10,10,'#eeeeff'); fr(x+3,y+4,2,10,'#ddddf0'); fr(x+11,y+4,2,10,'#ddddf0');
  fr(x+5,y+4,6,2,'#ffcc44');   // champion collar flash
  // Arms
  if(dir===1){fr(x+13,y+5,2,6,'#eeeeff');}
  if(dir===3){fr(x+1,y+5,2,6,'#eeeeff');}
  // Hands
  if(dir===1){fr(x+13,y+9,2,2,'#ccaa88');}
  if(dir===3){fr(x+2,y+9,2,2,'#ccaa88');}
  // Slacks
  fr(x+4,y+13+b,3,2,'#334455'); fr(x+8,y+13+b,3,2,'#334455');
  // Shoes
  fr(x+3,y+14+b,4,2,'#221133'); fr(x+8,y+14+b,4,2,'#221133');
  // Head — older, distinguished
  fr(x+4,y+0,8,6,'#ccaa88');
  // Silver-white hair
  fr(x+3,y+0,10,2,'#e8e8f8');
  fr(x+3,y+1,2,3,'#ddddef'); fr(x+11,y+1,2,3,'#ddddef');
  // Glasses
  if(dir===2){
    fr(x+4,y+2,3,2,'#335577'); fr(x+8,y+2,3,2,'#335577');
    fr(x+7,y+3,1,1,'#223344');  // bridge
  } else if(dir===1){ fr(x+9,y+2,3,2,'#335577'); }
  else if(dir===3){ fr(x+3,y+2,3,2,'#335577'); }
  else { fr(x+4,y+1,8,2,'#221122'); }
  // Champion badge glint on lapel
  ctx.globalAlpha=0.5+p*0.17;
  fr(x+5,y+5,2,2,'#ffdd44');
  ctx.globalAlpha=1;
}
GYM_LEADER_DRAWERS.prof_search_champion = drawLeaderProfSearch;
