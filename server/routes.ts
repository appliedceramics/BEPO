import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInsulinLogSchema, insertMealPresetSchema, insertMilestoneSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated, hasProfile } from "./auth";
import { notifyParents } from "./twilio";
import { getFoodCarbs, suggestMeals } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get current user's insulin logs
  app.get("/api/insulin-logs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const logs = userId 
        ? await storage.getUserInsulinLogs(userId)
        : await storage.getAllInsulinLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching insulin logs:", error);
      res.status(500).json({ message: "Failed to fetch insulin logs" });
    }
  });

  // Get a specific insulin log by ID
  app.get("/api/insulin-logs/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const log = await storage.getInsulinLog(id);
      if (!log) {
        return res.status(404).json({ message: "Insulin log not found" });
      }
      
      // Check if the log belongs to the current user
      if (log.userId && log.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to access this log" });
      }

      res.json(log);
    } catch (error) {
      console.error("Error fetching insulin log:", error);
      res.status(500).json({ message: "Failed to fetch insulin log" });
    }
  });

  // Create a new insulin log
  app.post("/api/insulin-logs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const logData = insertInsulinLogSchema.parse(req.body);
      const userId = req.user.id;
      
      const newLog = await storage.createInsulinLog({
        ...logData,
        userId
      });
      
      // Check if the user has a profile with parent notification enabled
      const profile = await storage.getProfileByUserId(userId);
      if (profile && profile.notifyParents) {
        try {
          // Send SMS notifications to parents
          await notifyParents(newLog, profile);
          
          // Mark the log as shared after successful notification
          await storage.markLogAsShared(newLog.id);
        } catch (notifyError) {
          console.error("Error sending SMS notifications:", notifyError);
          // We'll still return the log even if notifications fail
        }
      }
      
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating insulin log:", error);
      res.status(500).json({ message: "Failed to create insulin log" });
    }
  });

  // Delete an insulin log
  app.delete("/api/insulin-logs/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Check if the log exists and belongs to the user
      const log = await storage.getInsulinLog(id);
      if (!log) {
        return res.status(404).json({ message: "Insulin log not found" });
      }
      
      if (log.userId && log.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this log" });
      }

      const success = await storage.deleteInsulinLog(id);
      if (!success) {
        return res.status(404).json({ message: "Insulin log not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting insulin log:", error);
      res.status(500).json({ message: "Failed to delete insulin log" });
    }
  });
  
  // SMS Notification endpoint
  app.post("/api/notify-parents", isAuthenticated, hasProfile, async (req: Request, res: Response) => {
    try {
      const logId = parseInt(req.body.logId);
      if (isNaN(logId)) {
        return res.status(400).json({ message: "Invalid log ID" });
      }
      
      // Get the insulin log
      const log = await storage.getInsulinLog(logId);
      if (!log) {
        return res.status(404).json({ message: "Insulin log not found" });
      }
      
      // Check if the log belongs to the current user
      const userId = req.user.id;
      if (log.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to share this log" });
      }
      
      // Get the user's profile
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      if (!profile.notifyParents) {
        return res.status(400).json({ message: "Parent notifications are not enabled in your profile" });
      }
      
      // Send SMS notification
      await notifyParents(log, profile);
      
      // Mark the log as shared
      await storage.markLogAsShared(logId);
      
      res.status(200).json({ message: "Parents notified successfully" });
    } catch (error) {
      console.error("Error notifying parents:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });
  
  // Get unshared logs for notification
  app.get("/api/unshared-logs", isAuthenticated, hasProfile, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const logs = await storage.getUnsharedLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching unshared logs:", error);
      res.status(500).json({ message: "Failed to fetch unshared logs" });
    }
  });

  // AI Food suggestions
  app.post("/api/food-suggestions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // If query is very short, just return empty result for better UX during typing
      if (query.length < 2) {
        return res.json([]);
      }
      
      // For search queries like restaurant names or food categories, return multiple suggestions
      if (query.length < 5 || query.includes(' ')) {
        const suggestions = await suggestMeals(query);
        return res.json(suggestions);
      }
      
      // For specific food names, return detailed information
      const foodSuggestion = await getFoodCarbs(query);
      res.json(foodSuggestion);
    } catch (error) {
      console.error("Error getting food suggestions:", error);
      // Using 200 status with error object for graceful handling in UI
      res.json({ 
        error: true,
        name: req.body.query || "Food",
        description: "Could not find carb information",
        portions: {
          small: { description: "Small portion", carbValue: 0 },
          medium: { description: "Medium portion", carbValue: 0 },
          large: { description: "Large portion", carbValue: 0 }
        }
      });
    }
  });

  app.post("/api/meal-suggestions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const suggestions = await suggestMeals(query);
      res.json(suggestions);
    } catch (error) {
      console.error("Error getting meal suggestions:", error);
      // Return empty array instead of error status for graceful UI handling
      res.json([]);
    }
  });

  // Meal presets routes
  app.get("/api/meal-presets", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const presets = await storage.getUserMealPresets(userId);
      res.json(presets);
    } catch (error) {
      console.error("Error fetching meal presets:", error);
      res.status(500).json({ message: "Failed to fetch meal presets" });
    }
  });

  app.get("/api/meal-presets/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const preset = await storage.getMealPreset(id);
      if (!preset) {
        return res.status(404).json({ message: "Meal preset not found" });
      }
      
      // Check if the preset belongs to the current user
      if (preset.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to access this preset" });
      }

      res.json(preset);
    } catch (error) {
      console.error("Error fetching meal preset:", error);
      res.status(500).json({ message: "Failed to fetch meal preset" });
    }
  });

  app.post("/api/meal-presets", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const presetData = insertMealPresetSchema.parse(req.body);
      const userId = req.user.id;
      
      const newPreset = await storage.createMealPreset({
        ...presetData,
        userId
      });
      
      res.status(201).json(newPreset);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating meal preset:", error);
      res.status(500).json({ message: "Failed to create meal preset" });
    }
  });

  app.put("/api/meal-presets/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Check if the preset exists and belongs to the user
      const preset = await storage.getMealPreset(id);
      if (!preset) {
        return res.status(404).json({ message: "Meal preset not found" });
      }
      
      if (preset.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this preset" });
      }
      
      // Validate and update the preset
      const presetData = insertMealPresetSchema.partial().parse(req.body);
      const updatedPreset = await storage.updateMealPreset(id, presetData);
      
      res.json(updatedPreset);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating meal preset:", error);
      res.status(500).json({ message: "Failed to update meal preset" });
    }
  });

  app.delete("/api/meal-presets/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Check if the preset exists and belongs to the user
      const preset = await storage.getMealPreset(id);
      if (!preset) {
        return res.status(404).json({ message: "Meal preset not found" });
      }
      
      if (preset.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this preset" });
      }
      
      const success = await storage.deleteMealPreset(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete meal preset" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meal preset:", error);
      res.status(500).json({ message: "Failed to delete meal preset" });
    }
  });
  
  // Achievement system routes
  
  // Get all milestones
  app.get("/api/milestones", async (req: Request, res: Response) => {
    try {
      const milestones = await storage.getAllMilestones();
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });
  
  // Get a specific milestone
  app.get("/api/milestones/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const milestone = await storage.getMilestone(id);
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      res.json(milestone);
    } catch (error) {
      console.error("Error fetching milestone:", error);
      res.status(500).json({ message: "Failed to fetch milestone" });
    }
  });
  
  // Create milestone (admin only, in a real app would have admin auth)
  app.post("/api/milestones", async (req: Request, res: Response) => {
    try {
      const milestoneData = insertMilestoneSchema.parse(req.body);
      const newMilestone = await storage.createMilestone(milestoneData);
      
      res.status(201).json(newMilestone);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating milestone:", error);
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });
  
  // Get user achievements
  app.get("/api/achievements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });
  
  // Track achievements for various activities
  app.post("/api/track-achievement/:type", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { type } = req.params;
      const { increment = 1 } = req.body;
      
      const achievement = await storage.incrementAchievementProgress(userId, type, increment);
      
      if (!achievement) {
        return res.status(400).json({ message: "Invalid achievement type" });
      }
      
      res.json(achievement);
    } catch (error) {
      console.error("Error tracking achievement:", error);
      res.status(500).json({ message: "Failed to track achievement" });
    }
  });

  // Calculator settings routes
  app.get("/api/calculator-settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get calculator settings for the authenticated user
      const settings = await storage.getCalculatorSettingsByUserId(req.user.id);
      
      if (settings) {
        res.json(settings);
      } else {
        // Return default values if no settings exist
        res.json({
          firstMealRatio: 10,
          otherMealRatio: 15,
          targetBgMin: 4.5,
          targetBgMax: 7.0,
          ...storage.getDefaultCalculatorSettings()
        });
      }
    } catch (error) {
      console.error("Error fetching calculator settings:", error);
      res.status(500).json({ message: "Failed to fetch calculator settings" });
    }
  });
  
  app.post("/api/calculator-settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check if user already has settings
      const existingSettings = await storage.getCalculatorSettingsByUserId(req.user.id);
      
      if (existingSettings) {
        // Update existing settings
        const updatedSettings = await storage.updateCalculatorSettings(existingSettings.id, req.body);
        res.json(updatedSettings);
      } else {
        // Create new settings
        const newSettings = await storage.createCalculatorSettings({
          ...req.body,
          userId: req.user.id
        });
        res.status(201).json(newSettings);
      }
    } catch (error) {
      console.error("Error saving calculator settings:", error);
      res.status(500).json({ message: "Failed to save calculator settings" });
    }
  });
  
  app.get("/api/default-correction-charts", isAuthenticated, (req: Request, res: Response) => {
    try {
      // Return default correction charts
      res.json(storage.getDefaultCalculatorSettings());
    } catch (error) {
      console.error("Error fetching default correction charts:", error);
      res.status(500).json({ message: "Failed to fetch default correction charts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
