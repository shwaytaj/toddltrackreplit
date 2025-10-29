/**
 * ==================================================================================
 * MILESTONE DATA PARSER
 * ==================================================================================
 * 
 * PURPOSE:
 * This module parses the comprehensive milestone data table from a markdown file
 * and extracts structured milestone records for initial database population.
 * 
 * USE CASE:
 * When you have a markdown file with milestone data organized in tables with
 * categories, subcategories, age groups, and age-specific milestone markers,
 * this parser extracts everything into a structured format.
 * 
 * TYPICAL WORKFLOW:
 * 1. Receive markdown file with milestone data tables
 * 2. Use extractMilestones() to parse the entire file
 * 3. Export milestones to JSON or seed database directly
 * 4. Later use milestone-description-parser to add detailed descriptions
 * 
 * KEY DIFFERENCE FROM milestone-description-parser.ts:
 * - This parser: Extracts basic milestone data (title, category, age ranges)
 * - Description parser: Adds detailed "About", "What to look for", "Why it matters"
 * 
 * See PARSER_USAGE_GUIDE.txt for detailed usage instructions.
 * ==================================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * INTERFACE: Milestone
 * 
 * Represents a single developmental milestone with all its metadata.
 * This is the core data structure used throughout the application.
 * 
 * @property title - Short milestone name (truncated if needed for readability)
 * @property category - Top-level category (Developmental, Growth, Hearing, Vision, Teeth)
 * @property subcategory - Specific developmental area (Gross Motor, Fine Motor, Communication, etc.)
 * @property ageRangeMonthsMin - Minimum age in months when milestone typically appears
 * @property ageRangeMonthsMax - Maximum age in months when milestone typically appears
 * @property description - Full milestone description text
 * @property typicalRange - Human-readable age range string (e.g., "9-12 months")
 * 
 * EXAMPLE:
 * {
 *   title: "Sits without support",
 *   category: "Developmental",
 *   subcategory: "Gross Motor",
 *   ageRangeMonthsMin: 6,
 *   ageRangeMonthsMax: 9,
 *   description: "Baby sits upright without hands for support for several seconds",
 *   typicalRange: "7 months"
 * }
 */
interface Milestone {
  title: string;
  category: string;
  subcategory: string;
  ageRangeMonthsMin: number;
  ageRangeMonthsMax: number;
  description: string;
  typicalRange: string | null;
}

/**
 * AGE GROUP MAPPINGS
 * 
 * Maps section headers from the markdown file to age ranges in months.
 * These represent the broad developmental periods used in pediatric guidelines.
 * 
 * USAGE:
 * When the parser encounters "## 3-6 MONTHS" in the markdown file,
 * it uses this mapping to set default age ranges for milestones in that section.
 * 
 * WHY THESE RANGES:
 * Based on CDC, AAP, and WHO developmental milestone guidelines which
 * organize milestones into these standard age groupings.
 */
const ageGroupMappings: Record<string, { min: number; max: number }> = {
  '0-1 MONTHS': { min: 0, max: 1 },
  '1-3 MONTHS': { min: 1, max: 3 },
  '3-6 MONTHS': { min: 3, max: 6 },
  '6-9 MONTHS': { min: 6, max: 9 },
  '9-12 MONTHS': { min: 9, max: 12 },
  '12-18 MONTHS': { min: 12, max: 18 },
  '18-24 MONTHS': { min: 18, max: 24 },
  '24-36 MONTHS (2-3 YEARS)': { min: 24, max: 36 },
  '36-48 MONTHS (3-4 YEARS)': { min: 36, max: 48 },
  '48-60 MONTHS (4-5 YEARS)': { min: 48, max: 60 },
};

