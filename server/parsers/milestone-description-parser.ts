/**
 * Milestone Description Parser
 * 
 * Parses milestone descriptions from markdown files into structured format.
 * Can be reused for future milestone data imports.
 */

export interface ParsedMilestone {
  title: string;
  about: string;
  whatToLookFor: string[];
  whyItMatters: string[];
}

export interface ParseResult {
  milestones: ParsedMilestone[];
  errors: string[];
}

/**
 * Parse a milestone descriptions markdown file
 * 
 * Expected format:
 * #### Milestone Title
 * 
 * About
 * 
 * [About paragraph text...]
 * 
 * What to look for:
 * - Bullet point 1
 * - Bullet point 2
 * 
 * Why it matters:
 * - Bullet point 1
 * - Bullet point 2
 */
export function parseMilestoneDescriptions(content: string): ParseResult {
  const milestones: ParsedMilestone[] = [];
  const errors: string[] = [];

  // Split into sections by #### headers (milestone titles)
  const sections = content.split(/^####\s+/m).filter(s => s.trim());

  for (const section of sections) {
    try {
      const lines = section.split('\n');
      const title = lines[0].trim();

      // Skip if this is just a header section (like "DEVELOPMENTAL - Gross Motor Skills")
      if (title.includes('DEVELOPMENTAL -') || 
          title.includes('GROWTH -') || 
          title.includes('HEARING -') || 
          title.includes('VISION -') || 
          title.includes('TEETH -') ||
          !title) {
        continue;
      }

      // Find the "About" section
      const aboutIndex = lines.findIndex(l => l.trim() === 'About');
      if (aboutIndex === -1) {
        errors.push(`No "About" section found for: ${title}`);
        continue;
      }

      // Find "What to look for:" section
      const whatToLookForIndex = lines.findIndex(l => 
        l.trim().toLowerCase().startsWith('what to look for')
      );
      if (whatToLookForIndex === -1) {
        errors.push(`No "What to look for" section found for: ${title}`);
        continue;
      }

      // Find "Why it matters:" section
      const whyItMattersIndex = lines.findIndex(l => 
        l.trim().toLowerCase().startsWith('why it matters')
      );
      if (whyItMattersIndex === -1) {
        errors.push(`No "Why it matters" section found for: ${title}`);
        continue;
      }

      // Extract About text (between "About" and "What to look for")
      const aboutLines = lines.slice(aboutIndex + 1, whatToLookForIndex)
        .map(l => l.trim())
        .filter(l => l.length > 0);
      const about = aboutLines.join('\n\n');

      // Extract "What to look for" bullets (between "What to look for:" and "Why it matters:")
      const whatToLookForLines = lines.slice(whatToLookForIndex + 1, whyItMattersIndex)
        .map(l => l.trim())
        .filter(l => l.startsWith('-') || l.startsWith('•'))
        .map(l => l.replace(/^[-•]\s*/, '').trim())
        .filter(l => l.length > 0);

      // Extract "Why it matters" bullets (from "Why it matters:" to end of section)
      const whyItMattersLines = lines.slice(whyItMattersIndex + 1)
        .map(l => l.trim())
        .filter(l => l.startsWith('-') || l.startsWith('•'))
        .map(l => l.replace(/^[-•]\s*/, '').trim())
        .filter(l => l.length > 0);

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

      milestones.push({
        title,
        about,
        whatToLookFor: whatToLookForLines,
        whyItMatters: whyItMattersLines
      });

    } catch (error) {
      errors.push(`Error parsing section: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { milestones, errors };
}

/**
 * Format a parsed milestone into the structured markdown format
 * used by the MilestoneDetail component
 */
export function formatMilestoneDescription(milestone: ParsedMilestone): string {
  const parts: string[] = [];

  // About section
  parts.push('**About**');
  parts.push('');
  parts.push(milestone.about);
  parts.push('');

  // What to look for section
  parts.push('**What to look for**');
  for (const item of milestone.whatToLookFor) {
    parts.push(`• ${item}`);
  }
  parts.push('');

  // Why it matters section
  parts.push('**Why it matters**');
  parts.push('');
  for (const item of milestone.whyItMatters) {
    parts.push(`• ${item}`);
  }

  return parts.join('\n');
}

/**
 * Normalize a milestone title for matching
 * (removes special characters, lowercases, trims whitespace, removes age prefixes)
 */
export function normalizeMilestoneTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^\d+m:\s*/i, '')   // Remove age prefixes like "2M:", "12M:", "24M:"
    .replace(/["""'']/g, '"')    // Normalize quote characters
    .replace(/[–—]/g, '-')        // Normalize dashes
    .replace(/\s+/g, ' ')          // Normalize whitespace
    .trim();
}
