/**
 * Test script to verify parsers work with new files
 */

import { readFileSync } from 'fs';
import { extractMilestones } from './parse-milestones.js';
import { 
  parseMilestoneDescriptions, 
  normalizeMilestoneTitle 
} from './parsers/milestone-description-parser.js';

console.log('='.repeat(80));
console.log('TESTING MILESTONE DATA PARSER');
console.log('='.repeat(80));

// Test milestone data parser with new file
const milestonesFilePath = './attached_assets/dev-milestones-comprehensive_1761767961880.md';
const milestones = extractMilestones(milestonesFilePath);

console.log(`\n✅ Parsed ${milestones.length} milestones from new file`);
console.log('\nSample milestones:');
console.log(JSON.stringify(milestones.slice(0, 3), null, 2));

// Count by category
const categoryCounts: Record<string, number> = {};
milestones.forEach(m => {
  const key = `${m.category} - ${m.subcategory}`;
  categoryCounts[key] = (categoryCounts[key] || 0) + 1;
});

console.log('\nMilestones by category:');
Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([key, count]) => {
    console.log(`  ${key}: ${count}`);
  });

console.log('\n' + '='.repeat(80));
console.log('TESTING DESCRIPTION PARSER');
console.log('='.repeat(80));

// Test description parser with new file
const descriptionsFilePath = './attached_assets/milestones-descriptions_1761768006190.md';
const fileContent = readFileSync(descriptionsFilePath, 'utf-8');
const { milestones: parsedDescriptions, errors } = parseMilestoneDescriptions(fileContent);

console.log(`\n✅ Parsed ${parsedDescriptions.length} descriptions from new file`);

if (errors.length > 0) {
  console.log(`\n⚠️  Parser warnings (${errors.length}):`);
  errors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
  if (errors.length > 5) {
    console.log(`  ... and ${errors.length - 5} more`);
  }
}

console.log('\nSample description:');
const sample = parsedDescriptions[0];
console.log(`Title: ${sample.title}`);
console.log(`About: ${sample.about.substring(0, 150)}...`);
console.log(`What to look for (${sample.whatToLookFor.length} items):`);
sample.whatToLookFor.slice(0, 2).forEach(item => console.log(`  - ${item}`));
console.log(`Why it matters (${sample.whyItMatters.length} items):`);
sample.whyItMatters.slice(0, 2).forEach(item => console.log(`  - ${item}`));

console.log('\n' + '='.repeat(80));
console.log('TESTING TITLE MATCHING');
console.log('='.repeat(80));

// Test title matching
const milestoneTitle1 = milestones[0].title;
const descriptionTitle1 = parsedDescriptions[0].title;

console.log(`\nMilestone title: "${milestoneTitle1}"`);
console.log(`Description title: "${descriptionTitle1}"`);
console.log(`Normalized milestone: "${normalizeMilestoneTitle(milestoneTitle1)}"`);
console.log(`Normalized description: "${normalizeMilestoneTitle(descriptionTitle1)}"`);
console.log(`Match: ${normalizeMilestoneTitle(milestoneTitle1) === normalizeMilestoneTitle(descriptionTitle1) ? '✅ YES' : '❌ NO'}`);

// Find a few matches
console.log('\nSample matches:');
let matchCount = 0;
for (const milestone of milestones.slice(0, 20)) {
  const normalizedMilestone = normalizeMilestoneTitle(milestone.title);
  const match = parsedDescriptions.find(desc => 
    normalizeMilestoneTitle(desc.title) === normalizedMilestone
  );
  if (match) {
    matchCount++;
    if (matchCount <= 3) {
      console.log(`  ✅ "${milestone.title}" → "${match.title}"`);
    }
  }
}
console.log(`\nMatched ${matchCount} out of first 20 milestones`);

console.log('\n' + '='.repeat(80));
console.log('PARSER TESTING COMPLETE');
console.log('='.repeat(80));
