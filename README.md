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

`motion/react` bulunamadı hatası, genellikle kod güncellenirken bağımlılıkların yerelde kurulmadığını gösterir. `git pull` paket kurmaz. PowerShell’de Vite’ı **Ctrl+C** ile durdurup depo klasöründe şu sırayı kullan:

```powershell
git pull --ff-only origin main
npm.cmd ci
npm.cmd run dev
```

`motion`, hem `package.json` hem `package-lock.json` içinde kayıtlıdır; import satırını değiştirmek gerekmez.

Üretim derlemesi: `npm run build`. Oluşan derlemeyi kontrol etmek için: `npm run preview`.

## Bu prototipte neler var?

Ana ekran sade tutulur: logo, ses kontrolü, BMO, kategori kartları ve gezinme okları. Durum mesajları yalnızca kart geçişinde görünür; sloganlar ve dekoratif açıklamalar kaldırıldı.

- Mevcut oda sahnesi, yerde oturan BMO ve solunda üç, sağında iki kart korunur.
- Kartlar 4,8–6,2 saniyelik farklı döngülerle yaklaşık 16 piksel süzülür. Hover veya klavye odağında 14 piksel ek yükseliş ve gölge vardır.
- Her kategorinin farklı hover melodisi vardır. Kart seçme, hazneye oturma ve çıkarma ayrıca seslendirildi.
- Karta tıklayınca kart hazneye yaklaşır, açısını ayarlar ve haznenin kenarı arkasında kaybolarak içeri girer.
- Tıklama anında BMO’nun gözleri mutlu biçimde kısılır ve yüzünde gülümseme belirir. Kaset takılırken kategoriye göre “LET'S PLAY!”, “UWHUUUU!”, “OH YEAH!”, “ADVENTURE TIME!” veya “YAAAY!” tepkileri görünür. Tepkiler ses açıkken cihazın yerel İngilizce seslerinden en uygun olanıyla seslendirilir; yüzün üzerine yazı basılmaz.
- Kaset takılınca kamera yaklaşık 1300 ms içinde BMO’nun ekranına girer. Oda, kasetler ve BMO aynı kamera katmanında birlikte büyür. LCD görüş alanını doldurduğunda haber sabit, tam ekran yüzeyde belirir; ayrı bir panel sahneden dışarı taşınmaz.
- Okuyucuda kategori, kapak görseli, başlık, özet, metin ve okuma süresi vardır. Önceki/sonraki kontrolleri ilk ve son haber arasında döngü yapar.
- Haber değiştirince önce ekrandan uzaklaşılır, eski kart dışarı çıkar ve yerine döner; yeni kart daha sonra takılır. Hızlı tekrar tıklamaları hareketi kesmez.
- Kapat düğmesi veya Escape önce kamerayı küçük BMO ekranına geri götürür, ardından kartı çıkarır. İşlem bittiğinde klavye odağı karta döner.
- Ses ilk ziyarette kapalıdır. Tercih tarayıcıda saklanır; hem ana sahnede hem haber panelinde değiştirilebilir.
- BMO’nun gözleri imleci yavaşça takip eder. Telefon düzeni korunur; ekran boyutu değişince hazne konumu yeniden ölçülür.
- Azaltılmış hareket tercihinde kart uçuşu, kamera yakınlaşması, süzülme ve göz takibi kapatılır; haber akışı kısa geçişlerle çalışmaya devam eder.
- Fontlar ve görseller yereldir. Çalışırken harici ses veya görsel servisine ihtiyaç yoktur.

Haberler **kurmaca demo içeriklerdir**. Gerçek gündem, yatırım önerisi veya canlı hava durumu verisi sunulmaz. Bu sürüm frontend prototipidir; backend, veritabanı ve gerçek haber bağlantısı yoktur. İçerik BMO ekranı içinde açılır; henüz her haberin ayrı URL’si yoktur.

## Kod nasıl çalışıyor?

### 1. Veri ile görünümü ayırıyoruz

`src/data/news.js`, beş kategorinin rengini, kapağını, başlığını, özetini ve haber metnini tutar. Kart ve okuyucu aynı veriyi kullanır. İçerik değiştirirken animasyon koduna dokunmak gerekmez.

`NewsCartridge.jsx` sahnedeki kart düğmesidir. İçindeki `CartridgeFace` hem bu düğmede hem uçan kartta kullanılır. Uçuş sırasında asıl kartın kapladığı yer korunur ve yalnızca görünürlüğü kapatılır; diğer kartlar yer değiştirmez.

### 2. Geçiş sırasını tek yerde tanımlıyoruz

`src/hooks/useCartridgePlayer.js` bir reducer ile şu sırayı yönetir:

