import { login } from "../api/auth.api"
import { register } from "../api/auth.api"

export const loginUser = async (payload) => {
  return await login(payload);
}

export const registerUser = async (payload) => {
  return await register(payload);
}