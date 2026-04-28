const axios = require('axios');
const { Readability } = require('@mozilla/readability');
const { parseHTML } = require('linkedom');

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// URL patterns that indicate a login or subscription wall
const LOGIN_URL_PATTERNS = [
  /\/login/i, /\/signin/i, /\/sign-in/i, /\/subscribe/i,
  /\/subscription/i, /\/paywall/i, /\/register/i, /\/account\/create/i,
];

// HTML text indicators of a paywall or login requirement
const PAYWALL_TEXT_PATTERNS = [
  /subscribe to (continue|read|access)/i,
  /subscription required/i,
  /subscribers only/i,
  /sign in to (continue|read|access)/i,
  /log in to (continue|read|access)/i,
  /create (a free )?account to (continue|read)/i,
  /this (article|content|story) is (for|available to) (subscribers|members|paid)/i,
  /you've reached your (free article|monthly) limit/i,
  /already a subscriber\?/i,
  /get unlimited access/i,
  /start your (free )?trial/i,
];

// Schema.org structured data indicating paid content
const PAID_SCHEMA_PATTERN = /"isAccessibleForFree"\s*:\s*"?false"?/i;

const detectPaywall = (html, finalUrl) => {
  // Redirected to a login/subscribe URL
  if (LOGIN_URL_PATTERNS.some((p) => p.test(finalUrl))) {
    return 'This page requires you to sign in or subscribe.';
  }

  // Schema.org marks it as paid
  if (PAID_SCHEMA_PATTERN.test(html)) {
    return 'This article is marked as subscriber-only content.';
  }

  // Paywall text in the HTML
  for (const pattern of PAYWALL_TEXT_PATTERNS) {
    if (pattern.test(html)) {
      return 'This site requires a subscription or login to read the full article.';
    }
  }

  return null;
};

const extractArticle = async (url) => {
  let finalUrl = url;
  let html = '';

  try {
    const res = await axios.get(url, {
      headers: FETCH_HEADERS,
      timeout: 15000,
      maxRedirects: 5,
    });
    finalUrl = res.request?.res?.responseUrl || url;
    html = res.data || '';
  } catch (err) {
    const status = err.response?.status;

    if (status === 401) {
      const e = new Error('This site requires a subscription or login to access.');
      e.code = 'PAYWALL';
      throw e;
    }

    if (status === 403) {
      // 403 can mean paywall OR bot/CDN protection (Cloudflare, etc.)
      // Check the error response body or headers to distinguish
      const errorBody = err.response?.data || '';
      const isBotBlock =
        /cloudflare|just a moment|checking your browser|access denied|bot protection/i.test(
          typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody)
        ) ||
        err.response?.headers?.['cf-ray'] !== undefined ||
        err.response?.headers?.['server'] === 'cloudflare';

      const e = new Error(
        isBotBlock
          ? 'This site blocks automated requests (bot protection). Use Open Article to read it in your browser.'
          : 'This site requires a subscription or login to access.'
      );
      e.code = isBotBlock ? 'BLOCKED' : 'PAYWALL';
      throw e;
    }

    throw err;
  }

  // Check for paywall before trying to parse
  const paywallMsg = detectPaywall(html, finalUrl);
  if (paywallMsg) {
    const e = new Error(paywallMsg);
    e.code = 'PAYWALL';
    throw e;
  }

  const { document } = parseHTML(html);
  document.baseURI = url;
  document.documentURI = url;

  const reader = new Readability(document, { charThreshold: 100 });
  const article = reader.parse();

  if (!article) {
    throw new Error('Could not extract article content from this page.');
  }

  const text = (article.textContent || '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  // If extracted text is suspiciously short it may be a soft paywall
  // (site shows a teaser but hides the rest without a hard redirect)
  if (text.length < 300 && html.length > 5000) {
    const softPaywall = detectPaywall(html, finalUrl);
    if (softPaywall) {
      const e = new Error(softPaywall);
      e.code = 'PAYWALL';
      throw e;
    }
  }

  return {
    title: article.title || '',
    byline: article.byline || '',
    excerpt: article.excerpt || '',
    textContent: text,
    siteName: article.siteName || '',
  };
};

module.exports = { extractArticle };
