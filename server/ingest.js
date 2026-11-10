import { categories } from "./categories.js";
import * as googleNews from "./sources/googleNewsRss.js";
import * as gdelt from "./sources/gdelt.js";

// HTTP başlıkları yalnızca Latin-1 olabilir; Türkçe harf (ı, ş...) koyma, fetch istek atmadan hata verir.
export const USER_AGENT = "BMO-News/1.0 (university course project; news aggregator)";

export function makeFetchText({ fetchImpl = fetch, timeoutMs = 12000 } = {}) {
  return async function fetchText(url, { accept } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        signal: controller.signal,
        headers: { "user-agent": USER_AGENT, accept: accept ?? "*/*" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (error.name === "AbortError") throw new Error(`Zaman aşımı (${timeoutMs} ms)`);
      const code = error.cause?.code; // ör. ENOTFOUND (DNS), ECONNREFUSED, CERT_* (sertifika)
      throw new Error(code ? `${error.message} (${code})` : error.message);
    } finally {
      clearTimeout(timer);
    }
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Kaynak sırası: önce Google News RSS, olmazsa GDELT. Her deneme "runs" günlüğüne yazılır.
export async function refreshCategory(category, store, { fetchText, now = () => new Date(), sources = [googleNews, gdelt] }) {
  const attempts = [];
  for (const source of sources) {
    const started = Date.now();
    const run = { category: category.id, provider: source.id, at: now().toISOString() };
    try {
      const { feedUrl, query, articles } = await source.fetchCategory(category, fetchText);
      if (!articles.length) throw new Error("Kaynak 0 haber döndürdü");
      // Aynı haber iki kategoride çıkabilir; kimlik kategoriyi de içerir ki biri diğerini ezmesin.
      const kept = articles.slice(0, 20).map((article) => ({ ...article, _id: `${category.id}-${article._id}` }));
      await store.upsertArticles(category.id, kept, run.at);
      Object.assign(run, { status: "ok", count: kept.length, durationMs: Date.now() - started, feedUrl, query });
      await store.addRun(run);
      attempts.push(run);
      return { ok: true, attempts };
    } catch (error) {
      Object.assign(run, { status: "error", count: 0, durationMs: Date.now() - started, error: error.message });
      await store.addRun(run);
      attempts.push(run);
    }
  }
  return { ok: false, attempts };
}

// Kategoriler SIRAYLA çekilir: hem kaynak servislerin rate limitine saygı, hem de günlüğün okunabilir olması için.
export async function refreshAll(store, options = {}) {
  const { gapMs = 1500, ...rest } = options;
  const fetchText = rest.fetchText ?? makeFetchText();
  const results = {};
  for (const [index, category] of categories.entries()) {
    if (index && gapMs) await sleep(gapMs);
    results[category.id] = await refreshCategory(category, store, { ...rest, fetchText });
  }
  return results;
}
