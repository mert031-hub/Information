import technology from "../../Photos/haberkapak4.jpg";
import economy from "../../Photos/haberkapak3.jpg";
import politics from "../../Photos/haberkapak5.jpg";
import weather from "../../Photos/haberkapak2.jpg";
import culture from "../../Photos/haberkapak1.jpg";

// Tasarım için yazılmış kurmaca içeriklerdir. Gerçek haber veya canlı veri değildir.
export const news = [
  {
    id: "technology",
    body: [
      {
        heading: "Küçük bir fikirle başlayan macera",
        text: "BMO bugün laboratuvarın köşesindeki eski bir sensörü buldu. Finn bir keşif aracı yapmak istedi, Jake ise önce ona komik bir isim bulmayı önerdi. İkisi de aynı soruda buluştu: Bu küçük parça kimin işini kolaylaştırabilir?",
      },
      {
        heading: "En iyi icat, birlikte denenen icat",
        text: "İlk deneme pek yolunda gitmedi; araç taşları saymak yerine bulutları saydı. Ekip hatayı not etti, sensörün yönünü değiştirdi ve yeniden denedi. BMO’ya göre teknoloji biraz merak, biraz sabır ve bolca birlikte düşünmek demek.",
      },
      {
        heading: "Sıradaki durak: senin fikrin",
        text: "Ooo’da büyük buluşların hepsi parlak bir laboratuvarda başlamıyor. Bazen unutulmuş bir kutu ve iyi sorulmuş bir soru yetiyor. Günlük hayatında kolaylaştırmak istediğin küçük bir işi düşün: belki sonraki macera orada başlar.",
      },
    ],
    category: "Teknoloji",
    label: "TEKNOLOJİ",
    color: "#70ddd0",
    title: "Gelecek sandığından daha yakın.",
    subtitle: "Küçük bir fikir. Kocaman bir gelecek.",
    summary:
      "Ooo laboratuvarında yeni bir gün! BMO ile akıllı makineleri, yaratıcı fikirleri ve geleceğin dünyasını keşfet.",
    readTime: "3 dk",
    image: technology,
  },
  {
    id: "economy",
    body: [
      {
        heading: "Bir kese altın, üç farklı plan",
        text: "Pazar yolunda Finn yeni bir kılıç, Jake ise upuzun bir sandviç hayal ediyor. BMO küçük bir defter açıp kesedeki altınları sayıyor. Maceranın ilk kuralı basit: Ne kadarın olduğunu bilmeden hepsini harcama.",
      },
      {
        heading: "İhtiyaçlar ve küçük mutluluklar",
        text: "Şeker Krallığı’nın renkli tezgâhlarında her şey cazip görünüyor. Ekip yiyecek, yol malzemeleri ve eğlence için ayrı paylar ayırıyor. Böylece yolculuk devam ederken sürpriz bir durak için de birkaç altın kalıyor.",
      },
      {
        heading: "BMO’nun pazar defteri",
        text: "Günün sonunda kahramanlarımız aldıklarını ve vazgeçtiklerini karşılaştırıyor. Bu kurmaca hikâyede amaç en çok altını toplamak değil; sınırlı kaynaklarla birlikte karar vermenin yollarını keşfetmek.",
      },
    ],
    category: "Ekonomi",
    label: "EKONOMİ",
    color: "#ffc86b",
    title: "Altınlar nereye gidiyor?",
    subtitle: "Ooo ekonomisinde neler oluyor?",
    summary:
      "Finn ve Jake birikimlerini planlıyor. Şeker Krallığı pazarından tasarruf fikirlerine, ekonomi kartında küçük bir yolculuk.",
    readTime: "4 dk",
    image: economy,
  },
  {
    id: "politics",
    body: [
      {
        heading: "Krallık meydanında buluşma",
        text: "Ooo’nun farklı köşelerinden temsilciler ortak yolları konuşmak için bir araya geliyor. Buz Krallığı daha sağlam köprüler, Şeker Krallığı daha aydınlık meydanlar istiyor. BMO herkesin önerisini sırayla kaydediyor.",
      },
      {
        heading: "Bir karardan önce birçok ses",
        text: "Toplantının en ilginç anı, daha önce konuşmayan küçük bir köyün söz alması oluyor. Ortak bir kararın etkisini anlamak için yalnızca en yüksek sesi duymak yetmiyor. Kahramanlarımız sorular soruyor ve birbirlerini dinliyor.",
      },
      {
        heading: "Gündemin arkasındaki hikâye",
        text: "Bu hayali krallık toplantısı, kararların günlük yaşamla nasıl bağlantı kurduğunu anlatıyor. BMO’nun defterinde son bir not var: İyi bir soru, bazen uzun bir konuşmadan daha çok şey değiştirebilir.",
      },
    ],
    category: "Politika",
    label: "POLİTİKA",
    color: "#bb9be9",
    title: "Krallıkta gündem değişiyor.",
    subtitle: "Bütün krallıkların bir hikâyesi var.",
    summary:
      "Buz Krallığı’nda yeni kararlar, Şeker Krallığı’nda yeni fikirler. Ooo’nun gündemini BMO’nun gözünden takip et.",
    readTime: "5 dk",
    image: politics,
    imagePosition: "center 32%",
  },
  {
    id: "weather",
    body: [
      {
        heading: "Gökyüzünün bugünkü hikâyesi",
        text: "Finn ve Jake yola çıkmadan ağaç evin penceresinden dışarı bakıyor. Ufukta yumuşak bulutlar var; rüzgâr yaprakları hafifçe hareket ettiriyor. BMO macera çantasına ince bir yağmurluk ekliyor.",
      },
      {
        heading: "Planın bir de yağmurlu hâli olsun",
        text: "Bir patikada güneş varken diğerinde küçük bir sağanak başlayabilir. Ekip açık alandaki molasını kısa tutup güvenli bir dinlenme noktası seçiyor. Bu karttaki hava anlatımı tamamen kurmaca; gerçek bir tahmin sunmuyor.",
      },
      {
        heading: "Macera için küçük bir kontrol",
        text: "Su, uygun kıyafet ve dönüş planı hazır. Kahramanlarımız hava değiştiğinde rotayı değiştirmeyi de maceranın parçası sayıyor. Gerçek bir yolculuk öncesinde bulunduğun yere ait güncel hava tahminini kontrol etmeyi unutma.",
      },
    ],
    category: "Hava durumu",
    label: "HAVA DURUMU",
    color: "#96c9ed",
    title: "Macera için hava nasıl?",
    subtitle: "Yanına bir şemsiye alsan iyi olur.",
    summary:
      "Ooo semalarında bulutlar toplanıyor. Finn ve Jake yola çıkmadan önce gökyüzüne bakıyor. Bu kartta örnek bir hava hikâyesi var.",
    readTime: "2 dk",
    image: weather,
  },
  {
    id: "culture",
    body: [
      {
        heading: "Ooo’da sahne kuruluyor",
        text: "Akşam yaklaşırken meydanda küçük bir müzik köşesi hazırlanıyor. Renkli ışıklar asılıyor, arkadaşlar minderleri taşıyor. BMO kendi melodisini prova ediyor; Finn ve Jake ilk sıradaki yerlerini çoktan seçmiş.",
      },
      {
        heading: "Herkesin katabileceği bir şey var",
        text: "Kimi bir şarkı getiriyor, kimi yaptığı resmi, kimi de sadece dinlemeye geliyor. Bu küçük buluşmanın güzel yanı, herkesin aynı şeyi sevmesi gerekmemesi. Yeni bir ses duymak bile akşamı başka bir renge boyuyor.",
      },
      {
        heading: "Günün küçük keşfi",
        text: "Konser bittiğinde meydanda hâlâ konuşulacak hikâyeler var. BMO son notayı kaydedip arkadaşlarına dönüyor: Bazen en güzel macera, birlikte geçirilen sıradan bir akşamdır.",
      },
    ],
    category: "Kültür & yaşam",
    label: "KÜLTÜR & YAŞAM",
    color: "#f6a6b6",
    title: "Biraz renk, biraz macera.",
    subtitle: "Günün en tatlı keşifleri burada.",
    summary:
      "Gökkuşakları, müzik ve yeni arkadaşlıklar. Prenses Ciklet’in dünyasından gününü renklendirecek küçük hikâyeler.",
    readTime: "3 dk",
    image: culture,
  },
];
