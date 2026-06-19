#!/usr/bin/env node
// Programmatic traversal verifier for Googlimon route maps.
// Handles LEDGE_E (>) as a one-way east hop: approaching from west at (col,row)
// steps to (col+2, row), skipping the ledge tile itself.
// All other tiles: WALKABLE set determines passage.
'use strict';
const fs = require('fs');
const path = require('path');

// ── Tile constants (must match game) ────────────────────────────────────────
const TILE = {
  '.': 'PATH', 'g': 'GRASS', 'G': 'TALL', 'T': 'TREE',
  'W': 'WALL', 'B': 'WALL', 'D': 'DOOR', 'f': 'FLOWER',
  '~': 'WATER', 'P': 'PORTAL', '>': 'LEDGE_E', 'C': 'COUNTER',
};
const WALKABLE = new Set(['.','g','G','D','f','P']);   // mirrors game WALKABLE (not ~ or >)
// LEDGE_E: not in WALKABLE, but special east-hop from adjacent west tile

// ── Parse map from HTML ──────────────────────────────────────────────────────
function parseMap(html, mapName) {
  const startRe = new RegExp(`MAPS\\.${mapName}\\s*=\\s*\\{`);
  const start   = html.search(startRe);
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

function tileAt(rows, col, row) {
  if (row < 0 || row >= rows.length) return null;
  if (col < 0 || col >= rows[row].length) return null;
  return rows[row][col];
}

// ── BFS that understands LEDGE_E ─────────────────────────────────────────────
// Returns { found, path } where path is array of [col,row] steps.
// `exits` is an array of [col,row] targets; returns as soon as any is reached.
function bfs(rows, startCol, startRow, exits) {
  const exitSet = new Set(exits.map(([c,r]) => `${c},${r}`));
  const visited = new Set();
  const key     = (c,r) => `${c},${r}`;
  const queue   = [{ col: startCol, row: startRow, path: [[startCol, startRow]] }];
  visited.add(key(startCol, startRow));

  while (queue.length > 0) {
    const { col, row, path: cur } = queue.shift();

    if (exitSet.has(key(col, row))) return { found: true, path: cur };

    // 4-directional neighbours: right, left, down, up (dx, dy)
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dy] of dirs) {
      const nc = col + dx, nr = row + dy;
      const t  = tileAt(rows, nc, nr);
      if (t === null) continue;

      // LEDGE_E special: only passable if approaching from west (dx===1)
      if (t === '>') {
        if (dx === 1) {                    // player is moving east into ledge
          const lc = nc + 1, lr = nr;     // hop lands one more tile east (total +2)
          const lt = tileAt(rows, lc, lr);
          if (lt !== null && WALKABLE.has(lt) && !visited.has(key(lc,lr))) {
            visited.add(key(lc,lr));
            queue.push({ col: lc, row: lr, path: [...cur, [nc,nr,'HOP→'], [lc,lr]] });
          }
        }
        continue;  // LEDGE_E is a wall from all other directions
      }

      if (!WALKABLE.has(t)) continue;
      if (visited.has(key(nc,nr))) continue;

      visited.add(key(nc,nr));
      queue.push({ col: nc, row: nr, path: [...cur, [nc,nr]] });
    }
  }
  return { found: false, path: [] };
}

