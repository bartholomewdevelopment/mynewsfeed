export default function FeedSection({ title, icon, children, count, collapsed, onToggle }) {
  return (
    <section>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        {icon && <span className="text-base">{icon}</span>}
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-300 transition-colors">
          {title}
        </h2>
        {count > 0 && (
          <span className="text-xs text-slate-600 ml-1">({count})</span>
        )}
        <span className="ml-auto text-slate-600 group-hover:text-slate-400 transition-colors text-xs">
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && <div className="space-y-3">{children}</div>}
    </section>
  );
}
