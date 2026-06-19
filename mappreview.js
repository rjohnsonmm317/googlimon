#!/usr/bin/env node
// Map preview generator for Googlimon index.html — pure Node.js (no npm)
'use strict';
const fs   = require('fs');
const zlib = require('zlib');
const path = require('path');

// ── PNG writer ────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, crcVal]);
}
function writePNG(filename, pixels, w, h) {
  // pixels: flat Uint8Array of RGBA (w * h * 4)
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8]=8; ihdr[9]=6; // RGBA
  // Filtered scanlines
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y*(1+w*4)] = 0; // filter none
    for (let x = 0; x < w; x++) {
      const s = (y*w+x)*4, d = y*(1+w*4)+1+x*4;
      raw[d]=pixels[s]; raw[d+1]=pixels[s+1]; raw[d+2]=pixels[s+2]; raw[d+3]=pixels[s+3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 6 });
  fs.writeFileSync(filename, Buffer.concat([sig, pngChunk('IHDR',ihdr), pngChunk('IDAT',idat), pngChunk('IEND',Buffer.alloc(0))]));
}

// ── Pixel font (digits 0-9, colon, space — 4×7 bitmaps) ─────────────────────
const GLYPHS = {
  '0':['0110','1001','1001','1001','1001','1001','0110'],
  '1':['0010','0110','0010','0010','0010','0010','0111'],
  '2':['0110','1001','0001','0010','0100','1000','1111'],
  '3':['0110','1001','0001','0110','0001','1001','0110'],
  '4':['0001','0101','1001','1001','1111','0001','0001'],
  '5':['1111','1000','1000','1110','0001','0001','1110'],
  '6':['0110','1000','1000','1110','1001','1001','0110'],
  '7':['1111','0001','0010','0010','0100','0100','0100'],
  '8':['0110','1001','1001','0110','1001','1001','0110'],
  '9':['0110','1001','1001','0111','0001','0001','0110'],
  ' ':['0000','0000','0000','0000','0000','0000','0000'],
  '-':['0000','0000','0000','1111','0000','0000','0000'],
};
function drawText(px, x, y, text, w, r, g, b) {
  for (const ch of String(text)) {
    const glyph = GLYPHS[ch] || GLYPHS[' '];
    for (let gy = 0; gy < glyph.length; gy++) {
      for (let gx = 0; gx < glyph[gy].length; gx++) {
        if (glyph[gy][gx] === '1') {
          const idx = ((y+gy)*w + (x+gx))*4;
          if (idx >= 0 && idx+3 < px.length) { px[idx]=r; px[idx+1]=g; px[idx+2]=b; px[idx+3]=255; }
        }
      }
    }
    x += 5;
  }
}

// ── Tile palette ─────────────────────────────────────────────────────────────
const PAL = {
  '.': [200,215,160,255],  // PATH        sage-white
  'g': [110,175,70,255],   // GRASS       mid green
  'G': [35,105,20,255],    // TALL GRASS  deep green
  'T': [75,55,35,255],     // TREE        dark brown
  'W': [90,80,80,255],     // WALL
  'B': [90,80,80,255],
  'D': [160,115,65,255],   // DOOR        tan
  'f': [235,210,70,255],   // FLOWER      yellow
  '~': [45,90,195,255],    // WATER       blue
  'P': [200,95,225,255],   // PORTAL      purple
  '>': [255,210,30,255],   // LEDGE_E     gold
  'C': [145,125,105,255],  // COUNTER
};
const PAL_DEFAULT = [120,120,120,255];
const BG = [22,22,28,255];
const GRID_LINE = [0,0,0,128];

const LEGEND = [
  ['.', 'PATH'],
  ['g', 'GRASS'],
  ['G', 'TALL GRASS'],
  ['T', 'TREE/WALL'],
  ['~', 'WATER'],
  ['>', 'LEDGE_E'],
  ['f', 'FLOWER'],
  ['D', 'DOOR'],
];

