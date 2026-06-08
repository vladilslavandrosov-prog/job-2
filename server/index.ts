import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";
import { passport } from "./auth.js";
import { registerRoutes } from "./routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

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
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

registerRoutes(app);

if (process.env.NODE_ENV === "production") {
  const { serveStatic } = await import("./static.js");
  serveStatic(app);
} else {
  const { setupVite } = await import("./vite.js");
  await setupVite(app);
}

app.listen(PORT, () => {
  console.log(`TenderAI server running on port ${PORT}`);
});
