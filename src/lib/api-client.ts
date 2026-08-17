import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

import { refreshSession } from "@/models/auth/auth.services";

import { tokenManager } from "./token-manager";

/**
 * Axios client for HTTP that does *not* go through a server action — Supabase's
 * REST/Storage endpoints called straight from the browser, and third-party
 * services. Domain data still flows through server actions; this exists so the
 * two-token flow has one enforcement point.
 *
 * Request:  attaches the in-memory access token as a bearer.
 * Response: on 401, silently refreshes once via the `refreshSession` action
 *           (which reads the httpOnly refresh cookie) and replays the request.
 *           Concurrent 401s share a single refresh and queue behind it, so a
 *           burst of parallel calls does not trigger a burst of refreshes.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const apiClient = axios.create({
  baseURL: SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : undefined,
  headers: { "Content-Type": "application/json" },
  // The refresh token rides in an httpOnly cookie on same-origin action calls;
  // cross-origin Supabase calls authenticate with the bearer alone.
  withCredentials: false,
  timeout: 20_000,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (SUPABASE_KEY) config.headers.set("apikey", SUPABASE_KEY);
  const token = tokenManager.get();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

/** One in-flight refresh at a time; every caller awaits the same promise. */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await refreshSession();
        if (!response.success || !response.data) {
          tokenManager.clear();
          return null;
        }
        tokenManager.set(response.data.accessToken, response.data.expiresAt);
        return response.data.accessToken;
      } catch {
        tokenManager.clear();
        return null;
      } finally {
        // Cleared on the next tick so callers that arrive during the await
        // still join this refresh rather than starting another.
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      }
    })();
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (error.response?.status !== 401 || !config || config._retried) {
      return Promise.reject(error);
    }

    config._retried = true;
    const token = await refreshAccessToken();
    if (!token) return Promise.reject(error);

    config.headers.set("Authorization", `Bearer ${token}`);
    return apiClient(config);
  },
);

/** Thin typed helpers so call sites never touch `response.data` plumbing. */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, body, config).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((r) => r.data),
};
