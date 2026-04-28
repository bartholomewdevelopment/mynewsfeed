import { formatDistanceToNow } from 'date-fns';
import SeverityBadge from './SeverityBadge';

const BORDER_COLORS = {
  critical: 'border-red-600',
  high: 'border-orange-600',
  moderate: 'border-yellow-600',
  low: 'border-slate-600',
  none: 'border-slate-700',
};

const BG_COLORS = {
  critical: 'bg-red-950',
  high: 'bg-orange-950',
  moderate: 'bg-yellow-950',
  low: 'bg-slate-900',
  none: 'bg-slate-900',
};

export default function AlertCard({ item, onRead, onHide, selected, onToggleSelect }) {
  const borderClass = selected ? 'border-sky-600' : (BORDER_COLORS[item.severity] || BORDER_COLORS.none);
  const bgClass = selected ? 'bg-sky-950/40' : (BG_COLORS[item.severity] || BG_COLORS.none);
  const age = item.publishedAt
    ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })
    : '';

  return (
    <div className={`rounded-lg border-l-4 border ${borderClass} ${bgClass} p-4 transition-colors`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-0.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(item._id)}
            className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <SeverityBadge severity={item.severity} />
            <span className="text-xs text-slate-500">{item.sourceName}</span>
            <span className="text-xs text-slate-600">{age}</span>
          </div>

          <h3 className="font-semibold text-slate-100 text-sm leading-snug mb-1">{item.title}</h3>

          {item.summary && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{item.summary}</p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {item.itemUrl && (
              <a
                href={item.itemUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onRead(item._id)}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                View official source
              </a>
            )}
            <button
              onClick={() => onRead(item._id)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
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
        </div>
      </div>
    </div>
  );
}
