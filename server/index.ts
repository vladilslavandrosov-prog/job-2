import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";
import { passport } from "./auth.js";
import { registerRoutes } from "./routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isDev = process.env.NODE_ENV === "development";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "tender-ai-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: !isDev,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

registerRoutes(app);

// JSON error handler — must be before static serving
app.use("/api", (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

if (isDev) {
  const { setupVite } = await import("./vite.js");
  await setupVite(app);
} else {
  const { serveStatic } = await import("./static.js");
  serveStatic(app);
}

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`TenderAI server running on port ${PORT} [${isDev ? "dev" : "prod"}]`);
  if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL is not set!");
  }
});
