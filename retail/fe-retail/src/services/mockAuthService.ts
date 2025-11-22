import { LoginRequest, RegisterRequest, AuthResponse, User } from "../types";
import { STORAGE_KEYS } from "../constants";

// Mock users data
let mockUsers: User[] = [
  {
    id: 1,
    username: "admin",
    full_name: "Quản trị viên",
    role: "admin",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    username: "staff",
    full_name: "Nhân viên bán hàng",
    role: "staff",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

export class MockAuthService {
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user = mockUsers.find(
      (u) =>
        u.username === credentials.username &&
        credentials.password === "password" // Mock password
    );

    if (!user) {
      throw new Error("Tên đăng nhập hoặc mật khẩu không đúng!");
    }

    const token = `mock-jwt-token-${user.id}-${Date.now()}`;

    // Store token and user info
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return {
      token,
      user,
    };
  }

  async register(userData: RegisterRequest): Promise<{ user: User; token: string }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if username already exists
    const existingUser = mockUsers.find(
      (u) => u.username === userData.username
    );
    if (existingUser) {
      throw new Error("Tên đăng nhập đã tồn tại!");
    }

    // Create new user
    const newUser: User = {
      id: Math.max(...mockUsers.map((u) => u.id)) + 1,
      username: userData.username,
      full_name: userData.full_name,
      role: "staff", // Luôn là staff
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to mock users array
    mockUsers.push(newUser);

    const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;

    // Store token and user info
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));

    return {
      token,
      user: newUser,
    };
  }

  async logout(): Promise<void> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Clear local storage
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  async refreshToken(): Promise<{ user: User; token: string }> {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) {
      throw new Error("No user found");
    }

    const user = JSON.parse(userStr);
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;

    localStorage.setItem(STORAGE_KEYS.TOKEN, token);

    return {
      token,
      user,
    };
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

export const mockAuthService = new MockAuthService();
