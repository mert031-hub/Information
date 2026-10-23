import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  Clock3,
  Gamepad2,
  X,
} from "lucide-react";
import SoundButton from "./SoundButton.jsx";

export default function NewsReader({
  item,
  index,
  count,
  onClose,
  onMove,
  sound,
}) {
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    element.querySelector(".reader-close").focus({ preventScroll: true });
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function handleKeys(event) {
    if (event.key !== "Tab") return;
    const buttons = dialog.current.querySelectorAll("button:not([disabled])");
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
      aria-labelledby="reader-title"
      onKeyDown={handleKeys}
      style={{ "--story-color": item.color }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="reader-toolbar">
        <span className="reader-brand">
          <Gamepad2 size={22} /> BMO <span>OKUMA MODU</span>
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
            <span /> KART {String(index + 1).padStart(2, "0")} / {item.label}
          </p>
          <h1 id="reader-title">{item.title}</h1>
          <p className="reader-subtitle">{item.subtitle}</p>
          <div className="reader-meta">
            <span>BMO HABER MERKEZİ</span>
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
          <figcaption>
            <span>OOO’DAN BİLDİRİYORUZ</span>
            <span>✦ {item.category}</span>
          </figcaption>
        </figure>
        <div className="reader-copy">
          <p className="reader-lead">{item.summary}</p>
          {item.body.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.text}</p>
            </section>
          ))}
          <aside className="reader-note">
            <span>✦ BMO’DAN KÜÇÜK BİR NOT</span>Bu hikâye arayüzü denemek için
            yazılmış kurmaca bir demo içeriktir. Gerçek haber, finansal öneri
            veya canlı hava durumu verisi değildir.
          </aside>
        </div>
      </article>
      <nav className="reader-navigation" aria-label="Haberler arasında geçiş">
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
      <button className="reader-return" onClick={onClose}>
        <ArrowUpLeft size={15} /> Kartı çıkar ve BMO’ya dön
      </button>
    </dialog>
  );
}