/**
 * FUNCTION: parseMonthMarker
 * 
 * Extracts age information from milestone text markers.
 * 
 * @param text - Milestone text that may contain age markers
 * @returns Object with single month OR age range, or null if no marker found
 * 
 * RECOGNIZED FORMATS:
 * - Single month: "**9M:** Sits without support" → { single: 9 }
 * - Range: "**13-19M:** Says first words" → { range: { min: 13, max: 19 } }
 * - By month: "**By 5M:** Reaches for toys" → { single: 5 }
 * - By age: "**By age 3:** Pedals tricycle" → { single: 36 } (converts years to months)
 * - Around age: "**Around age 6:** Ties shoelaces" → { single: 72 }
 * 
 * PURPOSE:
 * Age markers provide more specific timing than the section header.
 * For example, within "6-9 MONTHS" section, a marker "**7M:**" indicates
 * this milestone typically appears at 7 months specifically.
 * 
 * EXAMPLES:
 * ```typescript
 * parseMonthMarker("**9M:** Sits without support")
 * // Returns: { single: 9 }
 * 
 * parseMonthMarker("**13-19M:** Says 2-3 words")
 * // Returns: { range: { min: 13, max: 19 } }
 * 
 * parseMonthMarker("**By age 3:** Rides tricycle")
 * // Returns: { single: 36 }
 * 
 * parseMonthMarker("Begins to crawl")
 * // Returns: null (no age marker)
 * ```
 */
function parseMonthMarker(text: string): { single: number } | { range: { min: number; max: number } } | null {
  // Match range markers like "**13-19M:**" or "**16-22M:**"
  const rangeMatch = text.match(/\*\*(\d+)-(\d+)M:\*\*/);
  if (rangeMatch) {
    return {
      range: {
        min: parseInt(rangeMatch[1], 10),
        max: parseInt(rangeMatch[2], 10)
      }
    };
  }
  
  // Match single month markers like "**9M:**", "**12M:**", or "**By 5M:**"
  let singleMatch = text.match(/\*\*(\d+)M:\*\*/);
  if (!singleMatch) {
    singleMatch = text.match(/\*\*By (\d+)M:\*\*/);
  }
  if (singleMatch) {
    return { single: parseInt(singleMatch[1], 10) };
  }
  
  // Match age markers like "**By age 3:**" or "**Around age 6:**"
  const ageMatch = text.match(/\*\*(?:By age|Around age) (\d+):\*\*/);
  if (ageMatch) {
    const years = parseInt(ageMatch[1], 10);
    return { single: years * 12 }; // Convert years to months
  }
  
  return null;
}

/**
 * FUNCTION: cleanMilestoneText
 * 
 * Removes age markers and formatting from milestone text to extract clean content.
 * 
 * @param text - Raw milestone text with possible markers and formatting
 * @returns string - Clean milestone description ready for database
 * 
 * TRANSFORMATIONS:
 * 1. Removes "**9M:**" style markers
 * 2. Removes "**13-19M:**" range markers
 * 3. Removes "**By 5M:**" markers
 * 4. Removes "**By age 3:**" markers
 * 5. Removes "**Around age 6:**" markers
 * 6. Preserves content in "**Should have...**" (removes ** but keeps text)
 * 7. Trims whitespace
 * 
 * PURPOSE:
 * The markers are useful for age extraction but shouldn't appear in the
 * final milestone description shown to users.
 * 
 * EXAMPLES:
 * ```typescript
 * cleanMilestoneText("**9M:** Sits without support")
 * // Returns: "Sits without support"
 * 
 * cleanMilestoneText("**13-19M:** Says first words mama/dada")
 * // Returns: "Says first words mama/dada"
 * 
 * cleanMilestoneText("**Should have all baby teeth** by age 3")
 * // Returns: "Should have all baby teeth by age 3"
 * 
 * cleanMilestoneText("**By age 3:** Pedals tricycle")
 * // Returns: "Pedals tricycle"
 * ```
 */
function cleanMilestoneText(text: string): string {
  // Remove various month marker formats from the beginning:
  // - "**9M:** " or "**13-19M:** " → Remove completely
  // - "**By 5M:** " or "**By 24M:** " → Remove completely
  // - "**By age 3:** " or "**Around age 6:** " → Remove completely
  // - "**Should have...** " → Keep content but remove ** markers
  let cleaned = text
    .replace(/^\*\*(\d+(-\d+)?M):\*\*\s*/, '') // Remove "**9M:** " or "**13-19M:** "
    .replace(/^\*\*By (\d+M):\*\*\s*/, '')      // Remove "**By 5M:** "
    .replace(/^\*\*By age \d+:\*\*\s*/, '')   // Remove "**By age 3:** "
    .replace(/^\*\*Around age \d+:\*\*\s*/, '') // Remove "**Around age 6:** "
    .replace(/^\*\*(Should have [^*]+)\*\*\s*/, '$1') // Keep "Should have..." content, remove ** only
    .trim();
  
  return cleaned;
}

