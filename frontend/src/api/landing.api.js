import api from "./axios.js"

export const create = (data) => api.post("/landing", data)
export const getAvailability = (month) => api.get(`/landing/availability?month=${month}`)
export const getAll = () => api.get("/landing")
export const approve = (id, conference_link) => api.patch(`/landing/${id}/approve`, { conference_link })
export const reject = (id, rejection_reason) => api.patch(`/landing/${id}/reject`, { rejection_reason })
