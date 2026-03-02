import db from '../db/connection.js';

class Menu {
  static async getAll(){
    const result = await db.query(`
      SELECT * 
      FROM master_menus`
    );
    return result.rows;
  }

  static async getById(id){
    const result = await db.query(`
      SELECT * 
      FROM master_menus 
      WHERE id = $1`, 
      [id]);
    return result.rows[0];
  }

static async getbyModuleId(module_id){
    const result = await db.query(`
    SELECT mm.*
    FROM mapping_modules_menus mm
    JOIN master_modules m ON mm.module_id = m.id
    WHERE m.id = $1
    `, [module_id]);
    return result.rows; 
}

  static async create(name){
    const result = await db.query(`
      INSERT INTO master_menus (name) 
      VALUES ($1) 
      RETURNING *
      `, [name]);
    return result.rows[0];
  }

  static async update(id, name){
    const result = await db.query(`
      UPDATE master_menus 
      SET name = $1 
      WHERE id = $2 
      RETURNING *`, 
      [name, id]);
    return result.rows[0];
  }

  static async delete(id){
    const result = await db.query(`
      DELETE FROM master_menus 
      WHERE id = $1 
      RETURNING *`, 
      [id]);
    return result.rows[0];
  }
}

export default Menu;
