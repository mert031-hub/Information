// "Örnek veri" yükler: internet yokken arayüzü denemek içindir. Haberler GERÇEK DEĞİLDİR ve kaynağı "BMO Demo" olarak işaretlidir.
import { openStore } from "./store/index.js";
import { categories } from "./categories.js";
import { articleId } from "./sources/googleNewsRss.js";

const store = await openStore();
const now = Date.now();
for (const category of categories) {
  const list = Array.from({ length: 5 }, (_, i) => {
    const url = `https://example.com/bmo-demo/${category.id}/${i + 1}`;
    return {
      _id: articleId(url),
      title: `[ÖRNEK] ${category.label} haberi ${i + 1}: Ooo'dan demo başlık`,
      url,
      source: "BMO Demo",
      sourceUrl: "https://example.com",
      summary: "Bu içerik gerçek değildir; yalnızca arayüzü ve veritabanı akışını denemek için üretilmiş örnek veridir.",
      image: "",
      publishedAt: new Date(now - i * 3600_000).toISOString(),
      provider: "demo-seed",
      feedUrl: "yerel örnek veri",
      query: "demo",
    };
  });
  await store.upsertArticles(category.id, list, new Date().toISOString());
}
await store.addRun({ category: "all", provider: "demo-seed", at: new Date().toISOString(), status: "ok", count: categories.length * 5, durationMs: 0 });
console.log("Örnek veri yüklendi.");
await store.close();
