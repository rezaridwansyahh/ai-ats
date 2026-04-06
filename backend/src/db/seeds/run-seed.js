import '../../config/env.js';
import seed from './seed.js';
import getDb from '../../config/postgres.js';

seed()
  .then(() => {
    console.log("Seed run complete. Closing DB connection...");
    return getDb().end();
  })
  .catch((err) => {
    console.error("Seed run failed:", err.message);
    getDb().end();
  });
