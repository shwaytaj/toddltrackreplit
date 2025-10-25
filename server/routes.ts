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
import { getAgeInMonthsForAI } from "./age-utils";

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

  app.patch("/api/children/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const child = await storage.getChild(req.params.id);
    if (!child) return res.status(404).json({ error: "Child not found" });
    
    if (!child.parentIds.includes(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    try {
      const updateChildSchema = z.object({
        name: z.string().optional(),
        birthDate: z.string().optional(),
        dueDate: z.string().nullable().optional(),
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

      // Build exclusion text for prompt if there are completed recommendations
      const exclusionText = excludeCompletedTitles.length > 0 
        ? `\n\nIMPORTANT: The parents have already tried the following recommendations. Please provide NEW, DIFFERENT recommendations that build upon or complement these completed activities:\n${excludeCompletedTitles.map((title: string, idx: number) => `${idx + 1}. ${title}`).join('\n')}`
        : '';

      // Generate new recommendations with Claude
      const childAgeInMonths = getAgeInMonthsForAI(child.birthDate, child.dueDate);
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

      // Generate new toy recommendations with Claude (more recommendations now)
      const childAgeInMonths = getAgeInMonthsForAI(child.birthDate, child.dueDate);
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

  const httpServer = createServer(app);

  return httpServer;
}
