'use strict';

// ── Type Effectiveness Chart ──────────────────────────────────
const TYPE_CHART = (() => {
  const ALL = ['Search','Browser','Cloud','Data','Media','AI',
               'Security','Gaming','Social','Hardware','Electric','Virus','Quantum','Cosmic'];
  const m = {};
  ALL.forEach(a => { m[a] = {}; ALL.forEach(d => { m[a][d] = 1; }); });
  function se(a, d) { m[a][d] = 2; }
  function nve(a, d) { m[a][d] = 0.5; }

  se('Search','Virus');    se('Search','Data');     se('Search','Browser');
  nve('Search','Security'); nve('Search','Cloud');

  se('Browser','Security'); se('Browser','Cloud');   se('Browser','Gaming');
  nve('Browser','Virus');   nve('Browser','Data');

  se('Cloud','Data');      se('Cloud','AI');        se('Cloud','Social');
  nve('Cloud','Electric'); nve('Cloud','Security');

  se('Data','AI');         se('Data','Quantum');    se('Data','Browser');
  nve('Data','Virus');     nve('Data','Security');

  se('Media','Social');    se('Media','Gaming');    se('Media','Browser');
  nve('Media','Security'); nve('Media','Data');

  se('AI','Search');       se('AI','Browser');      se('AI','Data');
  nve('AI','Quantum');     nve('AI','Virus');

  se('Security','Virus');  se('Security','Data');   se('Security','Browser');
  nve('Security','Quantum'); nve('Security','AI');

  se('Gaming','Social');   se('Gaming','Media');    se('Gaming','Hardware');
  nve('Gaming','Security'); nve('Gaming','Data');

  se('Social','Media');    se('Social','Gaming');   se('Social','Browser');
  nve('Social','Security'); nve('Social','Data');

  se('Hardware','Electric'); se('Hardware','Virus'); se('Hardware','Gaming');
  nve('Hardware','Cloud');   nve('Hardware','Quantum');

  se('Electric','Cloud');   se('Electric','Hardware'); se('Electric','Browser');
  nve('Electric','Security'); nve('Electric','Data');

  se('Virus','AI');  se('Virus','Browser'); se('Virus','Data'); se('Virus','Cloud');
  nve('Virus','Security'); nve('Virus','Hardware');

  se('Quantum','Security'); se('Quantum','AI'); se('Quantum','Browser'); se('Quantum','Electric');
  nve('Quantum','Data');    nve('Quantum','Hardware');

  se('Cosmic','Quantum'); se('Cosmic','Virus'); se('Cosmic','AI');
  nve('Cosmic','Data');   nve('Cosmic','Security');

  return m;
})();

function getEffectiveness(atkType, defType1, defType2) {
  const e1 = (TYPE_CHART[atkType] && TYPE_CHART[atkType][defType1]) ?? 1;
  const e2 = (defType2 && TYPE_CHART[atkType] && TYPE_CHART[atkType][defType2]) ?? 1;
  return e1 * e2;
}

