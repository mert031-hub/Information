// Tek komutla geliştirme: haber sunucusu (8787) + arayüz (Vite) birlikte başlar. Ctrl+C ikisini de kapatır.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

// Paketler eksikse (zip yenilendi, package.json değişti) anlaşılır bir mesajla dur.
const missing = ["express", "mongodb", "fast-xml-parser", "vite"].filter((name) => !existsSync(`node_modules/${name}`));
if (missing.length) {
  console.error(`\nEksik paketler: ${missing.join(", ")}\nÖnce şunu çalıştır:  npm install   (PowerShell uygulama seçme penceresi açarsa: npm.cmd install)\nSonra tekrar:  npm run dev:all\n`);
  process.exit(1);
}

const run = (name, args) => {
  const child = spawn(process.execPath, args, { stdio: "inherit" });
  child.on("exit", (code) => {
    console.log(`[${name}] kapandı (${code})`);
    shutdown(code ?? 0);
  });
  return child;
};

const children = [
  run("api", ["server/index.js"]),
  run("web", ["node_modules/vite/bin/vite.js"]),
];
let closing = false;
function shutdown(code) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill();
  process.exit(code);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
