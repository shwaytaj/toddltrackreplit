import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import { videoAnalyses, videoMilestoneMatches, milestones, children, childMilestones } from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const anthropic = new Anthropic();

interface DetectedActivity {
  timestamp: string;
  activity: string;
  category: string;
  confidence: number;
}

interface MilestoneMatch {
  milestoneId: string;
  milestoneTitle: string;
  confidence: number;
  matchReason: string;
  videoTimestamp: string;
}

interface VideoRecommendation {
  title: string;
  description: string;
  relatedMilestones: string[];
  priority: "high" | "medium" | "low";
}

function calculateAdjustedAgeMonths(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(0, Math.floor(diffMonths));
}

export async function analyzeVideoWithGemini(
  videoBase64: string,
  mimeType: string,
  childAgeMonths: number
): Promise<DetectedActivity[]> {
  const prompt = `Analyze this video of a ${childAgeMonths}-month-old child.

Identify ALL developmental activities you observe, including:
- Motor skills (crawling, walking, reaching, grasping, sitting, standing, jumping)
- Communication (babbling, words, gestures, pointing, waving)
- Social/emotional (eye contact, smiling, playing, sharing)
- Cognitive (problem-solving, object permanence, imitation, following instructions)
- Hearing (responding to sounds, turning toward voices)
- Vision (tracking objects, recognizing faces)

For each activity observed, provide:
1. Timestamp (approximate time range like "0:05-0:10")
2. Description of the activity (be specific)
3. Developmental category (Motor, Communication, Social, Cognitive, Hearing, Vision)
4. Confidence score (0.0 to 1.0, where 1.0 is very confident)

Return ONLY a valid JSON array with no additional text. Example format:
[
  {
    "timestamp": "0:05-0:12",
    "activity": "Child pulls to standing position using furniture",
    "category": "Motor",
    "confidence": 0.85
  }
]

If no clear developmental activities are visible, return an empty array: []`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: videoBase64,
                mimeType: mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const text = response.text || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in Gemini response:", text);
      return [];
    }

    const activities: DetectedActivity[] = JSON.parse(jsonMatch[0]);
    return activities.filter(
      (a) =>
        a.timestamp &&
        a.activity &&
        a.category &&
        typeof a.confidence === "number" &&
        a.confidence >= 0 &&
        a.confidence <= 1
    );
  } catch (error) {
    console.error("Error analyzing video with Gemini:", error);
    throw error;
  }
}