// ── Wild Googlimon Species Data ───────────────────────────────
const SPECIES = {
  Pixmouse: {
    type1:'Data', type2:'Hardware',
    baseHp:36, baseAtk:8, baseDef:7, baseSpd:13,
    catchRate:200, xpYield:38,
    learnset:[
      {lv:1,move:{name:'Nibble',     type:'Hardware',power:30,pp:35}},
      {lv:1,move:{name:'Pixel Dust', type:'Data',    power:20,pp:40}},
      {lv:4,move:{name:'Byte Bite',  type:'Data',    power:40,pp:25}},
      {lv:6,move:{name:'Scurry',     type:'Hardware',power:0, pp:20,effect:'spd+1'}},
    ],
  },
  Chirper: {
    type1:'Social', type2:'Media',
    baseHp:38, baseAtk:10, baseDef:6, baseSpd:15,
    catchRate:180, xpYield:44,
    learnset:[
      {lv:1,move:{name:'Chirp',      type:'Social', power:30,pp:35}},
      {lv:1,move:{name:'Peck',       type:'Hardware',power:25,pp:40}},
      {lv:4,move:{name:'Tweet Blitz',type:'Social', power:40,pp:25}},
      {lv:6,move:{name:'Viral Post', type:'Media',  power:0, pp:20,effect:'atk+1'}},
    ],
  },
  Bugbyte: {
    type1:'Virus', type2:'Data',
    baseHp:40, baseAtk:11, baseDef:8, baseSpd:10,
    catchRate:150, xpYield:54,
    learnset:[
      {lv:1,move:{name:'Corrupt',    type:'Virus',   power:30,pp:35}},
      {lv:1,move:{name:'Sting',      type:'Hardware',power:20,pp:40}},
      {lv:3,move:{name:'Infect',     type:'Virus',   power:0, pp:20,effect:'corrupt'}},
      {lv:5,move:{name:'Data Drain', type:'Data',    power:40,pp:25}},
    ],
  },
  Mousenet: {
    type1:'Browser', type2:'Social',
    baseHp:40, baseAtk:9, baseDef:9, baseSpd:12,
    catchRate:190, xpYield:40,
    learnset:[
      {lv:1,move:{name:'Click',      type:'Browser',power:25,pp:40}},
      {lv:1,move:{name:'Scroll',     type:'Social', power:20,pp:40}},
      {lv:3,move:{name:'Tab Spam',   type:'Browser',power:35,pp:30}},
      {lv:5,move:{name:'Network',    type:'Social', power:40,pp:25}},
    ],
  },
  Scoutgle: {
    type1:'Search', type2:'AI',
    baseHp:42, baseAtk:13, baseDef:9, baseSpd:13,
    catchRate:100, xpYield:65,
    learnset:[
      {lv:1,move:{name:'Query',      type:'Search',power:35,pp:30}},
      {lv:1,move:{name:'Index Scan', type:'Data',  power:25,pp:35}},
      {lv:3,move:{name:'Rank Blast', type:'Search',power:45,pp:20}},
      {lv:5,move:{name:'Learn',      type:'AI',    power:0, pp:15,effect:'atk+1'}},
    ],
  },
  Lockup: {
    type1:'Security', type2:'Electric',
    baseHp:46, baseAtk:10, baseDef:14, baseSpd:8,
    catchRate:120, xpYield:60,
    learnset:[
      {lv:1,move:{name:'Zap Lock',   type:'Electric', power:30,pp:30}},
      {lv:1,move:{name:'Firewall',   type:'Security', power:0, pp:20,effect:'def+1'}},
      {lv:3,move:{name:'Shock Lock', type:'Electric', power:40,pp:25}},
      {lv:5,move:{name:'Encrypt',    type:'Security', power:50,pp:20}},
    ],
  },
  // Gym 1 supplemental — Search type (overridden below)
  Seekrow: {
    type1:'Search', type2:'Virus',
    baseHp:38, baseAtk:13, baseDef:7, baseSpd:16,
    catchRate:160, xpYield:52,
    learnset:[
      {lv:1,move:{name:'Peck',       type:'Hardware',power:25,pp:40}},
      {lv:1,move:{name:'Query',      type:'Search',  power:30,pp:35}},
      {lv:4,move:{name:'Pluck Data', type:'Search',  power:42,pp:25}},
      {lv:6,move:{name:'Crow Call',  type:'Social',  power:0, pp:20,effect:'atk+1'}},
    ],
  },
  Findrake: {
    type1:'Search', type2:'AI',
    baseHp:48, baseAtk:16, baseDef:12, baseSpd:14,
    catchRate:90, xpYield:74,
    learnset:[
      {lv:1,move:{name:'Index Slash',type:'Search',  power:40,pp:25}},
      {lv:1,move:{name:'Scan',       type:'Data',    power:30,pp:35}},
      {lv:5,move:{name:'Rank Blast', type:'Search',  power:52,pp:20}},
      {lv:8,move:{name:'Dragonfind', type:'AI',      power:65,pp:15}},
    ],
  },
  // Route 2 / Gym 2 — Browser type
  Tabbit: {
    type1:'Browser', type2:null,
    baseHp:40, baseAtk:10, baseDef:9, baseSpd:13,
    catchRate:190, xpYield:42,
    learnset:[
      {lv:1,move:{name:'Tab Tap',    type:'Browser', power:28,pp:40}},
      {lv:1,move:{name:'Hop',        type:'Hardware',power:20,pp:40}},
      {lv:3,move:{name:'New Tab',    type:'Browser', power:38,pp:30}},
      {lv:5,move:{name:'Refresh',    type:'Browser', power:0, pp:25,effect:'def+1'}},
    ],
  },
  Hoplink: {
    type1:'Browser', type2:'Data',
    baseHp:44, baseAtk:12, baseDef:10, baseSpd:15,
    catchRate:160, xpYield:56,
    learnset:[
      {lv:1,move:{name:'Hop Link',   type:'Browser', power:35,pp:30}},
      {lv:1,move:{name:'URL Dash',   type:'Data',    power:30,pp:35}},
      {lv:4,move:{name:'Deep Link',  type:'Browser', power:46,pp:25}},
      {lv:7,move:{name:'Cache Load', type:'Data',    power:0, pp:15,effect:'spd+1'}},
    ],
  },
  Linklet: {
    type1:'Browser', type2:'Social',
    baseHp:42, baseAtk:11, baseDef:11, baseSpd:14,
    catchRate:170, xpYield:48,
    learnset:[
      {lv:1,move:{name:'Link Snap',  type:'Browser', power:30,pp:35}},
      {lv:1,move:{name:'Hyperclick', type:'Social',  power:25,pp:40}},
      {lv:4,move:{name:'Anchor Tag', type:'Browser', power:42,pp:25}},
      {lv:6,move:{name:'Forward',    type:'Browser', power:0, pp:20,effect:'spd+1'}},
    ],
  },
  Chromunk: {
    type1:'Browser', type2:'Electric',
    baseHp:44, baseAtk:14, baseDef:10, baseSpd:14,
    catchRate:140, xpYield:62,
    learnset:[
      {lv:1,move:{name:'Chrome Dash',type:'Browser', power:35,pp:30}},
      {lv:1,move:{name:'Spark',      type:'Electric',power:25,pp:40}},
      {lv:4,move:{name:'Extension',  type:'Browser', power:46,pp:25}},
      {lv:7,move:{name:'Volt Tab',   type:'Electric',power:55,pp:20}},
    ],
  },
  Cacheunk: {
    type1:'Browser', type2:'Data',
    baseHp:48, baseAtk:13, baseDef:14, baseSpd:10,
    catchRate:110, xpYield:70,
    learnset:[
      {lv:1,move:{name:'Cache Hit',  type:'Data',    power:35,pp:30}},
      {lv:1,move:{name:'Store',      type:'Browser', power:0, pp:25,effect:'def+1'}},
      {lv:5,move:{name:'Overflow',   type:'Data',    power:50,pp:20}},
      {lv:8,move:{name:'Memory Dump',type:'Data',    power:65,pp:15}},
    ],
  },
  Megachrome: {
    type1:'Browser', type2:'Electric',
    baseHp:56, baseAtk:18, baseDef:13, baseSpd:16,
    catchRate:75, xpYield:98,
    learnset:[
      {lv:1,move:{name:'Mega Surf',  type:'Browser', power:55,pp:20}},
      {lv:1,move:{name:'Volt Crash', type:'Electric',power:50,pp:20}},
      {lv:5,move:{name:'Tab Storm',  type:'Browser', power:65,pp:15}},
      {lv:9,move:{name:'Overclock',  type:'Electric',power:80,pp:10}},
    ],
  },
  // Route 3 / Gym 3 — Media type
  Streamit: {
    type1:'Media', type2:'Data',
    baseHp:42, baseAtk:12, baseDef:8, baseSpd:15,
    catchRate:180, xpYield:50,
    learnset:[
      {lv:1,move:{name:'Buffer',     type:'Media',   power:30,pp:35}},
      {lv:1,move:{name:'Click Bait', type:'Social',  power:20,pp:40}},
      {lv:4,move:{name:'Stream Wave',type:'Media',   power:46,pp:25}},
      {lv:7,move:{name:'Autoplay',   type:'Media',   power:0, pp:20,effect:'atk+1'}},
    ],
  },
  Clipster: {
    type1:'Media', type2:'Social',
    baseHp:40, baseAtk:13, baseDef:9, baseSpd:17,
    catchRate:170, xpYield:55,
    learnset:[
      {lv:1,move:{name:'Short Clip', type:'Media',   power:32,pp:35}},
      {lv:1,move:{name:'Snip',       type:'Data',    power:25,pp:40}},
      {lv:4,move:{name:'Viral Cut',  type:'Social',  power:46,pp:25}},
      {lv:7,move:{name:'Share Bomb', type:'Social',  power:0, pp:20,effect:'atk+1'}},
    ],
  },
  Casthound: {
    type1:'Media', type2:'Search',
    baseHp:48, baseAtk:15, baseDef:11, baseSpd:13,
    catchRate:130, xpYield:70,
    learnset:[
      {lv:1,move:{name:'Broadcast',  type:'Media',   power:38,pp:30}},
      {lv:1,move:{name:'Frequency',  type:'Data',    power:28,pp:35}},
      {lv:5,move:{name:'Live Feed',  type:'Media',   power:52,pp:20}},
      {lv:8,move:{name:'Signal Jam', type:'Search',  power:62,pp:15}},
    ],
  },
  Voxwolf: {
    type1:'Media', type2:'Search',
    baseHp:54, baseAtk:20, baseDef:13, baseSpd:17,
    catchRate:80, xpYield:102,
    learnset:[
      {lv:1,move:{name:'Vox Howl',   type:'Media',   power:55,pp:20}},
      {lv:1,move:{name:'Sonar Pulse',type:'Search',  power:45,pp:25}},
      {lv:5,move:{name:'Air Time',   type:'Media',   power:65,pp:15}},
      {lv:9,move:{name:'Prime Time', type:'Media',   power:85,pp:10}},
    ],
  },
  Influenix: {
    type1:'Social', type2:'Media',
    baseHp:46, baseAtk:16, baseDef:10, baseSpd:18,
    catchRate:110, xpYield:74,
    learnset:[
      {lv:1,move:{name:'Trendsetter',type:'Social',  power:40,pp:28}},
      {lv:1,move:{name:'Follow',     type:'Social',  power:0, pp:25,effect:'atk+1'}},
      {lv:5,move:{name:'Influencer', type:'Media',   power:55,pp:20}},
      {lv:8,move:{name:'Viral Storm',type:'Virus',   power:70,pp:15}},
    ],
  },
  Viralord: {
    type1:'Virus', type2:'Media',
    baseHp:52, baseAtk:22, baseDef:9, baseSpd:20,
    catchRate:70, xpYield:112,
    learnset:[
      {lv:1,move:{name:'Infect',     type:'Virus',   power:0, pp:20,effect:'corrupt'}},
      {lv:1,move:{name:'Viral Surge',type:'Virus',   power:55,pp:20}},
      {lv:5,move:{name:'Mass Share', type:'Social',  power:62,pp:18}},
      {lv:9,move:{name:'Pandemic',   type:'Virus',   power:90,pp:10}},
    ],
  },
  // Route 4 / Gym 4 — Cloud type
  Nimbusheep: {
    type1:'Cloud', type2:null,
    baseHp:50, baseAtk:12, baseDef:16, baseSpd:11,
    catchRate:150, xpYield:64,
    learnset:[
      {lv:1,move:{name:'Mist Byte',  type:'Cloud',   power:30,pp:35}},
      {lv:1,move:{name:'Wool Guard', type:'Hardware',power:0, pp:25,effect:'def+1'}},
      {lv:4,move:{name:'Cumulus',    type:'Cloud',   power:46,pp:25}},
      {lv:7,move:{name:'Rain Cloud', type:'Cloud',   power:0, pp:20,effect:'def+2'}},
    ],
  },
  Cloudram: {
    type1:'Cloud', type2:'Electric',
    baseHp:58, baseAtk:17, baseDef:18, baseSpd:14,
    catchRate:90, xpYield:92,
    learnset:[
      {lv:1,move:{name:'Thunder Head',type:'Electric',power:50,pp:22}},
      {lv:1,move:{name:'Nimbus Wave', type:'Cloud',   power:45,pp:25}},
      {lv:5,move:{name:'Static Cloud',type:'Electric',power:62,pp:18}},
      {lv:9,move:{name:'Storm Front', type:'Cloud',   power:76,pp:12}},
    ],
  },
  Droplet: {
    type1:'Cloud', type2:'Data',
    baseHp:46, baseAtk:13, baseDef:12, baseSpd:16,
    catchRate:170, xpYield:58,
    learnset:[
      {lv:1,move:{name:'Drop Byte',  type:'Cloud',   power:30,pp:35}},
      {lv:1,move:{name:'Data Drip',  type:'Data',    power:25,pp:40}},
      {lv:4,move:{name:'Downpour',   type:'Cloud',   power:48,pp:22}},
      {lv:7,move:{name:'Upload',     type:'Data',    power:0, pp:20,effect:'atk+1'}},
    ],
  },
  Stormlet: {
    type1:'Cloud', type2:'Electric',
    baseHp:44, baseAtk:15, baseDef:10, baseSpd:18,
    catchRate:160, xpYield:62,
    learnset:[
      {lv:1,move:{name:'Zap Drop',   type:'Electric',power:35,pp:30}},
      {lv:1,move:{name:'Gust',       type:'Cloud',   power:28,pp:40}},
      {lv:4,move:{name:'Bolt Squall',type:'Electric',power:52,pp:22}},
      {lv:7,move:{name:'Storm Cell', type:'Cloud',   power:60,pp:18}},
    ],
  },
  Datacloud: {
    type1:'Cloud', type2:'AI',
    baseHp:60, baseAtk:20, baseDef:20, baseSpd:15,
    catchRate:60, xpYield:128,
    learnset:[
      {lv:1,move:{name:'Data Storm', type:'Cloud',   power:60,pp:18}},
      {lv:1,move:{name:'Neural Rain',type:'AI',      power:50,pp:20}},
      {lv:5,move:{name:'Sky Server', type:'Data',    power:72,pp:15}},
      {lv:9,move:{name:'Cloud Burst',type:'Cloud',   power:95,pp:10}},
    ],
  },
};

