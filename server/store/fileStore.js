import fs from "node:fs/promises";
import path from "node:path";

// MongoDB olmadan da çalışsın diye düz JSON dosyası. Aynı arayüzü MongoStore ile paylaşır.
export const kind = "file";
const MAX_RUNS = 200;

export async function createFileStore(file) {
  let state = { articles: {}, runs: [] };
  try {
    state = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    /* ilk çalıştırma: dosya yok */
  }
  let writing = Promise.resolve();
  const save = () =>
    (writing = writing.then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(`${file}.tmp`, JSON.stringify(state));
      await fs.rename(`${file}.tmp`, file);
    }));

  return {
    kind,
    async upsertArticles(category, articles, fetchedAt) {
      for (const article of articles)
        state.articles[article._id] = { ...state.articles[article._id], ...article, category, fetchedAt };
      await save();
    },
    async listArticles(category, limit = 20) {
      return Object.values(state.articles)
        .filter((article) => article.category === category)
        .sort((a, b) => String(b.publishedAt ?? "").localeCompare(String(a.publishedAt ?? "")))
        .slice(0, limit);
    },
    async addRun(run) {
      state.runs.unshift(run);
      state.runs.length = Math.min(state.runs.length, MAX_RUNS);
      await save();
    },
    async listRuns(limit = 20) {
      return state.runs.slice(0, limit);
    },
    async counts() {
      const result = {};
      for (const article of Object.values(state.articles)) result[article.category] = (result[article.category] ?? 0) + 1;
      return result;
    },
    async close() {
      await writing;
    },
  };
}
