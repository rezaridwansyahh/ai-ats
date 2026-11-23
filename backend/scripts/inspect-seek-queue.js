// One-off, read-only inspection of the 'seek' BullMQ queue — job counts,
// registered repeatable (cron) jobs, and what's currently waiting/delayed/
// failed. Doesn't touch Postgres, doesn't mutate the queue.
//
// Run with:
//   cd backend && node scripts/inspect-seek-queue.js

import '../src/config/env.js';
import seekQueue from '../src/modules/platform/seek/queue/seek.queue.js';

async function run() {
  const counts = await seekQueue.getJobCounts();
  console.log('Job counts:', counts);

  const repeatables = await seekQueue.getRepeatableJobs();
  console.log(`\nRepeatable (cron-style) jobs registered (${repeatables.length}):`);
  for (const r of repeatables) {
    console.log(`  ${r.name} — pattern: ${r.pattern || '(none)'}, next: ${new Date(r.next).toLocaleString()}, key: ${r.key}`);
  }

  const waiting = await seekQueue.getWaiting();
  console.log(`\nWaiting (${waiting.length}):`);
  for (const j of waiting) console.log(`  [${j.id}] ${j.name}`, j.data);

  const delayed = await seekQueue.getDelayed();
  console.log(`\nDelayed (${delayed.length}):`);
  for (const j of delayed) console.log(`  [${j.id}] ${j.name}`, j.data);

  const active = await seekQueue.getActive();
  console.log(`\nActive (${active.length}):`);
  for (const j of active) console.log(`  [${j.id}] ${j.name}`, j.data);

  const failed = await seekQueue.getFailed(0, 9);
  console.log(`\nFailed (showing up to 10 most recent):`);
  for (const j of failed) console.log(`  [${j.id}] ${j.name} — ${j.failedReason}`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Inspection failed:', err.message);
    process.exit(1);
  });
