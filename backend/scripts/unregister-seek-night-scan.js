// One-off — removes the 'seek-night-scan' repeatable job from Redis.
// Needed because registerSeekSchedulers() (which has an unregister path via
// SEEK_SCHEDULER_ENABLED=false) is never actually called anywhere in the
// app, so that path can't run. This does the same removal directly.
//
// Run with:
//   cd backend && node scripts/unregister-seek-night-scan.js

import '../src/config/env.js';
import seekQueue from '../src/modules/platform/seek/queue/seek.queue.js';

const NIGHT_SCAN_PATTERN = '*/30 21-23,0-4 * * *';

async function run() {
  const removed = await seekQueue.removeRepeatable(
    'seek-night-scan', { pattern: NIGHT_SCAN_PATTERN }, 'seek-night-scan'
  );
  console.log(removed ? 'Removed seek-night-scan repeatable job.' : 'seek-night-scan was not registered — nothing to remove.');

  const repeatables = await seekQueue.getRepeatableJobs();
  console.log(`Remaining repeatable jobs: ${repeatables.length}`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
  });
