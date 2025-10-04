import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, date, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  medicalHistory: jsonb("medical_history").$type<{
    conditions?: string[];
    allergies?: string[];
    medications?: string[];
    familyHistory?: string[];
  }>(),
  medicalHistoryUpdatedAt: timestamp("medical_history_updated_at"),
});

export const children = pgTable("children", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  birthDate: date("birth_date").notNull(),
  gender: text("gender"),
  photoUrl: text("photo_url"),
  parentIds: text("parent_ids").array().notNull(),
  medicalHistory: jsonb("medical_history").$type<{
    conditions?: string[];
    allergies?: string[];
    medications?: string[];
    birthComplications?: string[];
    currentConcerns?: string[];
  }>(),
  medicalHistoryUpdatedAt: timestamp("medical_history_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull(),
  ageRangeMonthsMin: integer("age_range_months_min").notNull(),
  ageRangeMonthsMax: integer("age_range_months_max").notNull(),
  description: text("description").notNull(),
  typicalRange: text("typical_range"),
});

export const childMilestones = pgTable("child_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  milestoneId: varchar("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  achieved: boolean("achieved").default(false),
  achievedAt: timestamp("achieved_at"),
  notes: text("notes"),
});

export const growthMetrics = pgTable("growth_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // 'weight', 'height', 'head'
  value: real("value").notNull(),
  unit: text("unit").notNull(), // 'kg', 'cm'
  percentile: real("percentile"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teeth = pgTable("teeth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  toothNumber: integer("tooth_number").notNull(),
  toothName: text("tooth_name").notNull(),
  eruptedAt: timestamp("erupted_at"),
  notes: text("notes"),
});

export const aiRecommendations = pgTable("ai_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  milestoneId: varchar("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  recommendations: jsonb("recommendations").$type<Array<{
    title: string;
    description: string;
  }>>().notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  childDataVersion: timestamp("child_data_version").notNull(),
  parentDataVersion: timestamp("parent_data_version").notNull(),
});

// Insert schemas and types
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
});

export const insertChildMilestoneSchema = createInsertSchema(childMilestones).omit({
  id: true,
});

export const insertGrowthMetricSchema = createInsertSchema(growthMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertToothSchema = createInsertSchema(teeth).omit({
  id: true,
});

export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  generatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof children.$inferSelect;

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

export type InsertChildMilestone = z.infer<typeof insertChildMilestoneSchema>;
export type ChildMilestone = typeof childMilestones.$inferSelect;

export type InsertGrowthMetric = z.infer<typeof insertGrowthMetricSchema>;
export type GrowthMetric = typeof growthMetrics.$inferSelect;

export type InsertTooth = z.infer<typeof insertToothSchema>;
export type Tooth = typeof teeth.$inferSelect;

export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
