/**
 * Update Milestone Descriptions from File
 * 
 * This script reads a milestone descriptions file and updates the database
 * with structured, comprehensive descriptions.
 * 
 * Usage: tsx server/update-milestone-descriptions-from-file.ts <filepath>
 */

import { readFileSync } from 'fs';
import { db } from './db';
import { milestones } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { 
  parseMilestoneDescriptions, 
  formatMilestoneDescription,
  normalizeMilestoneTitle,
  type ParsedMilestone 
} from './parsers/milestone-description-parser';

interface MatchResult {
  matched: Array<{ dbTitle: string; fileTitle: string; dbId: string }>;
  unmatchedInFile: string[];
  unmatchedInDb: Array<{ id: string; title: string }>;
}

async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: tsx server/update-milestone-descriptions-from-file.ts <filepath>');
    process.exit(1);
  }

  console.log('📖 Reading milestone descriptions file...');
  const fileContent = readFileSync(filePath, 'utf-8');

  console.log('🔍 Parsing milestone descriptions...');
  const { milestones: parsedMilestones, errors } = parseMilestoneDescriptions(fileContent);

  if (errors.length > 0) {
    console.log('\n⚠️  Parser warnings:');
    errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log(`✅ Parsed ${parsedMilestones.length} milestone descriptions from file`);

  console.log('\n📊 Fetching current milestones from database...');
  const dbMilestones = await db.select().from(milestones);
  console.log(`✅ Found ${dbMilestones.length} milestones in database`);

  console.log('\n🔗 Matching milestones by title...');
  const matchResult = matchMilestones(parsedMilestones, dbMilestones);

  console.log(`\n📈 Match Results:`);
  console.log(`  ✅ Matched: ${matchResult.matched.length}`);
  console.log(`  ❌ Unmatched in file: ${matchResult.unmatchedInFile.length}`);
  console.log(`  ❌ Unmatched in database: ${matchResult.unmatchedInDb.length}`);

  if (matchResult.unmatchedInFile.length > 0) {
    console.log('\n❌ Milestones in file but not in database:');
    matchResult.unmatchedInFile.slice(0, 10).forEach(title => {
      console.log(`  - ${title}`);
    });
    if (matchResult.unmatchedInFile.length > 10) {
      console.log(`  ... and ${matchResult.unmatchedInFile.length - 10} more`);
    }
  }

  if (matchResult.unmatchedInDb.length > 0) {
    console.log('\n❌ Milestones in database but not in file:');
    matchResult.unmatchedInDb.slice(0, 10).forEach(({ title, id }) => {
      console.log(`  - ${title} (${id})`);
    });
    if (matchResult.unmatchedInDb.length > 10) {
      console.log(`  ... and ${matchResult.unmatchedInDb.length - 10} more`);
    }
  }

  console.log('\n💾 Updating database with new descriptions...');
  let updateCount = 0;
  
  for (const match of matchResult.matched) {
    const parsedMilestone = parsedMilestones.find(
      pm => normalizeMilestoneTitle(pm.title) === normalizeMilestoneTitle(match.fileTitle)
    );

    if (!parsedMilestone) {
      console.error(`  ⚠️  Could not find parsed milestone for: ${match.fileTitle}`);
      continue;
    }

    const formattedDescription = formatMilestoneDescription(parsedMilestone);

    await db
      .update(milestones)
      .set({ description: formattedDescription })
      .where(eq(milestones.id, match.dbId));

    updateCount++;

    if (updateCount % 20 === 0) {
      console.log(`  📝 Updated ${updateCount}/${matchResult.matched.length} milestones...`);
    }
  }

  console.log(`\n✨ Successfully updated ${updateCount} milestone descriptions!`);

  // Show a sample of updated descriptions
  console.log('\n📝 Sample of updated descriptions:');
  const sampleMilestones = await db
    .select()
    .from(milestones)
    .limit(3);

  for (const milestone of sampleMilestones) {
    console.log(`\n--- ${milestone.title} ---`);
    console.log(milestone.description.substring(0, 200) + '...');
  }

  console.log('\n✅ All done! Milestone descriptions have been updated.');
  process.exit(0);
}

function matchMilestones(
  parsedMilestones: ParsedMilestone[],
  dbMilestones: Array<{ id: string; title: string; description: string | null }>
): MatchResult {
  const matched: Array<{ dbTitle: string; fileTitle: string; dbId: string }> = [];
  const unmatchedInFile: string[] = [];
  const unmatchedInDb: Array<{ id: string; title: string }> = [];

  // Create a map of normalized titles to database milestones
  const dbTitleMap = new Map<string, typeof dbMilestones[0]>();
  for (const dbMilestone of dbMilestones) {
    const normalizedTitle = normalizeMilestoneTitle(dbMilestone.title);
    dbTitleMap.set(normalizedTitle, dbMilestone);
  }

  // Match parsed milestones to database milestones
  const matchedDbIds = new Set<string>();
  
  for (const parsedMilestone of parsedMilestones) {
    const normalizedTitle = normalizeMilestoneTitle(parsedMilestone.title);
    const dbMilestone = dbTitleMap.get(normalizedTitle);

    if (dbMilestone) {
      matched.push({
        dbTitle: dbMilestone.title,
        fileTitle: parsedMilestone.title,
        dbId: dbMilestone.id
      });
      matchedDbIds.add(dbMilestone.id);
    } else {
      unmatchedInFile.push(parsedMilestone.title);
    }
  }

  // Find database milestones that weren't matched
  for (const dbMilestone of dbMilestones) {
    if (!matchedDbIds.has(dbMilestone.id)) {
      unmatchedInDb.push({
        id: dbMilestone.id,
        title: dbMilestone.title
      });
    }
  }

  return { matched, unmatchedInFile, unmatchedInDb };
}

main().catch(error => {
  console.error('❌ Error updating milestone descriptions:', error);
  process.exit(1);
});
