import React, { useState } from 'react';
import useBracket from './hooks/useBracket';
import RegionBracket from './components/RegionBracket';
import FinalFour from './components/FinalFour';
import TeamSlot from './components/TeamSlot';

const REGION_COLOR = {
  East:'var(--region-east)', South:'var(--region-south)',
  Midwest:'var(--region-midwest)', West:'var(--region-west)',
};

// ── Play-In Modal ──────────────────────────────────────────────────────────
function PlayInModal({ playinSeeds, teams, getPred, playinWinners, setPlayinWinners, onClose }) {
  const games = Object.entries(playinSeeds ?? {});
  const baseNames = { X16:'South 16 Seed', Y11:'Midwest 11 Seed', Y16:'Midwest 16 Seed', Z11:'West 11 Seed' };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000,
    }}>
      <div style={{
        background:'var(--surface)', border:'1px solid var(--border-hi)',
        borderRadius:12, padding:28, width:420, maxWidth:'95vw',
        boxShadow:'0 20px 60px rgba(0,0,0,0.8)',
      }}>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:20,
                      color:'var(--gold)', letterSpacing:1, marginBottom:4 }}>
          PLAY-IN GAMES
        </div>
        <div style={{ color:'var(--text-muted)', fontSize:12, marginBottom:20 }}>
          Select the winner of each First Four game
        </div>

        {games.map(([base, pair]) => {
          const [t1, t2] = pair;
          const prob = getPred(t1, t2);
          const winner = playinWinners[base];
          return (
            <div key={base} style={{
              marginBottom:16, padding:'12px 14px',
              background:'var(--surface2)', borderRadius:8,
              border: winner ? '1px solid var(--border-hi)' : '1px solid var(--border)',
            }}>
              <div style={{ fontSize:11, color:'var(--gold)', fontWeight:700,
                            fontFamily:'var(--font-display)', letterSpacing:1, marginBottom:8 }}>
                {baseNames[base] ?? base}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {[t1,t2].map((tid, i) => {
                  const t = teams[tid];
                  if (!t) return null;
                  const pWin = i===0 ? prob : 1-prob;
                  const isWon = winner === tid;
                  return (
                    <button key={tid} onClick={() => setPlayinWinners(p => ({...p, [base]: tid}))}
                      style={{
                        flex:1, padding:'8px 10px', borderRadius:6, cursor:'pointer',
                        background: isWon ? `${REGION_COLOR[t.region]}22` : 'var(--surface)',
                        border: isWon ? `2px solid ${REGION_COLOR[t.region]}88` : '1px solid var(--border)',
                        textAlign:'left', outline:'none',
                        transition:'all 0.15s',
                      }}>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'var(--text)' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                        #{t.seedNum} · Model: {Math.round(pWin*100)}%
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button onClick={onClose} style={{
          width:'100%', marginTop:8, padding:'10px', borderRadius:6,
          background:'var(--accent)', border:'none', color:'white',
          fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, cursor:'pointer',
          letterSpacing:1,
        }}>
          CONTINUE TO BRACKET →
        </button>
      </div>
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────
function Header({ onAutoAdvance, onReset, onPlayIn, champName, champSeed }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:16,
      padding:'12px 24px', background:'var(--surface)',
      borderBottom:'1px solid var(--border)',
      position:'sticky', top:0, zIndex:100,
    }}>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:400, fontSize:34,
                      color:'var(--text)', letterSpacing:2 }}>
          2026 NCAA TOURNAMENT
        </div>
        <div style={{ fontSize:14, color:'var(--text-muted)', letterSpacing:2, fontFamily:'var(--font-body)', fontWeight:600 }}>
          MARCH MADNESS PREDICTION MODEL
        </div>
      </div>

      {champName && (
        <div style={{ textAlign:'center', padding:'4px 14px', background:'var(--gold-dim)',
                      border:'1px solid var(--gold)44', borderRadius:6 }}>
          <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>🏆 PROJECTED CHAMPION</div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, color:'var(--gold)' }}>
            {champName}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onPlayIn} style={btnStyle('var(--gold)')}>
          PLAY-IN GAMES
        </button>
        <button onClick={onAutoAdvance} style={btnStyle('var(--accent)')}>
          ⚡ AUTO-ADVANCE MODEL
        </button>
        <button onClick={onReset} style={btnStyle('var(--border-hi)', 'var(--text-muted)')}>
          RESET
        </button>
      </div>
    </div>
  );
}

function btnStyle(bg, color='white') {
  return {
    padding:'7px 14px', borderRadius:5, border:'none',
    background:bg, color, cursor:'pointer',
    fontFamily:'var(--font-display)', fontWeight:700, fontSize:13,
    letterSpacing:0.8, transition:'opacity 0.15s', outline:'none',
  };
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const bracket = useBracket();
  const {
    data, loading, error, teams, predictions, getPred, teamStats, matchupDiffs,
    r64Bracket, r64Winners, r32Winners, s16Winners, e8Winners, f4Winners, champion,
    playinWinners, setPlayinWinners,
    advanceTeam, removeWinner, autoAdvance, reset,
  } = bracket;

  const [showPlayIn, setShowPlayIn] = useState(false);

  // Wrap advanceTeam for FinalFour's special keys
  const handleAdvance = (round, rc, idx, teamId) => {
    if (round === 'E8' && rc === 'W_X') {
      // F4 semi 0
      advanceTeam('F4', null, 0, teamId);
    } else if (round === 'E8' && rc === 'Y_Z') {
      // F4 semi 1
      advanceTeam('F4', null, 1, teamId);
    } else if (round === 'F4') {
      advanceTeam('NCG', null, null, teamId);
    } else {
      advanceTeam(round, rc, idx, teamId);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  height:'100vh', flexDirection:'column', gap:12 }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900,
                    color:'var(--accent)', letterSpacing:2 }}>
        LOADING BRACKET
      </div>
      <div style={{ color:'var(--text-muted)', fontSize:13 }}>Fetching model predictions…</div>
    </div>
  );

  if (error) return (
    <div style={{ padding:40, color:'var(--red)' }}>
      Error: {error}
      <div style={{ marginTop:8, fontSize:12, color:'var(--text-muted)' }}>
        Make sure the FastAPI backend is running on port 8000.
      </div>
    </div>
  );

  const champTeam = champion ? teams[champion] : null;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Header
        onAutoAdvance={autoAdvance}
        onReset={reset}
        onPlayIn={() => setShowPlayIn(true)}
        champName={champTeam?.name}
        champSeed={champTeam?.seedNum}
      />

      {showPlayIn && (
        <PlayInModal
          playinSeeds={data?.playinSeeds}
          teams={teams}
          getPred={getPred}
          playinWinners={playinWinners}
          setPlayinWinners={setPlayinWinners}
          onClose={() => setShowPlayIn(false)}
        />
      )}

      {/* Main Bracket Layout */}
      <div style={{
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        padding:'24px 16px', gap:0,
        overflowX:'auto', minWidth:'max-content',
      }}>

        {/* LEFT SIDE: East (W) top, Midwest (Y) bottom — mirrored */}
        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
          <RegionBracket rc="W" regionName="East"
            r64Bracket={r64Bracket} r64Winners={r64Winners}
            r32Winners={r32Winners} s16Winners={s16Winners}
            e8Winner={e8Winners['W']}
            playinWinners={playinWinners}
            teams={teams} predictions={predictions} getPred={getPred}
            teamStats={teamStats} matchupDiffs={matchupDiffs}
            advanceTeam={advanceTeam} removeWinner={removeWinner} side="right"
          />
          <RegionBracket rc="Y" regionName="Midwest"
            r64Bracket={r64Bracket} r64Winners={r64Winners}
            r32Winners={r32Winners} s16Winners={s16Winners}
            e8Winner={e8Winners['Y']}
            playinWinners={playinWinners}
            teams={teams} predictions={predictions} getPred={getPred}
            teamStats={teamStats} matchupDiffs={matchupDiffs}
            advanceTeam={advanceTeam} removeWinner={removeWinner} side="right"
          />
        </div>

        {/* CENTER: Final Four */}
        <div style={{ flexShrink:0, display:'flex', alignItems:'center',
                      minHeight:900, paddingTop:40 }}>
          <FinalFour
            e8Winners={e8Winners}
            f4Winners={f4Winners}
            champion={champion}
            teams={teams} predictions={predictions} getPred={getPred}
            teamStats={teamStats} matchupDiffs={matchupDiffs}
            advanceTeam={handleAdvance} removeWinner={removeWinner}
          />
        </div>

        {/* RIGHT SIDE: South (X) top, West (Z) bottom — mirrored */}
        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
          <RegionBracket rc="X" regionName="South"
            r64Bracket={r64Bracket} r64Winners={r64Winners}
            r32Winners={r32Winners} s16Winners={s16Winners}
            e8Winner={e8Winners['X']}
            playinWinners={playinWinners}
            teams={teams} predictions={predictions} getPred={getPred}
            teamStats={teamStats} matchupDiffs={matchupDiffs}
            advanceTeam={advanceTeam} removeWinner={removeWinner} side="left"
          />
          <RegionBracket rc="Z" regionName="West"
            r64Bracket={r64Bracket} r64Winners={r64Winners}
            r32Winners={r32Winners} s16Winners={s16Winners}
            e8Winner={e8Winners['Z']}
            playinWinners={playinWinners}
            teams={teams} predictions={predictions} getPred={getPred}
            teamStats={teamStats} matchupDiffs={matchupDiffs}
            advanceTeam={advanceTeam} removeWinner={removeWinner} side="left"
          />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, padding:'0 24px 24px', justifyContent:'center',
                    flexWrap:'wrap', fontSize:11, color:'var(--text-muted)' }}>
        {[['East','var(--region-east)'],['South','var(--region-south)'],
          ['Midwest','var(--region-midwest)'],['West','var(--region-west)']].map(([r,c]) => (
          <div key={r} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:c }} />
            {r}
          </div>
        ))}
        <div style={{ color:'var(--text-dim)' }}>· Hover teams to see model card · Click to advance</div>
      </div>
    </div>
  );
}
