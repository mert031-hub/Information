import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { parseRss, decodeEntities } from "../server/sources/googleNewsRss.js";
import { parseGdelt, parseGdeltDate, throttle } from "../server/sources/gdelt.js";
throttle.minIntervalMs = 0; // testler beklemesin
import { createFileStore } from "../server/store/fileStore.js";
import { refreshCategory, makeFetchText, USER_AGENT } from "../server/ingest.js";
import { createApp } from "../server/app.js";
import { categories, googleFeedUrl, gdeltUrl } from "../server/categories.js";

const RSS = `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>
<item><title>Nowy procesor od polskiej firmy - Przykład.pl</title><link>https://news.example/a1</link>
<pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate><description>&lt;a href="x"&gt;Nowy procesor od polskiej firmy&lt;/a&gt;&nbsp;&nbsp;&lt;font&gt;Przykład.pl&lt;/font&gt;</description>
<source url="https://przyklad.pl">Przykład.pl</source></item>
<item><title>Druga wiadomość - Inny Portal</title><link>https://news.example/a2</link><pubDate>Thu, 05 Nov 2026 12:00:00 GMT</pubDate>
<description>Krótki opis tej wiadomości, który różni się od tytułu.</description><source url="https://inny.pl">Inny Portal</source></item>
<item><title>Bez linku</title></item></channel></rss>`;

const tmpFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "bmo-")), "store.json");
const fakeFetch = (routes) => async (url) => {
  const hit = Object.entries(routes).find(([key]) => url.includes(key));
  if (!hit) throw new Error("beklenmeyen URL " + url);
  const value = hit[1];
  if (value instanceof Error) throw value;
  return { ok: value.status === undefined, status: value.status ?? 200, text: async () => value.body };
};

test("RSS: başlıktan kaynak ayrılır, özet temizlenir, linksiz öğe atılır", () => {
  const list = parseRss(RSS, { feedUrl: "f", query: "q" });
  assert.equal(list.length, 2);
  assert.equal(list[0].title, "Nowy procesor od polskiej firmy");
  assert.equal(list[0].source, "Przykład.pl");
  assert.equal(list[0].summary, "", "özet başlığın tekrarıysa boş bırakılır");
  assert.match(list[1].summary, /^Krótki opis/);
  assert.equal(list[0].publishedAt, "2026-11-05T10:00:00.000Z");
  assert.equal(list[0].provider, "google-news-rss");
  assert.equal(list[0].query, "q");
});

test("RSS: bozuk XML anlaşılır hata verir", () => {
  assert.throws(() => parseRss("<html></html>"), /RSS biçimi/);
});

test("GDELT: tarih ve JSON olmayan yanıt işlenir", () => {
  assert.equal(parseGdeltDate("20261105T143000Z"), "2026-11-05T14:30:00.000Z");
  assert.equal(parseGdeltDate("bozuk"), null);
  assert.throws(() => parseGdelt("Please limit requests to one every 5 seconds"), /JSON döndürmedi/);
  const [a] = parseGdelt(JSON.stringify({ articles: [{ title: "T", url: "https://x.pl/1", domain: "x.pl", seendate: "20261105T143000Z" }, { title: "", url: "u" }] }));
  assert.equal(a.source, "x.pl");
});

test("kategori URL'leri Polonya/Lehçe için kurulur", () => {
  assert.equal(categories.length, 5);
  for (const category of categories) {
    assert.match(googleFeedUrl(category), /gl=PL.*ceid=PL:pl/);
    assert.match(gdeltUrl(category), /sourcecountry%3APL/);
  }
});

test("ingest: Google çalışırsa GDELT'e hiç gidilmez ve veri depoya yazılır", async () => {
  const store = await createFileStore(tmpFile());
  const fetchText = makeFetchText({ fetchImpl: fakeFetch({ "news.google.com": { body: RSS } }) });
  const result = await refreshCategory(categories[0], store, { fetchText });
  assert.equal(result.ok, true);
  assert.equal(result.attempts.length, 1);
  assert.equal((await store.listArticles("technology")).length, 2);
  assert.equal((await store.listRuns())[0].provider, "google-news-rss");
});

