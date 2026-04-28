import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import WeatherBar from './WeatherBar';

export default function TopBar({
  lastUpdated,
  onRefresh,
  refreshing,
  refreshLabel = 'Refresh',
  itemCount = 0,
  onMarkAllRead,
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: logo + count */}
        <div className="flex items-center gap-3">
          <Link to="/" className="text-base font-bold tracking-tight text-sky-400">
            Signal Feed
          </Link>
          {itemCount > 0 && (
            <span className="bg-slate-800 text-slate-400 text-xs font-medium px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-600 hidden md:block">
              {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          )}

          {itemCount > 0 && onMarkAllRead && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors hidden sm:block"
              title="Archive everything currently visible"
            >
              Mark all read
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors px-2 py-1 rounded border border-slate-700 hover:border-slate-500"
          >
            {refreshLabel}
          </button>

          <Link
            to="/archive"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded border border-slate-700 hover:border-slate-500"
          >
            Archive
          </Link>

          <Link
            to="/admin"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded border border-slate-700 hover:border-slate-500"
          >
            Admin
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <WeatherBar />
    </header>
  );
}
