import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import SourceForm from './SourceForm';

export default function SourceManager({ onRefreshStats }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, source = edit
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/sources');
      setSources(res.data);
    } catch {
      setError('Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (source) => {
    await api.put(`/sources/${source._id}`, { active: !source.active });
    load();
    onRefreshStats?.();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this source?')) return;
    await api.delete(`/sources/${id}`);
    load();
    onRefreshStats?.();
  };

  const handleSave = async (data) => {
    if (editing?._id) {
      await api.put(`/sources/${editing._id}`, data);
    } else {
      await api.post('/sources', data);
    }
    setEditing(null);
    load();
    onRefreshStats?.();
  };

  const TYPE_COLORS = {
    emergency: 'text-red-400',
    church: 'text-purple-400',
    youtube: 'text-rose-400',
    rss: 'text-green-400',
    website: 'text-blue-400',
    manual: 'text-slate-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Approved Sources ({sources.length})
        </h2>
        <button
          onClick={() => setEditing({})}
          className="text-xs bg-sky-700 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          + Add Source
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {editing !== null && (
        <SourceForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading ? (
        <p className="text-slate-500 text-sm py-8 text-center">Loading...</p>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => (
            <div
              key={source._id}
              className={`rounded-lg border bg-slate-900 p-4 ${
                source.active ? 'border-slate-700' : 'border-slate-800 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className={`text-xs font-medium uppercase ${TYPE_COLORS[source.type] || 'text-slate-400'}`}>
                      {source.type}
                    </span>
                    <span className="text-xs text-slate-500">P:{source.priority}</span>
                    {source.fetchError && (
                      <span className="text-xs text-red-400 truncate max-w-xs" title={source.fetchError}>
                        Error: {source.fetchError.substring(0, 60)}
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-sm text-slate-200">{source.name}</div>
                  <div className="text-xs text-slate-500 truncate">{source.url}</div>
                  {source.lastFetched && (
                    <div className="text-xs text-slate-600 mt-0.5">
                      Last fetched: {new Date(source.lastFetched).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(source)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      source.active
                        ? 'border-green-700 text-green-400 hover:bg-green-900'
                        : 'border-slate-600 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {source.active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => setEditing(source)}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(source._id)}
                    className="text-xs text-red-600 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
