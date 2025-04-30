import { insulinLogs, type InsulinLog, type InsertInsulinLog, users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (for future expansion)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Insulin log operations
  getAllInsulinLogs(): Promise<InsulinLog[]>;
  getInsulinLog(id: number): Promise<InsulinLog | undefined>;
  createInsulinLog(log: InsertInsulinLog): Promise<InsulinLog>;
  deleteInsulinLog(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Insulin log operations
  async getAllInsulinLogs(): Promise<InsulinLog[]> {
    return await db
      .select()
      .from(insulinLogs)
      .orderBy(desc(insulinLogs.timestamp));
  }

  async getInsulinLog(id: number): Promise<InsulinLog | undefined> {
    const [log] = await db
      .select()
      .from(insulinLogs)
      .where(eq(insulinLogs.id, id));
    return log || undefined;
  }

  async createInsulinLog(insertLog: InsertInsulinLog): Promise<InsulinLog> {
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
}

export const storage = new DatabaseStorage();
