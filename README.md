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

## Bu prototipte neler var?

- Mevcut oda sahnesi, yerde oturan BMO ve solunda üç, sağında iki kart korunur.
- Kartlar 4,8–6,2 saniyelik farklı döngülerle yaklaşık 16 piksel süzülür. Hover veya klavye odağında 14 piksel ek yükseliş ve gölge vardır.
- Her kategorinin farklı hover melodisi vardır. Kart seçme, hazneye oturma ve çıkarma ayrıca seslendirildi.
- Karta tıklayınca kart hazneye yaklaşır, açısını ayarlar ve haznenin kenarı arkasında kaybolarak içeri girer.
- BMO’nun ekranında kısa bir yükleme tepkisi görünür; ardından ilgili haber okuyucusu açılır.
- Okuyucuda kategori, kapak görseli, başlık, özet, metin ve okuma süresi vardır. Önceki/sonraki kontrolleri ilk ve son haber arasında döngü yapar.
- Haber değiştirince eski kart önce dışarı çıkar ve yerine döner; yeni kart daha sonra takılır. Hızlı tekrar tıklamaları hareketi kesmez.
- Kapat düğmesi, “BMO’ya dön” veya Escape kartı çıkarır. İşlem bittiğinde klavye odağı karta döner.
- Ses ilk ziyarette kapalıdır. Tercih tarayıcıda saklanır; hem ana sahnede hem haber panelinde değiştirilebilir.
- BMO’nun gözleri imleci yavaşça takip eder. Telefon düzeni korunur; ekran boyutu değişince hazne konumu yeniden ölçülür.
- Azaltılmış hareket tercihinde kart uçuşu, süzülme ve göz takibi kapatılır; haber akışı kısa geçişlerle çalışmaya devam eder.
- Fontlar ve görseller yereldir. Çalışırken harici ses veya görsel servisine ihtiyaç yoktur.

Haberler **kurmaca demo içeriklerdir**. Gerçek gündem, yatırım önerisi veya canlı hava durumu verisi sunulmaz. Bu sürüm frontend prototipidir; backend, veritabanı ve gerçek haber bağlantısı yoktur. Haber paneli sayfa üzerinde açılır; henüz her haberin ayrı URL’si yoktur. Ekran yakınlaştırma eklenmedi.

## Kod nasıl çalışıyor?

### 1. Veri ile görünümü ayırıyoruz

`src/data/news.js`, beş kategorinin rengini, kapağını, başlığını, özetini ve haber metnini tutar. Kart ve okuyucu aynı veriyi kullanır. İçerik değiştirirken animasyon koduna dokunmak gerekmez.

`NewsCartridge.jsx` sahnedeki kart düğmesidir. İçindeki `CartridgeFace` hem bu düğmede hem uçan kartta kullanılır. Uçuş sırasında asıl kartın kapladığı yer korunur ve yalnızca görünürlüğü kapatılır; diğer kartlar yer değiştirmez.

### 2. Geçiş sırasını tek yerde tanımlıyoruz

`src/hooks/useCartridgePlayer.js` bir reducer ile şu sırayı yönetir:

```text
idle → approaching → inserting → loading → reading
                  kart takılıyor              haber açık

reading → ejecting → returning → idle
             kart çıkıyor       koleksiyona dönüş

Haber değişimi: returning → approaching (yeni kart)
```

`activeIndex` haznedeki/hareket eden kartı, `selectedIndex` konuşma kutusundaki kartı, `nextIndex` ise haber değişiminde sıradaki kartı tutar. Hareket sırasında gelen seçimler yok sayılır. Tamamlanma olayının aşaması güncel aşamayla uyuşmuyorsa olay da yok sayılır; eski bir animasyon akışı yanlışlıkla ilerletemez.

### 3. Kartı gerçek hazne konumuna taşıyoruz

React ve Vite korunur; kart uçuşu için **Motion** kullanılır. `CartridgeFlight.jsx`, kartın boyutunu ve BMO üzerindeki haznenin SVG koordinatını ölçer. `getScreenCTM()` bu koordinatı ekran pikseline çevirir; böylece mobilde küçülen BMO’nun haznesi de doğru hedef olur. `ResizeObserver` ekran boyutu değişince ölçümü yeniler.

