import api from "./axios.js"

export const create = (data) => api.post("/landing", data)
