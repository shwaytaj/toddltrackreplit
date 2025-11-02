/**
 * Seed All Milestones from Categorised Source File
 * 
 * This script extracts ALL milestones from the milestones-categorised-by-source file,
 * creates new milestone records for ones that don't exist, and assigns sources to all of them.
 * 
 * Usage: tsx server/parsers/seed-all-milestones-from-categorised-source.ts <filepath>
 */

import { parseMilestoneSourcesFromFile } from './parse-milestone-sources.js';
import { db } from '../db.js';
import { milestones } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';

interface MilestoneData {
  title: string;
  category: string;
  subcategory: string;
  ageRangeMonthsMin: number;
  ageRangeMonthsMax: number;
  description: string;
  sources: string[];
}

// Normalize title for matching
function normalizeForMatching(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Check if two titles are similar enough to be considered a match
function titlesMatch(title1: string, title2: string): boolean {
  const norm1 = normalizeForMatching(title1);
  const norm2 = normalizeForMatching(title2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // One contains the other (for shortened versions)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const lengthRatio = Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length);
    return lengthRatio > 0.7; // At least 70% similar in length
  }
  
  return false;
}

async function seedAllMilestones(filepath: string): Promise<void> {
  console.log('📖 Parsing milestone sources from file...');
  const mappings = parseMilestoneSourcesFromFile(filepath);
  
  console.log(`✅ Found ${mappings.length} milestone-source mappings\n`);
  
  // Group mappings by unique milestone (title + category + age range)
  const milestoneMap = new Map<string, MilestoneData>();
  
  for (const mapping of mappings) {
    const key = `${normalizeForMatching(mapping.title)}_${mapping.category}_${mapping.ageRangeMonthsMin}_${mapping.ageRangeMonthsMax}`;
    
    if (!milestoneMap.has(key)) {
      milestoneMap.set(key, {
        title: mapping.title,
        category: mapping.category,
        subcategory: mapping.subcategory,
        ageRangeMonthsMin: mapping.ageRangeMonthsMin,
        ageRangeMonthsMax: mapping.ageRangeMonthsMax,
        description: mapping.title, // Use title as description for now
        sources: [mapping.source],
      });
    } else {
      // Add source to existing milestone
      const milestone = milestoneMap.get(key)!;
      if (!milestone.sources.includes(mapping.source)) {
        milestone.sources.push(mapping.source);
      }
    }
  }
  
  const uniqueMilestones = Array.from(milestoneMap.values());
  console.log(`📊 Extracted ${uniqueMilestones.length} unique milestones\n`);
  
  // Get all existing milestones from database
  console.log('🔍 Fetching existing milestones from database...');
  const existingMilestones = await db.select().from(milestones);
  console.log(`✅ Found ${existingMilestones.length} milestones in database\n`);
  
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  
  console.log('🔄 Processing milestones...\n');
  
  for (const newMilestone of uniqueMilestones) {
    // Try to find matching existing milestone
    const matches = existingMilestones.filter(m => {
      const titleMatch = titlesMatch(m.title, newMilestone.title);
      const categoryMatch = m.category === newMilestone.category;
      const ageRangeMatch = (
        m.ageRangeMonthsMin <= newMilestone.ageRangeMonthsMax &&
        m.ageRangeMonthsMax >= newMilestone.ageRangeMonthsMin
      );
      
      return titleMatch && categoryMatch && ageRangeMatch;
    });
    
    if (matches.length > 0) {
      // Update existing milestone with sources
      const match = matches[0];
      const existingSources = match.sources || [];
      const newSources = Array.from(new Set([...existingSources, ...newMilestone.sources]));
      
      if (JSON.stringify(existingSources.sort()) !== JSON.stringify(newSources.sort())) {
        await db
          .update(milestones)
          .set({ sources: newSources })
          .where(eq(milestones.id, match.id));
        
        console.log(`✏️  Updated: "${match.title}" - sources: ${newSources.join(', ')}`);
        updated++;
      } else {
        unchanged++;
      }
    } else {
      // Create new milestone
      await db.insert(milestones).values({
        title: newMilestone.title,
        category: newMilestone.category,
        subcategory: newMilestone.subcategory,
        ageRangeMonthsMin: newMilestone.ageRangeMonthsMin,
        ageRangeMonthsMax: newMilestone.ageRangeMonthsMax,
        description: newMilestone.description,
        sources: newMilestone.sources,
      });
      
      console.log(`➕ Created: "${newMilestone.title}" (${newMilestone.category} > ${newMilestone.subcategory}, ${newMilestone.ageRangeMonthsMin}-${newMilestone.ageRangeMonthsMax} months) - sources: ${newMilestone.sources.join(', ')}`);
      created++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Milestones created:   ${created}`);
  console.log(`✏️  Milestones updated:   ${updated}`);
  console.log(`⏭️  Milestones unchanged: ${unchanged}`);
  console.log(`📊 Total processed:      ${uniqueMilestones.length}`);
  console.log('='.repeat(80) + '\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const filepath = process.argv[2];
  
  if (!filepath) {
    console.error('Usage: tsx server/parsers/seed-all-milestones-from-categorised-source.ts <filepath>');
    process.exit(1);
  }
  
  seedAllMilestones(filepath)
    .then(() => {
      console.log('✅ All done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error seeding milestones:', error);
      process.exit(1);
    });
}
