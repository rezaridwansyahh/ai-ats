import api from "./axios.js"

export const getAll = () => api.get("/email-notify")
export const create = (email, label) => api.post("/email-notify", { email, label })
export const update = (id, fields) => api.patch(`/email-notify/${id}`, fields)
export const remove = (id) => api.delete(`/email-notify/${id}`)
