/**
 * Load detailed milestone descriptions from milestone-descriptions.md
 * This script updates the database with rich descriptions including
 * "About", "What to look for", and "Why it matters" sections
 */

import { db } from '../db.js';
import { milestones } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { parseMilestoneDescriptions, formatMilestoneDescription, normalizeMilestoneTitle } from './milestone-description-parser.js';
import { readFileSync } from 'fs';
import path from 'path';

async function loadDescriptions() {
  console.log('=== LOAD DETAILED MILESTONE DESCRIPTIONS ===\n');
  
  // Step 1: Read and parse the descriptions file
  const filePath = path.join(process.cwd(), 'attached_assets', 'milestones-descriptions_1762125221739.md');
  console.log(`Reading: ${filePath}`);
  
  const fileContent = readFileSync(filePath, 'utf-8');
  const { milestones: parsedDescriptions, errors } = parseMilestoneDescriptions(fileContent);
  
  console.log(`Parsed ${parsedDescriptions.length} milestone descriptions`);
  if (errors.length > 0) {
    console.log(`\nWarnings (${errors.length} parsing issues):`);
    errors.forEach(err => console.log(`  - ${err}`));
  }
  console.log();
  
  // Step 2: Fetch all milestones from database
  console.log('Fetching milestones from database...');
  const dbMilestones = await db.select().from(milestones);
  console.log(`Found ${dbMilestones.length} milestones in database\n`);
  
  // Step 3: Create lookup map for database milestones by normalized title
  const dbTitleMap = new Map(
    dbMilestones.map(m => [normalizeMilestoneTitle(m.title), m])
  );
  
  // Step 4: Match descriptions to database milestones and update
  let matchedCount = 0;
  let unmatchedCount = 0;
  const unmatchedTitles: string[] = [];
  
  console.log('Updating milestone descriptions...\n');
  
  for (const parsed of parsedDescriptions) {
    const normalized = normalizeMilestoneTitle(parsed.title);
    const dbMilestone = dbTitleMap.get(normalized);
    
    if (dbMilestone) {
      // Format the description for database storage
      const formattedDescription = formatMilestoneDescription(parsed);
      
      // Update the database
      await db.update(milestones)
        .set({ description: formattedDescription })
        .where(eq(milestones.id, dbMilestone.id));
      
      matchedCount++;
      
      if (matchedCount % 50 === 0) {
        console.log(`  Updated ${matchedCount} descriptions...`);
      }
    } else {
      unmatchedCount++;
      unmatchedTitles.push(parsed.title);
    }
  }
  
  // Step 5: Report results
  console.log('\n' + '='.repeat(80));
  console.log('RESULTS');
  console.log('='.repeat(80));
  console.log(`✓ Descriptions loaded: ${matchedCount}`);
  console.log(`✗ Unmatched titles: ${unmatchedCount}`);
  console.log('='.repeat(80));
  
  if (unmatchedTitles.length > 0 && unmatchedTitles.length <= 20) {
    console.log('\nUnmatched titles:');
    unmatchedTitles.forEach(title => console.log(`  - ${title}`));
  } else if (unmatchedTitles.length > 20) {
    console.log(`\nFirst 20 unmatched titles:`);
    unmatchedTitles.slice(0, 20).forEach(title => console.log(`  - ${title}`));
    console.log(`  ... and ${unmatchedTitles.length - 20} more`);
  }
  
  console.log('\n✓ Description loading complete!\n');
}

// Run the script
loadDescriptions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error loading descriptions:', error);
    process.exit(1);
  });
