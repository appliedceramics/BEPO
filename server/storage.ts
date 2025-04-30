import { 
  insulinLogs, 
  type InsulinLog, 
  type InsertInsulinLog, 
  users, 
  type User, 
  type InsertUser,
  profiles,
  type Profile,
  type InsertProfile
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull } from "drizzle-orm";
import session from "express-session";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Profile operations
  getProfile(id: number): Promise<Profile | undefined>;
  getProfileByUserId(userId: number): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile & { userId: number }): Promise<Profile>;
  updateProfile(id: number, profile: Partial<InsertProfile> & { userId?: number }): Promise<Profile>;
  
  // Insulin log operations
  getAllInsulinLogs(): Promise<InsulinLog[]>;
  getUserInsulinLogs(userId: number): Promise<InsulinLog[]>;
  getInsulinLog(id: number): Promise<InsulinLog | undefined>;
  createInsulinLog(log: InsertInsulinLog & { userId?: number }): Promise<InsulinLog>;
  deleteInsulinLog(id: number): Promise<boolean>;
  
  // Session store for auth
  sessionStore: session.SessionStore;
}

// Import PostgreSQL session store
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool, 
      createTableIfMissing: true,
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Profile operations
  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile || undefined;
  }
  
  async getProfileByUserId(userId: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile || undefined;
  }
  
  async createProfile(profile: InsertProfile & { userId: number }): Promise<Profile> {
    const [newProfile] = await db
      .insert(profiles)
      .values(profile)
      .returning();
    return newProfile;
  }
  
  async updateProfile(id: number, profile: Partial<InsertProfile> & { userId?: number }): Promise<Profile> {
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();
    return updatedProfile;
  }

  // Insulin log operations
  async getAllInsulinLogs(): Promise<InsulinLog[]> {
    return await db
      .select()
      .from(insulinLogs)
      .orderBy(desc(insulinLogs.timestamp));
  }
  
  async getUserInsulinLogs(userId: number): Promise<InsulinLog[]> {
    return await db
      .select()
      .from(insulinLogs)
      .where(eq(insulinLogs.userId, userId))
      .orderBy(desc(insulinLogs.timestamp));
  }

  async getInsulinLog(id: number): Promise<InsulinLog | undefined> {
    const [log] = await db
      .select()
      .from(insulinLogs)
      .where(eq(insulinLogs.id, id));
    return log || undefined;
  }

  async createInsulinLog(insertLog: InsertInsulinLog & { userId?: number }): Promise<InsulinLog> {
    const [log] = await db
      .insert(insulinLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async deleteInsulinLog(id: number): Promise<boolean> {
    const result = await db
      .delete(insulinLogs)
      .where(eq(insulinLogs.id, id))
      .returning({ id: insulinLogs.id });
    
    return result.length > 0;
  }
  
  // SMS notification methods
  async markLogAsShared(id: number): Promise<boolean> {
    const result = await db
      .update(insulinLogs)
      .set({ shared: true })
      .where(eq(insulinLogs.id, id))
      .returning({ id: insulinLogs.id });
    
    return result.length > 0;
  }
  
  async getUnsharedLogs(userId: number): Promise<InsulinLog[]> {
    return await db
      .select()
      .from(insulinLogs)
      .where(
        and(
          eq(insulinLogs.userId, userId),
          eq(insulinLogs.shared, false)
        )
      )
      .orderBy(desc(insulinLogs.timestamp));
  }
}

export const storage = new DatabaseStorage();
