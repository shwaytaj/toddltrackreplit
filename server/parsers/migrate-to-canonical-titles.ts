import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import ws from "ws";
import { milestones, type Milestone } from "../../shared/schema.js";
import { parseComprehensiveMilestones } from "./parse-comprehensive-milestones.js";
import { normalizeTitleForMatch, titlesMatch } from "./title-normalizer.js";

neonConfig.webSocketConstructor = ws;

interface TitleMapping {
  milestoneId: string;
  currentTitle: string;
  canonicalTitle: string;
  category: string;
  subcategory: string;
}

/**
 * MILESTONE TITLE MIGRATION SCRIPT
 * 
 * This script reconciles existing database milestone titles with the canonical
 * titles from dev-milestones-comprehensive.md.
 * 
 * It performs the following:
 * 1. Loads all milestones from the database
 * 2. Parses canonical titles from dev-milestones-comprehensive.md
 * 3. Matches database titles to canonical titles using normalization
 * 4. Reports mismatches and generates a title mapping
 * 5. Optionally updates the database with canonical titles
 * 
 * Usage:
 *   tsx server/parsers/migrate-to-canonical-titles.ts <comprehensive-file> [--apply]
 * 
 * Options:
 *   --apply    Apply the title updates to the database (dry-run by default)
 */

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: tsx server/parsers/migrate-to-canonical-titles.ts <comprehensive-file> [--apply]');
    console.error('');
    console.error('Options:');
    console.error('  --apply    Apply title updates to database (default: dry-run only)');
    process.exit(1);
  }
  
  const filePath = args[0];
  const applyChanges = args.includes('--apply');
  
  // Connect to database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  console.log('\n=== MILESTONE TITLE MIGRATION ===\n');
  console.log(`Mode: ${applyChanges ? 'APPLY' : 'DRY-RUN'}\n`);
  
  // Step 1: Load canonical titles
  console.log('Step 1: Loading canonical titles from comprehensive file...');
  const canonicalMilestones = parseComprehensiveMilestones(filePath);
  console.log(`✓ Loaded ${canonicalMilestones.length} canonical milestone titles\n`);
  
  // Step 2: Load database milestones
  console.log('Step 2: Loading milestones from database...');
  const dbMilestones = await db.select().from(milestones);
  console.log(`✓ Loaded ${dbMilestones.length} milestones from database\n`);
  
  // Step 3: Match titles
  console.log('Step 3: Matching database titles to canonical titles...\n');
  
  const titleMappings: TitleMapping[] = [];
  const unmatched: Milestone[] = [];
  const perfectMatches: number[] = [];
  
  for (const dbMilestone of dbMilestones) {
    // Only process Developmental milestones (canonical file only has these)
    if (dbMilestone.category !== 'Developmental') {
      continue;
    }
    
    let found = false;
    
    // Try to find a matching canonical title
    for (const canonical of canonicalMilestones) {
      if (titlesMatch(dbMilestone.title, canonical.title)) {
        found = true;
        
        // Check if title needs updating (exact match vs normalized match)
        if (dbMilestone.title !== canonical.title) {
          titleMappings.push({
            milestoneId: dbMilestone.id,
            currentTitle: dbMilestone.title,
            canonicalTitle: canonical.title,
            category: canonical.category,
            subcategory: canonical.subcategory,
          });
        } else {
          perfectMatches.push(1);
        }
        break;
      }
    }
    
    if (!found) {
      unmatched.push(dbMilestone);
    }
  }
  
  // Step 4: Report results
  console.log('=== MATCHING RESULTS ===\n');
  console.log(`Perfect matches (no update needed): ${perfectMatches.length}`);
  console.log(`Titles needing update: ${titleMappings.length}`);
  console.log(`Unmatched database milestones: ${unmatched.length}\n`);
  
  if (titleMappings.length > 0) {
    console.log('=== TITLES TO UPDATE ===\n');
    titleMappings.forEach((mapping, index) => {
      console.log(`${index + 1}. [${mapping.category} > ${mapping.subcategory}]`);
      console.log(`   Current:   "${mapping.currentTitle}"`);
      console.log(`   Canonical: "${mapping.canonicalTitle}"`);
      console.log('');
    });
  }
  
  if (unmatched.length > 0) {
    console.log('=== UNMATCHED DATABASE MILESTONES ===\n');
    console.log('These milestones exist in the database but have no match in the canonical file.');
    console.log('They may need to be manually reviewed or deleted.\n');
    unmatched.forEach((milestone, index) => {
      console.log(`${index + 1}. "${milestone.title}"`);
      console.log(`   Category: ${milestone.category} > ${milestone.subcategory}`);
      console.log(`   Age Range: ${milestone.ageRangeMonthsMin}-${milestone.ageRangeMonthsMax} months`);
      console.log('');
    });
  }
  
  // Step 5: Apply changes if requested
  if (applyChanges) {
    console.log('=== APPLYING STAGED MIGRATION ===\n');
    
    // Phase 1: Update existing milestone titles
    if (titleMappings.length > 0) {
      console.log(`Phase 1: Updating ${titleMappings.length} existing milestone titles...\n`);
      
      let updateCount = 0;
      for (const mapping of titleMappings) {
        try {
          await db
            .update(milestones)
            .set({ title: mapping.canonicalTitle })
            .where(eq(milestones.id, mapping.milestoneId));
          
          updateCount++;
          console.log(`✓ Updated: "${mapping.currentTitle}" → "${mapping.canonicalTitle}"`);
        } catch (error) {
          console.error(`✗ Failed to update milestone ${mapping.milestoneId}:`, error);
        }
      }
      
      console.log(`\n✓ Updated ${updateCount} milestone titles\n`);
    }
    
    // Phase 2: Add new canonical milestones not in database
    console.log('Phase 2: Adding new canonical milestones...\n');
    
    const dbTitleSet = new Set(dbMilestones.map(m => normalizeTitleForMatch(m.title)));
    const newMilestones = canonicalMilestones.filter(
      canonical => !dbTitleSet.has(normalizeTitleForMatch(canonical.title))
    );
    
    if (newMilestones.length > 0) {
      console.log(`Found ${newMilestones.length} new canonical milestones to add...\n`);
      
      let addCount = 0;
      for (const milestone of newMilestones) {
        try {
          await db.insert(milestones).values({
            title: milestone.title,
            category: milestone.category,
            subcategory: milestone.subcategory || '',
            ageRangeMonthsMin: milestone.ageRangeMonthsMin,
            ageRangeMonthsMax: milestone.ageRangeMonthsMax,
            description: milestone.title, // Placeholder until descriptions are added
            typicalRange: milestone.typicalRange,
            sources: [],
            isLegacy: false,
          });
          
          addCount++;
          
          if (addCount <= 10) {
            console.log(`✓ Added: "${milestone.title}" [${milestone.category} > ${milestone.subcategory}]`);
          }
        } catch (error) {
          console.error(`✗ Failed to add milestone "${milestone.title}":`, error);
        }
      }
      
      console.log(`\n✓ Added ${addCount} new canonical milestones\n`);
    } else {
      console.log('No new milestones to add.\n');
    }
    
    // Phase 3: Mark unmatched legacy milestones
    if (unmatched.length > 0) {
      console.log(`Phase 3: Marking ${unmatched.length} unmatched milestones as legacy...\n`);
      
      let legacyCount = 0;
      for (const legacy of unmatched) {
        try {
          await db
            .update(milestones)
            .set({ isLegacy: true })
            .where(eq(milestones.id, legacy.id));
          
          legacyCount++;
        } catch (error) {
          console.error(`✗ Failed to mark milestone ${legacy.id} as legacy:`, error);
        }
      }
      
      console.log(`✓ Marked ${legacyCount} milestones as legacy\n`);
      console.log('Legacy milestones are preserved for historical child progress tracking');
      console.log('but will not be shown to new users.\n');
    }
    
    console.log('=== MIGRATION COMPLETE ===\n');
    console.log(`Summary:`);
    console.log(`- ${perfectMatches.length} milestones already matched canonical titles`);
    console.log(`- ${titleMappings.length} milestone titles updated`);
    console.log(`- ${newMilestones.length} new canonical milestones added`);
    console.log(`- ${unmatched.length} legacy milestones preserved\n`);
    
  } else {
    console.log('=== DRY-RUN MODE ===\n');
    console.log('No changes were applied to the database.');
    console.log('Run with --apply flag to execute the migration.\n');
    console.log('The migration will:');
    console.log(`1. Update ${titleMappings.length} existing milestone titles`);
    console.log(`2. Add ${canonicalMilestones.length - (perfectMatches.length + titleMappings.length)} new canonical milestones`);
    console.log(`3. Mark ${unmatched.length} unmatched milestones as legacy\n`);
  }
  
  await pool.end();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
