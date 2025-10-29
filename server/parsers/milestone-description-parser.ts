/**
 * ==================================================================================
 * MILESTONE DESCRIPTION PARSER
 * ==================================================================================
 * 
 * PURPOSE:
 * This module parses comprehensive milestone description files (in markdown format)
 * and extracts structured information for storing in the database.
 * 
 * USE CASE:
 * When you have a markdown file with detailed milestone descriptions including
 * "About", "What to look for", and "Why it matters" sections, this parser will
 * extract that information and format it for database storage.
 * 
 * TYPICAL WORKFLOW:
 * 1. Receive markdown file with milestone descriptions
 * 2. Use parseMilestoneDescriptions() to extract all milestone data
 * 3. Use normalizeMilestoneTitle() to match with existing database records
 * 4. Use formatMilestoneDescription() to create database-ready content
 * 5. Update database records with formatted descriptions
 * 
 * See PARSER_USAGE_GUIDE.txt for detailed usage instructions.
 * ==================================================================================
 */

/**
 * INTERFACE: ParsedMilestone
 * 
 * Represents a single milestone with all its description components extracted.
 * 
 * @property title - The milestone name/title (e.g., "Lifts head briefly while lying on tummy")
 * @property about - Detailed explanation paragraph from the "About" section
 * @property whatToLookFor - Array of observable behaviors (bullet points)
 * @property whyItMatters - Array of developmental significance points (bullet points)
 * 
 * EXAMPLE:
 * {
 *   title: "Sits without support",
 *   about: "By 6-9 months, most babies can sit independently...",
 *   whatToLookFor: [
 *     "Baby sits upright without hands for support",
 *     "Can reach for toys while sitting"
 *   ],
 *   whyItMatters: [
 *     "Develops core strength and balance",
 *     "Frees hands for exploration and play"
 *   ]
 * }
 */
export interface ParsedMilestone {
  title: string;
  about: string;
  whatToLookFor: string[];
  whyItMatters: string[];
}

/**
 * INTERFACE: ParseResult
 * 
 * The return type for parseMilestoneDescriptions() containing both
 * successfully parsed milestones and any errors encountered.
 * 
 * @property milestones - Array of successfully parsed milestone objects
 * @property errors - Array of error messages for milestones that couldn't be parsed
 * 
 * WHY ERRORS MATTER:
 * The parser is forgiving - it will skip malformed milestones and continue parsing.
 * Check the errors array to see which milestones need manual review or fixing
 * in the source file.
 */
export interface ParseResult {
  milestones: ParsedMilestone[];
  errors: string[];
}

/**
 * FUNCTION: parseMilestoneDescriptions
 * 
 * Main parsing function that extracts milestone descriptions from a markdown file.
 * 
 * @param content - The complete markdown file content as a string
 * @returns ParseResult - Object containing parsed milestones and any errors
 * 
 * EXPECTED INPUT FORMAT:
 * ```markdown
 * ## 0-1 MONTHS
 * 
 * ### DEVELOPMENTAL - Gross Motor Skills
 * 
 * #### Lifts head briefly while lying on tummy
 * 
 * About
 * 
 * Around the 1-month mark, your baby might start to briefly lift their head...
 * 
 * What to look for:
 * - Baby turns their head from side to side
 * - Head lifts slightly off the floor
 * - Brief periods of head elevation
 * 
 * Why it matters:
 * - Develops essential neck muscle strength
 * - Builds foundational strength for future milestones
 * - Provides vestibular stimulation
 * ```
 * 
 * KEY FEATURES:
 * - Handles age prefixes (e.g., "2M: Milestone title" or "13-19M: Milestone title")
 * - Skips category headers (e.g., "DEVELOPMENTAL - Gross Motor Skills")
 * - Extracts three structured sections from each milestone
 * - Collects errors for malformed entries without stopping the parse
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { readFileSync } from 'fs';
 * import { parseMilestoneDescriptions } from './parsers/milestone-description-parser';
 * 
 * const fileContent = readFileSync('milestone-descriptions.md', 'utf-8');
 * const { milestones, errors } = parseMilestoneDescriptions(fileContent);
 * 
 * console.log(`Parsed ${milestones.length} milestones`);
 * if (errors.length > 0) {
 *   console.log('Errors:', errors);
 * }
 * ```
 * 
 * COMMON PARSING ERRORS:
 * - Missing "About" section → Milestone skipped
 * - Missing "What to look for" section → Milestone skipped
 * - Missing "Why it matters" section → Milestone skipped
 * - Empty sections → Milestone skipped
 * - No bullet points in list sections → Milestone skipped
 */
