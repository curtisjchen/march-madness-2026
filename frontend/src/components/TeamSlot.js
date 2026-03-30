import React, { useState, useRef } from 'react';
import TeamCard from './TeamCard';

const REGION_COLOR = {
  East: 'var(--region-east)', South: 'var(--region-south)',
  Midwest: 'var(--region-midwest)', West: 'var(--region-west)',
};

export default function TeamSlot({
  teamId, opponentId, teams, predictions, getPred,
  teamStats, matchupDiffs,
  isWinner, isEliminated, isEmpty,
  onAdvance, onRemove, position = 'right',
}) {
  const [hovering, setHovering] = useState(false);
  const [cardPos, setCardPos]   = useState(null);
  const ref = useRef(null);

  const team     = teamId     ? teams[teamId]     : null;
  const opponent = opponentId ? teams[opponentId] : null;

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const cardH = 460;
      const showBelow = rect.top < cardH + 12;
      setCardPos({
        left: Math.min(Math.max(rect.left + rect.width / 2 - 150, 4), window.innerWidth - 308),
        top: showBelow ? rect.bottom + 6 : rect.top - 6,
        showBelow,
      });
    }
    setHovering(true);
  };

  if (!team) return (
    <div style={{
      width:'var(--slot-w)', height:'var(--slot-h)',
      background:'var(--surface)', border:'1px dashed var(--border)',
      borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center',
      color:'var(--text-dim)', fontSize:12, fontStyle:'italic', fontFamily:'var(--font-body)',
    }}>{isEmpty ? '' : 'TBD'}</div>
  );

  const rc      = REGION_COLOR[team.region] ?? 'var(--text-muted)';
  const winProb = opponent ? getPred(teamId, opponentId) : null;
  const isFav   = winProb != null && winProb >= 0.5;

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-flex' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => { setHovering(false); setCardPos(null); }}>

      <button onClick={() => onAdvance && onAdvance(teamId)}
        style={{
          width:'var(--slot-w)', height:'var(--slot-h)',
          background: isWinner ? `linear-gradient(90deg, ${rc}28, ${rc}10)` : 'var(--surface)',
          border: isWinner ? `1px solid ${rc}60` : `1px solid var(--border)`,
          borderLeft: isWinner ? `4px solid ${rc}` : `4px solid transparent`,
          borderRadius:6, cursor: onAdvance ? 'pointer' : 'default',
          display:'flex', alignItems:'center', gap:7, padding:'0 10px',
          transition:'all 0.15s ease', opacity: isEliminated ? 0.25 : 1,
          outline:'none', paddingRight: isWinner && onRemove ? 28 : 10,
        }}
        onMouseDown={e => e.currentTarget.style.transform='scale(0.97)'}
        onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
      >
        <div style={{
          minWidth:26, height:26, borderRadius:5,
          background:rc+'22', border:`1px solid ${rc}55`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-display)', fontSize:15, color:rc, flexShrink:0,
        }}>{team.seedNum}</div>

        <span style={{
          fontFamily:'var(--font-display)', fontWeight:400,
          fontSize:16, color: isWinner ? 'var(--text)' : 'var(--text-muted)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          flex:1, letterSpacing:0.5,
        }}>{team.name.toUpperCase()}</span>

        {winProb != null && (
          <span style={{
            fontFamily:'var(--font-display)', fontSize:14, fontWeight:400,
            color: isFav ? 'var(--green)' : 'var(--red)', flexShrink:0, letterSpacing:0.5,
          }}>{Math.round(winProb*100)}%</span>
        )}
      </button>

      {/* X remove button — only on winner slots in rounds past R64 */}
      {isWinner && onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          title="Remove — undo advance"
          style={{
            position:'absolute', right:5, top:'50%', transform:'translateY(-50%)',
            width:18, height:18, borderRadius:4,
            background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.4)',
            color:'var(--red)', cursor:'pointer', outline:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:700, lineHeight:1,
            transition:'all 0.12s',
            zIndex:10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.2)'; }}
        >✕</button>
      )}

      {hovering && cardPos && (
        <TeamCard team={team} opponent={opponent}
          getPred={getPred} teamStats={teamStats} matchupDiffs={matchupDiffs}
          placement={cardPos} />
      )}
    </div>
  );
}
