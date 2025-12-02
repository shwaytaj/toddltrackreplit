# Toys & Tools Recommendations - Implementation Guide

## Overview

The Toys & Tools recommendation system provides AI-powered, personalized toy and product suggestions to help parents support their child's developmental milestones. It uses Anthropic Claude API to generate recommendations based on the child's age, medical history, and the specific milestone being worked on.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │ MilestoneDetail │───▶│ TanStack Query  │───▶│ Prefetch on Activities  │ │
│  │    Page         │    │   (1hr cache)   │    │ Tab Load                │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ POST /api/children/:childId/milestones/:milestoneId/toy-recommendations ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│           ┌────────────────────────┴────────────────────────┐               │
│           ▼                                                  ▼               │
│  ┌─────────────────┐                                ┌─────────────────┐     │
│  │ Check DB Cache  │──── Cache Valid? ────────────▶ │ Return Cached   │     │
│  │ (aiToyRecs)     │        YES                     │ Recommendations │     │
│  └─────────────────┘                                └─────────────────┘     │
│           │ NO                                                               │
│           ▼                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Anthropic API   │───▶│ Parse JSON      │───▶│ Cache to DB     │         │
│  │ (Claude Sonnet) │    │ Response        │    │ & Return        │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE                                        │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────┐ │
│  │ ai_toy_recommendations  │    │ dismissed_toy_recommendations           │ │
│  │ (cache table)           │    │ (user dismissals)                       │ │
│  └─────────────────────────┘    └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Frontend Request Lifecycle

**Location:** `client/src/pages/MilestoneDetail.tsx`

```typescript
// Primary fetch when user navigates to Toys & Tools tab
const { data: toyRecommendations } = useQuery<ToyRecommendation[]>({
  queryKey: ['/api/children', activeChildId, 'milestones', milestone?.id, 'toy-recommendations'],
  queryFn: async () => {
    const response = await apiRequest(
      'POST',
      `/api/children/${activeChildId}/milestones/${milestone.id}/toy-recommendations`
    );
    return response.json();
  },
});
```

### 2. Prefetching Strategy

When activity recommendations load successfully, toy recommendations are prefetched in the background:

```typescript
// Triggered when 'Activities' tab content loads
useEffect(() => {
  if (recommendations && recommendations.length > 0 && activeChildId && milestone) {
    queryClient.prefetchQuery({
      queryKey: ['/api/children', activeChildId, 'milestones', milestone.id, 'toy-recommendations'],
      queryFn: async () => {
        const response = await apiRequest(
          'POST',
          `/api/children/${activeChildId}/milestones/${milestone.id}/toy-recommendations`
        );
        return response.json();
      },
      staleTime: 1000 * 60 * 60, // 1 hour cache
    });
  }
}, [recommendations, activeChildId, milestone]);
```

**Why this approach?**
- Users typically view Activities first, then switch to Toys & Tools
- Prefetching during Activities tab ensures instant load when switching
- 1-hour stale time prevents unnecessary API calls

---

## Backend Implementation

### API Endpoint

**Location:** `server/routes.ts`

**Endpoint:** `POST /api/children/:childId/milestones/:milestoneId/toy-recommendations`

### Request Flow

1. **Authentication & Authorization**
   ```typescript
   if (!req.user) return res.status(401).json({ error: "Unauthorized" });
   
   // Verify parent owns this child
   if (!child.parentIds.includes(req.user.id)) {
     return res.status(403).json({ error: "Forbidden" });
   }
   ```

2. **Check for Dismissed Toys**
   ```typescript
   const dismissedToys = await storage.getDismissedToyRecommendations(childId, milestoneId);
   const dismissedToyNames = new Set(dismissedToys.map(dt => dt.toyName.toLowerCase()));
   ```

3. **Cache Validation**
   ```typescript
   const cached = await storage.getAiToyRecommendation(childId, milestoneId);
   
   const childDataVersion = child.medicalHistoryUpdatedAt || new Date(0);
   const parentDataVersion = parent.medicalHistoryUpdatedAt || new Date(0);
   
   // Cache is valid if medical history hasn't changed
   if (cached && 
       cached.childDataVersion >= childDataVersion &&
       cached.parentDataVersion >= parentDataVersion) {
     // Filter out dismissed toys and return first 5
     let filteredRecommendations = cached.recommendations
       .filter(toy => !dismissedToyNames.has(toy.name.toLowerCase()))
       .slice(0, 5);
     return res.json(filteredRecommendations);
   }
   ```

