import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { milestones } from '../../shared/schema';
import { isNull } from 'drizzle-orm';
import ws from 'ws';

async function main() {
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Backfilling isLegacy field for existing milestones...\n');

  const result = await db
    .update(milestones)
    .set({ isLegacy: false })
    .where(isNull(milestones.isLegacy))
    .returning();

  console.log(`✓ Backfilled ${result.length} milestones with isLegacy=false`);

  await pool.end();
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
