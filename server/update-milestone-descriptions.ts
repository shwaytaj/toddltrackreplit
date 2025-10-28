import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { milestones } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { extractDescriptions, formatDescription, type MilestoneDescription } from './parse-descriptions';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup Neon connection
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Normalize title for matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize spaces
    .trim();
}

// Calculate similarity score between two strings
function similarityScore(str1: string, str2: string): number {
  const s1 = normalizeTitle(str1);
  const s2 = normalizeTitle(str2);
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Calculate word overlap
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
  const union = new Set([...Array.from(words1), ...Array.from(words2)]);
  
  return intersection.size / union.size;
}

async function updateMilestoneDescriptions() {
  console.log('🔄 Starting milestone description update...\n');
  
  // Load detailed descriptions
  const filePath = path.join(__dirname, '../attached_assets/milestones_with_descriptions_1761616309888.md');
  const descriptions = extractDescriptions(filePath);
  console.log(`📚 Loaded ${descriptions.length} detailed descriptions\n`);
  
  // Get existing milestones from database
  const existingMilestones = await db.select().from(milestones);
  console.log(`💾 Found ${existingMilestones.length} milestones in database\n`);
  
  // Match descriptions to milestones
  const matches: Array<{
    milestoneId: string;
    milestoneTitle: string;
    description: MilestoneDescription;
    score: number;
  }> = [];
  
  const unmatchedMilestones: string[] = [];
  const unmatchedDescriptions: string[] = [];
  
  for (const milestone of existingMilestones) {
    let bestMatch: { description: MilestoneDescription; score: number } | null = null;
    
    for (const desc of descriptions) {
      const score = similarityScore(milestone.title, desc.title);
      
      if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { description: desc, score };
      }
    }
    
    if (bestMatch && bestMatch.score > 0.6) {
      matches.push({
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        description: bestMatch.description,
        score: bestMatch.score,
      });
    } else {
      unmatchedMilestones.push(milestone.title);
    }
  }
  
  // Find descriptions that weren't matched
  const matchedDescTitles = new Set(matches.map(m => m.description.title));
  for (const desc of descriptions) {
    if (!matchedDescTitles.has(desc.title)) {
      unmatchedDescriptions.push(desc.title);
    }
  }
  
  console.log('📊 Matching results:');
  console.log(`   ✅ Matched: ${matches.length}`);
  console.log(`   ❌ Unmatched milestones: ${unmatchedMilestones.length}`);
  console.log(`   ⚠️  Unmatched descriptions: ${unmatchedDescriptions.length}\n`);
  
  if (unmatchedMilestones.length > 0) {
    console.log('❌ Milestones without descriptions:');
    unmatchedMilestones.slice(0, 20).forEach(title => {
      console.log(`   • ${title}`);
    });
    if (unmatchedMilestones.length > 20) {
      console.log(`   ... and ${unmatchedMilestones.length - 20} more\n`);
    }
    console.log('');
  }
  
  if (unmatchedDescriptions.length > 0) {
    console.log('⚠️  Descriptions not matched to any milestone (first 10):');
    unmatchedDescriptions.slice(0, 10).forEach(title => {
      console.log(`   • ${title}`);
    });
    if (unmatchedDescriptions.length > 10) {
      console.log(`   ... and ${unmatchedDescriptions.length - 10} more\n`);
    }
    console.log('');
  }
  
  // Update milestones with detailed descriptions
  console.log('💾 Updating milestones in database...\n');
  
  let updateCount = 0;
  for (const match of matches) {
    const formattedDescription = formatDescription(match.description);
    
    await db
      .update(milestones)
      .set({ description: formattedDescription })
      .where(eq(milestones.id, match.milestoneId));
    
    updateCount++;
    
    if (updateCount % 50 === 0) {
      console.log(`   Updated ${updateCount}/${matches.length} milestones...`);
    }
  }
  
  console.log(`   Updated ${updateCount}/${matches.length} milestones...\n`);
  
  console.log('✨ Milestone descriptions updated successfully!\n');
  
  // Show some examples of good matches
  console.log('📝 Sample updated milestones:');
  const samples = matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  for (const sample of samples) {
    console.log(`\n   Title: ${sample.milestoneTitle}`);
    console.log(`   Match score: ${(sample.score * 100).toFixed(0)}%`);
    console.log(`   Description length: ${formatDescription(sample.description).length} chars`);
  }
  
  console.log('\n✅ Done!');
  
  // Save unmatched milestones to file for review
  if (unmatchedMilestones.length > 0) {
    const fs = await import('fs');
    const reportPath = path.join(__dirname, 'unmatched-milestones-report.txt');
    const report = [
      '# Milestones Without Detailed Descriptions',
      `Generated: ${new Date().toISOString()}`,
      `Total unmatched: ${unmatchedMilestones.length}`,
      '',
      '## Unmatched Milestones (in database but no description found):',
      ...unmatchedMilestones.map(t => `- ${t}`),
      '',
      '## Unmatched Descriptions (in file but no matching milestone):',
      ...unmatchedDescriptions.map(t => `- ${t}`),
    ].join('\n');
    
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }
  
  await pool.end();
}

updateMilestoneDescriptions().catch(console.error);
