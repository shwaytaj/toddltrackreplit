/**
 * Compare new milestone data with current database to see if updates are needed
 */

import { extractMilestones } from './parse-milestones.js';
import { db } from './db.js';
import { milestones } from '@shared/schema';

async function main() {
  console.log('📖 Parsing new milestone data file...');
  const newMilestones = extractMilestones('./attached_assets/dev-milestones-comprehensive_1761767961880.md');
  console.log(`✅ Parsed ${newMilestones.length} milestones from new file`);

  console.log('\n📊 Fetching current milestones from database...');
  const dbMilestones = await db.select().from(milestones);
  console.log(`✅ Found ${dbMilestones.length} milestones in database`);

  console.log('\n🔍 Comparing data...');
  
  // Check for count differences
  if (newMilestones.length !== dbMilestones.length) {
    console.log(`\n⚠️  Count mismatch: File has ${newMilestones.length}, DB has ${dbMilestones.length}`);
  } else {
    console.log(`\n✅ Same count: ${newMilestones.length} milestones`);
  }

  // Sample comparison - check first 5 milestones
  console.log('\n📋 Sample comparison (first 5):');
  for (let i = 0; i < Math.min(5, newMilestones.length); i++) {
    const newM = newMilestones[i];
    const dbM = dbMilestones[i];
    
    console.log(`\n${i + 1}. New: "${newM.title}"`);
    console.log(`   DB:  "${dbM.title}"`);
    
    const differences = [];
    if (newM.title !== dbM.title) differences.push('title');
    if (newM.category !== dbM.category) differences.push('category');
    if (newM.subcategory !== dbM.subcategory) differences.push('subcategory');
    if (newM.ageRangeMonthsMin !== dbM.ageRangeMonthsMin) differences.push('ageMin');
    if (newM.ageRangeMonthsMax !== dbM.ageRangeMonthsMax) differences.push('ageMax');
    
    if (differences.length > 0) {
      console.log(`   ⚠️  Differences: ${differences.join(', ')}`);
    } else {
      console.log(`   ✅ Identical`);
    }
  }

  // Check for any differences across all milestones
  let totalDifferences = 0;
  const differenceTypes = new Set<string>();
  
  for (let i = 0; i < Math.min(newMilestones.length, dbMilestones.length); i++) {
    const newM = newMilestones[i];
    const dbM = dbMilestones[i];
    
    if (newM.title !== dbM.title) { totalDifferences++; differenceTypes.add('title'); }
    if (newM.category !== dbM.category) { totalDifferences++; differenceTypes.add('category'); }
    if (newM.subcategory !== dbM.subcategory) { totalDifferences++; differenceTypes.add('subcategory'); }
    if (newM.ageRangeMonthsMin !== dbM.ageRangeMonthsMin) { totalDifferences++; differenceTypes.add('ageMin'); }
    if (newM.ageRangeMonthsMax !== dbM.ageRangeMonthsMax) { totalDifferences++; differenceTypes.add('ageMax'); }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  if (totalDifferences === 0) {
    console.log('\n✅ No differences found! Database is already up to date.');
    console.log('   No need to update milestone data.');
  } else {
    console.log(`\n⚠️  Found ${totalDifferences} differences`);
    console.log(`   Types: ${Array.from(differenceTypes).join(', ')}`);
    console.log('   Milestone data should be updated.');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
