import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "../constants";
import { ApiResponse } from "../types";

class ApiService {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Only redirect if already logged in (token exists but expired)
          // Don't redirect on login page errors
          const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
          if (token && !error.config?.url?.includes("/auth/")) {
            // Token expired - clear and redirect
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            window.location.href = "/login";
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  // Generic methods
  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(url, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete(url, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || "Có lỗi xảy ra từ server";
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error("Không thể kết nối đến server");
    } else {
      // Something else happened
      return new Error(error.message || "Có lỗi không xác định");
    }
  }

  // Utility methods
  setAuthToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  removeAuthToken() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }
}

export const apiService = new ApiService();
export default apiService;
