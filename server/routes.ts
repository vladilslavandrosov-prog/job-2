import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { passport } from "./auth.js";
import {
  getTenders,
  getTenderById,
  createUser,
  getUserByUsername,
  getUserByEmail,
  getSavedTenders,
  saveTender,
  unsaveTender,
  isTenderSaved,
  updateUserPlan,
} from "./storage.js";
import { registerSchema } from "../shared/schema.js";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  next();
}

export function registerRoutes(app: Express) {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      if (await getUserByUsername(data.username))
        return res.status(400).json({ error: "Username already taken" });
      if (await getUserByEmail(data.email))
        return res.status(400).json({ error: "Email already registered" });
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await createUser({ ...data, password: hashedPassword });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed" });
        const { password: _, ...safe } = user;
        res.json(safe);
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safe } = user;
        res.json(safe);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => res.json({ ok: true }));
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    const { password: _, ...safe } = req.user as any;
    res.json(safe);
  });

  app.get("/api/tenders", async (req, res) => {
    try {
      const { category, platform, search, status } = req.query as Record<string, string>;
      res.json(await getTenders({ category, platform, search, status }));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tenders/:id", async (req, res) => {
    try {
      const tender = await getTenderById(Number(req.params.id));
      if (!tender) return res.status(404).json({ error: "Not found" });
      res.json(tender);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/saved", requireAuth, async (req, res) => {
    try {
      const saved = await getSavedTenders((req.user as any).id);
      res.json(saved.map((s) => s.tender));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/saved/:tenderId", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tenderId = Number(req.params.tenderId);
      const already = await isTenderSaved(userId, tenderId);
      if (already) {
        await unsaveTender(userId, tenderId);
        return res.json({ saved: false });
      }
      await saveTender(userId, tenderId);
      res.json({ saved: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/billing/upgrade", requireAuth, async (req, res) => {
    try {
      const { plan } = req.body;
      if (!["free", "pro", "enterprise"].includes(plan))
        return res.status(400).json({ error: "Invalid plan" });
      const user = await updateUserPlan((req.user as any).id, plan);
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
