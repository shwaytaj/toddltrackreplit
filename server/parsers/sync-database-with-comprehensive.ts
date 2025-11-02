/**
 * Sync database with comprehensive file
 * This is the authoritative way to ensure the database matches the comprehensive file exactly
 */

import { db } from '../db.js';
import { milestones } from '../../shared/schema.js';
import { eq, isNull, or } from 'drizzle-orm';
import { parseComprehensiveMilestones } from './parse-comprehensive-milestones.js';
import { normalizeTitleForMatch } from './title-normalizer.js';
import path from 'path';

async function syncDatabase() {
  console.log('=== SYNC DATABASE WITH COMPREHENSIVE FILE ===\n');
  
  // Step 1: Parse canonical milestones from comprehensive file
  const filePath = path.join(process.cwd(), 'attached_assets', 'dev-milestones-comprehensive_1762125221739.md');
  console.log(`Parsing: ${filePath}`);
  const canonicalMilestones = parseComprehensiveMilestones(filePath);
  console.log(`Found ${canonicalMilestones.length} canonical milestones\n`);
  
  // Show breakdown
  const categoryCounts: Record<string, number> = {};
  for (const m of canonicalMilestones) {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
  }
  console.log('Breakdown by category:');
  for (const [category, count] of Object.entries(categoryCounts)) {
    console.log(`  ${category}: ${count}`);
  }
  console.log();
  
  // Step 2: Fetch current database milestones (canonical only)
  console.log('Fetching current database milestones...');
  const dbMilestones = await db.select()
    .from(milestones)
    .where(
      or(
        eq(milestones.isLegacy, false),
        isNull(milestones.isLegacy)
      )
    );
  
  console.log(`Found ${dbMilestones.length} canonical milestones in database\n`);
  
  // Create maps for efficient lookup
  const dbTitleMap = new Map(
    dbMilestones.map(m => [normalizeTitleForMatch(m.title), m])
  );
  
  const fileTitleMap = new Map(
    canonicalMilestones.map(m => [normalizeTitleForMatch(m.title), m])
  );
  
  // Step 3: Identify changes needed
  const toAdd: typeof canonicalMilestones = [];
  const toUpdate: Array<{ db: typeof dbMilestones[0], file: typeof canonicalMilestones[0] }> = [];
  const toRemove: typeof dbMilestones = [];
  
  // Find milestones to add or update
  for (const fileMilestone of canonicalMilestones) {
    const normalized = normalizeTitleForMatch(fileMilestone.title);
    const dbMilestone = dbTitleMap.get(normalized);
    
    if (!dbMilestone) {
      toAdd.push(fileMilestone);
    } else {
      // Check if update needed
      if (
        dbMilestone.ageRangeMonthsMin !== fileMilestone.ageRangeMonthsMin ||
        dbMilestone.ageRangeMonthsMax !== fileMilestone.ageRangeMonthsMax ||
        dbMilestone.category !== fileMilestone.category ||
        dbMilestone.subcategory !== fileMilestone.subcategory
      ) {
        toUpdate.push({ db: dbMilestone, file: fileMilestone });
      }
    }
  }
  
  // Find milestones to remove
  for (const dbMilestone of dbMilestones) {
    const normalized = normalizeTitleForMatch(dbMilestone.title);
    if (!fileTitleMap.has(normalized)) {
      toRemove.push(dbMilestone);
    }
  }
  
  // Step 4: Report changes
  console.log('='.repeat(80));
  console.log('CHANGES NEEDED');
  console.log('='.repeat(80));
  console.log(`Milestones to add: ${toAdd.length}`);
  console.log(`Milestones to update: ${toUpdate.length}`);
  console.log(`Milestones to remove: ${toRemove.length}`);
  console.log('='.repeat(80));
  console.log();
  
  // Step 5: Apply changes
  let addedCount = 0;
  let updatedCount = 0;
  let removedCount = 0;
  
  // Add new milestones
  if (toAdd.length > 0) {
    console.log(`Adding ${toAdd.length} new milestones...`);
    for (const milestone of toAdd) {
      await db.insert(milestones).values({
        title: milestone.title,
        category: milestone.category,
        subcategory: milestone.subcategory,
        ageRangeMonthsMin: milestone.ageRangeMonthsMin,
        ageRangeMonthsMax: milestone.ageRangeMonthsMax,
        description: `${milestone.title} typically emerges between ${milestone.ageRangeMonthsMin}-${milestone.ageRangeMonthsMax} months.`,
        typicalRange: milestone.typicalRange,
        isLegacy: false,
      });
      addedCount++;
    }
    console.log(`✓ Added ${addedCount} milestones\n`);
  }
  
  // Update existing milestones
  if (toUpdate.length > 0) {
    console.log(`Updating ${toUpdate.length} milestones...`);
    for (const { db: dbM, file: fileM } of toUpdate) {
      await db.update(milestones)
        .set({
          ageRangeMonthsMin: fileM.ageRangeMonthsMin,
          ageRangeMonthsMax: fileM.ageRangeMonthsMax,
          category: fileM.category,
          subcategory: fileM.subcategory,
          typicalRange: fileM.typicalRange,
        })
        .where(eq(milestones.id, dbM.id));
      updatedCount++;
    }
    console.log(`✓ Updated ${updatedCount} milestones\n`);
  }
  
  // Remove extra milestones
  if (toRemove.length > 0) {
    console.log(`Removing ${toRemove.length} extra milestones...`);
    for (const milestone of toRemove) {
      await db.delete(milestones)
        .where(eq(milestones.id, milestone.id));
      removedCount++;
    }
    console.log(`✓ Removed ${removedCount} milestones\n`);
  }
  
  // Step 6: Final verification
  const finalMilestones = await db.select()
    .from(milestones)
    .where(
      or(
        eq(milestones.isLegacy, false),
        isNull(milestones.isLegacy)
      )
    );
  
  console.log('='.repeat(80));
  console.log('FINAL STATUS');
  console.log('='.repeat(80));
  console.log(`Comprehensive file: ${canonicalMilestones.length} milestones`);
  console.log(`Database (canonical): ${finalMilestones.length} milestones`);
  console.log(`Match: ${finalMilestones.length === canonicalMilestones.length ? '✓ YES' : '✗ NO'}`);
  console.log('='.repeat(80));
}

// Run sync
syncDatabase()
  .then(() => {
    console.log('\n✓ Database sync complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error syncing database:', error);
    process.exit(1);
  });
