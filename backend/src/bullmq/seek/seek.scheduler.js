import seekQueue from "./seek.queue.js";

// Registers the night sweep as a BullMQ repeatable job. Safe to call on
// every app startup — jobId + the same pattern makes seekQueue.add a no-op
// if the repeatable job already exists.
export async function registerSeekSchedulers() {
  // Night sweep: every ~30min through 21:00-04:59 (both priorities). During
  // 05:00-20:59, syncing only happens on a manual Sync click — no automatic
  // sweep runs during active hours.
  await seekQueue.add('seek-night-scan', {}, {
    repeat: { pattern: '*/30 21-23,0-4 * * *' },
    jobId: 'seek-night-scan',
  });

  // Cleans up the day sweep if it was registered by an earlier version of
  // this app — BullMQ repeatable jobs persist in Redis independently of the
  // code, so removing the add() call above doesn't retroactively unregister
  // one that already exists. No-ops harmlessly if it was never registered.
  await seekQueue.removeRepeatable('seek-day-scan', { pattern: '0 5-20 * * *' }, 'seek-day-scan');

  console.log('🕑 Seek scheduler registered (night-scan only — day hours are manual-sync-only)');
}
