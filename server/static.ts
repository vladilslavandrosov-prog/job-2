import type { Express } from "express";
import express from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  const candidates = [
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "public"),
    "/app/dist/public",
    "/dist/public",
    path.resolve(process.cwd(), "../dist/public"),
  ];

  const distPath = candidates.find((p) => {
    try { return fs.existsSync(p) && fs.existsSync(path.join(p, "index.html")); }
    catch { return false; }
  });

  // Debug endpoint
  app.get("/api/debug-fs", (_req, res) => {
    const info: Record<string, any> = { cwd: process.cwd(), candidates: {} };
    for (const p of candidates) {
      try {
        info.candidates[p] = fs.existsSync(p)
          ? fs.readdirSync(p).slice(0, 20)
          : "NOT FOUND";
      } catch (e: any) {
        info.candidates[p] = "ERROR: " + e.message;
      }
    }
    info.chosen = distPath || null;
    res.json(info);
  });

  if (!distPath) {
    console.error("[static] dist/public not found. Tried:", candidates);
    app.get(/^(?!\/api).*$/, (_req, res) => {
      res.status(503).send("<h1>Frontend not built</h1><p>dist/public not found</p>");
    });
    return;
  }

  console.log("[static] Serving from:", distPath);
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
