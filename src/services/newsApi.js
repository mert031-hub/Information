const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";
const CACHE_TTL = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 4500;

const categoryQueries = {
  technology: [
    "sourcecountry:PL technologia",
    "sourcecountry:PL technologie",
    "sourcecountry:PL sztuczna inteligencja",
    "sourcecountry:PL technology",
  ],
  economy: [
    "sourcecountry:PL gospodarka",
    "sourcecountry:PL ekonomia",
    "sourcecountry:PL biznes",
    "sourcecountry:PL finanse",
  ],
  politics: [
    "sourcecountry:PL polityka",
    "sourcecountry:PL rząd",
    "sourcecountry:PL parlament",
    "sourcecountry:PL politics",
  ],
  weather: [
    "sourcecountry:PL pogoda",
    "sourcecountry:PL prognoza",
    "sourcecountry:PL deszcz",
    "sourcecountry:PL weather",
  ],
  culture: [
    "sourcecountry:PL kultura",
    "sourcecountry:PL muzyka",
    "sourcecountry:PL film",
    "sourcecountry:PL sztuka",
  ],
};

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
  const queries = categoryQueries[category] || categoryQueries.technology;
  const cached = cache.get(category);
  if (cached && cached.expiresAt > Date.now()) return cached.articles;

  const endpoints = queries.flatMap((query) => {
    const params = new URLSearchParams({
      query,
      mode: "artlist",
      format: "json",
      maxrecords: "3",
      sort: "datedesc",
    });
    const target = `${GDELT_ENDPOINT}?${params}`;
    return [
      target,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    ];
  });
  const articles = await Promise.any(endpoints.map(async (endpoint) => {
    const response = await fetchWithTimeout(endpoint, signal);
    if (!response.ok) throw new Error(`News API responded with ${response.status}`);
    const data = await response.json();
    const result = (Array.isArray(data.articles) ? data.articles : [])
      .map(normalizeArticle)
      .filter(Boolean)
      .filter((article, index, list) =>
        list.findIndex((candidate) => candidate.url === article.url) === index,
      );
    if (!result.length) throw new Error("News API returned no articles");
    return result;
  }));
  cache.set(category, { articles, expiresAt: Date.now() + CACHE_TTL });
  return articles;
}
