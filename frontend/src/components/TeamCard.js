import React from 'react';

const REGION_COLOR = {
  East: 'var(--region-east)', South: 'var(--region-south)',
  Midwest: 'var(--region-midwest)', West: 'var(--region-west)',
};

// [label, diffKey, higherIsBetter, formatFn]
// Massey: lower rank number = better team, so negative diff = this team is better → higherIsBetter=false
const STAT_ROWS = [
  ['ELO Rating',       'EloDiff',                  true,  v => Math.round(Math.abs(v))],
  ['Massey Rank',      'MasseyMedianDiff',          true,  v => Math.round(Math.abs(v))],  // Higher Massey score = better team
  ['Off Efficiency',   'Season_AvgOffEff_Diff',     true,  v => Math.abs(v).toFixed(1)],
  ['Def Efficiency',   'Season_AvgDefEff_Diff',     false, v => Math.abs(v).toFixed(1)],
  ['Eff Margin',       'Season_EffMargin_Diff',     true,  v => Math.abs(v).toFixed(1)],
  ['eFG%',             'Season_EFG_Diff',           true,  v => (Math.abs(v)*100).toFixed(1)+'%'],
  ['Turnover Rate',    'Season_TOR_Diff',           false, v => (Math.abs(v)*100).toFixed(1)+'%'],
  ['3PT Rate',         'Season_3PR_Diff',           true,  v => (Math.abs(v)*100).toFixed(1)+'%'],
  ['FT Rate',          'Season_FTR_Diff',           true,  v => (Math.abs(v)*100).toFixed(1)+'%'],
  ['Coach Tourney W%', 'Coach_TourneyWinRate_Diff', true,  v => (Math.abs(v)*100).toFixed(1)+'%'],
  ['Last 10 Margin',   'Last10_AvgMargin_Diff',     true,  v => Math.abs(v).toFixed(1)],
];

// Normalizers per stat so bars look proportional
const NORM = {
  EloDiff: 400, MasseyMedianDiff: 200, Season_AvgOffEff_Diff: 15,
  Season_AvgDefEff_Diff: 15, Season_EffMargin_Diff: 20, Season_EFG_Diff: 0.08,
  Season_TOR_Diff: 0.06, Season_3PR_Diff: 0.12, Season_FTR_Diff: 0.12,
  Coach_TourneyWinRate_Diff: 0.3, Last10_AvgMargin_Diff: 15,
};

function StatRow({ label, diffKey, higherIsBetter, fmt, teamDiff }) {
  if (teamDiff == null) return null;
  // positive teamDiff = team is "more" on this stat
  const teamAdv  = higherIsBetter ? teamDiff > 0 : teamDiff < 0;
  const oppAdv   = higherIsBetter ? teamDiff < 0 : teamDiff > 0;
  const norm     = NORM[diffKey] ?? 20;
  const barPct   = Math.min(Math.abs(teamDiff) / norm, 1) * 100;
  const dispVal  = Math.abs(teamDiff) < 0.0001 ? null : fmt(teamDiff);

  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:6, alignItems:'center', marginBottom:3 }}>
        {/* Team side */}
        <div style={{ textAlign:'right', fontFamily:'var(--font-display)', fontSize:14,
                      fontWeight:400, color: teamAdv ? 'var(--green)' : 'var(--text-dim)', letterSpacing:0.5 }}>
          {teamAdv && dispVal ? dispVal : ''}
        </div>
        {/* Label */}
        <div style={{ color:'var(--text-muted)', fontSize:11, textAlign:'center',
                      fontFamily:'var(--font-body)', fontWeight:600, letterSpacing:0.5,
                      whiteSpace:'nowrap' }}>
          {label}
        </div>
        {/* Opponent side */}
        <div style={{ textAlign:'left', fontFamily:'var(--font-display)', fontSize:14,
                      fontWeight:400, color: oppAdv ? 'var(--green)' : 'var(--text-dim)', letterSpacing:0.5 }}>
          {oppAdv && dispVal ? dispVal : ''}
        </div>
      </div>
      {/* Bar */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2px 1fr', gap:0, height:5 }}>
        <div style={{ display:'flex', justifyContent:'flex-end', background:'transparent' }}>
          <div style={{ height:'100%', width: oppAdv ? `${barPct}%` : '0%',
                        background:'var(--red)', borderRadius:'3px 0 0 3px', opacity:0.85 }}/>
        </div>
        <div style={{ background:'var(--border-hi)', height:'100%' }}/>
        <div style={{ display:'flex', justifyContent:'flex-start' }}>
          <div style={{ height:'100%', width: teamAdv ? `${barPct}%` : '0%',
                        background:'var(--green)', borderRadius:'0 3px 3px 0', opacity:0.85 }}/>
        </div>
      </div>
    </div>
  );
}

