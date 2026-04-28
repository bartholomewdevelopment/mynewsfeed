const axios = require('axios');
const FeedItem = require('../models/FeedItem');
const { extractArticle } = require('./articleExtractor');

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

const fetchLessonViaApi = async (lessonNumber) => {
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
  const text = body
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h\d>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return {
    title: meta.title || `Come, Follow Me — Lesson ${lessonNumber}`,
    summary: text.substring(0, 8000),
    itemUrl: `${CFM_BASE_URL}${uri}?lang=eng`,
  };
};

const fetchLessonViaHtml = async (lessonNumber) => {
  const itemUrl = `${CFM_BASE_URL}${CFM_BASE_URI}/${lessonNumber}?lang=eng`;
  const article = await extractArticle(itemUrl);
  return {
    title: article.title || `Come, Follow Me — Lesson ${lessonNumber}`,
    summary: article.textContent.substring(0, 600),
    itemUrl,
  };
};

const fetchLesson = async (lessonNumber) => {
  try {
    return await fetchLessonViaApi(lessonNumber);
  } catch {
    // API blocked or unavailable — fall back to HTML extraction
    return await fetchLessonViaHtml(lessonNumber);
  }
};

const fetchComeFollowMe = async () => {
  const currentLesson = getCurrentLessonNumber();
  const lessonNumbers = [currentLesson];
  if (currentLesson < TOTAL_LESSONS) lessonNumbers.push(currentLesson + 1);

  let newCount = 0;

  for (const lessonNumber of lessonNumbers) {
    try {
      const guid = `cfm-2026-lesson-${lessonNumber}`;
      if (await FeedItem.exists({ guid })) continue;

      const lesson = await fetchLesson(lessonNumber);
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
        guid,
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
