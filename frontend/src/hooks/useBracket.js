import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Bracket structure ──────────────────────────────────────────────────────
// Regions: W=East  X=South  Y=Midwest  Z=West
// Round64 matchups in visual top-to-bottom order per region
const REGION_MATCHUPS = {
  W: [['W01','W16'],['W08','W09'],['W05','W12'],['W04','W13'],
      ['W06','W11'],['W03','W14'],['W07','W10'],['W02','W15']],
  X: [['X01','X16'],['X08','X09'],['X05','X12'],['X04','X13'],
      ['X06','X11'],['X03','X14'],['X07','X10'],['X02','X15']],
  Y: [['Y01','Y16'],['Y08','Y09'],['Y05','Y12'],['Y04','Y13'],
      ['Y06','Y11'],['Y03','Y14'],['Y07','Y10'],['Y02','Y15']],
  Z: [['Z01','Z16'],['Z08','Z09'],['Z05','Z12'],['Z04','Z13'],
      ['Z06','Z11'],['Z03','Z14'],['Z07','Z10'],['Z02','Z15']],
};

// Play-in base seed → [teamA, teamB]  (resolved at load time from seedToId)
const PLAYIN_BASES = ['X16','Y11','Y16','Z11'];

export const ROUND_NAMES = ['R64','R32','S16','E8','F4','NCG'];
export const ROUND_LABELS = {
  R64: 'Round of 64', R32: 'Round of 32',
  S16: 'Sweet 16',   E8:  'Elite 8',
  F4:  'Final Four', NCG: 'Championship',
};

// ─── Prediction lookup ────────────────────────────────────────────────────
export function getPred(predictions, t1, t2) {
  if (!t1 || !t2 || t1 === t2) return 0.5;
  const [a, b] = t1 < t2 ? [t1, t2] : [t2, t1];
  const p = predictions[`${a}_${b}`] ?? 0.5;
  return t1 === a ? p : 1 - p;
}

// ─── Build initial R64 bracket from seed→team mapping ───────────────────
function buildInitialR64(seedToId, playinSeeds) {
  // playinSeeds: { 'X16': [1250,1341], 'Y11': [1275,1374], ... }
  const resolve = (seedCode) => {
    if (playinSeeds[seedCode]) return null; // play-in TBD until resolved
    return seedToId[seedCode] ?? null;
  };

  const regions = {};
  for (const [rc, matchups] of Object.entries(REGION_MATCHUPS)) {
    regions[rc] = matchups.map(([sA, sB]) => {
      const baseA = sA.replace(/[ab]$/i, '');
      const baseB = sB.replace(/[ab]$/i, '');
      return {
        top: playinSeeds[baseA] ? null : (seedToId[sA] ?? null),
        bot: playinSeeds[baseB] ? null : (seedToId[sB] ?? null),
        topSeed: sA, botSeed: sB,
        topPlayin: !!playinSeeds[baseA],
        botPlayin: !!playinSeeds[baseB],
      };
    });
  }
  return regions;
}

