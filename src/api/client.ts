import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://aether-web-372668020909.northamerica-northeast2.run.app",
});

// 请求拦截器:自动添加token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
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
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Authentication failed (401), clearing token");
      localStorage.removeItem("accessToken");

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/?login=true";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
