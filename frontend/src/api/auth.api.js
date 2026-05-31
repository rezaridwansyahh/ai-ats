// Auth endpoints bypass the global axios instance so the response interceptor's
// 401 → handleExpired → window.location reload doesn't wipe the error message
// before LoginCard's catch can render it. A 401 from /auth/login means "wrong
// credentials" or "no role assigned" — that's a regular form error, not a session
// expiry, and the user needs to see the actual reason.
import axios from "axios";

const authApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/portal/api`,
});

// Shape-compatible with the previous axios-instance return so LoginCard can keep
// reading `.data` and the catch branch can keep reading `err.response.data.message`.
export const login    = (data) => authApi.post("/auth/login",    data);
export const register = (data) => authApi.post("/auth/register", data);
