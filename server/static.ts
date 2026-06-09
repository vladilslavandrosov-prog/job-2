import type { Express } from "express";
import express from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  // Try multiple possible locations for dist/public
  const candidates = [
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "public"),
    "/app/dist/public",
    "/dist/public",
  ];

  const distPath = candidates.find((p) => fs.existsSync(p));

  if (!distPath) {
    console.error("Could not find static files. Tried:", candidates);
    app.get(/^(?!\/api).*$/, (_req, res) => {
      res.status(503).send("Frontend build not found");
    });
    return;
  }

  console.log("Serving static files from:", distPath);
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
