import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for meal types
export const mealTypeEnum = z.enum(["first", "other", "bedtime"]);
export type MealType = z.infer<typeof mealTypeEnum>;

// InsulinLog table schema
export const insulinLogs = pgTable("insulin_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  mealType: text("meal_type").notNull(),
  carbValue: numeric("carb_value"),  // Null for bedtime
  bgValue: numeric("bg_value").notNull(),  // Blood glucose in mmol/L
  bgMgdl: numeric("bg_mgdl").notNull(),  // Blood glucose in mg/dL
  mealInsulin: numeric("meal_insulin").notNull(),
  correctionInsulin: numeric("correction_insulin").notNull(),
  totalInsulin: numeric("total_insulin").notNull(),
});

export const insertInsulinLogSchema = createInsertSchema(insulinLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertInsulinLog = z.infer<typeof insertInsulinLogSchema>;
export type InsulinLog = typeof insulinLogs.$inferSelect;

// Schema for correction chart ranges
export const correctionRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  correction: z.number(),
});

export type CorrectionRange = z.infer<typeof correctionRangeSchema>;

// Users table for future expansion if needed
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
