// GDELT is queried by the companion Worker so the browser never needs to
// cross a public CORS proxy or absorb its rate limits.
const NEWS_API_BASE = "https://bmo-news-api.demirmustafamrt7.chatgpt.site/api/news";
const CACHE_TTL = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 6500;

const cache = new Map();

function fetchWithTimeout(endpoint, signal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  return fetch(endpoint, { signal: controller.signal, headers: { Accept: "application/json" } }).finally(() => {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  });
}

function normalizeArticle(article, index) {
  const title = String(article.title || "").trim();
  const url = String(article.url || "").trim();
  if (!title || !url) return null;
  return {
    id: `${article.domain || "poland"}-${index}-${url}`,
    title,
    url,
    source: article.domain || "Polonya haber kaynağı",
    image: article.socialimage || "",
    publishedAt: article.seendate || "",
    summary:
      article.snippet?.trim() ||
      "GDELT üzerinden alınan güncel Polonya haber özeti.",
  };
}

export async function fetchPolandNews(category, signal) {
  const cached = cache.get(category);
  if (cached && cached.expiresAt > Date.now()) return cached.articles;
  const endpoint = `${NEWS_API_BASE}?category=${encodeURIComponent(category)}`;
  const response = await fetchWithTimeout(endpoint, signal);
  if (!response.ok) throw new Error(`News API responded with ${response.status}`);
  const data = await response.json();
  const articles = (Array.isArray(data.articles) ? data.articles : [])
    .map(normalizeArticle)
    .filter(Boolean)
    .filter((article, index, list) => list.findIndex((candidate) => candidate.url === article.url) === index);
  if (!articles.length) throw new Error(data.error || "News API returned no articles");
  cache.set(category, { articles, expiresAt: Date.now() + CACHE_TTL });
  return articles;
}
