// Saf yardımcılar: arayüzde görünen küçük metinleri üretir (Node testlerinde de çalışır).

export const providerLabels = {
  "google-news-rss": "Google Haberler (RSS)",
  gdelt: "GDELT (yedek kaynak)",
  "demo-seed": "Örnek veri",
};

export const providerLabel = (id) => providerLabels[id] ?? id ?? "bilinmiyor";

// "3 sa önce" gibi göreli zaman. Geçersiz tarihte boş metin döner.
export function formatAgo(iso, now = Date.now()) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  const seconds = Math.round((now - time) / 1000);
  if (seconds < 45) return "az önce";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days} gün önce` : new Date(time).toLocaleDateString("tr-TR");
}

export function formatClock(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export const modeLabels = {
  live: "CANLI",
  cached: "ÖNBELLEK",
  snapshot: "ANLIK GÖRÜNTÜ",
  loading: "YÜKLENİYOR",
  demo: "ÖRNEK",
};
