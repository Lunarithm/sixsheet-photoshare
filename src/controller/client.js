import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_APIHUB_URL || "http://localhost:3000",
  withCredentials: false,
});

// Attach token to every request after login
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});