test("ingest: Google hata verirse GDELT yedeği devreye girer, iki deneme de günlüğe yazılır", async () => {
  const store = await createFileStore(tmpFile());
  const gdeltBody = JSON.stringify({ articles: [{ title: "Yedek haber", url: "https://x.pl/y", domain: "x.pl", seendate: "20261105T100000Z" }] });
  const fetchText = makeFetchText({ fetchImpl: fakeFetch({ "news.google.com": { status: 503 }, "gdeltproject": { body: gdeltBody } }) });
  const result = await refreshCategory(categories[1], store, { fetchText });
  assert.equal(result.ok, true);
  assert.deepEqual(result.attempts.map((a) => [a.provider, a.status]), [["google-news-rss", "error"], ["gdelt", "ok"]]);
  assert.match(result.attempts[0].error, /HTTP 503/);
});

test("ingest: iki kaynak da düşerse ok=false, eski haberler silinmez", async () => {
  const store = await createFileStore(tmpFile());
  await refreshCategory(categories[0], store, { fetchText: makeFetchText({ fetchImpl: fakeFetch({ "news.google.com": { body: RSS } }) }) });
  const down = makeFetchText({ fetchImpl: fakeFetch({ "news.google.com": new Error("ağ yok"), gdeltproject: new Error("ağ yok") }) });
  const result = await refreshCategory(categories[0], store, { fetchText: down });
  assert.equal(result.ok, false);
  assert.equal((await store.listArticles("technology")).length, 2);
});

test("aynı haber iki kez yazılmaz (URL özeti = kimlik)", async () => {
  const store = await createFileStore(tmpFile());
  const fetchText = makeFetchText({ fetchImpl: fakeFetch({ "news.google.com": { body: RSS } }) });
  await refreshCategory(categories[0], store, { fetchText });
  await refreshCategory(categories[0], store, { fetchText });
  assert.equal((await store.counts()).technology, 2);
});

async function withServer(fn, env = {}) {
  const store = await createFileStore(tmpFile());
  const fetchText = makeFetchText({ fetchImpl: fakeFetch({ "news.google.com": { body: RSS } }) });
  const { refreshAll } = await import("../server/ingest.js");
  const app = createApp({ store, env, refresh: () => refreshAll(store, { fetchText, gapMs: 0 }), distDir: "/yok" });
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn({ base, store, app });
  } finally {
    server.close();
  }
}

test("API: boş depoda ilk istek yenilemeyi başlatır, sonra haberler 'neden' bilgisiyle gelir", async () => {
  await withServer(async ({ base, app }) => {
    const first = await (await fetch(`${base}/api/news/all`)).json();
    assert.equal(Object.keys(first.categories).length, 5);
    await app.locals.state.refreshing;
    const second = await (await fetch(`${base}/api/news/all`)).json();
    const tech = second.categories.technology;
    assert.equal(tech.articles.length, 2);
    assert.equal(tech.articles[0].why.provider, "google-news-rss");
    assert.ok(tech.explain.why);
    assert.equal(tech.explain.provider, "google-news-rss");
  });
});

test("API: geçersiz kategori 400, /api/sources ayarları ve günlüğü açıklar", async () => {
  await withServer(async ({ base, app }) => {
    assert.equal((await fetch(`${base}/api/news?category=spor`)).status, 400);
    await app.locals.triggerRefresh();
    const sources = await (await fetch(`${base}/api/sources`)).json();
    assert.deepEqual(sources.order, ["google-news-rss", "gdelt"]);
    assert.equal(sources.categories.length, 5);
    assert.ok(sources.recentRuns.length >= 5);
  });
});

test("API: elle yenileme token ister; token yoksa kapalıdır", async () => {
  await withServer(async ({ base }) => {
    assert.equal((await fetch(`${base}/api/refresh`, { method: "POST" })).status, 403);
  });
  await withServer(async ({ base }) => {
    assert.equal((await fetch(`${base}/api/refresh`, { method: "POST" })).status, 401);
    assert.equal((await fetch(`${base}/api/refresh`, { method: "POST", headers: { "x-admin-token": "s" } })).status, 202);
  }, { ADMIN_TOKEN: "s" });
});

test("istek başlıkları gerçek fetch'in kabul edeceği karakterlerden oluşur", async () => {
  assert.match(USER_AGENT, /^[\x20-\x7e]+$/);
  let headers;
  const fetchText = makeFetchText({ fetchImpl: async (_url, init) => { headers = init.headers; return { ok: true, text: async () => "x" }; } });
  await fetchText("https://x.pl", { accept: "text/plain" });
  assert.doesNotThrow(() => new Headers(headers)); // Node'un gerçek Headers sınıfı Latin-1 dışını reddeder
});

