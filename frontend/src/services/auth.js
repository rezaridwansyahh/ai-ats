import { login, register } from "../api/auth.api";
import { setAuthToken } from "../api/axios";

export const loginUser = async (payload) => {
  const { data } = await login(payload);
  setAuthToken(data.token);
  return data;
};

export const registerUser = async (payload) => {
  const { data } = await register(payload);
  return data.user;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("permissions");
  localStorage.removeItem("userData");
  setAuthToken(null);
};

export const getCurrentUser = () => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);

  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};