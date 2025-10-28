import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Milestone {
  title: string;
  category: string;
  subcategory: string;
  ageRangeMonthsMin: number;
  ageRangeMonthsMax: number;
  description: string;
  typicalRange: string | null;
}

// Age group mappings from section headers
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

function parseMonthMarker(text: string): number | null {
  const match = text.match(/\*\*(\d+)M:\*\*/);
  return match ? parseInt(match[1], 10) : null;
}

function cleanMilestoneText(text: string): string {
  // Remove month markers like "**9M:** " from the beginning
  return text.replace(/^\*\*\d+M:\*\*\s*/, '').trim();
}

function extractMilestones(filePath: string): Milestone[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const milestones: Milestone[] = [];
  let currentAgeGroup: string | null = null;
  let currentCategory: string | null = null;
  let currentSubcategory: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for age group headers
    if (line.startsWith('## ') && Object.keys(ageGroupMappings).some(key => line.includes(key))) {
      for (const key of Object.keys(ageGroupMappings)) {
        if (line.includes(key)) {
          currentAgeGroup = key;
          break;
        }
      }
      continue;
    }
    
    // Skip screening and intervention sections
    if (line.includes('SCREENING') || line.includes('WHEN TO SEEK') || line.includes('IMPORTANT NOTES')) {
      break;
    }
    
    // Parse table rows for category, subcategory, and milestones
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
    
    // Handle continuation rows (where category is empty)
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

function parseMilestoneColumn(
  milestonesText: string,
  ageGroup: string,
  category: string,
  subcategory: string,
  milestones: Milestone[]
) {
  if (!ageGroup || !category || !subcategory || !milestonesText) return;
  
  const baseAgeRange = ageGroupMappings[ageGroup];
  if (!baseAgeRange) return;
  
  // Split by bullet points (• or <br>•)
  const bulletPoints = milestonesText
    .split(/(?:<br>|•)/)
    .map(s => s.trim())
    .filter(s => s && s !== '');
  
  for (const bullet of bulletPoints) {
    const monthMarker = parseMonthMarker(bullet);
    const cleanText = cleanMilestoneText(bullet);
    
    if (!cleanText) continue;
    
    let ageRangeMin: number;
    let ageRangeMax: number;
    let typicalRange: string | null = null;
    
    if (monthMarker !== null) {
      // Specific month marker (e.g., "**9M:**")
      // Use the month as the minimum and add 2-3 months buffer
      ageRangeMin = Math.max(baseAgeRange.min, monthMarker - 1);
      ageRangeMax = Math.min(baseAgeRange.max, monthMarker + 2);
      typicalRange = `${monthMarker} months`;
    } else {
      // General milestone for the age range
      ageRangeMin = baseAgeRange.min;
      ageRangeMax = baseAgeRange.max;
      typicalRange = `${baseAgeRange.min}-${baseAgeRange.max} months`;
    }
    
    // Extract a title (first 50 chars or first sentence)
    let title = cleanText;
    if (title.length > 60) {
      const firstSentence = title.match(/^[^,.;]+/);
      title = firstSentence ? firstSentence[0] : title.substring(0, 60) + '...';
    }
    
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
