import axios from "axios";
import { supabase } from "../lib/supabase";

const apiClient = axios.create({
  // baseURL: "http://localhost:8000",
  baseURL: "https://aether-372668020909.northamerica-northeast2.run.app",
});

apiClient.interceptors.request.use(
  async (config) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
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

export default apiClient;