test("buildAllNews: statik news.json ile API aynı biçimi paylaşır; boş kategoride neden yazar", async () => {
  const { buildAllNews } = await import("../server/payload.js");
  const store = await createFileStore(tmpFile());
  const fetchText = makeFetchText({ fetchImpl: fakeFetch({ "news.google.com": { body: RSS }, gdeltproject: new Error("kapalı") }) });
  await refreshCategory(categories[0], store, { fetchText });
  const down = makeFetchText({ fetchImpl: fakeFetch({ "news.google.com": new Error("ağ yok"), gdeltproject: new Error("ağ yok") }) });
  await refreshCategory(categories[1], store, { fetchText: down });
  const data = await buildAllNews(store, { store: "snapshot" });
  assert.equal(data.store, "snapshot");
  assert.equal(data.categories.technology.articles.length, 2);
  assert.equal(data.categories.technology.articles[0].why.provider, "google-news-rss");
  assert.match(data.categories.economy.explain.lastError, /ağ yok/);
  assert.ok(data.generatedAt);
});

test("RSS: yüzlerce HTML karakter kodu içeren gerçek Google özeti 'Entity expansion limit' hatası vermez", () => {
  const items = Array.from({ length: 60 }, (_, i) =>
    `&lt;li&gt;&lt;a href=&quot;https://x.pl/${i}&quot; target=&quot;_blank&quot;&gt;Haber ${i}&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font color=&quot;#6f6f6f&quot;&gt;Kaynak&lt;/font&gt;&lt;/li&gt;`).join("");
  const xml = `<rss><channel><item><title>Ekonomia &amp; rynek &#8211; Portal - Portal</title><link>https://n.pl/1?a=1&amp;b=2</link>
    <pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate><description>&lt;ol&gt;${items}&lt;/ol&gt;</description>
    <source url="https://p.pl/?a=1&amp;b=2">Portal</source></item></channel></rss>`;
  assert.ok((xml.match(/&/g) ?? []).length > 1000);
  const [article] = parseRss(xml);
  assert.equal(article.title, "Ekonomia & rynek – Portal");
  assert.equal(article.url, "https://n.pl/1?a=1&b=2");
  assert.equal(article.sourceUrl, "https://p.pl/?a=1&b=2");
  assert.ok(!/[<>]|&lt;|&quot;/.test(article.summary), "özette etiket/kod kalmamalı");
  assert.match(article.summary, /Haber 0/);
});

test("decodeEntities: adlı, ondalık ve onaltılık kodları çözer; bilinmeyeni bozmaz", () => {
  assert.equal(decodeEntities("A&amp;B &quot;x&quot; &#269; &#x107; &unknown;"), 'A&B "x" č ć &unknown;');
});

test("GDELT çağrıları arasına aralık konur", async () => {
  const gdelt = await import("../server/sources/gdelt.js");
  gdelt.throttle.minIntervalMs = 60;
  gdelt.throttle.last = 0;
  const body = JSON.stringify({ articles: [{ title: "T", url: "https://x.pl/1", domain: "x.pl" }] });
  const times = [];
  const fetchText = async () => { times.push(Date.now()); return body; };
  await Promise.all([gdelt.fetchCategory(categories[0], fetchText), gdelt.fetchCategory(categories[1], fetchText)]);
  gdelt.throttle.minIntervalMs = 0;
  assert.ok(times[1] - times[0] >= 55, `aralık yetersiz: ${times[1] - times[0]} ms`);
});

test("API: /api/health ve /api/sources sunucu sürümünü bildirir; hata satırı saat içerir", async () => {
  await withServer(async ({ base, store }) => {
    const health = await (await fetch(`${base}/api/health`)).json();
    assert.match(health.build, /^\d{4}-\d{2}-\d{2}/);
    assert.ok(health.startedAt);
    const sources = await (await fetch(`${base}/api/sources`)).json();
    assert.equal(sources.build, health.build);
    await store.addRun({ category: "culture", provider: "gdelt", at: "2026-11-10T20:00:00.000Z", status: "error", count: 0, error: "HTTP 429" });
    const all = await (await fetch(`${base}/api/news/all`)).json();
    assert.match(all.categories.culture.explain.lastError, /GDELT.*\[\d\d[.:]\d\d[.:]\d\d\]: HTTP 429/);
  });
});