export default function TeamCard({ team, opponent, getPred, teamStats, matchupDiffs, placement }) {
  if (!team) return null;

  const rc    = REGION_COLOR[team.region] ?? 'var(--accent)';
  const vs    = opponent ? getPred(team.id, opponent.id) : null;
  const isFav = vs != null && vs >= 0.5;

  const lo   = Math.min(team.id, opponent?.id ?? Infinity);
  const hi   = Math.max(team.id, opponent?.id ?? 0);
  const key  = opponent ? `${lo}_${hi}` : null;
  const diffs = key ? (matchupDiffs?.[key] ?? {}) : {};
  const isLo  = team.id === lo;
  const ts    = teamStats?.[String(team.id)] ?? {};

  const style = {
    position:'fixed', zIndex:2000, width:300, pointerEvents:'none',
    left: placement.left, top: placement.top,
    transform: placement.showBelow ? 'none' : 'translateY(-100%)',
  };

  const hasStats = opponent && Object.keys(diffs).length > 0;

  return (
    <div style={style}>
      <div style={{
        background: `linear-gradient(160deg, var(--surface2) 0%, var(--surface3) 100%)`,
        border:`1px solid ${rc}55`,
        borderTop:`4px solid ${rc}`,
        borderRadius:10,
        padding:'14px 16px',
        boxShadow:`0 16px 48px rgba(0,0,0,0.8), 0 0 0 1px var(--border), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{
            minWidth:44, height:44, borderRadius:8,
            background:`linear-gradient(135deg, ${rc}33, ${rc}11)`,
            border:`1px solid ${rc}66`,
            boxShadow:`0 0 16px ${rc}33`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-display)', fontSize:26, color:rc,
          }}>{team.seedNum}</div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:24, color:'var(--text)',
                          letterSpacing:1.5, lineHeight:1 }}>{team.name.toUpperCase()}</div>
            <div style={{ color:'var(--text-muted)', fontSize:12, fontFamily:'var(--font-body)',
                          fontWeight:600, letterSpacing:0.5, marginTop:2 }}>
              {team.region.toUpperCase()} REGION
              {team.isPlayIn && <span style={{color:'var(--gold)', marginLeft:6}}>· PLAY-IN</span>}
            </div>
          </div>
        </div>

        {/* Coach + ELO */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
          {[
            ['COACH', team.coach, 'var(--text)'],
            ['ELO',   ts.elo ?? '—', 'var(--accent)'],
          ].map(([label, val, color]) => (
            <div key={label} style={{
              padding:'6px 10px', borderRadius:6,
              background:'var(--surface)', border:'1px solid var(--border)',
            }}>
              <div style={{ color:'var(--text-dim)', fontSize:10, fontWeight:700,
                            letterSpacing:1.2, fontFamily:'var(--font-body)' }}>{label}</div>
              <div style={{ color, fontSize:15, fontFamily:'var(--font-display)',
                            letterSpacing:0.5, marginTop:2 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Win prob */}
        {opponent && vs != null && (
          <div style={{
            marginBottom:12, padding:'10px 12px',
            background: isFav ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            border:`1px solid ${isFav ? 'var(--green)' : 'var(--red)'}44`,
            borderRadius:8,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ color:'var(--text-muted)', fontSize:12, fontFamily:'var(--font-body)', fontWeight:600 }}>
                vs <b style={{color:'var(--text)'}}>{opponent.name}</b>
              </span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:28, letterSpacing:1,
                             color: isFav ? 'var(--green)' : 'var(--red)', lineHeight:1 }}>
                {Math.round(vs*100)}%
              </span>
            </div>
            <div style={{ background:'var(--border)', borderRadius:4, height:7, overflow:'hidden' }}>
              <div style={{ width:`${Math.round(vs*100)}%`, height:'100%', borderRadius:4,
                            background: isFav
                              ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                              : 'linear-gradient(90deg, #b91c1c, #ef4444)' }}/>
            </div>
            <div style={{ marginTop:5, fontFamily:'var(--font-display)', fontSize:13, letterSpacing:1.5,
                          color: isFav ? 'var(--green)' : 'var(--red)' }}>
              {isFav ? '▲ MODEL FAVORITE' : '▼ MODEL UNDERDOG'}
            </div>
          </div>
        )}

        {/* Stat comparison */}
        {hasStats && (
          <>
            {/* Column headers */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:6,
                          marginBottom:8, paddingBottom:6, borderBottom:'1px solid var(--border)' }}>
              <div style={{ textAlign:'right', fontFamily:'var(--font-display)', fontSize:13,
                            letterSpacing:1, color:rc, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {team.name.toUpperCase()}
              </div>
              <div style={{ color:'var(--text-dim)', fontSize:10, fontWeight:700,
                            fontFamily:'var(--font-body)', letterSpacing:0.8, textAlign:'center',
                            minWidth:80 }}>EDGE</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, letterSpacing:1,
                            color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {opponent.name.toUpperCase()}
              </div>
            </div>

            {STAT_ROWS.map(([label, diffKey, higher, fmt]) => {
              const raw = diffs[diffKey];
              if (raw == null) return null;
              const teamDiff = isLo ? raw : -raw;
              return (
                <StatRow key={diffKey} label={label} diffKey={diffKey}
                  higherIsBetter={higher} fmt={fmt} teamDiff={teamDiff} />
              );
            })}
          </>
        )}

        <div style={{ marginTop:10, fontSize:11, color:'var(--text-dim)', textAlign:'center',
                      fontFamily:'var(--font-body)', letterSpacing:0.5 }}>
          Click to advance · Click again to undo
        </div>
      </div>
    </div>
  );
}
