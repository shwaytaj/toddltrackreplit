/**
 * Identify and remove milestones that are NOT in the comprehensive file
 * This ensures the database matches the authoritative source exactly
 */

import { db } from '../db.js';
import { milestones } from '../../shared/schema.js';
import { eq, isNull, or } from 'drizzle-orm';
import { parseComprehensiveMilestones } from './parse-comprehensive-milestones.js';
import { normalizeTitleForMatch } from './title-normalizer.js';
import path from 'path';

async function cleanupExtraMilestones() {
  console.log('=== DATABASE CLEANUP SCRIPT ===\n');
  
  // Step 1: Parse canonical milestones from comprehensive file
  const filePath = path.join(process.cwd(), 'attached_assets', 'dev-milestones-comprehensive_1762125221739.md');
  console.log(`Parsing comprehensive file: ${filePath}`);
  const canonicalMilestones = parseComprehensiveMilestones(filePath);
  console.log(`Found ${canonicalMilestones.length} canonical milestones in file\n`);
  
  // Create a Set of normalized canonical titles for fast lookup
  const canonicalTitles = new Set(
    canonicalMilestones.map(m => normalizeTitleForMatch(m.title))
  );
  
  console.log('Canonical milestone breakdown:');
  const categoryCounts: Record<string, number> = {};
  for (const m of canonicalMilestones) {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
  }
  for (const [category, count] of Object.entries(categoryCounts)) {
    console.log(`  ${category}: ${count}`);
  }
  console.log();
  
  // Step 2: Fetch all canonical (non-legacy) milestones from database
  console.log('Fetching milestones from database...');
  const dbMilestones = await db.select()
    .from(milestones)
    .where(
      or(
        eq(milestones.isLegacy, false),
        isNull(milestones.isLegacy)
      )
    );
  
  console.log(`Found ${dbMilestones.length} canonical milestones in database\n`);
  
  // Step 3: Identify milestones to remove
  const milestonesToRemove: typeof dbMilestones = [];
  const milestonesByCategory: Record<string, number> = {};
  
  for (const dbMilestone of dbMilestones) {
    const normalizedDbTitle = normalizeTitleForMatch(dbMilestone.title);
    
    if (!canonicalTitles.has(normalizedDbTitle)) {
      milestonesToRemove.push(dbMilestone);
      milestonesByCategory[dbMilestone.category] = 
        (milestonesByCategory[dbMilestone.category] || 0) + 1;
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('MILESTONES TO REMOVE');
  console.log('='.repeat(80));
  console.log(`Total to remove: ${milestonesToRemove.length}\n`);
  
  if (milestonesToRemove.length > 0) {
    console.log('Breakdown by category:');
    for (const [category, count] of Object.entries(milestonesByCategory)) {
      console.log(`  ${category}: ${count}`);
    }
    console.log();
    
    console.log('First 20 milestones to be removed:');
    for (const m of milestonesToRemove.slice(0, 20)) {
      console.log(`  - [${m.category}] ${m.title}`);
    }
    if (milestonesToRemove.length > 20) {
      console.log(`  ... and ${milestonesToRemove.length - 20} more`);
    }
    console.log();
    
    // Step 4: Remove extra milestones
    console.log('Removing extra milestones from database...');
    let removedCount = 0;
    
    for (const milestone of milestonesToRemove) {
      await db.delete(milestones)
        .where(eq(milestones.id, milestone.id));
      removedCount++;
    }
    
    console.log(`✓ Removed ${removedCount} milestones\n`);
  } else {
    console.log('No extra milestones found - database matches comprehensive file!\n');
  }
  
  // Step 5: Final verification
  const finalCount = await db.select()
    .from(milestones)
    .where(
      or(
        eq(milestones.isLegacy, false),
        isNull(milestones.isLegacy)
      )
    );
  
  console.log('='.repeat(80));
  console.log('FINAL VERIFICATION');
  console.log('='.repeat(80));
  console.log(`Canonical milestones in file: ${canonicalMilestones.length}`);
  console.log(`Canonical milestones in database: ${finalCount.length}`);
  console.log(`Difference: ${finalCount.length - canonicalMilestones.length}`);
  console.log('='.repeat(80));
}

// Run the cleanup
cleanupExtraMilestones()
  .then(() => {
    console.log('\n✓ Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error during cleanup:', error);
    process.exit(1);
  });
