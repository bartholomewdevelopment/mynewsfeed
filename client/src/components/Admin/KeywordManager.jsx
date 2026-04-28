import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

export default function KeywordManager() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ keyword: '', type: 'include', weight: 20, category: 'general' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // all | include | exclude

  const load = useCallback(async () => {
    const res = await api.get('/keywords');
    setRules(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.keyword.trim()) return;
    setSaving(true);
    await api.post('/keywords', { ...form, weight: parseInt(form.weight) || 10 });
    setForm({ keyword: '', type: 'include', weight: 20, category: 'general' });
    setSaving(false);
    load();
  };

  const handleToggle = async (rule) => {
    await api.put(`/keywords/${rule._id}`, { active: !rule.active });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this keyword rule?')) return;
    await api.delete(`/keywords/${id}`);
    load();
  };

  const filtered = filter === 'all' ? rules : rules.filter((r) => r.type === filter);
  const includeCount = rules.filter((r) => r.type === 'include').length;
  const excludeCount = rules.filter((r) => r.type === 'exclude').length;

  const field = 'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Keyword Rules
        </h2>
        <span className="text-xs text-green-400">{includeCount} include</span>
        <span className="text-xs text-red-400">{excludeCount} exclude</span>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Keyword *</label>
          <input
            className={`${field} w-44`}
            value={form.keyword}
            onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
            placeholder="e.g. tornado"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type</label>
          <select
            className={field}
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="include">Include (+score)</option>
            <option value="exclude">Exclude (−score)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Weight</label>
          <input
            type="number"
            min="1"
            max="200"
            className={`${field} w-20`}
            value={form.weight}
            onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Category</label>
          <input
            className={`${field} w-32`}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="emergency"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-sky-700 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
        >
          {saving ? '...' : '+ Add Rule'}
        </button>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'include', 'exclude'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filter === f
                ? 'border-sky-600 text-sky-400 bg-sky-950'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((rule) => (
            <div
              key={rule._id}
              className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border bg-slate-900 ${
                rule.active ? 'border-slate-700' : 'border-slate-800 opacity-40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-xs font-bold w-14 flex-shrink-0 ${
                    rule.type === 'include' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {rule.type === 'include' ? '+' : '−'}{rule.weight}
                </span>
                <span className="text-sm text-slate-200 font-medium">{rule.keyword}</span>
                <span className="text-xs text-slate-600">{rule.category}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(rule)}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    rule.active
                      ? 'border-green-800 text-green-500 hover:bg-green-950'
                      : 'border-slate-600 text-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {rule.active ? 'On' : 'Off'}
                </button>
                <button
                  onClick={() => handleDelete(rule._id)}
                  className="text-xs text-red-700 hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-600 text-sm py-4 text-center">No rules in this category.</p>
          )}
        </div>
      )}
    </div>
  );
}
