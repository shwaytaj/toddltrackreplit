# Auto Milestone Detection Feature Plan

## Overview

Auto Milestone Detection enables parents to upload short video clips of their child, which are then analyzed using AI to automatically detect and mark achieved milestones. The feature also provides personalized developmental recommendations based on the child's age and observed activities.

**Inspired by:** [Pathfinder Health Smart Detection](https://www.pathfinder.health/smart-detection)

---

## Key Features

1. **Video Upload** - Parents upload short video snippets (recommended 30-60 seconds)
2. **AI-Powered Analysis** - Video analyzed for child activities and behaviors
3. **Automatic Milestone Detection** - Detected activities matched to milestone database
4. **Auto-Achievement** - Matched milestones automatically marked as achieved
5. **Personalized Recommendations** - AI suggests next developmental activities based on video analysis + child's age
6. **Privacy-First Design** - Videos automatically deleted after analysis

---

## AI Technology Stack

### Primary: Google Gemini 2.5 Flash (Video Analysis)

| Attribute | Details |
|-----------|---------|
| **Purpose** | Native multimodal video understanding |
| **Why Chosen** | Only major AI API with native video processing |
| **Capabilities** | Analyzes video + audio, activity recognition, temporal reasoning, timestamps |
| **File Limits** | Up to 2GB per video |
| **Context** | 1M tokens (~1-2 hours of video) |
| **Cost** | ~$0.075 per 1M input tokens |
| **Output** | Structured JSON with activities, timestamps, confidence scores |

**Why Not Claude/Anthropic for Video?**
- Claude cannot directly process video files
- Claude only supports images and PDFs for visual analysis
- Would require extracting individual frames (complex, loses temporal context)

### Secondary: Anthropic Claude (Milestone Matching)

| Attribute | Details |
|-----------|---------|
| **Purpose** | Match detected activities to Toddl's milestone database |
| **Why Chosen** | Already integrated in Toddl, excellent at text reasoning |
| **Model** | claude-sonnet-4-20250514 |
| **Input** | Gemini analysis results + child's relevant milestones |
| **Output** | Matched milestones with confidence scores |

### Optional Enhancement: Google MediaPipe (Pose Estimation)

| Attribute | Details |
|-----------|---------|
| **Purpose** | Client-side pose detection for motor milestone verification |
| **Why Chosen** | Free, open-source, validated for infant pose estimation |
| **Capabilities** | 33 body keypoints, real-time processing |
| **Privacy** | Runs entirely on client device |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UPLOAD PHASE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐         ┌──────────────────┐                     │
│   │   Parent     │────────▶│  Replit Object   │                     │
│   │   Uploads    │         │  Storage         │                     │
│   │   Video      │         │  (Temporary)     │                     │
│   └──────────────┘         └────────┬─────────┘                     │
│                                     │                                │
└─────────────────────────────────────┼────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼────────────────────────────────┐
│                         ANALYSIS PHASE                               │
├─────────────────────────────────────┼────────────────────────────────┤
│                                     ▼                                │
│                          ┌──────────────────┐                        │
│                          │  Google Gemini   │                        │
│                          │  2.5 Flash API   │                        │
│                          │                  │                        │
│                          │  - Activity      │                        │
│                          │    detection     │                        │
│                          │  - Timestamps    │                        │
│                          │  - Behaviors     │                        │
│                          └────────┬─────────┘                        │
│                                   │                                  │
│                                   ▼                                  │
│                          ┌──────────────────┐                        │
│                          │  Anthropic       │                        │
│                          │  Claude          │                        │
│                          │                  │                        │
│                          │  - Match to      │                        │
│                          │    milestones    │                        │
│                          │  - Generate      │                        │
│                          │    recommendations│                       │
│                          └────────┬─────────┘                        │
│                                   │                                  │
└───────────────────────────────────┼──────────────────────────────────┘
                                    │
┌───────────────────────────────────┼──────────────────────────────────┐
│                         CLEANUP PHASE                                │
├───────────────────────────────────┼──────────────────────────────────┤
│                                   ▼                                  │
│   ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│   │  ⚡ DELETE VIDEO │   │  Save Analysis   │   │  Update Child  │  │
│   │  from Object     │   │  Results to DB   │   │  Milestones    │  │
│   │  Storage         │   │  (JSON only)     │   │  (Auto-achieve)│  │
│   └──────────────────┘   └──────────────────┘   └────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         RESULTS PHASE                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    Parent Views Results                       │  │
│   │                                                               │  │
│   │   ✅ Detected Milestones (with confidence scores)            │  │
│   │   📋 Recommended Next Steps                                   │  │
│   │   🔄 Option to confirm/reject auto-detected milestones       │  │
│   │                                                               │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Privacy-First Design: Auto-Delete Policy

### What Gets Deleted (Immediately After Analysis)
- ❌ Original video file
- ❌ Any temporary copies
- ❌ Video URL/path references

### What Gets Retained
- ✅ Analysis results (JSON) - activities detected, timestamps, confidence
- ✅ Matched milestones and recommendations
- ✅ Metadata (original filename, duration, upload date, analysis status)
- ✅ Deletion confirmation timestamp

### Benefits
- **Maximum privacy** - Child videos don't persist on servers
- **COPPA compliance** - Minimal data retention
- **Zero storage costs** - No ongoing storage fees for videos
- **Parent peace of mind** - Videos aren't stored long-term

---

## Database Schema

### New Table: `videoAnalyses`

```typescript
export const videoAnalyses = pgTable("video_analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  
  // Metadata (video itself is deleted after analysis)
  originalFilename: text("original_filename").notNull(),
  videoDuration: integer("video_duration"), // seconds
  
  // Processing status
  status: text("status").notNull().default("processing"), // processing, completed, failed
  errorMessage: text("error_message"),
  
  // Analysis results
  geminiAnalysis: jsonb("gemini_analysis"), // Raw Gemini response
  detectedActivities: jsonb("detected_activities"), // Parsed activities with timestamps
  matchedMilestones: jsonb("matched_milestones"), // Milestone matches with confidence
  recommendations: jsonb("recommendations"), // AI-generated next steps
  
  // Timestamps
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  analyzedAt: timestamp("analyzed_at"),
  videoDeletedAt: timestamp("video_deleted_at"), // Confirmation of deletion
});
```

### New Table: `videoMilestoneMatches`

```typescript
export const videoMilestoneMatches = pgTable("video_milestone_matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  videoAnalysisId: uuid("video_analysis_id").notNull().references(() => videoAnalyses.id, { onDelete: "cascade" }),
  milestoneId: uuid("milestone_id").notNull().references(() => milestones.id),
  
  confidence: real("confidence").notNull(), // 0.0 - 1.0
  videoTimestamp: text("video_timestamp"), // e.g., "0:15-0:22"
  activityDescription: text("activity_description"), // What Gemini detected
  
  // Parent confirmation
  autoAchieved: boolean("auto_achieved").default(false),
  parentConfirmed: boolean("parent_confirmed"), // null = pending, true = confirmed, false = rejected
  confirmedAt: timestamp("confirmed_at"),
});
```

### Types

```typescript
// Gemini detected activity
interface DetectedActivity {
  timestamp: string;        // "0:15-0:22"
  activity: string;         // "Child crawling across floor"
  category: string;         // "Motor", "Communication", etc.
  confidence: number;       // 0.0 - 1.0
}

// Matched milestone result
interface MilestoneMatch {
  milestoneId: string;
  milestoneTitle: string;
  confidence: number;
  matchReason: string;      // Why this milestone was matched
  videoTimestamp: string;
}

// AI recommendation based on video
interface VideoRecommendation {
  title: string;
  description: string;
  relatedMilestones: string[];
  priority: "high" | "medium" | "low";
}
```

---

## API Endpoints

### Upload & Analyze Video

```
POST /api/children/:childId/videos
Content-Type: multipart/form-data

Request:
  - video: File (max 100MB, formats: mp4, mov, webm)

Response:
{
  "id": "uuid",
  "status": "processing",
  "message": "Video uploaded and analysis started"
}
```

### Get Analysis Results

```
GET /api/children/:childId/videos/:videoId

Response:
{
  "id": "uuid",
  "status": "completed",
  "originalFilename": "baby_crawling.mp4",
  "videoDuration": 45,
  "analyzedAt": "2026-01-22T10:30:00Z",
  "videoDeletedAt": "2026-01-22T10:30:05Z",
  "detectedActivities": [...],
  "matchedMilestones": [...],
  "recommendations": [...]
}
```

### List Video Analyses

```
GET /api/children/:childId/videos

Response:
{
  "analyses": [
    {
      "id": "uuid",
      "originalFilename": "baby_crawling.mp4",
      "status": "completed",
      "uploadedAt": "2026-01-22T10:00:00Z",
      "matchedMilestonesCount": 3
    }
  ]
}
```

### Confirm/Reject Detected Milestones

```
POST /api/children/:childId/videos/:videoId/confirm

Request:
{
  "milestoneMatches": [
    { "matchId": "uuid", "confirmed": true },
    { "matchId": "uuid", "confirmed": false }
  ]
}

Response:
{
  "confirmed": 2,
  "rejected": 1,
  "milestonesUpdated": 2
}
```

---

## Processing Pipeline

### Step 1: Video Upload
```typescript
async function uploadVideo(childId: string, file: File) {
  // 1. Validate file (size, format)
  // 2. Upload to Object Storage (temporary)
  // 3. Create videoAnalyses record with status="processing"
  // 4. Trigger async analysis job
  return { analysisId, status: "processing" };
}
```

### Step 2: Gemini Analysis
```typescript
async function analyzeWithGemini(videoUrl: string, childAgeMonths: number) {
  const prompt = `
    Analyze this video of a ${childAgeMonths}-month-old child.
    
    Identify ALL developmental activities you observe, including:
    - Motor skills (crawling, walking, reaching, grasping)
    - Communication (babbling, words, gestures, pointing)
    - Social/emotional (eye contact, smiling, playing)
    - Cognitive (problem-solving, object permanence, imitation)
    
    For each activity, provide:
    1. Timestamp (start-end)
    2. Description of the activity
    3. Developmental category
    4. Confidence score (0-1)
    
    Return as JSON array.
  `;
  
  const response = await gemini.generateContent([
    { fileData: { fileUri: videoUrl, mimeType: "video/mp4" } },
    { text: prompt }
  ]);
  
  return parseActivities(response);
}
```

### Step 3: Milestone Matching with Claude
```typescript
async function matchMilestones(activities: DetectedActivity[], childId: string) {
  // Get child's age and relevant milestones
  const child = await getChild(childId);
  const relevantMilestones = await getMilestonesForAge(child.adjustedAgeMonths);
  
  const prompt = `
    Given these detected activities from a video:
    ${JSON.stringify(activities)}
    
    And these developmental milestones for a ${child.adjustedAgeMonths}-month-old:
    ${JSON.stringify(relevantMilestones)}
    
    Match each activity to the most relevant milestone(s).
    Only match with confidence > 0.7.
    
    Also provide 3-4 recommendations for activities the parents can do
    based on what you observed in the video and the child's developmental stage.
  `;
  
  return await claude.analyze(prompt);
}
```

### Step 4: Cleanup & Save
```typescript
async function finalizeAnalysis(analysisId: string, results: AnalysisResults) {
  // 1. Save analysis results to database
  await saveAnalysisResults(analysisId, results);
  
  // 2. Auto-achieve high-confidence milestones (> 0.85)
  for (const match of results.matches.filter(m => m.confidence > 0.85)) {
    await autoAchieveMilestone(match.childId, match.milestoneId);
  }
  
  // 3. DELETE VIDEO FROM OBJECT STORAGE
  await deleteVideoFromStorage(results.videoUrl);
  
  // 4. Update analysis record with deletion timestamp
  await updateAnalysis(analysisId, {
    status: "completed",
    videoDeletedAt: new Date()
  });
}
```

---

## UI/UX Design

### 1. Upload Screen
- Camera icon button on Home or Profile page
- "Analyze Video" button
- Video preview before upload
- File size/format validation
- Upload progress indicator

### 2. Processing Screen
- "Analyzing your video..." message
- Animated progress indicator
- Estimated time remaining
- Option to continue using app (background processing)

### 3. Results Screen
- Summary: "We detected X milestone activities!"
- List of detected milestones with:
  - Milestone title
  - Confidence indicator (high/medium)
  - Video timestamp where detected
  - Confirm ✅ / Reject ❌ buttons
- Recommendations section
- "Done" button to return

### 4. History View
- List of past video analyses
- Date uploaded
- Number of milestones detected
- Status (completed/failed)

---

## Cost Analysis

| Component | Cost per 30s Video | Notes |
|-----------|-------------------|-------|
| Gemini 2.5 Flash | ~$0.02 | ~250 tokens/sec × 30s × $0.075/1M |
| Claude Matching | ~$0.01 | Text-based reasoning |
| Object Storage | $0.00 | Deleted after analysis |
| **Total per video** | **~$0.03** | Very affordable |

### Monthly Estimates
| Usage Level | Videos/Month | Monthly Cost |
|-------------|--------------|--------------|
| Light | 10 | $0.30 |
| Moderate | 50 | $1.50 |
| Heavy | 200 | $6.00 |

---

## Required Configuration

### Environment Variables / Secrets

| Secret | Purpose | Status |
|--------|---------|--------|
| `GOOGLE_GEMINI_API_KEY` | Gemini 2.5 Flash API | **NEW - Required** |
| `ANTHROPIC_API_KEY` | Claude for matching | Already configured |

### Replit Integrations
- Object Storage (already configured)
- PostgreSQL (already configured)

---

## Privacy & Compliance

### COPPA Compliance
- Parental consent required before first video upload
- Videos contain children - strict data handling
- Clear privacy notice explaining:
  - Video is analyzed by AI
  - Video is deleted immediately after analysis
  - Only analysis results are retained

### GDPR Compliance
- Video analysis data included in data export
- Analysis records deleted with account deletion
- Clear explanation of data processing

### Security Measures
- Videos encrypted in transit (HTTPS)
- Temporary storage with immediate deletion
- Analysis results tied to authenticated user
- No video data sent to third parties (Gemini processes, doesn't store)

---

## Implementation Phases

### Phase 1: Core Infrastructure (MVP)
- [ ] Add Gemini API integration
- [ ] Create video upload endpoint
- [ ] Implement Gemini video analysis
- [ ] Create database schema
- [ ] Basic results display

### Phase 2: Milestone Matching
- [ ] Claude-based milestone matching
- [ ] Auto-achievement for high-confidence matches
- [ ] Parent confirmation UI
- [ ] History view

### Phase 3: Recommendations
- [ ] Video-based AI recommendations
- [ ] Integration with existing recommendation system
- [ ] Priority-based suggestions

### Phase 4: Polish
- [ ] Upload progress UI
- [ ] Error handling and retry logic
- [ ] Analytics and monitoring
- [ ] Performance optimization

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Video analysis success rate | > 95% |
| Milestone match accuracy | > 85% |
| Parent confirmation rate | > 70% |
| Average processing time | < 60 seconds |
| Video upload completion rate | > 90% |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Gemini API rate limits | Implement queue system, retry with backoff |
| Poor video quality | Provide guidance on filming, handle gracefully |
| False positive matches | Require parent confirmation for auto-achievement |
| Processing delays | Show estimated time, allow background processing |
| API costs spike | Implement usage limits per user/day |

---

## Future Enhancements

1. **Client-side pose estimation** - MediaPipe for motor milestone verification
2. **Audio analysis** - Detect speech/babbling for communication milestones
3. **Video highlights** - Generate shareable clips of milestone moments
4. **GP sharing** - Export milestone detection reel for pediatrician visits
5. **Batch analysis** - Analyze multiple videos in sequence
6. **Smart prompts** - Suggest what activities to film based on upcoming milestones
