import seekQueue from "./seek.queue.js";

// Registers the night sweep as a BullMQ repeatable job. Safe to call on
// every app startup — jobId + the same pattern makes seekQueue.add a no-op
// if the repeatable job already exists.
const NIGHT_SCAN_PATTERN = '*/30 21-23,0-4 * * *';

export async function registerSeekSchedulers() {
  // SEEK_SCHEDULER_ENABLED=false turns the automatic sweep off. Not
  // registering isn't enough — the repeatable job lives on in Redis — so
  // actively unregister it (also drops its next pending run). Manual Sync
  // is unaffected.
  if (process.env.SEEK_SCHEDULER_ENABLED === 'false') {
    const removed = await seekQueue.removeRepeatable(
      'seek-night-scan', { pattern: NIGHT_SCAN_PATTERN }, 'seek-night-scan'
    );
    console.log(`⏸️  Seek scheduler DISABLED via SEEK_SCHEDULER_ENABLED=false (night-scan ${removed ? 'unregistered' : 'was not registered'})`);
    return;
  }

  // Night sweep: every ~30min through 21:00-04:59 (both priorities). During
  // 05:00-20:59, syncing only happens on a manual Sync click — no automatic
  // sweep runs during active hours.
  await seekQueue.add('seek-night-scan', {}, {
    repeat: { pattern: NIGHT_SCAN_PATTERN },
    jobId: 'seek-night-scan',
  });

  // Cleans up the day sweep if it was registered by an earlier version of
  // this app — BullMQ repeatable jobs persist in Redis independently of the
  // code, so removing the add() call above doesn't retroactively unregister
  // one that already exists. No-ops harmlessly if it was never registered.
  await seekQueue.removeRepeatable('seek-day-scan', { pattern: '0 5-20 * * *' }, 'seek-day-scan');

  console.log('🕑 Seek scheduler registered (night-scan only — day hours are manual-sync-only)');
}
