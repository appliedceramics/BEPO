import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInsulinLogSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated, hasProfile } from "./auth";
import { notifyParents } from "./twilio";

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

  const httpServer = createServer(app);
  return httpServer;
}
