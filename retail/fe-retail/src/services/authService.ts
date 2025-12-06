import { apiService } from "./apiService";
import { mockAuthService } from "./mockAuthService";
import { LoginRequest, RegisterRequest, AuthResponse, User } from "../types";
import { STORAGE_KEYS } from "../constants";

export class AuthService {
  private get useMockApi(): boolean {
    return import.meta.env.VITE_USE_MOCK_API === "true";
  }

  async login(
    credentials: LoginRequest
  ): Promise<{ user: User; token: string }> {
    if (this.useMockApi) {
      return mockAuthService.login(credentials);
    }

    // Backend endpoint is /auth/staff-login
    const response = await apiService.post<any>(
      "/auth/staff-login",
      credentials
    );

    // Backend returns ApiResponse wrapper: { status, message, data: AuthResponse }
    const authData: AuthResponse = response.data?.data || response.data;

    if (authData) {
      // Backend returns: { userId, username, fullName, role, accessToken, refreshToken }
      // Map to frontend User format
      const user: User = {
        id: authData.userId,
        username: authData.username,
        full_name: authData.fullName,
        role: authData.role as "admin" | "staff",
      };

      // Store access token and refresh token
      localStorage.setItem(STORAGE_KEYS.TOKEN, authData.accessToken);
      localStorage.setItem("refreshToken", authData.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      return {
        user,
        token: authData.accessToken,
      };
    }

    throw new Error("Login failed: No data returned from server");
  }

  async register(
    userData: RegisterRequest
  ): Promise<{ user: User; token: string }> {
    if (this.useMockApi) {
      return mockAuthService.register(userData);
    }

    const response = await apiService.post<any>("/auth/register", userData);

    const authData: AuthResponse = response.data?.data || response.data;

    if (authData) {
      const user: User = {
        id: authData.userId,
        username: authData.username,
        full_name: authData.fullName,
        role: authData.role as "admin" | "staff",
      };

      localStorage.setItem(STORAGE_KEYS.TOKEN, authData.accessToken);
      localStorage.setItem("refreshToken", authData.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      return {
        user,
        token: authData.accessToken,
      };
    }

    throw new Error("Register failed: No data returned from server");
  }

  async logout(): Promise<void> {
    if (this.useMockApi) {
      return mockAuthService.logout();
    }

    try {
      await apiService.post("/auth/logout");
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem("refreshToken");
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    if (this.useMockApi) {
      const mockResult = await mockAuthService.refreshToken();
      return {
        accessToken: mockResult.token,
        refreshToken: mockResult.token,
      };
    }

    const currentRefreshToken = localStorage.getItem("refreshToken");
    if (!currentRefreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await apiService.post<any>("/auth/refresh-token", {
      refreshToken: currentRefreshToken,
    });

    const data = response.data?.data || response.data;

    if (data && data.accessToken && data.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    }

    throw new Error("Refresh token failed: No data returned from server");
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
}

export const authService = new AuthService();
