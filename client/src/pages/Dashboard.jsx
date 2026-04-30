import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import TopBar from '../components/Layout/TopBar';
import Chyron from '../components/Dashboard/Chyron';
import FeedSection from '../components/Dashboard/FeedSection';
import AlertCard from '../components/Dashboard/AlertCard';
import FeedCard from '../components/Dashboard/FeedCard';
import VideoCard from '../components/Dashboard/VideoCard';
import SelectionBar from '../components/Dashboard/SelectionBar';
import ScoresTable from '../components/Dashboard/ScoresTable';
import MarketSummary from '../components/Dashboard/MarketSummary';

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [churchItems, setChurchItems] = useState([]);
  const [localNews, setLocalNews] = useState([]);
  const [worldNews, setWorldNews] = useState([]);
  const [sportsNews, setSportsNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshLabel, setRefreshLabel] = useState('Refresh');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [collapsed, setCollapsed] = useState({
    alerts: true, church: true, local: true, world: true, sports: true, videos: true, markets: true,
  });
  const pollRef = useRef(null);

  const toggle = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [alertsRes, cfmRes, churchNewsRes, localRes, worldRes, sportsRes, videoRes] = await Promise.all([
        api.get('/feed/alerts'),
        api.get('/feed?type=church&category=come-follow-me&limit=500'),      // 14-day window
        api.get('/feed?type=church&excludeCategory=come-follow-me&limit=500'), // 5-day window
        api.get('/feed?type=article&local=1&limit=500'),
        api.get('/feed?type=article&local=0&excludeCategory=sports&limit=500'),
        api.get('/feed?type=article&category=sports&limit=500'),
        api.get('/feed?type=video&limit=500'),
      ]);
      setAlerts(alertsRes.data);
      // CFM pinned to top, regular church news below
      setChurchItems([...cfmRes.data, ...churchNewsRes.data]);
      setLocalNews(localRes.data);
      setWorldNews(worldRes.data);
      setSportsNews(sportsRes.data);
      setVideos(videoRes.data);
      setLastUpdated(new Date());
      setSelectedIds(new Set());
    } catch {
      setError('Could not load feed. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshLabel('Starting...');
    try {
      await api.post('/feed/refresh');
      setRefreshLabel('Fetching...');
      pollRef.current = setInterval(async () => {
        try {
          const { data } = await api.get('/feed/refresh-status');
          if (!data.refreshing) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            await fetchData();
            setRefreshing(false);
            setRefreshLabel('Refresh');
          }
        } catch {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setRefreshing(false);
          setRefreshLabel('Refresh');
        }
      }, 2000);
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          fetchData();
          setRefreshing(false);
          setRefreshLabel('Refresh');
        }
      }, 60000);
    } catch {
      setRefreshing(false);
      setRefreshLabel('Refresh');
    }
  };

  const removeFromView = (id) => {
    const remove = (arr) => arr.filter((i) => i._id !== id);
    setAlerts(remove);
    setChurchItems(remove);
    setLocalNews(remove);
    setWorldNews(remove);
    setSportsNews(remove);
    setVideos(remove);
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleRead = async (id) => {
    await api.patch(`/feed/${id}/read`).catch(() => {});
    removeFromView(id);
  };

  const handleHide = async (id) => {
    await api.patch(`/feed/${id}/hide`).catch(() => {});
    removeFromView(id);
  };

  const handleMarkAllRead = async () => {
    await api.post('/feed/mark-all-read').catch(() => {});
    setAlerts([]); setChurchItems([]); setLocalNews([]);
    setWorldNews([]); setSportsNews([]); setVideos([]);
    setSelectedIds(new Set());
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allIds = [
    ...alerts, ...churchItems, ...localNews, ...worldNews, ...sportsNews, ...videos,
  ].map((i) => i._id);

  const handleSelectAll = () => setSelectedIds(new Set(allIds));
  const handleClearSelection = () => setSelectedIds(new Set());

  const handleBatchRead = async () => {
    const ids = [...selectedIds];
    await api.post('/feed/batch-archive', { ids, reason: 'read' }).catch(() => {});
    ids.forEach(removeFromView);
  };

  const handleBatchDismiss = async () => {
    const ids = [...selectedIds];
    await api.post('/feed/batch-archive', { ids, reason: 'dismissed' }).catch(() => {});
    ids.forEach(removeFromView);
  };

  const allItems = [...alerts, ...churchItems, ...localNews, ...worldNews, ...sportsNews, ...videos];
  const totalItems = allItems.length;

  const renderAlert = (item) => (
    <AlertCard key={item._id} item={item} onRead={handleRead} onHide={handleHide}
      selected={selectedIds.has(item._id)} onToggleSelect={handleToggleSelect} />
  );
  const renderCard = (item) => (
    <FeedCard key={item._id} item={item} onRead={handleRead} onHide={handleHide}
      selected={selectedIds.has(item._id)} onToggleSelect={handleToggleSelect} />
  );
  const renderVideo = (item) => (
    <VideoCard key={item._id} item={item} onHide={handleHide}
      selected={selectedIds.has(item._id)} onToggleSelect={handleToggleSelect} />
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        refreshLabel={refreshLabel}
        itemCount={totalItems}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Chyron — only appears when High/Critical items exist */}
      <Chyron items={allItems} />

      <SelectionBar
        count={selectedIds.size}
        total={totalItems}
        onMarkRead={handleBatchRead}
        onDismiss={handleBatchDismiss}
        onSelectAll={handleSelectAll}
        onClear={handleClearSelection}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        {loading && (
          <p className="text-center py-20 text-slate-500 text-sm">Loading your feed...</p>
        )}

        {!loading && error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-4 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && totalItems === 0 && (
          <div className="text-center py-20 space-y-2">
            <p className="text-slate-300 font-medium">You're caught up.</p>
            <p className="text-slate-600 text-sm">
              Nothing new in the last 14 days. Past items are in{' '}
              <a href="/archive" className="text-sky-500 hover:text-sky-400">Archive</a>.
            </p>
          </div>
        )}

        {!loading && !error && totalItems > 0 && (
          <>
            {/* 1 — Emergency Alerts */}
            {alerts.length > 0 && (
              <FeedSection title="Emergency Alerts" icon="🚨" count={alerts.length}
                collapsed={collapsed.alerts} onToggle={() => toggle('alerts')}>
                {alerts.map(renderAlert)}
              </FeedSection>
            )}

            {/* 2 — Church */}
            {churchItems.length > 0 && (
              <FeedSection title="Church Updates" icon="🕍" count={churchItems.length}
                collapsed={collapsed.church} onToggle={() => toggle('church')}>
                {churchItems.map(renderCard)}
              </FeedSection>
            )}

            {/* 3 — Local */}
            {localNews.length > 0 && (
              <FeedSection title="Local — 45686 / Gallia County" icon="📍" count={localNews.length}
                collapsed={collapsed.local} onToggle={() => toggle('local')}>
                {localNews.map(renderCard)}
              </FeedSection>
            )}

            {/* 4 — Nation & World */}
            {worldNews.length > 0 && (
              <FeedSection title="Nation &amp; World" icon="🌐" count={worldNews.length}
                collapsed={collapsed.world} onToggle={() => toggle('world')}>
                {worldNews.map(renderCard)}
              </FeedSection>
            )}

            {/* 5 — Sports */}
            <FeedSection title="Sports" icon="🏀"
              collapsed={collapsed.sports} onToggle={() => toggle('sports')}>
              <ScoresTable />
              {sportsNews.length > 0 && (
                <div className="mt-4 space-y-3">
                  {sportsNews.map(renderCard)}
                </div>
              )}
            </FeedSection>

            {/* 6 — YouTube */}
            {videos.length > 0 && (
              <FeedSection title="Approved YouTube" icon="▶" count={videos.length}
                collapsed={collapsed.videos} onToggle={() => toggle('videos')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.map(renderVideo)}
                </div>
              </FeedSection>
            )}

            {/* 7 — Markets */}
            <FeedSection title="Markets" icon="📈"
              collapsed={collapsed.markets} onToggle={() => toggle('markets')}>
              <MarketSummary />
            </FeedSection>
          </>
        )}
      </main>
    </div>
  );
}