```text
idle → approaching → inserting → zooming → reading
          önden yaklaşır   kart girer   ekran açılır

reading → zoomingOut → ejecting → returning → idle
          ekrandan çıkış  kart çıkıyor       koleksiyona dönüş

Haber değişimi: returning → approaching (yeni kart)
```

`activeIndex` haznedeki/hareket eden kartı, `selectedIndex` koleksiyondaki seçili kartı, `nextIndex` ise haber değişiminde sıradaki kartı tutar. Hareket sırasında gelen seçimler yok sayılır. Tamamlanma olayının aşaması güncel aşamayla uyuşmuyorsa olay da yok sayılır; eski bir animasyon akışı yanlışlıkla ilerletemez.

### 3. Kartı gerçek hazne konumuna taşıyoruz

React ve Vite korunur; kart uçuşu için **Motion** kullanılır. `CartridgeFlight.jsx`, kartın boyutunu ve BMO üzerindeki haznenin SVG koordinatını ölçer. `getScreenCTM()` bu koordinatı ekran pikseline çevirir; böylece mobilde küçülen BMO’nun haznesi de doğru hedef olur. `ResizeObserver` ekran boyutu değişince ölçümü yeniler.

Kart yaklaşık **840 ms** içinde yumuşak, hafif kavisli bir yoldan haznenin alt/ön tarafına yaklaşır. Kart yüzü perspektifte hafifçe yatar; üst kenarı önde olacak şekilde **480 ms** içinde içeri kayar. `clip-path` hazne çizgisinin üstünde kalan kısmı gizler. Aynı Motion öğesi yaklaşma ve yerleştirme boyunca korunur; aşama değişiminde kart yeniden çizilip pozisyon atlamaz.

Kart girer girmez **1300 ms** kamera hareketi başlar. Tek bir Motion ilerleme değeri (`cameraProgress`), kamera konumunu, büyütmeyi, BMO yüzünü, yeşil geçiş yüzeyini ve haber saydamlığını birlikte yönetir. Yüz, hareketin %30–64 aralığında silinir; %58–80 aralığında yeşil yüzey görüşü kaplar; yazılar ancak %80 sonrasında görünür. Böylece ekran kenarı haber metninin arkasında hayalet gibi kalmaz ve kamera tamamlanınca sahne gizlenirken boş kare oluşmaz. Ayrı bekleme zamanlayıcıları yoktur. Kapatmada aynı ilerleme **900 ms** içinde ters yönde oynar, kart ardından **420 ms** içinde çıkar ve **700 ms** içinde yerine döner.

`SceneCamera.jsx`, oda, kasetler ve BMO’yu kapsayan tek bir katmanı ekranın merkezi etrafında büyütür. Büyütme oranı üstel hesaplanır; eşit ilerleme adımları eşit büyütme oranları verir. Merkez düz bir yol izler; bütün odaya eğim uygulanmaz. `src/data/bmoScreen.js` ekranın merkezi ve boyutundan kamera hedefini hesaplar. Boyut değişiminde mevcut dönüşümün ve `transform-origin` değerinin tersi alınır; önceki büyütme tekrar uygulanmaz. `NewsReader.jsx` kamera katmanının dışında sabit tam ekran bir dialog olarak kalır. Kamera ilerlemesi bittiğinde kontrollerin `inert` kilidi açılır ve odak okuyucuya geçer. Azaltılmış harekette kamera sabit kalır ve aynı ilerleme 120 ms içinde oynar.

`BmoReaction.jsx` tıklama anından itibaren yüz ifadesini SVG olarak özgün BMO ekranına yerleştirir. `reactions.js` içindeki tepki türü, gözlerin ve gülümsemenin biçimini belirler. `faceExpressions.js`, aynı sayıda eğri parçası içeren normal, gülümseyen ve üç neşeli ifade şeklini tutar. Gözler ve ağız yeniden oluşturulmadan 320–380 ms içinde aynı SVG yolları üzerinde şekil değiştirir. Yanak rengi ve ışıltılar yumuşakça belirir; dil, değişen ağız şeklinin içinde kırpılır. Kapatmada yüz önce sakin gülümsemeye, kart çıkarken normal ifadeye döner; sonra katman silinir. Azaltılmış hareket tercihinde şekiller doğrudan değişir. Yüz çizimi kamera yaklaşırken BMO’nun gövdesiyle birlikte hareket eder; ayrıca büyüyen ikinci bir yüz veya ekran yoktur.

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

