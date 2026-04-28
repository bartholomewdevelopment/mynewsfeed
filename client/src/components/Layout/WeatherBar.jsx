import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const HOME_ZIP = '45686';
const TRAVEL_KEY = 'signal_travel_zip';

function WeatherChip({ data, loading, error, label }) {
  if (loading) {
    return (
      <span className="text-xs text-slate-600">{label} loading...</span>
    );
  }
  if (error) {
    return <span className="text-xs text-slate-700">{label} unavailable</span>;
  }
  if (!data) return null;

  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400">
      <span className="text-slate-600 text-xs">{label}</span>
      <span>{data.emoji}</span>
      <span className="font-medium text-slate-300">{data.temp}°F</span>
      <span className="text-slate-600 hidden sm:inline">
        feels {data.feelsLike}°F · {data.windSpeed}mph · {data.city}, {data.state}
      </span>
      <span className="text-slate-600 sm:hidden">{data.city}</span>
    </span>
  );
}

export default function WeatherBar() {
  const [homeWeather, setHomeWeather] = useState(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState(false);

  const [travelZip, setTravelZip] = useState(
    () => localStorage.getItem(TRAVEL_KEY) || ''
  );
  const [travelInput, setTravelInput] = useState(
    () => localStorage.getItem(TRAVEL_KEY) || ''
  );
  const [travelWeather, setTravelWeather] = useState(null);
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelError, setTravelError] = useState('');
  const [editingTravel, setEditingTravel] = useState(false);

  const fetchHome = useCallback(async () => {
    try {
      const res = await api.get(`/weather?zip=${HOME_ZIP}`);
      setHomeWeather(res.data);
    } catch {
      setHomeError(true);
    } finally {
      setHomeLoading(false);
    }
  }, []);

  const fetchTravel = useCallback(async (zip) => {
    if (!zip || !/^\d{5}$/.test(zip)) return;
    setTravelLoading(true);
    setTravelError('');
    try {
      const res = await api.get(`/weather?zip=${zip}`);
      setTravelWeather(res.data);
    } catch (err) {
      setTravelError(err.response?.data?.error || 'ZIP not found');
      setTravelWeather(null);
    } finally {
      setTravelLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

  useEffect(() => {
    if (travelZip) fetchTravel(travelZip);
  }, [travelZip, fetchTravel]);

  const handleTravelSubmit = (e) => {
    e.preventDefault();
    const zip = travelInput.trim();
    if (zip) {
      localStorage.setItem(TRAVEL_KEY, zip);
      setTravelZip(zip);
    } else {
      localStorage.removeItem(TRAVEL_KEY);
      setTravelZip('');
      setTravelWeather(null);
    }
    setEditingTravel(false);
  };

  const clearTravel = () => {
    localStorage.removeItem(TRAVEL_KEY);
    setTravelZip('');
    setTravelInput('');
    setTravelWeather(null);
    setEditingTravel(false);
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800/60">
      <div className="max-w-4xl mx-auto px-4 h-8 flex items-center gap-4 overflow-x-auto">
        {/* Home weather */}
        <WeatherChip
          data={homeWeather}
          loading={homeLoading}
          error={homeError}
          label="Home"
        />

        {/* Divider */}
        {(travelZip || editingTravel) && (
          <span className="text-slate-700 flex-shrink-0">|</span>
        )}

        {/* Travel weather */}
        {editingTravel ? (
          <form onSubmit={handleTravelSubmit} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500">Travel ZIP:</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={travelInput}
              onChange={(e) => setTravelInput(e.target.value.replace(/\D/g, ''))}
              placeholder="XXXXX"
              className="w-16 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              autoFocus
            />
            <button type="submit" className="text-xs text-sky-400 hover:text-sky-300">Set</button>
            <button type="button" onClick={() => setEditingTravel(false)} className="text-xs text-slate-600 hover:text-slate-400">Cancel</button>
          </form>
        ) : travelZip ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <WeatherChip
              data={travelWeather}
              loading={travelLoading}
              error={!!travelError}
              label={`Travel (${travelZip})`}
            />
            <button
              onClick={() => { setEditingTravel(true); setTravelInput(travelZip); }}
              className="text-xs text-slate-600 hover:text-slate-400"
            >
              ✏
            </button>
            <button onClick={clearTravel} className="text-xs text-slate-700 hover:text-slate-500">×</button>
          </div>
        ) : (
          <button
            onClick={() => setEditingTravel(true)}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
          >
            + Add travel ZIP
          </button>
        )}
      </div>
    </div>
  );
}