// ── New species (Gym 1 / Searchburg area) ────────────────────
SPECIES.Seekrow = {
  type1:'Search', type2:'AI',
  baseHp:42, baseAtk:12, baseDef:9, baseSpd:14,
  catchRate:90, xpYield:68,
  learnset:[
    {lv:1,  move:{name:'Query',      type:'Search',   power:35, pp:30, ppLeft:30}},
    {lv:1,  move:{name:'Peck',       type:'Hardware', power:25, pp:40, ppLeft:40}},
    {lv:4,  move:{name:'Smart Scan', type:'Search',   power:45, pp:20, ppLeft:20}},
    {lv:7,  move:{name:'AI Talon',   type:'AI',       power:50, pp:15, ppLeft:15}},
    {lv:10, move:{name:'Deep Search',type:'Search',   power:65, pp:10, ppLeft:10}},
  ],
};
SPECIES.Findrake = {
  type1:'Search',
  baseHp:50, baseAtk:16, baseDef:12, baseSpd:12,
  catchRate:50, xpYield:90,
  learnset:[
    {lv:1,  move:{name:'Find',       type:'Search',   power:35, pp:30, ppLeft:30}},
    {lv:1,  move:{name:'Slash',      type:'Hardware', power:35, pp:25, ppLeft:25}},
    {lv:5,  move:{name:'Index Claw', type:'Search',   power:55, pp:20, ppLeft:20}},
    {lv:9,  move:{name:'Web Crawl',  type:'Browser',  power:45, pp:20, ppLeft:20}},
    {lv:13, move:{name:'Rank Storm', type:'Search',   power:80, pp:10, ppLeft:10}},
  ],
};

// ── Team Malware species ──────────────────────────────────────
SPECIES.Nullhound = {
  type1:'Virus',
  baseHp:40, baseAtk:14, baseDef:9, baseSpd:16,
  catchRate:45, xpYield:95,
  learnset:[
    {lv:1, move:{name:'Corrupt Bite', type:'Virus',    power:35, pp:25, ppLeft:25}},
    {lv:1, move:{name:'Snarl',        type:'Hardware', power:20, pp:35, ppLeft:35}},
    {lv:4, move:{name:'Null Howl',    type:'Virus',    power:0,  pp:20, ppLeft:20, effect:'atk+1'}},
    {lv:6, move:{name:'System Crash', type:'Virus',    power:55, pp:10, ppLeft:10}},
  ],
};

