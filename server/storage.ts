import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and, desc } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
import {
  type User,
  type InsertUser,
  type Child,
  type InsertChild,
  type Milestone,
  type InsertMilestone,
  type ChildMilestone,
  type InsertChildMilestone,
  type GrowthMetric,
  type InsertGrowthMetric,
  type Tooth,
  type InsertTooth,
  type AiRecommendation,
  type InsertAiRecommendation,
  type CompletedRecommendation,
  type InsertCompletedRecommendation,
  type DismissedToyRecommendation,
  type InsertDismissedToyRecommendation,
  type AiToyRecommendation,
  type InsertAiToyRecommendation,
  users,
  children,
  milestones,
  childMilestones,
  growthMetrics,
  teeth,
  aiRecommendations,
  completedRecommendations,
  dismissedToyRecommendations,
  aiToyRecommendations,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserMedicalHistory(userId: string, medicalHistory: any): Promise<User | undefined>;
  updateUser(userId: string, data: Partial<User>): Promise<User | undefined>;

  // Child operations
  getChild(id: string): Promise<Child | undefined>;
  getChildrenByParentId(parentId: string): Promise<Child[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(childId: string, data: Partial<Child>): Promise<Child | undefined>;
  updateChildMedicalHistory(childId: string, medicalHistory: any): Promise<Child | undefined>;

  // Milestone operations
  getMilestone(id: string): Promise<Milestone | undefined>;
  getAllMilestones(): Promise<Milestone[]>;
  getMilestonesByAgeRange(minMonths: number, maxMonths: number): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;

  // Child milestone operations
  getChildMilestoneById(id: string): Promise<ChildMilestone | undefined>;
  getChildMilestone(childId: string, milestoneId: string): Promise<ChildMilestone | undefined>;
  getChildMilestones(childId: string): Promise<ChildMilestone[]>;
  createChildMilestone(childMilestone: InsertChildMilestone): Promise<ChildMilestone>;
  updateChildMilestone(id: string, data: Partial<ChildMilestone>): Promise<ChildMilestone | undefined>;

  // Growth metric operations
  getGrowthMetrics(childId: string, type?: string): Promise<GrowthMetric[]>;
  createGrowthMetric(metric: InsertGrowthMetric): Promise<GrowthMetric>;

  // Teeth operations
  getTooth(id: string): Promise<Tooth | undefined>;
  getTeeth(childId: string): Promise<Tooth[]>;
  createTooth(tooth: InsertTooth): Promise<Tooth>;
  updateTooth(id: string, data: Partial<Tooth>): Promise<Tooth | undefined>;

  // AI recommendation operations
  getAiRecommendation(childId: string, milestoneId: string): Promise<AiRecommendation | undefined>;
  createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation>;

  // Completed recommendation operations
  getCompletedRecommendations(childId: string, milestoneId?: string): Promise<CompletedRecommendation[]>;
  createCompletedRecommendation(completed: InsertCompletedRecommendation): Promise<CompletedRecommendation>;
  deleteCompletedRecommendation(childId: string, milestoneId: string, recommendationTitle: string): Promise<void>;

  // Dismissed toy recommendation operations
  getDismissedToyRecommendations(childId: string, milestoneId: string): Promise<DismissedToyRecommendation[]>;
  createDismissedToyRecommendation(dismissed: InsertDismissedToyRecommendation): Promise<DismissedToyRecommendation>;

  // AI toy recommendation operations
  getAiToyRecommendation(childId: string, milestoneId: string): Promise<AiToyRecommendation | undefined>;
  createAiToyRecommendation(recommendation: InsertAiToyRecommendation): Promise<AiToyRecommendation>;
}

export class DbStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserMedicalHistory(userId: string, medicalHistory: any): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({
        medicalHistory,
        medicalHistoryUpdatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Child operations
  async getChild(id: string): Promise<Child | undefined> {
    const result = await this.db.select().from(children).where(eq(children.id, id));
    return result[0];
  }

  async getChildrenByParentId(parentId: string): Promise<Child[]> {
    const result = await this.db.select().from(children);
    return result.filter((child) => child.parentIds.includes(parentId));
  }

  async createChild(child: InsertChild): Promise<Child> {
    const result = await this.db.insert(children).values(child as any).returning();
    return result[0];
  }

  async updateChild(childId: string, data: Partial<Child>): Promise<Child | undefined> {
    const result = await this.db
      .update(children)
      .set(data)
      .where(eq(children.id, childId))
      .returning();
    return result[0];
  }

  async updateChildMedicalHistory(childId: string, medicalHistory: any): Promise<Child | undefined> {
    const result = await this.db
      .update(children)
      .set({
        medicalHistory,
        medicalHistoryUpdatedAt: new Date(),
      })
      .where(eq(children.id, childId))
      .returning();
    return result[0];
  }

  // Milestone operations
  async getMilestone(id: string): Promise<Milestone | undefined> {
    const result = await this.db.select().from(milestones).where(eq(milestones.id, id));
    return result[0];
  }

  async getAllMilestones(): Promise<Milestone[]> {
    return await this.db.select().from(milestones);
  }

  async getMilestonesByAgeRange(minMonths: number, maxMonths: number): Promise<Milestone[]> {
    const result = await this.db.select().from(milestones);
    return result.filter(
      (m) => m.ageRangeMonthsMin <= maxMonths && m.ageRangeMonthsMax >= minMonths
    );
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const result = await this.db.insert(milestones).values(milestone).returning();
    return result[0];
  }

  // Child milestone operations
  async getChildMilestoneById(id: string): Promise<ChildMilestone | undefined> {
    const result = await this.db.select().from(childMilestones).where(eq(childMilestones.id, id));
    return result[0];
  }

  async getChildMilestone(childId: string, milestoneId: string): Promise<ChildMilestone | undefined> {
    const result = await this.db
      .select()
      .from(childMilestones)
      .where(and(eq(childMilestones.childId, childId), eq(childMilestones.milestoneId, milestoneId)));
    return result[0];
  }

  async getChildMilestones(childId: string): Promise<ChildMilestone[]> {
    return await this.db.select().from(childMilestones).where(eq(childMilestones.childId, childId));
  }

  async createChildMilestone(childMilestone: InsertChildMilestone): Promise<ChildMilestone> {
    const result = await this.db.insert(childMilestones).values(childMilestone).returning();
    return result[0];
  }

  async updateChildMilestone(id: string, data: Partial<ChildMilestone>): Promise<ChildMilestone | undefined> {
    const result = await this.db
      .update(childMilestones)
      .set(data)
      .where(eq(childMilestones.id, id))
      .returning();
    return result[0];
  }

  // Growth metric operations
  async getGrowthMetrics(childId: string, type?: string): Promise<GrowthMetric[]> {
    const query = this.db
      .select()
      .from(growthMetrics)
      .where(eq(growthMetrics.childId, childId))
      .orderBy(desc(growthMetrics.date));

    const result = await query;
    return type ? result.filter((m) => m.type === type) : result;
  }

  async createGrowthMetric(metric: InsertGrowthMetric): Promise<GrowthMetric> {
    const result = await this.db.insert(growthMetrics).values(metric).returning();
    return result[0];
  }

  // Teeth operations
  async getTooth(id: string): Promise<Tooth | undefined> {
    const result = await this.db.select().from(teeth).where(eq(teeth.id, id));
    return result[0];
  }

  async getTeeth(childId: string): Promise<Tooth[]> {
    return await this.db.select().from(teeth).where(eq(teeth.childId, childId));
  }

  async createTooth(tooth: InsertTooth): Promise<Tooth> {
    const result = await this.db.insert(teeth).values(tooth).returning();
    return result[0];
  }

  async updateTooth(id: string, data: Partial<Tooth>): Promise<Tooth | undefined> {
    const result = await this.db
      .update(teeth)
      .set(data)
      .where(eq(teeth.id, id))
      .returning();
    return result[0];
  }

  // AI recommendation operations
  async getAiRecommendation(childId: string, milestoneId: string): Promise<AiRecommendation | undefined> {
    const result = await this.db
      .select()
      .from(aiRecommendations)
      .where(
        and(
          eq(aiRecommendations.childId, childId),
          eq(aiRecommendations.milestoneId, milestoneId)
        )
      )
      .orderBy(desc(aiRecommendations.generatedAt));
    return result[0];
  }

  async createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation> {
    const result = await this.db.insert(aiRecommendations).values(recommendation as any).returning();
    return result[0];
  }

  // Completed recommendation operations
  async getCompletedRecommendations(childId: string, milestoneId?: string): Promise<CompletedRecommendation[]> {
    if (milestoneId) {
      return await this.db
        .select()
        .from(completedRecommendations)
        .where(
          and(
            eq(completedRecommendations.childId, childId),
            eq(completedRecommendations.milestoneId, milestoneId)
          )
        );
    }
    return await this.db
      .select()
      .from(completedRecommendations)
      .where(eq(completedRecommendations.childId, childId));
  }

  async createCompletedRecommendation(completed: InsertCompletedRecommendation): Promise<CompletedRecommendation> {
    const result = await this.db.insert(completedRecommendations).values(completed).returning();
    return result[0];
  }

  async deleteCompletedRecommendation(childId: string, milestoneId: string, recommendationTitle: string): Promise<void> {
    await this.db
      .delete(completedRecommendations)
      .where(
        and(
          eq(completedRecommendations.childId, childId),
          eq(completedRecommendations.milestoneId, milestoneId),
          eq(completedRecommendations.recommendationTitle, recommendationTitle)
        )
      );
  }

  // Dismissed toy recommendation operations
  async getDismissedToyRecommendations(childId: string, milestoneId: string): Promise<DismissedToyRecommendation[]> {
    return await this.db
      .select()
      .from(dismissedToyRecommendations)
      .where(
        and(
          eq(dismissedToyRecommendations.childId, childId),
          eq(dismissedToyRecommendations.milestoneId, milestoneId)
        )
      );
  }

  async createDismissedToyRecommendation(dismissed: InsertDismissedToyRecommendation): Promise<DismissedToyRecommendation> {
    const result = await this.db.insert(dismissedToyRecommendations).values(dismissed).returning();
    return result[0];
  }

  // AI toy recommendation operations
  async getAiToyRecommendation(childId: string, milestoneId: string): Promise<AiToyRecommendation | undefined> {
    const result = await this.db
      .select()
      .from(aiToyRecommendations)
      .where(
        and(
          eq(aiToyRecommendations.childId, childId),
          eq(aiToyRecommendations.milestoneId, milestoneId)
        )
      );
    return result[0];
  }

  async createAiToyRecommendation(recommendation: InsertAiToyRecommendation): Promise<AiToyRecommendation> {
    const result = await this.db.insert(aiToyRecommendations).values(recommendation as any).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
