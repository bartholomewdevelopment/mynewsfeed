import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default function VideoCard({ item, onHide, selected, onToggleSelect }) {
  const [playing, setPlaying] = useState(false);
  const age = item.publishedAt
    ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })
    : '';

  // Just start playing — don't archive yet. User decides when they're done.
  const handleWatch = () => {
    setPlaying(true);
  };

  return (
    <div
      className={`rounded-lg border bg-slate-900 overflow-hidden transition-colors ${
        selected ? 'border-sky-700' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {playing ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${item.videoId}?autoplay=1&rel=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            title={item.title}
          />
        </div>
      ) : (
        <div className="relative group cursor-pointer" onClick={handleWatch}>
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full aspect-video object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full aspect-video bg-slate-800 flex items-center justify-center">
              <span className="text-slate-500 text-sm">No thumbnail</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* Checkbox overlay — top-left corner */}
          <div
            className="absolute top-2 left-2"
            onClick={(e) => { e.stopPropagation(); onToggleSelect(item._id); }}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(item._id)}
              className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      <div className="p-3">
        <h3 className="text-sm font-medium text-slate-200 leading-snug mb-1 line-clamp-2">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{item.sourceName}</span>
          <span>·</span>
          <span>{age}</span>
          {formatDuration(item.durationSeconds) && (
            <>
              <span>·</span>
              <span className="font-mono">{formatDuration(item.durationSeconds)}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          {!playing && (
            <button
              onClick={handleWatch}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              Watch
            </button>
          )}
          <a
            href={item.itemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Open on YouTube
          </a>
          <button
            onClick={() => onHide(item._id)}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors ml-auto"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
