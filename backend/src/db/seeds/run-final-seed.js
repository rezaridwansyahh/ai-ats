import '../../config/env.js';
import finalSeed from './final-seed.js';
import getDb from '../../config/postgres.js';

finalSeed()
  .then(() => {
    console.log('Final seed run complete. Closing DB connection...');
    return getDb().end();
  })
  .catch(async (err) => {
    console.error('Final seed run failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });
