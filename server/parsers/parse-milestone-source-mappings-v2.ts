/**
 * IMPROVED Parser for milestones-categorised-by-source.md
 * 
 * This version properly extracts milestone titles from markdown tables without
 * fragmenting multi-clause descriptions or creating parsing artifacts.
 * 
 * Key improvements:
 * - Parse full bullet points as units
 * - Smart age-prefix detection (e.g., "2M:", "6M:") to split milestones
 * - No naive comma splitting that breaks quoted text
 * - Better filtering of table metadata
 */

import fs from 'fs';
import path from 'path';
import { normalizeTitleForMatch } from './title-normalizer.js';

const SOURCE_NAME_MAPPING: Record<string, string> = {
  'CDC (Centers for Disease Control and Prevention) / AAP (American Academy of Pediatrics) - USA': 'CDC/AAP',
  'HSE (Health Service Executive) - Ireland': 'HSE',
  'WHO (World Health Organization)': 'WHO',
  'NHS (National Health Service) - United Kingdom': 'NHS',
  'Australian Department of Health (Pregnancy Birth and Baby, Queensland Health, healthdirect)': 'Australian Dept of Health',
  'Health Canada / Canadian Paediatric Society (HealthLink BC, Caring for Kids)': 'Health Canada/CPS',
  'South Africa Department of Health (Road to Health Booklet)': 'South Africa DoH',
};

// Metadata terms that should be filtered out
const METADATA_KEYWORDS = [
  'category', 'subcategory', 'milestone', 'developmental', 'growth', 
  'teeth', 'vision', 'hearing', 'eruption', 'development', 'physical',
  'gross motor skills', 'fine motor skills', 'communication', 'social',
  'emotional', 'cognitive', 'self-care'
];

/**
 * Extract individual milestone titles from a bullet list entry.
 * 
 * Handles entries like:
 * - "• **2M:** Title1, Title2<br>• **3M:** Title3"
 * - "• Title with commas, in it"
 * - "• Complex title (with parens)"
 */
function extractMilestoneTitles(bulletText: string): string[] {
  const titles: string[] = [];
  
  // Split by age-based prefixes (e.g., "2M:", "12M:", "36M:")
  // This regex finds patterns like "**2M:**", "**12M:**", etc.
  const agePrefixPattern = /\*\*\d+M:\*\*/g;
  const hasAgePrefixes = agePrefixPattern.test(bulletText);
  
  if (hasAgePrefixes) {
    // Split on age prefixes while keeping the text after each prefix
    const parts = bulletText.split(/\*\*\d+M:\*\*/);
    
    for (let part of parts) {
      if (!part.trim()) continue;
      
      // Now we can safely split by commas since we've isolated age-grouped text
      const subTitles = part.split(',').map(t => t.trim()).filter(t => t);
      titles.push(...subTitles);
    }
  } else {
    // No age prefixes - treat the whole entry as containing milestone titles
    // Be careful with comma splitting - only split if it looks safe
    
    // Check if text contains quoted sections with commas (like '"I," "me,"')
    const hasQuotedCommas = /"[^"]*,[^"]*"/.test(bulletText) || /'[^']*,[^']*'/.test(bulletText);
    
    if (hasQuotedCommas) {
      // Don't split by commas - treat as single milestone
      titles.push(bulletText.trim());
    } else {
      // Safe to split by commas
      const subTitles = bulletText.split(',').map(t => t.trim()).filter(t => t);
      titles.push(...subTitles);
    }
  }
  
  return titles;
}

/**
 * Check if a text looks like table metadata rather than a milestone
 */
function isMetadata(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  
  // Check for metadata keywords
  for (const keyword of METADATA_KEYWORDS) {
    if (normalized === keyword || normalized.includes(`**${keyword}**`)) {
      return true;
    }
  }
  
  // Filter out very short text (likely artifacts)
  if (normalized.length < 5) {
    return true;
  }
  
  // Filter out text that's mostly numbers (weight, height, etc.)
  const numberRatio = (normalized.match(/\d/g) || []).length / normalized.length;
  if (numberRatio > 0.6) {
    return true;
  }
  
  return false;
}

/**
 * Parse the milestones-categorised-by-source.md file to extract source mappings
 */
export function parseMilestoneSourceMappings(filePath: string): Map<string, string[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const sourceMappings = new Map<string, string[]>();
  let currentSource: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect source section headers (## Source Name)
    if (line.startsWith('## ') && !line.includes('SCREENING') && !line.includes('WHEN TO SEEK') && !line.includes('IMPORTANT NOTES')) {
      const sourceLine = line.replace('##', '').trim();
      currentSource = SOURCE_NAME_MAPPING[sourceLine] || null;
      
      if (!currentSource) {
        console.warn(`Unknown source section: ${sourceLine}`);
      }
      continue;
    }
    
    // Skip if we're not in a valid source section
    if (!currentSource) {
      continue;
    }
    
    // Extract milestone titles from bullet points in table cells
    if (line.includes('• ') && line.includes('|')) {
      // Extract the cell content that contains milestones (usually the last cell)
      const cells = line.split('|').map(c => c.trim());
      
      for (const cell of cells) {
        if (!cell.includes('• ')) continue;
        
        // Split by <br> tags to get individual bullet points
        const bulletPoints = cell
          .split(/<br>|<br\/>|<BR>|<BR\/>/)
          .map(bp => bp.trim())
          .filter(bp => bp);
        
        for (let bulletPoint of bulletPoints) {
          // Remove the bullet marker
          bulletPoint = bulletPoint.replace(/^•\s*/, '').trim();
          
          if (!bulletPoint) continue;
          
          // Extract milestone titles from this bullet point
          const milestoneTitles = extractMilestoneTitles(bulletPoint);
          
          for (const title of milestoneTitles) {
            // Clean up the title
            const cleanedTitle = title
              .replace(/\*\*/g, '') // Remove bold markers
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
            
            // Skip if empty or looks like metadata
            if (!cleanedTitle || isMetadata(cleanedTitle)) {
              continue;
            }
            
            const normalizedTitle = normalizeTitleForMatch(cleanedTitle);
            
            // Add source to this milestone's source list
            const existingSources = sourceMappings.get(normalizedTitle) || [];
            if (!existingSources.includes(currentSource)) {
              existingSources.push(currentSource);
            }
            sourceMappings.set(normalizedTitle, existingSources);
          }
        }
      }
    }
  }
  
  console.log(`Parsed ${sourceMappings.size} unique normalized milestone titles with source mappings`);
  
  // Log source distribution
  const sourceDistribution: Record<string, number> = {};
  for (const sources of Array.from(sourceMappings.values())) {
    for (const source of sources) {
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
    }
  }
  console.log('Source distribution:', sourceDistribution);
  
  return sourceMappings;
}

/**
 * Main function to parse and display source mappings
 */
export function main() {
  const filePath = path.join(process.cwd(), 'attached_assets', 'milestones-categorised-by-source_1762122777524.md');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  const mappings = parseMilestoneSourceMappings(filePath);
  
  // Display sample mappings
  console.log('\nSample source mappings (first 20):');
  let count = 0;
  for (const [normalizedTitle, sources] of Array.from(mappings.entries())) {
    console.log(`  "${normalizedTitle}" -> [${sources.join(', ')}]`);
    count++;
    if (count >= 20) break;
  }
  
  console.log(`\n...and ${mappings.size - count} more mappings`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
