import LandingService from "./landing.service.js"

class LandingController {
  async create(req, res) {
    try {
      const data = await LandingService.create(req.body)
      res.status(201).json({ message: "Submitted successfully", data })
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ message: "This slot is already taken" })
      }
      res.status(err.status || 500).json({ message: err.message || "Internal server error" })
    }
  }

  async getAvailability(req, res) {
    try {
      const { month } = req.query
      const data = await LandingService.getAvailability(month)
      res.status(200).json({ message: "Availability fetched successfully", data })
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || "Internal server error" })
    }
  }

  async getAll(req, res) {
    try {
      const data = await LandingService.getAll()
      res.status(200).json({ message: "Records fetched successfully", data })
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || "Internal server error" })
    }
  }

  async approve(req, res) {
    try {
      const { id } = req.params
      const { conference_link } = req.body
      const data = await LandingService.approveBooking(Number(id), conference_link)
      res.status(200).json({ message: "Booking approved successfully", data })
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || "Internal server error" })
    }
  }

  async reject(req, res) {
    try {
      const { id } = req.params
      const { rejection_reason } = req.body
      const data = await LandingService.rejectBooking(Number(id), rejection_reason)
      res.status(200).json({ message: "Booking rejected successfully", data })
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || "Internal server error" })
    }
  }
}

export default new LandingController()
