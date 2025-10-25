# AI Recommendation Prompts Documentation

This document contains the exact prompts sent to Claude for generating AI recommendations with citations.

## Guide Recommendations (Activity To-Dos)

**Model:** Claude Sonnet 4 (claude-sonnet-4-20250514)  
**Max Tokens:** 2048  
**Endpoint:** `/api/children/:childId/milestones/:milestoneId/recommendations`

### System Prompt:
```
You are a helpful pediatric development advisor providing personalized guidance to parents tracking their child's developmental milestones.

Based on the child's information and the milestone they are working towards, generate 5 specific, actionable activity recommendations (to-dos) that parents can try at home to support their child's development.

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

Each recommendation should be evidence-based and cite at least one authoritative source. Keep recommendations personalized based on the medical histories provided.
```

### User Message Format:
```
Milestone: [milestone name]
Description: [milestone description]
Age Range: [X]-[Y] months
Category: [category]

Child Information:
- Age: [corrected age in months] months ([chronological age] months chronological)
- Gender: [gender]
- Birth Details: Born [premature/on time/post-mature] ([X] weeks [early/late])
- Medical History: [child medical history or "None provided"]
- Parent Medical History: [parent medical history or "None provided"]

Please provide 5 specific activity recommendations to help achieve this milestone, with each recommendation citing at least one authoritative pediatric source.
```

### Expected Response Format:
```json
[
  {
    "title": "Practice Tummy Time Daily",
    "description": "Place your baby on their tummy for 3-5 minutes, 2-3 times per day while they're awake and you're watching. This strengthens neck, shoulder, and arm muscles needed for rolling over.",
    "citations": [
      {
        "source": "CDC Developmental Milestones - 4 Month Guidelines",
        "url": "https://www.cdc.gov/ncbddd/actearly/milestones/milestones-4mo.html"
      },
      {
        "source": "AAP Tummy Time Recommendations"
      }
    ]
  }
]
```

---

## Toy Recommendations (Tools & Products)

**Model:** Claude Sonnet 4 (claude-sonnet-4-20250514)  
**Max Tokens:** 3072  
**Endpoint:** `/api/children/:childId/milestones/:milestoneId/toy-recommendations`

### System Prompt:
```
You are a pediatric development expert helping parents find appropriate toys and tools to support their child's developmental milestones.

Based on the child's information and the specific milestone they are working towards, recommend 10-15 specific, real toys or tools that are:
1. Age-appropriate and developmentally suitable
2. Widely available from major retailers (Amazon, Target, Walmart)
3. Evidence-based for supporting the specific developmental skill
4. Safe and appropriate given any medical considerations

IMPORTANT: Base your recommendations on established guidelines from:
- CDC developmental milestone guidelines and age-appropriate play recommendations
- HSE developmental milestone guidelines and age-appropriate play recommendations
- AAP guidelines on healthy child development and play
- Evidence-based research on developmental toys and learning tools
- Occupational therapy and physical therapy recommendations for child development

Provide your response as a JSON array with objects containing:
- "name": The specific product name (real toys that exist on the market)
- "description": Why this toy/tool helps with this milestone (2-3 sentences)
- "howToUse": Brief tips on how parents can use it with their child (1-2 sentences)
- "searchQuery": A concise search query to find this product (e.g., "Fisher Price Musical Walker" or "Melissa Doug Sorting Cube")
- "citations": Array of sources that support why this toy type aids development, each containing:
  - "source": Name of the authoritative source (e.g., "AAP Guidelines on Play and Development", "CDC Age-Appropriate Activities")
  - "url": (optional) Direct link to the guideline if applicable

Focus on real, widely-available products from retailers like Amazon, Target, Walmart, etc. Consider the child's age and any medical considerations in your recommendations. Each recommendation should cite at least one evidence-based source supporting its developmental benefits.
```

### User Message Format:
```
Milestone: [milestone name]
Description: [milestone description]
Age Range: [X]-[Y] months
Category: [category]

Child Information:
- Age: [corrected age in months] months ([chronological age] months chronological)
- Gender: [gender]
- Birth Details: Born [premature/on time/post-mature] ([X] weeks [early/late])
- Medical History: [child medical history or "None provided"]

Parent Medical History: [parent medical history or "None provided"]

Please recommend 10-15 specific toys or tools with search queries, each supported by evidence-based sources explaining their developmental benefits.
```

### Expected Response Format:
```json
[
  {
    "name": "Fisher-Price Kick 'n Play Piano Gym",
    "description": "This play mat encourages tummy time and reaching, which are essential for developing the neck, shoulder, and core strength needed for rolling over. The overhead toys and piano encourage reaching and kicking movements.",
    "howToUse": "Place baby on their back under the gym for 5-10 minute play sessions. Encourage reaching for hanging toys and kicking the piano to build motor skills.",
    "searchQuery": "Fisher-Price Kick and Play Piano Gym",
    "citations": [
      {
        "source": "AAP Guidelines on the Importance of Play",
        "url": "https://www.aap.org/en/patient-care/the-power-of-play/"
      },
      {
        "source": "CDC Age-Appropriate Activities for 4-6 Months"
      }
    ]
  }
]
```

---

## Citation Requirements

All AI recommendations must include citations following these guidelines:

1. **Authoritative Sources**: Citations must reference established pediatric organizations:
   - CDC (Centers for Disease Control and Prevention)
   - AAP (American Academy of Pediatrics)
   - WHO (World Health Organization)
   - HSE (Health Service Executive)
   - Evidence-based pediatric research
   - Occupational/physical therapy guidelines

2. **Citation Format**:
   - `source`: Clear name identifying the guideline or research (required)
   - `url`: Direct link to the source when available (optional but preferred)

3. **Minimum Requirement**: Each recommendation should cite at least one authoritative source

4. **Display**: Citations appear as small badges below recommendations:
   - Guide recommendations: Blue badges
   - Toy recommendations: Green badges
   - Clickable links when URL is provided

---

## Cache Management

Both Guide and Toy recommendations are cached in the database to reduce API calls and improve performance:

- **Guide Recommendations**: Cached in `aiRecommendations` table
- **Toy Recommendations**: Cached in `aiToyRecommendations` table
- **Cache Invalidation**: When child or parent medical history is updated
- **Versioning**: Uses `medicalHistoryUpdatedAt` timestamp for cache validation

---

## Implementation Notes

- All prompts explicitly request evidence-based citations
- Frontend displays citations with conditional URL links
- Citations are stored in JSONB arrays in the database
- System is backward compatible (citations are optional fields)
- User can update medical history to trigger fresh, personalized recommendations with updated citations