/**
 * FUNCTION: extractMilestones
 * 
 * Main parsing function that reads a markdown file and extracts all milestone data.
 * 
 * @param filePath - Path to the markdown file containing milestone data
 * @returns Array of Milestone objects ready for database insertion
 * 
 * EXPECTED FILE STRUCTURE:
 * ```markdown
 * ## 6-9 MONTHS
 * 
 * | **Category** | **Subcategory** | **Milestones** |
 * |--------------|-----------------|----------------|
 * | **Developmental** | Gross Motor | • **7M:** Sits without support<br>• **9M:** Begins to crawl |
 * | **Developmental** | Fine Motor | • **8M:** Picks up small objects with thumb and finger |
 * | | Communication | • **9M:** Says "mama" or "dada" |
 * | **Growth** | Physical | • Weight gain continues steadily |
 * ```
 * 
 * PARSING LOGIC:
 * 1. Reads file line by line
 * 2. Tracks current age group from ## headers
 * 3. Parses markdown tables with category, subcategory, milestones columns
 * 4. Handles continuation rows (where category/subcategory is empty)
 * 5. Splits milestone column by bullet points (• or <br>)
 * 6. Extracts age markers for precise age ranges
 * 7. Generates titles (first 60 chars or first sentence)
 * 
 * STATE TRACKING:
 * The parser maintains three state variables as it reads:
 * - currentAgeGroup: Current ## section (e.g., "6-9 MONTHS")
 * - currentCategory: Last seen category (e.g., "Developmental")
 * - currentSubcategory: Last seen subcategory (e.g., "Gross Motor")
 * 
 * This allows continuation rows to inherit context from previous rows.
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const milestones = extractMilestones('./milestone-data.md');
 * console.log(`Extracted ${milestones.length} milestones`);
 * 
 * // Output to JSON
 * fs.writeFileSync('milestones.json', JSON.stringify(milestones, null, 2));
 * 
 * // Or seed database
 * await db.insert(milestonesTable).values(milestones);
 * ```
 * 
 * SKIPPED SECTIONS:
 * The parser automatically stops at sections containing:
 * - "SCREENING" (developmental screening recommendations)
 * - "WHEN TO SEEK" (red flags and concerns)
 * - "IMPORTANT NOTES" (general guidance)
 * 
 * These sections are informational but not milestone data.
 */
function extractMilestones(filePath: string): Milestone[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const milestones: Milestone[] = [];
  
  // STATE VARIABLES: Track context as we parse line by line
  let currentAgeGroup: string | null = null;
  let currentCategory: string | null = null;
  let currentSubcategory: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // STEP 1: Check for age group headers (## 6-9 MONTHS)
    if (line.startsWith('## ') && Object.keys(ageGroupMappings).some(key => line.includes(key))) {
      for (const key of Object.keys(ageGroupMappings)) {
        if (line.includes(key)) {
          currentAgeGroup = key;
          break;
        }
      }
      continue;
    }
    
    // STEP 2: Stop at informational sections (not milestone data)
    if (line.includes('SCREENING') || line.includes('WHEN TO SEEK') || line.includes('IMPORTANT NOTES')) {
      break;
    }
    
    // STEP 3: Parse table rows with category, subcategory, and milestones
    // Format: | **Category** | Subcategory | • Milestone 1<br>• Milestone 2 |
    if (line.startsWith('| **') && !line.includes('Category') && !line.includes('---')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      
      if (parts.length >= 3) {
        // Extract category (e.g., "**Developmental**" or "**Growth**")
        const categoryMatch = parts[0].match(/\*\*(.+?)\*\*/);
        if (categoryMatch) {
          currentCategory = categoryMatch[1];
          currentSubcategory = parts[1].replace(/\*\*/g, '').trim();
          
          // Parse milestones from the third column
          const milestonesText = parts[2];
          parseMilestoneColumn(
            milestonesText,
            currentAgeGroup!,
            currentCategory,
            currentSubcategory,
            milestones
          );
        }
      }
    }
    
    // STEP 4: Handle continuation rows (where category column is empty)
    // Format: | | New Subcategory | • Milestone 1 |
    // These rows inherit the category from the previous row
    if (line.startsWith('| |') && currentCategory && currentSubcategory) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      
      if (parts.length >= 2) {
        // Check if this is a new subcategory or milestones
        if (parts[0] === '') {
          const subcategoryOrMilestones = parts[1];
          
          // If it doesn't have ** markers, it's likely a continuation
          if (!subcategoryOrMilestones.startsWith('**') && parts.length >= 2) {
            // Skip empty entries
            if (subcategoryOrMilestones && subcategoryOrMilestones !== '') {
              currentSubcategory = subcategoryOrMilestones;
              const milestonesText = parts[2];
              parseMilestoneColumn(
                milestonesText,
                currentAgeGroup!,
                currentCategory,
                currentSubcategory,
                milestones
              );
            }
          }
        }
      }
    }
  }
  
  return milestones;
}