// ── Main ─────────────────────────────────────────────────────────────────────
function parseMapRows(html, mapName) {
  // Grab everything from MAPS.mapName = { ... tiles: [ ... ],
  const startRe = new RegExp(`MAPS\\.${mapName}\\s*=\\s*\\{`);
  const start = html.search(startRe);
  if (start < 0) return null;
  const tilesRe = /tiles\s*:\s*\[/g;
  tilesRe.lastIndex = start;
  const tStart = tilesRe.exec(html);
  if (!tStart) return null;
  let depth = 1, i = tStart.index + tStart[0].length;
  while (i < html.length && depth > 0) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') depth--;
    i++;
  }
  const section = html.slice(tStart.index, i);
  const rows = [];
  const re = /mkRow\('([^']+)'\)/g;
  let m;
  while ((m = re.exec(section)) !== null) rows.push(m[1]);
  return rows;
}

function render(rows, tileSize, outputPath) {
  if (!rows || rows.length === 0) { console.error('No rows'); return; }
  const mapH = rows.length;
  const mapW = Math.max(...rows.map(r => r.length));

  const MARGIN_L = 32;  // left margin for row numbers
  const MARGIN_T = 8;
  const LEGEND_W = 110;
  const imgW = MARGIN_L + mapW * tileSize + LEGEND_W + 8;
  const imgH = MARGIN_T + mapH * tileSize + 8;

  const pixels = new Uint8Array(imgW * imgH * 4);
  // fill BG
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i]=BG[0]; pixels[i+1]=BG[1]; pixels[i+2]=BG[2]; pixels[i+3]=255;
  }

  function setPixel(x, y, c) {
    if (x < 0 || x >= imgW || y < 0 || y >= imgH) return;
    const idx = (y*imgW+x)*4;
    pixels[idx]=c[0]; pixels[idx+1]=c[1]; pixels[idx+2]=c[2]; pixels[idx+3]=c[3]||255;
  }
  function fillRect(x, y, w, h, c) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) setPixel(x+dx, y+dy, c);
  }
  function outlineRect(x, y, w, h, c) {
    for (let dx = 0; dx < w; dx++) { setPixel(x+dx,y,c); setPixel(x+dx,y+h-1,c); }
    for (let dy = 0; dy < h; dy++) { setPixel(x,y+dy,c); setPixel(x+w-1,y+dy,c); }
  }

  // Draw tiles
  for (let row = 0; row < mapH; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      const ch = rows[row][col];
      const color = PAL[ch] || PAL_DEFAULT;
      const px = MARGIN_L + col * tileSize;
      const py = MARGIN_T + row * tileSize;
      fillRect(px, py, tileSize, tileSize, color);
      // grid line (1px dark border on each tile)
      outlineRect(px, py, tileSize, tileSize, GRID_LINE);
    }
    // Row number every 5 rows
    if (row % 5 === 0) {
      drawText(pixels, 1, MARGIN_T + row*tileSize + Math.floor(tileSize/2)-3, String(row).padStart(2,' '), imgW, 200,200,200);
    }
  }

  // Legend
  const lx = MARGIN_L + mapW * tileSize + 8;
  let ly = MARGIN_T + 4;
  for (const [ch, label] of LEGEND) {
    const color = PAL[ch] || PAL_DEFAULT;
    fillRect(lx, ly, 10, 10, color);
    outlineRect(lx, ly, 10, 10, [200,200,200,255]);
    drawText(pixels, lx+13, ly+1, label.slice(0,9), imgW, 200,200,200);
    ly += 14;
  }

  writePNG(outputPath, pixels, imgW, imgH);
  console.log(`Rendered ${mapW}x${mapH} tiles → ${outputPath} (${imgW}x${imgH}px)`);

  // Also print ASCII for quick inspection
  console.log('\nASCII preview (col 0 left, row 0 top):');
  const SYMS = {'.':'·','g':',','G':'█','T':'▓','~':'≈','>':'→','f':'✿','D':'D','P':'P','W':'▓','B':'▓'};
  rows.forEach((r, i) => {
    const sym = r.split('').map(c=>SYMS[c]||'?').join('');
    console.log(`${String(i).padStart(2,' ')} |${sym}|`);
  });
}

// Run
const htmlPath = path.join(__dirname, 'index.html');
const mapName  = process.argv[2] || 'route1';
const outFile  = path.join(__dirname, `${mapName}_preview.png`);
const html     = fs.readFileSync(htmlPath, 'utf8');
const rows     = parseMapRows(html, mapName);
if (!rows) { console.error(`MAPS.${mapName} not found`); process.exit(1); }
render(rows, 18, outFile);
