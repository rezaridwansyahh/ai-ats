import LandingModel from "./landing.model.js"
import EmailNotifyModel from "../email-notify/email-notify.model.js"
import { sendMail } from "../../shared/services/mailer.js"

const VALID_SLOTS = ["10-12", "1-3", "4-6"]
const SESSION_LABELS = { "10-12": "10 AM – 12 PM", "1-3": "1 PM – 3 PM", "4-6": "4 PM – 6 PM" }

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

    // Send email notification (fire-and-forget, don't block the response)
    this._sendBookingNotification(record).catch((err) => {
      console.error("Failed to send booking notification email:", err.message)
    })

    return record
  }

  async _sendBookingNotification(booking) {
    const activeEmails = await EmailNotifyModel.getActive()
    const recipients = [process.env.SMTP_EMAIL, ...activeEmails].filter(Boolean)
    if (recipients.length === 0) return

    let dateLabel = "Not specified"
    if (booking.booking_date) {
      const d = booking.booking_date instanceof Date ? booking.booking_date : new Date(booking.booking_date + "T12:00:00")
      dateLabel = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    }
    const sessionLabel = SESSION_LABELS[booking.session_slot] || booking.session_slot || "Not specified"

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A6E5C; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #fff; margin: 0;">New Demo Booking Request</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${booking.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;"><a href="mailto:${booking.email}">${booking.email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Company Size</td><td style="padding: 8px 0;">${booking.company_size || "–"}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Annual Hiring</td><td style="padding: 8px 0;">${booking.average_annual_hiring || "–"}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Date</td><td style="padding: 8px 0; font-weight: 600;">${dateLabel}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Session</td><td style="padding: 8px 0; font-weight: 600;">${sessionLabel}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Message</td><td style="padding: 8px 0;">${booking.message || "–"}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated notification from Myralix ATS.</p>
        </div>
      </div>
    `

    await sendMail(recipients, `New Demo Booking: ${booking.name}`, html)
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
        availability[dateStr][row.session_slot] = "booked"
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
