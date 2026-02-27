import axios, { InternalAxiosRequestConfig } from 'axios';
import { getAuth } from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Request interceptor to add Firebase ID token
 */
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        const token = await user.getIdToken();
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting Firebase token:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * We remove the old JWT refresh logic and hard reloads.
 * If we get a 401, it means the Firebase token is invalid or the session expired.
 * We'll let the AuthContext handle redirection if needed.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Just log and reject. No window.location.href = '/login' here to avoid loops.
    if (error.response?.status === 401) {
      console.warn('Unauthorized request. Possible session expiration.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
