import { pgTable, text, serial, integer, numeric, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum for meal types
export const mealTypeEnum = z.enum(["first", "other", "bedtime", "longActing"]);
export type MealType = z.infer<typeof mealTypeEnum>;

// Enum for gender/sex
export const sexEnum = z.enum(["male", "female"]);
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
  calculatorSettings: one(calculatorSettings),
  insulinLogs: many(insulinLogs),
  achievements: many(achievements),
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

// Define the correction chart for meals (breakfast, lunch, dinner)
export const mealCorrectionChart: CorrectionRange[] = [
  { min: 0, max: 70, correction: -0.5 },
  { min: 70, max: 100, correction: -0.5 },
  { min: 101, max: 120, correction: 0 },
  { min: 121, max: 138, correction: 0.5 },
  { min: 139, max: 155, correction: 1 },
  { min: 156, max: 173, correction: 1.5 },
  { min: 174, max: 190, correction: 2 },
  { min: 191, max: 208, correction: 2.5 },
  { min: 209, max: 225, correction: 3 },
  { min: 226, max: 243, correction: 3.5 },
  { min: 244, max: 260, correction: 4 },
  { min: 261, max: 278, correction: 4.5 },
  { min: 279, max: 295, correction: 5 },
  { min: 296, max: 313, correction: 5.5 },
  { min: 314, max: 330, correction: 6 },
  { min: 331, max: 348, correction: 6.5 },
  { min: 349, max: 365, correction: 7 },
  { min: 366, max: 383, correction: 7.5 },
  { min: 384, max: 400, correction: 8 },
  { min: 401, max: 999, correction: 8.5 } // Upper bound for extreme high values
];

// Define the correction chart for bedtime
export const bedtimeCorrectionChart: CorrectionRange[] = [
  { min: 0, max: 70, correction: -0.5 },
  { min: 70, max: 100, correction: -0.5 },
  { min: 101, max: 150, correction: 0 },   // Different from meal chart
  { min: 151, max: 168, correction: 0.5 }, // Different from meal chart
  { min: 169, max: 185, correction: 1 },   // Different from meal chart
  { min: 186, max: 203, correction: 1.5 }, // Different from meal chart
  { min: 204, max: 220, correction: 2 },   // Different from meal chart
  { min: 221, max: 238, correction: 2.5 }, // Different from meal chart
  { min: 239, max: 255, correction: 3 },   // Different from meal chart
  { min: 256, max: 273, correction: 3.5 }, // Different from meal chart
  { min: 274, max: 290, correction: 4 },   // Different from meal chart
  { min: 291, max: 308, correction: 4.5 }, // Different from meal chart
  { min: 309, max: 325, correction: 5 },   // Different from meal chart
  { min: 326, max: 343, correction: 5.5 }, // Different from meal chart
  { min: 344, max: 360, correction: 6 },   // Different from meal chart
  { min: 361, max: 378, correction: 6.5 }, // Different from meal chart
  { min: 379, max: 395, correction: 7 },   // Different from meal chart
  { min: 396, max: 413, correction: 7.5 }, // Different from meal chart
  { min: 414, max: 430, correction: 8 },   // Different from meal chart
  { min: 431, max: 999, correction: 8.5 }  // Upper bound for extreme high values
];

// Calculator Settings table schema
export const calculatorSettings = pgTable("calculator_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  firstMealRatio: numeric("first_meal_ratio").notNull().default("10"),  // Insulin to carb ratio for first meal
  otherMealRatio: numeric("other_meal_ratio").notNull().default("15"), // Insulin to carb ratio for other meals
  longActingDosage: numeric("long_acting_dosage").notNull().default("0"), // Long-acting insulin dosage for 24hr
  mealCorrectionRanges: json("meal_correction_ranges").$type<CorrectionRange[]>(),
  bedtimeCorrectionRanges: json("bedtime_correction_ranges").$type<CorrectionRange[]>(),
  targetBgMin: numeric("target_bg_min").notNull().default("4.5"),  // Target blood glucose minimum (mmol/L)
  targetBgMax: numeric("target_bg_max").notNull().default("7.0"),  // Target blood glucose maximum (mmol/L)
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const calculatorSettingsRelations = relations(calculatorSettings, ({ one }) => ({
  user: one(users, {
    fields: [calculatorSettings.userId],
    references: [users.id],
  }),
}));

export const insertCalculatorSettingsSchema = createInsertSchema(calculatorSettings).omit({
  id: true,
  userId: true,
  updatedAt: true,
});

export const updateCalculatorSettingsSchema = insertCalculatorSettingsSchema;

export type InsertCalculatorSettings = z.infer<typeof insertCalculatorSettingsSchema>;
export type UpdateCalculatorSettings = z.infer<typeof updateCalculatorSettingsSchema>;
export type CalculatorSettings = typeof calculatorSettings.$inferSelect;

// Meal Presets
export const mealPresets = pgTable("meal_presets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  carbValue: integer("carb_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealPresetsRelations = relations(mealPresets, ({ one }) => ({
  user: one(users, {
    fields: [mealPresets.userId],
    references: [users.id],
  }),
}));

export const insertMealPresetSchema = createInsertSchema(mealPresets).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertMealPreset = z.infer<typeof insertMealPresetSchema>;
export type MealPreset = typeof mealPresets.$inferSelect;

// Achievement Type enum
export const achievementTypeEnum = z.enum([
  "log_streak",       // Consecutive days logging
  "perfect_range",    // Blood glucose in target range
  "precise_carbs",    // Accurate carb counting
  "voice_input_user", // Using voice input feature
  "meal_preset_pro",  // Creating and using meal presets
  "data_sharer"       // Sharing results with parents
]);
export type AchievementType = z.infer<typeof achievementTypeEnum>;

// Milestones table - defines available achievements
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  requiredCount: integer("required_count").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
});

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

// User achievements table - tracks completed achievements by users
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  milestoneId: integer("milestone_id").notNull().references(() => milestones.id),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  progress: integer("progress").notNull().default(0),
  isComplete: boolean("is_complete").notNull().default(false),
  data: json("data").$type<Record<string, any>>(),
});

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
  milestone: one(milestones, {
    fields: [achievements.milestoneId],
    references: [milestones.id],
  }),
}));

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedAt: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
