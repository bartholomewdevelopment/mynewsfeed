import { useState, useEffect } from 'react';
import api from '../../utils/api';

const TIER_STYLES = {
  major:       { row: 'bg-slate-900 border-slate-600', pct: 'text-lg font-bold', label: 'text-slate-200 font-semibold' },
  significant: { row: 'bg-slate-900 border-slate-700', pct: 'text-base font-semibold', label: 'text-slate-300' },
  active:      { row: 'bg-slate-900 border-slate-800', pct: 'text-sm font-medium', label: 'text-slate-400' },
  calm:        { row: 'bg-slate-900/50 border-slate-800/50', pct: 'text-xs opacity-50', label: 'text-slate-600 text-xs' },
};

const DIRECTION_COLOR = {
  up: { pct: 'text-green-400', arrow: '▲', price: 'text-green-300' },
  down: { pct: 'text-red-400', arrow: '▼', price: 'text-red-300' },
};

function IndexRow({ idx }) {
  const tier = idx.tier || 'calm';
  const styles = TIER_STYLES[tier];
  const dir = DIRECTION_COLOR[idx.direction] || DIRECTION_COLOR.up;
  const sign = idx.change >= 0 ? '+' : '';

  if (idx.error) {
    return (
      <div className="flex items-center justify-between px-4 py-2 rounded-lg border border-slate-800/50">
        <span className="text-xs text-slate-600">{idx.name}</span>
        <span className="text-xs text-slate-700">unavailable</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${styles.row}`}>
      <span className={styles.label}>{idx.name}</span>

      <div className="flex items-center gap-4">
        <span className={`font-mono text-slate-500 text-xs`}>
          {idx.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`font-mono ${dir.pct} ${styles.pct} flex items-center gap-1`}>
          <span className="text-xs">{dir.arrow}</span>
          {sign}{idx.changePct?.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export default function MarketSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/market')
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const headerMsg = () => {
    if (!data) return null;
    const { maxTier } = data;
    if (maxTier === 'major') return { text: 'Major market movement today', color: 'text-orange-400' };
    if (maxTier === 'significant') return { text: 'Notable market movement today', color: 'text-yellow-500' };
    if (maxTier === 'active') return { text: 'Markets active today', color: 'text-slate-400' };
    return { text: 'Markets calm — nothing significant', color: 'text-slate-600' };
  };

  const msg = headerMsg();

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">📈</span>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Markets</h2>
        {msg && <span className={`text-xs ${msg.color} ml-1`}>{msg.text}</span>}
      </div>

      {loading ? (
        <p className="text-xs text-slate-600 py-2">Loading market data...</p>
      ) : !data ? (
        <p className="text-xs text-slate-700 py-2">Market data unavailable</p>
      ) : (
        <div className="space-y-1.5">
          {data.indices.map((idx) => (
            <IndexRow key={idx.symbol} idx={idx} />
          ))}
          {data.fetchedAt && (
            <p className="text-xs text-slate-700 text-right pt-1">
              {data.marketOpen ? 'Live' : 'Closed'} · as of {new Date(data.fetchedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
