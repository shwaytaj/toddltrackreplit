import Anthropic from "@anthropic-ai/sdk";
import { storage } from "../storage";
import { getAgeInMonthsForAI } from "../age-utils";
import type { Child, User, Milestone } from "@shared/schema";

const isAnthropicConfigured = !!process.env.ANTHROPIC_API_KEY;
const anthropic = isAnthropicConfigured 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MAX_MILESTONES_TO_WARMUP = 6;
const DELAY_BETWEEN_CALLS_MS = 500;

interface WarmupResult {
  success: boolean;
  milestonesWarmed: number;
  errors: string[];
}

export async function warmupRecommendationsForChild(
  childId: string,
  parentId: string
): Promise<WarmupResult> {
  const result: WarmupResult = {
    success: true,
    milestonesWarmed: 0,
    errors: [],
  };

  if (!anthropic) {
    result.success = false;
    result.errors.push("Anthropic API not configured");
    return result;
  }

  try {
    const child = await storage.getChild(childId);
    if (!child) {
      result.success = false;
      result.errors.push("Child not found");
      return result;
    }

    const parent = await storage.getUser(parentId);
    if (!parent) {
      result.success = false;
      result.errors.push("Parent not found");
      return result;
    }

    const milestonesToWarmup = await selectMilestonesToWarmup(child, parentId);
    
    console.log(`[RecommendationWarmup] Starting warmup for child ${childId}, ${milestonesToWarmup.length} milestones`);

    for (const milestone of milestonesToWarmup) {
      try {
        const cached = await storage.getAiRecommendation(childId, milestone.id);
        if (cached) {
          console.log(`[RecommendationWarmup] Skipping ${milestone.title} - already cached`);
          continue;
        }

        await generateAndCacheRecommendation(child, parent, milestone);
        result.milestonesWarmed++;
        console.log(`[RecommendationWarmup] Warmed ${milestone.title}`);

        if (milestonesToWarmup.indexOf(milestone) < milestonesToWarmup.length - 1) {
          await delay(DELAY_BETWEEN_CALLS_MS);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Failed to warm ${milestone.title}: ${errorMsg}`);
        console.error(`[RecommendationWarmup] Error warming ${milestone.title}:`, error);
      }
    }

    console.log(`[RecommendationWarmup] Completed: ${result.milestonesWarmed} milestones warmed`);
  } catch (error) {
    result.success = false;
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(errorMsg);
    console.error("[RecommendationWarmup] Fatal error:", error);
  }

  return result;
}

async function selectMilestonesToWarmup(child: Child, parentId: string): Promise<Milestone[]> {
  const ageInMonths = getAgeInMonthsForAI(child.dueDate);
  
  const minAge = Math.max(0, ageInMonths - 1);
  const maxAge = ageInMonths + 2;
  
  const allMilestones = await storage.getMilestonesByAgeRange(minAge, maxAge);
  
  const completedMilestones = await storage.getChildMilestones(child.id);
  const completedIds = new Set(completedMilestones.map(cm => cm.milestoneId));
  
  const incompleteMilestones = allMilestones.filter(m => !completedIds.has(m.id));
  
  const sortedMilestones = incompleteMilestones.sort((a, b) => {
    const aMidAge = (a.ageRangeMonthsMin + a.ageRangeMonthsMax) / 2;
    const bMidAge = (b.ageRangeMonthsMin + b.ageRangeMonthsMax) / 2;
    
    const aDistance = Math.abs(aMidAge - ageInMonths);
    const bDistance = Math.abs(bMidAge - ageInMonths);
    
    return aDistance - bDistance;
  });
  
  const categoryMap = new Map<string, Milestone[]>();
  for (const milestone of sortedMilestones) {
    const category = milestone.category || 'Other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(milestone);
  }
  
  const selected: Milestone[] = [];
  const categories = Array.from(categoryMap.keys());
  let categoryIndex = 0;
  
  while (selected.length < MAX_MILESTONES_TO_WARMUP && categoryIndex < categories.length * 3) {
    const category = categories[categoryIndex % categories.length];
    const milestonesInCategory = categoryMap.get(category)!;
    
    const alreadySelectedFromCategory = selected.filter(m => m.category === category).length;
    
    if (alreadySelectedFromCategory < milestonesInCategory.length) {
      const milestone = milestonesInCategory[alreadySelectedFromCategory];
      if (!selected.includes(milestone)) {
        selected.push(milestone);
      }
    }
    
    categoryIndex++;
  }
  
  return selected.slice(0, MAX_MILESTONES_TO_WARMUP);
}

async function generateAndCacheRecommendation(
  child: Child,
  parent: User,
  milestone: Milestone
): Promise<void> {
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
- HSE (Health Service Executive) developmental milestone guidelines
- Evidence-based pediatric research and clinical guidelines

Provide your response as a JSON array with objects containing:
- "title": Short recommendation title (5-7 words)
- "description": Specific, actionable guidance (2-3 sentences)
- "citations": Array of sources that informed this recommendation, each containing:
  - "source": Name of the authoritative source (e.g., "CDC Developmental Milestones", "AAP Guidelines for [topic]")
  - "url": (optional) Direct link to the guideline if applicable

IMPORTANT URL GUIDANCE: Only include URLs if you are certain they are correct. Use these official base URLs:
- CDC: https://www.cdc.gov/act-early/milestones/
- AAP: https://publications.aap.org/pediatrics/article/149/3/e2021052138/184748
- WHO: https://www.who.int/tools/child-growth-standards/standards/motor-development-milestones
- HSE: https://www2.hse.ie/babies-children/checks-milestones/developmental-milestones/
- NHS: https://www.nhs.uk/conditions/baby/babys-development/
If unsure about a specific URL, omit the url field and include only the source name.

Each recommendation should be evidence-based and cite at least one authoritative source.`;

  const message = await anthropic!.messages.create({
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

  const childDataVersion = child.medicalHistoryUpdatedAt || new Date(0);
  const parentDataVersion = parent.medicalHistoryUpdatedAt || new Date(0);

  await storage.createAiRecommendation({
    childId: child.id,
    milestoneId: milestone.id,
    recommendations,
    childDataVersion,
    parentDataVersion,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function triggerWarmupInBackground(childId: string, parentId: string): void {
  setImmediate(async () => {
    try {
      await warmupRecommendationsForChild(childId, parentId);
    } catch (error) {
      console.error("[RecommendationWarmup] Background warmup failed:", error);
    }
  });
}
