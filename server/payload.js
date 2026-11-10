import { categoryIds, getCategory } from "./categories.js";
import { providerLabel } from "../src/data/format.js";

// Hem /api/news/all hem de statik public/news.json AYNI biçimi kullanır; arayüz farkı bilmez.

// Bir makaleyi arayüze gönderirken "neden buradayım?" bilgisini de ekle.
export function toPublic(article) {
  const { _id, category, fetchedAt, provider, query, feedUrl, ...rest } = article;
  return { id: _id, ...rest, why: { provider, query, feedUrl, fetchedAt } };
}

export async function snapshotCategory(store, id) {
  const category = getCategory(id);
  const articles = (await store.listArticles(id, 20)).map(toPublic);
  const newest = articles.reduce((max, a) => (a.why.fetchedAt > max ? a.why.fetchedAt : max), "");
  return {
    category: id,
    label: category.label,
    articles,
    explain: { why: category.why, provider: articles[0]?.why.provider ?? null, lastFetchedAt: newest || null },
  };
}

// Hata satırına saat koyarız: eski (kayıtlı) bir hata ile yeni bir hatayı ayırt etmek için.
const clock = (iso) => new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export async function buildAllNews(store, extra = {}) {
  const categories = {};
  const runs = await store.listRuns(40);
  for (const id of categoryIds) {
    categories[id] = await snapshotCategory(store, id);
    // Haber yoksa nedenini (son başarısız deneme) arayüze ilet.
    if (!categories[id].articles.length) {
      const failed = runs.filter((run) => run.category === id && run.status === "error").slice(0, 2);
      if (failed.length)
        categories[id].explain.lastError = failed.map((run) => `${providerLabel(run.provider)} [${clock(run.at)}]: ${run.error}`).join(" · ");
    }
  }
  return { generatedAt: new Date().toISOString(), store: store.kind, categories, ...extra };
}
