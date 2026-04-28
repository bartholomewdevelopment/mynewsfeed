import { useState, useEffect } from 'react';
import api from '../../utils/api';

// Sort: in-progress first, then not-started, then final
const gameSortKey = (g) => {
  if (g.status.inProgress) return 0;
  if (!g.status.completed) return 1;
  return 2;
};

function TeamCell({ team, alignRight }) {
  const nameClass = `text-sm font-bold ${team.mine ? 'text-sky-300' : 'text-slate-300'}`;
  const scoreClass = `font-mono text-sm ${
    team.winner ? 'text-white font-bold' : 'text-slate-500'
  }`;

  if (alignRight) {
    return (
      <div className="flex items-center gap-2 justify-end">
        {team.score !== null && <span className={scoreClass}>{team.score}</span>}
        <span className={nameClass}>{team.abbr}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className={nameClass}>{team.abbr}</span>
      {team.score !== null && <span className={scoreClass}>{team.score}</span>}
    </div>
  );
}

function StatusCell({ status }) {
  if (status.inProgress) {
    const period = status.period <= 4 ? `Q${status.period}` : `OT${status.period - 4}`;
    return (
      <div className="text-center">
        <span className="text-green-400 text-xs font-semibold">
          {period} {status.clock}
        </span>
      </div>
    );
  }
  if (status.completed) {
    return <div className="text-center text-slate-600 text-xs">Final</div>;
  }
  return <div className="text-center text-slate-600 text-xs">{status.detail}</div>;
}

function GameRow({ game, league }) {
  return (
    <div
      className={`grid items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
        game.isMyGame
          ? 'border-sky-900 bg-sky-950/20'
          : 'border-slate-800 bg-slate-900'
      }`}
      style={{ gridTemplateColumns: '2.5rem 1fr auto 1fr' }}
    >
      <span className="text-xs text-slate-600 font-medium">{league}</span>
      <TeamCell team={game.away} />
      <StatusCell status={game.status} />
      <TeamCell team={game.home} alignRight />
    </div>
  );
}

function DaySection({ label, nba, ncaa }) {
  const allGames = [
    ...nba.map((g) => ({ ...g, league: 'NBA' })),
    ...ncaa.map((g) => ({ ...g, league: 'NCAA' })),
  ].sort((a, b) => gameSortKey(a) - gameSortKey(b));

  if (allGames.length === 0) return null;

  return (
    <div>
      <div className="text-xs text-slate-600 uppercase tracking-wider mb-1.5 px-1">{label}</div>
      <div className="space-y-1">
        {allGames.map((g) => (
          <GameRow key={g.id} game={g} league={g.league} />
        ))}
      </div>
    </div>
  );
}

export default function ScoresTable() {
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sports/scores')
      .then((r) => setScores(r.data))
      .catch(() => setScores(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-xs text-slate-600 py-2">Loading scores...</div>;

  if (!scores) {
    return <div className="text-xs text-slate-700 py-2">Scores unavailable</div>;
  }

  const hasToday = scores.today.nba.length > 0 || scores.today.ncaa.length > 0;
  const hasYesterday = scores.yesterday.nba.length > 0 || scores.yesterday.ncaa.length > 0;

  if (!hasToday && !hasYesterday) {
    return (
      <div className="text-xs text-slate-600 py-2 px-3 bg-slate-900 rounded-lg border border-slate-800">
        No NBA or NCAA games scheduled today or yesterday.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasToday && (
        <DaySection label="Today" nba={scores.today.nba} ncaa={scores.today.ncaa} />
      )}
      {hasYesterday && (
        <DaySection label="Yesterday" nba={scores.yesterday.nba} ncaa={scores.yesterday.ncaa} />
      )}
      <p className="text-xs text-slate-700 text-right">
        Your teams highlighted in blue · powered by ESPN
      </p>
    </div>
  );
}
