import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// ==========================================
// REQUEST INTERCEPTOR
// JWT TOKEN AUTOMATICALLY ATTACH KAREGA
// ==========================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// RESPONSE INTERCEPTOR
// 401 = TOKEN INVALID / EXPIRED
// ==========================================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Invalid/expired token remove karo
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Login page par redirect
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;