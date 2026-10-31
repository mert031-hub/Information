const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";
const CACHE_TTL = 5 * 60 * 1000;

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

  let lastError;
  for (const query of queries) {
    const params = new URLSearchParams({
      query,
      mode: "artlist",
      format: "json",
      maxrecords: "5",
      sort: "datedesc",
    });
    const target = `${GDELT_ENDPOINT}?${params}`;
    const endpoints = [
      target,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    ];
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok)
          throw new Error(`News API responded with ${response.status}`);
        const data = await response.json();
        const articles = (Array.isArray(data.articles) ? data.articles : [])
          .map(normalizeArticle)
          .filter(Boolean)
          .filter((article, index, list) =>
            list.findIndex((candidate) => candidate.url === article.url) === index,
          );
        if (articles.length) {
          cache.set(category, { articles, expiresAt: Date.now() + CACHE_TTL });
          return articles;
        }
      } catch (error) {
        if (error.name === "AbortError") throw error;
        lastError = error;
      }
    }
  }
  throw lastError || new Error("News API returned no articles");
}
