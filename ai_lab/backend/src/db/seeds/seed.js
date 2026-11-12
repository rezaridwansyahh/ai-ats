import getDb from '../../config/postgres.js';
import employeesData from '../data/employees.js';

const seed = async () => {

  const client = await getDb().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM master_employee');

    for (const emp of employeesData) {
      await client.query(
        `INSERT INTO master_employee (
           id, nik, nama, jk, tgl_lahir, pendidikan, divisi, jabatan, level, atasan,
           lokasi, status, tgl_masuk, akhir_kontrak, aktif, tgl_keluar, alasan, email
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          emp.id, emp.nik, emp.nama, emp.jk, emp.tgl_lahir, emp.pendidikan, emp.divisi, emp.jabatan, emp.level, emp.atasan,
          emp.lokasi, emp.status, emp.tgl_masuk, emp.akhir_kontrak, emp.aktif, emp.tgl_keluar, emp.alasan, emp.email,
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${employeesData.length} employees`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export default seed;