import { apiService } from "./apiService";
import { mockUserService } from "./mock/mockUserService";
import {
  User,
  UserFormData,
  PaginatedResponse,
  PaginationParams,
} from "../types";

class UserService {
  private get useMock() {
    return import.meta.env.VITE_USE_MOCK_API === "true";
  }

  // Map backend (camelCase) to frontend (snake_case)
  private mapUserToFrontend(user: any): User {
    return {
      id: user.userId || user.user_id || user.id,
      username: user.username,
      full_name: user.fullName || user.full_name,
      role: user.role,
      status: user.status,
      created_at: user.createdAt || user.created_at,
      updated_at: user.updatedAt || user.updated_at,
    };
  }

  // Map frontend (snake_case) to backend (camelCase)
  private mapUserToBackend(user: UserFormData): any {
    return {
      username: user.username,
      password: user.password,
      fullName: user.full_name,
      role: user.role,
    };
  }

  async getUsers(params: PaginationParams): Promise<PaginatedResponse<User>> {
    if (this.useMock) return mockUserService.getUsers(params);

    const response = await apiService.get("/users", { params });
    // Backend returns ApiResponse wrapper with nested data
    const apiData: any = response.data;

    // Backend returns paginated response: { data: [...], total, page, pageSize, totalPages }
    if (
      apiData &&
      typeof apiData === "object" &&
      apiData.data &&
      Array.isArray(apiData.data)
    ) {
      return {
        data: apiData.data.map((u: any) => this.mapUserToFrontend(u)),
        total: apiData.total,
        page: apiData.page,
        pageSize: apiData.pageSize,
        totalPages:
          apiData.totalPages || Math.ceil(apiData.total / apiData.pageSize),
      };
    }

    // Fallback: Backend returns simple array
    const users = Array.isArray(apiData) ? apiData : [];
    const totalPages = Math.ceil(users.length / (params.pageSize || 10));
    return {
      data: users.map((u: any) => this.mapUserToFrontend(u)),
      total: users.length,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      totalPages,
    };
  }

  async getUserById(id: number): Promise<User> {
    if (this.useMock) return mockUserService.getUserById(Number(id));
    const response = await apiService.get(`/users/${id}`);
    return this.mapUserToFrontend(response.data);
  }

  async createUser(userData: UserFormData): Promise<User> {
    if (this.useMock) return mockUserService.createUser(userData);
    const backendData = this.mapUserToBackend(userData);
    const response = await apiService.post("/users", backendData);
    return this.mapUserToFrontend(response.data);
  }

  async updateUser(id: number, userData: Partial<UserFormData>): Promise<User> {
    if (this.useMock)
      return mockUserService.updateUser(Number(id), userData as any);
    const backendData: any = {};
    if (userData.username) backendData.username = userData.username;
    if (userData.password) backendData.password = userData.password;
    if (userData.full_name) backendData.fullName = userData.full_name;
    if (userData.role) backendData.role = userData.role;
    if (userData.status) backendData.status = userData.status;

    const response = await apiService.put(`/users/${id}`, backendData);
    return this.mapUserToFrontend(response.data);
  }

  async deleteUser(id: number): Promise<void> {
    if (this.useMock) return mockUserService.deleteUser(Number(id));
    await apiService.delete(`/users/${id}`);
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (this.useMock)
      return mockUserService.changePassword(
        Number(id),
        currentPassword,
        newPassword
      );
    await apiService.put(`/users/${id}/password`, {
      currentPassword,
      newPassword,
    });
  }

  async toggleUserStatus(id: number): Promise<User> {
    if (this.useMock) return mockUserService.toggleUserStatus(Number(id));
    const response = await apiService.put<User>(`/users/${id}/toggle-status`);
    return response.data!;
  }
}

export const userService = new UserService();