// ── Starter species ───────────────────────────────────────────
SPECIES.Querycub = {
  type1:'Search',
  baseHp:30, baseAtk:8, baseDef:7, baseSpd:9,
  catchRate:0, xpYield:65,
  learnset:[
    {lv:1, move:{name:'Search Pulse', type:'Search',   power:30, pp:30}},
    {lv:1, move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:8, move:{name:'Quick Scan',   type:'Search',   power:45, pp:25}},
    {lv:12,move:{name:'Sniff Trail',  type:'Search',   power:0,  pp:20, effect:'spd+1'}},
    {lv:16,move:{name:'Deep Search',  type:'Search',   power:65, pp:15}},
  ],
};
SPECIES.Searchound = {
  type1:'Search', type2:'Data',
  baseHp:48, baseAtk:13, baseDef:11, baseSpd:15,
  catchRate:0, xpYield:105,
  learnset:[
    {lv:1, move:{name:'Deep Search',  type:'Search',   power:65, pp:15}},
    {lv:1, move:{name:'Quick Scan',   type:'Search',   power:45, pp:25}},
    {lv:18,move:{name:'Index Slash',  type:'Search',   power:70, pp:15}},
    {lv:22,move:{name:'Data Howl',    type:'Data',     power:0,  pp:20, effect:'atk+1'}},
    {lv:28,move:{name:'Link Break',   type:'Search',   power:85, pp:10}},
  ],
};
SPECIES.Indexwolf = {
  type1:'Search', type2:'Data',
  baseHp:65, baseAtk:19, baseDef:16, baseSpd:21,
  catchRate:0, xpYield:160,
  learnset:[
    {lv:1, move:{name:'Link Break',   type:'Search',   power:85, pp:10}},
    {lv:1, move:{name:'Data Howl',    type:'Data',     power:0,  pp:20, effect:'atk+1'}},
    {lv:30,move:{name:'Global Index', type:'Search',   power:100,pp:8}},
    {lv:36,move:{name:'Cache Burst',  type:'Data',     power:90, pp:8}},
  ],
};
SPECIES.Puffbit = {
  type1:'Cloud',
  baseHp:34, baseAtk:7, baseDef:9, baseSpd:7,
  catchRate:0, xpYield:65,
  learnset:[
    {lv:1, move:{name:'Mist Byte',    type:'Cloud',    power:30, pp:30}},
    {lv:1, move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:8, move:{name:'Cloud Puff',   type:'Cloud',    power:45, pp:25}},
    {lv:12,move:{name:'Float',        type:'Cloud',    power:0,  pp:20, effect:'def+1'}},
    {lv:16,move:{name:'Fog Screen',   type:'Cloud',    power:55, pp:20}},
  ],
};
SPECIES.Thinklet = {
  type1:'AI',
  baseHp:28, baseAtk:9, baseDef:5, baseSpd:9,
  catchRate:0, xpYield:65,
  learnset:[
    {lv:1, move:{name:'Neural Zap',   type:'AI',       power:35, pp:25}},
    {lv:1, move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:8, move:{name:'Logic Pulse',  type:'AI',       power:45, pp:25}},
    {lv:12,move:{name:'Process',      type:'AI',       power:0,  pp:20, effect:'atk+1'}},
    {lv:16,move:{name:'Deep Think',   type:'AI',       power:60, pp:20}},
  ],
};
SPECIES.Cognibot = {
  type1:'AI', type2:'Hardware',
  baseHp:45, baseAtk:15, baseDef:9, baseSpd:14,
  catchRate:0, xpYield:110,
  learnset:[
    {lv:1, move:{name:'Deep Think',     type:'AI',       power:60, pp:20}},
    {lv:1, move:{name:'Logic Pulse',    type:'AI',       power:45, pp:25}},
    {lv:18,move:{name:'Circuit Charge', type:'AI',       power:70, pp:15}},
    {lv:22,move:{name:'Neural Net',     type:'AI',       power:0,  pp:20, effect:'atk+1'}},
    {lv:28,move:{name:'Code Crush',     type:'AI',       power:85, pp:10}},
  ],
};
SPECIES.Mindframe = {
  type1:'AI', type2:'Data',
  baseHp:60, baseAtk:21, baseDef:13, baseSpd:19,
  catchRate:0, xpYield:165,
  learnset:[
    {lv:1, move:{name:'Code Crush',     type:'AI',       power:85, pp:10}},
    {lv:1, move:{name:'Circuit Charge', type:'AI',       power:70, pp:15}},
    {lv:30,move:{name:'Overclocked',    type:'AI',       power:0,  pp:15, effect:'atk+2'}},
    {lv:36,move:{name:'System Override',type:'AI',       power:110,pp:5}},
  ],
};

// ── Evolution chains ─────────────────────────────────────────
const EVOLUTIONS = {
  // Starters
  Querycub:   { into: 'Searchound', at: 16 },
  Searchound: { into: 'Indexwolf',  at: 28 },
  Puffbit:    { into: 'Nimbusheep', at: 16 },
  Thinklet:   { into: 'Cognibot',   at: 16 },
  Cognibot:   { into: 'Mindframe',  at: 28 },
  // Wild
  Pixmouse:   { into: 'Mousenet',   at: 10 },
  Scoutgle:   { into: 'Seekrow',    at: 14 },
  Seekrow:    { into: 'Findrake',   at: 22 },
  Tabbit:     { into: 'Hoplink',    at: 16 },
  Hoplink:    { into: 'Linklet',    at: 26 },
  Chromunk:   { into: 'Cacheunk',   at: 20 },
  Cacheunk:   { into: 'Megachrome', at: 32 },
  Streamit:   { into: 'Clipster',   at: 16 },
  Clipster:   { into: 'Casthound',  at: 24 },
  Influenix:  { into: 'Viralord',   at: 30 },
  Nimbusheep: { into: 'Cloudram',   at: 22 },
  Droplet:    { into: 'Stormlet',   at: 20 },
  Stormlet:   { into: 'Datacloud',  at: 30 },
};

// ── Security type (Gyms 5-7) ─────────────────────────────────
SPECIES.Patchkit = {
  type1:'Security', baseHp:32, baseAtk:9, baseDef:12, baseSpd:7,
  catchRate:60, xpYield:70,
  learnset:[
    {lv:1,  move:{name:'Guard Bit',    type:'Security', power:30, pp:30}},
    {lv:1,  move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:8,  move:{name:'Patch Wave',   type:'Security', power:45, pp:25}},
    {lv:14, move:{name:'Fortify',      type:'Security', power:0,  pp:20, effect:'def+1'}},
    {lv:20, move:{name:'Null Route',   type:'Security', power:60, pp:15}},
  ],
};
SPECIES.Patchguard = {
  type1:'Security', type2:'Hardware', baseHp:52, baseAtk:14, baseDef:20, baseSpd:10,
  catchRate:30, xpYield:115,
  learnset:[
    {lv:1,  move:{name:'Null Route',   type:'Security', power:60, pp:15}},
    {lv:22, move:{name:'Shield Wall',  type:'Security', power:0,  pp:15, effect:'def+2'}},
    {lv:28, move:{name:'Data Block',   type:'Hardware', power:70, pp:12}},
    {lv:34, move:{name:'Firewall',     type:'Security', power:80, pp:10}},
  ],
};
SPECIES.Fortwall = {
  type1:'Security', type2:'Hardware', baseHp:72, baseAtk:20, baseDef:30, baseSpd:14,
  catchRate:10, xpYield:175,
  learnset:[
    {lv:1,  move:{name:'Firewall',     type:'Security', power:80, pp:10}},
    {lv:40, move:{name:'Bastion',      type:'Security', power:0,  pp:10, effect:'def+3'}},
    {lv:46, move:{name:'Null Purge',   type:'Security', power:110,pp:5}},
  ],
};
SPECIES.Cryptling = {
  type1:'Security', type2:'Data', baseHp:28, baseAtk:11, baseDef:9, baseSpd:11,
  catchRate:55, xpYield:72,
  learnset:[
    {lv:1,  move:{name:'Encode',       type:'Data',     power:30, pp:30}},
    {lv:1,  move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:9,  move:{name:'Cipher Strike',type:'Security', power:40, pp:25}},
    {lv:15, move:{name:'Key Swap',     type:'Data',     power:0,  pp:20, effect:'spd+1'}},
    {lv:22, move:{name:'Decrypt',      type:'Security', power:65, pp:15}},
  ],
};
SPECIES.Cipherlock = {
  type1:'Security', type2:'Data', baseHp:46, baseAtk:18, baseDef:14, baseSpd:17,
  catchRate:25, xpYield:120,
  learnset:[
    {lv:1,  move:{name:'Decrypt',      type:'Security', power:65, pp:15}},
    {lv:26, move:{name:'Hash Slash',   type:'Data',     power:72, pp:12}},
    {lv:32, move:{name:'Salt Bomb',    type:'Security', power:80, pp:10}},
    {lv:38, move:{name:'Total Lock',   type:'Security', power:95, pp:8}},
  ],
};
SPECIES.Firewarg = {
  type1:'Security', baseHp:36, baseAtk:13, baseDef:10, baseSpd:12,
  catchRate:45, xpYield:80,
  learnset:[
    {lv:1,  move:{name:'Ember Byte',   type:'Security', power:35, pp:28}},
    {lv:1,  move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:10, move:{name:'Burn Scan',    type:'Security', power:48, pp:22}},
    {lv:18, move:{name:'Threat Flag',  type:'Security', power:0,  pp:20, effect:'atk+1'}},
    {lv:24, move:{name:'Blaze Bite',   type:'Security', power:70, pp:14}},
  ],
};
SPECIES.Blazewall = {
  type1:'Security', baseHp:56, baseAtk:21, baseDef:16, baseSpd:18,
  catchRate:20, xpYield:130,
  learnset:[
    {lv:1,  move:{name:'Blaze Bite',   type:'Security', power:70, pp:14}},
    {lv:28, move:{name:'Inferno Scan', type:'Security', power:78, pp:10}},
    {lv:34, move:{name:'Purge Fire',   type:'Security', power:88, pp:8}},
  ],
};
SPECIES.Infernoguard = {
  type1:'Security', type2:'Hardware', baseHp:76, baseAtk:30, baseDef:23, baseSpd:24,
  catchRate:5, xpYield:190,
  learnset:[
    {lv:1,  move:{name:'Purge Fire',   type:'Security', power:88, pp:8}},
    {lv:46, move:{name:'Absolute Zero Bug', type:'Security', power:0, pp:10, effect:'atk+2'}},
    {lv:52, move:{name:'Total Burn',   type:'Security', power:120,pp:4}},
  ],
};

