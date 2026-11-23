import getDb from '../../config/postgres.js';
import employeesData from '../data/employees.js';
import modulesData from '../data/modules.js';
import menusData from '../data/menus.js';
import moduleMenuData from '../data/module_menu.js';

const seed = async () => {

  const client = await getDb().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM master_employee');
    await client.query('DELETE FROM mapping_modules_menus');
    await client.query('DELETE FROM master_menus');
    await client.query('DELETE FROM master_modules');

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

    for (const mod of modulesData) {
      await client.query(
        `INSERT INTO master_modules (id, name) VALUES ($1, $2)`,
        [mod.id, mod.name]
      );
    }

    for (const menu of menusData) {
      await client.query(
        `INSERT INTO master_menus (id, name) VALUES ($1, $2)`,
        [menu.id, menu.name]
      );
    }

    // Rows are inserted in array order, so mapping ids follow the sidebar order.
    for (const mm of moduleMenuData) {
      await client.query(
        `INSERT INTO mapping_modules_menus (module_id, menu_id) VALUES ($1, $2)`,
        [mm.module_id, mm.menu_id]
      );
    }

    // Modules and menus are inserted with explicit ids, so move their sequences past them.
    await client.query(`SELECT setval(pg_get_serial_sequence('master_modules', 'id'), (SELECT MAX(id) FROM master_modules))`);
    await client.query(`SELECT setval(pg_get_serial_sequence('master_menus', 'id'), (SELECT MAX(id) FROM master_menus))`);

    await client.query('COMMIT');
    console.log(`Seeded ${employeesData.length} employees, ${modulesData.length} modules, ${menusData.length} menus`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export default seed;