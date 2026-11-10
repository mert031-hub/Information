import { MongoClient } from "mongodb";

// MongoDB'de iki koleksiyon var:
//   articles -> toplanan haberler (_id = URL'nin özeti, aynı haber iki kez yazılmaz)
//   runs     -> her toplama denemesinin kaydı (açıklanabilirlik günlüğü, 14 gün sonra silinir)
export const kind = "mongodb";

export async function createMongoStore(uri, dbName = "bmo_news") {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(dbName);
  const articles = db.collection("articles");
  const runs = db.collection("runs");
  await articles.createIndex({ category: 1, publishedAt: -1 });
  await runs.createIndex({ at: 1 }, { expireAfterSeconds: 14 * 24 * 3600 });

  return {
    kind,
    async upsertArticles(category, list, fetchedAt) {
      if (!list.length) return;
      await articles.bulkWrite(
        list.map(({ _id, ...fields }) => ({
          updateOne: {
            filter: { _id },
            update: { $set: { ...fields, category, fetchedAt } },
            upsert: true,
          },
        })),
      );
    },
    async listArticles(category, limit = 20) {
      return articles.find({ category }).sort({ publishedAt: -1 }).limit(limit).toArray();
    },
    async addRun(run) {
      await runs.insertOne({ ...run, at: new Date(run.at) });
    },
    async listRuns(limit = 20) {
      const rows = await runs.find().sort({ at: -1 }).limit(limit).toArray();
      return rows.map(({ _id, at, ...rest }) => ({ ...rest, at: at.toISOString() }));
    },
    async counts() {
      const rows = await articles.aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]).toArray();
      return Object.fromEntries(rows.map((row) => [row._id, row.n]));
    },
    async close() {
      await client.close();
    },
  };
}
