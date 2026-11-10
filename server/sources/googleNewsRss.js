import crypto from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { googleFeedUrl } from "../categories.js";

export const id = "google-news-rss";
// processEntities:false -> ayrıştırıcı HTML karakter kodlarını (&quot; &lt; ...) ÇÖZMEZ.
// Google'ın özetlerinde yüzlerce kod olur ve ayrıştırıcının güvenlik sınırı (1000) aşılır
// ("Entity expansion limit exceeded"). Kodları aşağıda kendimiz, sınırsız ve güvenli biçimde çözeriz.
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text", processEntities: false });

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export function decodeEntities(text) {
  return String(text ?? "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED[body.toLowerCase()] ?? whole;
  });
}

// Önce kodları çöz (özet "&lt;a&gt;" biçiminde kaçışlı HTML'dir), sonra etiketleri at, boşlukları sadeleştir.
const decode = (text) => decodeEntities(text).replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();

export const articleId = (url) => crypto.createHash("sha1").update(url).digest("hex").slice(0, 20);

// Saf fonksiyon: XML metni -> makale listesi. Ağ yok, bu yüzden kolay test edilir.
export function parseRss(xml, { feedUrl, query } = {}) {
  const channel = parser.parse(xml)?.rss?.channel;
  if (!channel) throw new Error("RSS biçimi tanınmadı (rss/channel yok)");
  const items = [].concat(channel.item ?? []);
  return items
    .map((item) => {
      const link = decodeEntities(String(item.link ?? "").trim());
      const sourceName = decode(item.source?.["#text"] ?? item.source);
      let title = decode(item.title);
      // Google başlıkları "Başlık - Kaynak" biçiminde gelir; kaynağı ayır.
      if (sourceName && title.endsWith(` - ${sourceName}`)) title = title.slice(0, -(sourceName.length + 3)).trim();
      let summary = decode(item.description);
      if (summary.startsWith(title) && summary.length <= title.length + sourceName.length + 6) summary = "";
      const published = new Date(item.pubDate);
      if (!title || !link) return null;
      return {
        _id: articleId(link),
        title,
        url: link,
        source: sourceName || "Bilinmeyen kaynak",
        sourceUrl: decodeEntities(item.source?.["@_url"] || ""),
        summary,
        image: "",
        publishedAt: Number.isNaN(published.getTime()) ? null : published.toISOString(),
        provider: id,
        feedUrl,
        query: query ?? "",
      };
    })
    .filter(Boolean);
}

export async function fetchCategory(category, fetchText) {
  const feedUrl = googleFeedUrl(category);
  const xml = await fetchText(feedUrl, { accept: "application/rss+xml, application/xml, text/xml" });
  const query = category.google.type === "topic" ? `konu:${category.google.topic}` : category.google.query;
  return { feedUrl, query, articles: parseRss(xml, { feedUrl, query }) };
}
