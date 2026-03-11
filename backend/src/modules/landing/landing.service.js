import LandingModel from "./landing.model.js"

const create = async (name, email, company_size, message) => {
  if (!name || !name.trim()) throw { status: 400, message: "Name is required" }
  if (!email || !email.trim()) throw { status: 400, message: "Email is required" }

  const record = await LandingModel.create(name.trim(), email.trim(), company_size, message)
  return record
}

export default { create }