/**
 * FUNCTION: parseMilestoneColumn
 * 
 * Parses the "Milestones" column from a table row and extracts individual milestones.
 * 
 * @param milestonesText - Raw text from the milestones column (may contain multiple bullets)
 * @param ageGroup - Current age group section (e.g., "6-9 MONTHS")
 * @param category - Milestone category (e.g., "Developmental")
 * @param subcategory - Milestone subcategory (e.g., "Gross Motor")
 * @param milestones - Array to append parsed milestones to (mutated)
 * 
 * PURPOSE:
 * A single table cell can contain multiple milestones separated by bullets or <br> tags.
 * This function splits them and creates individual milestone records.
 * 
 * PROCESSING STEPS:
 * 1. Split by bullet points (• or <br>•)
 * 2. For each bullet point:
 *    a. Parse age marker if present
 *    b. Clean text (remove markers)
 *    c. Determine age range (from marker or age group)
 *    d. Create title (first 60 chars or first sentence)
 *    e. Add milestone to array
 * 
 * AGE RANGE LOGIC:
 * - If milestone has **9M:** marker → Use specific month with ±1-2 month buffer
 * - If milestone has **13-19M:** range → Use exact range
 * - If no marker → Use full age group range (e.g., 6-9 months)
 * 
 * TITLE GENERATION:
 * Titles are truncated for UI display (milestone cards, lists).
 * - If description < 60 chars → Use full description
 * - If longer → Extract first sentence (up to . , ;)
 * - If no sentence break → Truncate at 60 chars + "..."
 * 
 * EXAMPLE INPUT:
 * ```
 * milestonesText = "• **7M:** Sits without support<br>• **9M:** Begins to crawl forward"
 * ageGroup = "6-9 MONTHS"
 * category = "Developmental"
 * subcategory = "Gross Motor"
 * ```
 * 
 * EXAMPLE OUTPUT (appended to milestones array):
 * ```
 * [
 *   {
 *     title: "Sits without support",
 *     category: "Developmental",
 *     subcategory: "Gross Motor",
 *     ageRangeMonthsMin: 6,
 *     ageRangeMonthsMax: 9,
 *     description: "Sits without support",
 *     typicalRange: "7 months"
 *   },
 *   {
 *     title: "Begins to crawl forward",
 *     category: "Developmental",
 *     subcategory: "Gross Motor",
 *     ageRangeMonthsMin: 8,
 *     ageRangeMonthsMax: 9,
 *     description: "Begins to crawl forward",
 *     typicalRange: "9 months"
 *   }
 * ]
 * ```
 */
