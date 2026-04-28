import { useState } from 'react';
import api from '../../utils/api';

const EMPTY = {
  name: '',
  type: 'rss',
  url: '',
  category: 'general',
  priority: 5,
  active: true,
  includeKeywords: '',
  excludeKeywords: '',
  locationTags: '',
  notes: '',
};

export default function SourceForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    ...EMPTY,
    ...initial,
    includeKeywords: (initial.includeKeywords || []).join(', '),
    excludeKeywords: (initial.excludeKeywords || []).join(', '),
    locationTags: (initial.locationTags || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveStatus, setResolveStatus] = useState(
    initial.channelId ? { ok: true, channelId: initial.channelId } : null
  );

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleResolve = async () => {
    if (!form.url) return;
    setResolving(true);
    setResolveStatus(null);
    try {
      const res = await api.post('/sources/resolve-youtube', { url: form.url });
      setResolveStatus({ ok: true, channelId: res.data.channelId });
      set('channelId', res.data.channelId);
    } catch (err) {
      setResolveStatus({
        ok: false,
        error: err.response?.data?.error || 'Could not resolve channel ID',
      });
    } finally {
      setResolving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      priority: parseInt(form.priority) || 5,
      includeKeywords: form.includeKeywords.split(',').map((s) => s.trim()).filter(Boolean),
      excludeKeywords: form.excludeKeywords.split(',').map((s) => s.trim()).filter(Boolean),
      locationTags: form.locationTags.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
  };

  const field =
    'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500';

  const isYouTube = form.type === 'youtube';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-sky-800 rounded-xl p-5 space-y-4"
    >
      <div className="text-sm font-semibold text-slate-300">
        {initial?._id ? 'Edit Source' : 'Add New Source'}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Name *</label>
          <input
            className={field}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type *</label>
          <select
            className={field}
            value={form.type}
            onChange={(e) => { set('type', e.target.value); setResolveStatus(null); }}
          >
            <option value="rss">RSS</option>
            <option value="youtube">YouTube Channel</option>
            <option value="emergency">Emergency / Gov</option>
            <option value="church">Church</option>
            <option value="website">Website</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* URL field — with Resolve button for YouTube */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">
            {isYouTube ? 'Channel URL (any format — @handle, /c/, /channel/)' : 'URL / Feed URL *'}
          </label>
          <div className="flex gap-2">
            <input
              className={field}
              value={form.url}
              onChange={(e) => { set('url', e.target.value); setResolveStatus(null); set('channelId', ''); }}
              required
              placeholder={isYouTube ? 'https://www.youtube.com/@ChannelName' : 'https://...'}
            />
            {isYouTube && (
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolving || !form.url}
                className="flex-shrink-0 text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                {resolving ? 'Resolving...' : 'Resolve ID'}
              </button>
            )}
          </div>

          {/* YouTube resolve result */}
          {isYouTube && resolveStatus && (
            <div
              className={`mt-2 text-xs px-3 py-2 rounded-lg ${
                resolveStatus.ok
                  ? 'bg-green-950 border border-green-800 text-green-300'
                  : 'bg-red-950 border border-red-800 text-red-400'
              }`}
            >
              {resolveStatus.ok ? (
                <>
                  Channel ID resolved: <span className="font-mono">{resolveStatus.channelId}</span>
                  <span className="text-green-500 ml-2">— will be saved automatically</span>
                </>
              ) : (
                resolveStatus.error
              )}
            </div>
          )}

          {/* Show cached channel ID if already set */}
          {isYouTube && !resolveStatus && form.channelId && (
            <p className="mt-1 text-xs text-slate-600">
              Saved channel ID: <span className="font-mono text-slate-500">{form.channelId}</span>
            </p>
          )}

          {isYouTube && !resolveStatus && !form.channelId && (
            <p className="mt-1 text-xs text-slate-600">
              Paste any YouTube channel URL and click Resolve ID — or just save and it'll resolve automatically.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Category</label>
          <input
            className={field}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="general, local-news, church, emergency..."
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Priority (1–10)</label>
          <input
            type="number"
            min="1"
            max="10"
            className={field}
            value={form.priority}
            onChange={(e) => set('priority', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Include keywords{' '}
            <span className="text-slate-600 font-normal">(comma-separated — leave blank for all)</span>
          </label>
          <input
            className={field}
            value={form.includeKeywords}
            onChange={(e) => set('includeKeywords', e.target.value)}
            placeholder="gallipolis, tornado, flood..."
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Exclude keywords (comma-separated)</label>
          <input
            className={field}
            value={form.excludeKeywords}
            onChange={(e) => set('excludeKeywords', e.target.value)}
            placeholder="celebrity, gossip..."
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Location tags (comma-separated)</label>
          <input
            className={field}
            value={form.locationTags}
            onChange={(e) => set('locationTags', e.target.value)}
            placeholder="45686, gallia county, ohio..."
          />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <label className="text-sm text-slate-300">Active</label>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set('active', e.target.checked)}
            className="w-4 h-4 accent-sky-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Notes</label>
          <textarea
            className={field}
            value={form.notes || ''}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-sky-700 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save Source'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-200 text-sm px-4 py-2 rounded-lg border border-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