4. **Generate New Recommendations (if cache miss)**
   - Calls Anthropic Claude API
   - Caches result to database
   - Returns filtered recommendations

---

## AI Prompt Structure

The prompt sent to Claude includes:

```
Child Information:
- Age: {childAgeInMonths} months (adjusted for prematurity/post-maturity)
- Medical History: {child.medicalHistory}

Parent Information:
- Medical History: {parent.medicalHistory}

Milestone:
- Title: {milestone.title}
- Category: {milestone.category}
- Description: {milestone.description}
```

### Guidelines in Prompt
- Requests 10-15 specific toy recommendations
- Requires evidence-based citations from CDC, AAP, WHO, HSE, NHS, etc.
- Focuses on real, widely-available products
- Model: `claude-sonnet-4-20250514` with `max_tokens: 3072`

### Response Format Expected

```json
[
  {
    "name": "Fisher-Price Laugh & Learn Walker",
    "description": "Why this toy helps with the milestone...",
    "howToUse": "Tips for parents on usage...",
    "searchQuery": "Fisher Price Laugh Learn Walker",
    "citations": [
      {
        "source": "AAP Guidelines on Play and Development",
        "url": "https://..."
      }
    ]
  }
]
```

---

## Database Schema

### `ai_toy_recommendations` Table

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| childId | varchar | FK to children table |
| milestoneId | varchar | FK to milestones table |
| recommendations | jsonb | Array of recommendation objects |
| generatedAt | timestamp | When recommendations were generated |
| childDataVersion | timestamp | Child's medicalHistoryUpdatedAt at generation time |
| parentDataVersion | timestamp | Parent's medicalHistoryUpdatedAt at generation time |

### `dismissed_toy_recommendations` Table

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| childId | varchar | FK to children table |
| milestoneId | varchar | FK to milestones table |
| toyName | text | Name of dismissed toy |
| dismissedAt | timestamp | When toy was dismissed |

---

## Cache Invalidation

### Automatic Invalidation

Cache is automatically invalidated when:
1. **Child's medical history is updated** - `childDataVersion` check fails
2. **Parent's medical history is updated** - `parentDataVersion` check fails

### Manual Invalidation (Frontend)

When child or parent profiles are updated:

```typescript
// In Profile.tsx - after updating child
queryClient.invalidateQueries({ 
  predicate: (query) => 
    Array.isArray(query.queryKey) && 
    query.queryKey[0] === '/api/children' && 
    query.queryKey[1] === childId &&
    (query.queryKey.includes('toy-recommendations') || query.queryKey.includes('recommendations'))
});

// After updating parent medical history - invalidates ALL children's recommendations
queryClient.invalidateQueries({ 
  predicate: (query) => 
    Array.isArray(query.queryKey) && 
    query.queryKey[0] === '/api/children' &&
    (query.queryKey.includes('toy-recommendations') || 
     query.queryKey.includes('recommendations') ||
     query.queryKey.includes('completed-recommendations'))
});
```

---

## Dismiss Toy Feature

### API Endpoint

`POST /api/children/:childId/milestones/:milestoneId/dismiss-toy`

### Request Body
```json
{
  "toyName": "Fisher-Price Laugh & Learn Walker"
}
```

### Behavior
1. Creates record in `dismissed_toy_recommendations` table
2. Frontend invalidates cache
3. Next request filters out dismissed toys before returning

---

## Background Warmup Service

**Location:** `server/services/recommendationWarmup.ts`

### Purpose
Pre-generates AI recommendations in the background to reduce first-view latency.

### Trigger Points
1. **After child onboarding** - When a new child is created
2. **Profile switch** - When user switches between children via `POST /api/children/:id/warmup`

### Selection Algorithm
```typescript
const MAX_MILESTONES_TO_WARMUP = 6;
const DELAY_BETWEEN_CALLS_MS = 500;

// Selects milestones:
// 1. Within ±1-2 months of child's adjusted age
// 2. Not yet completed
// 3. Distributed across categories for variety
// 4. Sorted by proximity to child's current age
```

### Cost Estimate
~$0.04 per new child using Claude Sonnet for 5-6 milestone warmups.

---

## Product Link Generation (No Scraping)

**Important:** There is NO web scraping in this system. Product links are generated by constructing search URLs using the `searchQuery` field from AI recommendations.

### How It Works

1. **Claude generates `searchQuery`** - The AI includes a search-friendly query for each toy:
   ```json
   {
     "name": "Fisher-Price Laugh & Learn Smart Stages Walker",
     "searchQuery": "Fisher Price Laugh Learn Walker",
     ...
   }
   ```

