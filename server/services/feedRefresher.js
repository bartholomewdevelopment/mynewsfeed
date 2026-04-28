const Source = require('../models/Source');
const KeywordRule = require('../models/KeywordRule');
const { fetchRssSource } = require('./rssFetcher');
const { fetchYouTubeChannel } = require('./youtubeFetcher');
const { fetchNWSAlerts } = require('./nwsAlerts');
const { fetchComeFollowMe } = require('./comeFollowMeFetcher');

let _refreshing = false;
let _lastRefreshed = null;

const getRefreshStatus = () => ({ refreshing: _refreshing, lastRefreshed: _lastRefreshed });

const refreshAllFeeds = async () => {
  if (_refreshing) {
    console.log('[refresh] Already in progress, skipping.');
    return;
  }
  _refreshing = true;

  try {
    const [sources, keywordRules] = await Promise.all([
      Source.find({ active: true }),
      KeywordRule.find({ active: true }),
    ]);

    console.log(`[refresh] Fetching NWS alerts + ${sources.length} sources...`);

    const nws = await fetchNWSAlerts();
    console.log(`[refresh] NWS: ${nws.success ? `${nws.count} new` : `error — ${nws.error}`}`);

    const cfm = await fetchComeFollowMe();
    console.log(`[refresh] Come Follow Me: ${cfm.count} new lesson(s)`);

    for (const source of sources) {
      try {
        let result;
        if (source.type === 'youtube') {
          result = await fetchYouTubeChannel(source, keywordRules);
        } else {
          result = await fetchRssSource(source, keywordRules);
        }

        await Source.findByIdAndUpdate(source._id, {
          lastFetched: new Date(),
          fetchError: result.success ? null : result.error,
        });

        const status = result.success ? `${result.count} new items` : `error — ${result.error}`;
        console.log(`[refresh] ${source.name}: ${status}`);
      } catch (err) {
        console.error(`[refresh] ${source.name} threw:`, err.message);
        await Source.findByIdAndUpdate(source._id, { fetchError: err.message });
      }
    }

    _lastRefreshed = new Date();
    console.log('[refresh] Done.');
  } finally {
    _refreshing = false;
  }
};

module.exports = { refreshAllFeeds, getRefreshStatus };
