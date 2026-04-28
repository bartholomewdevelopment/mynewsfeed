import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import SourceManager from '../components/Admin/SourceManager';
import KeywordManager from '../components/Admin/KeywordManager';

const TABS = ['Overview', 'Sources', 'Keywords'];

export default function Admin() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const flash = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleRefresh = async () => {
    flash('Refresh started — check back in 30 seconds.');
    await api.post('/feed/refresh').catch(() => {});
  };

  const handleClearRead = async () => {
    const res = await api.delete('/admin/feed/clear-read').catch(() => null);
    if (res) {
      flash(`Cleared ${res.data.deleted} read items.`);
      loadStats();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sky-400 text-sm hover:text-sky-300">
              ← Feed
            </Link>
            <span className="text-slate-300 font-semibold text-sm">Admin Panel</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs font-medium px-4 py-2 border-b-2 transition-colors ${
                tab === t
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {actionMsg && (
          <div className="mb-4 bg-sky-950 border border-sky-800 rounded-lg px-4 py-2 text-sky-300 text-sm">
            {actionMsg}
          </div>
        )}

        {tab === 'Overview' && (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Total Items', value: stats.totalItems },
                  { label: 'Unread', value: stats.unreadItems, highlight: stats.unreadItems > 0 },
                  { label: 'Active Alerts', value: stats.alertItems, highlight: stats.alertItems > 0 },
                  { label: 'Hidden', value: stats.hiddenItems },
                  { label: 'Sources', value: stats.totalSources },
                  { label: 'Active Sources', value: stats.activeSources },
                ].map(({ label, value, highlight }) => (
                  <div
                    key={label}
                    className={`rounded-lg border p-4 ${
                      highlight
                        ? 'border-sky-700 bg-sky-950'
                        : 'border-slate-800 bg-slate-900'
                    }`}
                  >
                    <div className={`text-2xl font-bold ${highlight ? 'text-sky-300' : 'text-slate-200'}`}>
                      {value ?? '—'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Actions
              </h2>

              <div className="space-y-2">
                <ActionRow
                  label="Refresh all feeds now"
                  desc="Trigger an immediate fetch of all active sources + NWS alerts"
                  buttonLabel="Refresh"
                  onClick={handleRefresh}
                />
                <ActionRow
                  label="Clear read items"
                  desc="Permanently delete items you've marked as read"
                  buttonLabel="Clear"
                  danger
                  onClick={handleClearRead}
                />
              </div>
            </div>

          </div>
        )}

        {tab === 'Sources' && <SourceManager onRefreshStats={loadStats} />}
        {tab === 'Keywords' && <KeywordManager />}
      </main>
    </div>
  );
}

function ActionRow({ label, desc, buttonLabel, onClick, danger }) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await onClick();
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-800 last:border-0">
      <div>
        <div className="text-sm text-slate-200">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <button
        onClick={handle}
        disabled={loading}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 disabled:opacity-40 ${
          danger
            ? 'border-red-700 text-red-400 hover:bg-red-900'
            : 'border-slate-600 text-slate-300 hover:border-slate-400'
        }`}
      >
        {loading ? '...' : buttonLabel}
      </button>
    </div>
  );
}
