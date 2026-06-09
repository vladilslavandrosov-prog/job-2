import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool, db } from "./db.js";
import { passport } from "./auth.js";
import { registerRoutes } from "./routes.js";
import { sql } from "drizzle-orm";
import { users, tenders, competencyProfiles, tenderCompetencies } from "../shared/schema.js";
import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";

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
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS competency_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      competencies JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tender_competencies (
      id SERIAL PRIMARY KEY,
      tender_id INTEGER NOT NULL REFERENCES tenders(id) ON DELETE CASCADE UNIQUE,
      competencies JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("Migrations complete.");
}

async function runSeed() {
  // Demo user
  let demoUser: any;
  const [existing] = await db.select().from(users).where(eq(users.username, "demo"));
  if (!existing) {
    const password = await bcrypt.hash("demo123", 10);
    const [created] = await db.insert(users).values({ username: "demo", email: "demo@tenderai.ru", password, plan: "pro" }).returning();
    demoUser = created;
    console.log("Demo user created: login=demo password=demo123");
  } else {
    demoUser = existing;
  }

  // Demo competency profile — «Разработка ПО» направление, сильный backend
  const [existingProfile] = await db.select().from(competencyProfiles).where(eq(competencyProfiles.userId, demoUser.id));
  if (!existingProfile) {
    await db.insert(competencyProfiles).values({
      userId: demoUser.id,
      competencies: [
        { name: "Python",        direction: "Backend",               experienceLevel: 4, proficiencyLevel: 4 },
        { name: "Node.js",       direction: "Backend",               experienceLevel: 3, proficiencyLevel: 3 },
        { name: "Java",          direction: "Backend",               experienceLevel: 2, proficiencyLevel: 2 },
        { name: ".NET (C#)",     direction: "Backend",               experienceLevel: 1, proficiencyLevel: 1 },
        { name: "Go",            direction: "Backend",               experienceLevel: 1, proficiencyLevel: 1 },
        { name: "React",         direction: "Frontend",              experienceLevel: 4, proficiencyLevel: 3 },
        { name: "TypeScript",    direction: "Frontend",              experienceLevel: 3, proficiencyLevel: 3 },
        { name: "Vue",           direction: "Frontend",              experienceLevel: 2, proficiencyLevel: 2 },
        { name: "PostgreSQL",    direction: "Базы данных",           experienceLevel: 4, proficiencyLevel: 4 },
        { name: "MongoDB",       direction: "Базы данных",           experienceLevel: 3, proficiencyLevel: 3 },
        { name: "MS SQL",        direction: "Базы данных",           experienceLevel: 2, proficiencyLevel: 2 },
        { name: "Oracle",        direction: "Базы данных",           experienceLevel: 1, proficiencyLevel: 1 },
        { name: "Docker",        direction: "DevOps",                experienceLevel: 4, proficiencyLevel: 3 },
        { name: "Kubernetes",    direction: "DevOps",                experienceLevel: 2, proficiencyLevel: 2 },
        { name: "CI/CD",         direction: "DevOps",                experienceLevel: 3, proficiencyLevel: 3 },
        { name: "Machine Learning", direction: "AI / ML",           experienceLevel: 3, proficiencyLevel: 3 },
        { name: "NLP",           direction: "AI / ML",               experienceLevel: 2, proficiencyLevel: 2 },
        { name: "REST API",      direction: "Интеграции",            experienceLevel: 5, proficiencyLevel: 4 },
        { name: "1С",            direction: "Интеграции",            experienceLevel: 0, proficiencyLevel: 0 },
        { name: "Bitrix24",      direction: "Интеграции",            experienceLevel: 1, proficiencyLevel: 1 },
        { name: "Flutter",       direction: "Мобильная разработка",  experienceLevel: 1, proficiencyLevel: 1 },
        { name: "iOS (Swift)",   direction: "Мобильная разработка",  experienceLevel: 0, proficiencyLevel: 0 },
        { name: "Android",       direction: "Мобильная разработка",  experienceLevel: 1, proficiencyLevel: 1 },
        { name: "QA (авто)",     direction: "Тестирование",          experienceLevel: 2, proficiencyLevel: 2 },
        { name: "Бизнес-анализ", direction: "Аналитика",             experienceLevel: 2, proficiencyLevel: 2 },
      ],
    });
    console.log("Demo competency profile created.");
  }

  // 10 Dev tenders — вставляем если ещё нет по URL
  const devTenderUrls = [
    "https://zakupki.gov.ru/tender/100001",
    "https://sberbank-ast.ru/tender/100002",
    "https://zakupki.gov.ru/tender/100003",
    "https://sberbank-ast.ru/tender/100004",
    "https://roseltorg.ru/tender/100005",
    "https://zakupki.gov.ru/tender/100006",
    "https://roseltorg.ru/tender/100007",
    "https://sberbank-ast.ru/tender/100008",
    "https://zakupki.gov.ru/tender/100009",
    "https://sberbank-ast.ru/tender/100010",
  ];

  const existing10 = await db.select().from(tenders).where(inArray(tenders.url, devTenderUrls));
  if (existing10.length === 0) {
    const inserted = await db.insert(tenders).values([
      // 1. Идеальное совпадение — Python+React+PostgreSQL+Docker
      { title: "Разработка веб-платформы государственных закупок", description: "Разработка высоконагруженной веб-системы для автоматизации государственных закупок. Требуется опытная команда full-stack разработчиков с глубокими знаниями Python, React и PostgreSQL. Обязательна контейнеризация в Docker.", customer: "Минфин РФ", budget: "15 000 000 ₽", deadline: new Date("2026-09-30"), category: "development", platform: "zakupki.gov.ru", url: "https://zakupki.gov.ru/tender/100001", status: "active", aiScore: 95 },
      // 2. Хорошее совпадение — Node.js+React+MongoDB+CI/CD
      { title: "Создание SaaS-платформы управления персоналом", description: "Разработка облачной HR-платформы с микросервисной архитектурой. Стек: Node.js backend, React frontend, MongoDB для хранения данных, CI/CD через GitLab.", customer: "ВТБ Банк", budget: "9 500 000 ₽", deadline: new Date("2026-08-15"), category: "development", platform: "sberbank-ast.ru", url: "https://sberbank-ast.ru/tender/100002", status: "active", aiScore: 88 },
      // 3. Среднее совпадение — Python+ML+NLP — есть, но NLP слабее
      { title: "Разработка AI-системы анализа договоров", description: "Создание интеллектуальной системы автоматического анализа и классификации договоров с применением NLP и ML. Основной язык — Python. Требуется глубокая экспертиза в обработке естественного языка.", customer: "Альфа-Банк", budget: "22 000 000 ₽", deadline: new Date("2026-12-01"), category: "ai", platform: "zakupki.gov.ru", url: "https://zakupki.gov.ru/tender/100003", status: "active", aiScore: 82 },
      // 4. Частичное совпадение — Java+Oracle+MS SQL — Oracle у нас слабый
      { title: "Модернизация банковской АБС на Java", description: "Рефакторинг и расширение функциональности автоматизированной банковской системы. Требуется Senior Java-разработчик с экспертизой в Oracle Database и опытом работы с legacy-системами на MS SQL.", customer: "Сбербанк", budget: "18 000 000 ₽", deadline: new Date("2026-10-20"), category: "development", platform: "sberbank-ast.ru", url: "https://sberbank-ast.ru/tender/100004", status: "active", aiScore: 71 },
      // 5. Мобильная разработка — Flutter+Android — у нас слабо
      { title: "Мобильное приложение для курьерской службы", description: "Разработка кроссплатформенного мобильного приложения для курьеров и диспетчеров. Основной стек: Flutter для кроссплатформы, native Android на Kotlin. Требуется опыт интеграции с GPS и картографическими сервисами.", customer: "СДЭК", budget: "6 800 000 ₽", deadline: new Date("2026-11-01"), category: "mobile", platform: "roseltorg.ru", url: "https://roseltorg.ru/tender/100005", status: "active", aiScore: 55 },
      // 6. DevOps — Kubernetes+Docker+CI/CD — Docker+CI/CD хорошо, Kubernetes средне
      { title: "Построение DevOps-платформы для микросервисов", description: "Проектирование и внедрение DevOps-платформы: оркестрация Kubernetes, GitLab CI/CD, мониторинг Prometheus+Grafana, управление конфигурациями через Helm. Обязателен опыт production Kubernetes от 3 лет.", customer: "Ростелеком", budget: "11 200 000 ₽", deadline: new Date("2026-09-10"), category: "development", platform: "zakupki.gov.ru", url: "https://zakupki.gov.ru/tender/100006", status: "active", aiScore: 76 },
      // 7. Полный разрыв — 1С+Oracle — у нас нет
      { title: "Разработка конфигурации 1С:ERP для металлургии", description: "Разработка и внедрение кастомной конфигурации 1С:ERP 2.5 для металлургического предприятия. Требуется эксперт 1С с опытом интеграции с Oracle EBS. Обязателен опыт в отрасли.", customer: "НЛМК", budget: "14 500 000 ₽", deadline: new Date("2026-08-30"), category: "integration", platform: "roseltorg.ru", url: "https://roseltorg.ru/tender/100007", status: "active", aiScore: 28 },
      // 8. Full-stack — React+TypeScript+Node.js+PostgreSQL — сильное совпадение
      { title: "Платформа управления строительными проектами", description: "Разработка веб-приложения для управления строительными проектами. Full-stack: React+TypeScript на фронтенде, Node.js+Express на бекенде, PostgreSQL. Интеграция с внешними API через REST.", customer: "ГК Самолёт", budget: "7 300 000 ₽", deadline: new Date("2026-10-05"), category: "development", platform: "sberbank-ast.ru", url: "https://sberbank-ast.ru/tender/100008", status: "active", aiScore: 91 },
      // 9. Go+Kubernetes+PostgreSQL — Go у нас слабый
      { title: "Высоконагруженный backend для финтех-стартапа", description: "Разработка backend-сервисов для платёжной платформы. Требования: Go (Golang) для highload-сервисов, Kubernetes для оркестрации, PostgreSQL. Нагрузка — 100k RPS. Обязателен опыт Go от 3 лет.", customer: "Т-Банк", budget: "19 000 000 ₽", deadline: new Date("2026-11-15"), category: "development", platform: "zakupki.gov.ru", url: "https://zakupki.gov.ru/tender/100009", status: "active", aiScore: 63 },
      // 10. QA+Python+REST API — хорошее совпадение
      { title: "Автоматизация тестирования API банковских сервисов", description: "Разработка фреймворка автоматизированного тестирования REST API. Требования: Python (pytest, requests), опыт тестирования микросервисов, работа с Swagger/OpenAPI, CI/CD интеграция.", customer: "ПСБ Банк", budget: "4 100 000 ₽", deadline: new Date("2026-09-25"), category: "development", platform: "sberbank-ast.ru", url: "https://sberbank-ast.ru/tender/100010", status: "active", aiScore: 84 },
    ]).returning();

    // Компетенции для каждого тендера
    const competencyData = [
      // 1. Минфин — идеальное совпадение
      { idx: 0, competencies: [
        { name: "Python",     direction: "Backend",      experienceLevel: 4, proficiencyLevel: 4, isRequired: true, comment: "Основной язык backend" },
        { name: "React",      direction: "Frontend",     experienceLevel: 3, proficiencyLevel: 3, isRequired: true, comment: "SPA интерфейс" },
        { name: "PostgreSQL", direction: "Базы данных",  experienceLevel: 4, proficiencyLevel: 3, isRequired: true, comment: "Основная СУБД" },
        { name: "Docker",     direction: "DevOps",       experienceLevel: 3, proficiencyLevel: 3, isRequired: true, comment: "Контейнеризация" },
        { name: "REST API",   direction: "Интеграции",   experienceLevel: 4, proficiencyLevel: 3, isRequired: true, comment: "Интеграция с ЕИС" },
      ]},
      // 2. ВТБ — хорошее
      { idx: 1, competencies: [
        { name: "Node.js",    direction: "Backend",      experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "React",      direction: "Frontend",     experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "TypeScript", direction: "Frontend",     experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "MongoDB",    direction: "Базы данных",  experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "CI/CD",      direction: "DevOps",       experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "Docker",     direction: "DevOps",       experienceLevel: 3, proficiencyLevel: 2, isRequired: false },
      ]},
      // 3. Альфа-Банк — AI, среднее
      { idx: 2, competencies: [
        { name: "Python",          direction: "Backend",  experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Machine Learning",direction: "AI / ML",  experienceLevel: 4, proficiencyLevel: 4, isRequired: true, comment: "Обязательно" },
        { name: "NLP",             direction: "AI / ML",  experienceLevel: 4, proficiencyLevel: 4, isRequired: true, comment: "Ключевая компетенция" },
        { name: "PostgreSQL",      direction: "Базы данных", experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
      ]},
      // 4. Сбербанк — банковская АБС, частичное
      { idx: 3, competencies: [
        { name: "Java",    direction: "Backend",      experienceLevel: 4, proficiencyLevel: 4, isRequired: true, comment: "Senior уровень" },
        { name: "Oracle",  direction: "Базы данных",  experienceLevel: 4, proficiencyLevel: 4, isRequired: true, comment: "Экспертиза обязательна" },
        { name: "MS SQL",  direction: "Базы данных",  experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
        { name: "REST API",direction: "Интеграции",   experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
      ]},
      // 5. СДЭК — мобильная, слабое совпадение
      { idx: 4, competencies: [
        { name: "Flutter",  direction: "Мобильная разработка", experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Android",  direction: "Мобильная разработка", experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "REST API", direction: "Интеграции",            experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "PostgreSQL",direction: "Базы данных",          experienceLevel: 2, proficiencyLevel: 2, isRequired: false },
      ]},
      // 6. Ростелеком — DevOps, среднее
      { idx: 5, competencies: [
        { name: "Kubernetes", direction: "DevOps",      experienceLevel: 4, proficiencyLevel: 4, isRequired: true, comment: "Production опыт от 3 лет" },
        { name: "Docker",     direction: "DevOps",      experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "CI/CD",      direction: "DevOps",      experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Python",     direction: "Backend",     experienceLevel: 2, proficiencyLevel: 2, isRequired: false, comment: "Для скриптов" },
      ]},
      // 7. НЛМК — 1С+Oracle, полный разрыв
      { idx: 6, competencies: [
        { name: "1С",      direction: "Интеграции",    experienceLevel: 5, proficiencyLevel: 5, isRequired: true, comment: "Эксперт 1С:ERP" },
        { name: "Oracle",  direction: "Базы данных",   experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "MS SQL",  direction: "Базы данных",   experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
      ]},
      // 8. ГК Самолёт — full-stack, сильное
      { idx: 7, competencies: [
        { name: "React",      direction: "Frontend",    experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "TypeScript", direction: "Frontend",    experienceLevel: 4, proficiencyLevel: 3, isRequired: true },
        { name: "Node.js",    direction: "Backend",     experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "PostgreSQL", direction: "Базы данных", experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "REST API",   direction: "Интеграции",  experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Docker",     direction: "DevOps",      experienceLevel: 2, proficiencyLevel: 2, isRequired: false },
      ]},
      // 9. Т-Банк — Go, частичное
      { idx: 8, competencies: [
        { name: "Go",         direction: "Backend",     experienceLevel: 4, proficiencyLevel: 4, isRequired: true, comment: "Обязательно от 3 лет" },
        { name: "Kubernetes", direction: "DevOps",      experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "PostgreSQL", direction: "Базы данных", experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "Docker",     direction: "DevOps",      experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
      ]},
      // 10. ПСБ — QA + Python, хорошее
      { idx: 9, competencies: [
        { name: "QA (авто)",  direction: "Тестирование", experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "Python",     direction: "Backend",      experienceLevel: 3, proficiencyLevel: 3, isRequired: true, comment: "pytest, requests" },
        { name: "REST API",   direction: "Интеграции",   experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "CI/CD",      direction: "DevOps",       experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
      ]},
    ];

    for (const { idx, competencies } of competencyData) {
      await db.insert(tenderCompetencies).values({
        tenderId: inserted[idx].id,
        competencies,
      });
    }
    console.log("Sample tenders and competencies seeded.");
  } else {
    // Тендеры уже есть — добавить компетенции к тем, у которых их нет
    const insertedTenders = await db.select().from(tenders).where(inArray(tenders.url, devTenderUrls));
    const tenderMap = new Map(insertedTenders.map((t) => [t.url, t.id]));

    const competencyDataByUrl: { url: string; competencies: any[] }[] = [
      { url: "https://zakupki.gov.ru/tender/100001", competencies: [
        { name: "Python",     direction: "Backend",      experienceLevel: 4, proficiencyLevel: 4, isRequired: true, comment: "Основной язык backend" },
        { name: "React",      direction: "Frontend",     experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "PostgreSQL", direction: "Базы данных",  experienceLevel: 4, proficiencyLevel: 3, isRequired: true },
        { name: "Docker",     direction: "DevOps",       experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "REST API",   direction: "Интеграции",   experienceLevel: 4, proficiencyLevel: 3, isRequired: true },
      ]},
      { url: "https://sberbank-ast.ru/tender/100002", competencies: [
        { name: "Node.js",    direction: "Backend",      experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "React",      direction: "Frontend",     experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "TypeScript", direction: "Frontend",     experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "MongoDB",    direction: "Базы данных",  experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "CI/CD",      direction: "DevOps",       experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "Docker",     direction: "DevOps",       experienceLevel: 3, proficiencyLevel: 2, isRequired: false },
      ]},
      { url: "https://zakupki.gov.ru/tender/100003", competencies: [
        { name: "Python",           direction: "Backend", experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Machine Learning", direction: "AI / ML", experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "NLP",              direction: "AI / ML", experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "PostgreSQL",       direction: "Базы данных", experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
      ]},
      { url: "https://sberbank-ast.ru/tender/100004", competencies: [
        { name: "Java",    direction: "Backend",      experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Oracle",  direction: "Базы данных",  experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "MS SQL",  direction: "Базы данных",  experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
        { name: "REST API",direction: "Интеграции",   experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
      ]},
      { url: "https://roseltorg.ru/tender/100005", competencies: [
        { name: "Flutter",   direction: "Мобильная разработка", experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Android",   direction: "Мобильная разработка", experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "REST API",  direction: "Интеграции",            experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "PostgreSQL",direction: "Базы данных",           experienceLevel: 2, proficiencyLevel: 2, isRequired: false },
      ]},
      { url: "https://zakupki.gov.ru/tender/100006", competencies: [
        { name: "Kubernetes", direction: "DevOps", experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Docker",     direction: "DevOps", experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "CI/CD",      direction: "DevOps", experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Python",     direction: "Backend", experienceLevel: 2, proficiencyLevel: 2, isRequired: false },
      ]},
      { url: "https://roseltorg.ru/tender/100007", competencies: [
        { name: "1С",     direction: "Интеграции",   experienceLevel: 5, proficiencyLevel: 5, isRequired: true },
        { name: "Oracle", direction: "Базы данных",  experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "MS SQL", direction: "Базы данных",  experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
      ]},
      { url: "https://sberbank-ast.ru/tender/100008", competencies: [
        { name: "React",      direction: "Frontend",    experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "TypeScript", direction: "Frontend",    experienceLevel: 4, proficiencyLevel: 3, isRequired: true },
        { name: "Node.js",    direction: "Backend",     experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "PostgreSQL", direction: "Базы данных", experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "REST API",   direction: "Интеграции",  experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Docker",     direction: "DevOps",      experienceLevel: 2, proficiencyLevel: 2, isRequired: false },
      ]},
      { url: "https://zakupki.gov.ru/tender/100009", competencies: [
        { name: "Go",         direction: "Backend",     experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "Kubernetes", direction: "DevOps",      experienceLevel: 4, proficiencyLevel: 4, isRequired: true },
        { name: "PostgreSQL", direction: "Базы данных", experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "Docker",     direction: "DevOps",      experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
      ]},
      { url: "https://sberbank-ast.ru/tender/100010", competencies: [
        { name: "QA (авто)", direction: "Тестирование", experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "Python",    direction: "Backend",       experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "REST API",  direction: "Интеграции",    experienceLevel: 3, proficiencyLevel: 3, isRequired: true },
        { name: "CI/CD",     direction: "DevOps",        experienceLevel: 3, proficiencyLevel: 3, isRequired: false },
      ]},
    ];

    for (const { url, competencies } of competencyDataByUrl) {
      const tenderId = tenderMap.get(url);
      if (!tenderId) continue;
      const [existing] = await db.select().from(tenderCompetencies).where(eq(tenderCompetencies.tenderId, tenderId));
      if (!existing) {
        await db.insert(tenderCompetencies).values({ tenderId, competencies });
      }
    }
    console.log("Competencies backfilled for existing dev tenders.");
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
