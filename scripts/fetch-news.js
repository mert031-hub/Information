// Backend olmadan çalışan yol: haberleri bir kez toplar ve public/news.json dosyasına yazar.
// Arayüz /api'ye ulaşamazsa bu dosyayı okur. GitHub Actions bunu saatte bir çalıştırır (.github/workflows/news.yml).
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createFileStore } from "../server/store/fileStore.js";
import { refreshAll } from "../server/ingest.js";
import { buildAllNews } from "../server/payload.js";

const out = path.resolve("public/news.json");
const store = await createFileStore(path.join(os.tmpdir(), `bmo-snapshot-${process.pid}.json`));

// Önceki dosyadaki haberleri geri yükle: bir kategori bu sefer çekilemezse eski haberleri korunur.
try {
  const previous = JSON.parse(await fs.readFile(out, "utf8"));
  for (const [categoryId, entry] of Object.entries(previous.categories ?? {}))
    for (const { id, why = {}, ...rest } of entry.articles ?? [])
      await store.upsertArticles(categoryId, [{ _id: id, ...rest, provider: why.provider, query: why.query, feedUrl: why.feedUrl }], why.fetchedAt);
} catch {
  /* ilk çalıştırma */
}

const results = await refreshAll(store, { gapMs: 2000 });
for (const [id, result] of Object.entries(results))
  console.log(`${id}: ${result.ok ? "OK  " + result.attempts.at(-1).provider : "HATA " + result.attempts.map((a) => a.error).join(" | ")}`);

const data = await buildAllNews(store, { store: "snapshot", runs: await store.listRuns(25) });
const total = Object.values(data.categories).reduce((sum, c) => sum + c.articles.length, 0);
if (!total) {
  console.error("Hiç haber alınamadı; mevcut public/news.json korunuyor.");
  process.exit(1);
}
await fs.writeFile(out, JSON.stringify(data, null, 1));
console.log(`public/news.json yazıldı (${total} haber)`);
await store.close();