export async function matchActivitiesToMilestones(
  activities: DetectedActivity[],
  childId: string
): Promise<{ matches: MilestoneMatch[]; recommendations: VideoRecommendation[] }> {
  const child = await db.select().from(children).where(eq(children.id, childId)).limit(1);
  if (!child.length) {
    throw new Error("Child not found");
  }

  const ageMonths = calculateAdjustedAgeMonths(child[0].dueDate);
  const ageWindowMin = Math.max(0, ageMonths - 3);
  const ageWindowMax = ageMonths + 3;

  const relevantMilestones = await db
    .select()
    .from(milestones)
    .where(
      and(
        lte(milestones.ageRangeMonthsMin, ageWindowMax),
        gte(milestones.ageRangeMonthsMax, ageWindowMin)
      )
    );

  if (activities.length === 0 || relevantMilestones.length === 0) {
    return { matches: [], recommendations: [] };
  }

  const prompt = `You are an expert pediatric developmental specialist. Given these detected activities from a video of a ${ageMonths}-month-old child:

DETECTED ACTIVITIES:
${JSON.stringify(activities, null, 2)}

And these developmental milestones appropriate for this age:
${JSON.stringify(
  relevantMilestones.map((m) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    description: m.description,
    ageRange: `${m.ageRangeMonthsMin}-${m.ageRangeMonthsMax} months`,
  })),
  null,
  2
)}

TASK 1: Match each detected activity to the most relevant milestone(s). Only include matches where confidence is 0.7 or higher.

TASK 2: Based on the activities observed and the child's age, provide 3-4 personalized recommendations for activities the parents can do to support further development.

Return ONLY valid JSON in this exact format:
{
  "matches": [
    {
      "milestoneId": "uuid-here",
      "milestoneTitle": "Milestone title",
      "confidence": 0.85,
      "matchReason": "Brief explanation of why this activity demonstrates this milestone",
      "videoTimestamp": "0:05-0:12"
    }
  ],
  "recommendations": [
    {
      "title": "Activity title",
      "description": "Detailed description of the activity",
      "relatedMilestones": ["milestone-id-1"],
      "priority": "high"
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Claude response:", text);
      return { matches: [], recommendations: [] };
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Validate that all returned milestone IDs actually exist in our database
    const validMilestoneIds = new Set(relevantMilestones.map(m => m.id));
    const validatedMatches = (result.matches || []).filter((match: MilestoneMatch) => {
      if (!validMilestoneIds.has(match.milestoneId)) {
        console.warn(`Filtering out hallucinated milestone ID: ${match.milestoneId}`);
        return false;
      }
      return true;
    });
    
    // Also validate recommendation milestone references
    const validatedRecommendations = (result.recommendations || []).map((rec: VideoRecommendation) => ({
      ...rec,
      relatedMilestones: (rec.relatedMilestones || []).filter(id => validMilestoneIds.has(id))
    }));
    
    return {
      matches: validatedMatches,
      recommendations: validatedRecommendations,
    };
  } catch (error) {
    console.error("Error matching milestones with Claude:", error);
    throw error;
  }
}

export async function processVideoAnalysis(
  analysisId: string,
  videoBase64: string,
  mimeType: string,
  childId: string
): Promise<void> {
  try {
    await db
      .update(videoAnalyses)
      .set({ status: "analyzing" })
      .where(eq(videoAnalyses.id, analysisId));

    const child = await db.select().from(children).where(eq(children.id, childId)).limit(1);
    if (!child.length) {
      throw new Error("Child not found");
    }

    const ageMonths = calculateAdjustedAgeMonths(child[0].dueDate);

    const activities = await analyzeVideoWithGemini(videoBase64, mimeType, ageMonths);

    await db
      .update(videoAnalyses)
      .set({
        status: "matching",
        detectedActivities: activities,
        geminiAnalysis: { model: "gemini-2.5-flash" },
      })
      .where(eq(videoAnalyses.id, analysisId));

    const { matches, recommendations } = await matchActivitiesToMilestones(activities, childId);

    for (const match of matches) {
      await db.insert(videoMilestoneMatches).values({
        videoAnalysisId: analysisId,
        milestoneId: match.milestoneId,
        confidence: match.confidence,
        videoTimestamp: match.videoTimestamp,
        activityDescription: match.matchReason,
        autoAchieved: match.confidence >= 0.85,
      });

      if (match.confidence >= 0.85) {
        const existing = await db
          .select()
          .from(childMilestones)
          .where(
            and(
              eq(childMilestones.childId, childId),
              eq(childMilestones.milestoneId, match.milestoneId)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(childMilestones).values({
            childId,
            milestoneId: match.milestoneId,
            achieved: true,
            achievedAt: new Date(),
            notes: `Auto-detected from video analysis (confidence: ${Math.round(match.confidence * 100)}%)`,
          });
        } else if (!existing[0].achieved) {
          await db
            .update(childMilestones)
            .set({
              achieved: true,
              achievedAt: new Date(),
              notes: `Auto-detected from video analysis (confidence: ${Math.round(match.confidence * 100)}%)`,
            })
            .where(eq(childMilestones.id, existing[0].id));
        }
      }
    }

    await db
      .update(videoAnalyses)
      .set({
        status: "completed",
        matchedMilestones: matches,
        recommendations,
        analyzedAt: new Date(),
        videoDeletedAt: new Date(),
      })
      .where(eq(videoAnalyses.id, analysisId));
  } catch (error) {
    console.error("Error processing video analysis:", error);
    await db
      .update(videoAnalyses)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        videoDeletedAt: new Date(),
      })
      .where(eq(videoAnalyses.id, analysisId));
    throw error;
  }
}

export async function getVideoAnalysis(analysisId: string) {
  const [analysis] = await db
    .select()
    .from(videoAnalyses)
    .where(eq(videoAnalyses.id, analysisId));
  return analysis;
}

export async function getVideoAnalysesForChild(childId: string) {
  return db
    .select()
    .from(videoAnalyses)
    .where(eq(videoAnalyses.childId, childId))
    .orderBy(sql`${videoAnalyses.uploadedAt} DESC`);
}

export async function getMilestoneMatchesForAnalysis(analysisId: string) {
  return db
    .select({
      match: videoMilestoneMatches,
      milestone: milestones,
    })
    .from(videoMilestoneMatches)
    .innerJoin(milestones, eq(videoMilestoneMatches.milestoneId, milestones.id))
    .where(eq(videoMilestoneMatches.videoAnalysisId, analysisId));
}

export async function confirmMilestoneMatch(
  matchId: string,
  confirmed: boolean,
  childId: string
): Promise<void> {
  const [match] = await db
    .select()
    .from(videoMilestoneMatches)
    .where(eq(videoMilestoneMatches.id, matchId));

  if (!match) {
    throw new Error("Match not found");
  }

  await db
    .update(videoMilestoneMatches)
    .set({
      parentConfirmed: confirmed,
      confirmedAt: new Date(),
    })
    .where(eq(videoMilestoneMatches.id, matchId));

  if (confirmed && !match.autoAchieved) {
    const existing = await db
      .select()
      .from(childMilestones)
      .where(
        and(
          eq(childMilestones.childId, childId),
          eq(childMilestones.milestoneId, match.milestoneId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(childMilestones).values({
        childId,
        milestoneId: match.milestoneId,
        achieved: true,
        achievedAt: new Date(),
        notes: "Confirmed from video analysis by parent",
      });
    } else if (!existing[0].achieved) {
      await db
        .update(childMilestones)
        .set({
          achieved: true,
          achievedAt: new Date(),
          notes: "Confirmed from video analysis by parent",
        })
        .where(eq(childMilestones.id, existing[0].id));
    }
  }
}
