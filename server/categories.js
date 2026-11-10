// Tüm kategori kararları TEK yerde. "Bu haber neden bu kartta?" sorusunun cevabı burası.
// - google: Google News RSS'e nasıl sorulacağı (konu akışı veya arama sorgusu)
// - gdelt:  Google News çalışmazsa yedek olarak GDELT'e sorulacak Lehçe anahtar kelimeler
// - why:    Arayüzde kullanıcıya gösterilen insan okunur açıklama

const LOCALE = "hl=pl&gl=PL&ceid=PL:pl"; // Polonya, Lehçe

export const categories = [
  {
    id: "technology",
    label: "Teknoloji",
    google: { type: "topic", topic: "TECHNOLOGY" },
    gdelt: "(technologia OR internet OR sztuczna inteligencja OR smartfon)",
    why: "Google Haberler'in Polonya 'Teknoloji' konu akışı.",
  },
  {
    id: "economy",
    label: "Ekonomi",
    google: { type: "topic", topic: "BUSINESS" },
    gdelt: "(gospodarka OR inflacja OR złoty OR giełda OR PKB)",
    why: "Google Haberler'in Polonya 'İş dünyası / Ekonomi' konu akışı.",
  },
  {
    id: "politics",
    label: "Politika",
    google: { type: "search", query: "polityka Sejm rząd prezydent" },
    gdelt: "(Sejm OR rząd OR prezydent OR premier OR wybory)",
    why: "Google Haberler'de 'polityka Sejm rząd prezydent' araması (son 2 gün).",
  },
  {
    id: "weather",
    label: "Hava durumu",
    google: { type: "search", query: "pogoda prognoza IMGW" },
    gdelt: "(pogoda OR prognoza OR IMGW OR burza OR mróz)",
    why: "Google Haberler'de 'pogoda prognoza IMGW' araması (son 2 gün).",
  },
  {
    id: "culture",
    label: "Kültür & yaşam",
    google: { type: "topic", topic: "ENTERTAINMENT" },
    gdelt: "(kultura OR film OR muzyka OR teatr OR festiwal)",
    why: "Google Haberler'in Polonya 'Eğlence / Kültür' konu akışı.",
  },
];

export const categoryIds = categories.map((category) => category.id);
export const getCategory = (id) => categories.find((category) => category.id === id);

export function googleFeedUrl(category) {
  const { google } = category;
  if (google.type === "topic")
    return `https://news.google.com/rss/headlines/section/topic/${google.topic}?${LOCALE}`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(`${google.query} when:2d`)}&${LOCALE}`;
}

export function gdeltUrl(category) {
  const query = `${category.gdelt} sourcecountry:PL sourcelang:polish`;
  return (
    "https://api.gdeltproject.org/api/v2/doc/doc?" +
    new URLSearchParams({ query, mode: "artlist", format: "json", maxrecords: "20", sort: "datedesc", timespan: "2d" })
  );
}
