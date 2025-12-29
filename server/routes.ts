import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertChildSchema,
  insertChildMilestoneSchema,
  insertGrowthMetricSchema,
  insertToothSchema,
  insertDailyStreakSchema,
} from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import passport, { hashPassword } from "./auth";
import "./types";
import { z } from "zod";
import { calculatePercentile } from "./whoPercentiles";
import { getAgeInMonthsForAI } from "./age-utils";
import { triggerWarmupInBackground } from "./services/recommendationWarmup";
import { 
  calculateHighlights, 
  calculateCategoryPercentage, 
  calculateDaysUntilRangeEnds,
  getAgeRange,
  getAdjustedMonthsForRange,
  type CategoryProgress,
  type Highlight
} from "@shared/highlights";
import { calculateAdjustedAge } from "./age-utils";
import PDFDocument from "pdfkit";

// Check if Anthropic API key is configured
const isAnthropicConfigured = !!process.env.ANTHROPIC_API_KEY;

const anthropic = isAnthropicConfigured 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Helper to parse Postgres array strings like "{HSE,NHS}" into ["HSE", "NHS"]
function parsePostgresArray(value: string): string[] {
  if (!value || typeof value !== 'string') return [];
  // Remove curly braces and split by comma
  const cleaned = value.replace(/^\{/, '').replace(/\}$/, '');
  if (!cleaned) return [];
  return cleaned.split(',').map(s => s.trim().replace(/^"/, '').replace(/"$/, ''));
}

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

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        const message = info?.message || "Invalid email or password. Please check your credentials and try again.";
        return res.status(401).json({ error: message });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({ id: user.id, email: user.email });
      });
    })(req, res, next);
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

  app.patch("/api/user/profile", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const updateSchema = z.object({
        displayName: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      // Map displayName to firstName if provided
      const updateData: any = {};
      if (validatedData.displayName) {
        updateData.firstName = validatedData.displayName;
      }
      if (validatedData.firstName) {
        updateData.firstName = validatedData.firstName;
      }
      if (validatedData.lastName) {
        updateData.lastName = validatedData.lastName;
      }
      
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      if (!updatedUser) return res.status(404).json({ error: "User not found" });
      
      const { password, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.patch("/api/user/preferences", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const preferencesSchema = z.object({
        preferredMilestoneSources: z.array(z.string()).nullable().optional(),
      });
      
      const validatedData = preferencesSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, validatedData);
      
      if (!updatedUser) return res.status(404).json({ error: "User not found" });
      
      const { password, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(400).json({ error: "Invalid input" });
    }
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
      // Check if user is a secondary parent (has relationships but none are primary)
      const existingChildren = await storage.getChildrenByParentId(req.user.id);
      if (existingChildren.length > 0) {
        // User already has children, check if they're primary
        const isPrimary = await storage.isPrimaryParent(req.user.id);
        if (!isPrimary) {
          return res.status(403).json({ 
            error: "Only primary parents can add children",
            message: "As a co-parent, you can view and track milestones but cannot add new children."
          });
        }
      }
      
      const validatedData = insertChildSchema.parse({
        ...req.body,
        parentIds: [req.user.id],
      });
      
      const child = await storage.createChild(validatedData);
      
      // Create parent-child relationship (primary parent when creating child)
      await storage.createParentChildRelationship({
        userId: req.user.id,
        childId: child.id,
        role: "primary",
      });
      
      // Trigger background warmup for milestone recommendations
      triggerWarmupInBackground(child.id, req.user.id);
      
      res.json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.patch("/api/children/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.id);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Only primary parents of THIS SPECIFIC CHILD can update their profile
    const roleForChild = await storage.getParentRole(req.user.id, req.params.id);
    if (roleForChild !== "primary") {
      return res.status(403).json({ 
        error: "Only primary parents can edit child profiles",
        message: "As a co-parent, you can view and track milestones but cannot edit child information."
      });
    }
    
    try {
      const updateChildSchema = z.object({
        name: z.string().optional(),
        dueDate: z.string().optional(),
        gender: z.enum(['male', 'female', 'other']).optional(),
      });
      
      const validatedData = updateChildSchema.parse(req.body);
      const updatedChild = await storage.updateChild(req.params.id, validatedData);
      res.json(updatedChild);
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

  // Delete child endpoint with last-child guard
  app.delete("/api/children/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.id);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    // Verify parent ownership
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Only primary parents of THIS SPECIFIC CHILD can delete them
    const roleForChild = await storage.getParentRole(req.user.id, req.params.id);
    if (roleForChild !== "primary") {
      return res.status(403).json({ 
        error: "Only primary parents can delete child profiles",
        message: "As a co-parent, you can view and track milestones but cannot delete child profiles."
      });
    }
    
    // Check if this is the last child - prevent deletion
    const allChildren = await storage.getChildrenByParentId(req.user.id);
    if (allChildren.length <= 1) {
      return res.status(400).json({ 
        error: "Cannot delete last child",
        message: "You must have at least one child profile. Add another child before deleting this one."
      });
    }
    
    try {
      const success = await storage.deleteChild(req.params.id);
      if (success) {
        res.json({ success: true, message: "Child profile deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete child profile" });
      }
    } catch (error) {
      console.error("Error deleting child:", error);
      res.status(500).json({ error: "Failed to delete child profile" });
    }
  });

  // Trigger recommendation warmup for a child (used when switching profiles)
  app.post("/api/children/:id/warmup", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.id);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    // Verify parent has access to this child
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Trigger background warmup - non-blocking
    triggerWarmupInBackground(child.id, req.user.id);
    
    res.json({ success: true, message: "Recommendation warmup started" });
  });

  // Milestone routes
  app.get("/api/milestones", async (req, res) => {
    // Get user's preferred sources if authenticated
    let preferredSources: string[] | undefined;
    if (req.user) {
      const user = await storage.getUser(req.user.id);
      const rawSources = user?.preferredMilestoneSources;
      // Parse if it's a Postgres array string
      if (rawSources && Array.isArray(rawSources)) {
        preferredSources = rawSources;
      } else if (rawSources && typeof rawSources === 'string') {
        preferredSources = parsePostgresArray(rawSources);
      }
    }
    
    let milestones = await storage.getAllMilestones();
    
    // Apply source filtering if user has preferences
    if (preferredSources && preferredSources.length > 0) {
      milestones = milestones.filter(m => {
        // If milestone has sources, check if any match user preferences
        if (m.sources && m.sources.length > 0) {
          // Parse sources if it's a string (Postgres text[] returns as string without arrayMode)
          const milestoneSources = Array.isArray(m.sources) 
            ? m.sources 
            : parsePostgresArray(m.sources as unknown as string);
          return milestoneSources.some(source => preferredSources.includes(source));
        }
        // Don't include milestones without sources when user has source preferences
        return false;
      });
    }
    
    res.json(milestones);
  });

  app.get("/api/milestones/age-range/:minMonths/:maxMonths", async (req, res) => {
    const minMonths = parseInt(req.params.minMonths);
    const maxMonths = parseInt(req.params.maxMonths);
    
    if (isNaN(minMonths) || isNaN(maxMonths)) {
      return res.status(400).json({ error: "Invalid age range parameters" });
    }
    
    // Get user's preferred sources if authenticated
    let preferredSources: string[] | undefined;
    if (req.user) {
      const user = await storage.getUser(req.user.id);
      const rawSources = user?.preferredMilestoneSources;
      // Parse if it's a Postgres array string
      if (rawSources && Array.isArray(rawSources)) {
        preferredSources = rawSources;
      } else if (rawSources && typeof rawSources === 'string') {
        preferredSources = parsePostgresArray(rawSources);
      }
    }
    
    const milestones = await storage.getMilestonesByAgeRange(minMonths, maxMonths, preferredSources);
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
          achievedAt: newAchieved ? new Date() : null,
        } as any);
        return res.json(updated);
      } else {
        const newRecord = await storage.createChildMilestone({
          childId: req.params.childId,
          milestoneId: req.params.milestoneId,
          achieved: true,
          achievedAt: new Date(),
        } as any);
        return res.json(newRecord);
      }
    } catch (error) {
      console.error("Toggle milestone error:", error);
      res.status(500).json({ error: "Failed to toggle milestone" });
    }
  });

  // Highlights endpoint - calculates celebration and GP consultation highlights
  app.get("/api/children/:childId/highlights", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    try {
      // Calculate child's adjusted age
      const adjustedAge = calculateAdjustedAge(child.dueDate);
      const baseMonths = adjustedAge.years * 12 + adjustedAge.months;
      
      // Get adjusted months accounting for range boundaries
      const adjustedAgeMonths = getAdjustedMonthsForRange(baseMonths, adjustedAge.days);
      
      // Get current age range
      const ageRange = getAgeRange(adjustedAgeMonths);
      
      // Calculate days until range ends
      const daysUntilRangeEnds = calculateDaysUntilRangeEnds(
        adjustedAgeMonths,
        adjustedAge.days,
        ageRange.max
      );
      
      
      // Get user's preferred sources
      let preferredSources: string[] | undefined;
      const user = await storage.getUser(req.user.id);
      const rawSources = user?.preferredMilestoneSources;
      if (rawSources && Array.isArray(rawSources)) {
        preferredSources = rawSources;
      } else if (rawSources && typeof rawSources === 'string') {
        preferredSources = parsePostgresArray(rawSources);
      }
      
      // Get milestones for current age range
      const milestones = await storage.getMilestonesByAgeRange(
        ageRange.min, 
        ageRange.max, 
        preferredSources
      );
      
      // Get child's achieved milestones
      const childMilestones = await storage.getChildMilestones(req.params.childId);
      const achievedMilestoneIds = new Set(
        childMilestones.filter(cm => cm.achieved).map(cm => cm.milestoneId)
      );
      
      // Calculate progress per category
      const categories = ['Developmental', 'Teeth', 'Vision', 'Hearing'] as const;
      const categoryProgress: CategoryProgress[] = categories.map(category => {
        const categoryMilestones = milestones.filter(m => m.category === category);
        const achievedCount = categoryMilestones.filter(m => achievedMilestoneIds.has(m.id)).length;
        const totalCount = categoryMilestones.length;
        return {
          category,
          total: totalCount,
          achieved: achievedCount,
          percentage: calculateCategoryPercentage(achievedCount, totalCount),
        };
      }).filter(c => c.total > 0);
      
      // Get child's first name for personalized messages
      const childName = child.name.split(' ')[0];
      
      // Calculate highlights
      const highlights = calculateHighlights(
        categoryProgress,
        daysUntilRangeEnds,
        childName
      );
      
      res.json({
        highlights,
        ageRange,
        daysUntilRangeEnds,
        categoryProgress,
      });
    } catch (error) {
      console.error("Highlights calculation error:", error);
      res.status(500).json({ error: "Failed to calculate highlights" });
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
      
      // Calculate age in months at measurement time (using due date)
      // Formula: Adjusted Age = Measurement Date - Due Date
      const dueDate = new Date(child.dueDate);
      const measurementDate = new Date(validatedData.date);
      const ageMonths = Math.max(0, Math.floor(
        (measurementDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      ));
      
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

      // Get excluded recommendations from request body
      const excludeCompletedTitles = req.body?.excludeCompleted || [];

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

      // Use cached if data hasn't changed AND we're not requesting new recommendations
      if (cached && 
          cached.childDataVersion >= childDataVersion &&
          cached.parentDataVersion >= parentDataVersion &&
          excludeCompletedTitles.length === 0) {
        return res.json(cached.recommendations);
      }

      // Check if Anthropic API is configured
      if (!anthropic) {
        return res.status(503).json({ 
          error: "ai_not_configured",
          message: "AI recommendations require an Anthropic API key. Please configure ANTHROPIC_API_KEY in your environment."
        });
      }

      // Build exclusion text for prompt if there are completed recommendations
      const exclusionText = excludeCompletedTitles.length > 0 
        ? `\n\nIMPORTANT: The parents have already tried the following recommendations. Please provide NEW, DIFFERENT recommendations that build upon or complement these completed activities:\n${excludeCompletedTitles.map((title: string, idx: number) => `${idx + 1}. ${title}`).join('\n')}`
        : '';

      // Generate new recommendations with Claude
      const childAgeInMonths = getAgeInMonthsForAI(child.dueDate);
      const prompt = `You are a pediatric development expert. Based on the following information, provide 3-4 practical, personalized recommendations for how parents can help their child achieve this milestone.

Child Information:
- Age: ${childAgeInMonths} months (adjusted for prematurity/post-maturity if applicable)
- Medical History: ${JSON.stringify(child.medicalHistory || {})}

Parent Information:
- Medical History: ${JSON.stringify(parent.medicalHistory || {})}

Milestone:
- Title: ${milestone.title}
- Category: ${milestone.category}
- Description: ${milestone.description}${exclusionText}

IMPORTANT: Base your recommendations on established pediatric guidelines from authoritative sources such as:
- CDC (Centers for Disease Control and Prevention) developmental milestone guidelines
- AAP (American Academy of Pediatrics) recommendations
- WHO (World Health Organization) child development standards
- HSE (Health Service Executive) developmental milestone guidelines
- Evidence-based pediatric research and clinical guidelines
- WHO Motor development milestones and growth standards
- UNICEF Early childhood development guidelines
- NHS - Developmental reviews
- CPS (Canadian Paediatric Society) - Rourke Baby Record developmental milestones
- NHMRC - Child health surveillance guidelines
- Australian Government Department of Health - Developmental milestones resources

Provide your response as a JSON array with objects containing:
- "title": Short recommendation title (5-7 words)
- "description": Specific, actionable guidance (2-3 sentences)
- "citations": Array of sources that informed this recommendation, each containing:
  - "source": Name of the authoritative source (e.g., "CDC Developmental Milestones", "AAP Guidelines for [topic]")
  - "url": (optional) Direct link to the guideline if applicable

IMPORTANT URL GUIDANCE: Only include URLs if you are certain they are correct. Use these official base URLs:
- CDC: https://www.cdc.gov/act-early/milestones/ (e.g., https://www.cdc.gov/act-early/milestones/2-years.html)
- AAP: https://publications.aap.org/pediatrics/article/149/3/e2021052138/184748
- WHO: https://www.who.int/tools/child-growth-standards/standards/motor-development-milestones
- HSE: https://www2.hse.ie/babies-children/checks-milestones/developmental-milestones/
- NHS: https://www.nhs.uk/conditions/baby/babys-development/
- CPS: https://cps.ca/en/tools-outils/rourke-baby-record or https://www.rourkebabyrecord.ca/
- UNICEF: https://data.unicef.org/topic/early-childhood-development/
- Australian Govt: https://www.healthdirect.gov.au/developmental-milestones
If unsure about a specific URL, omit the url field and include only the source name.

Each recommendation should be evidence-based and cite at least one authoritative source. Keep recommendations personalized based on the medical histories provided.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
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

  // Toy recommendations route
  app.post("/api/children/:childId/milestones/:milestoneId/toy-recommendations", async (req, res) => {
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

      // Get dismissed toys for this child and milestone
      const dismissedToys = await storage.getDismissedToyRecommendations(childId, milestoneId);
      const dismissedToyNames = new Set(dismissedToys.map(dt => dt.toyName.toLowerCase()));

      // Check for cached toy recommendations
      const cached = await storage.getAiToyRecommendation(childId, milestoneId);
      
      const childDataVersion = child.medicalHistoryUpdatedAt || new Date(0);
      const parentDataVersion = parent.medicalHistoryUpdatedAt || new Date(0);

      // Use cached if data hasn't changed
      if (cached && 
          cached.childDataVersion >= childDataVersion &&
          cached.parentDataVersion >= parentDataVersion) {
        // Filter out dismissed toys from cached recommendations
        let filteredRecommendations = cached.recommendations.filter(toy => 
          !dismissedToyNames.has(toy.name.toLowerCase())
        );
        
        // Return only the first 5 non-dismissed toys
        filteredRecommendations = filteredRecommendations.slice(0, 5);
        return res.json(filteredRecommendations);
      }

      // Check if Anthropic API is configured
      if (!anthropic) {
        return res.status(503).json({ 
          error: "ai_not_configured",
          message: "AI toy recommendations require an Anthropic API key. Please configure ANTHROPIC_API_KEY in your environment."
        });
      }

      // Generate new toy recommendations with Claude (more recommendations now)
      const childAgeInMonths = getAgeInMonthsForAI(child.dueDate);
      const prompt = `You are a pediatric development expert and toy specialist. Based on the following information, recommend 10-15 specific toys or tools that parents can use to help their child achieve this milestone.

Child Information:
- Age: ${childAgeInMonths} months (adjusted for prematurity/post-maturity if applicable)
- Medical History: ${JSON.stringify(child.medicalHistory || {})}

Parent Information:
- Medical History: ${JSON.stringify(parent.medicalHistory || {})}

Milestone:
- Title: ${milestone.title}
- Category: ${milestone.category}
- Description: ${milestone.description}

IMPORTANT: Base your toy recommendations on established pediatric development principles from authoritative sources such as:
- CDC developmental milestone guidelines and age-appropriate play recommendations
- HSE developmental milestone guidelines and age-appropriate play recommendations
- AAP guidelines on healthy child development and play
- Evidence-based research on developmental toys and learning tools
- Occupational therapy and physical therapy recommendations for child development
- WHO Motor development milestones and growth standards and age-appropriate play recommendations
- UNICEF Early childhood development guidelines and age-appropriate play recommendations
- NHS - Developmental reviews and age-appropriate play recommendations
- CPS (Canadian Paediatric Society) - Rourke Baby Record developmental milestones and age-appropriate play recommendations
- NHMRC - Child health surveillance guidelines and age-appropriate play recommendations
- Australian Government Department of Health - Developmental milestones resources and age-appropriate play recommendations

Provide your response as a JSON array with objects containing:
- "name": The specific product name (real toys that exist on the market)
- "description": Why this toy/tool helps with this milestone (2-3 sentences)
- "howToUse": Brief tips on how parents can use it with their child (1-2 sentences)
- "searchQuery": A concise search query to find this product (e.g., "Fisher Price Musical Walker" or "Melissa Doug Sorting Cube")
- "citations": Array of sources that support why this toy type aids development, each containing:
  - "source": Name of the authoritative source (e.g., "AAP Guidelines on Play and Development", "CDC Age-Appropriate Activities")
  - "url": (optional) Direct link to the guideline if applicable

IMPORTANT URL GUIDANCE: Only include URLs if you are certain they are correct. Use these official base URLs:
- CDC: https://www.cdc.gov/act-early/milestones/ (e.g., https://www.cdc.gov/act-early/milestones/2-years.html)
- AAP: https://publications.aap.org/pediatrics/article/149/3/e2021052138/184748
- WHO: https://www.who.int/tools/child-growth-standards/standards/motor-development-milestones
- HSE: https://www2.hse.ie/babies-children/checks-milestones/developmental-milestones/
- NHS: https://www.nhs.uk/conditions/baby/babys-development/
- CPS: https://cps.ca/en/tools-outils/rourke-baby-record or https://www.rourkebabyrecord.ca/
- UNICEF: https://data.unicef.org/topic/early-childhood-development/
- Australian Govt: https://www.healthdirect.gov.au/developmental-milestones
If unsure about a specific URL, omit the url field and include only the source name.

Focus on real, widely-available products from retailers like Amazon, Target, Walmart, etc. Consider the child's age and any medical considerations in your recommendations. Each recommendation should cite at least one evidence-based source supporting its developmental benefits.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3072,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      let toyRecommendations: any[] = [];
      
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            toyRecommendations = JSON.parse(jsonMatch[0]);
            
            // Validate the structure of each recommendation
            const isValid = toyRecommendations.every((toy: any) => 
              toy.name && 
              toy.description && 
              toy.howToUse && 
              toy.searchQuery
            );
            
            if (!isValid || toyRecommendations.length === 0) {
              return res.status(500).json({ error: "Invalid recommendations structure" });
            }

            // Cache the new toy recommendations
            await storage.createAiToyRecommendation({
              childId,
              milestoneId,
              recommendations: toyRecommendations,
              childDataVersion,
              parentDataVersion,
            });
            
            // Filter out dismissed toys
            toyRecommendations = toyRecommendations.filter(toy => 
              !dismissedToyNames.has(toy.name.toLowerCase())
            );
            
            // Return only the first 5 non-dismissed toys
            toyRecommendations = toyRecommendations.slice(0, 5);
          } catch (parseError) {
            console.error("Failed to parse toy recommendations:", parseError);
            console.error("Raw JSON that failed to parse (first 500 chars):", jsonMatch[0].substring(0, 500));
            console.error("Raw JSON that failed to parse (last 500 chars):", jsonMatch[0].substring(Math.max(0, jsonMatch[0].length - 500)));
            return res.status(500).json({ error: "Failed to parse recommendations" });
          }
        } else {
          return res.status(500).json({ error: "No valid recommendations found in response" });
        }
      } else {
        return res.status(500).json({ error: "Invalid response type from AI" });
      }

      res.json(toyRecommendations);
    } catch (error) {
      console.error("Toy recommendation error:", error);
      res.status(500).json({ error: "Failed to generate toy recommendations" });
    }
  });

  // Dismiss toy recommendation route
  app.post("/api/children/:childId/milestones/:milestoneId/dismiss-toy", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const paramsSchema = z.object({
        childId: z.string().uuid(),
        milestoneId: z.string(),
      });
      
      const bodySchema = z.object({
        toyName: z.string(),
      });

      const { childId, milestoneId } = paramsSchema.parse(req.params);
      const { toyName } = bodySchema.parse(req.body);

      // Verify child ownership
      const child = await storage.getChild(childId);
      if (!child) return res.status(404).json({ error: "Child not found" });
      
      if (!child.parentIds.includes(req.user.id)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Create dismissed toy record
      const dismissed = await storage.createDismissedToyRecommendation({
        childId,
        milestoneId,
        toyName,
      });

      res.json(dismissed);
    } catch (error) {
      console.error("Dismiss toy error:", error);
      res.status(500).json({ error: "Failed to dismiss toy recommendation" });
    }
  });

  // Completed recommendations routes
  app.get("/api/children/:childId/completed-recommendations", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { childId } = req.params;
      const { milestoneId } = req.query;
      
      const completed = await storage.getCompletedRecommendations(
        childId, 
        milestoneId as string | undefined
      );
      res.json(completed);
    } catch (error) {
      console.error("Get completed recommendations error:", error);
      res.status(500).json({ error: "Failed to get completed recommendations" });
    }
  });

  app.post("/api/children/:childId/completed-recommendations", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { childId } = req.params;
      const { milestoneId, recommendationTitle, recommendationDescription, citations } = req.body;

      const completed = await storage.createCompletedRecommendation({
        childId,
        milestoneId,
        recommendationTitle,
        recommendationDescription,
        citations,
      });
      res.json(completed);
    } catch (error) {
      console.error("Create completed recommendation error:", error);
      res.status(500).json({ error: "Failed to create completed recommendation" });
    }
  });

  app.delete("/api/children/:childId/completed-recommendations", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { childId } = req.params;
      const { milestoneId, recommendationTitle } = req.body;

      await storage.deleteCompletedRecommendation(childId, milestoneId, recommendationTitle);
      res.status(204).send();
    } catch (error) {
      console.error("Delete completed recommendation error:", error);
      res.status(500).json({ error: "Failed to delete completed recommendation" });
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

  // NOTE: Milestone seeding is now automatic on server startup (see server/index.ts)
  // This manual endpoint is no longer needed but kept for emergency use only
  // DEPRECATED: This endpoint will be removed in a future version

  // GDPR Data Export endpoint - downloads all user data as a ZIP file with CSVs
  app.get("/api/user/export", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const archiver = (await import("archiver")).default;
      const userId = req.user.id;
      
      // Fetch all user data
      const user = await storage.getUser(userId);
      const userChildren = await storage.getChildrenByParentId(userId);
      const allMilestones = await storage.getAllMilestones();
      
      // Create milestone lookup map
      const milestoneMap = new Map(allMilestones.map(m => [m.id, m]));
      
      // Collect all child data (include childId for unique identification)
      const allChildMilestones: Array<{childId: string; childName: string; milestone: any; childMilestone: any}> = [];
      const allGrowthMetrics: Array<{childId: string; childName: string; metric: any}> = [];
      const allTeeth: Array<{childId: string; childName: string; tooth: any}> = [];
      const allCompletedActivities: Array<{childId: string; childName: string; activity: any}> = [];
      
      for (const child of userChildren) {
        const childMilestones = await storage.getChildMilestones(child.id);
        const growthMetrics = await storage.getGrowthMetrics(child.id);
        const teeth = await storage.getTeeth(child.id);
        const completedRecs = await storage.getCompletedRecommendations(child.id);
        
        childMilestones.forEach(cm => {
          const milestone = milestoneMap.get(cm.milestoneId);
          allChildMilestones.push({ childId: child.id, childName: child.name, milestone, childMilestone: cm });
        });
        
        growthMetrics.forEach(m => allGrowthMetrics.push({ childId: child.id, childName: child.name, metric: m }));
        teeth.forEach(t => allTeeth.push({ childId: child.id, childName: child.name, tooth: t }));
        completedRecs.forEach(a => allCompletedActivities.push({ childId: child.id, childName: child.name, activity: a }));
      }
      
      // Helper to escape CSV values
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      // Helper to safely format dates (handles both Date objects and strings)
      const formatDate = (date: any): string => {
        if (!date) return '';
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        // If it's already a string, try to parse and format it
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
        return String(date);
      };
      
      // Create CSV content
      const accountCSV = [
        'Email,Created At,Milestone Sources',
        escapeCSV(user?.email) + ',' + 
        escapeCSV(formatDate(user?.createdAt)) + ',' +
        escapeCSV(Array.isArray(user?.milestoneSources) ? user.milestoneSources.join('; ') : '')
      ].join('\n');
      
      const childrenCSV = [
        'Child ID,Name,Due Date,Sex,Medical History',
        ...userChildren.map(c => [
          escapeCSV(c.id),
          escapeCSV(c.name),
          escapeCSV(formatDate(c.dueDate)),
          escapeCSV(c.sex || ''),
          escapeCSV(c.medicalHistory ? JSON.stringify(c.medicalHistory) : '')
        ].join(','))
      ].join('\n');
      
      const milestonesCSV = [
        'Child ID,Child Name,Milestone,Category,Status,Date Achieved,Notes',
        ...allChildMilestones.map(({ childId, childName, milestone, childMilestone }) => [
          escapeCSV(childId),
          escapeCSV(childName),
          escapeCSV(milestone?.title || 'Unknown'),
          escapeCSV(milestone?.category || ''),
          escapeCSV(childMilestone.status),
          escapeCSV(formatDate(childMilestone.achievedAt)),
          escapeCSV(childMilestone.notes || '')
        ].join(','))
      ].join('\n');
      
      const growthCSV = [
        'Child ID,Child Name,Date,Type,Value,Unit,Percentile',
        ...allGrowthMetrics.map(({ childId, childName, metric }) => [
          escapeCSV(childId),
          escapeCSV(childName),
          escapeCSV(formatDate(metric.recordedAt)),
          escapeCSV(metric.type),
          escapeCSV(metric.value),
          escapeCSV(metric.unit || ''),
          escapeCSV(metric.percentile || '')
        ].join(','))
      ].join('\n');
      
      const teethCSV = [
        'Child ID,Child Name,Tooth Number,Tooth Name,Eruption Date,Status',
        ...allTeeth.map(({ childId, childName, tooth }) => [
          escapeCSV(childId),
          escapeCSV(childName),
          escapeCSV(tooth.toothNumber),
          escapeCSV(tooth.toothName || ''),
          escapeCSV(formatDate(tooth.eruptionDate)),
          escapeCSV(tooth.status || '')
        ].join(','))
      ].join('\n');
      
      const activitiesCSV = [
        'Child ID,Child Name,Activity Title,Description,Completed At',
        ...allCompletedActivities.map(({ childId, childName, activity }) => [
          escapeCSV(childId),
          escapeCSV(childName),
          escapeCSV(activity.recommendationTitle),
          escapeCSV(activity.recommendationDescription || ''),
          escapeCSV(formatDate(activity.completedAt))
        ].join(','))
      ].join('\n');
      
      // Create ZIP archive
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="toddl-data-export-${new Date().toISOString().split('T')[0]}.zip"`);
      
      archive.pipe(res);
      
      archive.append(accountCSV, { name: 'account.csv' });
      archive.append(childrenCSV, { name: 'children.csv' });
      archive.append(milestonesCSV, { name: 'milestones.csv' });
      archive.append(growthCSV, { name: 'growth_metrics.csv' });
      archive.append(teethCSV, { name: 'teeth.csv' });
      archive.append(activitiesCSV, { name: 'completed_activities.csv' });
      
      await archive.finalize();
    } catch (error) {
      console.error("Data export error:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Get user role (primary or secondary parent)
  app.get("/api/user/role", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const isPrimary = await storage.isPrimaryParent(req.user.id);
      res.json({ role: isPrimary ? "primary" : "secondary" });
    } catch (error) {
      console.error("Error getting user role:", error);
      res.status(500).json({ error: "Failed to get user role" });
    }
  });

  // Get all parents for the current user's children
  app.get("/api/parents", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const children = await storage.getChildrenByParentId(req.user.id);
      
      if (children.length === 0) {
        return res.json([]);
      }
      
      // Get all parents for the first child (all children share same parents)
      const childId = children[0].id;
      const parents = await storage.getChildParents(childId);
      
      // Sanitize user data (remove passwords)
      const sanitizedParents = parents.map(p => ({
        id: p.id,
        userId: p.userId,
        childId: p.childId,
        role: p.role,
        joinedAt: p.joinedAt,
        user: {
          id: p.user.id,
          email: p.user.email,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
        }
      }));
      
      res.json(sanitizedParents);
    } catch (error) {
      console.error("Error getting parents:", error);
      res.status(500).json({ error: "Failed to get parents" });
    }
  });

  // Remove a secondary parent (primary parent only)
  app.delete("/api/parents/:userId", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const targetUserId = req.params.userId;
      
      // Verify current user is a primary parent
      const isPrimary = await storage.isPrimaryParent(req.user.id);
      if (!isPrimary) {
        return res.status(403).json({ error: "Only primary parents can remove other parents" });
      }
      
      // Get the target user's role
      const children = await storage.getChildrenByParentId(req.user.id);
      if (children.length === 0) {
        return res.status(400).json({ error: "No children found" });
      }
      
      const targetRole = await storage.getParentRole(targetUserId, children[0].id);
      if (targetRole === "primary") {
        return res.status(400).json({ error: "Cannot remove primary parent" });
      }
      
      // Remove the secondary parent from all children
      for (const child of children) {
        await storage.deleteParentChildRelationship(targetUserId, child.id);
        
        // Also remove from parentIds array in children table
        const updatedParentIds = child.parentIds.filter(id => id !== targetUserId);
        await storage.updateChild(child.id, { parentIds: updatedParentIds });
      }
      
      res.json({ success: true, message: "Parent removed successfully" });
    } catch (error) {
      console.error("Error removing parent:", error);
      res.status(500).json({ error: "Failed to remove parent" });
    }
  });

  // Secondary parent leaves (removes themselves)
  app.post("/api/parents/leave", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      // Verify current user is a secondary parent
      const isPrimary = await storage.isPrimaryParent(req.user.id);
      if (isPrimary) {
        return res.status(400).json({ error: "Primary parents cannot leave. Delete your account instead." });
      }
      
      // Get all children the user is associated with
      const children = await storage.getChildrenByParentId(req.user.id);
      
      // Remove user from all children
      for (const child of children) {
        await storage.deleteParentChildRelationship(req.user.id, child.id);
        
        // Also remove from parentIds array in children table
        const updatedParentIds = child.parentIds.filter(id => id !== req.user.id);
        await storage.updateChild(child.id, { parentIds: updatedParentIds });
      }
      
      res.json({ success: true, message: "Successfully left family" });
    } catch (error) {
      console.error("Error leaving family:", error);
      res.status(500).json({ error: "Failed to leave family" });
    }
  });

  // Create invitation (primary parent only)
  app.post("/api/invitations", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Verify current user is a primary parent
      const isPrimary = await storage.isPrimaryParent(req.user.id);
      if (!isPrimary) {
        return res.status(403).json({ error: "Only primary parents can invite other parents" });
      }
      
      // Check if email is already registered
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // Check if they're already a parent
        const children = await storage.getChildrenByParentId(req.user.id);
        if (children.length > 0) {
          const isAlreadyParent = children[0].parentIds.includes(existingUser.id);
          if (isAlreadyParent) {
            return res.status(400).json({ error: "This person is already a parent" });
          }
        }
      }
      
      // Check for pending invitation from THIS user (allow different families to invite the same email)
      const pendingInvitation = await storage.getPendingInvitationByEmailAndUser(email, req.user.id);
      if (pendingInvitation) {
        return res.status(400).json({ error: "You already have a pending invitation for this email" });
      }
      
      // Generate unique token
      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create invitation
      const invitation = await storage.createInvitation({
        email,
        invitedByUserId: req.user.id,
        token,
        status: "pending",
        expiresAt,
      });
      
      // Get inviter name for email
      const inviter = await storage.getUser(req.user.id);
      const inviterName = inviter?.firstName || inviter?.email || "A parent";
      
      // Get children count for message
      const children = await storage.getChildrenByParentId(req.user.id);
      
      // Generate invite link using the request's origin to ensure correct domain
      // This works for both development (dev domain) and production (custom domain)
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || req.hostname;
      const baseUrl = `${protocol}://${host}`;
      const inviteUrl = `${baseUrl}/invite/${token}`;
      
      res.json({ 
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
        },
        inviteUrl,
        message: `Share this link with ${email} to invite them as a co-parent.`,
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  // Get all invitations sent by current user
  app.get("/api/invitations", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const invitations = await storage.getInvitationsByUser(req.user.id);
      
      // Filter out sensitive data and check for expired invitations
      const now = new Date();
      const sanitizedInvitations = invitations.map(inv => {
        const isExpired = inv.expiresAt && new Date(inv.expiresAt) < now && inv.status === "pending";
        return {
          id: inv.id,
          email: inv.email,
          status: isExpired ? "expired" : inv.status,
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
          acceptedAt: inv.acceptedAt,
        };
      });
      
      res.json(sanitizedInvitations);
    } catch (error) {
      console.error("Error getting invitations:", error);
      res.status(500).json({ error: "Failed to get invitations" });
    }
  });

  // Revoke an invitation (primary parent only)
  app.delete("/api/invitations/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const invitation = await storage.getInvitation(req.params.id);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      if (invitation.invitedByUserId !== req.user.id) {
        return res.status(403).json({ error: "You can only revoke your own invitations" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ error: "Can only revoke pending invitations" });
      }
      
      await storage.revokeInvitation(req.params.id);
      res.json({ success: true, message: "Invitation revoked" });
    } catch (error) {
      console.error("Error revoking invitation:", error);
      res.status(500).json({ error: "Failed to revoke invitation" });
    }
  });

  // Validate invitation token (public - for registration page)
  app.get("/api/invitations/validate/:token", async (req, res) => {
    try {
      const invitation = await storage.getInvitationByToken(req.params.token);
      
      if (!invitation) {
        return res.status(404).json({ valid: false, error: "Invitation not found" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ valid: false, error: `Invitation has been ${invitation.status}` });
      }
      
      const now = new Date();
      if (invitation.expiresAt && new Date(invitation.expiresAt) < now) {
        return res.status(400).json({ valid: false, error: "Invitation has expired" });
      }
      
      // Get inviter info
      const inviter = await storage.getUser(invitation.invitedByUserId);
      const inviterName = inviter?.firstName 
        ? `${inviter.firstName}${inviter.lastName ? ' ' + inviter.lastName : ''}`
        : inviter?.email || "A parent";
      
      // Get children info
      const children = await storage.getChildrenByParentId(invitation.invitedByUserId);
      const childNames = children.map(c => c.name);
      
      res.json({ 
        valid: true,
        email: invitation.email,
        inviterName,
        childNames,
        childCount: children.length,
      });
    } catch (error) {
      console.error("Error validating invitation:", error);
      res.status(500).json({ valid: false, error: "Failed to validate invitation" });
    }
  });

  // Register via invitation (creates secondary parent)
  app.post("/api/auth/register-invited", async (req, res) => {
    try {
      const { token, email, password, firstName, lastName, medicalHistory } = req.body;
      
      if (!token || !email || !password) {
        return res.status(400).json({ error: "Token, email, and password are required" });
      }
      
      // Validate invitation
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ error: `Invitation has been ${invitation.status}` });
      }
      
      const now = new Date();
      if (invitation.expiresAt && new Date(invitation.expiresAt) < now) {
        return res.status(400).json({ error: "Invitation has expired" });
      }
      
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({ error: "Email does not match invitation" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered. Please login instead." });
      }
      
      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ 
        email, 
        password: hashedPassword 
      });
      
      // Update user with optional fields
      if (firstName || lastName || medicalHistory) {
        await storage.updateUser(user.id, {
          firstName: firstName || null,
          lastName: lastName || null,
          medicalHistory: medicalHistory || null,
          medicalHistoryUpdatedAt: medicalHistory ? new Date() : null,
        });
      }
      
      // Get inviter's children
      const children = await storage.getChildrenByParentId(invitation.invitedByUserId);
      
      // Add new user as secondary parent to all children
      for (const child of children) {
        // Add to parentIds array
        const updatedParentIds = [...child.parentIds, user.id];
        await storage.updateChild(child.id, { parentIds: updatedParentIds });
        
        // Create parent-child relationship
        await storage.createParentChildRelationship({
          userId: user.id,
          childId: child.id,
          role: "secondary",
        });
      }
      
      // Mark invitation as accepted
      await storage.updateInvitation(invitation.id, {
        status: "accepted",
        acceptedAt: new Date(),
        acceptedByUserId: user.id,
      });
      
      // Log the user in
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed after registration" });
        res.json({ 
          id: user.id, 
          email: user.email,
          role: "secondary",
          childCount: children.length,
        });
      });
    } catch (error) {
      console.error("Invited registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // GDPR Delete Account endpoint - permanently deletes all user data
  app.delete("/api/user/account", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required to delete account" });
      }
      
      // Verify password before deletion
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const bcrypt = await import("bcrypt");
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      // Check if user is primary or secondary parent
      const isPrimary = await storage.isPrimaryParent(req.user.id);
      
      if (isPrimary) {
        // Primary parent: Delete all user data including children (children cascade to milestones, metrics, etc.)
        const deleted = await storage.deleteUser(req.user.id);
        
        if (!deleted) {
          return res.status(500).json({ error: "Failed to delete account" });
        }
      } else {
        // Secondary parent: Only delete their user record and relationships, not the children
        await storage.deleteSecondaryParent(req.user.id);
      }
      
      // Destroy session
      req.logout((err) => {
        if (err) {
          console.error("Logout error during account deletion:", err);
        }
        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            console.error("Session destruction error:", sessionErr);
          }
          const message = isPrimary 
            ? "Account and all data permanently deleted"
            : "Account deleted. Family data has been preserved.";
          res.json({ success: true, message });
        });
      });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // PDF Report Generation endpoint
  app.post("/api/reports/pdf", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { childIds } = req.body;
      
      if (!Array.isArray(childIds) || childIds.length === 0) {
        return res.status(400).json({ error: "childIds array is required" });
      }

      // Verify user has access to all requested children
      const userChildren = await storage.getChildrenByParentId(req.user.id);
      const userChildIds = new Set(userChildren.map(c => c.id));
      
      for (const childId of childIds) {
        if (!userChildIds.has(childId)) {
          return res.status(403).json({ error: "Access denied to one or more children" });
        }
      }

      // Get children data
      const childrenToReport = await Promise.all(
        childIds.map(async (childId: string) => {
          const child = await storage.getChild(childId);
          if (!child) return null;
          
          const adjustedAge = calculateAdjustedAge(child.dueDate);
          const adjustedMonths = getAdjustedMonthsForRange(
            adjustedAge.years * 12 + adjustedAge.months,
            adjustedAge.days
          );
          const ageRange = getAgeRange(adjustedMonths);
          
          const milestones = await storage.getMilestonesByAgeRange(ageRange.min, ageRange.max);
          const childMilestones = await storage.getChildMilestones(childId);
          const growthMetrics = await storage.getGrowthMetrics(childId);
          
          const achievedMilestoneIds = new Set(
            childMilestones.filter(cm => cm.achieved).map(cm => cm.milestoneId)
          );

          const categories = ['Developmental', 'Teeth', 'Vision', 'Hearing', 'Growth'] as const;
          const categoryProgress = categories.map(category => {
            const categoryMilestones = milestones.filter(m => m.category === category);
            const achievedCount = categoryMilestones.filter(m => achievedMilestoneIds.has(m.id)).length;
            return {
              category,
              total: categoryMilestones.length,
              achieved: achievedCount,
              percentage: categoryMilestones.length > 0 ? Math.round((achievedCount / categoryMilestones.length) * 100) : 0,
            };
          }).filter(c => c.total > 0);

          const achievedMilestones = milestones.filter(m => achievedMilestoneIds.has(m.id));
          const pendingMilestones = milestones.filter(m => !achievedMilestoneIds.has(m.id));

          return {
            child,
            adjustedAge,
            ageRange,
            categoryProgress,
            achievedMilestones,
            pendingMilestones,
            childMilestones,
            growthMetrics,
          };
        })
      );

      const validChildren = childrenToReport.filter(c => c !== null);

      if (validChildren.length === 0) {
        return res.status(404).json({ error: "No valid children found" });
      }

      // Create PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="toddl-report-${new Date().toISOString().split('T')[0]}.pdf"`);
      
      doc.pipe(res);

      // Brand colors (from design)
      const primaryColor = '#30334d';
      const accentColor = '#7c6aaa';
      const mutedColor = '#6b7280';
      const successColor = '#059669';
      const warningColor = '#d97706';

      // Title Page / Header
      doc.fontSize(24).fillColor(primaryColor).text('Toddl', { align: 'center' });
      doc.fontSize(10).fillColor(mutedColor).text('Child Development Tracker', { align: 'center' });
      doc.moveDown(0.5);
      
      doc.fontSize(18).fillColor(primaryColor).text('Developmental Progress Report', { align: 'center' });
      doc.fontSize(10).fillColor(mutedColor).text(`Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });
      doc.moveDown(1);

      // Disclaimer Box
      doc.rect(50, doc.y, 495, 80).fillAndStroke('#fef3c7', '#f59e0b');
      const disclaimerY = doc.y + 10;
      doc.fontSize(9).fillColor('#92400e');
      doc.text('IMPORTANT DISCLAIMER', 60, disclaimerY, { width: 475 });
      doc.fontSize(8).fillColor('#78350f');
      doc.text(
        'This report is a summary of what has been entered and tracked in Toddl. It is intended solely for sharing with your GP or paediatrician as a reference. Please do not use this report for self-diagnosis or to make medical decisions. Always consult a qualified healthcare professional for medical advice.',
        60, disclaimerY + 15, { width: 475 }
      );
      doc.y = disclaimerY + 75;
      doc.moveDown(1);

      // Generate report for each child
      for (let i = 0; i < validChildren.length; i++) {
        const data = validChildren[i]!;
        
        if (i > 0) {
          doc.addPage();
        }

        // Child Header
        doc.fontSize(16).fillColor(primaryColor).text(data.child.name);
        
        const ageText = data.adjustedAge.years > 0
          ? `${data.adjustedAge.years} year${data.adjustedAge.years > 1 ? 's' : ''}, ${data.adjustedAge.months} month${data.adjustedAge.months !== 1 ? 's' : ''}`
          : `${data.adjustedAge.months} month${data.adjustedAge.months !== 1 ? 's' : ''}, ${data.adjustedAge.days} day${data.adjustedAge.days !== 1 ? 's' : ''}`;
        
        doc.fontSize(10).fillColor(mutedColor).text(`Adjusted Age: ${ageText}`);
        doc.fontSize(10).fillColor(mutedColor).text(`Due Date: ${new Date(data.child.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`);
        if (data.child.gender) {
          doc.text(`Gender: ${data.child.gender.charAt(0).toUpperCase() + data.child.gender.slice(1)}`);
        }
        doc.text(`Current Milestone Range: ${data.ageRange.label}`);
        doc.moveDown(0.5);

        // Growth Metrics
        if (data.growthMetrics.length > 0) {
          doc.fontSize(12).fillColor(primaryColor).text('Latest Growth Measurements');
          doc.moveDown(0.3);
          
          const latestWeight = data.growthMetrics
            .filter(m => m.type === 'weight')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          const latestHeight = data.growthMetrics
            .filter(m => m.type === 'height')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          const latestHead = data.growthMetrics
            .filter(m => m.type === 'head_circumference')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

          doc.fontSize(9).fillColor(mutedColor);
          if (latestWeight) {
            doc.text(`Weight: ${latestWeight.value} kg${latestWeight.percentile ? ` (${Math.round(latestWeight.percentile)}th percentile)` : ''}`);
          }
          if (latestHeight) {
            doc.text(`Height: ${latestHeight.value} cm${latestHeight.percentile ? ` (${Math.round(latestHeight.percentile)}th percentile)` : ''}`);
          }
          if (latestHead) {
            doc.text(`Head Circumference: ${latestHead.value} cm${latestHead.percentile ? ` (${Math.round(latestHead.percentile)}th percentile)` : ''}`);
          }
          doc.moveDown(0.5);
        }

        // Progress Summary
        doc.fontSize(12).fillColor(primaryColor).text('Progress Summary');
        doc.moveDown(0.3);
        
        for (const progress of data.categoryProgress) {
          doc.fontSize(9).fillColor(mutedColor);
          doc.text(`${progress.category}: ${progress.achieved}/${progress.total} (${progress.percentage}%)`);
        }
        doc.moveDown(0.5);

        // Achieved Milestones
        doc.fontSize(12).fillColor(successColor).text(`Achieved Milestones (${data.achievedMilestones.length})`);
        doc.moveDown(0.3);
        
        if (data.achievedMilestones.length > 0) {
          doc.fontSize(8).fillColor(mutedColor);
          for (const milestone of data.achievedMilestones) {
            const childMilestone = data.childMilestones.find(cm => cm.milestoneId === milestone.id && cm.achieved);
            let text = `✓ ${milestone.title} (${milestone.category})`;
            if (childMilestone?.achievedAt) {
              text += ` - ${new Date(childMilestone.achievedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            }
            doc.text(text, { continued: false });
          }
        } else {
          doc.fontSize(8).fillColor(mutedColor).text('No milestones achieved yet in this age range.');
        }
        doc.moveDown(0.5);

        // Pending Milestones
        doc.fontSize(12).fillColor(warningColor).text(`Pending Milestones (${data.pendingMilestones.length})`);
        doc.moveDown(0.3);
        
        if (data.pendingMilestones.length > 0) {
          doc.fontSize(8).fillColor(mutedColor);
          for (const milestone of data.pendingMilestones) {
            doc.text(`○ ${milestone.title} (${milestone.category})`, { continued: false });
          }
        } else {
          doc.fontSize(8).fillColor(successColor).text('All milestones achieved for this age range!');
        }
      }

      // Footer on last page
      doc.moveDown(2);
      doc.fontSize(8).fillColor(mutedColor);
      doc.text('—', { align: 'center' });
      doc.text('Report generated by Toddl - Child Development Tracker', { align: 'center' });
      doc.text('toddl.health', { align: 'center' });

      doc.end();
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF report" });
    }
  });

  // Streak routes
  app.get("/api/streaks/activities", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const ageMonths = req.query.ageMonths ? parseInt(req.query.ageMonths as string) : undefined;
      const activities = await storage.getStreakActivities(ageMonths);
      res.json(activities);
    } catch (error) {
      console.error("Get streak activities error:", error);
      res.status(500).json({ error: "Failed to get activities" });
    }
  });

  app.get("/api/children/:childId/streaks", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const child = await storage.getChild(req.params.childId);
      if (!child || !child.parentIds.includes(req.user.id)) {
        return res.status(404).json({ error: "Child not found" });
      }

      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      const dailyStreaks = await storage.getDailyStreaks(req.params.childId, startDate, endDate);
      
      // Calculate streak statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Sort streaks by date ascending for calculation
      const sortedStreaks = [...dailyStreaks].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date(today);
      
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasStreak = sortedStreaks.some(s => s.date === dateStr);
        
        if (hasStreak) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      let prevDate: Date | null = null;
      
      for (const streak of sortedStreaks) {
        const streakDate = new Date(streak.date);
        
        if (prevDate) {
          const diffDays = Math.round((streakDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        prevDate = streakDate;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      
      res.json({
        currentStreak,
        longestStreak,
        totalDays: dailyStreaks.length,
        streaks: dailyStreaks,
      });
    } catch (error) {
      console.error("Get streaks error:", error);
      res.status(500).json({ error: "Failed to get streaks" });
    }
  });

  app.post("/api/children/:childId/streaks", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const child = await storage.getChild(req.params.childId);
      if (!child || !child.parentIds.includes(req.user.id)) {
        return res.status(404).json({ error: "Child not found" });
      }

      const schema = z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        activityId: z.string().optional().nullable(), // This is the milestoneId
        activityTitle: z.string().optional().nullable(),
        activityDescription: z.string().optional().nullable(),
        activityCitations: z.array(z.object({
          source: z.string(),
          url: z.string().optional(),
        })).optional().nullable(),
        notes: z.string().optional().nullable(),
      });
      
      const data = schema.parse(req.body);
      
      // Check if streak already exists for this date
      const existing = await storage.getDailyStreakByDate(req.params.childId, data.date);
      if (existing) {
        return res.status(400).json({ error: "Streak already recorded for this date" });
      }
      
      const streak = await storage.createDailyStreak({
        childId: req.params.childId,
        date: data.date,
        activityId: null, // Don't use milestoneId as activityId - it references streak_activities table
        activityTitle: data.activityTitle || null,
        notes: data.notes || null,
      });
      
      // Also mark the activity as completed in milestone recommendations
      if (data.activityId && data.activityTitle && data.activityDescription) {
        try {
          // Check if already marked as complete to avoid duplicates
          const existingCompleted = await storage.getCompletedRecommendations(req.params.childId, data.activityId);
          const alreadyCompleted = existingCompleted.some(c => c.recommendationTitle === data.activityTitle);
          
          if (!alreadyCompleted) {
            await storage.createCompletedRecommendation({
              childId: req.params.childId,
              milestoneId: data.activityId,
              recommendationTitle: data.activityTitle,
              recommendationDescription: data.activityDescription,
              citations: data.activityCitations || [],
            });
          }
        } catch (syncError) {
          // Don't fail the streak creation if sync fails
          console.log("Note: Could not sync to completed recommendations:", syncError);
        }
      }
      
      res.status(201).json(streak);
    } catch (error) {
      console.error("Create streak error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create streak" });
    }
  });

  app.delete("/api/children/:childId/streaks/:date", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const child = await storage.getChild(req.params.childId);
      if (!child || !child.parentIds.includes(req.user.id)) {
        return res.status(404).json({ error: "Child not found" });
      }

      const deleted = await storage.deleteDailyStreak(req.params.childId, req.params.date);
      if (!deleted) {
        return res.status(404).json({ error: "Streak not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete streak error:", error);
      res.status(500).json({ error: "Failed to delete streak" });
    }
  });

  // Helper function to generate AI recommendations for a milestone
  async function generateRecommendationsForMilestone(
    childId: string,
    milestoneId: string,
    userId: string
  ): Promise<Array<{ title: string; description: string; citations?: Array<{ source: string; url?: string }> }>> {
    if (!anthropic) return [];
    
    try {
      const child = await storage.getChild(childId);
      const milestone = await storage.getMilestone(milestoneId);
      const parent = await storage.getUser(userId);
      
      if (!child || !milestone || !parent) return [];
      
      const childAgeInMonths = getAgeInMonthsForAI(child.dueDate);
      const prompt = `You are a pediatric development expert. Based on the following information, provide 3-4 practical, personalized recommendations for how parents can help their child achieve this milestone.

Child Information:
- Age: ${childAgeInMonths} months (adjusted for prematurity/post-maturity if applicable)
- Medical History: ${JSON.stringify(child.medicalHistory || {})}

Parent Information:
- Medical History: ${JSON.stringify(parent.medicalHistory || {})}

Milestone:
- Title: ${milestone.title}
- Category: ${milestone.category}
- Description: ${milestone.description}

IMPORTANT: Base your recommendations on established pediatric guidelines from authoritative sources such as:
- CDC (Centers for Disease Control and Prevention) developmental milestone guidelines
- AAP (American Academy of Pediatrics) recommendations
- WHO (World Health Organization) child development standards

Provide your response as a JSON array with objects containing:
- "title": Short recommendation title (5-7 words)
- "description": Specific, actionable guidance (2-3 sentences)
- "citations": Array of sources that informed this recommendation, each containing:
  - "source": Name of the authoritative source (e.g., "CDC Developmental Milestones", "AAP Guidelines")
  - "url": (optional) Direct link to the guideline if applicable

Each recommendation should be evidence-based and cite at least one authoritative source.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      let recommendations: Array<{ title: string; description: string; citations?: Array<{ source: string; url?: string }> }> = [];
      
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
        }
      }

      // Cache the recommendations
      const childDataVersion = child.medicalHistoryUpdatedAt || new Date(0);
      const parentDataVersion = parent.medicalHistoryUpdatedAt || new Date(0);
      
      await storage.createAiRecommendation({
        childId,
        milestoneId,
        recommendations,
        childDataVersion,
        parentDataVersion,
      });

      return recommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return [];
    }
  }

  // Get streak activity recommendations from incomplete milestones
  app.get("/api/children/:childId/streak-activities", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const child = await storage.getChild(req.params.childId);
      if (!child || !child.parentIds.includes(req.user.id)) {
        return res.status(404).json({ error: "Child not found" });
      }

      // Calculate child's age to get relevant milestones
      const adjustedAge = calculateAdjustedAge(child.dueDate);
      const baseMonths = adjustedAge.years * 12 + adjustedAge.months;
      const ageInMonths = getAdjustedMonthsForRange(baseMonths, adjustedAge.days);
      const ageRange = getAgeRange(ageInMonths);
      
      if (!ageRange) {
        return res.json([]);
      }

      // Get milestones in the child's age range
      const allMilestones = await storage.getMilestonesByAgeRange(ageRange.min, ageRange.max);
      
      // Get child's completed milestones
      const childMilestones = await storage.getChildMilestones(req.params.childId);
      const completedMilestoneIds = new Set(
        childMilestones.filter(cm => cm.achieved).map(cm => cm.milestoneId)
      );
      
      // Filter to incomplete developmental milestones only
      const incompleteMilestones = allMilestones.filter(m => 
        !completedMilestoneIds.has(m.id) && 
        m.category?.toLowerCase() === 'developmental'
      );
      
      // Collect ALL individual activities from cached recommendations
      const allActivities: Array<{
        milestoneId: string;
        milestoneTitle: string;
        milestoneSubcategory: string | null;
        activity: {
          title: string;
          description: string;
          citations?: Array<{ source: string; url?: string }>;
        };
      }> = [];
      
      // Get recommendations from cache - collect all individual activities
      for (const milestone of incompleteMilestones.slice(0, 20)) {
        const cached = await storage.getAiRecommendation(req.params.childId, milestone.id);
        if (cached?.recommendations && Array.isArray(cached.recommendations)) {
          // Add ALL recommendations from this milestone
          for (const rec of cached.recommendations) {
            if (rec && rec.title && rec.description) {
              allActivities.push({
                milestoneId: milestone.id,
                milestoneTitle: milestone.title,
                milestoneSubcategory: milestone.subcategory || null,
                activity: rec,
              });
            }
          }
        }
      }
      
      // If no cached activities, generate for a few random milestones
      if (allActivities.length === 0 && incompleteMilestones.length > 0) {
        // Pick up to 3 random milestones from different subcategories
        const bySubcat = new Map<string, typeof incompleteMilestones[0]>();
        for (const m of incompleteMilestones) {
          const key = m.subcategory || m.category || 'General';
          if (!bySubcat.has(key)) {
            bySubcat.set(key, m);
          }
        }
        
        const milestonesToGenerate = Array.from(bySubcat.values()).slice(0, 3);
        
        for (const milestone of milestonesToGenerate) {
          const recommendations = await generateRecommendationsForMilestone(
            req.params.childId,
            milestone.id,
            req.user.id
          );
          
          for (const rec of recommendations) {
            if (rec && rec.title && rec.description) {
              allActivities.push({
                milestoneId: milestone.id,
                milestoneTitle: milestone.title,
                milestoneSubcategory: milestone.subcategory || null,
                activity: rec,
              });
            }
          }
        }
      }
      
      // If we have activities, pick 5 from different subcategories for variety
      if (allActivities.length > 0) {
        // Group by subcategory
        const bySubcategory = new Map<string, typeof allActivities>();
        for (const item of allActivities) {
          const key = item.milestoneSubcategory || 'General';
          if (!bySubcategory.has(key)) {
            bySubcategory.set(key, []);
          }
          bySubcategory.get(key)!.push(item);
        }
        
        // Pick activities round-robin from each subcategory
        const result: typeof allActivities = [];
        const subcategories = Array.from(bySubcategory.keys());
        let subcatIndex = 0;
        
        while (result.length < 5 && subcategories.length > 0) {
          const key = subcategories[subcatIndex % subcategories.length];
          const activities = bySubcategory.get(key)!;
          
          if (activities.length > 0) {
            // Pick a random activity from this subcategory
            const randomIndex = Math.floor(Math.random() * activities.length);
            result.push(activities.splice(randomIndex, 1)[0]);
          }
          
          // Remove empty subcategories
          if (activities.length === 0) {
            subcategories.splice(subcatIndex % subcategories.length, 1);
          } else {
            subcatIndex++;
          }
        }
        
        res.json(result);
        return;
      }
      
      // No milestones available
      res.json([]);
    } catch (error) {
      console.error("Get streak activities error:", error);
      res.status(500).json({ error: "Failed to get streak activities" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
