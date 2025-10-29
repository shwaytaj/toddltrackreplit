/**
 * Update milestone core data (age ranges, categories) from file
 */

import { extractMilestones } from './parse-milestones.js';
import { db } from './db.js';
import { milestones } from '@shared/schema';
import { eq } from 'drizzle-orm';

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim();
}

async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: tsx server/update-milestones-from-file.ts <path-to-milestone-file>');
    process.exit(1);
  }

  console.log('📖 Reading milestone file...');
  const newMilestones = extractMilestones(filePath);
  console.log(`✅ Parsed ${newMilestones.length} milestones from file\n`);

  console.log('📊 Fetching current milestones from database...');
  const dbMilestones = await db.select().from(milestones);
  console.log(`✅ Found ${dbMilestones.length} milestones in database\n`);

  // Create lookup map by normalized title
  const newMap = new Map(newMilestones.map(m => [normalizeTitle(m.title), m]));

  console.log('🔍 Matching and updating milestones...\n');
  
  let updatedCount = 0;
  let unchangedCount = 0;
  const updates: any[] = [];

  for (const dbM of dbMilestones) {
    const normalizedTitle = normalizeTitle(dbM.title);
    const newM = newMap.get(normalizedTitle);
    
    if (newM) {
      // Check if any fields need updating
      const needsUpdate = 
        newM.category !== dbM.category ||
        newM.subcategory !== dbM.subcategory ||
        newM.ageRangeMonthsMin !== dbM.ageRangeMonthsMin ||
        newM.ageRangeMonthsMax !== dbM.ageRangeMonthsMax;

      if (needsUpdate) {
        const changes: string[] = [];
        if (newM.category !== dbM.category) changes.push(`category: "${dbM.category}" → "${newM.category}"`);
        if (newM.subcategory !== dbM.subcategory) changes.push(`subcategory: "${dbM.subcategory}" → "${newM.subcategory}"`);
        if (newM.ageRangeMonthsMin !== dbM.ageRangeMonthsMin) changes.push(`ageMin: ${dbM.ageRangeMonthsMin} → ${newM.ageRangeMonthsMin}`);
        if (newM.ageRangeMonthsMax !== dbM.ageRangeMonthsMax) changes.push(`ageMax: ${dbM.ageRangeMonthsMax} → ${newM.ageRangeMonthsMax}`);
        
        updates.push({
          title: dbM.title,
          id: dbM.id,
          changes,
          newData: newM
        });
      } else {
        unchangedCount++;
      }
    }
  }

  console.log('📈 Update Summary:');
  console.log(`  ✅ No changes needed: ${unchangedCount}`);
  console.log(`  📝 Need updates: ${updates.length}\n`);

  if (updates.length > 0) {
    console.log('⚠️  Milestones to be updated:');
    updates.forEach((update, i) => {
      console.log(`\n${i + 1}. "${update.title}"`);
      update.changes.forEach((change: string) => console.log(`   - ${change}`));
    });

    console.log('\n💾 Updating database...');
    
    for (const update of updates) {
      await db.update(milestones)
        .set({
          category: update.newData.category,
          subcategory: update.newData.subcategory,
          ageRangeMonthsMin: update.newData.ageRangeMonthsMin,
          ageRangeMonthsMax: update.newData.ageRangeMonthsMax,
        })
        .where(eq(milestones.id, update.id));
    }

    console.log(`\n✨ Successfully updated ${updates.length} milestones!`);
  } else {
    console.log('\n✅ All milestones are already up to date!');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
