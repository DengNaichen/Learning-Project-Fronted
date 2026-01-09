import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { supabase } from "../lib/supabase";

type AuthRequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean;
  _retry?: boolean;
};

const normalizeUrl = (url?: string) => (url ?? "").split("?")[0];

const getRequestPath = (config: AxiosRequestConfig) => {
  const rawUrl = normalizeUrl(config.url);
  if (!rawUrl) return "";
  try {
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return new URL(rawUrl).pathname;
    }
    const base = config.baseURL ?? window.location.origin;
    return new URL(rawUrl, base).pathname;
  } catch {
    return rawUrl;
  }
};

const publicGetEndpoints = [
  /^\/(?:api\/v1\/)?graphs\/templates\/?$/,
  /^\/(?:api\/v1\/)?graphs\/[^/]+\/?$/,
  /^\/(?:api\/v1\/)?graphs\/[^/]+\/visualization\/?$/,
  /^\/(?:api\/v1\/)?graphs\/[^/]+\/content\/?$/,
];

const isPublicGetRequest = (config: AxiosRequestConfig) => {
  const method = (config.method ?? "get").toLowerCase();
  if (method !== "get") return false;
  const path = getRequestPath(config);
  return publicGetEndpoints.some((pattern) => pattern.test(path));
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(
  async (config) => {
    const typedConfig = config as AuthRequestConfig;
    if (typedConfig.skipAuth) {
      return config;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as AuthRequestConfig | undefined;
    if (error.response?.status === 401 && config && isPublicGetRequest(config)) {
      if (!config._retry) {
        const retryConfig: AuthRequestConfig = {
          ...config,
          _retry: true,
          skipAuth: true,
          headers: { ...(config.headers ?? {}) },
        };
        if (retryConfig.headers && "Authorization" in retryConfig.headers) {
          delete (retryConfig.headers as Record<string, string>).Authorization;
        }
        return api.request(retryConfig);
      }
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      console.warn("Authentication failed (401), signing out");
      await supabase.auth.signOut();

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/?login=true";
      }
    }
    return Promise.reject(error);
  }
);

export type ErrorType<Error> = AxiosError<Error>;

export const apiClient = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = api
    .request<T>({
      ...config,
      ...options,
      cancelToken: source.token,
    })
    .then(({ data }) => data);

  // @ts-expect-error - orval expects a cancel method on the promise.
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

export default api;
