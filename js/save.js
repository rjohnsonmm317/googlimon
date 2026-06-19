'use strict';

// ── Player Object ─────────────────────────────────────────────
const PLAYER = {
  x: 10, y: 7,
  dir: 2,          // 0=up 1=right 2=down 3=left
  mapId: 'cache_town',
  stepTimer: 0,
  animFrame: 0,
  party: [],
};

// ── Game Save State ───────────────────────────────────────────
const SAVE = {
  playerName: 'Player',
  playerGender: 'boy',
  starterChosen: false,
  dex: {},
  credits: 500,
  badges: [],
  items: {},
  trainerDefeated: [],
  lastCenter: null,
  flags: {
    met_professor: false,
    starter_chosen: false,
    gym1_beaten: false,
    gym2_beaten: false,
    gym3_beaten: false,
    gym4_beaten: false,
    cloud_crisis: false,
    gym5_beaten: false,
    gym6_beaten: false,
    gym7_beaten: false,
    quarantine_cleared: false,
    malware_escalation: false,
    riley_met: false,
    rival_livia_1: false,
    malware_first_encounter: false,
    rival_battle_1: false,
    r1_item_ball_taken: false,
  },
};

// ── Save / Load ───────────────────────────────────────────────
const SAVE_KEY = 'googlimon_v1';

function syncTrainerState() {
  Object.values(MAPS).forEach(m => {
    if (!m.npcs) return;
    m.npcs.forEach(n => {
      if (n.isTrainer && SAVE.trainerDefeated.includes(n.id)) n.defeated = true;
    });
  });
}

function syncGateState() {
  const gateFlags = [
    ['elite1_gate', 'cache_beaten'],
    ['elite2_gate', 'firewall_e4_beaten'],
    ['elite3_gate', 'vector_e4_beaten'],
    ['elite4_gate', 'oracle_e4_beaten'],
    ['league_gate', 'nullbyte_defeated'],
  ];
  gateFlags.forEach(([gateId, flag]) => {
    if (!SAVE.flags[flag]) return;
    Object.values(MAPS).forEach(m => {
      if (!m.npcs) return;
      const g = m.npcs.find(n => n.id === gateId);
      if (g) g.defeated = true;
    });
  });
}

function saveGame() {
  if (!SAVE.starterChosen) return false;
  try {
    const data = {
      playerName: SAVE.playerName,
      playerGender: SAVE.playerGender,
      starterChosen: SAVE.starterChosen,
      dex: SAVE.dex,
      credits: SAVE.credits,
      badges: SAVE.badges,
      items: SAVE.items,
      trainerDefeated: SAVE.trainerDefeated,
      lastCenter: SAVE.lastCenter,
      flags: SAVE.flags,
      party: PLAYER.party.map(p => {
        const o = Object.assign({}, p);
        o.revealedStats = [];
        return o;
      }),
      mapId: PLAYER.mapId,
      px: PLAYER.x, py: PLAYER.y, pd: PLAYER.dir,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch(e) { return false; }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    SAVE.playerName      = d.playerName  || 'Player';
    SAVE.playerGender    = d.playerGender || 'boy';
    SAVE.starterChosen   = d.starterChosen || false;
    SAVE.dex             = d.dex  || {};
    SAVE.credits         = d.credits != null ? d.credits : 500;
    SAVE.badges          = d.badges  || [];
    SAVE.items           = d.items   || {};
    SAVE.trainerDefeated = d.trainerDefeated || [];
    SAVE.lastCenter      = d.lastCenter || null;
    SAVE.flags = Object.assign({
      met_professor: false,
      starter_chosen: false,
      gym1_beaten: false,
      gym2_beaten: false,
      gym3_beaten: false,
      gym4_beaten: false,
      cloud_crisis: false,
      gym5_beaten: false,
      gym6_beaten: false,
      gym7_beaten: false,
      quarantine_cleared: false,
      malware_escalation: false,
      riley_met: false,
      rival_livia_1: false,
      malware_first_encounter: false,
      rival_battle_1: false,
      r1_item_ball_taken: false,
      nullbyte_defeated: false,
      cache_beaten: false,
      firewall_e4_beaten: false,
      vector_e4_beaten: false,
      oracle_e4_beaten: false,
      elite_four_beaten: false,
      champion_beaten: false,
      deep_web_unlocked: false,
      dark_web_unlocked: false,
      legacy_servers_unlocked: false,
      bookmarkle_found: false,
      lost_browser_complete: false,
    }, d.flags || {});
    PLAYER.party = (d.party || []).map(p =>
      Object.assign({}, p, { revealedStats: new Set() })
    );
    PLAYER.mapId = d.mapId || 'cache_town';
    PLAYER.x = d.px != null ? d.px : 10;
    PLAYER.y = d.py != null ? d.py : 7;
    PLAYER.dir = d.pd != null ? d.pd : 2;
    syncTrainerState();
    syncGateState();
    return true;
  } catch(e) { return false; }
}

// ── Global notification ───────────────────────────────────────
const NOTIF = { text: '', timer: 0 };
function showNotif(text) { NOTIF.text = text; NOTIF.timer = 150; }
