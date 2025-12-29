import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and, or, desc, isNull } from "drizzle-orm";
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
  type ParentChildRelationship,
  type InsertParentChildRelationship,
  type Invitation,
  type InsertInvitation,
  type ParentRole,
  type StreakActivity,
  type InsertStreakActivity,
  type DailyStreak,
  type InsertDailyStreak,
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
  parentChildRelationships,
  invitations,
  streakActivities,
  dailyStreaks,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserMedicalHistory(userId: string, medicalHistory: any): Promise<User | undefined>;
  updateUser(userId: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(userId: string): Promise<boolean>;

  // Child operations
  getChild(id: string): Promise<Child | undefined>;
  getChildrenByParentId(parentId: string): Promise<Child[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(childId: string, data: Partial<Child>): Promise<Child | undefined>;
  updateChildMedicalHistory(childId: string, medicalHistory: any): Promise<Child | undefined>;
  deleteChild(childId: string): Promise<boolean>;

  // Milestone operations
  getMilestone(id: string): Promise<Milestone | undefined>;
  getAllMilestones(): Promise<Milestone[]>;
  getMilestonesByAgeRange(minMonths: number, maxMonths: number, sources?: string[]): Promise<Milestone[]>;
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

  // Parent-child relationship operations
  getParentRole(userId: string, childId: string): Promise<ParentRole | undefined>;
  getUserParentRoles(userId: string): Promise<ParentChildRelationship[]>;
  getChildParents(childId: string): Promise<Array<ParentChildRelationship & { user: User }>>;
  createParentChildRelationship(relationship: InsertParentChildRelationship): Promise<ParentChildRelationship>;
  deleteParentChildRelationship(userId: string, childId: string): Promise<boolean>;
  isPrimaryParent(userId: string): Promise<boolean>;
  deleteSecondaryParent(userId: string): Promise<boolean>;

  // Invitation operations
  getInvitation(id: string): Promise<Invitation | undefined>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  getInvitationsByUser(userId: string): Promise<Invitation[]>;
  getPendingInvitationByEmail(email: string): Promise<Invitation | undefined>;
  getPendingInvitationByEmailAndUser(email: string, userId: string): Promise<Invitation | undefined>;
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  updateInvitation(id: string, data: Partial<Invitation>): Promise<Invitation | undefined>;
  revokeInvitation(id: string): Promise<boolean>;

  // Streak operations
  getStreakActivities(ageMonths?: number): Promise<StreakActivity[]>;
  createStreakActivity(activity: InsertStreakActivity): Promise<StreakActivity>;
  getDailyStreaks(childId: string, startDate?: string, endDate?: string): Promise<DailyStreak[]>;
  getDailyStreakByDate(childId: string, date: string): Promise<DailyStreak | undefined>;
  createDailyStreak(streak: InsertDailyStreak): Promise<DailyStreak>;
  deleteDailyStreak(childId: string, date: string): Promise<boolean>;
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

  async deleteUser(userId: string): Promise<boolean> {
    // First, get all children belonging to this user
    const userChildren = await this.getChildrenByParentId(userId);
    
    // Delete all children and their related data
    for (const child of userChildren) {
      await this.deleteChild(child.id);
    }
    
    // Delete the user record
    const result = await this.db.delete(users).where(eq(users.id, userId)).returning();
    return result.length > 0;
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

  async deleteChild(childId: string): Promise<boolean> {
    // Delete all related data first (child milestones, growth metrics, recommendations, etc.)
    await this.db.delete(childMilestones).where(eq(childMilestones.childId, childId));
    await this.db.delete(growthMetrics).where(eq(growthMetrics.childId, childId));
    await this.db.delete(teeth).where(eq(teeth.childId, childId));
    await this.db.delete(aiRecommendations).where(eq(aiRecommendations.childId, childId));
    await this.db.delete(completedRecommendations).where(eq(completedRecommendations.childId, childId));
    await this.db.delete(dismissedToyRecommendations).where(eq(dismissedToyRecommendations.childId, childId));
    await this.db.delete(aiToyRecommendations).where(eq(aiToyRecommendations.childId, childId));
    
    // Delete the child record
    const result = await this.db.delete(children).where(eq(children.id, childId)).returning();
    return result.length > 0;
  }

  // Milestone operations
  async getMilestone(id: string): Promise<Milestone | undefined> {
    const result = await this.db.select().from(milestones).where(eq(milestones.id, id));
    return result[0];
  }

  async getAllMilestones(): Promise<Milestone[]> {
    // Filter out legacy milestones - only show canonical milestones
    // Treat NULL as false for backward compatibility
    return await this.db.select().from(milestones).where(
      or(eq(milestones.isLegacy, false), isNull(milestones.isLegacy))
    );
  }

  async getMilestonesByAgeRange(minMonths: number, maxMonths: number, sources?: string[]): Promise<Milestone[]> {
    // Treat NULL as false for backward compatibility
    const result = await this.db.select().from(milestones).where(
      or(eq(milestones.isLegacy, false), isNull(milestones.isLegacy))
    );
    return result.filter((m) => {
      // Age range filter
      const ageMatch = m.ageRangeMonthsMin <= maxMonths && m.ageRangeMonthsMax >= minMonths;
      
      // If no source filter specified, just use age filter
      if (!sources || sources.length === 0) {
        return ageMatch;
      }
      
      // Source filter is specified - only show milestones that have matching sources
      if (m.sources && m.sources.length > 0) {
        // Parse sources if it's a string (Postgres text[] returns as string without arrayMode)
        const milestoneSources = Array.isArray(m.sources) 
          ? m.sources 
          : this.parsePostgresArray(m.sources as unknown as string);
        
        // Show milestone if it appears in ANY of the selected sources
        const sourceMatch = milestoneSources.some(source => sources.includes(source));
        return ageMatch && sourceMatch;
      }
      
      // Milestone has no sources - don't show it when user has source preferences
      return false;
    });
  }

  // Helper to parse Postgres array strings like "{HSE,NHS}" into ["HSE", "NHS"]
  private parsePostgresArray(value: string): string[] {
    if (!value || typeof value !== 'string') return [];
    // Remove curly braces and split by comma
    const cleaned = value.replace(/^\{/, '').replace(/\}$/, '');
    if (!cleaned) return [];
    return cleaned.split(',').map(s => s.trim().replace(/^"/, '').replace(/"$/, ''));
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
    const result = await this.db.insert(completedRecommendations).values(completed as any).returning();
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

  // Parent-child relationship operations
  async getParentRole(userId: string, childId: string): Promise<ParentRole | undefined> {
    // First check explicit relationships
    const result = await this.db
      .select()
      .from(parentChildRelationships)
      .where(
        and(
          eq(parentChildRelationships.userId, userId),
          eq(parentChildRelationships.childId, childId)
        )
      );
    
    if (result[0]) {
      return result[0].role as ParentRole;
    }
    
    // For legacy users without relationship records:
    // If they have this child in their parentIds array, treat them as primary
    const child = await this.getChild(childId);
    if (child && child.parentIds.includes(userId)) {
      return "primary";
    }
    
    return undefined;
  }

  async getUserParentRoles(userId: string): Promise<ParentChildRelationship[]> {
    return await this.db
      .select()
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.userId, userId));
  }

  async getChildParents(childId: string): Promise<Array<ParentChildRelationship & { user: User }>> {
    const relationships = await this.db
      .select()
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.childId, childId));
    
    const result: Array<ParentChildRelationship & { user: User }> = [];
    for (const rel of relationships) {
      const user = await this.getUser(rel.userId);
      if (user) {
        result.push({ ...rel, user });
      }
    }
    return result;
  }

  async createParentChildRelationship(relationship: InsertParentChildRelationship): Promise<ParentChildRelationship> {
    const result = await this.db.insert(parentChildRelationships).values(relationship).returning();
    return result[0];
  }

  async deleteParentChildRelationship(userId: string, childId: string): Promise<boolean> {
    const result = await this.db
      .delete(parentChildRelationships)
      .where(
        and(
          eq(parentChildRelationships.userId, userId),
          eq(parentChildRelationships.childId, childId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async isPrimaryParent(userId: string): Promise<boolean> {
    const relationships = await this.getUserParentRoles(userId);
    
    // If user has explicit relationship records, check if any are primary
    if (relationships.length > 0) {
      return relationships.some(rel => rel.role === "primary");
    }
    
    // For legacy users without relationship records:
    // If they have children via parentIds, they're considered primary
    const children = await this.getChildrenByParentId(userId);
    return children.length > 0;
  }

  async deleteSecondaryParent(userId: string): Promise<boolean> {
    // Get all children this user has access to via parentIds
    const childrenWithAccess = await this.getChildrenByParentId(userId);
    
    // Remove userId from each child's parentIds array
    for (const child of childrenWithAccess) {
      const updatedParentIds = child.parentIds.filter(id => id !== userId);
      if (updatedParentIds.length > 0) {
        await this.db
          .update(children)
          .set({ parentIds: updatedParentIds })
          .where(eq(children.id, child.id));
      }
    }
    
    // Delete all parent-child relationships for this user
    await this.db
      .delete(parentChildRelationships)
      .where(eq(parentChildRelationships.userId, userId));
    
    // Delete the user record (but not the children they had access to)
    const result = await this.db.delete(users).where(eq(users.id, userId)).returning();
    return result.length > 0;
  }

  // Invitation operations
  async getInvitation(id: string): Promise<Invitation | undefined> {
    const result = await this.db.select().from(invitations).where(eq(invitations.id, id));
    return result[0];
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const result = await this.db.select().from(invitations).where(eq(invitations.token, token));
    return result[0];
  }

  async getInvitationsByUser(userId: string): Promise<Invitation[]> {
    return await this.db
      .select()
      .from(invitations)
      .where(eq(invitations.invitedByUserId, userId))
      .orderBy(desc(invitations.createdAt));
  }

  async getPendingInvitationByEmail(email: string): Promise<Invitation | undefined> {
    const result = await this.db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.status, "pending")
        )
      );
    return result[0];
  }

  async getPendingInvitationByEmailAndUser(email: string, userId: string): Promise<Invitation | undefined> {
    const result = await this.db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.invitedByUserId, userId),
          eq(invitations.status, "pending")
        )
      );
    return result[0];
  }

  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    const result = await this.db.insert(invitations).values(invitation).returning();
    return result[0];
  }

  async updateInvitation(id: string, data: Partial<Invitation>): Promise<Invitation | undefined> {
    const result = await this.db
      .update(invitations)
      .set(data)
      .where(eq(invitations.id, id))
      .returning();
    return result[0];
  }

  async revokeInvitation(id: string): Promise<boolean> {
    const result = await this.db
      .update(invitations)
      .set({ status: "revoked" })
      .where(eq(invitations.id, id))
      .returning();
    return result.length > 0;
  }

  // Streak operations
  async getStreakActivities(ageMonths?: number): Promise<StreakActivity[]> {
    const result = await this.db
      .select()
      .from(streakActivities)
      .where(eq(streakActivities.isActive, true));
    
    if (ageMonths !== undefined) {
      return result.filter(activity => {
        const minAge = activity.ageRangeMonthsMin ?? 0;
        const maxAge = activity.ageRangeMonthsMax ?? 72;
        return ageMonths >= minAge && ageMonths <= maxAge;
      });
    }
    return result;
  }

  async createStreakActivity(activity: InsertStreakActivity): Promise<StreakActivity> {
    const result = await this.db.insert(streakActivities).values(activity).returning();
    return result[0];
  }

  async getDailyStreaks(childId: string, startDate?: string, endDate?: string): Promise<DailyStreak[]> {
    const result = await this.db
      .select()
      .from(dailyStreaks)
      .where(eq(dailyStreaks.childId, childId))
      .orderBy(desc(dailyStreaks.date));
    
    if (startDate && endDate) {
      return result.filter(streak => {
        const date = streak.date;
        return date >= startDate && date <= endDate;
      });
    }
    return result;
  }

  async getDailyStreakByDate(childId: string, date: string): Promise<DailyStreak | undefined> {
    const result = await this.db
      .select()
      .from(dailyStreaks)
      .where(
        and(
          eq(dailyStreaks.childId, childId),
          eq(dailyStreaks.date, date)
        )
      );
    return result[0];
  }

  async createDailyStreak(streak: InsertDailyStreak): Promise<DailyStreak> {
    const result = await this.db.insert(dailyStreaks).values(streak as any).returning();
    return result[0];
  }

  async deleteDailyStreak(childId: string, date: string): Promise<boolean> {
    const result = await this.db
      .delete(dailyStreaks)
      .where(
        and(
          eq(dailyStreaks.childId, childId),
          eq(dailyStreaks.date, date)
        )
      )
      .returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