// ─── Main hook ───────────────────────────────────────────────────────────
export default function useBracket() {
  const [data, setData]           = useState(null);   // { teams, seedToId, playinSeeds }
  const [predictions, setPreds]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // winners[round][region][slot]  = teamId
  //   round: 'R64'=slot is matchup pair, others = winner of that slot
  // Flat representation: winners[round_region_slot] = teamId
  // We store per-round per-region arrays for simplicity:
  //   r64Winners[region][matchupIdx]  = winning teamId  (click to advance)
  //   r32Winners[region][slotIdx]     = teamId (0..3)
  //   s16Winners[region][slotIdx]     = teamId (0..1)
  //   e8Winners[region]               = teamId
  //   f4Winners[semiFinalIdx]         = teamId  (0: W vs X winner, 1: Y vs Z winner)
  //   champion                        = teamId
  const [r64Winners, setR64Winners] = useState({});   // {rc: [t,t,t,t,t,t,t,t]}
  const [r32Winners, setR32Winners] = useState({});
  const [s16Winners, setS16Winners] = useState({});
  const [e8Winners,  setE8Winners]  = useState({});   // {rc: teamId}
  const [f4Winners,  setF4Winners]  = useState([null, null]); // [WX,YZ]
  const [champion,   setChampion]   = useState(null);
  const [r64Bracket, setR64Bracket] = useState({});   // base matchup structure

  // Play-in winners: { 'X16': teamId, 'Y11': teamId, ... }
  const [playinWinners, setPlayinWinners] = useState({});
  const [teamStats, setTeamStats]         = useState({});
  const [matchupDiffs, setMatchupDiffs]   = useState({});

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [bracketRes, statsRes] = await Promise.all([
          fetch('/bracket_data.json'),
          fetch('/team_stats.json').catch(() => null),
        ]);
        const raw = await bracketRes.json();
        const playinSeeds = {};
        for (const [seed, tid] of Object.entries(raw.seedToId ?? {})) {
          if (seed.length > 3) {
            const base = seed.slice(0, 3);
            playinSeeds[base] = playinSeeds[base] ?? [];
            playinSeeds[base].push(tid);
          }
        }
        const d = { teams: raw.teams, seedToId: raw.seedToId, playinSeeds, predictions: raw.predictions };
        setData(d);
        setPreds(d.predictions ?? {});

        if (statsRes?.ok) {
          const stats = await statsRes.json();
          setTeamStats(stats.teamStats ?? {});
          setMatchupDiffs(stats.matchupDiffs ?? {});
        }

        const bracket = buildInitialR64(d.seedToId, d.playinSeeds ?? {});
        setR64Bracket(bracket);

        // Init empty winner arrays
        const emptyR64 = {}; Object.keys(bracket).forEach(rc => { emptyR64[rc] = Array(8).fill(null); });
        const emptyR32 = {}; Object.keys(bracket).forEach(rc => { emptyR32[rc] = Array(4).fill(null); });
        const emptyS16 = {}; Object.keys(bracket).forEach(rc => { emptyS16[rc] = Array(2).fill(null); });
        const emptyE8  = {}; Object.keys(bracket).forEach(rc => { emptyE8[rc]  = null; });
        setR64Winners(emptyR64);
        setR32Winners(emptyR32);
        setS16Winners(emptyS16);
        setE8Winners(emptyE8);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Helper: getTeamForSlot ──────────────────────────────────────────
  // Given round and position info, return the current teamId in that slot
  const getSlotTeam = useCallback((round, rc, idx) => {
    if (round === 'R64_top') {
      if (!r64Bracket[rc]) return null;
      const m = r64Bracket[rc][idx];
      if (!m) return null;
      if (m.topPlayin) {
        const base = m.topSeed.replace(/[ab]$/i,'');
        return playinWinners[base] ?? null;
      }
      return m.top;
    }
    if (round === 'R64_bot') {
      if (!r64Bracket[rc]) return null;
      const m = r64Bracket[rc][idx];
      if (!m) return null;
      if (m.botPlayin) {
        const base = m.botSeed.replace(/[ab]$/i,'');
        return playinWinners[base] ?? null;
      }
      return m.bot;
    }
    if (round === 'R64')  return r64Winners[rc]?.[idx] ?? null;
    if (round === 'R32')  return r32Winners[rc]?.[idx] ?? null;
    if (round === 'S16')  return s16Winners[rc]?.[idx] ?? null;
    if (round === 'E8')   return e8Winners[rc]  ?? null;
    if (round === 'F4')   return f4Winners[rc === 'WX' ? 0 : 1] ?? null;
    if (round === 'NCG')  return champion ?? null;
    return null;
  }, [r64Bracket, r64Winners, r32Winners, s16Winners, e8Winners, f4Winners, champion, playinWinners]);

  // ── Stale-closure fix: always read latest state via ref ──────────
  const stateRef = React.useRef({});
  stateRef.current = { r64Winners, r32Winners, s16Winners, e8Winners, f4Winners, champion };

  // ── Advance / de-advance ──────────────────────────────────────────
  const advanceTeam = useCallback((round, rc, matchupIdx, teamId) => {
    const { r64Winners, r32Winners, s16Winners, e8Winners, f4Winners } = stateRef.current;
    // round is the round BEING DECIDED (team advances FROM this round)
    const clear = (setter, rc2, from) => setter(prev => {
      const n = {...prev};
      if (rc2) {
        n[rc2] = [...(n[rc2]||[])];
        if (typeof from === 'number') n[rc2][from] = null;
        else n[rc2] = n[rc2].map(() => null);
      }
      return n;
    });

    // cascade-clear everything from a slot downward
    const cascadeClear = (fromRound, fromRc, fromIdx) => {
      if (fromRound === 'R64') {
        const r32slot = Math.floor(fromIdx / 2);
        setR32Winners(prev => { const n={...prev,[fromRc]:[...(prev[fromRc]||[])]}; n[fromRc][r32slot]=null; return n; });
        const s16slot = Math.floor(r32slot / 2);
        setS16Winners(prev => { const n={...prev,[fromRc]:[...(prev[fromRc]||[])]}; n[fromRc][s16slot]=null; return n; });
        setE8Winners(prev => ({...prev, [fromRc]: null}));
        setF4Winners(prev => { const n=[...prev]; n[(fromRc==='W'||fromRc==='X')?0:1]=null; return n; });
        setChampion(null);
      } else if (fromRound === 'R32') {
        const s16slot = Math.floor(fromIdx / 2);
        setS16Winners(prev => { const n={...prev,[fromRc]:[...(prev[fromRc]||[])]}; n[fromRc][s16slot]=null; return n; });
        setE8Winners(prev => ({...prev, [fromRc]: null}));
        setF4Winners(prev => { const n=[...prev]; n[(fromRc==='W'||fromRc==='X')?0:1]=null; return n; });
        setChampion(null);
      } else if (fromRound === 'S16') {
        setE8Winners(prev => ({...prev, [fromRc]: null}));
        setF4Winners(prev => { const n=[...prev]; n[(fromRc==='W'||fromRc==='X')?0:1]=null; return n; });
        setChampion(null);
      } else if (fromRound === 'E8') {
        setF4Winners(prev => { const n=[...prev]; n[(fromRc==='W'||fromRc==='X')?0:1]=null; return n; });
        setChampion(null);
      } else if (fromRound === 'F4') {
        setChampion(null);
      }
    };

    if (round === 'R64') {
      const already = r64Winners[rc]?.[matchupIdx] === teamId;
      setR64Winners(prev => {
        const n = {...prev, [rc]: [...(prev[rc]||[])]};
        n[rc][matchupIdx] = already ? null : teamId;
        return n;
      });
      cascadeClear('R64', rc, matchupIdx);
    } else if (round === 'R32') {
      const already = r32Winners[rc]?.[matchupIdx] === teamId;
      setR32Winners(prev => {
        const n = {...prev, [rc]: [...(prev[rc]||[])]};
        n[rc][matchupIdx] = already ? null : teamId;
        return n;
      });
      cascadeClear('R32', rc, matchupIdx);
    } else if (round === 'S16') {
      const already = s16Winners[rc]?.[matchupIdx] === teamId;
      setS16Winners(prev => {
        const n = {...prev, [rc]: [...(prev[rc]||[])]};
        n[rc][matchupIdx] = already ? null : teamId;
        return n;
      });
      cascadeClear('S16', rc, matchupIdx);
    } else if (round === 'E8') {
      const already = e8Winners[rc] === teamId;
      setE8Winners(prev => ({...prev, [rc]: already ? null : teamId}));
      cascadeClear('E8', rc, matchupIdx);
    } else if (round === 'F4') {
      const already = f4Winners[matchupIdx] === teamId;
      setF4Winners(prev => { const n=[...prev]; n[matchupIdx] = already ? null : teamId; return n; });
      cascadeClear('F4', null, matchupIdx);
    } else if (round === 'NCG') {
      setChampion(prev => prev === teamId ? null : teamId);
    }
  }, []);

  // ── Auto-advance entire bracket ────────────────────────────────────
  const autoAdvance = useCallback(() => {
    if (!data) return;
    const preds = predictions;

    const pick = (t1, t2) => {
      if (!t1 && !t2) return null;
      if (!t1) return t2;
      if (!t2) return t1;
      return getPred(preds, t1, t2) >= 0.5 ? t1 : t2;
    };

    // Play-in
    const piWinners = {};
    for (const base of PLAYIN_BASES) {
      const pair = data.playinSeeds?.[base];
      if (pair) piWinners[base] = pick(pair[0], pair[1]);
    }
    setPlayinWinners(piWinners);

    const getTeam = (rc, matchupIdx, side) => {
      const m = r64Bracket[rc]?.[matchupIdx];
      if (!m) return null;
      if (side === 'top') {
        if (m.topPlayin) return piWinners[m.topSeed.replace(/[ab]$/i,'')] ?? null;
        return m.top;
      }
      if (m.botPlayin) return piWinners[m.botSeed.replace(/[ab]$/i,'')] ?? null;
      return m.bot;
    };

    const newR64 = {}; const newR32 = {}; const newS16 = {}; const newE8 = {};
    for (const rc of Object.keys(r64Bracket)) {
      newR64[rc] = Array(8).fill(null);
      newR32[rc] = Array(4).fill(null);
      newS16[rc] = Array(2).fill(null);

      // R64
      for (let i=0; i<8; i++) {
        const t = getTeam(rc,i,'top'), b = getTeam(rc,i,'bot');
        newR64[rc][i] = pick(t, b);
      }
      // R32
      for (let i=0; i<4; i++) newR32[rc][i] = pick(newR64[rc][i*2], newR64[rc][i*2+1]);
      // S16
      for (let i=0; i<2; i++) newS16[rc][i] = pick(newR32[rc][i*2], newR32[rc][i*2+1]);
      // E8
      newE8[rc] = pick(newS16[rc][0], newS16[rc][1]);
    }

    const f4_0 = pick(newE8['W'], newE8['X']);
    const f4_1 = pick(newE8['Y'], newE8['Z']);
    const champ = pick(f4_0, f4_1);

    setR64Winners(newR64); setR32Winners(newR32);
    setS16Winners(newS16); setE8Winners(newE8);
    setF4Winners([f4_0, f4_1]); setChampion(champ);
  }, [data, predictions, r64Bracket]);

  // ── Reset ────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setPlayinWinners({});
    const emptyR64 = {}; const emptyR32 = {}; const emptyS16 = {}; const emptyE8 = {};
    Object.keys(r64Bracket).forEach(rc => {
      emptyR64[rc] = Array(8).fill(null);
      emptyR32[rc] = Array(4).fill(null);
      emptyS16[rc] = Array(2).fill(null);
      emptyE8[rc]  = null;
    });
    setR64Winners(emptyR64); setR32Winners(emptyR32);
    setS16Winners(emptyS16); setE8Winners(emptyE8);
    setF4Winners([null,null]); setChampion(null);
  }, [r64Bracket]);

  // ── Remove winner (X button) ─────────────────────────────────────
  const removeWinner = useCallback((round, rc, idx) => {
    const { r64Winners, r32Winners, s16Winners } = stateRef.current;
    const cascadeFrom = (fromRound, fromRc, fromIdx) => {
      if (fromRound === 'R64') {
        const r32slot = Math.floor(fromIdx / 2);
        setR32Winners(prev => { const n={...prev,[fromRc]:[...(prev[fromRc]||[])]}; n[fromRc][r32slot]=null; return n; });
        const s16slot = Math.floor(r32slot / 2);
        setS16Winners(prev => { const n={...prev,[fromRc]:[...(prev[fromRc]||[])]}; n[fromRc][s16slot]=null; return n; });
        setE8Winners(prev => ({...prev,[fromRc]:null}));
        setF4Winners(prev => { const n=[...prev]; n[(fromRc==='W'||fromRc==='X')?0:1]=null; return n; });
        setChampion(null);
      } else if (fromRound === 'R32') {
        const s16slot = Math.floor(fromIdx / 2);
        setS16Winners(prev => { const n={...prev,[fromRc]:[...(prev[fromRc]||[])]}; n[fromRc][s16slot]=null; return n; });
        setE8Winners(prev => ({...prev,[fromRc]:null}));
        setF4Winners(prev => { const n=[...prev]; n[(fromRc==='W'||fromRc==='X')?0:1]=null; return n; });
        setChampion(null);
      } else if (fromRound === 'S16') {
        setE8Winners(prev => ({...prev,[fromRc]:null}));
        setF4Winners(prev => { const n=[...prev]; n[(fromRc==='W'||fromRc==='X')?0:1]=null; return n; });
        setChampion(null);
      } else if (fromRound === 'E8') {
        setF4Winners(prev => { const n=[...prev]; n[(fromRc==='W'||fromRc==='X')?0:1]=null; return n; });
        setChampion(null);
      } else if (fromRound === 'F4') {
        setChampion(null);
      }
    };
    if (round === 'R64') { setR64Winners(prev => { const n={...prev,[rc]:[...(prev[rc]||[])]}; n[rc][idx]=null; return n; }); cascadeFrom('R64',rc,idx); }
    else if (round === 'R32') { setR32Winners(prev => { const n={...prev,[rc]:[...(prev[rc]||[])]}; n[rc][idx]=null; return n; }); cascadeFrom('R32',rc,idx); }
    else if (round === 'S16') { setS16Winners(prev => { const n={...prev,[rc]:[...(prev[rc]||[])]}; n[rc][idx]=null; return n; }); cascadeFrom('S16',rc,idx); }
    else if (round === 'E8')  { setE8Winners(prev => ({...prev,[rc]:null})); cascadeFrom('E8',rc,idx); }
    else if (round === 'F4')  { setF4Winners(prev => { const n=[...prev]; n[idx]=null; return n; }); cascadeFrom('F4',null,idx); }
    else if (round === 'NCG') { setChampion(null); }
  }, []);

  const teams = data?.teams ?? {};

  return {
    data, predictions, loading, error,
    teams, teamStats, matchupDiffs,
    r64Bracket, r64Winners, r32Winners, s16Winners, e8Winners, f4Winners, champion,
    playinWinners, setPlayinWinners,
    advanceTeam, removeWinner, autoAdvance, reset, getPred: (t1,t2) => getPred(predictions,t1,t2),
    getSlotTeam,
  };
}
