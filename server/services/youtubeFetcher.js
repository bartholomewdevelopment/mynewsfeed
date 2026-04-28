const Parser = require('rss-parser');
const axios = require('axios');
const FeedItem = require('../models/FeedItem');
const Source = require('../models/Source');
const { scoreItem } = require('./scorer');

// YouTube has a free public RSS feed for every channel — no API key needed
// We fetch with axios (browser UA) then parse the string to avoid YouTube blocking custom UAs
const ytParser = new Parser({
  customFields: {
    item: [['yt:videoId', 'videoId']],
  },
});

const getDurationSeconds = async (videoId) => {
  try {
    const res = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
      timeout: 8000,
    });
    const match = res.data.match(/"lengthSeconds":"(\d+)"/);
    return match ? parseInt(match[1]) : null;
  } catch {
    return null;
  }
};

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const CHANNEL_ID_RE = /UC[a-zA-Z0-9_-]{22}/;

// Try to extract a UC... channel ID from raw HTML
const extractIdFromHtml = (html) => {
  const patterns = [
    /channel_id=(UC[a-zA-Z0-9_-]{22})/,
    /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"externalId":"(UC[a-zA-Z0-9_-]{22})"/,
    /\/channel\/(UC[a-zA-Z0-9_-]{22})/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
};

const scrapeChannelPage = async (url) => {
  const res = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    timeout: 14000,
    maxRedirects: 10,
  });
  return extractIdFromHtml(res.data);
};

// Extract UC... channel ID from a URL, or scrape the channel page to find it
const resolveChannelId = async (source) => {
  if (source.channelId) return source.channelId;

  const url = source.url;

  // Direct /channel/UC... URL — no scraping needed
  const directMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (directMatch) return directMatch[1];

  // For @handle URLs, also try the non-@ version which yields full HTML
  const urlsToTry = [url];
  const handleMatch = url.match(/youtube\.com\/@([^/?&]+)/);
  if (handleMatch) {
    urlsToTry.push(`https://www.youtube.com/${handleMatch[1]}`);
  }

  for (const u of urlsToTry) {
    try {
      const id = await scrapeChannelPage(u);
      if (id) return id;
    } catch (err) {
      console.error(`[youtube] Scrape failed for ${u}:`, err.message);
    }
  }
  return null;
};

const fetchYouTubeChannel = async (source, keywordRules) => {
  try {
    const channelId = await resolveChannelId(source);
    if (!channelId) {
      return {
        success: false,
        error: 'Could not resolve channel ID — paste a direct /channel/UC... URL in the source',
      };
    }

    // Cache the resolved channel ID so we skip scraping next time
    if (!source.channelId) {
      await Source.findByIdAndUpdate(source._id, { channelId });
    }

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRes = await axios.get(rssUrl, {
      headers: { 'User-Agent': BROWSER_UA },
      timeout: 14000,
    });
    const feed = await ytParser.parseString(rssRes.data);
    const items = [];

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const entry of (feed.items || []).slice(0, 15)) {
      const videoId = entry.videoId;
      if (!videoId) continue;

      // Skip videos older than 7 days
      const publishedAt = entry.pubDate ? new Date(entry.pubDate) : null;
      if (publishedAt && publishedAt < sevenDaysAgo) continue;

      const guid = `yt-${videoId}`;
      if (await FeedItem.exists({ guid })) continue;

      const title = (entry.title || '').trim();
      const summary = (entry.contentSnippet || entry.content || '').substring(0, 400);
      const text = `${title} ${summary}`;

      if (source.includeKeywords?.length > 0) {
        if (!source.includeKeywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))) {
          continue;
        }
      }
      if (source.excludeKeywords?.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))) {
        continue;
      }

      const thumbnail = `https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      const durationSeconds = await getDurationSeconds(videoId);

      const itemData = {
        title,
        sourceName: feed.title || source.name,
        sourceUrl: source.url,
        sourceId: source._id,
        itemUrl: `https://www.youtube.com/watch?v=${videoId}`,
        type: 'video',
        summary,
        thumbnailUrl: thumbnail,
        videoId,
        durationSeconds,
        publishedAt: entry.pubDate ? new Date(entry.pubDate) : new Date(),
        category: source.category || 'video',
        severity: 'none',
        locationRelevance: 0,
        sourcePriority: source.priority || 5,
        approved: true,
        guid,
        tags: [],
      };

      itemData.importanceScore = scoreItem(itemData, keywordRules);
      items.push(itemData);
    }

    if (items.length > 0) {
      await FeedItem.insertMany(items, { ordered: false }).catch(() => {});
    }

    return { success: true, count: items.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { fetchYouTubeChannel, resolveChannelId };