2. **Frontend builds retailer URLs** - Using the `searchQuery`, links are constructed:

**Location:** `client/src/pages/MilestoneDetail.tsx`

### Amazon URL Builder

Amazon gets special treatment with age-appropriate filters:

```typescript
function buildAmazonUrl(searchQuery: string, ageRangeMonthsMin: number, ageRangeMonthsMax: number): string {
  const baseUrl = 'https://www.amazon.com/s';
  const params = new URLSearchParams();
  
  // Add search query
  params.append('k', searchQuery);
  
  // Add Toys & Games category
  params.append('rh', 'n:165793011');
  
  // Map age range to Amazon age filter IDs
  const avgAgeMonths = (ageRangeMonthsMin + ageRangeMonthsMax) / 2;
  let ageRangeFilter = '';
  
  if (avgAgeMonths <= 6) {
    ageRangeFilter = 'p_n_age_range:2590655011'; // 0-6 months
  } else if (avgAgeMonths <= 12) {
    ageRangeFilter = 'p_n_age_range:2590656011'; // 6-12 months
  } else if (avgAgeMonths <= 24) {
    ageRangeFilter = 'p_n_age_range:2590657011'; // 12-24 months
  } else if (avgAgeMonths <= 48) {
    ageRangeFilter = 'p_n_age_range:2590658011'; // 2-4 years
  } else if (avgAgeMonths <= 84) {
    ageRangeFilter = 'p_n_age_range:2590659011'; // 5-7 years
  } else {
    ageRangeFilter = 'p_n_age_range:2590660011'; // 8-13 years
  }
  
  // Add age filter to URL
  if (ageRangeFilter) {
    const currentRh = params.get('rh') || '';
    params.set('rh', currentRh + ',' + ageRangeFilter);
  }
  
  // Sort by customer reviews
  params.append('s', 'review-rank');
  
  return `${baseUrl}?${params.toString()}`;
}
```

### Target & Walmart URLs

Simple search URL construction:

```typescript
// Target
`https://www.target.com/s?searchTerm=${encodeURIComponent(toy.searchQuery)}`

// Walmart  
`https://www.walmart.com/search?q=${encodeURIComponent(toy.searchQuery)}`
```

### Amazon Age Filter Reference

| Child Age (months) | Amazon Filter ID | Label |
|-------------------|------------------|-------|
| 0-6 | 2590655011 | 0-6 months |
| 7-12 | 2590656011 | 6-12 months |
| 13-24 | 2590657011 | 12-24 months |
| 25-48 | 2590658011 | 2-4 years |
| 49-84 | 2590659011 | 5-7 years |
| 85+ | 2590660011 | 8-13 years |

### User Experience

When users click a retailer button:
- Opens new browser tab
- Lands on retailer's search results page
- Pre-filtered by toy name and (for Amazon) age range
- User can then browse and purchase directly

**No affiliate links are currently implemented** - URLs are direct search links.

---

## Error Handling

### API Not Configured
```typescript
if (!anthropic) {
  return res.status(503).json({ 
    error: "ai_not_configured",
    message: "AI toy recommendations require an Anthropic API key."
  });
}
```

### Frontend Error Handling
```typescript
if (toyRecommendationsError?.message === 'ai_not_configured') {
  // Show friendly message about AI being unavailable
}
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | API key for Claude access |

### Tunable Constants

| Constant | Location | Default | Description |
|----------|----------|---------|-------------|
| `MAX_MILESTONES_TO_WARMUP` | recommendationWarmup.ts | 6 | Max milestones to pre-warm |
| `DELAY_BETWEEN_CALLS_MS` | recommendationWarmup.ts | 500 | Delay between warmup calls |
| `staleTime` | MilestoneDetail.tsx | 1 hour | Frontend cache duration |
| `max_tokens` | routes.ts | 3072 | Claude response token limit |

---

## Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/MilestoneDetail.tsx` | Frontend query, prefetch, dismiss mutation |
| `server/routes.ts` | API endpoints for recommendations and dismissals |
| `server/services/recommendationWarmup.ts` | Background pre-generation service |
| `server/storage.ts` | Database operations interface |
| `shared/schema.ts` | Database table definitions |

---

## Potential Improvements

1. **Rate Limiting** - Add rate limiting to prevent abuse of AI generation endpoint
2. **Fallback Recommendations** - Static fallback if AI is unavailable
3. **Analytics** - Track which recommendations are most helpful
4. **Batch Warmup** - Warm up toy recommendations alongside activity recommendations
5. **Smart Refresh** - Periodically refresh stale recommendations based on new medical research