// ── Gaming type (Gyms 5-7) ───────────────────────────────────
SPECIES.Pixelite = {
  type1:'Gaming', baseHp:30, baseAtk:10, baseDef:8, baseSpd:13,
  catchRate:65, xpYield:68,
  learnset:[
    {lv:1,  move:{name:'Pixel Punch',  type:'Gaming',   power:30, pp:30}},
    {lv:1,  move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:8,  move:{name:'Sprite Dash',  type:'Gaming',   power:40, pp:25}},
    {lv:14, move:{name:'Level Up',     type:'Gaming',   power:0,  pp:20, effect:'atk+1'}},
    {lv:20, move:{name:'Pixel Crash',  type:'Gaming',   power:60, pp:15}},
  ],
};
SPECIES.Spriteling = {
  type1:'Gaming', type2:'Data', baseHp:48, baseAtk:16, baseDef:12, baseSpd:20,
  catchRate:32, xpYield:112,
  learnset:[
    {lv:1,  move:{name:'Pixel Crash',  type:'Gaming',   power:60, pp:15}},
    {lv:24, move:{name:'Frame Skip',   type:'Gaming',   power:68, pp:12}},
    {lv:30, move:{name:'Render Break', type:'Data',     power:75, pp:10}},
    {lv:36, move:{name:'High Score',   type:'Gaming',   power:85, pp:8}},
  ],
};
SPECIES.Renderite = {
  type1:'Gaming', type2:'Data', baseHp:66, baseAtk:24, baseDef:18, baseSpd:28,
  catchRate:8, xpYield:170,
  learnset:[
    {lv:1,  move:{name:'High Score',   type:'Gaming',   power:85, pp:8}},
    {lv:44, move:{name:'FPS Burst',    type:'Gaming',   power:0,  pp:12, effect:'spd+2'}},
    {lv:50, move:{name:'Ray Trace',    type:'Gaming',   power:115,pp:5}},
  ],
};
SPECIES.Voxeling = {
  type1:'Gaming', type2:'Hardware', baseHp:38, baseAtk:12, baseDef:14, baseSpd:9,
  catchRate:50, xpYield:78,
  learnset:[
    {lv:1,  move:{name:'Block Hit',    type:'Hardware', power:32, pp:28}},
    {lv:1,  move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:10, move:{name:'Voxel Smash',  type:'Gaming',   power:50, pp:22}},
    {lv:16, move:{name:'Build Up',     type:'Hardware', power:0,  pp:20, effect:'def+1'}},
    {lv:22, move:{name:'Cube Crush',   type:'Gaming',   power:68, pp:14}},
  ],
};
SPECIES.Voxelord = {
  type1:'Gaming', type2:'Hardware', baseHp:60, baseAtk:20, baseDef:22, baseSpd:14,
  catchRate:18, xpYield:140,
  learnset:[
    {lv:1,  move:{name:'Cube Crush',   type:'Gaming',   power:68, pp:14}},
    {lv:30, move:{name:'Geo Storm',    type:'Gaming',   power:80, pp:10}},
    {lv:38, move:{name:'Polygon Slam', type:'Hardware', power:92, pp:8}},
    {lv:44, move:{name:'Masterblock',  type:'Gaming',   power:105,pp:5}},
  ],
};
SPECIES.Arcadem = {
  type1:'Gaming', baseHp:34, baseAtk:14, baseDef:9, baseSpd:16,
  catchRate:40, xpYield:85,
  learnset:[
    {lv:1,  move:{name:'Insert Coin',  type:'Gaming',   power:28, pp:32}},
    {lv:1,  move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:12, move:{name:'Combo Hit',    type:'Gaming',   power:52, pp:20}},
    {lv:20, move:{name:'Power Up',     type:'Gaming',   power:0,  pp:18, effect:'atk+2'}},
    {lv:28, move:{name:'Extra Life',   type:'Gaming',   power:75, pp:10}},
  ],
};
SPECIES.Arcadream = {
  type1:'Gaming', baseHp:58, baseAtk:26, baseDef:15, baseSpd:26,
  catchRate:4, xpYield:185,
  learnset:[
    {lv:1,  move:{name:'Extra Life',   type:'Gaming',   power:75, pp:10}},
    {lv:40, move:{name:'Final Stage',  type:'Gaming',   power:0,  pp:12, effect:'atk+2'}},
    {lv:48, move:{name:'Game Over',    type:'Gaming',   power:125,pp:4}},
  ],
};

// ── Advanced AI type (Gyms 5-7) ──────────────────────────────
SPECIES.Prompter = {
  type1:'AI', baseHp:30, baseAtk:12, baseDef:7, baseSpd:14,
  catchRate:42, xpYield:82,
  learnset:[
    {lv:1,  move:{name:'Query Shot',   type:'AI',       power:32, pp:28}},
    {lv:1,  move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:10, move:{name:'Inference',    type:'AI',       power:50, pp:22}},
    {lv:18, move:{name:'Prompt Surge', type:'AI',       power:0,  pp:18, effect:'atk+1'}},
    {lv:26, move:{name:'Token Blast',  type:'AI',       power:72, pp:12}},
  ],
};
SPECIES.Inferron = {
  type1:'AI', type2:'Data', baseHp:52, baseAtk:22, baseDef:12, baseSpd:20,
  catchRate:16, xpYield:145,
  learnset:[
    {lv:1,  move:{name:'Token Blast',  type:'AI',       power:72, pp:12}},
    {lv:30, move:{name:'Chain Think',  type:'AI',       power:82, pp:10}},
    {lv:38, move:{name:'Deep Prompt',  type:'AI',       power:95, pp:7}},
    {lv:44, move:{name:'Hallucinate',  type:'AI',       power:0,  pp:12, effect:'atk+3'}},
  ],
};
SPECIES.Neuralith = {
  type1:'AI', baseHp:36, baseAtk:15, baseDef:10, baseSpd:12,
  catchRate:35, xpYield:88,
  learnset:[
    {lv:1,  move:{name:'Neural Shock', type:'AI',       power:40, pp:26}},
    {lv:1,  move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:12, move:{name:'Synapse Fire', type:'AI',       power:55, pp:20}},
    {lv:20, move:{name:'Model Update', type:'AI',       power:0,  pp:18, effect:'atk+1'}},
    {lv:28, move:{name:'Overfit',      type:'AI',       power:80, pp:10}},
  ],
};
SPECIES.Omnisync = {
  type1:'AI', type2:'Data', baseHp:68, baseAtk:32, baseDef:20, baseSpd:22,
  catchRate:3, xpYield:210,
  learnset:[
    {lv:1,  move:{name:'Overfit',      type:'AI',       power:80, pp:10}},
    {lv:44, move:{name:'Multimodal',   type:'AI',       power:0,  pp:10, effect:'atk+2'}},
    {lv:50, move:{name:'Neural Override', type:'AI',    power:130,pp:4}},
  ],
};

