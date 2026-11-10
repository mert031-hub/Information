import { useEffect, useRef } from "react";
import { useMotionValue } from "motion/react";
import { ArrowLeft, ArrowRight, Gamepad2 } from "lucide-react";
import { news } from "./data/news.js";
import NewsCartridge from "./components/NewsCartridge.jsx";
import BmoEyes from "./components/BmoEyes.jsx";
import useBmoAudio from "./hooks/useBmoAudio.js";
import useCartridgePlayer from "./hooks/useCartridgePlayer.js";
import CartridgeFlight from "./components/CartridgeFlight.jsx";
import BmoPort from "./components/BmoPort.jsx";
import NewsReader from "./components/NewsReader.jsx";
import SceneCamera from "./components/SceneCamera.jsx";
import SoundButton from "./components/SoundButton.jsx";
import BmoReaction from "./components/BmoReaction.jsx";
import { getBmoReaction } from "./data/reactions.js";
import { sceneImages } from "./data/imageAssets.js";
import useLiveNews from "./hooks/useLiveNews.js";
import HowItWorks from "./components/HowItWorks.jsx";
import { modeLabels } from "./data/format.js";

export default function App() {
  const player = useCartridgePlayer();
  const cameraProgress = useMotionValue(0);
  const { selectedIndex, activeIndex, phase, busy } = player;
  const sound = useBmoAudio();
  const live = useLiveNews();
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
      inserting: "insert-cheer",
      zoomingOut: "stop",
      ejecting: "eject",
    }[phase];
    if (event && activeIndex !== null)
      phaseSound.current(news[activeIndex].id, event);
  }, [phase, activeIndex, selectedIndex]);

  // Her kart için üç durumdan biri: canlı haber var / önbellekten / örnek içerik.
  const displayNews = news.map((item) => {
    const entry = live.data?.categories?.[item.id];
    const articles = entry?.articles ?? [];
    if (!articles.length)
      return {
        ...item,
        mode: live.status === "loading" ? "loading" : "demo",
        liveArticles: [],
        explain: entry?.explain ?? {},
        loadError: live.error || entry?.explain?.lastError || "",
      };
    const first = articles[0];
    return {
      ...item,
      title: first.title,
      subtitle: first.source,
      summary: first.summary || entry.explain.why || item.summary,
      readTime: `${articles.length} haber`,
      body: [],
      mode: ["cached", "snapshot"].includes(live.status) ? live.status : "live",
      sample: first.why?.provider === "demo-seed", // npm run seed ile yüklenen gerçek olmayan veri
      liveArticles: articles,
      explain: entry.explain,
      loadError: live.error || "",
    };
  });
  const selected = displayNews[selectedIndex];

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
    <>
      <SceneCamera
        phase={phase}
        fieldRef={fieldRef}
        progress={cameraProgress}
        onComplete={player.advance}
      >
        <main className="app-shell">
          <div className="room-background">
            <picture>
              <source
                media="(max-width: 680px) and (orientation: portrait)"
                srcSet={sceneImages.roomPortrait.srcSet}
                sizes="100vw"
              />
              <img
                src={sceneImages.roomLandscape.src}
                srcSet={sceneImages.roomLandscape.srcSet}
                sizes="(max-aspect-ratio: 16/9) 178vh, 100vw"
                width={1672}
                height={941}
                fetchPriority="high"
                decoding="async"
                alt=""
              />
            </picture>
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
            <div className="header-actions">
              <HowItWorks news={live} />
              <SoundButton sound={sound} />
            </div>
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
                  src={sceneImages.bmo.src}
                  srcSet={sceneImages.bmo.srcSet}
                  sizes="(max-width: 680px) 43vw, (max-width: 1100px) 32vw, 350px"
                  width={1149}
                  height={1369}
                  decoding="async"
                  alt="Yerde oturan, bacaklarını uzatmış BMO"
                />
                <BmoEyes />
                <BmoPort phase={phase} color={selected.color} />
                <BmoReaction phase={phase} category={selected.id} progress={cameraProgress} />
              </div>
              {displayNews.map((item, index) => (
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
                    item={displayNews[activeIndex]}
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
        </main>
      </SceneCamera>
      {["zooming", "reading", "zoomingOut"].includes(phase) && (
        <NewsReader
          item={{
            ...displayNews[activeIndex],
          }}
          index={activeIndex}
          count={news.length}
          phase={phase}
          progress={cameraProgress}
          onClose={player.close}
          onMove={moveSelection}
          onRetry={live.retry}
          cachedAt={live.data?.cachedAt ?? live.data?.generatedAt}
          sound={sound}
        />
      )}
    </>
  );
}
