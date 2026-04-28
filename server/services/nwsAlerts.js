const axios = require('axios');
const FeedItem = require('../models/FeedItem');

// NWS zone and county codes for Gallia County, Ohio
const ZONES = ['OHZ079', 'OHC053'];

const mapNWSSeverity = (nwsSeverity) => {
  const s = (nwsSeverity || '').toLowerCase();
  if (s === 'extreme') return 'critical';
  if (s === 'severe') return 'high';
  if (s === 'moderate') return 'moderate';
  if (s === 'minor') return 'low';
  return 'moderate';
};

const fetchNWSAlerts = async () => {
  try {
    const res = await axios.get(
      `https://api.weather.gov/alerts/active?zone=${ZONES.join(',')}`,
      {
        headers: {
          'User-Agent': 'SignalFeed/1.0 (contact@joeybartholomew.com)',
          Accept: 'application/geo+json',
        },
        timeout: 12000,
      }
    );

    const features = res.data?.features || [];
    const items = [];

    for (const feature of features) {
      const props = feature.properties || {};
      const guid = `nws-${props.id}`;
      if (await FeedItem.exists({ guid })) continue;

      const title = props.headline || props.event || 'NWS Alert';
      const summary = [props.description, props.instruction]
        .filter(Boolean)
        .join('\n\n')
        .substring(0, 1000);

      const severity = mapNWSSeverity(props.severity);
      const baseScore = { critical: 200, high: 150, moderate: 80, low: 40 }[severity] || 80;

      items.push({
        title: title.substring(0, 200),
        sourceName: 'National Weather Service',
        sourceUrl: 'https://www.weather.gov',
        itemUrl: props.url || `https://alerts.weather.gov/cap/wwacapget.php`,
        type: 'alert',
        summary,
        publishedAt: props.sent ? new Date(props.sent) : new Date(),
        category: 'weather-alert',
        severity,
        locationRelevance: 50,
        importanceScore: baseScore,
        approved: true,
        guid,
        tags: ['45686', 'gallia county', 'weather', 'nws'],
      });
    }

    if (items.length > 0) {
      await FeedItem.insertMany(items, { ordered: false }).catch(() => {});
    }

    return { success: true, count: items.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { fetchNWSAlerts };
