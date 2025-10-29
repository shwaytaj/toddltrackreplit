/**
 * Check which milestones are missing descriptions after the update
 */

import { db } from './db.js';
import { milestones } from '@shared/schema';
import { isNull } from 'drizzle-orm';

async function main() {
  console.log('🔍 Checking milestones without descriptions...\n');

  const allMilestones = await db.select().from(milestones);
  const milestonesWithoutDesc = allMilestones.filter(m => 
    !m.description || 
    m.description === m.title || // Description is just the title (placeholder)
    !m.description.includes('**About**') // Not in the detailed format
  );

  console.log(`Total milestones: ${allMilestones.length}`);
  console.log(`With detailed descriptions: ${allMilestones.length - milestonesWithoutDesc.length}`);
  console.log(`Without detailed descriptions: ${milestonesWithoutDesc.length}\n`);

  if (milestonesWithoutDesc.length > 0) {
    console.log('Milestones missing detailed descriptions:');
    console.log('='.repeat(80));
    
    milestonesWithoutDesc.forEach((m, i) => {
      console.log(`\n${i + 1}. "${m.title}"`);
      console.log(`   Category: ${m.category} - ${m.subcategory}`);
      console.log(`   Age: ${m.ageRangeMonthsMin}-${m.ageRangeMonthsMax} months`);
      console.log(`   Current description: "${m.description?.substring(0, 80)}${m.description && m.description.length > 80 ? '...' : ''}"`);
    });
  }

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
