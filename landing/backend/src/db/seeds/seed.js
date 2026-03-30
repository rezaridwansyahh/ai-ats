import db from '../../config/postgres.js';
import usersData from '../data/users.js';

const seed = async () => {
  await db.query('BEGIN');

  try {
    await db.query('DELETE FROM master_users');

    for (const user of usersData) {
      await db.query(
        `INSERT INTO master_users (id, password, email, username)
         VALUES ($1, $2, $3, $4)`,
        [user.id, user.password, user.email, user.username]
      );
    }

    await db.query('COMMIT');
    console.log('Seed completed successfully');

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  }
};

export default seed;
