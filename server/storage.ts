import { 
  insulinLogs, 
  type InsulinLog, 
  type InsertInsulinLog, 
  users, 
  type User, 
  type InsertUser,
  profiles,
  type Profile,
  type InsertProfile,
  mealPresets,
  type MealPreset,
  type InsertMealPreset,
  milestones,
  type Milestone,
  type InsertMilestone,
  achievements,
  type Achievement,
  type InsertAchievement
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
  markLogAsShared(id: number): Promise<boolean>;
  getUnsharedLogs(userId: number): Promise<InsulinLog[]>;
  
  // Meal preset operations
  getUserMealPresets(userId: number): Promise<MealPreset[]>;
  getMealPreset(id: number): Promise<MealPreset | undefined>;
  createMealPreset(preset: InsertMealPreset & { userId: number }): Promise<MealPreset>;
  updateMealPreset(id: number, preset: Partial<InsertMealPreset>): Promise<MealPreset>;
  deleteMealPreset(id: number): Promise<boolean>;
  
  // Milestone operations (achievements system)
  getAllMilestones(): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  
  // User achievement operations
  getUserAchievements(userId: number): Promise<(Achievement & { milestone: Milestone })[]>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  createOrUpdateAchievement(achievement: Partial<InsertAchievement>): Promise<Achievement>;
  incrementAchievementProgress(userId: number, type: string, increment?: number): Promise<Achievement | undefined>;
  checkAndCompleteAchievement(achievementId: number): Promise<Achievement | undefined>;
  
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
  
  // Milestone operations
  async getAllMilestones(): Promise<Milestone[]> {
    return await db
      .select()
      .from(milestones)
      .orderBy(milestones.requiredCount);
  }
  
  async getMilestone(id: number): Promise<Milestone | undefined> {
    const [milestone] = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, id));
    return milestone || undefined;
  }
  
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [newMilestone] = await db
      .insert(milestones)
      .values(milestone)
      .returning();
    return newMilestone;
  }
  
  // Achievement operations
  async getUserAchievements(userId: number): Promise<(Achievement & { milestone: Milestone })[]> {
    const results = await db
      .select({
        achievement: achievements,
        milestone: milestones,
      })
      .from(achievements)
      .innerJoin(milestones, eq(achievements.milestoneId, milestones.id))
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.earnedAt));
    
    return results.map(({ achievement, milestone }) => ({
      ...achievement,
      milestone,
    }));
  }
  
  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id));
    return achievement || undefined;
  }
  
  async createOrUpdateAchievement(achievement: Partial<InsertAchievement>): Promise<Achievement> {
    // Check if achievement exists
    const existingAchievements = await db
      .select()
      .from(achievements)
      .where(
        and(
          eq(achievements.userId, achievement.userId!),
          eq(achievements.milestoneId, achievement.milestoneId!)
        )
      );
    
    if (existingAchievements.length > 0) {
      // Update existing achievement
      const [updatedAchievement] = await db
        .update(achievements)
        .set(achievement)
        .where(eq(achievements.id, existingAchievements[0].id))
        .returning();
      return updatedAchievement;
    } else {
      // Create new achievement
      const [newAchievement] = await db
        .insert(achievements)
        .values(achievement as InsertAchievement)
        .returning();
      return newAchievement;
    }
  }
  
  async incrementAchievementProgress(userId: number, type: string, increment: number = 1): Promise<Achievement | undefined> {
    // Find milestone by type
    const [milestone] = await db
      .select()
      .from(milestones)
      .where(eq(milestones.type, type));
    
    if (!milestone) return undefined;
    
    // Find or create achievement for user
    const existingAchievements = await db
      .select()
      .from(achievements)
      .where(
        and(
          eq(achievements.userId, userId),
          eq(achievements.milestoneId, milestone.id)
        )
      );
    
    if (existingAchievements.length > 0) {
      // Increment existing achievement
      const achievement = existingAchievements[0];
      if (achievement.isComplete) return achievement; // Don't update completed achievements
      
      const newProgress = achievement.progress + increment;
      const isComplete = newProgress >= milestone.requiredCount;
      
      const [updatedAchievement] = await db
        .update(achievements)
        .set({
          progress: newProgress,
          isComplete,
          ...(isComplete ? { earnedAt: new Date() } : {})
        })
        .where(eq(achievements.id, achievement.id))
        .returning();
      
      return updatedAchievement;
    } else {
      // Create new achievement
      const [newAchievement] = await db
        .insert(achievements)
        .values({
          userId,
          milestoneId: milestone.id,
          progress: increment,
          isComplete: increment >= milestone.requiredCount,
          data: {}
        })
        .returning();
      
      return newAchievement;
    }
  }
  
  async checkAndCompleteAchievement(achievementId: number): Promise<Achievement | undefined> {
    // Get the achievement
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, achievementId));
    
    if (!achievement || achievement.isComplete) return achievement;
    
    // Get the milestone
    const [milestone] = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, achievement.milestoneId));
    
    if (!milestone) return achievement;
    
    // Check if the achievement should be completed
    if (achievement.progress >= milestone.requiredCount) {
      const [updatedAchievement] = await db
        .update(achievements)
        .set({
          isComplete: true,
          earnedAt: new Date()
        })
        .where(eq(achievements.id, achievementId))
        .returning();
      
      return updatedAchievement;
    }
    
    return achievement;
  }
  
  // Meal preset operations
  async getUserMealPresets(userId: number): Promise<MealPreset[]> {
    return await db
      .select()
      .from(mealPresets)
      .where(eq(mealPresets.userId, userId))
      .orderBy(desc(mealPresets.createdAt));
  }
  
  async getMealPreset(id: number): Promise<MealPreset | undefined> {
    const [preset] = await db
      .select()
      .from(mealPresets)
      .where(eq(mealPresets.id, id));
    return preset || undefined;
  }
  
  async createMealPreset(preset: InsertMealPreset & { userId: number }): Promise<MealPreset> {
    const [newPreset] = await db
      .insert(mealPresets)
      .values(preset)
      .returning();
    return newPreset;
  }
  
  async updateMealPreset(id: number, preset: Partial<InsertMealPreset>): Promise<MealPreset> {
    const [updatedPreset] = await db
      .update(mealPresets)
      .set(preset)
      .where(eq(mealPresets.id, id))
      .returning();
    return updatedPreset;
  }
  
  async deleteMealPreset(id: number): Promise<boolean> {
    const result = await db
      .delete(mealPresets)
      .where(eq(mealPresets.id, id))
      .returning({ id: mealPresets.id });
    
    return result.length > 0;
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
