/**
 * Update Milestone Sources from File
 * 
 * This script reads the milestone sources file, parses it, and updates
 * the database to add source information to existing milestones.
 * 
 * Usage: tsx server/parsers/update-milestone-sources-from-file.ts <filepath>
 */

import { parseMilestoneSourcesFromFile } from './parse-milestone-sources.js';
import { db } from '../db.js';
import { milestones } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import { titlesMatch } from './title-normalizer.js';

interface UpdateStats {
  totalMappings: number;
  milestonesUpdated: number;
  milestonesNotFound: number;
  sourcesAdded: number;
}

// Note: Using shared titlesMatch from title-normalizer.js for consistency
// This ensures all parsers use the same title matching logic

async function updateMilestoneSources(filepath: string): Promise<UpdateStats> {
  console.log('Parsing milestone sources from file...');
  const mappings = parseMilestoneSourcesFromFile(filepath);
  
  console.log(`Found ${mappings.length} milestone-source mappings\n`);
  
  const stats: UpdateStats = {
    totalMappings: mappings.length,
    milestonesUpdated: 0,
    milestonesNotFound: 0,
    sourcesAdded: 0,
  };
  
  // Get all existing milestones from database
  console.log('Fetching existing milestones from database...');
  const existingMilestones = await db.select().from(milestones);
  console.log(`Found ${existingMilestones.length} milestones in database\n`);
  
  // Group mappings by milestone (to handle multiple sources for same milestone)
  const milestoneSourceMap = new Map<string, Set<string>>();
  
  for (const mapping of mappings) {
    // Find matching milestone in database
    const matches = existingMilestones.filter(m => {
      const titleMatch = titlesMatch(m.title, mapping.title);
      const categoryMatch = m.category === mapping.category || m.subcategory === mapping.subcategory;
      const ageRangeMatch = (
        m.ageRangeMonthsMin <= mapping.ageRangeMonthsMax &&
        m.ageRangeMonthsMax >= mapping.ageRangeMonthsMin
      );
      
      return titleMatch && categoryMatch && ageRangeMatch;
    });
    
    if (matches.length > 0) {
      // Use the first match (should typically only be one)
      const match = matches[0];
      
      if (!milestoneSourceMap.has(match.id)) {
        milestoneSourceMap.set(match.id, new Set());
      }
      
      milestoneSourceMap.get(match.id)!.add(mapping.source);
    } else {
      stats.milestonesNotFound++;
      console.log(`No match found for: "${mapping.title}" (${mapping.category} > ${mapping.subcategory}, ${mapping.ageRangeMonthsMin}-${mapping.ageRangeMonthsMax} months)`);
    }
  }
  
  console.log(`\nMatched ${milestoneSourceMap.size} milestones`);
  console.log(`Could not match ${stats.milestonesNotFound} milestone-source mappings\n`);
  
  // Update database with sources
  console.log('Updating milestone sources in database...');
  
  for (const [milestoneId, sources] of Array.from(milestoneSourceMap.entries())) {
    const sourcesArray: string[] = Array.from(sources);
    
    await db
      .update(milestones)
      .set({ sources: sourcesArray })
      .where(eq(milestones.id, milestoneId));
    
    stats.milestonesUpdated++;
    stats.sourcesAdded += sourcesArray.length;
  }
  
  console.log(`Updated ${stats.milestonesUpdated} milestones with source information`);
  console.log(`Total sources added: ${stats.sourcesAdded}\n`);
  
  return stats;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const filepath = process.argv[2];
  
  if (!filepath) {
    console.error('Usage: tsx server/parsers/update-milestone-sources-from-file.ts <filepath>');
    process.exit(1);
  }
  
  updateMilestoneSources(filepath)
    .then(stats => {
      console.log('Summary:');
      console.log(`  Total mappings in file: ${stats.totalMappings}`);
      console.log(`  Milestones updated: ${stats.milestonesUpdated}`);
      console.log(`  Sources added: ${stats.sourcesAdded}`);
      console.log(`  Mappings not matched: ${stats.milestonesNotFound}`);
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Error updating milestone sources:', error);
      process.exit(1);
    });
}
