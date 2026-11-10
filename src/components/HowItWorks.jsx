import { useEffect, useRef, useState } from "react";
import { Info, X } from "lucide-react";
import { fetchSources, hasArticles } from "../services/newsApi.js";
import { formatAgo, formatClock, providerLabel } from "../data/format.js";

const steps = [
  ["1", "Kaynaklar", "Google Haberler RSS (Polonya, Lehçe). Çalışmazsa yedek: GDELT."],
  ["2", "Toplayıcı", "Express sunucusu, 15 dakikada bir 5 kategoriyi sırayla çeker."],
  ["3", "MongoDB", "articles: haberler · runs: her denemenin günlüğü."],
  ["4", "API", "/api/news/all haberleri “neden” bilgisiyle verir."],
  ["5", "Bu sayfa", "React gösterir. Sunucu yoksa önbellek, o da yoksa örnek içerik."],
];

export default function HowItWorks({ news }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="sound-button how-button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Info size={17} />
        <span>NASIL ÇALIŞIR?</span>
      </button>
      {open && <HowDialog news={news} onClose={() => setOpen(false)} />}
    </>
  );
}

function HowDialog({ news, onClose }) {
  const dialog = useRef(null);
  const [sources, setSources] = useState({ state: "loading" });

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    const controller = new AbortController();
    fetchSources({ signal: controller.signal })
      .then((data) => setSources({ state: "ready", data }))
      .catch((error) => !controller.signal.aborted && setSources({ state: "error", message: error.message }));
    return () => {
      controller.abort();
      if (element.open) element.close();
    };
  }, []);

  const empty = news.status === "ready" && !hasArticles(news.data);
  const origin = empty ? "sunucu cevap verdi ama henüz haber toplanamadı → örnek içerik" : { ready: "sunucudan (canlı)", snapshot: "statik haber dosyasından (news.json)", cached: "tarayıcı önbelleğinden", loading: "yükleniyor", error: "alınamadı → örnek içerik" }[news.status];

  return (
    <dialog ref={dialog} className="how-dialog" aria-labelledby="how-title" onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()}>
      <header>
        <h2 id="how-title">Bu site nasıl çalışıyor?</h2>
        <button type="button" className="how-close" onClick={onClose} aria-label="Kapat"><X size={20} /></button>
      </header>
      <p className="how-lead">
        Her haber şu yoldan geçer. Kutuları soldan sağa oku; her adım kodda tek bir dosyaya karşılık gelir.
      </p>
      <ol className="how-steps">
        {steps.map(([n, title, text]) => (
          <li key={n}><b>{n}</b><strong>{title}</strong><span>{text}</span></li>
        ))}
      </ol>

      <h3>Şu an</h3>
      <p className="how-now">
        Bu sayfadaki veri: <strong>{origin}</strong>
        {news.data?.generatedAt && <> · {formatAgo(news.data.generatedAt)}</>}
        {sources.state === "ready" && <> · depo: <strong>{sources.data.store}</strong> · sunucu sürümü: <strong>{sources.data.build}</strong> (başlangıç {formatClock(sources.data.startedAt)})</>}
      </p>

      {sources.state === "loading" && <p className="how-note" role="status">Sunucu bilgisi alınıyor…</p>}
      {sources.state === "error" && (
        <p className="how-note" data-bad role="status">
          Sunucuya ulaşılamadı ({sources.message}). Bu yüzden toplama günlüğünü gösteremiyorum; sayfa önbellek veya örnek içerikle çalışıyor olabilir.
        </p>
      )}
      {sources.state === "ready" && (
        <>
          <h3>Kategoriler neden bu haberleri getiriyor?</h3>
          <ul className="how-cats">
            {sources.data.categories.map((c) => (
              <li key={c.id}><strong>{c.label}</strong> {c.why}</li>
            ))}
          </ul>
          <h3>Son toplama denemeleri</h3>
          <div className="how-table-wrap">
            <table>
              <thead><tr><th>Zaman</th><th>Kategori</th><th>Servis</th><th>Sonuç</th></tr></thead>
              <tbody>
                {sources.data.recentRuns.map((run, i) => (
                  <tr key={i} data-status={run.status}>
                    <td>{formatClock(run.at)}</td>
                    <td>{run.category}</td>
                    <td>{providerLabel(run.provider)}</td>
                    <td>{run.status === "ok" ? `${run.count} haber · ${run.durationMs} ms` : `hata: ${run.error ?? "?"}`}</td>
                  </tr>
                ))}
                {!sources.data.recentRuns.length && <tr><td colSpan="4">Henüz toplama yapılmadı.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </dialog>
  );
}
