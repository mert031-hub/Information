const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";
const CACHE_TTL = 5 * 60 * 1000;

const categoryQueries = {
  technology: "sourcecountry:PL (technology OR technologia OR AI OR software)",
  economy: "sourcecountry:PL (economy OR gospodarka OR biznes OR finance)",
  politics: "sourcecountry:PL (politics OR polityka OR government OR parliament)",
  weather: "sourcecountry:PL (weather OR pogoda OR forecast OR storm)",
  culture: "sourcecountry:PL (culture OR kultura OR music OR film OR art)",
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
  const query = categoryQueries[category] || categoryQueries.technology;
  const cached = cache.get(category);
  if (cached && cached.expiresAt > Date.now()) return cached.articles;

  const params = new URLSearchParams({
    query,
    mode: "artlist",
    format: "json",
    maxrecords: "5",
    sort: "datedesc",
  });
  const response = await fetch(`${GDELT_ENDPOINT}?${params}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`News API responded with ${response.status}`);
  const data = await response.json();
  const articles = (Array.isArray(data.articles) ? data.articles : [])
    .map(normalizeArticle)
    .filter(Boolean)
    .filter((article, index, list) =>
      list.findIndex((candidate) => candidate.url === article.url) === index,
    );
  cache.set(category, { articles, expiresAt: Date.now() + CACHE_TTL });
  return articles;
}
