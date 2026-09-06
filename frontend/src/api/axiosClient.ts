import axios from "axios";

/**
 * Central Axios instance. `withCredentials: true` sends the httpOnly JWT
 * cookie set by the backend on every request, so no token needs to be
 * held in JS-accessible storage on the client.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Let the AuthContext handle redirecting to /login; avoid a hard
      // reload here so in-flight state elsewhere isn't lost unnecessarily.
    }
    return Promise.reject(error);
  }
);

export default apiClient;
