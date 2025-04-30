import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum for meal types
export const mealTypeEnum = z.enum(["first", "other", "bedtime"]);
export type MealType = z.infer<typeof mealTypeEnum>;

// Enum for gender/sex
export const sexEnum = z.enum(["male", "female", "other"]);
export type Sex = z.infer<typeof sexEnum>;

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  insulinLogs: many(insulinLogs),
}));

// Authentication schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
});

// Login schema
export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Enhanced Zod schema for registration validation
export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type User = typeof users.$inferSelect;

// User profile table schema
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  sex: text("sex").notNull(),
  motherName: text("mother_name"),
  motherPhone: text("mother_phone"),
  fatherName: text("father_name"),
  fatherPhone: text("father_phone"),
  notifyParents: boolean("notify_parents").default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  userId: true,
  updatedAt: true,
});

export const updateProfileSchema = insertProfileSchema;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// InsulinLog table schema with user relationship
export const insulinLogs = pgTable("insulin_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  mealType: text("meal_type").notNull(),
  carbValue: numeric("carb_value"),  // Null for bedtime
  bgValue: numeric("bg_value").notNull(),  // Blood glucose in mmol/L
  bgMgdl: numeric("bg_mgdl").notNull(),  // Blood glucose in mg/dL
  mealInsulin: numeric("meal_insulin").notNull(),
  correctionInsulin: numeric("correction_insulin").notNull(),
  totalInsulin: numeric("total_insulin").notNull(),
  shared: boolean("shared").default(false),
});

export const insulinLogsRelations = relations(insulinLogs, ({ one }) => ({
  user: one(users, {
    fields: [insulinLogs.userId],
    references: [users.id],
  }),
}));

export const insertInsulinLogSchema = createInsertSchema(insulinLogs).omit({
  id: true,
  userId: true,
  timestamp: true,
  shared: true,
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