Kart yaklaşık **620 ms** içinde yaklaşır, **300 ms** içinde hazneye kayar. `clip-path`, haznenin altına geçen kısmı gizler; yalnızca saydamlık azaltarak kaybolmaz. `BmoPort.jsx` hazne kenarını ve kısa yükleme tepkisini çizer. **320 ms** yükleme tepkisinden sonra okuyucu açılır. Çıkarma **300 ms**, koleksiyona dönüş **580 ms** sürer. Aşamalar `onAnimationComplete` ile ilerler; üst üste çalışan bekleme zamanlayıcıları yoktur.

### 4. Sesleri notalardan üretiyoruz

`src/data/sounds.js` ses tasarımını, `src/hooks/useBmoAudio.js` ise Web Audio bağlantılarını yönetir.

| Kategori       | Ses karakteri                  |
| -------------- | ------------------------------ |
| Teknoloji      | İki notalı dijital kare dalga  |
| Ekonomi        | Üç kısa notalı tok üçgen dalga |
| Politika       | Daha alçak perdeli çift sinyal |
| Hava durumu    | Yükselen üç yumuşak nota       |
| Kültür & yaşam | Daha uzun aralıklı küçük arpej |

Her notada kısa bir yükseliş ve sönüş uygulanır; ani ses kesilmeleri azaltılır. Takma sesinde kısa mekanik tonun ardından kategori melodisi gelir; çıkarırken melodi ters yönde ve daha alçak perdede çalar. Önceki sesler temizlenir; hızlı geçişlerde birikmez. Hover tekrarlarında 120 ms sınırı vardır. Sesi kapatmak ana kazancı anında sıfırlar ve henüz çalmamış notaları da durdurur.

Tarayıcılar ses için kullanıcı etkileşimi ister. Kaydedilmiş “ses açık” tercihiyle sayfa yeniden yüklendiğinde ilk tıklama veya tuş sesi etkinleştirir. Ses veya yerel depolama API’si yoksa haber akışı yine çalışır.

### 5. Haber okuyucusunu ayrı bir bileşen yapıyoruz

`NewsReader.jsx`, yerel HTML `dialog` öğesini kullanır. Açıldığında arka plan etkileşimini ve kaydırmayı sınırlar; klavye odağını panel içinde tutar. Kapatma animasyonundan sonra odak karta döner. `SoundButton.jsx`, ana sahne ile okuyucuda aynı ses durumunu gösterir.

`src/styles.css` ilk sahnenin yerleşimini, `src/interactions.css` uçuş katmanını ve haber okuyucusunu biçimlendirir. `BmoEyes.jsx` önceki yavaş göz takibini sürdürür. `src/main.jsx`, React’i ve yerel fontları yükler.

## Testler

Geçiş sırasını ve ses profillerini test et:

```bash
npm test
```

Tarayıcı testleri için bir kez Chromium indir:

```bash
npx playwright install chromium
npm run test:ui
```

Sistemde hazır Chromium kullanmak istersen `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` değişkenini çalıştırılabilir dosyanın yoluna ayarla. Test yapılandırması bu yolu destekler. Üretim derlemesi için `npm run build` çalıştır.

Birim testleri aşama sırasını, eski animasyon olaylarını, hızlı seçimleri, kart değiştirme/kapatma akışını ve beş ayrı ses profilini kontrol eder. Tarayıcı testleri gerçek kart takma/çıkarma, okuyucu, döngülü gezinme, odak dönüşü, native Web Audio, sessize alma, azaltılmış hareket, 320/390/768 piksel ekranlar, hareket sırasında boyut değişimi ve ses/depolama API’lerinin yokluğunu kapsar.

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

1. Sesi aç ve beş kartın üzerine sırayla gel; her kategorinin melodisi farklı olmalı.
2. Bir kart seç; hazneye gitmesini, kenarın arkasına kaymasını ve doğru haberin açılmasını izle.
3. Okuyucunun altındaki önceki/sonraki kart kontrollerini dene. Eski kart yerine dönmeden yeni kart takılmamalı.
4. Okuyucunun üstündeki ses düğmesini kapat; geçişler sessiz devam etmeli.
5. Escape veya kapatma düğmesiyle koleksiyona dön; kart kendi yerinde ve klavye odağı üzerinde olmalı.
6. Kartlara Tab ile ulaş; Enter ve sağ/sol oklarını dene. Hareket sırasında art arda tıklayarak akışın bozulmadığını kontrol et.
7. Mobil ekranı ve azaltılmış hareket ayarını dene. Hareket azaltıldığında haberleri açma/kapatma çalışmaya devam etmeli.
