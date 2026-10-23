import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Gamepad2,
  Keyboard,
  Radio,
  VolumeX,
  Volume2,
} from "lucide-react";
import { news } from "./data/news.js";
import NewsCartridge from "./components/NewsCartridge.jsx";
import BmoEyes from "./components/BmoEyes.jsx";
import useHoverSound from "./hooks/useHoverSound.js";
import room from "../Photos/ev4.jpg";
import bmo from "./assets/bmo-seated.png";

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState(2);
  const selected = news[selectedIndex];
  const sound = useHoverSound();

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
          <span className="edition">VOL. 002</span>
          <button
            className="sound-button"
            onClick={sound.toggle}
            aria-pressed={sound.enabled}
            title={sound.enabled ? "Ses efektlerini kapat" : "Ses efektlerini aç"}
            aria-label="Ses efektleri"
          >
            {sound.enabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span>{sound.enabled ? "SES AÇIK" : "SES KAPALI"}</span>
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
          BMO yerini aldı. Sen hangi hikâyeye dalmak istersin?
        </p>
      </section>
      <section
        className="console-scene"
        aria-label="BMO’nun etrafında süzülen haber kartları"
      >
        <div className="collection-label">
          <span>✦</span> BMO’NUN KOLEKSİYONU{" "}
          <span className="collection-count">05 KART</span>
        </div>
        <div
          className="card-field"
          role="group"
          aria-label="Bir haber kartı seç"
          onKeyDown={handleKeys}
        >
          <div className="bmo-area">
            <div className="bmo-ground-shadow" />
            <img
              className="bmo-character"
              src={bmo}
              alt="Yerde oturan, bacaklarını uzatmış BMO"
            />
            <BmoEyes />
            <span className="bmo-nameplate">
              <span className="status-dot" /> BMO HABER MERKEZİ
            </span>
          </div>
          {news.map((item, index) => (
            <NewsCartridge
              key={item.id}
              item={item}
              selected={selectedIndex === index}
              position={index}
              onSelect={() => setSelectedIndex(index)}
              onHover={sound.play}
            />
          ))}
          <div className="field-note">
            küçük konsol,
            <br />
            büyük merak. <span>♡</span>
          </div>
        </div>
      </section>
      <section className="dialogue" aria-label="Seçili haber kartı">
        <div className="dialogue-name">
          <Radio size={14} /> BMO
        </div>
        <div className="dialogue-main" aria-live="polite" aria-atomic="true">
          <p className="dialogue-prompt">Bip bop! Bugün bunu keşfedelim mi?</p>
          <div className="selected-story">
            <span
              className="selected-category"
              style={{ "--category-color": selected.color }}
            >
              {selected.category}
            </span>
            <h2>{selected.title}</h2>
          </div>
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
      </section>
      <footer className="site-footer">
        <span>
          <span className="footer-star">✦</span> Ooo’da sıradan bir haber günü.
        </span>
        <span className="keyboard-hint">
          <Keyboard size={15} /> Kartları keşfetmek için ← →
        </span>
        <span className="prototype-label">
          YERLEŞİM + SÜZÜLME · DEMO İÇERİK
        </span>
      </footer>
    </main>
  );
}
