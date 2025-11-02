/**
 * Update milestone sources in the database based on the categorized source file
 * 
 * This script:
 * 1. Parses the milestones-categorised-by-source.md file
 * 2. Matches normalized titles to database milestones
 * 3. Updates the sources array for each matched milestone
 */

import { db } from '../db.js';
import { milestones } from '../../shared/schema.js';
import { eq, isNull, or } from 'drizzle-orm';
import { parseMilestoneSourceMappings } from './parse-milestone-source-mappings-v2.js';
import { normalizeTitleForMatch } from './title-normalizer.js';
import path from 'path';

async function updateMilestoneSources() {
  console.log('Starting milestone source update...\n');
  
  // Step 1: Parse source mappings from file
  const filePath = path.join(process.cwd(), 'attached_assets', 'milestones-categorised-by-source_1762122777524.md');
  console.log(`Parsing source mappings from: ${filePath}`);
  const sourceMappings = parseMilestoneSourceMappings(filePath);
  console.log(`Loaded ${sourceMappings.size} source mappings\n`);
  
  // Step 2: Fetch all canonical (non-legacy) developmental milestones from database
  console.log('Fetching milestones from database...');
  const dbMilestones = await db.select()
    .from(milestones)
    .where(
      or(
        eq(milestones.isLegacy, false),
        isNull(milestones.isLegacy)
      )
    );
  
  console.log(`Found ${dbMilestones.length} milestones in database\n`);
  
  // Step 3: Match and update
  let matchedCount = 0;
  let updatedCount = 0;
  let noMatchCount = 0;
  const unmatchedTitles: string[] = [];
  
  console.log('Matching and updating milestone sources...');
  
  for (const milestone of dbMilestones) {
    const normalizedDbTitle = normalizeTitleForMatch(milestone.title);
    const sources = sourceMappings.get(normalizedDbTitle);
    
    if (sources && sources.length > 0) {
      matchedCount++;
      
      // Check if sources need updating
      const currentSources = milestone.sources || [];
      const needsUpdate = JSON.stringify(currentSources.sort()) !== JSON.stringify(sources.sort());
      
      if (needsUpdate) {
        await db.update(milestones)
          .set({ sources })
          .where(eq(milestones.id, milestone.id));
        
        updatedCount++;
        console.log(`✓ Updated: "${milestone.title}" -> [${sources.join(', ')}]`);
      }
    } else {
      noMatchCount++;
      unmatchedTitles.push(milestone.title);
    }
  }
  
  // Step 4: Report results
  console.log('\n' + '='.repeat(80));
  console.log('UPDATE SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total database milestones: ${dbMilestones.length}`);
  console.log(`Matched with source file: ${matchedCount}`);
  console.log(`Actually updated: ${updatedCount}`);
  console.log(`No match found: ${noMatchCount}`);
  console.log('='.repeat(80));
  
  if (unmatchedTitles.length > 0) {
    console.log('\nMilestones with no source mapping (first 20):');
    for (const title of unmatchedTitles.slice(0, 20)) {
      console.log(`  - ${title}`);
    }
    if (unmatchedTitles.length > 20) {
      console.log(`  ... and ${unmatchedTitles.length - 20} more`);
    }
  }
  
  console.log('\nUpdate complete!');
}

// Run the update
updateMilestoneSources()
  .then(() => {
    console.log('\nSuccess! Milestone sources have been updated.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError updating milestone sources:', error);
    process.exit(1);
  });