// ── Checks ───────────────────────────────────────────────────────────────────
function runChecks(rows) {
  const W = rows[0].length, H = rows.length;
  console.log(`Map: ${W} cols × ${H} rows\n`);

  // ── CHECK 1: South entrance → North entrance ────────────────────────────
  console.log('══════════════════════════════════════════════');
  console.log('CHECK 1: Cache Town entrance (9,23) → Searchburg exit (9,0)');
  console.log('══════════════════════════════════════════════');
  const mainRoute = bfs(rows, 9, 23, [[9,0],[10,0]]);
  if (!mainRoute.found) {
    console.log('❌  NO PATH FOUND — route is broken!\n');
  } else {
    console.log(`✓  Path found (${mainRoute.path.length} steps)`);
    // Print condensed: show every step with tile type and flag chokepoints
    let prevRow = -1;
    for (const step of mainRoute.path) {
      const [c, r, label] = step;
      const t = label || tileAt(rows, c, r);
      const isChokepoint = (r === 3 || r === 9) ? ' ← CHOKEPOINT' : '';
      const isFunnel     = (r === 13)            ? ' ← FUNNEL COL-9' : '';
      const isLedge      = (label === 'HOP→')    ? ' ← LEDGE HOP' : '';
      if (r !== prevRow) console.log(`  row ${String(r).padStart(2,'0')}: col ${c} [${TILE[t]||t}]${isChokepoint}${isFunnel}${isLedge}`);
      else               process.stdout.write(`  →col ${c} [${TILE[t]||t}]${isChokepoint}${isFunnel}${isLedge}\n`);
      prevRow = r;
    }
    // Verify chokepoints were crossed
    const crossedRow3 = mainRoute.path.some(([,r]) => r === 3);
    const crossedRow9 = mainRoute.path.some(([,r]) => r === 9);
    console.log(`\n  Chokepoint row 3 (full TALL GRASS) crossed: ${crossedRow3 ? '✓' : '❌'}`);
    console.log(`  Chokepoint row 9 (full TALL GRASS) crossed: ${crossedRow9 ? '✓' : '❌'}`);
  }

  // ── CHECK 2: Crawler Woods exit at (0,8) reachable from south entrance ──
  console.log('\n══════════════════════════════════════════════');
  console.log('CHECK 2: South entrance (9,23) → Crawler Woods exit (0,8)');
  console.log('══════════════════════════════════════════════');
  const crawlerRoute = bfs(rows, 9, 23, [[0,8]]);
  console.log(crawlerRoute.found ? `✓  Reachable (${crawlerRoute.path.length} steps)` : '❌  NOT REACHABLE');

  // ── CHECK 3: Canyon funnel — is col 9 row 13 truly the only way through? ─
  console.log('\n══════════════════════════════════════════════');
  console.log('CHECK 3: Canyon funnel row 13 — col 9 is only passage');
  console.log('══════════════════════════════════════════════');
  let passable = [];
  for (let c = 0; c < W; c++) {
    const t = tileAt(rows, c, 13);
    if (WALKABLE.has(t)) passable.push(`col ${c} [${TILE[t]||t}]`);
  }
  console.log(`  Walkable cols at row 13: ${passable.join(', ')}`);
  // Check row 14 can be reached from row 13 col 9
  const atLedge = tileAt(rows,  9, 14);
  const isLedge = tileAt(rows, 10, 14);
  console.log(`  (9,14)=${TILE[atLedge]||atLedge}, (10,14)=${TILE[isLedge]||isLedge}`);
  if (passable.length === 1 && passable[0].startsWith('col 9')) {
    console.log('  ✓  Single-column funnel confirmed (no soft-lock: TALL GRASS adjacent is still walkable)');
  } else {
    const g8  = WALKABLE.has(tileAt(rows, 8, 13));
    const g10 = WALKABLE.has(tileAt(rows, 10, 13));
    console.log(`  cols 8,10 at row 13 also walkable (g): ${g8}, ${g10} — player has slight elbow room`);
  }

  // ── CHECK 4: Ledge detour — (11,14) → item (15,16) → reconnect (9,18) ──
  console.log('\n══════════════════════════════════════════════');
  console.log('CHECK 4: Ledge detour — (9,14) hop → item (15,16) → reconnect (9,18)');
  console.log('══════════════════════════════════════════════');

  // From col 9 row 14 hop east: should land at (11,14)
  const ledgeTile = tileAt(rows, 10, 14);
  if (ledgeTile !== '>') {
    console.log(`❌  (10,14) is ${ledgeTile}, expected LEDGE_E`);
  } else {
    const landingTile = tileAt(rows, 11, 14);
    console.log(`  Ledge at (10,14)=LEDGE_E ✓, landing (11,14)=${TILE[landingTile]||landingTile} ${WALKABLE.has(landingTile)?'✓':'❌'}`);

    // From landing reach item
    const toItem = bfs(rows, 11, 14, [[15,16]]);
    console.log(toItem.found
      ? `  Landing→item (15,16): ✓ (${toItem.path.length} steps)`
      : '  Landing→item (15,16): ❌ NOT REACHABLE');

    // From item reach reconnect row 18
    const toReconnect = bfs(rows, 15, 16, [[9,18],[10,18]]);
    console.log(toReconnect.found
      ? `  Item→reconnect row 18: ✓ (${toReconnect.path.length} steps, exit at col ${toReconnect.path[toReconnect.path.length-1][0]})`
      : '  Item→reconnect row 18: ❌ NOT REACHABLE');

    // From reconnect reach north exit
    if (toReconnect.found) {
      const rc = toReconnect.path[toReconnect.path.length-1];
      const toNorth = bfs(rows, rc[0], rc[1], [[9,0],[10,0]]);
      console.log(toNorth.found
        ? `  Reconnect→north exit: ✓ (${toNorth.path.length} steps) — full detour loop confirmed`
        : '  Reconnect→north exit: ❌ BROKEN');
    }
  }

  // ── CHECK 5: Arrival tiles walkable ──────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log('CHECK 5: Arrival / exit spawn tiles');
  console.log('══════════════════════════════════════════════');
  const spawns = [
    [9,1,'Searchburg→Route1 arrival A'], [10,1,'Searchburg→Route1 arrival B'],
    [9,23,'Cache Town→Route1 arrival A'], [10,23,'Cache Town→Route1 arrival B'],
    [0,8,'Crawler Woods→Route1 arrival'],
  ];
  for (const [c,r,label] of spawns) {
    const t = tileAt(rows, c, r);
    const ok = WALKABLE.has(t);
    console.log(`  (${c},${r}) ${label}: ${TILE[t]||t} ${ok ? '✓' : '❌'}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const htmlPath = path.join(__dirname, 'index.html');
const mapName  = process.argv[2] || 'route1';
const html     = fs.readFileSync(htmlPath, 'utf8');
const rows     = parseMap(html, mapName);
if (!rows) { console.error(`MAPS.${mapName} not found`); process.exit(1); }
runChecks(rows);
