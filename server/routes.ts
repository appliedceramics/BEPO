import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInsulinLogSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all insulin logs
  app.get("/api/insulin-logs", async (req: Request, res: Response) => {
    try {
      const logs = await storage.getAllInsulinLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching insulin logs:", error);
      res.status(500).json({ message: "Failed to fetch insulin logs" });
    }
  });

  // Get a specific insulin log by ID
  app.get("/api/insulin-logs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const log = await storage.getInsulinLog(id);
      if (!log) {
        return res.status(404).json({ message: "Insulin log not found" });
      }

      res.json(log);
    } catch (error) {
      console.error("Error fetching insulin log:", error);
      res.status(500).json({ message: "Failed to fetch insulin log" });
    }
  });

  // Create a new insulin log
  app.post("/api/insulin-logs", async (req: Request, res: Response) => {
    try {
      const logData = insertInsulinLogSchema.parse(req.body);
      const newLog = await storage.createInsulinLog(logData);
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
  app.delete("/api/insulin-logs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
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

  const httpServer = createServer(app);
  return httpServer;
}
