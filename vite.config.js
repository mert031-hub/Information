import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API = "http://localhost:8787";

// Geliştirmede /api isteklerini yerel Express sunucusuna (npm run server) yönlendirir.
// Sunucu kapalıysa Vite'ın boş "500"ü yerine anlaşılır bir 503 + açıklama döner.
export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0 },
  server: {
    proxy: {
      "/api": {
        target: API,
        configure: (proxy) => {
          proxy.on("error", (_error, _request, response) => {
            if (!response.writeHead || response.headersSent) return;
            response.writeHead(503, { "content-type": "application/json" });
            response.end(JSON.stringify({ error: `Haber sunucusu (${API}) çalışmıyor. Ayrı bir terminalde "npm run server" çalıştır ya da "npm run dev:all" kullan.` }));
          });
        },
      },
    },
  },
});
