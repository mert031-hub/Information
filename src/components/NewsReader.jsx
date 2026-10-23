import { useEffect, useLayoutEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Clock3, Gamepad2, X } from "lucide-react";
import SoundButton from "./SoundButton.jsx";

export default function NewsReader({
  item,
  index,
  count,
  phase,
  onComplete,
  onClose,
  onMove,
  sound,
}) {
  const dialog = useRef(null);
  const reducedMotion = useReducedMotion();
  const reading = phase === "reading";

  useLayoutEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    element.focus({ preventScroll: true });
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (reading)
      dialog.current
        .querySelector(".reader-close")
        .focus({ preventScroll: true });
    else dialog.current.focus({ preventScroll: true });
  }, [reading]);

  function handleKeys(event) {
    if (event.key !== "Tab") return;
    if (!reading) {
      event.preventDefault();
      return;
    }
    const buttons = dialog.current.querySelectorAll("button:not([disabled])");
    if (!buttons.length) {
      event.preventDefault();
      return;
    }
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialog}
      className="news-reader"
      data-phase={phase}
      tabIndex={-1}
      aria-labelledby={reading ? "reader-title" : undefined}
      aria-label={reading ? undefined : "BMO ekranına geçiş"}
      aria-busy={!reading}
      onKeyDown={handleKeys}
      style={{ "--story-color": item.color }}
      onCancel={(event) => {
        event.preventDefault();
        if (reading) onClose();
      }}
    >
      <motion.div
        className="bmo-screen-frame"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "zoomingOut" ? 0 : 1 }}
        transition={{
          duration: reducedMotion ? 0.08 : phase === "zoomingOut" ? 0.16 : 0.34,
          delay: !reducedMotion && phase === "zooming" ? 0.86 : 0,
        }}
        onAnimationComplete={() => {
          // With reduced motion the camera stays still; the short crossfade
          // owns completion instead. Otherwise only the world camera advances.
          if (reducedMotion && !reading) onComplete(phase);
        }}
      >
        <div className="bmo-screen-glass">
          <div
            className="screen-scroll"
            aria-hidden={!reading}
            inert={!reading}
          >
            <div className="reader-toolbar">
              <span className="reader-brand">
                <Gamepad2 size={22} /> BMO
              </span>
              <div className="reader-actions">
                <SoundButton sound={sound} />
                <button
                  type="button"
                  className="reader-close"
                  onClick={onClose}
                  aria-label="Haberi kapat ve kartı çıkar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <article className="reader-article">
              <div className="reader-heading">
                <p className="reader-kicker">
                  <span /> {item.label}
                </p>
                <h1 id="reader-title">{item.title}</h1>
                <div className="reader-meta">
                  <span>
                    <Clock3 size={13} /> {item.readTime} okuma
                  </span>
                  <span>KURMACA DEMO</span>
                </div>
              </div>
              <figure className="reader-cover">
                <img
                  src={item.image.article.src}
                  srcSet={item.image.article.srcSet}
                  sizes="(max-width: 680px) calc(100vw - 60px), (max-width: 900px) calc(100vw - 140px), 760px"
                  width={item.image.article.width}
                  height={item.image.article.height}
                  decoding="async"
                  alt={`${item.category} kartının Adventure Time temalı kapak görseli`}
                  style={{ objectPosition: item.imagePosition }}
                />
              </figure>
              <div className="reader-copy">
                <p className="reader-lead">{item.summary}</p>
                {item.body.map((section) => (
                  <section key={section.heading}>
                    <h2>{section.heading}</h2>
                    <p>{section.text}</p>
                  </section>
                ))}
              </div>
            </article>
            <nav
              className="reader-navigation"
              aria-label="Haberler arasında geçiş"
            >
              <button onClick={() => onMove(-1)}>
                <ArrowLeft size={18} />
                <span>ÖNCEKİ KART</span>
              </button>
              <span>
                {String(index + 1).padStart(2, "0")}{" "}
                <span>/ {String(count).padStart(2, "0")}</span>
              </span>
              <button onClick={() => onMove(1)}>
                <span>SONRAKİ KART</span>
                <ArrowRight size={18} />
              </button>
            </nav>
          </div>
        </div>
      </motion.div>
    </dialog>
  );
}
