import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool, db } from "./db.js";
import { passport } from "./auth.js";
import { registerRoutes } from "./routes.js";
import { sql } from "drizzle-orm";
import { users, tenders } from "../shared/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isDev = process.env.NODE_ENV === "development";

async function runMigrations() {
  console.log("Running migrations...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tenders (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      customer TEXT NOT NULL,
      budget TEXT,
      deadline TIMESTAMP,
      category TEXT NOT NULL,
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      ai_score INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS saved_tenders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tender_id INTEGER NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, tender_id)
    )
  `);
  console.log("Migrations complete.");
}

async function runSeed() {
  // Demo user
  const [existing] = await db.select().from(users).where(eq(users.username, "demo"));
  if (!existing) {
    const password = await bcrypt.hash("demo123", 10);
    await db.insert(users).values({ username: "demo", email: "demo@tenderai.ru", password, plan: "pro" });
    console.log("Demo user created: login=demo password=demo123");
  }

  // Sample tenders
  const count = await db.select().from(tenders);
  if (count.length === 0) {
    await db.insert(tenders).values([
      { title: "Разработка системы управления тендерами", description: "Требуется разработать веб-систему для автоматизации государственных закупок с интеграцией с ЕИС.", customer: "Минфин РФ", budget: "15 000 000 ₽", deadline: new Date("2024-09-30"), category: "development", platform: "zakupki.gov.ru", url: "https://zakupki.gov.ru/tender/123456", status: "active", aiScore: 92 },
      { title: "Создание корпоративного портала на базе SharePoint", description: "Внедрение и настройка корпоративного портала на базе Microsoft SharePoint для холдинговой компании.", customer: "ПАО Газпром", budget: "8 500 000 ₽", deadline: new Date("2024-08-15"), category: "development", platform: "sberbank-ast.ru", url: "https://sberbank-ast.ru/tender/78901", status: "active", aiScore: 87 },
      { title: "Поставка серверного оборудования HPE ProLiant", description: "Поставка серверов HPE ProLiant, СХД и сетевого оборудования Cisco для модернизации дата-центра.", customer: "ФНС России", budget: "25 000 000 ₽", deadline: new Date("2024-07-31"), category: "hardware", platform: "roseltorg.ru", url: "https://roseltorg.ru/tender/45678", status: "active", aiScore: 78 },
      { title: "Разработка мобильного приложения для HR", description: "Создание кроссплатформенного мобильного приложения для iOS и Android для автоматизации HR-процессов.", customer: "ВТБ Банк", budget: "5 200 000 ₽", deadline: new Date("2024-10-01"), category: "mobile", platform: "tender.vtb.ru", url: "https://tender.vtb.ru/mobile/1234", status: "active", aiScore: 95 },
      { title: "Техническое обслуживание ИТ-инфраструктуры", description: "Оказание услуг технического обслуживания серверного и сетевого оборудования по всей России.", customer: "РЖД", budget: "12 000 000 ₽", deadline: new Date("2024-11-30"), category: "support", platform: "zakupki.gov.ru", url: "https://zakupki.gov.ru/tender/789012", status: "active", aiScore: 82 },
      { title: "Внедрение системы информационной безопасности", description: "Поставка, установка и настройка SIEM, DLP, антивирусной защиты.", customer: "Сбербанк", budget: "18 700 000 ₽", deadline: new Date("2024-09-15"), category: "security", platform: "sberbank-ast.ru", url: "https://sberbank-ast.ru/security/56789", status: "active", aiScore: 89 },
      { title: "Разработка AI-платформы для анализа данных", description: "Создание платформы на базе ML для анализа и прогнозирования финансовых данных.", customer: "Альфа-Банк", budget: "22 000 000 ₽", deadline: new Date("2024-12-01"), category: "ai", platform: "zakupki.gov.ru", url: "https://zakupki.gov.ru/ai/901234", status: "active", aiScore: 97 },
      { title: "Интеграция 1С с системами ЭДО", description: "Разработка интеграционных решений для связи 1С:Предприятие 8.3 с системами ЭДО и банк-клиентами.", customer: "Ростелеком", budget: "3 800 000 ₽", deadline: new Date("2024-08-30"), category: "integration", platform: "roseltorg.ru", url: "https://roseltorg.ru/erp/234567", status: "active", aiScore: 74 },
    ]);
    console.log("Sample tenders seeded.");
  }
}

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

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

await runMigrations();
await runSeed();

app.listen(PORT, () => {
  console.log(`TenderAI running on port ${PORT} [${isDev ? "dev" : "prod"}]`);
});
