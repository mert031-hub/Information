import technology from "../../Photos/haberkapak4.jpg";
import economy from "../../Photos/haberkapak3.jpg";
import politics from "../../Photos/haberkapak5.jpg";
import weather from "../../Photos/haberkapak2.jpg";
import culture from "../../Photos/haberkapak1.jpg";

// Tasarım için yazılmış kurmaca içeriklerdir. Gerçek haber veya canlı veri değildir.
export const news = [
  {
    id: "technology",
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
