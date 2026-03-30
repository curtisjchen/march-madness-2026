import React from 'react';
import TeamSlot from './TeamSlot';

export default function FinalFour({
  e8Winners, f4Winners, champion,
  teams, predictions, getPred, teamStats, matchupDiffs, advanceTeam, removeWinner,
}) {
  // Semi 0: E8 winners of W (East) vs X (South)
  // Semi 1: E8 winners of Y (Midwest) vs Z (West)
  const semi0top = e8Winners['W'] ?? null;
  const semi0bot = e8Winners['X'] ?? null;
  const semi1top = e8Winners['Y'] ?? null;
  const semi1bot = e8Winners['Z'] ?? null;

  const f4_0 = f4Winners[0] ?? null;
  const f4_1 = f4Winners[1] ?? null;

  const slotStyle = {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8,
  };

  const labelStyle = {
    fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 700,
    letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 4,
  };

  const champSlot = {
    display: 'flex', flexDirection: 'column', alignItems:'center',
    gap: 6, padding: '16px 0',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 24, padding:'0 var(--round-gap)' }}>

      {/* Title */}
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:11, fontFamily:'var(--font-display)', fontWeight:800,
                      letterSpacing:2, color:'var(--gold)', marginBottom:2 }}>
          FINAL FOUR
        </div>
        <div style={{ fontSize:10, color:'var(--text-dim)' }}>San Antonio, TX</div>
      </div>

      {/* Top semi */}
      <div style={slotStyle}>
        <div style={labelStyle}>EAST vs SOUTH</div>
        <TeamSlot teamId={semi0top} opponentId={semi0bot}
          teams={teams} predictions={predictions} getPred={getPred}
          teamStats={teamStats} matchupDiffs={matchupDiffs}
          isWinner={f4_0 === semi0top} isEliminated={f4_0 && f4_0 !== semi0top}
          onAdvance={semi0top ? () => advanceTeam('E8', 'W_X', 0, semi0top) : null}
          onRemove={f4_0 === semi0top ? () => removeWinner('F4', null, 0) : null}
          position="right"
        />
        <TeamSlot teamId={semi0bot} opponentId={semi0top}
          teams={teams} predictions={predictions} getPred={getPred}
          teamStats={teamStats} matchupDiffs={matchupDiffs}
          isWinner={f4_0 === semi0bot} isEliminated={f4_0 && f4_0 !== semi0bot}
          onAdvance={semi0bot ? () => advanceTeam('E8', 'W_X', 0, semi0bot) : null}
          onRemove={f4_0 === semi0bot ? () => removeWinner('F4', null, 0) : null}
          position="right"
        />
      </div>

      {/* Champ game */}
      <div style={champSlot}>
        <div style={{
          fontSize: 16, fontFamily:'var(--font-display)', fontWeight:400,
          letterSpacing: 3, color:'var(--gold)',
          padding: '5px 14px', border:'1px solid var(--gold)',
          borderRadius: 4, marginBottom: 4,
        }}>
          NATIONAL CHAMPIONSHIP
        </div>
        <TeamSlot teamId={f4_0} opponentId={f4_1}
          teams={teams} predictions={predictions} getPred={getPred}
          teamStats={teamStats} matchupDiffs={matchupDiffs}
          isWinner={champion === f4_0} isEliminated={champion && champion !== f4_0}
          onAdvance={f4_0 ? () => advanceTeam('F4', null, 0, f4_0) : null}
          onRemove={champion === f4_0 ? () => removeWinner('NCG') : null}
          position="right"
        />
        <TeamSlot teamId={f4_1} opponentId={f4_0}
          teams={teams} predictions={predictions} getPred={getPred}
          teamStats={teamStats} matchupDiffs={matchupDiffs}
          isWinner={champion === f4_1} isEliminated={champion && champion !== f4_1}
          onAdvance={f4_1 ? () => advanceTeam('F4', null, 1, f4_1) : null}
          onRemove={champion === f4_1 ? () => removeWinner('NCG') : null}
          position="left"
        />

        {champion && (
          <div style={{ marginTop:12, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--gold)', fontWeight:600, marginBottom:4 }}>🏆 CHAMPION</div>
            <div style={{
              fontFamily:'var(--font-display)', fontWeight:900,
              fontSize:20, color:'var(--gold)',
              textShadow:'0 0 20px var(--gold)',
            }}>
              {teams[champion]?.name}
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
              #{teams[champion]?.seedNum} Seed · {teams[champion]?.region}
            </div>
          </div>
        )}
      </div>

      {/* Bottom semi */}
      <div style={slotStyle}>
        <div style={labelStyle}>MIDWEST vs WEST</div>
        <TeamSlot teamId={semi1top} opponentId={semi1bot}
          teams={teams} predictions={predictions} getPred={getPred}
          teamStats={teamStats} matchupDiffs={matchupDiffs}
          isWinner={f4_1 === semi1top} isEliminated={f4_1 && f4_1 !== semi1top}
          onAdvance={semi1top ? () => advanceTeam('E8', 'Y_Z', 1, semi1top) : null}
          onRemove={f4_1 === semi1top ? () => removeWinner('F4', null, 1) : null}
          position="left"
        />
        <TeamSlot teamId={semi1bot} opponentId={semi1top}
          teams={teams} predictions={predictions} getPred={getPred}
          teamStats={teamStats} matchupDiffs={matchupDiffs}
          isWinner={f4_1 === semi1bot} isEliminated={f4_1 && f4_1 !== semi1bot}
          onAdvance={semi1bot ? () => advanceTeam('E8', 'Y_Z', 1, semi1bot) : null}
          onRemove={f4_1 === semi1bot ? () => removeWinner('F4', null, 1) : null}
          position="left"
        />
      </div>
    </div>
  );
}
