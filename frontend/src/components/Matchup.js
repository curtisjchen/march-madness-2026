import React from 'react';
import TeamSlot from './TeamSlot';

export default function Matchup({
  topId, botId, winnerId,
  teams, predictions, getPred, teamStats, matchupDiffs,
  onAdvanceTop, onAdvanceBot,
  onRemoveTop, onRemoveBot,
  position = 'right',
}) {
  const topElim = winnerId && winnerId !== topId;
  const botElim = winnerId && winnerId !== botId;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--gap)', position:'relative' }}>
      <TeamSlot
        teamId={topId} opponentId={botId}
        teams={teams} predictions={predictions} getPred={getPred}
        teamStats={teamStats} matchupDiffs={matchupDiffs}
        isWinner={winnerId === topId} isEliminated={topElim}
        onAdvance={onAdvanceTop} onRemove={onRemoveTop} position={position}
      />
      <TeamSlot
        teamId={botId} opponentId={topId}
        teams={teams} predictions={predictions} getPred={getPred}
        teamStats={teamStats} matchupDiffs={matchupDiffs}
        isWinner={winnerId === botId} isEliminated={botElim}
        onAdvance={onAdvanceBot} onRemove={onRemoveBot} position={position}
      />
    </div>
  );
}
