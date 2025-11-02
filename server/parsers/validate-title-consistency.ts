import { parseComprehensiveMilestones } from './parse-comprehensive-milestones.js';
import { parseMilestoneSourcesFromFile } from './parse-milestone-sources.js';
import { parseMilestoneDescriptions } from './milestone-description-parser.js';
import { normalizeTitleForMatch } from './title-normalizer.js';
import { readFileSync } from 'fs';

/**
 * TITLE CONSISTENCY VALIDATION SCRIPT
 * 
 * This script cross-checks milestone titles across all three source files:
 * 1. dev-milestones-comprehensive.md (canonical source of truth)
 * 2. milestones-categorised-by-source.md (source attributions)
 * 3. milestones-descriptions.md (detailed descriptions)
 * 
 * It reports any mismatches to help maintain data integrity.
 * 
 * Usage:
 *   tsx server/parsers/validate-title-consistency.ts <comprehensive-file> <categorised-file> <descriptions-file>
 */

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: tsx server/parsers/validate-title-consistency.ts <comprehensive-file> <categorised-file> <descriptions-file>');
    process.exit(1);
  }
  
  const [comprehensiveFile, categorisedFile, descriptionsFile] = args;
  
  console.log('\n=== MILESTONE TITLE CONSISTENCY VALIDATION ===\n');
  
  // Load all three files
  console.log('Loading milestone data from files...\n');
  
  const comprehensiveMilestones = parseComprehensiveMilestones(comprehensiveFile);
  const categorisedMappings = parseMilestoneSourcesFromFile(categorisedFile);
  const descriptionContent = readFileSync(descriptionsFile, 'utf-8');
  const descriptionResult = parseMilestoneDescriptions(descriptionContent);
  const descriptions = descriptionResult.milestones;
  
  console.log(`✓ Canonical (comprehensive): ${comprehensiveMilestones.length} milestones`);
  console.log(`✓ Source mappings (categorised): ${categorisedMappings.length} mappings`);
  console.log(`✓ Descriptions: ${descriptions.length} descriptions\n`);
  
  // Create title sets with normalization
  const canonicalTitles = new Set(
    comprehensiveMilestones.map(m => normalizeTitleForMatch(m.title))
  );
  
  const categorisedTitles = new Set(
    categorisedMappings.map(m => normalizeTitleForMatch(m.title))
  );
  
  const descriptionTitles = new Set(
    descriptions.map(d => normalizeTitleForMatch(d.title))
  );
  
  // Check categorised vs canonical
  console.log('=== CATEGORISED vs CANONICAL ===\n');
  
  const categorisedNotInCanonical: string[] = [];
  const canonicalNotInCategorised: string[] = [];
  
  // Find categorised titles not in canonical
  for (const mapping of categorisedMappings) {
    const normalized = normalizeTitleForMatch(mapping.title);
    if (!canonicalTitles.has(normalized)) {
      categorisedNotInCanonical.push(mapping.title);
    }
  }
  
  // Find canonical titles not in categorised
  for (const milestone of comprehensiveMilestones) {
    const normalized = normalizeTitleForMatch(milestone.title);
    if (!categorisedTitles.has(normalized)) {
      canonicalNotInCategorised.push(milestone.title);
    }
  }
  
  if (categorisedNotInCanonical.length === 0 && canonicalNotInCategorised.length === 0) {
    console.log('✅ Perfect match! All titles are consistent.\n');
  } else {
    if (categorisedNotInCanonical.length > 0) {
      console.log(`⚠️  ${categorisedNotInCanonical.length} titles in categorised file not found in canonical file:\n`);
      categorisedNotInCanonical.slice(0, 10).forEach(title => console.log(`   - "${title}"`));
      if (categorisedNotInCanonical.length > 10) {
        console.log(`   ... and ${categorisedNotInCanonical.length - 10} more\n`);
      } else {
        console.log();
      }
    }
    
    if (canonicalNotInCategorised.length > 0) {
      console.log(`⚠️  ${canonicalNotInCategorised.length} canonical titles not found in categorised file:\n`);
      canonicalNotInCategorised.slice(0, 10).forEach(title => console.log(`   - "${title}"`));
      if (canonicalNotInCategorised.length > 10) {
        console.log(`   ... and ${canonicalNotInCategorised.length - 10} more\n`);
      } else {
        console.log();
      }
    }
  }
  
  // Check descriptions vs canonical
  console.log('=== DESCRIPTIONS vs CANONICAL ===\n');
  
  const descriptionsNotInCanonical: string[] = [];
  const canonicalNotInDescriptions: string[] = [];
  
  // Find description titles not in canonical
  for (const desc of descriptions) {
    const normalized = normalizeTitleForMatch(desc.title);
    if (!canonicalTitles.has(normalized)) {
      descriptionsNotInCanonical.push(desc.title);
    }
  }
  
  // Find canonical titles not in descriptions
  for (const milestone of comprehensiveMilestones) {
    const normalized = normalizeTitleForMatch(milestone.title);
    if (!descriptionTitles.has(normalized)) {
      canonicalNotInDescriptions.push(milestone.title);
    }
  }
  
  if (descriptionsNotInCanonical.length === 0 && canonicalNotInDescriptions.length === 0) {
    console.log('✅ Perfect match! All titles are consistent.\n');
  } else {
    if (descriptionsNotInCanonical.length > 0) {
      console.log(`⚠️  ${descriptionsNotInCanonical.length} titles in descriptions file not found in canonical file:\n`);
      descriptionsNotInCanonical.slice(0, 10).forEach(title => console.log(`   - "${title}"`));
      if (descriptionsNotInCanonical.length > 10) {
        console.log(`   ... and ${descriptionsNotInCanonical.length - 10} more\n`);
      } else {
        console.log();
      }
    }
    
    if (canonicalNotInDescriptions.length > 0) {
      console.log(`⚠️  ${canonicalNotInDescriptions.length} canonical titles without descriptions:\n`);
      canonicalNotInDescriptions.slice(0, 10).forEach(title => console.log(`   - "${title}"`));
      if (canonicalNotInDescriptions.length > 10) {
        console.log(`   ... and ${canonicalNotInDescriptions.length - 10} more\n`);
      } else {
        console.log();
      }
    }
  }
  
  // Overall summary
  console.log('=== SUMMARY ===\n');
  console.log(`Canonical milestones: ${comprehensiveMilestones.length}`);
  console.log(`Categorised mappings: ${categorisedMappings.length}`);
  console.log(`Descriptions: ${descriptions.length}\n`);
  
  const totalIssues = 
    categorisedNotInCanonical.length +
    canonicalNotInCategorised.length +
    descriptionsNotInCanonical.length +
    canonicalNotInDescriptions.length;
  
  if (totalIssues === 0) {
    console.log('✅ All files are perfectly consistent!\n');
  } else {
    console.log(`⚠️  Found ${totalIssues} title mismatches across files.`);
    console.log('These should be manually reviewed and reconciled.\n');
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
