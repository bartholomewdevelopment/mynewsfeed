const Source = require('../models/Source');
const KeywordRule = require('../models/KeywordRule');

// All URLs verified working as of April 2026
const DEFAULT_SOURCES = [
  {
    name: 'NWS Gallia County Alerts (Atom)',
    type: 'emergency',
    url: 'https://api.weather.gov/alerts/active.atom?zone=OHZ079',
    category: 'weather-alert',
    priority: 10,
    locationTags: ['45686', 'gallia county', 'ohio'],
    notes: 'NWS active alerts Atom feed for Gallia County / OHZ079',
  },
  {
    name: 'Church of Jesus Christ Newsroom',
    type: 'church',
    url: 'https://newsroom.churchofjesuschrist.org/rss',
    category: 'church',
    priority: 8,
    notes: 'Official LDS Church Newsroom RSS — 25 latest articles',
  },
  {
    name: 'Church News',
    type: 'church',
    url: 'https://www.thechurchnews.com/rss/latest.rss',
    category: 'church',
    priority: 7,
    notes: 'The Church News — latest articles RSS',
  },
  {
    name: 'WV News — River Cities (Gallia, Meigs, Mason)',
    type: 'rss',
    url: 'https://www.wvnews.com/search/?f=rss&t=article&c=rivercities&l=50&s=start_time&sd=desc',
    category: 'local-news',
    priority: 9,
    locationTags: ['gallia', 'gallipolis', '45686', 'meigs', 'mason county', 'point pleasant', 'ohio', 'west virginia'],
    includeKeywords: [],
    excludeKeywords: [],
    notes: 'Hyperlocal — covers Gallia, Meigs, and Mason Counties. No keyword filter needed.',
  },
  {
    name: 'WOWK TV — Huntington/Charleston',
    type: 'rss',
    url: 'https://www.wowktv.com/feed/',
    category: 'local-news',
    priority: 7,
    locationTags: ['gallia', 'ohio', 'west virginia', 'huntington', 'charleston'],
    includeKeywords: [],
    excludeKeywords: ['celebrity', 'entertainment', 'sports', 'nfl', 'nba', 'mlb'],
  },
  {
    name: 'ESPN — NBA News',
    type: 'rss',
    url: 'https://www.espn.com/espn/rss/nba/news',
    category: 'sports',
    priority: 6,
    includeKeywords: [
      'jazz', 'utah jazz', 'lakers', 'los angeles lakers',
      'timberwolves', 'minnesota timberwolves',
      'cavaliers', 'cleveland cavaliers',
      'knicks', 'new york knicks',
    ],
    notes: 'ESPN NBA news filtered to user\'s teams',
  },
  {
    name: 'ESPN — College Basketball',
    type: 'rss',
    url: 'https://www.espn.com/espn/rss/ncb/news',
    category: 'sports',
    priority: 6,
    includeKeywords: [
      'byu', 'brigham young', 'cougars',
      'utah utes', 'utah runnin',
    ],
    notes: 'ESPN NCAA basketball filtered to BYU and Utah',
  },
  {
    name: '10TV WBNS — Columbus, Ohio',
    type: 'rss',
    url: 'https://www.10tv.com/feeds/syndication/rss/news',
    category: 'local-news',
    priority: 7,
    locationTags: ['ohio', 'columbus'],
    includeKeywords: [
      'ohio', 'columbus', 'gallia', 'gallipolis', 'emergency', 'weather', 'warning',
      'tornado', 'flood', 'shooting', 'missing', 'road closure', 'accident',
      'evacuation', 'power outage', 'school closing', 'recall', 'public safety',
    ],
    notes: 'NBC affiliate Columbus OH — WBNS 10TV',
  },
  {
    name: 'Ohio Capital Journal',
    type: 'rss',
    url: 'https://ohiocapitaljournal.com/feed/',
    category: 'ohio-news',
    priority: 5,
    locationTags: ['ohio'],
    includeKeywords: [
      'emergency', 'disaster', 'flood', 'tornado', 'severe weather',
      'gallia', 'gallipolis', 'public safety', 'evacuation',
      'road closure', 'school closing', 'health warning',
    ],
    excludeKeywords: [
      'opinion', 'editorial', 'political drama', 'campaign',
    ],
  },
];

