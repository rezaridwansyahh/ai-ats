import '../../config/env.js';
import seed from './seed.js';
import db from '../../config/postgres.js';

seed()
  .then(() => {
    console.log("Seed run complete. Closing DB connection...");
    return db.end();
  })
  .catch((err) => {
    console.error("Seed run failed:", err.message);
    db.end();
  });
