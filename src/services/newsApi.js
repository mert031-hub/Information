// Tarayıcının haber sunucumuzla konuşan tek yeri.
//
// Akış: ağdan al -> başarısızsa 3 kez dene (1 sn, 2 sn bekleyerek) -> hâlâ olmuyorsa
// statik news.json ya da tarayıcıda saklanan son başarılı cevabı göster -> o da yoksa hata fırlat (App örnek içeriğe düşer).
// Sunucu ilk kez toplama yapıyorsa (refreshing=true ve haber yok) birkaç saniye bekleyip tekrar sorar.

const BASE = (import.meta.env?.VITE_NEWS_API_BASE ?? "/api").replace(/\/$/, "");
// API yoksa okunan statik dosya (scripts/fetch-news.js üretir).
export const SNAPSHOT_URL = `${import.meta.env?.BASE_URL ?? "/"}news.json`;
export const CACHE_KEY = "bmo-news:last-good:v1";

// Engelli çerez/depolama ayarında "localStorage"a erişmek bile hata fırlatabilir; bu yüzden güvenli okuruz.
function defaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const hasArticles = (data) =>
  Object.values(data?.categories ?? {}).some((category) => category.articles?.length);

// Sunucu cevabını doğrular; eksik/bozuk alanlar için güvenli varsayılanlar koyar.
export function parseNewsResponse(data) {
  if (!data || typeof data.categories !== "object") throw new Error("Haber API'si beklenmeyen bir cevap verdi");
  const categories = {};
  for (const [id, entry] of Object.entries(data.categories)) {
    categories[id] = {
      articles: (Array.isArray(entry?.articles) ? entry.articles : []).filter((a) => a?.title && a?.url),
      explain: entry?.explain ?? {},
    };
  }
  return { categories, generatedAt: data.generatedAt ?? null, store: data.store ?? null, refreshing: Boolean(data.refreshing) };
}

function statusMessage(status) {
  if (status === 404) return "Haber sunucusu bu adreste bulunamadı (404). Sunucu çalışmıyor ya da /api yönlendirmesi yok.";
  if (status >= 500) return `Haber sunucusuna ulaşılamıyor (${status}). Sunucu kapalı ya da hata veriyor olabilir (geliştirmede: npm run dev:all).`;
  return `Haber API'si ${status} döndürdü`;
}

async function getJson(url, { signal, fetchImpl, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      // Sunucu (ya da dev proxy) açıklayıcı bir {error} gövdesi gönderdiyse onu göster.
      const detail = await response.json?.().then((body) => body?.error, () => undefined);
      throw new Error(detail || statusMessage(response.status));
    }
    const type = response.headers?.get?.("content-type") ?? "";
    // Statik sunucular bilinmeyen adreslerde index.html döndürür; bu, "sunucu yok" demektir.
    if (type && !type.includes("json"))
      throw new Error("Bu adreste haber sunucusu çalışmıyor: /api yerine bir web sayfası döndü. `npm run server` çalışıyor mu?");
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw error; // kullanıcı iptal etti
    if (error.name === "AbortError") throw new Error(`Haber API'si ${timeoutMs / 1000} sn içinde cevap vermedi`);
    if (error instanceof TypeError) throw new Error("Haber sunucusuna bağlanılamadı (sunucu kapalı, ağ ya da CORS hatası)");
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

function readCache(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(CACHE_KEY) ?? "null");
    return saved?.data ? saved : null;
  } catch {
    return null;
  }
}

export async function loadNews({
  signal,
  fetchImpl = globalThis.fetch,
  storage = defaultStorage(),
  sleep = defaultSleep,
  attempts = 3,
  polls = 4,
  timeoutMs = 10000,
} = {}) {
  let lastError;
  let pollsLeft = polls;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const data = parseNewsResponse(await getJson(`${BASE}/news/all`, { signal, fetchImpl, timeoutMs }));
      if (!hasArticles(data) && data.refreshing && pollsLeft-- > 0) {
        await sleep(4000);
        attempt--; // bekleme hata sayılmaz
        continue;
      }
      if (hasArticles(data)) {
        try {
          storage?.setItem(CACHE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data }));
        } catch {
          /* depolama dolu/kapalı: sorun değil */
        }
      }
      return { ...data, origin: "network", error: null };
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
      if (attempt < attempts - 1) await sleep(1000 * 2 ** attempt);
    }
  }
  // API'ye ulaşılamadı. Sırayla: statik news.json ve tarayıcı önbelleği; hangisi daha yeniyse o.
  let snapshot = null;
  try {
    const data = parseNewsResponse(await getJson(SNAPSHOT_URL, { signal, fetchImpl, timeoutMs }));
    if (hasArticles(data)) snapshot = data;
  } catch (error) {
    if (signal?.aborted) throw error; // news.json yok ya da bozuk: sorun değil
  }
  const cached = readCache(storage);
  const snapshotTime = Date.parse(snapshot?.generatedAt ?? "") || 0;
  if (snapshot && !(cached && Date.parse(cached.savedAt) > snapshotTime))
    return { ...snapshot, origin: "snapshot", error: lastError.message };
  if (cached) return { ...cached.data, origin: "cache", cachedAt: cached.savedAt, error: lastError.message };
  throw lastError;
}

export async function fetchSources({ signal, fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  return getJson(`${BASE}/sources`, { signal, fetchImpl, timeoutMs });
}
