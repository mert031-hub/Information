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

const rssQueries = {
  technology: ["Polska technologia", "Polska sztuczna inteligencja", "Poland technology"],
  economy: ["Polska gospodarka", "Polska ekonomia biznes", "Poland economy"],
  politics: ["Polska polityka", "Polska rząd parlament", "Poland politics"],
  weather: ["Polska pogoda", "Polska prognoza pogody", "Poland weather"],
  culture: ["Polska kultura", "Polska muzyka film", "Polish culture"],
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

function normalizeRssArticle(article, index) {
  const title = String(article.title || "").trim();
  const url = String(article.link || "").trim();
  if (!title || !url) return null;
  const description = String(article.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    id: `rss-${index}-${url}`,
    title,
    url,
    source: article.author || "Google News Polska",
    image: article.thumbnail || article.enclosure?.link || "",
    publishedAt: article.pubDate || "",
    summary: description || "Polonya’dan güncel haber özeti.",
  };
}

function parseRssXml(xml) {
  const document = new DOMParser().parseFromString(xml, "text/xml");
  return [...document.querySelectorAll("item")]
    .map((item, index) => normalizeRssArticle({
      title: item.querySelector("title")?.textContent,
      link: item.querySelector("link")?.textContent,
      description: item.querySelector("description")?.textContent,
      pubDate: item.querySelector("pubDate")?.textContent,
      author: item.querySelector("source")?.textContent,
    }, index))
    .filter(Boolean)
    .slice(0, 3);
}

export async function fetchPolandNews(category, signal) {
  const queries = categoryQueries[category] || categoryQueries.technology;
  const cached = cache.get(category);
  if (cached && cached.expiresAt > Date.now()) return cached.articles;

  try {
    const rssQueriesForCategory = rssQueries[category] || rssQueries.technology;
    const rssArticles = await Promise.any(rssQueriesForCategory.map(async (query) => {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pl&gl=PL&ceid=PL:pl`;
      const proxyRequests = [
        {
          url: `https://cors.isomorphic-git.org/${rssUrl}`,
          parse: (response) => response.text(),
        },
        {
          url: `https://proxy.corsfix.com/?${rssUrl}`,
          parse: (response) => response.text(),
        },
        {
          url: `https://corsproxy.org/?url=${encodeURIComponent(rssUrl)}`,
          parse: (response) => response.text(),
        },
        {
          url: `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
          parse: (response) => response.text(),
        },
        {
          url: `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`,
          parse: async (response) => (await response.json()).contents,
        },
        {
          url: `https://corsproxy.io/?url=${encodeURIComponent(rssUrl)}`,
          parse: (response) => response.text(),
        },
        {
          url: `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(rssUrl)}`,
          parse: (response) => response.text(),
        },
      ];
      const articles = await Promise.any(proxyRequests.map(async ({ url, parse }) => {
        const response = await fetchWithTimeout(url, signal);
        if (!response.ok) throw new Error(`RSS proxy responded with ${response.status}`);
        return parseRssXml(await parse(response));
      }));
      if (!articles.length) throw new Error("RSS returned no articles");
      return articles;
    }));
    cache.set(category, { articles: rssArticles, expiresAt: Date.now() + CACHE_TTL });
    return rssArticles;
  } catch (error) {
    if (error.name === "AbortError") throw error;
  }

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
      `https://r.jina.ai/${target.replace("https://", "http://")}`,
      target,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    ];
  });
  const articles = await Promise.any(endpoints.map(async (endpoint) => {
    const response = await fetchWithTimeout(endpoint, signal);
    if (!response.ok) throw new Error(`News API responded with ${response.status}`);
    const raw = await response.text();
    const data = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
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