`src/data/reactions.js`, kategorilerin kısa repliklerini tutar. Ekran yakınlaşmaya başlarken cihazda yerel bir İngilizce konuşma sesi varsa Web Speech API ile daha ince perdede (`pitch: 1.7`) seslendirilir. Bu, orijinal BMO ses kaydı değildir; karaktere uygun neşeli bir robot tepkisidir. Uygulama uzak konuşma servislerini seçmez. Yerel ses yoksa veya konuşma API’si hata verirse Web Audio ile yükselen elektronik heceler çalar. Konuşma da sessize alma, ekrandan çıkma ve uygulamanın kapanması sırasında temizlenir.

Tarayıcılar ses için kullanıcı etkileşimi ister. Kaydedilmiş “ses açık” tercihiyle sayfa yeniden yüklendiğinde ilk tıklama veya tuş sesi etkinleştirir. Ses veya yerel depolama API’si yoksa haber akışı yine çalışır.

### 5. Haber okuyucusunu ayrı bir bileşen yapıyoruz

`NewsReader.jsx`, yerel HTML `dialog` öğesini kullanır. Kamera geçişiyle açıldığında arka plan etkileşimini ve kaydırmayı sınırlar; klavye odağını panel içinde tutar. Kapatma animasyonundan sonra odak karta döner. `SoundButton.jsx`, ana sahne ile okuyucuda aynı ses durumunu gösterir.

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

Birim testleri aşama sırasını, eski animasyon olaylarını, hızlı seçimleri, kart değiştirme/kapatma akışını ve beş ayrı ses profilini kontrol eder. Tarayıcı testleri gerçek kart takma/çıkarma, okuyucu, döngülü gezinme, odak dönüşü, native Web Audio, sessize alma, azaltılmış hareket, 320/390/768 piksel ekranlar, hareket sırasında boyut değişimi ve ses/depolama API’lerinin yokluğunu kapsar. Yeni kontroller kartın alt/ön taraftan girmesini, kart takıldıktan hemen sonra kameranın başlamasını, geçişteki kontrollerin kilitli kalmasını ve BMO’nun tepki vermesini, kameranın giriş/çıkış sırasını, ara karelerde eğim ve merkez kayması oluşmadığını, yazıların yalnızca yeşil zemin tam kapatınca belirdiğini, yakınlaşırken ekran boyutunun değişmesini ve yerel konuşmanın sessize alınmasını da doğrular.

## Görsel kalitesi ve yükleme

Oda arka planı ve dört kategori kapağı, düşük çözünürlüklü referanslardan yeniden çizildi. BMO ile çakışan küçük sehpa, aynı yatay ve dikey oda görsellerinden kaldırılıp altındaki zemin tamamlandı; koltuk, kutular, ocak ve mimari korundu. Telefon için aynı odanın ayrıca dikey kompozisyonu hazırlandı. Bağlam kontrolünde ekonomi kapağının özgün Finn ve Jake sahnesini değiştirdiği görüldü; altın/pazar görseli kaldırılıp `Photos/haberkapak3.jpg` doğrudan kaynak olarak geri alındı. Bu kapakta yalnızca boyutlandırma ve WebP kodlama yapılır; yeni nesne veya sahne üretilmez. Özgün `Photos/` dosyaları değişmedi.

Yayında yalnızca `src/assets/optimized/` içindeki WebP türevleri kullanılır. Ham üretilmiş PNG dosyaları yayın paketine alınmaz. `src/data/imageAssets.js`, her kullanım için `srcSet` listesini ve yedek boyutu tanımlar:

| Kullanım                 | Çözünürlükler                       | En büyük dosya |
| ------------------------ | ----------------------------------- | -------------- |
| Yatay arka plan          | 768 / 1280 / 1672 px genişlik       | 196 KiB        |
| Dikey telefon arka planı | 480 / 768 / 941 px genişlik         | 146 KiB        |
| Şeffaf BMO               | 360 / 720 / 1149 px genişlik        | 103 KiB        |
| Küçük kart kapakları     | 192 / 384 / 576 px genişlik         | 54 KiB         |
| Haber kapağı (diğerleri) | 640 / 960 / 1280 / 1672 px genişlik | 295 KiB        |
| Ekonomi haber kapağı    | 480 / 597 px genişlik              | 36 KiB         |

En büyük arka planlar 1672 × 941 ve 941 × 1672 pikseldir. Diğer haber kapakları 1672 × 941 pikseldir. Ekonomi kapağı özgün 597 × 335 piksel kaynağın sınırında tutulur; büyütmek yeni detay kazandırmayacağından 1672 piksele yükseltilmez. Bu nedenle büyük ekranda diğer kapaklardan daha az ayrıntılı olabilir. Kaynak dosyanın yolu, boyutları ve SHA-256 özeti görsel manifestinde kayıtlıdır. BMO’nun biçimi, şeffaflığı ve SVG göz/hazne hizası korunur; yalnızca kodlaması ve sunulan boyutları değişti.

