# BMO NEWS

Adventure Time temalı haber sitesi — oturan BMO ve çevresinde süzülen kartlar.

## Yerelde çalıştırma

Node.js 24 önerilir; bu sürüm 24.19.0 ile doğrulandı. nvm kullanıyorsan `nvm use` komutu `.nvmrc` dosyasındaki sürümü seçer.

```bash
git clone https://github.com/mert031-hub/Information.git
cd Information
npm ci
npm run dev
```

Depo zaten bilgisayarındaysa kendi değişikliklerini koruyarak `git pull --ff-only origin main` çalıştır, ardından `npm ci` ve `npm run dev` komutlarını kullan. Geliştirme sunucusunun adresi terminalde görünür.

Windows PowerShell `npm` için uygulama seçme penceresi açarsa `npm.cmd ci` ve `npm.cmd run dev` kullan. Node.js 24 kurulumu npm'i de sağlar.

Üretim derlemesi: `npm run build`. Oluşan derlemeyi kontrol etmek için: `npm run preview`.

## Bu aşamada neler var?

- Gönderilen oda görseli üzerinde yerde oturan büyük BMO.
- BMO'nun solunda üç, sağında iki haber kartı; farklı yüksekliklerde ve hafif açılı yerleşim.
- Kartlarda 4,8–6,2 saniyelik farklı döngülerle yaklaşık 16 piksel süzülme; kartlar BMO çevresinde dönmez.
- Fare veya klavye odağı üzerindeyken devam eden süzülmeye eklenen 14 piksel yumuşak yükseliş ve belirgin gölge.
- BMO’nun gözlerinin imleci gecikmeli ve sınırlı bir hareketle takip etmesi; imleç sayfadan ayrılınca merkeze dönmesi.
- Kart hover ve klavye odağında kısa, düşük sesli elektronik efekt; üst çubukta ses aç/kapat kontrolü. Ses ilk ziyarette kapalıdır ve tercih tarayıcıda saklanır.
- Ses Web Audio ile yerelde üretilir. Tarayıcı kısıtları nedeniyle kayıtlı açık tercih yeniden yükleme sonrası ilk tıklama veya tuşla etkinleşir.
- Kartlara tıklayarak konuşma kutusundaki kategori ve başlığı değiştirme.
- Önceki/sonraki düğmeleri; kartlara odaklanıldığında sağ/sol klavye okları.
- Telefonda da BMO'nun çevresindeki yerleşimin korunması.
- İşletim sisteminde azaltılmış hareket tercihi açıksa süzülmenin, hover yükselişinin ve göz takibinin kapatılması.
- Yerel fontlar; görseller ve fontlar için harici bir servise bağlantı gerekmez.

Haberler **kurmaca demo içeriklerdir**. Gerçek gündem veya canlı hava durumu verisi sunulmaz.

Kart takma/çıkarma animasyonu, ekran yakınlaştırma, tam haber sayfası, backend ve veritabanı **henüz eklenmedi**. Bu aşama mevcut yerleşim üzerinde hareket ve ses etkileşimlerini ekler.

## Kod nasıl çalışıyor?

1. `src/data/news.js`, her kartın başlığını, rengini, kategorisini, görselini ve örnek özetini tutar.
2. `src/App.jsx`, `selectedIndex` durumuyla seçilen kartı takip eder. Kart seçilince bu sayı değişir; konuşma kutusundaki seçili haber adı aynı veriden yeniden çizilir.
3. `src/components/NewsCartridge.jsx`, tek bir kartın görünümüdür. `App` bu bileşeni beş haber için kullanır. Kart sırasına göre süzülme süresi ve başlangıç gecikmesi değişir.
4. `src/styles.css`, sahneyi ve mobil düzeni belirler. `data-slot` seçicilerindeki `--x`, `--y` ve `--tilt` kartın sabit konumunu/açısını tutar. `cartridge-float` animasyonu bu konuma küçük bir dikey hareket ve açı değişimi ekler; bir animasyon kütüphanesine gerek yoktur.
5. `src/components/BmoEyes.jsx`, özgün görseli değiştirmeden gözleri SVG katmanında hizalar; `requestAnimationFrame` ile yavaş takip ve azaltılmış hareket tercihini yönetir.
6. `src/hooks/useHoverSound.js`, ses tercihini, kullanıcı etkileşimiyle açılan AudioContext’i, kısa ses zarfını ve hızlı hover tekrarları için 120 ms sınırını yönetir. Ses kapatılınca ana kazanç anında sıfırlanır.
7. `src/main.jsx`, React uygulamasını başlatır ve fontları yükler.

## Görseller

`Photos/` kullanıcının gönderdiği özgün dosyaları içerir; dosyalar değiştirilmedi.

| Kullanım                          | Dosya                       |
| --------------------------------- | --------------------------- |
| Ana sahne                         | `Photos/ev4.jpg`            |
| Teknoloji                         | `Photos/haberkapak4.jpg`    |
| Ekonomi                           | `Photos/haberkapak3.jpg`    |
| Politika                          | `Photos/haberkapak5.jpg`    |
| Hava durumu                       | `Photos/haberkapak2.jpg`    |
| Kültür ve yaşam                   | `Photos/haberkapak1.jpg`    |
| Özgün BMO                         | `Photos/images.png`         |
| Arka planı kaldırılmış BMO türevi | `src/assets/bmo.png`        |
| Kullanılan oturmuş BMO türevi     | `src/assets/bmo-seated.png` |

BMO türevleri, kullanıcının gönderdiği görsellerden görsel düzenleme aracıyla hazırlanmıştır. Oturan sürüm, sohbette sonradan gönderilen oturmuş BMO görselinden arka plan kaldırılarak hazırlanmıştır. Önceki ayakta duran sürüm dosyası korunur, ancak artık sahnede kullanılmaz. Haber kapaklarının kırpılması CSS `object-fit` ile yapılır; özgün görseller değişmez. Tasarım referansı: https://www.adarkeser.com/ adresinin Adventure bölümü ve kullanıcının sağladığı ekran görüntüleri. Referans sitenin kaynak kodu kullanılmadı.

## Elle kontrol

Beş kartı sırayla seç; konuşma kutusunda kategori ve başlığın değiştiğini kontrol et. Önceki/sonraki düğmeleri başa ve sona geldiğinde döngü yapmalı. Bir karta Tab ile odaklanıp sağ/sol oklarını dene. Fare kartın dışındayken süzülmeyi, üzerine gelince süzülmeye eklenen yumuşak yükselişi kontrol et. İmleci iki yana hareket ettir; gözler yavaşça takip etmeli, sayfadan ayrılınca merkeze dönmeli.

Ses düğmesini açıp kartlara yaklaş; kısa bip duyulmalı. Sesi kapatıp aynı işlemi tekrarla; ses duyulmamalı. Sayfayı yenileyince tercih korunmalı; ses açıkken tarayıcı ilk tıklamayı veya tuşu bekleyebilir. Azaltılmış hareket tercihi açıkken kartlar ve gözler sabit kalmalı. Telefon boyutunda tüm kartlar görünmeli ve seçilebilmeli.

Bu değişiklikte üretim derlemesi ve Chromium tarayıcı kontrolleri çalıştırıldı: hover yükselişi, gerçek Web Audio osilatörünün çalışması ve sessize alınması, ses tercihinin korunması, göz takibi, beş kartın seçimi, klavye oklarıyla döngü, azaltılmış hareket, 320/390/768 piksel yerleşim ve ses/depolama API’leri kullanılamadığında kart seçiminin çalışması.