const DEFAULT_INCLUDE_KEYWORDS = [
  { keyword: 'emergency', type: 'include', weight: 25, category: 'emergency' },
  { keyword: 'tornado warning', type: 'include', weight: 35, category: 'weather' },
  { keyword: 'tornado watch', type: 'include', weight: 25, category: 'weather' },
  { keyword: 'flash flood warning', type: 'include', weight: 35, category: 'weather' },
  { keyword: 'flood warning', type: 'include', weight: 25, category: 'weather' },
  { keyword: 'severe thunderstorm', type: 'include', weight: 25, category: 'weather' },
  { keyword: 'severe weather', type: 'include', weight: 20, category: 'weather' },
  { keyword: 'road closure', type: 'include', weight: 20, category: 'transportation' },
  { keyword: 'evacuation', type: 'include', weight: 40, category: 'emergency' },
  { keyword: 'shelter in place', type: 'include', weight: 40, category: 'emergency' },
  { keyword: 'power outage', type: 'include', weight: 20, category: 'emergency' },
  { keyword: 'shooting', type: 'include', weight: 25, category: 'public-safety' },
  { keyword: 'missing person', type: 'include', weight: 25, category: 'public-safety' },
  { keyword: 'chemical spill', type: 'include', weight: 35, category: 'emergency' },
  { keyword: 'school closing', type: 'include', weight: 20, category: 'local' },
  { keyword: 'school cancellation', type: 'include', weight: 20, category: 'local' },
  { keyword: 'boil water', type: 'include', weight: 30, category: 'emergency' },
  { keyword: 'wildfire', type: 'include', weight: 25, category: 'weather' },
  { keyword: 'earthquake', type: 'include', weight: 30, category: 'weather' },
  { keyword: 'major accident', type: 'include', weight: 20, category: 'public-safety' },
  { keyword: 'gallipolis', type: 'include', weight: 30, category: 'local' },
  { keyword: 'gallia county', type: 'include', weight: 30, category: 'local' },
  { keyword: '45686', type: 'include', weight: 30, category: 'local' },
  { keyword: 'rio grande', type: 'include', weight: 25, category: 'local' },
  { keyword: 'first presidency', type: 'include', weight: 20, category: 'church' },
  { keyword: 'general conference', type: 'include', weight: 20, category: 'church' },
  { keyword: 'temple dedication', type: 'include', weight: 20, category: 'church' },
  { keyword: 'temple announcement', type: 'include', weight: 20, category: 'church' },
];

const DEFAULT_EXCLUDE_KEYWORDS = [
  { keyword: 'celebrity', type: 'exclude', weight: 100, category: 'entertainment' },
  { keyword: 'gossip', type: 'exclude', weight: 100, category: 'entertainment' },
  { keyword: 'feud', type: 'exclude', weight: 80, category: 'entertainment' },
  { keyword: 'viral video', type: 'exclude', weight: 60, category: 'entertainment' },
  { keyword: 'tiktok trend', type: 'exclude', weight: 70, category: 'entertainment' },
  { keyword: 'scandal', type: 'exclude', weight: 80, category: 'entertainment' },
  { keyword: 'outrage', type: 'exclude', weight: 70, category: 'politics' },
  { keyword: 'political drama', type: 'exclude', weight: 80, category: 'politics' },
  { keyword: 'reaction video', type: 'exclude', weight: 70, category: 'entertainment' },
  { keyword: 'rumor', type: 'exclude', weight: 60, category: 'entertainment' },
  { keyword: 'opinion:', type: 'exclude', weight: 40, category: 'content-type' },
  { keyword: 'entertainment news', type: 'exclude', weight: 80, category: 'entertainment' },
];

const seedDefaultData = async () => {
  // Upsert sources by name so bad URLs get corrected on restart
  for (const source of DEFAULT_SOURCES) {
    await Source.updateOne(
      { name: source.name },
      { $set: source },
      { upsert: true }
    );
  }
  console.log(`[seed] Upserted ${DEFAULT_SOURCES.length} default sources`);

  // Remove the 3 dead sources that were in the old seed
  const deadNames = ['WSAZ Local News', 'WCHS/Fox11 Charleston', 'Ohio Emergency Management', 'Ohio DOT Traffic Alerts', 'Come Follow Me — Church News'];
  const removed = await Source.deleteMany({ name: { $in: deadNames } });
  if (removed.deletedCount > 0) {
    console.log(`[seed] Removed ${removed.deletedCount} dead sources`);
  }

  // Seed keywords only once
  const keywordCount = await KeywordRule.countDocuments();
  if (keywordCount === 0) {
    const all = [...DEFAULT_INCLUDE_KEYWORDS, ...DEFAULT_EXCLUDE_KEYWORDS];
    await KeywordRule.insertMany(all);
    console.log(`[seed] Added ${all.length} keyword rules`);
  }
};

module.exports = { seedDefaultData };
