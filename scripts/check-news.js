// Sunucu/veritabanı olmadan, KENDİ bilgisayarından her kategoriyi gerçek kaynaktan çekip ayrıştırır.
// "Haber neden gelmiyor?" sorusunun en kısa cevabı: npm run check:news
import { categories, googleFeedUrl } from "../server/categories.js";
import * as googleNews from "../server/sources/googleNewsRss.js";
import { makeFetchText } from "../server/ingest.js";
import { BUILD } from "../server/version.js";

console.log(`Kod sürümü: ${BUILD}\n`);
const fetchText = makeFetchText({ timeoutMs: 15000 });
let failures = 0;
for (const category of categories) {
  const started = Date.now();
  try {
    const { articles } = await googleNews.fetchCategory(category, fetchText);
    const first = articles[0];
    console.log(`OK    ${category.id.padEnd(10)} ${String(articles.length).padStart(3)} haber, ${Date.now() - started} ms`);
    console.log(`      ilk: ${first?.title?.slice(0, 90)} — ${first?.source}`);
  } catch (error) {
    failures++;
    console.log(`HATA  ${category.id.padEnd(10)} ${error.message}`);
    console.log(`      adres: ${googleFeedUrl(category)}`);
  }
}
console.log(failures ? `\n${failures} kategori başarısız.` : "\nHepsi başarılı: ayrıştırma ve ağ erişimi çalışıyor.");
process.exit(failures ? 1 : 0);
