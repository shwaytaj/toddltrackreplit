/**
 * Parser for milestones-categorised-by-source.md
 * 
 * This parser extracts which milestones belong to which source organizations
 * by parsing the categorized milestone document.
 * 
 * The output is a mapping of normalized milestone titles to their source organizations.
 */

import fs from 'fs';
import path from 'path';
import { normalizeTitleForMatch } from './title-normalizer.js';

export interface SourceMapping {
  title: string;
  normalizedTitle: string;
  sources: string[];
}

const SOURCE_NAME_MAPPING: Record<string, string> = {
  'CDC (Centers for Disease Control and Prevention) / AAP (American Academy of Pediatrics) - USA': 'CDC/AAP',
  'HSE (Health Service Executive) - Ireland': 'HSE',
  'NHS (National Health Service) - United Kingdom': 'NHS',
  'Australian Department of Health (Pregnancy Birth and Baby, Queensland Health, healthdirect)': 'Australian Dept of Health',
  'Health Canada / Canadian Paediatric Society (HealthLink BC, Caring for Kids)': 'Health Canada/CPS',
  'South Africa Department of Health (Road to Health Booklet)': 'South Africa DoH',
};

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
    // Format: | | Category | • Milestone title<br>• Another milestone title |
    if (line.includes('• ') && line.includes('|')) {
      // Extract the cell content that contains milestones
      const cells = line.split('|').map(c => c.trim());
      
      // Find the cell with bullet points (usually the last cell)
      for (const cell of cells) {
        if (cell.includes('• ')) {
          // Split by <br> tags and bullet points
          const milestoneTexts = cell
            .split(/<br>|<br\/>/)
            .flatMap(part => part.split('•'))
            .map(m => m.trim())
            .filter(m => m && !m.startsWith('*'));
          
          for (let milestoneText of milestoneTexts) {
            // Remove age prefixes like "2M:", "6M:", etc.
            milestoneText = milestoneText.replace(/^\d+M:\s*/, '');
            
            // Skip empty or metadata entries
            if (!milestoneText || milestoneText.length < 3) {
              continue;
            }
            
            // Split on commas to get individual milestones
            const individualMilestones = milestoneText.split(',').map(m => m.trim());
            
            for (const milestone of individualMilestones) {
              if (milestone.length < 3) continue;
              
              const normalizedTitle = normalizeTitleForMatch(milestone);
              
              // Skip if it looks like metadata or table content
              if (normalizedTitle.includes('category') || 
                  normalizedTitle.includes('subcategory') || 
                  normalizedTitle.includes('milestone') ||
                  normalizedTitle.includes('developmental') ||
                  normalizedTitle.includes('growth') ||
                  normalizedTitle.includes('teeth') ||
                  normalizedTitle.includes('vision') ||
                  normalizedTitle.includes('hearing')) {
                continue;
              }
              
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
  console.log('\nSample source mappings:');
  let count = 0;
  for (const [normalizedTitle, sources] of Array.from(mappings.entries())) {
    console.log(`  "${normalizedTitle}" -> [${sources.join(', ')}]`);
    count++;
    if (count >= 10) break;
  }
  
  console.log(`\n...and ${mappings.size - count} more mappings`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
