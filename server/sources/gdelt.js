import { gdeltUrl } from "../categories.js";
import { articleId } from "./googleNewsRss.js";

export const id = "gdelt";

// GDELT tarihi "20261105T143000Z" biçiminde verir.
export function parseGdeltDate(value) {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(String(value ?? ""));
  return match ? new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6])).toISOString() : null;
}

export function parseGdelt(text, { feedUrl, query } = {}) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // GDELT hata durumunda JSON yerine düz metin döndürür (ör. rate limit mesajı).
    throw new Error(`GDELT JSON döndürmedi: ${String(text).slice(0, 80)}`);
  }
  return (data.articles ?? [])
    .filter((article) => article.title && article.url)
    .map((article) => ({
      _id: articleId(article.url),
      title: String(article.title).trim(),
      url: article.url,
      source: article.domain || "Bilinmeyen kaynak",
      sourceUrl: article.domain ? `https://${article.domain}` : "",
      summary: "",
      image: article.socialimage || "",
      publishedAt: parseGdeltDate(article.seendate),
      provider: id,
      feedUrl,
      query: query ?? "",
    }));
}

// GDELT "5 saniyede en fazla 1 istek" ister; fazlasına HTTP 429 verir. Çağrılar arasına bu aralığı koyarız.
export const throttle = { minIntervalMs: 5500, last: 0, queue: Promise.resolve() };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function takeTurn() {
  const turn = throttle.queue.then(async () => {
    const delay = throttle.last + throttle.minIntervalMs - Date.now();
    if (delay > 0) await wait(delay);
    throttle.last = Date.now();
  });
  throttle.queue = turn.catch(() => {});
  return turn;
}

export async function fetchCategory(category, fetchText) {
  await takeTurn();
  const feedUrl = gdeltUrl(category);
  const text = await fetchText(feedUrl, { accept: "application/json" });
  return { feedUrl, query: category.gdelt, articles: parseGdelt(text, { feedUrl, query: category.gdelt }) };
}
