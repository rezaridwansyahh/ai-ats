import db from '../db/connection.js';

class Module {
  static async getAll(){
    const result = await db.query(`
      SELECT * 
      FROM master_modules
      `);
    return result.rows;
  }

  static async getById(id){
    const result = await db.query(`
      SELECT * 
      FROM master_modules 
      WHERE id = $1`, 
      [id]);
    return result.rows[0];
  }

  static async getByCompanyId(company_id){
    const result = await db.query(`
      SELECT m.*
      FROM master_modules m
      JOIN mapping_modules_companies mc ON m.id = mc.module_id
      WHERE mc.company_id = $1
      ORDER BY m.name
    `, [company_id]);
    return result.rows;
  }

  static async getByMenuId(menu_id) {
    const result = await db.query(`
      SELECT mn.*
      FROM master_menus mn
      JOIN mapping_modules_menus mm on mn.id = mm.menu_id
      WHERE mm.menu_id = $1  
    `, [menu_id]);

    return result.rows;
  }

  static async create(name){
    const result = await db.query(`
      INSERT INTO master_modules (name) 
      VALUES ($1) 
      RETURNING *`, 
      [name]);
    return result.rows[0];
  }

  static async delete(id){
    const result = await db.query(`
      DELETE FROM master_modules 
      WHERE id = $1 
      RETURNING *`, 
      [id]);
    return result.rows[0];
  }

  static async update(id, {name}){
    const result = await db.query(`
      UPDATE master_modules 
      SET name = $1 
      WHERE id = $2 
      RETURNING *`, 
      [name, id]);
    return result.rows[0];
  }

}

export default Module;