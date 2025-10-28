import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MilestoneDescription {
  title: string;
  about: string;
  whatToLookFor: string[];
  whyItMatters: string;
  category?: string;
  subcategory?: string;
  ageRange?: string;
}

function extractDescriptions(filePath: string): MilestoneDescription[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const descriptions: MilestoneDescription[] = [];
  let currentCategory: string | null = null;
  let currentSubcategory: string | null = null;
  let currentAgeRange: string | null = null;
  let currentTitle: string | null = null;
  let currentAbout: string[] = [];
  let currentWhatToLookFor: string[] = [];
  let currentWhyItMatters: string[] = [];
  let currentSection: 'about' | 'what' | 'why' | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines when not in a section
    if (!trimmed && !currentSection) continue;
    
    // Check for age range headers (e.g., "## 0-1 MONTHS")
    if (trimmed.match(/^##\s+\d+/)) {
      const match = trimmed.match(/^##\s+([\d\-]+\s+MONTHS?)/);
      if (match) {
        currentAgeRange = match[1];
      }
      continue;
    }
    
    // Check for category headers (e.g., "### GROSS MOTOR SKILLS")
    if (trimmed.startsWith('### ')) {
      currentSubcategory = trimmed.replace('### ', '').trim();
      // Map subcategory names
      if (currentSubcategory.includes('GROSS MOTOR')) currentCategory = 'Developmental';
      else if (currentSubcategory.includes('FINE MOTOR')) currentCategory = 'Developmental';
      else if (currentSubcategory.includes('COMMUNICATION')) currentCategory = 'Developmental';
      else if (currentSubcategory.includes('SOCIAL')) currentCategory = 'Developmental';
      else if (currentSubcategory.includes('COGNITIVE')) currentCategory = 'Developmental';
      else if (currentSubcategory.includes('GROWTH')) currentCategory = 'Growth';
      else if (currentSubcategory.includes('VISION')) currentCategory = 'Vision';
      else if (currentSubcategory.includes('HEARING')) currentCategory = 'Hearing';
      else if (currentSubcategory.includes('TEETH')) currentCategory = 'Teeth';
      continue;
    }
    
    // Check for milestone title (#### heading)
    if (trimmed.startsWith('#### ')) {
      // Save previous milestone if exists
      if (currentTitle && currentAbout.length > 0) {
        descriptions.push({
          title: currentTitle,
          about: currentAbout.join('\n').trim(),
          whatToLookFor: currentWhatToLookFor,
          whyItMatters: currentWhyItMatters.join('\n').trim(),
          category: currentCategory || undefined,
          subcategory: currentSubcategory || undefined,
          ageRange: currentAgeRange || undefined,
        });
      }
      
      // Start new milestone
      currentTitle = trimmed.replace('#### ', '').trim();
      currentAbout = [];
      currentWhatToLookFor = [];
      currentWhyItMatters = [];
      currentSection = null;
      continue;
    }
    
    // Check for section headers
    if (trimmed === '**About**') {
      currentSection = 'about';
      continue;
    }
    if (trimmed === '**What to look for**') {
      currentSection = 'what';
      continue;
    }
    if (trimmed === '**Why it matters**') {
      currentSection = 'why';
      continue;
    }
    
    // Skip separator lines
    if (trimmed === '---') {
      currentSection = null;
      continue;
    }
    
    // Collect content based on current section
    if (currentSection === 'about' && trimmed) {
      currentAbout.push(trimmed);
    } else if (currentSection === 'what' && trimmed) {
      if (trimmed.startsWith('- ')) {
        currentWhatToLookFor.push(trimmed.substring(2));
      } else {
        // Multi-line bullet point
        if (currentWhatToLookFor.length > 0) {
          currentWhatToLookFor[currentWhatToLookFor.length - 1] += ' ' + trimmed;
        }
      }
    } else if (currentSection === 'why' && trimmed) {
      if (trimmed.startsWith('- ')) {
        currentWhyItMatters.push(trimmed.substring(2));
      } else {
        // Paragraph format
        currentWhyItMatters.push(trimmed);
      }
    }
  }
  
  // Save last milestone
  if (currentTitle && currentAbout.length > 0) {
    descriptions.push({
      title: currentTitle,
      about: currentAbout.join('\n').trim(),
      whatToLookFor: currentWhatToLookFor,
      whyItMatters: currentWhyItMatters.join('\n').trim(),
      category: currentCategory || undefined,
      subcategory: currentSubcategory || undefined,
      ageRange: currentAgeRange || undefined,
    });
  }
  
  return descriptions;
}

function formatDescription(desc: MilestoneDescription): string {
  let formatted = `**About**\n\n${desc.about}\n\n`;
  
  if (desc.whatToLookFor.length > 0) {
    formatted += `**What to look for**\n`;
    desc.whatToLookFor.forEach(item => {
      formatted += `• ${item}\n`;
    });
    formatted += '\n';
  }
  
  if (desc.whyItMatters) {
    formatted += `**Why it matters**\n\n${desc.whyItMatters}`;
  }
  
  return formatted.trim();
}

// Main execution
const filePath = path.join(__dirname, '../attached_assets/milestones_with_descriptions_1761616309888.md');
const descriptions = extractDescriptions(filePath);

console.log(`\n📚 Extracted ${descriptions.length} detailed milestone descriptions\n`);

// Show sample
console.log('Sample descriptions:');
descriptions.slice(0, 3).forEach(desc => {
  console.log(`\n--- ${desc.title} ---`);
  console.log(`Category: ${desc.category} • ${desc.subcategory}`);
  console.log(`Age Range: ${desc.ageRange}`);
  console.log(`About: ${desc.about.substring(0, 100)}...`);
  console.log(`What to look for: ${desc.whatToLookFor.length} items`);
  console.log(`Why it matters: ${desc.whyItMatters ? 'Yes' : 'No'}`);
});

// Group by category
const byCategory: Record<string, number> = {};
descriptions.forEach(d => {
  const key = d.category || 'Unknown';
  byCategory[key] = (byCategory[key] || 0) + 1;
});

console.log('\n📊 Descriptions by category:');
Object.entries(byCategory)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });

export { MilestoneDescription, extractDescriptions, formatDescription };
