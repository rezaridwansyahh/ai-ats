import getDb from "../../config/postgres.js"

class Module {
  static async getAll(){
    const result = await getDb().query(`
      SELECT * 
      FROM master_modules
      `);
    return result.rows;
  }

  static async getById(id){
    const result = await getDb().query(`
      SELECT * 
      FROM master_modules 
      WHERE id = $1`, 
      [id]);
    return result.rows[0];
  }

  static async getByMenuId(menu_id) {
    const result = await getDb().query(`
      SELECT mn.*
      FROM master_menus mn
      JOIN mapping_modules_menus mm on mn.id = mm.menu_id
      WHERE mm.menu_id = $1  
    `, [menu_id]);

    return result.rows;
  }

  static async getNavigation() {
    const result = await getDb().query(`
      SELECT
        mo.id,
        mo.name,
        COALESCE(
          json_agg(json_build_object('id', me.id, 'name', me.name) ORDER BY mm.id)
            FILTER (WHERE me.id IS NOT NULL),
          '[]'::json
        ) AS menus
      FROM master_modules mo
      LEFT JOIN mapping_modules_menus mm ON mm.module_id = mo.id
      LEFT JOIN master_menus me ON me.id = mm.menu_id
      GROUP BY mo.id
      ORDER BY mo.id
    `);
    return result.rows;
  }

  static async create(name){
    const result = await getDb().query(`
      INSERT INTO master_modules (name) 
      VALUES ($1) 
      RETURNING *`, 
      [name]);
    return result.rows[0];
  }

  static async delete(id){
    const result = await getDb().query(`
      DELETE FROM master_modules 
      WHERE id = $1 
      RETURNING *`, 
      [id]);
    return result.rows[0];
  }

  static async update(id, {name}){
    const result = await getDb().query(`
      UPDATE master_modules 
      SET name = $1 
      WHERE id = $2 
      RETURNING *`, 
      [name, id]);
    return result.rows[0];
  }

}

export default Module;