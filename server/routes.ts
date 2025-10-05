import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertChildSchema,
  insertChildMilestoneSchema,
  insertGrowthMetricSchema,
  insertToothSchema,
} from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import passport, { hashPassword } from "./auth";
import "./types";
import { z } from "zod";
import { calculatePercentile } from "./whoPercentiles";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
      
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({ 
        email: validatedData.email, 
        password: hashedPassword 
      });
      
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed" });
        res.json({ id: user.id, email: user.email });
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ id: req.user!.id, email: req.user!.email });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    res.json({ id: req.user.id, email: req.user.email });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password, ...sanitizedUser } = user;
    res.json(sanitizedUser);
  });

  // Children routes
  app.get("/api/children", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const children = await storage.getChildrenByParentId(req.user.id);
    res.json(children);
  });

  app.get("/api/children/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.id);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    res.json(child);
  });

  app.post("/api/children", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const validatedData = insertChildSchema.parse({
        ...req.body,
        parentIds: [req.user.id],
      });
      
      const child = await storage.createChild(validatedData);
      res.json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.patch("/api/children/:id/medical-history", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.id);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    try {
      const medicalHistorySchema = z.object({
        medicalHistory: z.object({
          conditions: z.array(z.string()).optional(),
          allergies: z.array(z.string()).optional(),
          medications: z.array(z.string()).optional(),
          birthComplications: z.array(z.string()).optional(),
          currentConcerns: z.array(z.string()).optional(),
          notes: z.string().optional(),
        }),
      });
      
      const validatedData = medicalHistorySchema.parse(req.body);
      const updatedChild = await storage.updateChildMedicalHistory(
        req.params.id,
        validatedData.medicalHistory
      );
      res.json(updatedChild);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  // Milestone routes
  app.get("/api/milestones", async (_req, res) => {
    const milestones = await storage.getAllMilestones();
    res.json(milestones);
  });

  app.get("/api/milestones/age-range/:minMonths/:maxMonths", async (req, res) => {
    const minMonths = parseInt(req.params.minMonths);
    const maxMonths = parseInt(req.params.maxMonths);
    
    if (isNaN(minMonths) || isNaN(maxMonths)) {
      return res.status(400).json({ error: "Invalid age range parameters" });
    }
    
    const milestones = await storage.getMilestonesByAgeRange(minMonths, maxMonths);
    res.json(milestones);
  });

  // Child milestone routes
  app.get("/api/children/:childId/milestones", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const childMilestones = await storage.getChildMilestones(req.params.childId);
    res.json(childMilestones);
  });

  app.post("/api/children/:childId/milestones", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    try {
      const validatedData = insertChildMilestoneSchema.parse({
        childId: req.params.childId,
        ...req.body,
      });
      
      const childMilestone = await storage.createChildMilestone(validatedData);
      res.json(childMilestone);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.patch("/api/child-milestones/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      // Get child milestone by ID only
      const childMilestone = await storage.getChildMilestoneById(req.params.id);
      if (!childMilestone) {
        return res.status(404).json({ error: "Child milestone not found" });
      }
      
      // Verify ownership via the stored childId
      const child = await storage.getChild(childMilestone.childId);
      if (!child || !child.parentIds.includes(req.user.id)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Validate and apply updates
      const updateSchema = z.object({
        achieved: z.boolean().optional(),
        achievedAt: z.string().optional(),
        notes: z.string().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const updated = await storage.updateChildMilestone(req.params.id, validatedData as any);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.post("/api/children/:childId/milestones/:milestoneId/toggle", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    try {
      const existingRecord = await storage.getChildMilestone(
        req.params.childId, 
        req.params.milestoneId
      );
      
      if (existingRecord) {
        const newAchieved = !existingRecord.achieved;
        const updated = await storage.updateChildMilestone(existingRecord.id, {
          achieved: newAchieved,
          achievedAt: newAchieved ? new Date().toISOString() : null,
        } as any);
        return res.json(updated);
      } else {
        const newRecord = await storage.createChildMilestone({
          childId: req.params.childId,
          milestoneId: req.params.milestoneId,
          achieved: true,
          achievedAt: new Date().toISOString(),
        } as any);
        return res.json(newRecord);
      }
    } catch (error) {
      console.error("Toggle milestone error:", error);
      res.status(500).json({ error: "Failed to toggle milestone" });
    }
  });

  // Growth metrics routes
  app.get("/api/children/:childId/growth-metrics", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const type = req.query.type as string | undefined;
    const metrics = await storage.getGrowthMetrics(req.params.childId, type);
    res.json(metrics);
  });

  app.post("/api/children/:childId/growth-metrics", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    try {
      const validatedData = insertGrowthMetricSchema.parse({
        childId: req.params.childId,
        ...req.body,
      });
      
      // Calculate age in months at measurement time
      const birthDate = new Date(child.birthDate);
      const measurementDate = new Date(validatedData.date);
      const ageMonths = Math.floor(
        (measurementDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      
      // Calculate WHO percentile
      const percentile = child.gender
        ? calculatePercentile(
            validatedData.value,
            ageMonths,
            child.gender,
            validatedData.type as 'weight' | 'height' | 'head'
          )
        : null;
      
      const metric = await storage.createGrowthMetric({
        ...validatedData,
        percentile,
      });
      res.json(metric);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  // Teeth routes
  app.get("/api/children/:childId/teeth", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const teeth = await storage.getTeeth(req.params.childId);
    res.json(teeth);
  });

  app.post("/api/children/:childId/teeth", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    try {
      const validatedData = insertToothSchema.parse({
        childId: req.params.childId,
        ...req.body,
      });
      
      const tooth = await storage.createTooth(validatedData);
      res.json(tooth);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.patch("/api/teeth/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    // Get the tooth by ID
    const tooth = await storage.getTooth(req.params.id);
    if (!tooth) {
      return res.status(404).json({ error: "Tooth not found" });
    }
    
    // Verify ownership
    const child = await storage.getChild(tooth.childId);
    if (!child || !child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    try {
      const updateSchema = z.object({
        eruptedAt: z.string().optional(),
        notes: z.string().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const updated = await storage.updateTooth(req.params.id, validatedData as any);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  // AI Recommendations route
  app.post("/api/children/:childId/milestones/:milestoneId/recommendations", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    try {
      // Validate params
      const paramsSchema = z.object({
        childId: z.string().uuid(),
        milestoneId: z.string(),
      });
      
      const { childId, milestoneId } = paramsSchema.parse(req.params);

      // Get child and verify ownership
      const child = await storage.getChild(childId);
      if (!child) return res.status(404).json({ error: "Child not found" });
      
      if (!child.parentIds.includes(req.user.id)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const milestone = await storage.getMilestone(milestoneId);
      const parent = await storage.getUser(req.user.id);

      if (!milestone || !parent) {
        return res.status(404).json({ error: "Required data not found" });
      }

      // Check if we have cached recommendations
      const cached = await storage.getAiRecommendation(childId, milestoneId);
      
      const childDataVersion = child.medicalHistoryUpdatedAt || new Date(0);
      const parentDataVersion = parent.medicalHistoryUpdatedAt || new Date(0);

      // Use cached if data hasn't changed
      if (cached && 
          cached.childDataVersion >= childDataVersion &&
          cached.parentDataVersion >= parentDataVersion) {
        return res.json(cached.recommendations);
      }

      // Generate new recommendations with Claude
      const prompt = `You are a pediatric development expert. Based on the following information, provide 3-4 practical, personalized recommendations for how parents can help their child achieve this milestone.

Child Information:
- Age: ${Math.floor((new Date().getTime() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
- Medical History: ${JSON.stringify(child.medicalHistory || {})}

Parent Information:
- Medical History: ${JSON.stringify(parent.medicalHistory || {})}

Milestone:
- Title: ${milestone.title}
- Category: ${milestone.category}
- Description: ${milestone.description}

Provide your response as a JSON array with objects containing "title" and "description" fields. Each recommendation should be specific, actionable, and personalized based on the medical histories provided. Keep titles short (5-7 words) and descriptions concise but practical (2-3 sentences).`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      let recommendations;
      
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
        } else {
          recommendations = [];
        }
      } else {
        recommendations = [];
      }

      // Cache the new recommendations
      await storage.createAiRecommendation({
        childId,
        milestoneId,
        recommendations,
        childDataVersion,
        parentDataVersion,
      });

      res.json(recommendations);
    } catch (error) {
      console.error("AI recommendation error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // User medical history route
  app.patch("/api/user/medical-history", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const medicalHistorySchema = z.object({
        medicalHistory: z.object({
          conditions: z.array(z.string()).optional(),
          allergies: z.array(z.string()).optional(),
          medications: z.array(z.string()).optional(),
          familyHistory: z.array(z.string()).optional(),
          notes: z.string().optional(),
        }),
      });
      
      const validatedData = medicalHistorySchema.parse(req.body);
      const user = await storage.updateUserMedicalHistory(
        req.user.id,
        validatedData.medicalHistory
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
