import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Gamepad2,
  Keyboard,
  Radio,
  VolumeX,
} from "lucide-react";
import { news } from "./data/news.js";
import NewsCartridge from "./components/NewsCartridge.jsx";
import room from "../Photos/ev4.jpg";
import bmo from "./assets/bmo.png";

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState(2);
  const deckRef = useRef(null);
  const selected = news[selectedIndex];

  // Mobilde seçilen kartı yatay şeridin ortasına alır. Sayfayı dikey kaydırmaz.
  useEffect(() => {
    function centerSelectedCard() {
      if (!window.matchMedia("(max-width: 680px)").matches) return;
      const deck = deckRef.current;
      const card = deck.children[selectedIndex];
      deck.scrollLeft =
        card.offsetLeft - deck.clientWidth / 2 + card.offsetWidth / 2;
    }
    centerSelectedCard();
    window.addEventListener("resize", centerSelectedCard);
    return () => window.removeEventListener("resize", centerSelectedCard);
  }, [selectedIndex]);

  function moveSelection(direction) {
    setSelectedIndex(
      (index) => (index + direction + news.length) % news.length,
    );
  }

  function handleKeys(event) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveSelection(event.key === "ArrowRight" ? 1 : -1);
    }
  }

  return (
    <main className="app-shell">
      <div className="room-background">
        <img src={room} alt="" />
      </div>
      <div className="room-shading" />

      <header className="site-header">
        <a className="brand" href="#" aria-label="BMO News ana sayfa">
          <Gamepad2 size={30} strokeWidth={1.5} />
          <span>
            BMO<span className="brand-news">NEWS</span>
          </span>
          <span className="brand-dot" />
        </a>
        <div className="header-middle">
          <span className="status-dot" /> OOO’DAN BİLDİRİYORUZ
        </div>
        <div className="header-actions">
          <span className="edition">VOL. 001</span>
          <button
            className="sound-button"
            disabled
            title="Ses efektleri sonraki aşamada eklenecek"
            aria-label="Ses efektleri henüz eklenmedi"
          >
            <VolumeX size={17} />
            <span>SES YAKINDA</span>
          </button>
        </div>
      </header>

      <section className="hero-heading" aria-labelledby="page-title">
        <p className="eyebrow">
          <span /> DÜNYADAN HABER VAR.
        </p>
        <h1 id="page-title">
          Bir kart, <span>yeni bir dünya.</span>
        </h1>
        <p className="intro">
          BMO haberleri topladı. Sen hangisinden başlamak istersin?
        </p>
      </section>

      <section className="console-scene" aria-label="Haber kartları ve BMO">
        <div className="collection-label">
          <span className="tiny-cross">✦</span> BMO’NUN KOLEKSİYONU{" "}
          <span className="collection-count">05 KART</span>
        </div>
        <div
          className="card-deck"
          ref={deckRef}
          role="group"
          aria-label="Bir haber kartı seç"
          onKeyDown={handleKeys}
        >
          {news.map((item, index) => (
            <NewsCartridge
              key={item.id}
              item={item}
              selected={selectedIndex === index}
              position={index - 2}
              onSelect={() => setSelectedIndex(index)}
            />
          ))}
        </div>
        <div className="deck-navigation">
          <button
            onClick={() => moveSelection(-1)}
            aria-label="Önceki haber kartı"
          >
            <ArrowLeft size={16} />
          </button>
          <span>
            {String(selectedIndex + 1).padStart(2, "0")} <span>/ 05</span>
          </span>
          <button
            onClick={() => moveSelection(1)}
            aria-label="Sonraki haber kartı"
          >
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="bmo-area">
          <div className="bmo-speech">
            Bip bop! Gündeme hazır mısın? <span>♡</span>
          </div>
          <div className="bmo-character">
            <img src={bmo} alt="El sallayan BMO" />
          </div>
          <div className="scene-note">
            <span className="scene-note-line" />
            <span>
              küçük konsol,
              <br />
              büyük merak.
            </span>
          </div>
        </div>
      </section>

      <section className="dialogue" aria-label="Seçili haber önizlemesi">
        <div className="dialogue-name">
          <Radio size={14} /> BMO
        </div>
        <div className="dialogue-main" aria-live="polite" aria-atomic="true">
          <div className="dialogue-topline">
            <span
              className="selected-category"
              style={{ "--category-color": selected.color }}
            >
              {selected.category}
            </span>
            <span className="demo-tag">ÖRNEK HABER</span>
            <span className="reading-time">
              <Clock3 size={12} />
              {selected.readTime} okuma
            </span>
          </div>
          <h2>{selected.title}</h2>
          <p>{selected.summary}</p>
        </div>
        <div className="dialogue-action">
          <span className="selection-check">
            <Check size={14} /> Kart seçildi
          </span>
          <span className="next-step">
            Sıradaki adım: kartı BMO’ya takmak <ArrowUpRight size={15} />
          </span>
        </div>
      </section>

      <footer className="site-footer">
        <span>
          <span className="footer-star">✦</span> Ooo’da sıradan bir haber günü.
        </span>
        <span className="keyboard-hint">
          <Keyboard size={15} /> Kartları keşfetmek için ← →
        </span>
        <span className="prototype-label">GÖRÜNÜM PROTOTİPİ · 01</span>
      </footer>
    </main>
  );
}
