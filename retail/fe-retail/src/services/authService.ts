import { apiService } from "./apiService";
import { mockAuthService } from "./mockAuthService";
import { LoginRequest, RegisterRequest, AuthResponse, User } from "../types";
import { STORAGE_KEYS } from "../constants";

export class AuthService {
  private get useMockApi(): boolean {
    return import.meta.env.VITE_USE_MOCK_API === "true";
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (this.useMockApi) {
      return mockAuthService.login(credentials);
    }

    // Backend endpoint is /auth/staff-login
    const response = await apiService.post<any>(
      "/auth/staff-login",
      credentials
    );

    // Backend returns ApiResponse wrapper: { status, message, data: AuthResponse }
    const authData = response.data?.data || response.data;

    if (authData) {
      // Backend returns: { userId, username, fullName, role, token }
      // Map to frontend User format
      const user: User = {
        id: authData.userId,
        username: authData.username,
        full_name: authData.fullName,
        role: authData.role,
      };

      // Store token and user info
      localStorage.setItem(STORAGE_KEYS.TOKEN, authData.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      return {
        user,
        token: authData.token,
      };
    }

    throw new Error("Login failed: No data returned from server");
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    if (this.useMockApi) {
      return mockAuthService.register(userData);
    }

    const response = await apiService.post<AuthResponse>(
      "/auth/register",
      userData
    );

    if (response.data) {
      // Store token and user info
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
      localStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(response.data.user)
      );
    }

    return response.data!;
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
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    if (this.useMockApi) {
      return mockAuthService.refreshToken();
    }

    const response = await apiService.post<AuthResponse>("/auth/refresh");

    if (response.data) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
      localStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(response.data.user)
      );
    }

    return response.data!;
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