`picture`, portre telefonda dikey arka planı seçer. `sizes` ve `srcSet`, ekran boyutuna ve piksel yoğunluğuna uygun kaynağı tarayıcıya bırakır. Kartlar küçük kapakları kullanır; büyük haber görselleri okuyucu açılmadan indirilmez. Haber kapağı kendi oranıyla gösterilir; siyah bant veya baş/kafa kesen aşırı kırpma eklenmez. Masaüstünde kapak 760 px ile sınırlıdır, metne de yer kalır.

Boyut bilgileri önceden verilir ve görseller asenkron çözülür. Arka planın yükleme önceliği yüksektir. Vite’ın görselleri JavaScript’e gömmesi kapatıldı; kullanılmayan büyük türevler ilk pakete taşınmaz ve dosyalar ayrı önbelleklenebilir.

Soğuk önbellekli, 2× piksel yoğunluğundaki Chromium ölçümünde ilk açılışın **görsel verisi** 390 × 844 telefonda **243,9 KiB**, 1440 × 1000 masaüstünde **324,7 KiB** oldu. Önceki görseller toplamı yaklaşık **1224 KiB** idi; ilk görsel aktarımı yaklaşık **%73–80 azaldı**. Bu ölçüm JavaScript/fontları kapsamaz; cihaz ve önbelleğe göre değişir.

`tests/assets.test.js` dosya başlıklarını, şeffaflık bilgisini, çözünürlükleri ve boyut bütçelerini kontrol eder. `tests/browser/images.spec.js`, gerçek tarayıcıda hangi kaynağın seçildiğini ve büyük kapakların ilk açılışta indirilmediğini doğrular.

## Görsel bağlam kontrolü

| Görsel | Kontrol sonucu |
| --- | --- |
| Oda (yatay ve dikey) | Ağaç ev, kırmızı koltuk, kutu yığınları ve sağdaki ocak korunur. BMO ile çakışan küçük sehpa kaldırılmıştır. |
| Teknoloji | Mavi uyarı ekranlarıyla çevrili laboratuvar ve merkezdeki karakter korunur. |
| Ekonomi | Bağlamı değiştiren pazar sahnesi kaldırıldı; özgün Finn ve Jake kapağı geri alındı. |
| Politika | Takım elbiseli Buz Kralı ve iç mekân korunur. |
| Hava durumu | Kara bulutların altında Finn ve Jake sahnesi korunur. |
| Kültür ve yaşam | Prenses Ciklet ve Lady Rainicorn sahnesi korunur. |
| BMO | Özgün şeffaf karakter; yalnızca boyutlandırma ve kodlama yapılır. |

## Özgün görsel referansları

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

BMO türevleri, kullanıcının gönderdiği görsellerden görsel düzenleme aracıyla hazırlanmıştır. Oturan sürüm, sohbette sonradan gönderilen oturmuş BMO görselinden arka plan kaldırılarak hazırlanmıştır. Önceki ayakta duran sürüm dosyası korunur, ancak artık sahnede kullanılmaz. Dört kapak üretilirken bu özgün görseller referans alındı; ekonomi kapağı ise özgün dosyadan kodlandı. Özgün dosyalar değişmez. Kart içindeki küçük kırpma CSS `object-fit` ile yapılır, okuyucuda tam yatay oran korunur. Tasarım referansı: https://www.adarkeser.com/ adresinin Adventure bölümü ve kullanıcının sağladığı ekran görüntüleri. Referans sitenin kaynak kodu kullanılmadı.

## Elle kontrol

1. Sesi aç ve beş kartın üzerine sırayla gel; her kategorinin melodisi farklı olmalı.
2. Bir kart seç; hazneye gitmesini, BMO’nun mutlu yüzünü/repliğini ve ekranına yaklaşarak doğru haberin açılmasını izle.
3. Okuyucunun altındaki önceki/sonraki kart kontrollerini dene. Kamera geri dönmeli, eski kart çıkarılmalı ve ardından yeni kart takılmalı.
4. Okuyucunun üstündeki ses düğmesini kapat; geçişler sessiz devam etmeli.
5. Escape veya kapatma düğmesiyle koleksiyona dön; kart kendi yerinde ve klavye odağı üzerinde olmalı.
6. Kartlara Tab ile ulaş; Enter ve sağ/sol oklarını dene. Hareket sırasında art arda tıklayarak akışın bozulmadığını kontrol et.
7. Mobil ekranı ve azaltılmış hareket ayarını dene. Hareket azaltıldığında haberleri açma/kapatma çalışmaya devam etmeli.
