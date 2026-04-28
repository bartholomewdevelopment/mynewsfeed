const axios = require('axios');

let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow' },
  { symbol: '^IXIC', name: 'Nasdaq' },
];

const fetchIndex = async ({ symbol, name }) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
  const res = await axios.get(url, {
    params: { interval: '1d', range: '2d' },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    timeout: 10000,
  });

  const meta = res.data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error('No chart data');

  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose;
  const change = price - prevClose;
  const changePct = (change / prevClose) * 100;

  // Significance tier drives visual weight on the client
  const abs = Math.abs(changePct);
  const tier =
    abs >= 3   ? 'major'       :   // ±3%+   — rare, very prominent
    abs >= 1.5 ? 'significant' :   // ±1.5%+ — notable, show clearly
    abs >= 0.5 ? 'active'      :   // ±0.5%+ — normal movement
                 'calm';           // <0.5%   — not worth your attention

  return {
    symbol,
    name,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePct: parseFloat(changePct.toFixed(2)),
    tier,
    direction: change >= 0 ? 'up' : 'down',
  };
};

const fetchMarketData = async () => {
  if (_cache && Date.now() - _cacheTs < CACHE_TTL) return _cache;

  const results = await Promise.allSettled(INDICES.map(fetchIndex));
  const indices = INDICES.map((idx, i) => {
    if (results[i].status === 'fulfilled') return results[i].value;
    return { ...idx, error: true };
  });

  const maxTier = ['major', 'significant', 'active', 'calm'].find((t) =>
    indices.some((idx) => idx.tier === t)
  ) || 'calm';

  const data = {
    indices,
    maxTier,
    marketOpen: new Date().getHours() >= 9 && new Date().getHours() < 17,
    fetchedAt: new Date().toISOString(),
  };

  _cache = data;
  _cacheTs = Date.now();
  return data;
};

module.exports = { fetchMarketData };
