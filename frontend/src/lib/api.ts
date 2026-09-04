import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

const TOKEN_KEY = "sms_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/** Construye la URL absoluta para una imagen servida por el backend (ej. /uploads/products/x.jpg) */
export function resolveImageUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}
