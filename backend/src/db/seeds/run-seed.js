import '../../config/env.js';
import seed from './seed.js';
import getDb from '../../config/postgres.js';

seed()
  .then(() => {
    console.log("Seed run complete. Closing DB connection...");
    return getDb().end();
  })
  .catch(async (err) => {
    console.error("Seed run failed:", err.message);
    await getDb().end().catch(() => {});
    // Surface as a non-zero exit so run-script.js doesn't report "success" on a broken seed.
    process.exit(1);
  });
