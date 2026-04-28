export default function Chyron({ items }) {
  const urgent = items.filter(
    (i) => i.severity === 'critical' || i.severity === 'high'
  );
  if (urgent.length === 0) return null;

  const hasCritical = urgent.some((i) => i.severity === 'critical');
  const bgClass = hasCritical ? 'bg-red-700' : 'bg-orange-600';
  const labelText = hasCritical ? 'CRITICAL' : 'ALERT';

  // Duplicate items for seamless loop
  const doubled = [...urgent, ...urgent];

  return (
    <div className={`${bgClass} flex items-stretch overflow-hidden`} style={{ height: '32px' }}>
      {/* Static label */}
      <div className="flex-shrink-0 flex items-center px-3 border-r border-white/30 font-bold text-xs tracking-widest text-white uppercase bg-black/20">
        {labelText}
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex items-center gap-0 absolute top-0 left-0 h-full"
          style={{
            animation: `chyron-scroll ${Math.max(urgent.length * 8, 20)}s linear infinite`,
            whiteSpace: 'nowrap',
          }}
        >
          {doubled.map((item, i) => (
            <span key={`${item._id}-${i}`} className="inline-flex items-center gap-2 text-xs text-white px-6">
              <span className="opacity-50">◆</span>
              {item.sourceName && (
                <span className="font-semibold uppercase text-white/75 text-xs tracking-wide">
                  {item.sourceName}:
                </span>
              )}
              <span>{item.title}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
