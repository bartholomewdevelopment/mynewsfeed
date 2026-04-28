import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../utils/api';

const TYPE_FILTERS = ['all', 'article', 'church', 'video', 'alert'];

const REASON_LABELS = {
  read: { label: 'Read', color: 'text-sky-500' },
  dismissed: { label: 'Dismissed', color: 'text-slate-500' },
  age: { label: 'Aged out', color: 'text-slate-600' },
};

export default function Archive() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 40 });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (search) params.set('q', search);

      const res = await api.get(`/feed/archive?${params}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleRestore = async (id) => {
    setRestoringId(id);
    await api.patch(`/feed/${id}/restore`).catch(() => {});
    setItems((prev) => prev.filter((i) => i._id !== id));
    setTotal((t) => t - 1);
    setRestoringId(null);
  };

  const handleDelete = async (id) => {
    await api.patch(`/feed/${id}/hide`).catch(() => {});
    setItems((prev) => prev.filter((i) => i._id !== id));
    setTotal((t) => t - 1);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sky-400 text-sm hover:text-sky-300 transition-colors">
              ← Feed
            </Link>
            <span className="text-slate-300 font-semibold text-sm">Archive</span>
            {total > 0 && (
              <span className="text-xs text-slate-600">{total} items</span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto px-4 pb-3 flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                  typeFilter === f
                    ? 'border-sky-600 text-sky-400 bg-sky-950'
                    : 'border-slate-700 text-slate-500 hover:border-slate-500'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search titles..."
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-600 w-44"
            />
            <button
              type="submit"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 border border-slate-700 rounded-lg"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); }}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center py-20 text-slate-500 text-sm">Loading archive...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 font-medium mb-2">Nothing archived yet.</p>
            <p className="text-slate-600 text-sm">
              Items you read, dismiss, or that are older than 14 days will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {items.map((item) => (
                <ArchiveRow
                  key={item._id}
                  item={item}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                  restoring={restoringId === item._id}
                />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors px-3 py-1.5 border border-slate-700 rounded-lg"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors px-3 py-1.5 border border-slate-700 rounded-lg"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ArchiveRow({ item, onRestore, onDelete, restoring }) {
  const age = item.publishedAt
    ? format(new Date(item.publishedAt), 'MMM d, yyyy')
    : '';

  const reason = REASON_LABELS[item.archivedReason] || REASON_LABELS.dismissed;

  const TYPE_ICONS = { alert: '🚨', church: '🕍', video: '▶', article: '📄' };

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors">
      <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICONS[item.type] || '📄'}</span>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="text-xs text-slate-500">{item.sourceName}</span>
          <span className="text-xs text-slate-700">·</span>
          <span className="text-xs text-slate-600">{age}</span>
          <span className={`text-xs ${reason.color}`}>{reason.label}</span>
        </div>
        <p className="text-sm text-slate-300 leading-snug line-clamp-1">{item.title}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {item.itemUrl && (
          <a
            href={item.itemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-sky-400 transition-colors"
          >
            Open
          </a>
        )}
        <button
          onClick={() => onRestore(item._id)}
          disabled={restoring}
          className="text-xs text-sky-600 hover:text-sky-400 disabled:opacity-40 transition-colors"
        >
          {restoring ? '...' : 'Restore'}
        </button>
      </div>
    </div>
  );
}
