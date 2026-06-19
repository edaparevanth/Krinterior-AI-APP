import axios, { AxiosInstance } from "axios";

import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
if (!BASE) {
  console.warn("EXPO_PUBLIC_BACKEND_URL is not set");
}

export const TOKEN_KEY = "krinterior_token";

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 180000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function setAuthToken(token: string) {
  await storage.secureSet(TOKEN_KEY, token);
}

export async function clearAuthToken() {
  await storage.secureRemove(TOKEN_KEY);
}

export async function getAuthToken() {
  return storage.secureGet<string>(TOKEN_KEY, "");
}
