import test from "node:test";
import assert from "node:assert/strict";
import { loadNews, parseNewsResponse, CACHE_KEY } from "../src/services/newsApi.js";
import { formatAgo, providerLabel } from "../src/data/format.js";

const article = (n) => ({ id: `a${n}`, title: `Haber ${n}`, url: `https://x.pl/${n}`, source: "x.pl", why: {} });
const payload = (articles, extra = {}) => ({
  generatedAt: "2026-11-06T05:00:00Z", store: "file", refreshing: false,
  categories: { technology: { articles, explain: { why: "neden" } }, economy: { articles: [], explain: {} } }, ...extra,
});
const ok = (body) => async () => ({ ok: true, status: 200, json: async () => body });
const memoryStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }; };
const noSleep = async () => {};

test("başarılı cevap döner ve son iyi veri önbelleğe yazılır", async () => {
  const storage = memoryStorage();
  const result = await loadNews({ fetchImpl: ok(payload([article(1)])), storage, sleep: noSleep });
  assert.equal(result.origin, "network");
  assert.equal(result.categories.technology.articles.length, 1);
  assert.ok(storage.m.has(CACHE_KEY));
});

test("geçici hatada yeniden dener, 1sn ve 2sn bekler", async () => {
  let calls = 0; const waits = [];
  const fetchImpl = async () => { if (++calls < 3) throw new Error("ağ"); return { ok: true, json: async () => payload([article(1)]) }; };
  const result = await loadNews({ fetchImpl, storage: memoryStorage(), sleep: async (ms) => waits.push(ms) });
  assert.equal(result.origin, "network");
  assert.equal(calls, 3);
  assert.deepEqual(waits, [1000, 2000]);
});

test("sunucu çökükse önbellekteki son iyi veriyi hata mesajıyla birlikte verir", async () => {
  const storage = memoryStorage();
  await loadNews({ fetchImpl: ok(payload([article(1)])), storage, sleep: noSleep });
  const result = await loadNews({ fetchImpl: async () => { throw new Error("çöktü"); }, storage, sleep: noSleep });
  assert.equal(result.origin, "cache");
  assert.equal(result.error, "çöktü");
  assert.equal(result.categories.technology.articles[0].title, "Haber 1");
});

test("önbellek de yoksa hata fırlatır (arayüz örnek içeriğe düşer)", async () => {
  await assert.rejects(loadNews({ fetchImpl: async () => ({ ok: false, status: 502 }), storage: memoryStorage(), sleep: noSleep }), /502/);
});

test("sunucu ilk toplamayı yapıyorsa bekleyip tekrar sorar", async () => {
  const bodies = [payload([], { refreshing: true }), payload([article(1)])];
  let i = 0; const waits = [];
  const result = await loadNews({ fetchImpl: async () => ({ ok: true, json: async () => bodies[i++] }), storage: memoryStorage(), sleep: async (ms) => waits.push(ms) });
  assert.equal(result.categories.technology.articles.length, 1);
  assert.deepEqual(waits, [4000]);
});

test("bozuk cevap reddedilir; başlıksız/linksiz haberler ayıklanır", () => {
  assert.throws(() => parseNewsResponse({}), /beklenmeyen/);
  const data = parseNewsResponse({ categories: { technology: { articles: [article(1), { title: "", url: "u" }, { title: "t" }] } } });
  assert.equal(data.categories.technology.articles.length, 1);
});

test("biçim yardımcıları", () => {
  const now = Date.parse("2026-11-06T12:00:00Z");
  assert.equal(formatAgo("2026-11-06T11:59:50Z", now), "az önce");
  assert.equal(formatAgo("2026-11-06T11:30:00Z", now), "30 dk önce");
  assert.equal(formatAgo("2026-11-06T09:00:00Z", now), "3 sa önce");
  assert.equal(formatAgo("2026-11-04T12:00:00Z", now), "2 gün önce");
  assert.equal(formatAgo("bozuk", now), "");
  assert.equal(providerLabel("gdelt"), "GDELT (yedek kaynak)");
});

test("depolama erişimi hata fırlatsa da haberler yüklenir", async () => {
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const result = await loadNews({ fetchImpl: ok(payload([article(1)])), storage: broken, sleep: noSleep });
  assert.equal(result.origin, "network");
});

// API'ye ulaşılamıyor (statik barındırma), ama /news.json var.
const staticHost = (snapshot) => async (url) => {
  if (String(url).endsWith("news.json")) return snapshot ?? { ok: false, status: 404 };
  return { ok: false, status: 404 };
};
const jsonResponse = (body) => ({ ok: true, headers: { get: () => "application/json" }, json: async () => body });

test("API yoksa statik news.json okunur ve origin 'snapshot' olur", async () => {
  const result = await loadNews({ fetchImpl: staticHost(jsonResponse(payload([article(7)]))), storage: memoryStorage(), sleep: noSleep });
  assert.equal(result.origin, "snapshot");
  assert.equal(result.categories.technology.articles[0].title, "Haber 7");
  assert.match(result.error, /404/);
});

test("statik sunucu news.json yerine HTML döndürürse yok sayılır ve hata fırlar", async () => {
  const html = { ok: true, headers: { get: () => "text/html" }, json: async () => { throw new Error("html"); } };
  await assert.rejects(loadNews({ fetchImpl: staticHost(html), storage: memoryStorage(), sleep: noSleep }), /404/);
});

test("tarayıcı önbelleği news.json'dan yeniyse önbellek seçilir", async () => {
  const storage = memoryStorage();
  await loadNews({ fetchImpl: ok(payload([article(1)])), storage, sleep: noSleep }); // önbelleğe yazar (şimdi)
  const old = jsonResponse({ ...payload([article(9)]), generatedAt: "2020-01-01T00:00:00Z" });
  const result = await loadNews({ fetchImpl: staticHost(old), storage, sleep: noSleep });
  assert.equal(result.origin, "cache");
  const fresh = jsonResponse({ ...payload([article(9)]), generatedAt: new Date(Date.now() + 60000).toISOString() });
  assert.equal((await loadNews({ fetchImpl: staticHost(fresh), storage, sleep: noSleep })).origin, "snapshot");
});

test("sunucu/proxy {error} gövdesi gönderirse hata mesajı olarak gösterilir", async () => {
  const fetchImpl = async () => ({ ok: false, status: 503, json: async () => ({ error: "npm run server çalışmıyor" }) });
  await assert.rejects(loadNews({ fetchImpl, storage: memoryStorage(), sleep: noSleep }), /npm run server çalışmıyor/);
});
