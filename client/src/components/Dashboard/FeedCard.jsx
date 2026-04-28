import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import SeverityBadge from './SeverityBadge';
import api from '../../utils/api';

export default function FeedCard({ item, onRead, onHide, selected, onToggleSelect }) {
  const [readerState, setReaderState] = useState('idle'); // idle | loading | open | error | paywall | blocked
  const [articleText, setArticleText] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const age = item.publishedAt
    ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })
    : '';

  const handleTextOnly = async () => {
    if (readerState === 'open') {
      setReaderState('idle');
      return;
    }
    if (!item.itemUrl) return;
    setReaderState('loading');
    setErrorMsg('');
    try {
      const res = await api.get(`/feed/article-text?url=${encodeURIComponent(item.itemUrl)}`);
      setArticleText(res.data);
      setReaderState('open');
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'PAYWALL') {
        setReaderState('paywall');
      } else if (code === 'BLOCKED') {
        setReaderState('blocked');
      } else {
        setErrorMsg(err.response?.data?.error || 'Could not extract article text.');
        setReaderState('error');
      }
    }
  };

  const handleOpenArticle = () => {
    window.open(item.itemUrl, '_blank', 'noopener,noreferrer');
    onRead(item._id);
  };

  return (
    <div
      className={`rounded-lg border bg-slate-900 transition-colors ${
        selected ? 'border-sky-700 bg-sky-950/30' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Card header */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Checkbox */}
          <div className="flex-shrink-0 pt-0.5">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(item._id)}
              className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
            />
          </div>

          {item.thumbnailUrl && (
            <img
              src={item.thumbnailUrl}
              alt=""
              className="w-16 h-16 object-cover rounded flex-shrink-0 bg-slate-800"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <SeverityBadge severity={item.severity} />
              <span className="text-xs text-slate-500">{item.sourceName}</span>
              <span className="text-xs text-slate-600">{age}</span>
            </div>

            <h3 className="text-sm font-medium text-slate-200 leading-snug mb-1 line-clamp-2">
              {item.title}
            </h3>

            {item.summary && readerState !== 'open' && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.summary}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              {item.itemUrl && (
                <>
                  <button
                    onClick={handleTextOnly}
                    disabled={readerState === 'loading'}
                    className={`text-xs font-medium transition-colors ${
                      readerState === 'open'
                        ? 'text-sky-300 hover:text-sky-200'
                        : 'text-sky-500 hover:text-sky-300'
                    } disabled:opacity-40`}
                  >
                    {readerState === 'loading'
                      ? 'Loading...'
                      : readerState === 'open'
                      ? 'Close reader'
                      : 'Text only'}
                  </button>
                  <button
                    onClick={handleOpenArticle}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Open article
                  </button>
                </>
              )}
              <button
                onClick={() => onRead(item._id)}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                Mark read
              </button>
              <button
                onClick={() => onHide(item._id)}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                Dismiss
              </button>
            </div>

            {readerState === 'error' && (
              <p className="text-xs text-red-400 mt-2">{errorMsg}</p>
            )}

            {readerState === 'paywall' && (
              <div className="mt-2 flex items-start gap-2 bg-amber-950/50 border border-amber-800/50 rounded-lg px-3 py-2">
                <span className="text-amber-400 text-xs mt-0.5">🔒</span>
                <div>
                  <p className="text-xs text-amber-300 font-medium">Subscription or login required</p>
                  <p className="text-xs text-amber-500 mt-0.5">
                    This site's content can't be extracted — use{' '}
                    <button onClick={handleOpenArticle} className="underline hover:text-amber-300 transition-colors">
                      Open article
                    </button>{' '}
                    to read it directly.
                  </p>
                </div>
              </div>
            )}

            {readerState === 'blocked' && (
              <div className="mt-2 flex items-start gap-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                <span className="text-slate-400 text-xs mt-0.5">🛡️</span>
                <div>
                  <p className="text-xs text-slate-300 font-medium">Site blocks automated access</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This free site uses bot protection (Cloudflare) that prevents server-side extraction.
                    Use{' '}
                    <button onClick={handleOpenArticle} className="underline hover:text-slate-300 transition-colors">
                      Open article
                    </button>{' '}
                    to read it normally in your browser — it's free.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline reader */}
      {readerState === 'open' && articleText && (
        <div className="border-t border-slate-700 px-5 py-4">
          {articleText.byline && (
            <p className="text-xs text-slate-500 mb-3">{articleText.byline}</p>
          )}
          <div className="prose-sm text-slate-300 leading-relaxed whitespace-pre-line text-sm max-h-[70vh] overflow-y-auto pr-1">
            {articleText.textContent}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-4">
            <button
              onClick={() => { setReaderState('idle'); onRead(item._id); }}
              className="text-xs text-sky-500 hover:text-sky-300 transition-colors"
            >
              Mark read &amp; close
            </button>
            <button
              onClick={() => setReaderState('idle')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
