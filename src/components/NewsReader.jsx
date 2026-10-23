import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Clock3, Gamepad2, X } from "lucide-react";
import SoundButton from "./SoundButton.jsx";
import { HappyBmoFace } from "./BmoReaction.jsx";
import { getScreenCameraGeometry } from "../data/bmoScreen.js";

export default function NewsReader({
  item,
  index,
  count,
  phase,
  fieldRef,
  onComplete,
  onClose,
  onMove,
  sound,
}) {
  const dialog = useRef(null);
  const [geometry, setGeometry] = useState(null);
  const reducedMotion = useReducedMotion();
  const reading = phase === "reading";

  useLayoutEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    element.focus({ preventScroll: true });
    function measure() {
      const port = fieldRef.current.querySelector(".bmo-port");
      setGeometry(
        getScreenCameraGeometry(port, {
          width: window.innerWidth,
          height: window.innerHeight,
        }),
      );
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(fieldRef.current.querySelector(".bmo-area"));
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [fieldRef]);

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

  const target =
    geometry &&
    (phase === "zoomingOut" && !reducedMotion
      ? geometry.source
      : geometry.destination);
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
      {geometry && (
        <motion.div
          className="bmo-screen-frame"
          initial={
            reducedMotion
              ? { ...geometry.destination, opacity: 0 }
              : geometry.source
          }
          animate={
            reducedMotion && phase === "zoomingOut"
              ? { ...target, opacity: 0 }
              : target
          }
          transition={{
            duration: reducedMotion
              ? 0.08
              : phase === "zoomingOut"
                ? 0.6
                : 0.86,
            ease: [0.32, 0, 0.18, 1],
          }}
          onAnimationComplete={() => {
            if (!reading) onComplete(phase);
          }}
        >
          <div className="bmo-screen-glass">
            <motion.div
              key="article"
              className="screen-scroll"
              aria-hidden={!reading}
              inert={!reading}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
              animate={{ opacity: phase === "zoomingOut" ? 0 : 1, y: 0 }}
              transition={{
                duration: reducedMotion
                  ? 0
                  : phase === "zoomingOut"
                    ? 0.12
                    : 0.38,
                delay: !reducedMotion && phase === "zooming" ? 0.28 : 0,
              }}
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
                    src={item.image}
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
            </motion.div>
            <motion.div
              className="screen-boot"
              aria-hidden="true"
              initial={{ opacity: 1 }}
              animate={{ opacity: phase === "zoomingOut" ? 1 : 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.42,
                delay: !reducedMotion && phase === "zooming" ? 0.18 : 0,
              }}
            >
              <svg viewBox="0 0 446 355">
                <HappyBmoFace category={item.id} />
              </svg>
            </motion.div>
          </div>
          <span className="screen-power-dot" aria-hidden="true" />
        </motion.div>
      )}
    </dialog>
  );
}