// ── Team Malware Virus advanced (Gyms 5-7) ───────────────────
SPECIES.Corruptr = {
  type1:'Virus', type2:'Data', baseHp:42, baseAtk:17, baseDef:10, baseSpd:16,
  catchRate:25, xpYield:100,
  learnset:[
    {lv:1,  move:{name:'Corrupt Byte', type:'Virus',    power:45, pp:25}},
    {lv:1,  move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:14, move:{name:'Data Rot',     type:'Data',     power:55, pp:20}},
    {lv:22, move:{name:'Corrupt',      type:'Virus',    power:70, pp:14}},
    {lv:30, move:{name:'Malware Drop', type:'Virus',    power:85, pp:10}},
  ],
};
SPECIES.Malwarix = {
  type1:'Virus', type2:'Data', baseHp:64, baseAtk:28, baseDef:16, baseSpd:22,
  catchRate:8, xpYield:165,
  learnset:[
    {lv:1,  move:{name:'Malware Drop', type:'Virus',    power:85, pp:10}},
    {lv:34, move:{name:'Root Access',  type:'Data',     power:90, pp:8}},
    {lv:42, move:{name:'Zero Day',     type:'Virus',    power:110,pp:5}},
  ],
};
SPECIES.Glitchworm = {
  type1:'Virus', type2:'Hardware', baseHp:40, baseAtk:15, baseDef:13, baseSpd:14,
  catchRate:30, xpYield:92,
  learnset:[
    {lv:1,  move:{name:'Glitch Sting', type:'Virus',    power:38, pp:28}},
    {lv:1,  move:{name:'Tackle',       type:'Hardware', power:30, pp:35}},
    {lv:12, move:{name:'Wire Chomp',   type:'Hardware', power:50, pp:22}},
    {lv:20, move:{name:'Glitch Surge', type:'Virus',    power:65, pp:15}},
    {lv:28, move:{name:'System Crash', type:'Virus',    power:82, pp:10}},
  ],
};
SPECIES.Glitchfiend = {
  type1:'Virus', type2:'Hardware', baseHp:62, baseAtk:26, baseDef:20, baseSpd:20,
  catchRate:6, xpYield:175,
  learnset:[
    {lv:1,  move:{name:'System Crash', type:'Virus',    power:82, pp:10}},
    {lv:36, move:{name:'Hardware Ruin',type:'Hardware', power:88, pp:8}},
    {lv:44, move:{name:'Total Corrupt',type:'Virus',    power:115,pp:4}},
  ],
};

// ── EVOLUTIONS (Gyms 5-7) ─────────────────────────────────────
EVOLUTIONS.Patchkit   = { into:'Patchguard',  at:26 };
EVOLUTIONS.Patchguard = { into:'Fortwall',    at:40 };
EVOLUTIONS.Cryptling  = { into:'Cipherlock',  at:28 };
EVOLUTIONS.Firewarg   = { into:'Blazewall',   at:30 };
EVOLUTIONS.Blazewall  = { into:'Infernoguard',at:46 };
EVOLUTIONS.Pixelite   = { into:'Spriteling',  at:24 };
EVOLUTIONS.Spriteling = { into:'Renderite',   at:38 };
EVOLUTIONS.Voxeling   = { into:'Voxelord',    at:30 };
EVOLUTIONS.Arcadem    = { into:'Arcadream',   at:38 };
EVOLUTIONS.Prompter   = { into:'Inferron',    at:34 };
EVOLUTIONS.Neuralith  = { into:'Omnisync',    at:46 };
EVOLUTIONS.Corruptr   = { into:'Malwarix',    at:34 };
EVOLUTIONS.Glitchworm = { into:'Glitchfiend', at:36 };

// ── E4 / Datacenter — DATA/ARCHIVE (Cache's team) ────────────
SPECIES.Bytelet = {
  type1:'Data', baseHp:44, baseAtk:14, baseDef:18, baseSpd:10,
  catchRate:0, xpYield:140,
  learnset:[
    {lv:1,  move:{name:'Byte Strike',   type:'Data',     power:40, pp:28}},
    {lv:1,  move:{name:'Tackle',        type:'Hardware', power:30, pp:35}},
    {lv:20, move:{name:'Archive Pulse', type:'Data',     power:55, pp:20}},
    {lv:32, move:{name:'Data Wall',     type:'Data',     power:0,  pp:15, effect:'def+2'}},
    {lv:44, move:{name:'Deep Encode',   type:'Data',     power:80, pp:10}},
    {lv:56, move:{name:'Total Archive', type:'Data',     power:100,pp:6}},
  ],
};
SPECIES.Archivox = {
  type1:'Data', type2:'Search', baseHp:52, baseAtk:16, baseDef:15, baseSpd:14,
  catchRate:0, xpYield:148,
  learnset:[
    {lv:1,  move:{name:'Archive Pulse', type:'Data',     power:55, pp:20}},
    {lv:1,  move:{name:'Quick Scan',    type:'Search',   power:40, pp:25}},
    {lv:30, move:{name:'Index Search',  type:'Search',   power:70, pp:14}},
    {lv:42, move:{name:'Data Siege',    type:'Data',     power:85, pp:10}},
    {lv:52, move:{name:'Vault Beam',    type:'Data',     power:105,pp:6}},
  ],
};
SPECIES.Libracode = {
  type1:'Data', baseHp:58, baseAtk:13, baseDef:22, baseSpd:9,
  catchRate:0, xpYield:152,
  learnset:[
    {lv:1,  move:{name:'Deep Encode',   type:'Data',     power:80, pp:10}},
    {lv:1,  move:{name:'Block Slam',    type:'Hardware', power:50, pp:22}},
    {lv:34, move:{name:'Code Wall',     type:'Data',     power:0,  pp:12, effect:'def+3'}},
    {lv:46, move:{name:'Library Lock',  type:'Data',     power:90, pp:8}},
    {lv:56, move:{name:'Tome Strike',   type:'Data',     power:110,pp:5}},
  ],
};
SPECIES.Vaultitan = {
  type1:'Data', type2:'Security', baseHp:66, baseAtk:18, baseDef:26, baseSpd:8,
  catchRate:0, xpYield:160,
  learnset:[
    {lv:1,  move:{name:'Vault Crush',   type:'Data',     power:85, pp:10}},
    {lv:1,  move:{name:'Iron Guard',    type:'Security', power:0,  pp:15, effect:'def+2'}},
    {lv:40, move:{name:'Total Seal',    type:'Security', power:0,  pp:10, effect:'def+3'}},
    {lv:52, move:{name:'Titan Vault',   type:'Data',     power:115,pp:5}},
  ],
};
SPECIES.Teradrive = {
  type1:'Data', type2:'Hardware', baseHp:56, baseAtk:20, baseDef:18, baseSpd:16,
  catchRate:0, xpYield:156,
  learnset:[
    {lv:1,  move:{name:'Drive Slam',    type:'Hardware', power:70, pp:14}},
    {lv:1,  move:{name:'Data Storm',    type:'Data',     power:80, pp:10}},
    {lv:44, move:{name:'Terabyte Hit',  type:'Data',     power:90, pp:8}},
    {lv:56, move:{name:'Full Format',   type:'Hardware', power:120,pp:4}},
  ],
};

