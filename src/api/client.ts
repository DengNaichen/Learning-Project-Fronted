import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://aether-web-372668020909.northamerica-northeast2.run.app",
});

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

export default apiClient;
