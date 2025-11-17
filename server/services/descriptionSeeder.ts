/**
 * DESCRIPTION SEEDER SERVICE
 * 
 * Automatically loads detailed milestone descriptions on server startup.
 * Ensures production database always has rich description content
 * including "About", "What to look for", and "Why it matters" sections.
 * 
 * PRODUCTION DEPLOYMENT FIX:
 * Replit Autoscale deployments have separate dev/prod databases.
 * Schema structure copies on publish, but DATA does not.
 * This service ensures descriptions are always loaded in production.
 */

import { db } from '../db.js';
import { milestones } from '../../shared/schema.js';
import { eq, ne, sql } from 'drizzle-orm';
import { 
  parseMilestoneDescriptions, 
  formatMilestoneDescription, 
  normalizeMilestoneTitle 
} from '../parsers/milestone-description-parser.js';
import { readFileSync } from 'fs';
import path from 'path';

export class DescriptionSeeder {
  private static readonly EXPECTED_DESCRIPTION_COUNT = 571;
  private static readonly DESCRIPTIONS_FILE = 'milestones-descriptions_1762125221739.md';

  /**
   * Seeds milestone descriptions if they're missing.
   * Safe to run multiple times - idempotent operation.
   */
  static async seed(): Promise<void> {
    try {
      console.log('[DescriptionSeeder] Checking description data...');

      // Check if descriptions are already loaded
      // Count milestones where description is not empty
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(milestones)
        .where(ne(milestones.description, ''));
      
      const milestonesWithDescriptionsCount = Number(result[0]?.count || 0);

      console.log(`[DescriptionSeeder] Found ${milestonesWithDescriptionsCount} milestones with descriptions`);

      // If we already have most descriptions, skip seeding
      if (milestonesWithDescriptionsCount >= this.EXPECTED_DESCRIPTION_COUNT * 0.9) {
        console.log('[DescriptionSeeder] ✓ Descriptions already loaded, skipping seed');
        return;
      }

      console.log('[DescriptionSeeder] Loading descriptions from file...');

      // Step 1: Read and parse the descriptions file
      const filePath = path.join(process.cwd(), 'attached_assets', this.DESCRIPTIONS_FILE);
      const fileContent = readFileSync(filePath, 'utf-8');
      const { milestones: parsedDescriptions, errors } = parseMilestoneDescriptions(fileContent);

      console.log(`[DescriptionSeeder] Parsed ${parsedDescriptions.length} descriptions`);
      if (errors.length > 0) {
        console.log(`[DescriptionSeeder] Warnings: ${errors.length} parsing issues`);
      }

      // Step 2: Fetch all milestones from database
      const dbMilestones = await db.select().from(milestones);
      console.log(`[DescriptionSeeder] Found ${dbMilestones.length} milestones in database`);

      // Step 3: Create lookup map for database milestones by normalized title
      const dbTitleMap = new Map(
        dbMilestones.map(m => [normalizeMilestoneTitle(m.title), m])
      );

      // Step 4: Match descriptions to database milestones and update
      let updatedCount = 0;

      for (const parsed of parsedDescriptions) {
        const normalized = normalizeMilestoneTitle(parsed.title);
        let dbMilestone = dbTitleMap.get(normalized);

        // Try fuzzy matching if exact match fails
        if (!dbMilestone && parsed.title.includes(',')) {
          const beforeComma = parsed.title.split(',')[0].trim();
          const normalizedBeforeComma = normalizeMilestoneTitle(beforeComma);
          dbMilestone = dbTitleMap.get(normalizedBeforeComma);
        }

        if (dbMilestone) {
          // Only update if description is empty or minimal
          const currentDesc = dbMilestone.description || '';
          if (currentDesc.length < 50) {
            const formattedDescription = formatMilestoneDescription(parsed);
            
            await db
              .update(milestones)
              .set({ description: formattedDescription })
              .where(eq(milestones.id, dbMilestone.id));
            
            updatedCount++;
          }
        }
      }

      console.log(`[DescriptionSeeder] ✓ Seeding complete: ${updatedCount} descriptions added`);
      console.log(`[DescriptionSeeder] Total milestones with descriptions: ${milestonesWithDescriptionsCount + updatedCount}`);
    } catch (error) {
      // Log error but don't block server startup
      console.error('[DescriptionSeeder] Error seeding descriptions:', error);
      console.error('[DescriptionSeeder] Server will continue without descriptions');
    }
  }
}
