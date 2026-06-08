import type { Express } from "express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist/public");
  app.use(express.static(distPath));
  // SPA fallback — only for non-API routes
  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
