import { createApp } from "./app.js";
import { openStore } from "./store/index.js";
import { BUILD } from "./version.js";

const store = await openStore();
const app = createApp({ store });
const port = Number(process.env.PORT) || 8787;
const minutes = Number(process.env.REFRESH_MINUTES) || 15;

app.listen(port, () => console.log(`[api] http://localhost:${port}  (depo: ${store.kind}, sürüm: ${BUILD})`));

// Açılışta ve sonra düzenli aralıkla haberleri topla.
const tick = () => app.locals.triggerRefresh().then(
  (results) => console.log("[ingest]", Object.entries(results).map(([id, r]) => `${id}:${r.ok ? r.attempts.at(-1).provider : "HATA"}`).join(" ")),
  (error) => console.warn("[ingest] hata", error.message),
);
tick();
setInterval(tick, minutes * 60 * 1000).unref();

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => { await store.close(); process.exit(0); });