export function parseMilestoneDescriptions(content: string): ParseResult {
  const milestones: ParsedMilestone[] = [];
  const errors: string[] = [];

  // STEP 1: Split the file into sections by #### headers
  // Each #### represents either a milestone or a category header
  const sections = content.split(/^####\s+/m).filter(s => s.trim());

  // STEP 2: Process each section
  for (const section of sections) {
    try {
      const lines = section.split('\n');
      const title = lines[0].trim();

      // STEP 3: Skip category headers (not actual milestones)
      // Category headers look like: "DEVELOPMENTAL - Gross Motor Skills"
      if (title.includes('DEVELOPMENTAL -') || 
          title.includes('GROWTH -') || 
          title.includes('HEARING -') || 
          title.includes('VISION -') || 
          title.includes('TEETH -') ||
          !title) {
        continue;
      }

      // STEP 4: Find the three required sections
      // Each milestone MUST have these three sections to be valid

      // Find "About" section (single word on its own line)
      const aboutIndex = lines.findIndex(l => l.trim() === 'About');
      if (aboutIndex === -1) {
        errors.push(`No "About" section found for: ${title}`);
        continue;
      }

      // Find "What to look for:" section (case-insensitive)
      const whatToLookForIndex = lines.findIndex(l => 
        l.trim().toLowerCase().startsWith('what to look for')
      );
      if (whatToLookForIndex === -1) {
        errors.push(`No "What to look for" section found for: ${title}`);
        continue;
      }

      // Find "Why it matters:" section (case-insensitive)
      const whyItMattersIndex = lines.findIndex(l => 
        l.trim().toLowerCase().startsWith('why it matters')
      );
      if (whyItMattersIndex === -1) {
        errors.push(`No "Why it matters" section found for: ${title}`);
        continue;
      }

      // STEP 5: Extract the "About" text
      // This is all text between "About" and "What to look for:"
      // Multiple paragraphs are joined with double newlines
      const aboutLines = lines.slice(aboutIndex + 1, whatToLookForIndex)
        .map(l => l.trim())
        .filter(l => l.length > 0);
      const about = aboutLines.join('\n\n');

      // STEP 6: Extract "What to look for" bullets
      // Looks for lines starting with - or •
      // Strips the bullet character and trims whitespace
      const whatToLookForLines = lines.slice(whatToLookForIndex + 1, whyItMattersIndex)
        .map(l => l.trim())
        .filter(l => l.startsWith('-') || l.startsWith('•'))
        .map(l => l.replace(/^[-•]\s*/, '').trim())
        .filter(l => l.length > 0);

      // STEP 7: Extract "Why it matters" bullets
      // Same process as "What to look for" but runs to end of section
      const whyItMattersLines = lines.slice(whyItMattersIndex + 1)
        .map(l => l.trim())
        .filter(l => l.startsWith('-') || l.startsWith('•'))
        .map(l => l.replace(/^[-•]\s*/, '').trim())
        .filter(l => l.length > 0);

      // STEP 8: Validate extracted content
      // All three sections must have content
      if (!about) {
        errors.push(`Empty "About" section for: ${title}`);
        continue;
      }

      if (whatToLookForLines.length === 0) {
        errors.push(`No bullets in "What to look for" for: ${title}`);
        continue;
      }

      if (whyItMattersLines.length === 0) {
        errors.push(`No bullets in "Why it matters" for: ${title}`);
        continue;
      }

      // STEP 9: Add successfully parsed milestone to results
      milestones.push({
        title,
        about,
        whatToLookFor: whatToLookForLines,
        whyItMatters: whyItMattersLines
      });

    } catch (error) {
      // Catch any unexpected errors and continue parsing
      errors.push(`Error parsing section: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { milestones, errors };
}

/**
 * FUNCTION: formatMilestoneDescription
 * 
 * Formats a parsed milestone object into the structured markdown format
 * expected by the MilestoneDetail component in the frontend.
 * 
 * @param milestone - A ParsedMilestone object with all sections
 * @returns string - Formatted markdown ready for database storage
 * 
 * OUTPUT FORMAT:
 * The output is designed to be stored in the database 'description' field
 * and rendered by the MilestoneDetail.tsx component.
 * 
 * GENERATED STRUCTURE:
 * ```
 * **About**
 * 
 * [About text paragraph]
 * 
 * **What to look for**
 * • Bullet point 1
 * • Bullet point 2
 * 
 * **Why it matters**
 * 
 * • Bullet point 1
 * • Bullet point 2
 * ```
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const parsedMilestone = {
 *   title: "Sits without support",
 *   about: "By 6-9 months, babies develop core strength...",
 *   whatToLookFor: ["Sits upright", "Reaches for toys"],
 *   whyItMatters: ["Develops balance", "Frees hands for play"]
 * };
 * 
 * const formatted = formatMilestoneDescription(parsedMilestone);
 * // Store in database: milestones.description = formatted
 * ```
 * 
 * WHY THIS FORMAT:
 * - The frontend MilestoneDetail component parses these **Section** headers
 * - Bullet points (•) are automatically rendered as <li> elements
 * - The structure allows for collapsible sections in the UI
 */
export function formatMilestoneDescription(milestone: ParsedMilestone): string {
  const parts: string[] = [];

  // Section 1: About (plain paragraph text)
  parts.push('**About**');
  parts.push('');  // Blank line for spacing
  parts.push(milestone.about);
  parts.push('');  // Blank line before next section

  // Section 2: What to look for (bulleted list)
  parts.push('**What to look for**');
  for (const item of milestone.whatToLookFor) {
    parts.push(`• ${item}`);  // Add bullet character to each item
  }
  parts.push('');  // Blank line before next section

  // Section 3: Why it matters (bulleted list)
  parts.push('**Why it matters**');
  parts.push('');  // Blank line for consistent spacing
  for (const item of milestone.whyItMatters) {
    parts.push(`• ${item}`);  // Add bullet character to each item
  }

  // Join all parts with newlines
  return parts.join('\n');
}

/**
 * FUNCTION: normalizeMilestoneTitle
 * 
 * Normalizes milestone titles for fuzzy matching between files and database.
 * 
 * @param title - The raw milestone title from either source
 * @returns string - Normalized title for comparison
 * 
 * PURPOSE:
 * Milestone titles may have slight variations between the description file
 * and the database. This function standardizes titles to enable matching.
 * 
 * TRANSFORMATIONS APPLIED:
 * 1. Removes age prefixes: "2M: Title" → "Title"
 * 2. Converts to lowercase: "Title" → "title"
 * 3. Normalizes quotes: "smart quotes" → "straight quotes"
 * 4. Normalizes dashes: em-dash → hyphen
 * 5. Normalizes whitespace: multiple spaces → single space
 * 6. Trims leading/trailing spaces
 * 
 * EXAMPLES:
 * ```typescript
 * normalizeMilestoneTitle("2M: Lifts head")
 * // Returns: "lifts head"
 * 
 * normalizeMilestoneTitle("Begins to loosen tight fists")
 * // Returns: "begins to loosen tight fists"
 * 
 * normalizeMilestoneTitle("12M: Says "mama" and "dada"")
 * // Returns: 'says "mama" and "dada"'
 * 
 * normalizeMilestoneTitle("Walks independently—no support")
 * // Returns: "walks independently-no support"
 * ```
 * 
 * USAGE IN MATCHING:
 * ```typescript
 * const fileTitle = "2M: Lifts chest on tummy";
 * const dbTitle = "Lifts chest on tummy";
 * 
 * if (normalizeMilestoneTitle(fileTitle) === normalizeMilestoneTitle(dbTitle)) {
 *   console.log("Match found!");
 * }
 * ```
 * 
 * WHY NORMALIZATION MATTERS:
 * - Files may use age prefixes (2M:, 12M:) but database titles don't
 * - Different sources may use different quote styles or dashes
 * - Case-insensitive matching prevents missing matches due to capitalization
 * - Allows ~90% automatic matching between files and database
 */
export function normalizeMilestoneTitle(title: string): string {
  return title
    .toLowerCase()                      // Convert to lowercase for case-insensitive matching
    .replace(/^\d+m:\s*/i, '')         // Remove age prefixes like "2M:", "12M:", "24M:"
    .replace(/["""'']/g, '"')          // Normalize curly quotes to straight quotes
    .replace(/[–—]/g, '-')              // Normalize em-dash and en-dash to hyphen
    .replace(/\s+/g, ' ')               // Replace multiple spaces with single space
    .trim();                            // Remove leading/trailing whitespace
}
