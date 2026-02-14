import api from "./axios"

export const login = (data) => api.post("/login", data);
export const register = (data) => api.post("/register", data);