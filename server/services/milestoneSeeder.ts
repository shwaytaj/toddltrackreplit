/**
 * Milestone Seeder Service
 * Automatically seeds milestones from the canonical comprehensive file into the database
 * This runs on server startup to ensure production database always has milestone data
 */

import { storage } from '../storage.js';
import { parseComprehensiveMilestones } from '../parsers/parse-comprehensive-milestones.js';
import { normalizeTitleForMatch } from '../parsers/title-normalizer.js';
import path from 'path';
import { existsSync } from 'fs';

const EXPECTED_MILESTONE_COUNT = 612; // Total canonical milestones in comprehensive file

export class MilestoneSeeder {
  /**
   * Clean up malformed milestone records that were incorrectly parsed
   * These are single-letter milestones that were split from a comma-separated list
   */
  static async cleanupMalformedMilestones(): Promise<void> {
    const malformedTitles = ['b', 'p', 'n', 'm', 'd', 't', 'w', 'h', 's', 'z', 'l', 'sh', 'ch', 'j', 'th', 'r'];
    
    try {
      const allMilestones = await storage.getAllMilestones();
      const toDelete = allMilestones.filter(m => malformedTitles.includes(m.title));
      
      if (toDelete.length > 0) {
        console.log(`[MilestoneSeeder] Cleaning up ${toDelete.length} malformed milestone records...`);
        for (const milestone of toDelete) {
          await storage.deleteMilestone(milestone.id);
        }
        console.log('[MilestoneSeeder] ✓ Cleanup complete');
      }
    } catch (error) {
      console.error('[MilestoneSeeder] Cleanup error (non-blocking):', error);
    }
  }

  /**
   * Seed milestones into the database if needed
   * This is idempotent - it only adds missing milestones, never duplicates
   */
  static async run(): Promise<void> {
    try {
      console.log('[MilestoneSeeder] Checking milestone data...');
      
      // First, clean up any malformed records from previous parsing bugs
      await MilestoneSeeder.cleanupMalformedMilestones();
      
      // Check if milestones already exist
      const existingMilestones = await storage.getAllMilestones();
      console.log(`[MilestoneSeeder] Found ${existingMilestones.length} existing milestones`);
      
      // If we have the expected count, skip seeding
      if (existingMilestones.length >= EXPECTED_MILESTONE_COUNT) {
        console.log('[MilestoneSeeder] ✓ Milestone data already present, skipping seed');
        return;
      }
      
      console.log('[MilestoneSeeder] Loading canonical milestones from file...');
      const filePath = path.join(process.cwd(), 'attached_assets', 'dev-milestones-comprehensive_1762125221739.md');
      
      // Check if file exists before attempting to parse
      if (!existsSync(filePath)) {
        console.log('[MilestoneSeeder] ⚠ Source file not found (expected in production builds)');
        console.log('[MilestoneSeeder] Server will continue without seeding new milestones');
        return;
      }
      
      const canonicalMilestones = parseComprehensiveMilestones(filePath);
      console.log(`[MilestoneSeeder] Parsed ${canonicalMilestones.length} canonical milestones`);
      
      // Create a map of existing milestones for efficient lookup
      const existingTitleMap = new Map(
        existingMilestones.map(m => [normalizeTitleForMatch(m.title), m])
      );
      
      // Add missing milestones
      let added = 0;
      console.log('[MilestoneSeeder] Inserting missing milestones...');
      
      for (const milestone of canonicalMilestones) {
        const normalized = normalizeTitleForMatch(milestone.title);
        
        // Only insert if it doesn't exist
        if (!existingTitleMap.has(normalized)) {
          await storage.createMilestone({
            ...milestone,
            description: '', // Description will be loaded separately via load-milestone-descriptions
          });
          added++;
        }
      }
      
      console.log(`[MilestoneSeeder] ✓ Seeding complete: ${added} milestones added`);
      console.log(`[MilestoneSeeder] Total milestones in database: ${existingMilestones.length + added}`);
      
    } catch (error) {
      // Log error but don't block server startup
      console.error('[MilestoneSeeder] ✗ Failed to seed milestones:', error);
      console.error('[MilestoneSeeder] Server will continue, but milestone data may be incomplete');
    }
  }
}
