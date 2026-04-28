const axios = require('axios');
const FeedItem = require('../models/FeedItem');

// 2026 Old Testament manual — lesson 1 starts the week of Dec 29, 2025
const CFM_START = new Date('2025-12-29T00:00:00Z');
const CFM_BASE_URI = '/manual/come-follow-me-for-home-and-church-old-testament-2026';
const CFM_BASE_URL = 'https://www.churchofjesuschrist.org';
const CFM_API = `${CFM_BASE_URL}/study/api/v3/language-pages/type/content`;
const TOTAL_LESSONS = 52;

const getCurrentLessonNumber = () => {
  const daysSinceStart = Math.floor((Date.now() - CFM_START.getTime()) / 86400000);
  return Math.min(Math.max(Math.floor(daysSinceStart / 7) + 1, 1), TOTAL_LESSONS);
};

const fetchLesson = async (lessonNumber) => {
  const uri = `${CFM_BASE_URI}/${lessonNumber}`;
  const res = await axios.get(CFM_API, {
    params: { lang: 'eng', uri },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'application/json',
    },
    timeout: 12000,
  });

  const meta = res.data?.meta || {};
  const body = res.data?.content?.body || '';

  // Strip HTML tags for a clean summary
  const text = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const summary = text.substring(0, 600);
  const title = meta.title || `Come, Follow Me — Lesson ${lessonNumber}`;
  const itemUrl = `${CFM_BASE_URL}${uri}?lang=eng`;
  const guid = `cfm-2026-lesson-${lessonNumber}`;

  return { title, summary, itemUrl, guid, meta, lessonNumber };
};

const fetchComeFollowMe = async () => {
  const currentLesson = getCurrentLessonNumber();

  // Fetch this week and next week so you always have both in the feed
  const lessonNumbers = [currentLesson];
  if (currentLesson < TOTAL_LESSONS) lessonNumbers.push(currentLesson + 1);

  let newCount = 0;

  for (const lessonNumber of lessonNumbers) {
    try {
      const guid = `cfm-2026-lesson-${lessonNumber}`;

      // Already in DB — skip
      if (await FeedItem.exists({ guid })) continue;

      const lesson = await fetchLesson(lessonNumber);

      // Set publishedAt to the Monday of that lesson's week so it sorts correctly
      const lessonStartDate = new Date(CFM_START.getTime() + (lessonNumber - 1) * 7 * 86400000);

      await FeedItem.create({
        title: lesson.title,
        sourceName: 'Come, Follow Me — Church of Jesus Christ',
        sourceUrl: CFM_BASE_URL,
        itemUrl: lesson.itemUrl,
        type: 'church',
        category: 'come-follow-me',
        summary: lesson.summary,
        publishedAt: lessonStartDate,
        severity: 'none',
        locationRelevance: 0,
        importanceScore: 40,
        approved: true,
        guid: lesson.guid,
        tags: ['come follow me', 'old testament', '2026'],
      });

      newCount++;
      console.log(`[cfm] Added lesson ${lessonNumber}: ${lesson.title}`);
    } catch (err) {
      console.error(`[cfm] Lesson ${lessonNumber} error:`, err.message);
    }
  }

  return { success: true, count: newCount };
};

module.exports = { fetchComeFollowMe, getCurrentLessonNumber };
