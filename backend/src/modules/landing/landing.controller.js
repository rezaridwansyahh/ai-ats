import LandingService from "./landing.service.js"

const create = async (req, res) => {
  try {
    const { name, email, company_size, message } = req.body
    const data = await LandingService.create(name, email, company_size, message)
    res.status(201).json({ message: "Demo request submitted successfully", data })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" })
  }
}

export default { create }
