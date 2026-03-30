import React from 'react';
import Matchup from './Matchup';

const SLOT_H    = 48;
const MATCHUP_H = SLOT_H * 2 + 6;
const R64_GAP   = 10;
const STRIDE    = MATCHUP_H + R64_GAP; // 112

const R32_TOP0 = 56;
const R32_GAP2 = STRIDE * 2 - MATCHUP_H;   // 122
const S16_TOP0 = 168;
const S16_GAP2 = STRIDE * 4 - MATCHUP_H;   // 346
const E8_TOP   = 392;

export default function RegionBracket({
  rc, regionName,
  r64Bracket, r64Winners, r32Winners, s16Winners, e8Winner,
  playinWinners, teams, predictions, getPred, teamStats, matchupDiffs,
  advanceTeam, removeWinner, side = 'right',
}) {
  const matchups = r64Bracket[rc] ?? [];

  const resolveSlot = (m, which) => {
    if (!m) return null;
    if (which === 'top') {
      if (m.topPlayin) return playinWinners[m.topSeed?.replace(/[ab]$/i, '')] ?? null;
      return m.top;
    }
    if (m.botPlayin) return playinWinners[m.botSeed?.replace(/[ab]$/i, '')] ?? null;
    return m.bot;
  };

  const REGION_COLOR = {
    East: 'var(--region-east)', South: 'var(--region-south)',
    Midwest: 'var(--region-midwest)', West: 'var(--region-west)',
  };
  const rc2 = REGION_COLOR[regionName] ?? 'var(--accent)';
  const col = { display:'flex', flexDirection:'column', alignItems: side==='right'?'flex-start':'flex-end' };

  const lbl = (text, big=false) => (
    <div style={{
      fontFamily:'var(--font-display)',
      fontSize: big ? 20 : 15,
      color: big ? rc2 : 'var(--text-muted)',
      letterSpacing: big ? 3 : 2,
      marginBottom:10,
      textAlign: side==='right'?'left':'right',
      textShadow: big ? `0 0 24px ${rc2}55` : 'none',
      borderBottom: big ? `1px solid ${rc2}30` : 'none',
      paddingBottom: big ? 5 : 0,
    }}>{text}</div>
  );

  const sp = { teams, predictions, getPred, teamStats, matchupDiffs, position: side };

  return (
    <div style={{ display:'flex', flexDirection:side==='right'?'row':'row-reverse', gap:'var(--round-gap)' }}>

      {/* R64 */}
      <div style={col}>
        {lbl(`${regionName.toUpperCase()} · R64`, true)}
        <div style={{ display:'flex', flexDirection:'column', gap:R64_GAP }}>
          {matchups.map((m, i) => {
            const topId = resolveSlot(m,'top'), botId = resolveSlot(m,'bot');
            const winner = r64Winners[rc]?.[i];
            return (
              <Matchup key={i} {...sp}
                topId={topId} botId={botId} winnerId={winner}
                onAdvanceTop={() => advanceTeam('R64', rc, i, topId)}
                onAdvanceBot={() => advanceTeam('R64', rc, i, botId)}
                onRemoveTop={winner===topId ? () => removeWinner('R64', rc, i) : null}
                onRemoveBot={winner===botId ? () => removeWinner('R64', rc, i) : null}
              />
            );
          })}
        </div>
      </div>

      {/* R32 */}
      <div style={col}>
        {lbl('R32')}
        <div style={{ display:'flex', flexDirection:'column', gap:R32_GAP2 }}>
          {Array(4).fill(0).map((_,i) => {
            const topId = r64Winners[rc]?.[i*2] ?? null;
            const botId = r64Winners[rc]?.[i*2+1] ?? null;
            const winner = r32Winners[rc]?.[i];
            return (
              <div key={i} style={{ marginTop: i===0 ? R32_TOP0 : 0 }}>
                <Matchup {...sp}
                  topId={topId} botId={botId} winnerId={winner}
                  onAdvanceTop={topId ? () => advanceTeam('R32', rc, i, topId) : null}
                  onAdvanceBot={botId ? () => advanceTeam('R32', rc, i, botId) : null}
                  onRemoveTop={winner===topId && topId ? () => removeWinner('R32', rc, i) : null}
                  onRemoveBot={winner===botId && botId ? () => removeWinner('R32', rc, i) : null}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* S16 */}
      <div style={col}>
        {lbl('S16')}
        <div style={{ display:'flex', flexDirection:'column', gap:S16_GAP2 }}>
          {Array(2).fill(0).map((_,i) => {
            const topId = r32Winners[rc]?.[i*2] ?? null;
            const botId = r32Winners[rc]?.[i*2+1] ?? null;
            const winner = s16Winners[rc]?.[i];
            return (
              <div key={i} style={{ marginTop: i===0 ? S16_TOP0 : 0 }}>
                <Matchup {...sp}
                  topId={topId} botId={botId} winnerId={winner}
                  onAdvanceTop={topId ? () => advanceTeam('S16', rc, i, topId) : null}
                  onAdvanceBot={botId ? () => advanceTeam('S16', rc, i, botId) : null}
                  onRemoveTop={winner===topId && topId ? () => removeWinner('S16', rc, i) : null}
                  onRemoveBot={winner===botId && botId ? () => removeWinner('S16', rc, i) : null}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* E8 */}
      <div style={col}>
        {lbl('E8')}
        <div style={{ marginTop:E8_TOP }}>
          <Matchup {...sp}
            topId={s16Winners[rc]?.[0] ?? null}
            botId={s16Winners[rc]?.[1] ?? null}
            winnerId={e8Winner}
            onAdvanceTop={s16Winners[rc]?.[0] ? () => advanceTeam('E8', rc, 0, s16Winners[rc][0]) : null}
            onAdvanceBot={s16Winners[rc]?.[1] ? () => advanceTeam('E8', rc, 0, s16Winners[rc][1]) : null}
            onRemoveTop={e8Winner===s16Winners[rc]?.[0] && s16Winners[rc]?.[0] ? () => removeWinner('E8', rc, 0) : null}
            onRemoveBot={e8Winner===s16Winners[rc]?.[1] && s16Winners[rc]?.[1] ? () => removeWinner('E8', rc, 0) : null}
          />
        </div>
      </div>
    </div>
  );
}
