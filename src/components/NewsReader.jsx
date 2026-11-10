import { useEffect, useLayoutEffect, useRef } from "react";
import { motion, useTransform } from "motion/react";
import { ArrowLeft, ArrowRight, Clock3, Gamepad2, X } from "lucide-react";
import SoundButton from "./SoundButton.jsx";
import { formatAgo, formatClock, providerLabel } from "../data/format.js";

export default function NewsReader({
  item,
  index,
  count,
  phase,
  progress,
  onClose,
  onMove,
  onRetry,
  cachedAt,
  sound,
}) {
  const dialog = useRef(null);
  const opacity = useTransform(progress, [0, 0.58, 0.8, 1], [0, 0, 1, 1]);
  const contentOpacity = useTransform(progress, [0, 0.8, 1], [0, 0, 1]);
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
        style={{ opacity }}
      >
        <div className="bmo-screen-glass">
          <motion.div
            className="screen-scroll"
            aria-hidden={!reading}
            inert={!reading}
            style={{ opacity: contentOpacity }}
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
                  <span data-mode={item.mode}>{metaLabel(item, cachedAt)}</span>
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
                <SourceNotice item={item} cachedAt={cachedAt} onRetry={onRetry} />
                {item.liveArticles.length > 0 ? (
                  <section className="live-news-list" aria-label="Polonya'dan güncel haberler">
                    <h2>{item.sample ? "Örnek haberler (gerçek değil)" : "Polonya’dan güncel haberler"}</h2>
                    {item.liveArticles.map((article) => (
                      <article className="live-news-item" key={article.id}>
                        <p className="live-news-source">
                          {article.source}
                          {article.publishedAt && <time dateTime={article.publishedAt}> · {formatAgo(article.publishedAt)}</time>}
                        </p>
                        <h3>{article.title}</h3>
                        {article.summary && <p>{article.summary}</p>}
                        <a href={article.url} target="_blank" rel="noreferrer">
                          Haberin kaynağına git →
                        </a>
                        <WhyHere article={article} />
                      </article>
                    ))}
                  </section>
                ) : (
                  item.body.map((section) => (
                    <section key={section.heading}>
                      <h2>{section.heading}</h2>
                      <p>{section.text}</p>
                    </section>
                  ))
                )}
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
        </div>
      </motion.div>
    </dialog>
  );
}

function metaLabel(item, cachedAt) {
  if (item.sample) return "ÖRNEK VERİ · GERÇEK DEĞİL";
  if (item.mode === "live") return "POLONYA · CANLI AKIŞ";
  if (item.mode === "snapshot") return `ANLIK GÖRÜNTÜ · ${formatAgo(cachedAt)}`;
  if (item.mode === "cached") return `ÖNBELLEKTEN · ${formatAgo(cachedAt)}`;
  if (item.mode === "loading") return "YÜKLENİYOR";
  return "ÖRNEK İÇERİK";
}

// Okuyucuya "bu akış nereden geldi?" sorusunun cevabını verir; canlı değilse nedenini ve çaresini söyler.
function SourceNotice({ item, cachedAt, onRetry }) {
  const { explain = {}, mode } = item;
  if (mode === "live")
    return (
      <p className="source-notice" data-mode="live">
        <strong>Bu akış nasıl oluştu?</strong> {explain.why} Kaynak servis:{" "}
        {providerLabel(explain.provider)}. Son toplama: {formatAgo(explain.lastFetchedAt) || "bilinmiyor"}. En yeni haberler en üstte.
      </p>
    );
  if (mode === "snapshot")
    return (
      <p className="source-notice" data-mode="snapshot" role="status">
        Canlı sunucuya ulaşılamadı; <strong>{formatAgo(cachedAt)}</strong> alınan haber dosyası (news.json) gösteriliyor.{" "}
        <button type="button" onClick={onRetry}>Tekrar dene</button>
        {item.loadError && <span className="source-reason"><b>Sebep:</b> {item.loadError}</span>}
      </p>
    );
  if (mode === "cached")
    return (
      <p className="source-notice" data-mode="cached" role="status">
        Sunucuya ulaşılamadı; bu tarayıcıda {formatAgo(cachedAt)} saklanan son haberler gösteriliyor.{" "}
        <button type="button" onClick={onRetry}>Tekrar dene</button>
      </p>
    );
  if (mode === "loading")
    return (
      <p className="source-notice" data-mode="loading" role="status">
        Polonya’dan güncel haberler getiriliyor… Bu sırada örnek içerik gösteriliyor.
      </p>
    );
  return (
    <p className="source-notice" data-mode="demo" role="status">
      Güncel haberler alınamadı; <strong>kurmaca örnek içerik</strong> gösteriliyor. Gerçek bir haber değildir.{" "}
      <button type="button" onClick={onRetry}>Tekrar dene</button>
      {item.loadError && (
        <span className="source-reason">
          <b>Sebep:</b> {item.loadError}
        </span>
      )}
    </p>
  );
}

// Her haberin altındaki açılır kutu: o haber neden bu kartta?
function WhyHere({ article }) {
  const { why = {} } = article;
  return (
    <details className="why-here">
      <summary>Neden burada?</summary>
      <dl>
        <dt>Kaynak servis</dt>
        <dd>{providerLabel(why.provider)}</dd>
        <dt>Arama</dt>
        <dd>{why.query || "—"}</dd>
        <dt>Toplandığı zaman</dt>
        <dd>{formatClock(why.fetchedAt) || "—"}</dd>
        <dt>Yayın zamanı</dt>
        <dd>{formatClock(article.publishedAt) || "bilinmiyor"}</dd>
      </dl>
    </details>
  );
}
