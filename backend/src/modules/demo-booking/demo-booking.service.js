import DemoBookingModel from "./demo-booking.model.js";

const VALID_SLOTS = ["10-12", "1-3", "4-6"];

class DemoBookingService {
  async createBooking({ name, email, company_size, message, booking_date, session_slot }) {
    if (!name || !email || !booking_date || !session_slot) {
      throw { status: 400, message: "name, email, booking_date, and session_slot are required" };
    }

    if (!VALID_SLOTS.includes(session_slot)) {
      throw { status: 400, message: "Invalid session_slot. Must be one of: 10-12, 1-3, 4-6" };
    }

    const date = new Date(booking_date + "T12:00:00");
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw { status: 400, message: "Bookings are not available on weekends" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDay = new Date(booking_date + "T00:00:00");
    if (bookingDay < today) {
      throw { status: 400, message: "Booking date cannot be in the past" };
    }

    const booking = await DemoBookingModel.create(name, email, company_size, message, booking_date, session_slot);
    return booking;
  }

  async getAvailability(month) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw { status: 400, message: "month must be in YYYY-MM format" };
    }

    const [year, monthNum] = month.split("-").map(Number);
    const activeRows = await DemoBookingModel.getActiveForMonth(month);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const availability = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      availability[dateStr] = { "10-12": "available", "1-3": "available", "4-6": "available" };
    }

    for (const row of activeRows) {
      const dateStr = row.booking_date instanceof Date
        ? row.booking_date.toISOString().split("T")[0]
        : String(row.booking_date).split("T")[0];
      if (availability[dateStr]) {
        availability[dateStr][row.session_slot] = row.status === "approved" ? "booked" : "pending";
      }
    }

    return availability;
  }

  async getAll() {
    return DemoBookingModel.getAll();
  }

  async approveBooking(id, conference_link) {
    const booking = await DemoBookingModel.getById(id);
    if (!booking) throw { status: 404, message: "Booking not found" };
    if (booking.status !== "pending") throw { status: 400, message: "Only pending bookings can be approved" };

    const updated = await DemoBookingModel.approve(id, conference_link || null);
    return updated;
  }

  async rejectBooking(id, rejection_reason) {
    const booking = await DemoBookingModel.getById(id);
    if (!booking) throw { status: 404, message: "Booking not found" };
    if (booking.status !== "pending") throw { status: 400, message: "Only pending bookings can be rejected" };

    const updated = await DemoBookingModel.reject(id, rejection_reason || null);
    return updated;
  }
}

export default new DemoBookingService();
