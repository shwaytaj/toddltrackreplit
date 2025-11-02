/**
 * Parse Milestone Sources
 * 
 * This script extracts source information from the milestones-categorised-by-source markdown file
 * and maps it to existing milestones in the database.
 * 
 * USAGE:
 * ```bash
 * tsx server/parsers/parse-milestone-sources.ts <filepath>
 * ```
 * 
 * OUTPUT:
 * - Milestone source mappings by title/category/age range
 * - Statistics on coverage by source
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

interface MilestoneSourceMapping {
  title: string;
  category: string;
  subcategory: string;
  ageRangeMonthsMin: number;
  ageRangeMonthsMax: number;
  source: string;
}

const SOURCE_NAMES = {
  'CDC (Centers for Disease Control and Prevention) / AAP (American Academy of Pediatrics) - USA': 'CDC/AAP',
  'HSE (Health Service Executive) - Ireland': 'HSE',
  'WHO (World Health Organization)': 'WHO',
  'NHS (National Health Service) - United Kingdom': 'NHS',
  'Australian Department of Health (Pregnancy Birth and Baby, Queensland Health, healthdirect)': 'Australian Dept of Health',
  'Health Canada / Canadian Paediatric Society (HealthLink BC, Caring for Kids)': 'Health Canada/CPS',
  'South Africa Department of Health (Road to Health Booklet)': 'South Africa DoH',
};

function parseAgeRange(heading: string): { min: number; max: number } | null {
  // Parse ranges like "0-1 MONTHS", "1-3 MONTHS", "24-36 MONTHS (2-3 YEARS)", "48-60 MONTHS (4-5 YEARS)"
  const match = heading.match(/(\d+)-(\d+)\s*MONTHS/i);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  return null;
}

function normalizeTitle(title: string): string {
  // Remove age markers like "**2M:**", "**13-19M:**"
  title = title.replace(/\*\*\d+M:\*\*\s*/g, '');
  title = title.replace(/\*\*\d+-\d+M:\*\*\s*/g, '');
  
  // Remove HTML breaks
  title = title.replace(/<br>/g, '');
  
  // Trim and normalize whitespace
  return title.trim().replace(/\s+/g, ' ');
}

function splitByCommasRespectingParentheses(text: string): string[] {
  // Split by commas, but not commas inside parentheses
  const items: string[] = [];
  let current = '';
  let parenDepth = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (char === ',' && parenDepth === 0) {
      // Comma outside parentheses - split here
      if (current.trim()) {
        items.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add remaining text
  if (current.trim()) {
    items.push(current.trim());
  }
  
  return items;
}

function extractMilestones(line: string): string[] {
  // Extract individual milestone titles from table cells
  // Format: "• Milestone 1<br>• Milestone 2<br>• Milestone 3"
  // Or: "• **2M:** Milestone 1, Milestone 2<br>• **3M:** Milestone 3"
  
  const milestones: string[] = [];
  
  // Split by bullet points
  const parts = line.split('•').filter(p => p.trim());
  
  for (const part of parts) {
    // Check if this part has age markers and comma-separated items
    const ageMarkerMatch = part.match(/\*\*\d+(-\d+)?M:\*\*\s*(.+)/);
    if (ageMarkerMatch) {
      // Has age marker, split by commas RESPECTING PARENTHESES
      const items = splitByCommasRespectingParentheses(ageMarkerMatch[2]);
      milestones.push(...items);
    } else {
      // No age marker, split by <br> or just add as is
      const items = part.split('<br>').map(s => s.trim()).filter(s => s);
      milestones.push(...items);
    }
  }
  
  return milestones.map(m => normalizeTitle(m)).filter(m => m.length > 0);
}

export function parseMilestoneSourcesFromFile(filepath: string): MilestoneSourceMapping[] {
  const content = readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  
  const mappings: MilestoneSourceMapping[] = [];
  let currentSource: string | null = null;
  let currentAgeRange: { min: number; max: number } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for source heading (## ... but not ###)
    if (line.startsWith('## ') && !line.startsWith('### ')) {
      const sourceKey = line.substring(3).trim();
      currentSource = SOURCE_NAMES[sourceKey as keyof typeof SOURCE_NAMES] || null;
      continue;
    }
    
    // Check for age range heading (### ...)
    if (line.startsWith('### ')) {
      const ageHeading = line.substring(4).trim();
      currentAgeRange = parseAgeRange(ageHeading);
      continue;
    }
    
    // Skip table header and separator rows
    if (line.includes('Category') || line.includes('------')) {
      continue;
    }
    
    // Check for table rows (start with |)
    if (line.startsWith('| **') && currentSource && currentAgeRange) {
      // Parse table row
      // Format: | **Category** | Subcategory | • Milestone 1<br>• Milestone 2 |
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      
      if (cells.length >= 3) {
        const categoryMatch = cells[0].match(/\*\*(.+?)\*\*/);
        const category = categoryMatch ? categoryMatch[1] : cells[0];
        const subcategory = cells[1];
        const milestonesText = cells[2];
        
        const milestoneTitles = extractMilestones(milestonesText);
        
        for (const title of milestoneTitles) {
          mappings.push({
            title,
            category,
            subcategory,
            ageRangeMonthsMin: currentAgeRange.min,
            ageRangeMonthsMax: currentAgeRange.max,
            source: currentSource,
          });
        }
      }
    }
    
    // Handle continuation lines (| | Subcategory | ...)
    if (line.startsWith('| | ') && currentSource && currentAgeRange) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      
      if (cells.length >= 3) {
        // Find the last category we used
        const lastMapping = mappings[mappings.length - 1];
        const category = lastMapping ? lastMapping.category : 'Developmental';
        const subcategory = cells[1];
        const milestonesText = cells[2];
        
        const milestoneTitles = extractMilestones(milestonesText);
        
        for (const title of milestoneTitles) {
          mappings.push({
            title,
            category,
            subcategory,
            ageRangeMonthsMin: currentAgeRange.min,
            ageRangeMonthsMax: currentAgeRange.max,
            source: currentSource,
          });
        }
      }
    }
  }
  
  return mappings;
}

// Run if called directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  const filepath = process.argv[2];
  
  if (!filepath) {
    console.error('Usage: tsx server/parsers/parse-milestone-sources.ts <filepath>');
    process.exit(1);
  }
  
  const mappings = parseMilestoneSourcesFromFile(filepath);
  
  console.log(`Extracted ${mappings.length} milestone-source mappings\n`);
  
  // Statistics by source
  const bySource = mappings.reduce((acc, m) => {
    acc[m.source] = (acc[m.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('Milestones by source:');
  Object.entries(bySource).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });
  
  // Sample mappings
  console.log('\nSample mappings (first 10):');
  console.log(JSON.stringify(mappings.slice(0, 10), null, 2));
}
