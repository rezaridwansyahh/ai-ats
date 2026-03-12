import db from "../../config/postgres.js";

class DemoBookingModel {
  async findByDateSlot(booking_date, session_slot) {
    const result = await db.query(
      `SELECT * FROM demo_bookings
       WHERE booking_date = $1 AND session_slot = $2 AND status != 'rejected'`,
      [booking_date, session_slot]
    );
    return result.rows[0] || null;
  }

  async findRecentByEmail(email) {
    const result = await db.query(
      `SELECT id FROM demo_bookings
       WHERE email = $1
         AND created_at > NOW() - INTERVAL '30 days'
         AND status != 'rejected'`,
      [email]
    );
    return result.rows[0] || null;
  }

  async create(name, email, company_size, message, booking_date, session_slot) {
    const result = await db.query(
      `INSERT INTO demo_bookings (name, email, company_size, message, booking_date, session_slot)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, company_size, message, booking_date, session_slot]
    );
    return result.rows[0];
  }

  async getActiveForMonth(year_month) {
    const result = await db.query(
      `SELECT booking_date, session_slot, status FROM demo_bookings
       WHERE to_char(booking_date, 'YYYY-MM') = $1
         AND status IN ('pending', 'approved')`,
      [year_month]
    );
    return result.rows;
  }

  async getAll() {
    const result = await db.query(
      `SELECT * FROM demo_bookings ORDER BY booking_date DESC, session_slot ASC`
    );
    return result.rows;
  }

  async getById(id) {
    const result = await db.query(
      `SELECT * FROM demo_bookings WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async approve(id, conference_link) {
    const result = await db.query(
      `UPDATE demo_bookings
       SET status = 'approved', conference_link = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, conference_link]
    );
    return result.rows[0];
  }

  async reject(id, rejection_reason) {
    const result = await db.query(
      `UPDATE demo_bookings
       SET status = 'rejected', rejection_reason = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, rejection_reason]
    );
    return result.rows[0];
  }
}

export default new DemoBookingModel();
