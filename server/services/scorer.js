const SEVERITY_SCORES = { critical: 100, high: 60, moderate: 20, low: 5, none: 0 };

const LOCAL_KEYWORDS = ['45686', 'gallipolis', 'gallia county', 'gallia', 'rio grande', 'meigs county'];

const scoreItem = (item, keywordRules) => {
  let score = 0;
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();

  // Base type bonus
  if (item.type === 'alert') score += 50;
  else if (item.type === 'church') score += 15;
  else if (item.type === 'video') score += 5;

  // Source priority
  score += (item.sourcePriority || 5) * 2;

  // Location relevance
  score += (item.locationRelevance || 0) * 3;

  // Severity
  score += SEVERITY_SCORES[item.severity] || 0;

  // Keyword rules
  for (const rule of keywordRules) {
    if (!rule.active) continue;
    if (text.includes(rule.keyword.toLowerCase())) {
      score += rule.type === 'include' ? rule.weight : -rule.weight;
    }
  }

  // Recency bonus
  if (item.publishedAt) {
    const ageHours = (Date.now() - new Date(item.publishedAt).getTime()) / 3600000;
    if (ageHours < 1) score += 20;
    else if (ageHours < 6) score += 10;
    else if (ageHours < 24) score += 5;
  }

  return Math.max(-200, score);
};

const getSeverityFromText = (text) => {
  const t = text.toLowerCase();
  if (
    t.includes('tornado warning') || t.includes('flash flood warning') ||
    t.includes('evacuation order') || t.includes('shelter in place') ||
    t.includes('chemical spill') || t.includes('active shooter') ||
    t.includes('boil water advisory')
  ) return 'critical';

  if (
    t.includes('severe thunderstorm warning') || t.includes('flood warning') ||
    t.includes('shooting') || t.includes('missing person') ||
    t.includes('power outage') || t.includes('road closure') ||
    t.includes('major accident') || t.includes('warning')
  ) return 'high';

  if (
    t.includes('watch') || t.includes('advisory') || t.includes('storm') ||
    t.includes('crash') || t.includes('accident') || t.includes('alert')
  ) return 'moderate';

  return 'none';
};

const getLocationRelevance = (text, locationTags = []) => {
  let score = 0;
  const t = text.toLowerCase();
  for (const kw of LOCAL_KEYWORDS) {
    if (t.includes(kw)) score += 10;
  }
  for (const tag of locationTags) {
    if (t.includes(tag.toLowerCase())) score += 20;
  }
  return score;
};

module.exports = { scoreItem, getSeverityFromText, getLocationRelevance };
