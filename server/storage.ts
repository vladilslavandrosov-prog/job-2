import { db } from "./db.js";
import { users, tenders, savedTenders, competencyProfiles, tenderCompetencies } from "../shared/schema.js";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import type { InsertUser, InsertTender } from "../shared/schema.js";

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByUsername(username: string) {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function createUser(data: InsertUser) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function updateUserPlan(userId: number, plan: string) {
  const [user] = await db.update(users).set({ plan }).where(eq(users.id, userId)).returning();
  return user;
}

export async function getTenders(filters?: {
  category?: string;
  platform?: string;
  search?: string;
  status?: string;
}) {
  const conditions: any[] = [];

  if (filters?.category && filters.category !== "all") {
    conditions.push(eq(tenders.category, filters.category));
  }
  if (filters?.platform && filters.platform !== "all") {
    conditions.push(eq(tenders.platform, filters.platform));
  }
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(tenders.status, filters.status));
  }
  if (filters?.search) {
    conditions.push(
      or(
        ilike(tenders.title, `%${filters.search}%`),
        ilike(tenders.description, `%${filters.search}%`),
        ilike(tenders.customer, `%${filters.search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    return db.select().from(tenders).where(and(...conditions)).orderBy(desc(tenders.createdAt));
  }
  return db.select().from(tenders).orderBy(desc(tenders.createdAt));
}

export async function getTenderById(id: number) {
  const [tender] = await db.select().from(tenders).where(eq(tenders.id, id));
  return tender;
}

export async function createTender(data: InsertTender) {
  const [tender] = await db.insert(tenders).values(data).returning();
  return tender;
}

export async function getSavedTenders(userId: number) {
  return db
    .select({ tender: tenders })
    .from(savedTenders)
    .innerJoin(tenders, eq(savedTenders.tenderId, tenders.id))
    .where(eq(savedTenders.userId, userId))
    .orderBy(desc(savedTenders.createdAt));
}

export async function saveTender(userId: number, tenderId: number) {
  const [saved] = await db.insert(savedTenders).values({ userId, tenderId }).returning();
  return saved;
}

export async function unsaveTender(userId: number, tenderId: number) {
  await db
    .delete(savedTenders)
    .where(and(eq(savedTenders.userId, userId), eq(savedTenders.tenderId, tenderId)));
}

export async function isTenderSaved(userId: number, tenderId: number) {
  const [saved] = await db
    .select()
    .from(savedTenders)
    .where(and(eq(savedTenders.userId, userId), eq(savedTenders.tenderId, tenderId)));
  return !!saved;
}

export async function getCompetencyProfile(userId: number) {
  const [profile] = await db.select().from(competencyProfiles).where(eq(competencyProfiles.userId, userId));
  return profile;
}

export async function upsertCompetencyProfile(userId: number, competencies: any[]) {
  const existing = await getCompetencyProfile(userId);
  if (existing) {
    const [updated] = await db.update(competencyProfiles)
      .set({ competencies, updatedAt: new Date() })
      .where(eq(competencyProfiles.userId, userId))
      .returning();
    return updated;
  }
  const [created] = await db.insert(competencyProfiles).values({ userId, competencies }).returning();
  return created;
}

export async function getTenderCompetencies(tenderId: number) {
  const [tc] = await db.select().from(tenderCompetencies).where(eq(tenderCompetencies.tenderId, tenderId));
  return tc;
}
