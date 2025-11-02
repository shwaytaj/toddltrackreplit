import * as fs from 'fs';

/**
 * CANONICAL MILESTONE PARSER
 * 
 * This is the authoritative parser for milestone titles.
 * It reads from dev-milestones-comprehensive.md which serves as the single source
 * of truth for all milestone titles in the system.
 * 
 * All other parsers (sources, descriptions) must match against these exact titles.
 */

interface ParsedMilestone {
  title: string;
  category: string;
  subcategory: string;
  ageRangeMonthsMin: number;
  ageRangeMonthsMax: number;
  typicalRange: string | null;
}

// Age group mappings from header text to month ranges
const AGE_GROUP_MAPPINGS: Record<string, { min: number; max: number }> = {
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

// Categories to process - ALL categories from comprehensive file
const MILESTONE_CATEGORIES = ['Developmental', 'Growth', 'Teeth', 'Vision', 'Hearing'];

/**
 * Splits a milestone line by commas, respecting parentheses.
 * This prevents titles like "Twists things (doorknobs, lids)" from being split.
 */
function splitByCommasRespectingParentheses(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of text) {
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      // Split here
      if (current.trim()) {
        result.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last segment
  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Parse month marker from milestone text (e.g., "**2M:**", "**13-19M:**")
 * Returns null if no marker found, or an object with single month or range
 */
function parseMonthMarker(text: string): { single: number } | { range: { min: number; max: number } } | null {
  // Match patterns like "**2M:**" or "**13-19M:**"
  const singleMatch = text.match(/^\*\*(\d+)M:\*\*/);
  if (singleMatch) {
    return { single: parseInt(singleMatch[1], 10) };
  }

  const rangeMatch = text.match(/^\*\*(\d+)-(\d+)M:\*\*/);
  if (rangeMatch) {
    return {
      range: {
        min: parseInt(rangeMatch[1], 10),
        max: parseInt(rangeMatch[2], 10),
      },
    };
  }

  return null;
}

/**
 * Clean milestone text by removing age markers and extra formatting
 */
function cleanMilestoneText(text: string): string {
  // Remove month markers like "**2M:**" or "**13-19M:**"
  let cleaned = text.replace(/^\*\*\d+(-\d+)?M:\*\*\s*/, '');
  
  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Parse the comprehensive milestones file and extract all milestone data
 */
export function parseComprehensiveMilestones(filePath: string): ParsedMilestone[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const milestones: ParsedMilestone[] = [];
  let currentAgeGroup: string | null = null;
  let currentCategory: string | null = null;
  let currentSubcategory: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Parse age group headers (e.g., "## 0-1 MONTHS")
    if (line.startsWith('## ') && !line.includes('SCREENING') && !line.includes('WHEN TO')) {
      const ageGroupMatch = line.match(/^##\s+(.+)$/);
      if (ageGroupMatch) {
        currentAgeGroup = ageGroupMatch[1].trim();
      }
      continue;
    }
    
    // Skip non-table lines
    if (!line.startsWith('|') || !currentAgeGroup) continue;
    
    // Skip table headers and separators
    if (line.includes('Category') || line.includes('---')) continue;
    
    // Parse table rows
    const cells = line.split('|').map(c => c.trim());
    
    // Tables have leading/trailing |, so we have empty first and last cells
    // Remove them to get the actual columns
    if (cells[0] === '') cells.shift();
    if (cells[cells.length - 1] === '') cells.pop();
    
    if (cells.length < 3) continue;
    
    const [categoryCell, subcategoryCell, milestonesCell] = cells;
    
    // Update current category if specified (handle empty cells for continued rows)
    if (categoryCell.includes('**') && categoryCell.length > 4) {
      currentCategory = categoryCell.replace(/\*\*/g, '').trim();
    }
    
    // Skip if not a Developmental milestone
    if (!currentCategory || !MILESTONE_CATEGORIES.includes(currentCategory)) {
      continue;
    }
    
    // Update subcategory if specified
    if (subcategoryCell && subcategoryCell.length > 0) {
      currentSubcategory = subcategoryCell.trim();
    }
    
    if (!currentSubcategory) continue;
    
    // Get base age range for this age group
    const baseAgeRange = AGE_GROUP_MAPPINGS[currentAgeGroup];
    if (!baseAgeRange) continue;
    
    // Split milestones by bullet points (handles both • and <br>•)
    const bulletPoints = milestonesCell
      .split(/•\s*/)
      .map(s => s.replace(/<br>/g, '').trim())
      .filter(s => s && s !== '');
    
    // Process each bullet point
    for (const bullet of bulletPoints) {
      // Check for age marker at the start
      const monthMarker = parseMonthMarker(bullet);
      
      let textAfterMarker = bullet;
      if (monthMarker) {
        textAfterMarker = bullet.replace(/^\*\*\d+(-\d+)?M:\*\*\s*/, '');
      }
      
      // Split by commas, respecting parentheses
      const titles = splitByCommasRespectingParentheses(textAfterMarker);
      
      for (const title of titles) {
        const cleanTitle = title.trim();
        if (!cleanTitle) continue;
        
        // Determine age range
        let ageRangeMin: number;
        let ageRangeMax: number;
        let typicalRange: string | null = null;
        
        if (monthMarker) {
          if ('range' in monthMarker) {
            // Range marker (e.g., "**13-19M:**")
            ageRangeMin = monthMarker.range.min;
            ageRangeMax = monthMarker.range.max;
            typicalRange = `${monthMarker.range.min}-${monthMarker.range.max} months`;
          } else {
            // Single month marker (e.g., "**9M:**")
            ageRangeMin = Math.max(baseAgeRange.min, monthMarker.single - 1);
            ageRangeMax = Math.min(baseAgeRange.max, monthMarker.single + 2);
            typicalRange = `${monthMarker.single} months`;
          }
        } else {
          // No marker - use full age group range
          ageRangeMin = baseAgeRange.min;
          ageRangeMax = baseAgeRange.max;
          typicalRange = `${baseAgeRange.min}-${baseAgeRange.max} months`;
        }
        
        milestones.push({
          title: cleanTitle,
          category: currentCategory,
          subcategory: currentSubcategory,
          ageRangeMonthsMin: ageRangeMin,
          ageRangeMonthsMax: ageRangeMax,
          typicalRange,
        });
      }
    }
  }
  
  return milestones;
}

/**
 * Main execution - parse and output results
 */
const args = process.argv.slice(2);
if (args.length > 0) {
  const filePath = args[0];
  
  try {
    const milestones = parseComprehensiveMilestones(filePath);
    
    console.log(`\n=== COMPREHENSIVE MILESTONE PARSER ===\n`);
    console.log(`Parsed ${milestones.length} milestones from ${filePath}\n`);
    
    // Show first 10 examples
    console.log('First 10 milestones:');
    milestones.slice(0, 10).forEach((m, i) => {
      console.log(`${i + 1}. "${m.title}"`);
      console.log(`   Category: ${m.category} > ${m.subcategory}`);
      console.log(`   Age: ${m.ageRangeMonthsMin}-${m.ageRangeMonthsMax} months (${m.typicalRange})\n`);
    });
    
    // Summary by category
    const byCategory: Record<string, number> = {};
    milestones.forEach(m => {
      const key = `${m.category} > ${m.subcategory}`;
      byCategory[key] = (byCategory[key] || 0) + 1;
    });
    
    console.log('\n=== Summary by Subcategory ===');
    Object.entries(byCategory).forEach(([key, count]) => {
      console.log(`${key}: ${count} milestones`);
    });
    
  } catch (error) {
    console.error('Error parsing file:', error);
    process.exit(1);
  }
}
