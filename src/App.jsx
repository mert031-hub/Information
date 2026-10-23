import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Gamepad2 } from "lucide-react";
import { news } from "./data/news.js";
import NewsCartridge from "./components/NewsCartridge.jsx";
import BmoEyes from "./components/BmoEyes.jsx";
import useBmoAudio from "./hooks/useBmoAudio.js";
import useCartridgePlayer from "./hooks/useCartridgePlayer.js";
import CartridgeFlight from "./components/CartridgeFlight.jsx";
import BmoPort from "./components/BmoPort.jsx";
import NewsReader from "./components/NewsReader.jsx";
import SoundButton from "./components/SoundButton.jsx";
import BmoReaction from "./components/BmoReaction.jsx";
import { getBmoReaction } from "./data/reactions.js";
import room from "../Photos/ev4.jpg";
import bmo from "./assets/bmo-seated.png";

export default function App() {
  const player = useCartridgePlayer();
  const { selectedIndex, activeIndex, phase, busy } = player;
  const selected = news[selectedIndex];
  const sound = useBmoAudio();
  const fieldRef = useRef(null);
  const previousPhase = useRef("idle");
  const lastSoundPhase = useRef(null);
  const phaseSound = useRef(sound.play);
  phaseSound.current = sound.play;

  useEffect(() => {
    if (phase === "idle" && previousPhase.current !== "idle") {
      fieldRef.current
        .querySelector(`[data-slot="${selectedIndex}"] button`)
        .focus({ preventScroll: true });
    }
    previousPhase.current = phase;
    const key = `${activeIndex}:${phase}`;
    if (key === lastSoundPhase.current) return;
    lastSoundPhase.current = key;
    const event = {
      approaching: "select",
      inserting: "insert",
      zooming: "cheer",
      zoomingOut: "stop",
      ejecting: "eject",
    }[phase];
    if (event && activeIndex !== null)
      phaseSound.current(news[activeIndex].id, event);
  }, [phase, activeIndex, selectedIndex]);

  function moveSelection(direction) {
    player.select((selectedIndex + direction + news.length) % news.length);
  }

  const prompt =
    {
      approaching: "Kart hazırlanıyor…",
      inserting: "Kart takılıyor…",
      zooming: getBmoReaction(selected.id).text,
      zoomingOut: "Koleksiyona dönülüyor…",
      ejecting: "Kart çıkarılıyor…",
      returning: "Kart yerine dönüyor…",
    }[phase] || "";

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
        <SoundButton sound={sound} />
      </header>
      <h1 className="sr-only">BMO News</h1>
      <section
        className="console-scene"
        aria-label="BMO’nun etrafında süzülen haber kartları"
      >
        <div
          ref={fieldRef}
          className="card-field"
          data-busy={busy}
          data-phase={phase}
          aria-busy={busy}
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
            <BmoPort phase={phase} color={selected.color} />
            <BmoReaction phase={phase} category={selected.id} />
          </div>
          {news.map((item, index) => (
            <NewsCartridge
              key={item.id}
              item={item}
              selected={selectedIndex === index}
              position={index}
              away={activeIndex === index}
              busy={busy}
              onSelect={() => player.select(index)}
              onHover={() => sound.play(item.id)}
            />
          ))}
          {activeIndex !== null &&
            ["approaching", "inserting", "ejecting", "returning"].includes(
              phase,
            ) && (
              <CartridgeFlight
                key={activeIndex}
                item={news[activeIndex]}
                index={activeIndex}
                phase={phase}
                fieldRef={fieldRef}
                onComplete={player.advance}
              />
            )}
        </div>
      </section>
      <section className="scene-controls" aria-label="Kart kontrolleri">
        <p className="scene-status" role="status" aria-live="polite">
          {prompt}
        </p>
        <div className="deck-navigation">
          <button
            disabled={busy}
            onClick={() => moveSelection(-1)}
            aria-label="Önceki haber kartı"
          >
            <ArrowLeft size={16} />
          </button>
          <span>
            {String(selectedIndex + 1).padStart(2, "0")} <span>/ 05</span>
          </span>
          <button
            disabled={busy}
            onClick={() => moveSelection(1)}
            aria-label="Sonraki haber kartı"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
      {["zooming", "reading", "zoomingOut"].includes(phase) && (
        <NewsReader
          item={news[activeIndex]}
          index={activeIndex}
          count={news.length}
          phase={phase}
          fieldRef={fieldRef}
          onComplete={player.advance}
          onClose={player.close}
          onMove={moveSelection}
          sound={sound}
        />
      )}
    </main>
  );
}
