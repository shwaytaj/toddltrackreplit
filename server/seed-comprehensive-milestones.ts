import { db } from './db';
import { milestones } from '../shared/schema';
import { extractMilestones } from './parse-milestones';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedComprehensiveMilestones() {
  console.log('🌱 Starting comprehensive milestone seeding...');
  
  // Step 1: Parse milestones from the markdown file
  const filePath = path.join(__dirname, '../attached_assets/dev-milestones-comprehensive_1761612366476.md');
  console.log(`📖 Reading milestones from: ${filePath}`);
  
  const parsedMilestones = extractMilestones(filePath);
  console.log(`✅ Extracted ${parsedMilestones.length} milestones`);
  
  // Step 2: Clear existing milestones
  console.log('🗑️  Clearing existing milestones...');
  await db.delete(milestones);
  console.log('✅ Existing milestones cleared');
  
  // Step 3: Insert new milestones in batches
  console.log('📥 Inserting new comprehensive milestones...');
  const batchSize = 50;
  let inserted = 0;
  
  for (let i = 0; i < parsedMilestones.length; i += batchSize) {
    const batch = parsedMilestones.slice(i, i + batchSize);
    await db.insert(milestones).values(batch);
    inserted += batch.length;
    console.log(`   Inserted ${inserted}/${parsedMilestones.length} milestones...`);
  }
  
  console.log('\n✨ Comprehensive milestone seeding complete!');
  console.log(`📊 Total milestones in database: ${parsedMilestones.length}`);
  
  // Show summary by category
  const categoryCounts: Record<string, number> = {};
  parsedMilestones.forEach(m => {
    const key = `${m.category} - ${m.subcategory}`;
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });
  
  console.log('\n📋 Milestones by category:');
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, count]) => {
      console.log(`   ${key}: ${count}`);
    });
  
  process.exit(0);
}

seedComprehensiveMilestones().catch(error => {
  console.error('❌ Error seeding milestones:', error);
  process.exit(1);
});
