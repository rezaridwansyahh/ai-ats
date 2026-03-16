import LandingModel from "./landing.model.js"

const VALID_SLOTS = ["10-12", "1-3", "4-6"]

class LandingService {
  async create({ name, email, company_size, average_annual_hiring, message, booking_date, session_slot }) {
    if (!name || !name.trim()) throw { status: 400, message: "Name is required" }
    if (!email || !email.trim()) throw { status: 400, message: "Email is required" }

    if (booking_date && session_slot) {
      if (!VALID_SLOTS.includes(session_slot)) {
        throw { status: 400, message: "Invalid session_slot. Must be one of: 10-12, 1-3, 4-6" }
      }

      const date = new Date(booking_date + "T12:00:00")
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw { status: 400, message: "Bookings are not available on weekends" }
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const bookingDay = new Date(booking_date + "T00:00:00")
      if (bookingDay < today) {
        throw { status: 400, message: "Booking date cannot be in the past" }
      }

      const existing = await LandingModel.findRecentByEmail(email.trim(), booking_date)
      if (existing) {
        throw {
          status: 409,
          message: `You already have a ${existing.status} booking on ${existing.booking_date} (${existing.session_slot}). Only one booking per 30-day period is allowed.`
        }
      }
    }

    const record = await LandingModel.create(
      name.trim(), email.trim(), company_size, average_annual_hiring, message,
      booking_date || null, session_slot || null
    )
    return record
  }

  async getAvailability(month) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw { status: 400, message: "month must be in YYYY-MM format" }
    }

    const [year, monthNum] = month.split("-").map(Number)
    const activeRows = await LandingModel.getActiveForMonth(month)
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    const availability = {}

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const dayOfWeek = new Date(dateStr + "T12:00:00").getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue
      availability[dateStr] = { "10-12": "available", "1-3": "available", "4-6": "available" }
    }

    for (const row of activeRows) {
      let dateStr
      if (row.booking_date instanceof Date) {
        const y = row.booking_date.getFullYear()
        const m = String(row.booking_date.getMonth() + 1).padStart(2, "0")
        const d = String(row.booking_date.getDate()).padStart(2, "0")
        dateStr = `${y}-${m}-${d}`
      } else {
        dateStr = String(row.booking_date).split("T")[0]
      }
      if (availability[dateStr]) {
        availability[dateStr][row.session_slot] = row.status === "approved" ? "booked" : "pending"
      }
    }

    return availability
  }

  async getAll() {
    return LandingModel.getAll()
  }

  async approveBooking(id, conference_link) {
    const booking = await LandingModel.getById(id)
    if (!booking) throw { status: 404, message: "Booking not found" }
    if (booking.status !== "pending") throw { status: 400, message: "Only pending bookings can be approved" }

    return LandingModel.approve(id, conference_link || null)
    // TODO: send email notification to active emails from master_email_notify
  }

  async rejectBooking(id, rejection_reason) {
    const booking = await LandingModel.getById(id)
    if (!booking) throw { status: 404, message: "Booking not found" }
    if (booking.status !== "pending") throw { status: 400, message: "Only pending bookings can be rejected" }

    return LandingModel.reject(id, rejection_reason || null)
    // TODO: send email notification to active emails from master_email_notify
  }
}

export default new LandingService()
