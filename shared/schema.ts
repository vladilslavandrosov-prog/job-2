import { pgTable, text, integer, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  customer: text("customer").notNull(),
  budget: text("budget"),
  deadline: timestamp("deadline"),
  category: text("category").notNull(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  status: text("status").notNull().default("active"),
  aiScore: integer("ai_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedTenders = pgTable("saved_tenders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tenderId: integer("tender_id").notNull().references(() => tenders.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Профиль компетенций пользователя (наши возможности)
export const competencyProfiles = pgTable("competency_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  competencies: jsonb("competencies").notNull().default("[]"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Требования тендера по компетенциям (из AI-анализа)
export const tenderCompetencies = pgTable("tender_competencies", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id").notNull().references(() => tenders.id).unique(),
  competencies: jsonb("competencies").notNull().default("[]"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(1, "Password required"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type User = typeof users.$inferSelect;
export type Tender = typeof tenders.$inferSelect;
export type SavedTender = typeof savedTenders.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertTender = typeof tenders.$inferInsert;

// Типы для компетенций
export interface CompetencyItem {
  name: string;
  direction: string;
  experienceLevel: number; // 0-5
  proficiencyLevel: number; // 0-5
}

export interface TenderCompetencyItem extends CompetencyItem {
  isRequired: boolean;
  comment?: string;
}

// Каталог компетенций
export const COMPETENCY_CATALOG = [
  { name: "Python",        direction: "Backend" },
  { name: "Java",          direction: "Backend" },
  { name: ".NET (C#)",     direction: "Backend" },
  { name: "Go",            direction: "Backend" },
  { name: "Node.js",       direction: "Backend" },
  { name: "React",         direction: "Frontend" },
  { name: "Vue",           direction: "Frontend" },
  { name: "TypeScript",    direction: "Frontend" },
  { name: "PostgreSQL",    direction: "Базы данных" },
  { name: "Oracle",        direction: "Базы данных" },
  { name: "MS SQL",        direction: "Базы данных" },
  { name: "MongoDB",       direction: "Базы данных" },
  { name: "iOS (Swift)",   direction: "Мобильная разработка" },
  { name: "Android",       direction: "Мобильная разработка" },
  { name: "Flutter",       direction: "Мобильная разработка" },
  { name: "Docker",        direction: "DevOps" },
  { name: "Kubernetes",    direction: "DevOps" },
  { name: "CI/CD",         direction: "DevOps" },
  { name: "Machine Learning", direction: "AI / ML" },
  { name: "NLP",           direction: "AI / ML" },
  { name: "1С",            direction: "Интеграции" },
  { name: "Bitrix24",      direction: "Интеграции" },
  { name: "REST API",      direction: "Интеграции" },
  { name: "Бизнес-анализ", direction: "Аналитика" },
  { name: "QA (ручное)",   direction: "Тестирование" },
  { name: "QA (авто)",     direction: "Тестирование" },
] as const;

export const EXPERIENCE_LABELS = ["Нет", "< 1 года", "1–3 года", "3–5 лет", "5–10 лет", "10+ лет"];
export const PROFICIENCY_LABELS = ["Нет", "Базовый", "Средний", "Уверенный", "Продвинутый", "Эксперт"];