// ── SECURITY extended (Firewall's team) ──────────────────────
SPECIES.Encryptoad = {
  type1:'Security', baseHp:50, baseAtk:15, baseDef:17, baseSpd:11,
  catchRate:0, xpYield:144,
  learnset:[
    {lv:1,  move:{name:'Cipher Strike', type:'Security', power:40, pp:25}},
    {lv:1,  move:{name:'Tackle',        type:'Hardware', power:30, pp:35}},
    {lv:24, move:{name:'Encrypt Bash',  type:'Security', power:60, pp:18}},
    {lv:38, move:{name:'Key Swap',      type:'Security', power:0,  pp:14, effect:'spd+1'}},
    {lv:50, move:{name:'Crypto Slam',   type:'Security', power:95, pp:7}},
  ],
};
SPECIES.Firewarden = {
  type1:'Security', type2:'Hardware', baseHp:58, baseAtk:19, baseDef:18, baseSpd:14,
  catchRate:0, xpYield:152,
  learnset:[
    {lv:1,  move:{name:'Warden Slash',  type:'Security', power:60, pp:18}},
    {lv:1,  move:{name:'Iron Shield',   type:'Hardware', power:0,  pp:15, effect:'def+1'}},
    {lv:32, move:{name:'Guard Fire',    type:'Security', power:75, pp:12}},
    {lv:46, move:{name:'Firebreak',     type:'Security', power:90, pp:8}},
    {lv:58, move:{name:'Total Guard',   type:'Security', power:115,pp:5}},
  ],
};
SPECIES.Guardianode = {
  type1:'Security', type2:'AI', baseHp:60, baseAtk:17, baseDef:20, baseSpd:16,
  catchRate:0, xpYield:155,
  learnset:[
    {lv:1,  move:{name:'Node Guard',    type:'Security', power:55, pp:20}},
    {lv:1,  move:{name:'Inference',     type:'AI',       power:50, pp:22}},
    {lv:36, move:{name:'AI Shield',     type:'AI',       power:0,  pp:12, effect:'def+2'}},
    {lv:50, move:{name:'Guardian Wave', type:'Security', power:100,pp:6}},
  ],
};
SPECIES.Cryptoadon = {
  type1:'Security', type2:'Data', baseHp:70, baseAtk:22, baseDef:22, baseSpd:12,
  catchRate:0, xpYield:165,
  learnset:[
    {lv:1,  move:{name:'Hash Slash',    type:'Data',     power:72, pp:12}},
    {lv:1,  move:{name:'Null Route',    type:'Security', power:60, pp:15}},
    {lv:40, move:{name:'Decrypt Crush', type:'Security', power:90, pp:8}},
    {lv:52, move:{name:'Cipher Lord',   type:'Data',     power:110,pp:5}},
  ],
};
SPECIES.Lockjawl = {
  type1:'Security', type2:'Hardware', baseHp:62, baseAtk:24, baseDef:19, baseSpd:18,
  catchRate:0, xpYield:162,
  learnset:[
    {lv:1,  move:{name:'Jaw Lock',      type:'Security', power:65, pp:16}},
    {lv:1,  move:{name:'Data Block',    type:'Hardware', power:70, pp:12}},
    {lv:44, move:{name:'Iron Bite',     type:'Hardware', power:85, pp:10}},
    {lv:58, move:{name:'Total Lock',    type:'Security', power:120,pp:4}},
  ],
};

// ── HARDWARE (Vector's team) ──────────────────────────────────
SPECIES.Portitan = {
  type1:'Hardware', baseHp:52, baseAtk:18, baseDef:20, baseSpd:13,
  catchRate:0, xpYield:148,
  learnset:[
    {lv:1,  move:{name:'Port Slam',     type:'Hardware', power:60, pp:18}},
    {lv:1,  move:{name:'Tackle',        type:'Hardware', power:30, pp:35}},
    {lv:28, move:{name:'Circuit Push',  type:'Hardware', power:75, pp:12}},
    {lv:44, move:{name:'Port Overload', type:'Hardware', power:90, pp:8}},
    {lv:56, move:{name:'Power Drive',   type:'Hardware', power:110,pp:5}},
  ],
};
SPECIES.Gridrake = {
  type1:'Hardware', type2:'AI', baseHp:54, baseAtk:20, baseDef:18, baseSpd:17,
  catchRate:0, xpYield:153,
  learnset:[
    {lv:1,  move:{name:'Grid Slash',    type:'Hardware', power:65, pp:16}},
    {lv:1,  move:{name:'Token Blast',   type:'AI',       power:72, pp:12}},
    {lv:34, move:{name:'Grid Surge',    type:'Hardware', power:80, pp:10}},
    {lv:48, move:{name:'Matrix Crush',  type:'AI',       power:95, pp:7}},
  ],
};
SPECIES.Motherbeast = {
  type1:'Hardware', type2:'Data', baseHp:68, baseAtk:22, baseDef:22, baseSpd:12,
  catchRate:0, xpYield:162,
  learnset:[
    {lv:1,  move:{name:'Board Slam',    type:'Hardware', power:80, pp:10}},
    {lv:1,  move:{name:'Data Storm',    type:'Data',     power:80, pp:10}},
    {lv:40, move:{name:'System Overload',type:'Hardware',power:100,pp:6}},
    {lv:56, move:{name:'Motherboard Crush',type:'Hardware',power:125,pp:4}},
  ],
};
SPECIES.Docklord = {
  type1:'Hardware', baseHp:60, baseAtk:24, baseDef:19, baseSpd:15,
  catchRate:0, xpYield:158,
  learnset:[
    {lv:1,  move:{name:'Dock Strike',   type:'Hardware', power:72, pp:14}},
    {lv:1,  move:{name:'Cable Whip',    type:'Hardware', power:55, pp:20}},
    {lv:36, move:{name:'Anchor Slam',   type:'Hardware', power:88, pp:9}},
    {lv:52, move:{name:'Freight Crash', type:'Hardware', power:115,pp:5}},
  ],
};
SPECIES.Titanframe = {
  type1:'Hardware', baseHp:72, baseAtk:28, baseDef:28, baseSpd:11,
  catchRate:0, xpYield:180,
  learnset:[
    {lv:1,  move:{name:'Frame Slam',    type:'Hardware', power:90, pp:8}},
    {lv:1,  move:{name:'Iron Shield',   type:'Hardware', power:0,  pp:12, effect:'def+2'}},
    {lv:44, move:{name:'Titan Press',   type:'Hardware', power:105,pp:6}},
    {lv:60, move:{name:'Full Frame',    type:'Hardware', power:130,pp:4}},
  ],
};

