import fs from "node:fs";
import path from "node:path";
import express from "express";
import { categories, categoryIds } from "./categories.js";
import { refreshAll } from "./ingest.js";
import { buildAllNews, snapshotCategory } from "./payload.js";
import { BUILD, STARTED_AT } from "./version.js";

const STALE_MS = 15 * 60 * 1000;

export function createApp({ store, env = process.env, refresh = (options) => refreshAll(store, options), distDir = path.resolve("dist") }) {
  const app = express();
  const state = { refreshing: null, lastRefreshAt: null };

  function triggerRefresh() {
    if (state.refreshing) return state.refreshing;
    state.refreshing = refresh({})
      .then((results) => {
        state.lastRefreshAt = new Date().toISOString();
        return results;
      })
      .finally(() => {
        state.refreshing = null;
      });
    state.refreshing.catch(() => {});
    return state.refreshing;
  }

  app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", env.CORS_ORIGIN || "*");
    res.set("Access-Control-Allow-Headers", "content-type, x-admin-token");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.get("/api/health", async (_req, res) => {
    res.json({ ok: true, build: BUILD, startedAt: STARTED_AT, store: store.kind, counts: await store.counts(), refreshing: Boolean(state.refreshing), lastRefreshAt: state.lastRefreshAt });
  });

  app.get("/api/news/all", async (_req, res, next) => {
    try {
      const data = await buildAllNews(store);
      const newest = Object.values(data.categories).map((c) => c.explain.lastFetchedAt).filter(Boolean).sort().at(-1);
      if (!newest || Date.now() - Date.parse(newest) > STALE_MS) triggerRefresh(); // arka planda yenile, cevabı bekletme
      res.json({ ...data, refreshing: Boolean(state.refreshing) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/news", async (req, res, next) => {
    try {
      const id = String(req.query.category ?? "");
      if (!categoryIds.includes(id)) return res.status(400).json({ error: `Bilinmeyen kategori. Geçerliler: ${categoryIds.join(", ")}` });
      res.json(await snapshotCategory(store, id));
    } catch (error) {
      next(error);
    }
  });

  // Açıklanabilirlik uç noktası: ayarlar + son toplama denemeleri.
  app.get("/api/sources", async (_req, res, next) => {
    try {
      res.json({
        build: BUILD,
        startedAt: STARTED_AT,
        store: store.kind,
        refreshEveryMinutes: Number(env.REFRESH_MINUTES) || 15,
        order: ["google-news-rss", "gdelt"],
        categories: categories.map(({ id, label, why, google, gdelt }) => ({ id, label, why, google, gdelt })),
        recentRuns: await store.listRuns(25),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/refresh", async (req, res) => {
    const token = env.ADMIN_TOKEN;
    if (!token) return res.status(403).json({ error: "ADMIN_TOKEN tanımlı değil; elle yenileme kapalı." });
    if (req.get("x-admin-token") !== token) return res.status(401).json({ error: "Geçersiz token" });
    res.status(202).json({ started: true });
    triggerRefresh();
  });

  app.use("/api", (_req, res) => res.status(404).json({ error: "Böyle bir uç nokta yok" }));

  if (fs.existsSync(path.join(distDir, "index.html"))) {
    app.use(express.static(distDir));
    app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
  }

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: "Sunucu hatası" });
  });

  app.locals.triggerRefresh = triggerRefresh;
  app.locals.state = state;
  return app;
}
