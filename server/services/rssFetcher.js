const Parser = require('rss-parser');
const FeedItem = require('../models/FeedItem');
const { scoreItem, getSeverityFromText, getLocationRelevance } = require('./scorer');

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'SignalFeed/1.0 (Personal RSS Reader; contact@joeybartholomew.com)' },
  customFields: {
    item: [['media:content', 'mediaContent'], ['media:thumbnail', 'mediaThumbnail']],
  },
});

const stripHtml = (str = '') =>
  str
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getItemType = (sourceType) => {
  if (sourceType === 'church') return 'church';
  if (sourceType === 'emergency') return 'alert';
  return 'article';
};

const extractThumbnail = (entry) => {
  if (entry.mediaThumbnail?.$.url) return entry.mediaThumbnail.$.url;
  if (entry.mediaContent?.$.url) return entry.mediaContent.$.url;
  if (entry.enclosure?.url && entry.enclosure.type?.startsWith('image/')) return entry.enclosure.url;
  const imgMatch = (entry.content || entry['content:encoded'] || '').match(/<img[^>]+src="([^"]+)"/i);
  return imgMatch ? imgMatch[1] : '';
};

const fetchRssSource = async (source, keywordRules) => {
  try {
    const feed = await parser.parseURL(source.url);
    const items = [];

    for (const entry of (feed.items || []).slice(0, 25)) {
      const guid =
        entry.guid || entry.id || entry.link || `${source._id}-${entry.title}-${entry.pubDate}`;
      if (await FeedItem.exists({ guid })) continue;

      const title = stripHtml(entry.title || '');
      const rawSummary = entry.contentSnippet || entry.summary || entry.content || '';
      const summary = stripHtml(rawSummary).substring(0, 600);
      const text = `${title} ${summary}`;

      // Source-level keyword filtering
      if (source.includeKeywords?.length > 0) {
        const passes = source.includeKeywords.some((kw) =>
          text.toLowerCase().includes(kw.toLowerCase())
        );
        if (!passes) continue;
      }
      if (source.excludeKeywords?.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))) {
        continue;
      }

      const itemData = {
        title,
        sourceName: source.name,
        sourceUrl: source.url,
        sourceId: source._id,
        itemUrl: entry.link || '',
        type: getItemType(source.type),
        summary,
        thumbnailUrl: extractThumbnail(entry),
        publishedAt: entry.pubDate ? new Date(entry.pubDate) : new Date(),
        category: source.category || 'general',
        severity: getSeverityFromText(text),
        locationRelevance: getLocationRelevance(text, source.locationTags),
        sourcePriority: source.priority || 5,
        approved: true,
        guid,
        tags: source.locationTags || [],
      };

      itemData.importanceScore = scoreItem(itemData, keywordRules);
      if (itemData.importanceScore < -20) continue;

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

module.exports = { fetchRssSource };
