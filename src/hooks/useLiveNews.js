import { useCallback, useEffect, useState } from "react";
import { hasArticles, loadNews } from "../services/newsApi.js";

const AUTO_RETRY_MS = 20000;
const AUTO_RETRY_MAX = 6;

// status: "loading" | "ready" (ağdan) | "snapshot" (news.json) | "cached" (ağ yok, eski veri) | "error" (hiçbir şey yok)
export default function useLiveNews() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // İsteği İPTAL etmiyoruz, yalnızca sonucunu yok sayıyoruz: geliştirmede React her etkiyi iki kez
    // çalıştırır; iptal edilen istek tarayıcı konsoluna "AbortError" gürültüsü yazıyordu.
    let cancelled = false;
    setState((current) => ({ ...current, status: "loading" }));
    loadNews()
      .then((data) => cancelled || setState({ status: { cache: "cached", snapshot: "snapshot" }[data.origin] ?? "ready", data, error: data.error }))
      .catch((error) => {
        if (cancelled) return;
        console.warn("Haberler alınamadı:", error);
        setState({ status: "error", data: null, error: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Haber yoksa (sunucu yeni açıldı, kaynak geçici düştü) sayfa kendiliğinden tekrar dener.
  useEffect(() => {
    const noNews = state.status === "error" || (state.status === "ready" && !hasArticles(state.data));
    if (!noNews || attempt >= AUTO_RETRY_MAX) return undefined;
    const timer = setTimeout(() => setAttempt((n) => n + 1), AUTO_RETRY_MS);
    return () => clearTimeout(timer);
  }, [state, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