// ── AI extended (Oracle's team) ───────────────────────────────
SPECIES.Promptor = {
  type1:'AI', baseHp:48, baseAtk:22, baseDef:12, baseSpd:20,
  catchRate:0, xpYield:148,
  learnset:[
    {lv:1,  move:{name:'Query Shot',    type:'AI',       power:32, pp:28}},
    {lv:1,  move:{name:'Token Blast',   type:'AI',       power:72, pp:12}},
    {lv:30, move:{name:'Prompt Wave',   type:'AI',       power:80, pp:10}},
    {lv:46, move:{name:'Context Surge', type:'AI',       power:95, pp:7}},
    {lv:60, move:{name:'Model Collapse',type:'AI',       power:120,pp:4}},
  ],
};
SPECIES.Forecastor = {
  type1:'AI', type2:'Search', baseHp:52, baseAtk:24, baseDef:14, baseSpd:22,
  catchRate:0, xpYield:155,
  learnset:[
    {lv:1,  move:{name:'Predict',       type:'AI',       power:60, pp:18}},
    {lv:1,  move:{name:'Index Search',  type:'Search',   power:70, pp:14}},
    {lv:36, move:{name:'Forecast Beam', type:'AI',       power:85, pp:10}},
    {lv:52, move:{name:'Future Strike',  type:'AI',      power:105,pp:6}},
  ],
};
SPECIES.Cognititan = {
  type1:'AI', type2:'Data', baseHp:64, baseAtk:26, baseDef:16, baseSpd:18,
  catchRate:0, xpYield:165,
  learnset:[
    {lv:1,  move:{name:'Cognitive Hit', type:'AI',       power:70, pp:15}},
    {lv:1,  move:{name:'Deep Encode',   type:'Data',     power:80, pp:10}},
    {lv:40, move:{name:'Cognitive Surge',type:'AI',      power:95, pp:7}},
    {lv:56, move:{name:'Mind Crush',    type:'AI',       power:115,pp:5}},
  ],
};
SPECIES.Precognira = {
  type1:'AI', baseHp:56, baseAtk:28, baseDef:14, baseSpd:24,
  catchRate:0, xpYield:170,
  learnset:[
    {lv:1,  move:{name:'Future Sight',  type:'AI',       power:80, pp:10}},
    {lv:1,  move:{name:'Pattern Break', type:'AI',       power:90, pp:8}},
    {lv:44, move:{name:'Precognition',  type:'AI',       power:0,  pp:10, effect:'atk+2'}},
    {lv:60, move:{name:'Omnisight',     type:'AI',       power:120,pp:4}},
  ],
};
SPECIES.Omnimind = {
  type1:'AI', baseHp:72, baseAtk:32, baseDef:18, baseSpd:22,
  catchRate:0, xpYield:220,
  learnset:[
    {lv:1,  move:{name:'Omnisight',     type:'AI',       power:120,pp:4}},
    {lv:1,  move:{name:'Neural Override',type:'AI',      power:130,pp:4}},
    {lv:50, move:{name:'Omniscience',   type:'AI',       power:0,  pp:8, effect:'atk+3'}},
    {lv:62, move:{name:'Total Mind',    type:'AI',       power:140,pp:3}},
  ],
};

// ── Champion extras ───────────────────────────────────────────
SPECIES.Nexarion = {
  type1:'Search', type2:'AI', baseHp:80, baseAtk:35, baseDef:25, baseSpd:28,
  catchRate:0, xpYield:255,
  learnset:[
    {lv:1,  move:{name:'Nexus Strike',  type:'Search',   power:90, pp:8}},
    {lv:1,  move:{name:'Total Mind',    type:'AI',       power:140,pp:3}},
    {lv:52, move:{name:'Web of Knowledge',type:'Search', power:0,  pp:8, effect:'atk+2'}},
    {lv:64, move:{name:'Index Roar',    type:'Search',   power:130,pp:4}},
    {lv:70, move:{name:'Grand Nexus',   type:'Search',   power:150,pp:3}},
  ],
};
SPECIES.Nullbyte = {
  type1:'Virus', type2:'AI', baseHp:90, baseAtk:38, baseDef:28, baseSpd:30,
  catchRate:0, xpYield:0,
  learnset:[
    {lv:1,  move:{name:'Null Strike',    type:'Virus',    power:80, pp:10}},
    {lv:1,  move:{name:'System Erase',   type:'Data',     power:90, pp:8}},
    {lv:50, move:{name:'Index Collapse', type:'Virus',    power:0,  pp:6, effect:'atk+3'}},
    {lv:60, move:{name:'Total Null',     type:'Virus',    power:150,pp:3}},
  ],
};

// ── Deep Web species — postgame encounters ────────────────────
SPECIES.Cookiepie = {
  type1:'Data', baseHp:62, baseAtk:22, baseDef:18, baseSpd:20,
  catchRate:30, xpYield:180,
  learnset:[
    {lv:1,  move:{name:'Cookie Crumble', type:'Data',   power:40, pp:25}},
    {lv:35, move:{name:'Cache Clear',    type:'Data',   power:65, pp:15}},
    {lv:55, move:{name:'Data Feast',     type:'Data',   power:85, pp:10}},
    {lv:65, move:{name:'Expire',         type:'Data',   power:0,  pp:8, effect:'def+2'}},
  ],
};
SPECIES.Querymew = {
  type1:'Search', baseHp:58, baseAtk:28, baseDef:15, baseSpd:34,
  catchRate:20, xpYield:200,
  learnset:[
    {lv:1,  move:{name:'Query Strike',     type:'Search', power:50, pp:20}},
    {lv:40, move:{name:'Lost Signal',      type:'Search', power:70, pp:12}},
    {lv:58, move:{name:'Forgotten Search', type:'Search', power:90, pp:8}},
    {lv:68, move:{name:'Ghost Query',      type:'Search', power:110,pp:5}},
  ],
};
SPECIES.Memorix = {
  type1:'Data', baseHp:70, baseAtk:25, baseDef:25, baseSpd:22,
  catchRate:22, xpYield:195,
  learnset:[
    {lv:1,  move:{name:'Memory Pulse',   type:'Data',   power:45, pp:22}},
    {lv:38, move:{name:'Recall Strike',  type:'Data',   power:70, pp:12}},
    {lv:55, move:{name:'Fragment Burst', type:'Data',   power:90, pp:8}},
    {lv:65, move:{name:'Deep Archive',   type:'Data',   power:0,  pp:8, effect:'atk+2'}},
  ],
};
SPECIES.Archivus = {
  type1:'Data', baseHp:78, baseAtk:22, baseDef:38, baseSpd:14,
  catchRate:15, xpYield:215,
  learnset:[
    {lv:1,  move:{name:'Archive Strike', type:'Data',   power:50, pp:18}},
    {lv:42, move:{name:'Index Lock',     type:'Data',   power:75, pp:10}},
    {lv:60, move:{name:'Fossil Record',  type:'Data',   power:0,  pp:8, effect:'def+3'}},
    {lv:68, move:{name:'Ancient Data',   type:'Data',   power:100,pp:6}},
  ],
};
SPECIES.Bookmarkle = {
  type1:'Search', type2:'Data', baseHp:82, baseAtk:32, baseDef:28, baseSpd:30,
  catchRate:3, xpYield:300,
  learnset:[
    {lv:1,  move:{name:'Saved Strike',  type:'Search', power:70,  pp:15}},
    {lv:1,  move:{name:'Bookmark Beam', type:'Data',   power:80,  pp:10}},
    {lv:60, move:{name:'First Page',    type:'Search', power:0,   pp:8, effect:'atk+3'}},
    {lv:70, move:{name:'Index Eternal', type:'Search', power:130, pp:4}},
  ],
};
