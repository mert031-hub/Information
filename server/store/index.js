import path from "node:path";
import { createFileStore } from "./fileStore.js";
import { createMongoStore } from "./mongoStore.js";

// MONGODB_URI varsa MongoDB, yoksa (veya bağlanılamazsa) JSON dosyası.
export async function openStore(env = process.env, log = console) {
  if (env.MONGODB_URI) {
    try {
      const store = await createMongoStore(env.MONGODB_URI, env.MONGODB_DB || "bmo_news");
      log.info?.("[store] MongoDB bağlandı");
      return store;
    } catch (error) {
      log.warn?.(`[store] MongoDB'ye bağlanılamadı (${error.message}); dosya deposuna geçildi`);
    }
  }
  const file = env.DATA_FILE || path.resolve("server/data/store.json");
  log.info?.(`[store] Dosya deposu: ${file}`);
  return createFileStore(file);
}