function parseMilestoneColumn(
  milestonesText: string,
  ageGroup: string,
  category: string,
  subcategory: string,
  milestones: Milestone[]
) {
  // VALIDATION: Ensure all required parameters are present
  if (!ageGroup || !category || !subcategory || !milestonesText) return;
  
  // Get the base age range for this section
  const baseAgeRange = ageGroupMappings[ageGroup];
  if (!baseAgeRange) return;
  
  // STEP 1: Split by bullet points (• or <br>•)
  // This handles both bullet-separated and line-break-separated milestones
  const bulletPoints = milestonesText
    .split(/(?:<br>|•)/)
    .map(s => s.trim())
    .filter(s => s && s !== '');
  
  // STEP 2: Process each bullet point as a separate milestone
  for (const bullet of bulletPoints) {
    const monthMarker = parseMonthMarker(bullet);
    const cleanText = cleanMilestoneText(bullet);
    
    // Skip empty or malformed entries
    if (!cleanText) continue;
    
    let ageRangeMin: number;
    let ageRangeMax: number;
    let typicalRange: string | null = null;
    
    // STEP 3: Determine age range based on marker or age group
    if (monthMarker !== null) {
      if ('range' in monthMarker) {
        // CASE A: Range marker (e.g., "**13-19M:**" or "**16-22M:**")
        // Use exact range from marker
        ageRangeMin = monthMarker.range.min;
        ageRangeMax = monthMarker.range.max;
        typicalRange = `${monthMarker.range.min}-${monthMarker.range.max} months`;
      } else {
        // CASE B: Single month marker (e.g., "**9M:**")
        // Use the month as midpoint and add buffer (±1-2 months)
        // Constrained within the section's age group
        ageRangeMin = Math.max(baseAgeRange.min, monthMarker.single - 1);
        ageRangeMax = Math.min(baseAgeRange.max, monthMarker.single + 2);
        typicalRange = `${monthMarker.single} months`;
      }
    } else {
      // CASE C: No marker - general milestone for the age range
      // Use full age group range
      ageRangeMin = baseAgeRange.min;
      ageRangeMax = baseAgeRange.max;
      typicalRange = `${baseAgeRange.min}-${baseAgeRange.max} months`;
    }
    
    // STEP 4: Generate a concise title for UI display
    // Titles appear in milestone cards, lists, and navigation
    let title = cleanText;
    if (title.length > 60) {
      // Try to find a natural break (first sentence)
      const firstSentence = title.match(/^[^,.;]+/);
      title = firstSentence ? firstSentence[0] : title.substring(0, 60) + '...';
    }
    
    // STEP 5: Create milestone record and add to array
    milestones.push({
      title,
      category,
      subcategory,
      ageRangeMonthsMin: ageRangeMin,
      ageRangeMonthsMax: ageRangeMax,
      description: cleanText,
      typicalRange,
    });
  }
}

/**
 * ==================================================================================
 * MAIN EXECUTION SCRIPT
 * ==================================================================================
 * 
 * This section runs when the file is executed directly (not imported).
 * 
 * PURPOSE:
 * - Parse the milestone data file
 * - Display summary statistics
 * - Show sample milestones for verification
 * - Export data for use in seed scripts
 * 
 * USAGE:
 * ```bash
 * tsx server/parse-milestones.ts
 * ```
 * 
 * OUTPUT:
 * - Total milestone count
 * - Sample milestones (first 5)
 * - Breakdown by category and subcategory
 * 
 * EXPECTED OUTPUT EXAMPLE:
 * ```
 * Extracted 164 milestones
 * 
 * Sample milestones:
 * [
 *   {
 *     "title": "Lifts head briefly",
 *     "category": "Developmental",
 *     "subcategory": "Gross Motor",
 *     ...
 *   }
 * ]
 * 
 * Milestones by category/subcategory:
 *   Developmental - Gross Motor: 23
 *   Developmental - Fine Motor: 16
 *   Developmental - Communication: 18
 *   ...
 * ```
 */

// Main execution
const filePath = path.join(__dirname, '../attached_assets/dev-milestones-comprehensive_1761612366476.md');
const milestones = extractMilestones(filePath);

console.log(`Extracted ${milestones.length} milestones`);
console.log('\nSample milestones:');
console.log(JSON.stringify(milestones.slice(0, 5), null, 2));

// Group by category for overview
const categoryCounts: Record<string, number> = {};
milestones.forEach(m => {
  const key = `${m.category} - ${m.subcategory}`;
  categoryCounts[key] = (categoryCounts[key] || 0) + 1;
});

console.log('\nMilestones by category/subcategory:');
Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([key, count]) => {
    console.log(`  ${key}: ${count}`);
  });

// Export for use in seed script
export { Milestone, extractMilestones };
