import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
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
