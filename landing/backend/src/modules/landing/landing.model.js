import getDb from "../../config/postgres.js"

class LandingModel {
  async create(name, email, company_size, average_annual_hiring, message, booking_date, session_slot) {
    const result = await getDb().query(
      `INSERT INTO master_landing (name, email, company_size, average_annual_hiring, message, booking_date, session_slot)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, email, company_size || null, average_annual_hiring || null, message || null, booking_date || null, session_slot || null]
    )
    return result.rows[0]
  }

  async findRecentByEmail(email, booking_date) {
    const result = await getDb().query(
      `SELECT id, to_char(booking_date, 'YYYY-MM-DD') AS booking_date, session_slot, status
       FROM master_landing
       WHERE LOWER(email) = LOWER($1)
         AND status IN ('pending', 'approved')
         AND booking_date IS NOT NULL
         AND ABS(booking_date - $2::date) <= 30`,
      [email, booking_date]
    )
    return result.rows[0] || null
  }

  async getActiveForMonth(year_month) {
    const result = await getDb().query(
      `SELECT to_char(booking_date, 'YYYY-MM-DD') AS booking_date, session_slot, status
       FROM master_landing
       WHERE to_char(booking_date, 'YYYY-MM') = $1
         AND status IN ('pending', 'approved')`,
      [year_month]
    )
    return result.rows
  }

  async getAll() {
    const result = await getDb().query(
      `SELECT *, to_char(booking_date, 'YYYY-MM-DD') AS booking_date
       FROM master_landing ORDER BY created_at DESC`
    )
    return result.rows
  }

  async getById(id) {
    const result = await getDb().query(
      `SELECT *, to_char(booking_date, 'YYYY-MM-DD') AS booking_date
       FROM master_landing WHERE id = $1`,
      [id]
    )
    return result.rows[0] || null
  }

  async approve(id, conference_link) {
    const result = await getDb().query(
      `UPDATE master_landing
       SET status = 'approved', conference_link = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, conference_link]
    )
    return result.rows[0]
  }

  async reject(id, rejection_reason) {
    const result = await getDb().query(
      `UPDATE master_landing
       SET status = 'rejected', rejection_reason = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, rejection_reason]
    )
    return result.rows[0]
  }
}

export default new LandingModel()
