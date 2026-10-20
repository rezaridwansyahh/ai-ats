import seekQueue from "./seek.queue.js";

// Registers both scheduler sweeps as BullMQ repeatable jobs. Safe to call on
// every app startup — jobId + the same pattern makes seekQueue.add a no-op
// if the repeatable job already exists.
export async function registerSeekSchedulers() {
  // Night sweep: every ~30min through 21:00-04:59 (both priorities).
  await seekQueue.add('seek-night-scan', {}, {
    repeat: { pattern: '*/30 21-23,0-4 * * *' },
    jobId: 'seek-night-scan',
  });

  // Day sweep: hourly through 05:00-20:59 (linked/high-priority only).
  await seekQueue.add('seek-day-scan', {}, {
    repeat: { pattern: '0 5-20 * * *' },
    jobId: 'seek-day-scan',
  });

  console.log('🕑 Seek schedulers registered (night-scan, day-scan)');
}
