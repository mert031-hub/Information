# Mimari ve savunma notları

## Neden böyle?

| Karar | Gerekçe |
| --- | --- |
| **Express + MongoDB** | Arayüzle aynı dil (JavaScript); haberler esnek belge yapısına uyuyor, şema göçü gerekmiyor. |
| **Tarayıcı doğrudan haber sitesine gitmiyor** | CORS ve rate limit sorunu biter; kaynaklar tek yerden, sırayla çekilir. Önceki sürümde bu iş harici bir Worker'daydı ve zaman aşımına uğruyordu. |
| **Google Haberler RSS birincil, GDELT yedek** | RSS kararlı ve hızlı, özet verir. GDELT yavaş ve rate limitli ama bağımsız bir kaynak; ikisi birden düşme ihtimali düşük. |
| **Dosya deposu yedeği** | `MONGODB_URI` yoksa/ulaşılamıyorsa uygulama açılır; geliştirme ve jüri sunumu MongoDB kurulumuna bağlı kalmaz. |
| **Her deneme `runs` koleksiyonuna yazılır** | "Neden haber gelmedi?" sorusu tahminle değil kayıtla cevaplanır. Günlük arayüzde görünür. |
| **Tarayıcı önbelleği + örnek içerik** | Sunucu çökse bile ekran boş kalmaz; hangi durumda olunduğu her zaman etiketlidir (CANLI / ÖNBELLEK / ÖRNEK). |

## Veri modeli

`articles` (kimlik = `kategori-` + URL'nin SHA-1 özeti, aynı haber iki kez yazılmaz):

```json
{
  "_id": "technology-3f2a…", "category": "technology",
  "title": "…", "url": "https://…", "source": "Przykład.pl", "summary": "",
  "publishedAt": "2026-11-05T10:00:00.000Z", "fetchedAt": "2026-11-06T05:00:00.000Z",
  "provider": "google-news-rss", "query": "konu:TECHNOLOGY", "feedUrl": "https://news.google.com/rss/…"
}
```

`runs` (14 gün sonra otomatik silinir): `{ category, provider, at, status, count, durationMs, error?, feedUrl?, query? }`

## Dosya haritası

| Dosya | Görevi |
| --- | --- |
| `server/categories.js` | Kategori → sorgu eşlemesi ve kullanıcıya gösterilen açıklama |
| `server/sources/googleNewsRss.js`, `gdelt.js` | Ham yanıtı ortak makale biçimine çevirir (saf fonksiyonlar, ağ yok) |
| `server/ingest.js` | Kaynak sırası, yedeğe geçiş, günlük yazma |
| `server/store/` | `mongoStore.js`, `fileStore.js`, aynı arayüz |
| `server/app.js` | Express uç noktaları, bayat veride arka planda yenileme |
| `src/services/newsApi.js` | Yeniden deneme, zaman aşımı, tarayıcı önbelleği |
| `src/components/HowItWorks.jsx` | "Nasıl çalışır?" penceresi, `/api/sources` verisini gösterir |
| `src/components/NewsReader.jsx` | Haberler + "Neden burada?" kutusu + durum bildirimi |

## Sunumda beklenebilecek sorular

- **Veritabanı nerede kullanılıyor?** `server/store/mongoStore.js`: toplayıcı `bulkWrite` ile yazar, API `find().sort()` ile okur.
- **Haber gelmezse ne olur?** Sırayla: GDELT → DB'deki eski kayıtlar → tarayıcı önbelleği → etiketli örnek içerik. Hata `runs` günlüğünde görünür.
- **Rate limit'e nasıl saygı gösteriyorsunuz?** Kategoriler paralel değil sırayla, aralarında 1,5 sn beklenerek çekilir; 15 dakikada bir.
- **Aynı haber iki kez gelir mi?** Hayır; kimlik URL özetidir, yazım `upsert`'tür.
- **Güvenlik?** Elle yenileme `ADMIN_TOKEN` ister ve varsayılan olarak kapalıdır; sırlar `.env`'de, gite girmez.
