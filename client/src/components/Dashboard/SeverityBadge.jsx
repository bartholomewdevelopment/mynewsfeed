const SEVERITY_STYLES = {
  critical: 'bg-red-900 text-red-300 border-red-700',
  high: 'bg-orange-900 text-orange-300 border-orange-700',
  moderate: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  low: 'bg-slate-800 text-slate-400 border-slate-600',
  none: 'bg-slate-800 text-slate-500 border-slate-700',
};

const SEVERITY_LABELS = {
  critical: 'CRITICAL',
  high: 'HIGH',
  moderate: 'MODERATE',
  low: 'LOW',
  none: '',
};

export default function SeverityBadge({ severity }) {
  if (!severity || severity === 'none') return null;
  return (
    <span
      className={`inline-block text-xs font-bold px-1.5 py-0.5 rounded border tracking-wider ${SEVERITY_STYLES[severity] || SEVERITY_STYLES.none}`}
    >
      {SEVERITY_LABELS[severity] || severity.toUpperCase()}
    </span>
  );
}
