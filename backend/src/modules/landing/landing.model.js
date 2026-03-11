import db from "../../config/postgres.js"

class LandingModel {
  async create(name, email, company_size, message) {
    const result = await db.query(
      `INSERT INTO master_landing (name, email, company_size, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, company_size || null, message || null]
    )
    return result.rows[0]
  }
}

export default new LandingModel()
