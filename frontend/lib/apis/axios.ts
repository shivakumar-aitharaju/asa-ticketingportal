import { useAuthStore } from "@/lib/store/auth-store";
import type { ApiError } from "@/lib/types";
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

const FALLBACK_API_URL = "http://localhost:8090/api";

function getApiUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_API_URL;
  }
  return process.env.API_URL ?? FALLBACK_API_URL;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: FALLBACK_API_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiUrl();
    if (typeof window !== "undefined") {
      const { token } = useAuthStore.getState();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthRequest = originalRequest?.url?.includes("/auth/");

    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      !originalRequest?._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;
      const { refreshToken, updateTokens, clearAuth, setSessionExpired, isAuthenticated } =
        useAuthStore.getState();

      if (refreshToken && isAuthenticated) {
        try {
          const apiUrl = getApiUrl();
          const response = await axios.post(`${apiUrl}/auth/refresh`, { refreshToken });
          const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
          updateTokens(newToken, newRefreshToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        } catch {
          clearAuth();
          setSessionExpired(true);
          return Promise.reject(error);
        }
      } else if (isAuthenticated) {
        clearAuth();
        setSessionExpired(true);
      }
    }

    if (error.response) {
      const status = error.response.status;
      if ((status === 502 || status === 503 || status === 504) && typeof window !== "undefined") {
        toast.error("Server Unavailable", {
          description: "The server is currently unreachable. Please try again later.",
        });
      }

      const apiError = error.response.data;
      if (apiError?.error) {
        const err = new Error(apiError.error.message) as Error & {
          response?: { status: number; data: ApiError };
        };
        err.response = { status: error.response.status, data: apiError };
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
