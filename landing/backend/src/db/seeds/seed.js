import db from '../../config/postgres.js';
import usersData from '../data/users.js';

const seed = async () => {
  await getDb().query('BEGIN');

  try {
    await getDb().query('DELETE FROM master_users');

    for (const user of usersData) {
      await getDb().query(
        `INSERT INTO master_users (id, password, email, username)
         VALUES ($1, $2, $3, $4)`,
        [user.id, user.password, user.email, user.username]
      );
    }

    await getDb().query('COMMIT');
    console.log('Seed completed successfully');

  } catch (err) {
    await getDb().query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  }
};

export default seed;
