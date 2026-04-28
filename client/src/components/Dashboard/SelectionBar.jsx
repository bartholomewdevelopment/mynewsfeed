export default function SelectionBar({ count, total, onMarkRead, onDismiss, onSelectAll, onClear }) {
  if (count === 0) return null;

  return (
    <div className="sticky top-14 z-10 bg-sky-950 border-b border-sky-800">
      <div className="max-w-4xl mx-auto px-4 h-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-sky-300">
            {count} selected
          </span>
          {count < total && (
            <button
              onClick={onSelectAll}
              className="text-xs text-sky-400 hover:text-sky-200 transition-colors"
            >
              Select all {total}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onMarkRead}
            className="text-xs font-medium text-sky-300 hover:text-white transition-colors"
          >
            Mark read
          </button>
          <span className="text-sky-700">·</span>
          <button
            onClick={onDismiss}
            className="text-xs font-medium text-sky-300 hover:text-white transition-colors"
          >
            Dismiss
          </button>
          <span className="text-sky-700">·</span>
          <button
            onClick={onClear}
            className="text-xs text-sky-500 hover:text-sky-300 transition-colors"
          >
            Clear selection
          </button>
        </div>
      </div>
    </div>
  );
}
