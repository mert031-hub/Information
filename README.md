# BMO NEWS

Adventure Time temalı haber sitesi — ilk görünüm prototipi.

## Yerelde çalıştırma

Node.js 24 önerilir; bu sürüm 24.19.0 ile doğrulandı. nvm kullanıyorsan `nvm use` komutu `.nvmrc` dosyasındaki sürümü seçer.

```bash
git clone https://github.com/mert031-hub/Information.git
cd Information
npm ci
npm run dev
```

Depo zaten bilgisayarındaysa kendi değişikliklerini koruyarak `git pull --ff-only` çalıştır, ardından `npm ci` ve `npm run dev` komutlarını kullan. Geliştirme sunucusunun adresi terminalde görünür.

Üretim derlemesi: `npm run build`. Oluşan derlemeyi kontrol etmek için: `npm run preview`.

## Bu aşamada neler var?

- Gönderilen oda görseli üzerinde BMO, beş haber kartı ve haber önizlemesi.
- Kartlara tıklayarak kategori, başlık ve özeti değiştirme.
- Önceki/sonraki düğmeleri; kartlara odaklanıldığında sağ/sol klavye okları.
- Telefonda yatay kaydırılabilen kartlar ve seçilen kartın ortalanması.
- Yerel fontlar; görseller ve fontlar için harici bir servise bağlantı gerekmez.

Haberler **kurmaca demo içeriklerdir**. Gerçek gündem veya canlı hava durumu verisi sunulmaz.

Kart takma/çıkarma animasyonu, ses efektleri, tam haber sayfası, backend ve veritabanı **henüz eklenmedi**. Ses düğmesi bu nedenle bilinçli olarak devre dışıdır. İlk tasarım onayından sonra bu özelliklere ayrı aşamalarda geçilecek.

## Kod nasıl çalışıyor?

1. `src/data/news.js`, her kartın başlığını, rengini, kategorisini, görselini ve örnek özetini tutar.
2. `src/App.jsx`, `selectedIndex` durumuyla seçilen kartı takip eder. Kart seçilince bu sayı değişir; alttaki haber önizlemesi aynı veriden yeniden çizilir.
3. `src/components/NewsCartridge.jsx`, tek bir kartın görünümüdür. `App` bu bileşeni beş haber için kullanır.
4. `src/styles.css`, sahneyi, kartların açılarını, renkleri ve mobil düzeni belirler. Bu aşamada bir animasyon kütüphanesine gerek yoktur.
5. `src/main.jsx`, React uygulamasını başlatır ve fontları yükler.

## Görseller

`Photos/` kullanıcının gönderdiği özgün dosyaları içerir; dosyalar değiştirilmedi.

| Kullanım                          | Dosya                    |
| --------------------------------- | ------------------------ |
| Ana sahne                         | `Photos/ev4.jpg`         |
| Teknoloji                         | `Photos/haberkapak4.jpg` |
| Ekonomi                           | `Photos/haberkapak3.jpg` |
| Politika                          | `Photos/haberkapak5.jpg` |
| Hava durumu                       | `Photos/haberkapak2.jpg` |
| Kültür ve yaşam                   | `Photos/haberkapak1.jpg` |
| Özgün BMO                         | `Photos/images.png`      |
| Arka planı kaldırılmış BMO türevi | `src/assets/bmo.png`     |

BMO türevi, gönderilen çizimden görsel düzenleme aracıyla hazırlanmıştır. Haber kapaklarının kırpılması CSS `object-fit` ile yapılır; özgün görseller değişmez. Tasarım referansı: https://www.adarkeser.com/ adresinin Adventure bölümü ve kullanıcının sağladığı ekran görüntüleri. Referans sitenin kaynak kodu kullanılmadı.

## Elle kontrol

Beş kartı sırayla seç; her birinde kategori ve özetin değiştiğini kontrol et. Önceki/sonraki düğmeleri başa ve sona geldiğinde döngü yapmalı. Bir karta Tab ile odaklanıp sağ/sol oklarını dene. Telefon boyutunda yatay şeridi kaydır; seçilen kart ve haber özeti birbiriyle eşleşmeli. Bu adımlar animasyon veya ses testleri değildir; bu özellikler henüz uygulanmadı.
