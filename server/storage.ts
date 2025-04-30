import { insulinLogs, type InsulinLog, type InsertInsulinLog, users, type User, type InsertUser } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private insulinLogs: Map<number, InsulinLog>;
  private userCurrentId: number;
  private logCurrentId: number;

  constructor() {
    this.users = new Map();
    this.insulinLogs = new Map();
    this.userCurrentId = 1;
    this.logCurrentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Insulin log operations
  async getAllInsulinLogs(): Promise<InsulinLog[]> {
    return Array.from(this.insulinLogs.values())
      .sort((a, b) => {
        // Sort by timestamp descending (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }

  async getInsulinLog(id: number): Promise<InsulinLog | undefined> {
    return this.insulinLogs.get(id);
  }

  async createInsulinLog(insertLog: InsertInsulinLog): Promise<InsulinLog> {
    const id = this.logCurrentId++;
    const timestamp = new Date();
    const log: InsulinLog = { ...insertLog, id, timestamp };
    this.insulinLogs.set(id, log);
    return log;
  }

  async deleteInsulinLog(id: number): Promise<boolean> {
    return this.insulinLogs.delete(id);
  }
}

export const storage = new MemStorage();
