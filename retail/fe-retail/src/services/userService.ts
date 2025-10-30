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

  async getUsers(params: PaginationParams): Promise<PaginatedResponse<User>> {
    if (this.useMock) return mockUserService.getUsers(params);
    const response = await apiService.get<PaginatedResponse<User>>("/users", {
      params,
    });
    return response.data!;
  }

  async getUserById(id: number): Promise<User> {
    if (this.useMock) return mockUserService.getUserById(Number(id));
    const response = await apiService.get<User>(`/users/${id}`);
    return response.data!;
  }

  async createUser(userData: UserFormData): Promise<User> {
    if (this.useMock) return mockUserService.createUser(userData);
    const response = await apiService.post<User>("/users", userData);
    return response.data!;
  }

  async updateUser(id: number, userData: Partial<UserFormData>): Promise<User> {
    if (this.useMock)
      return mockUserService.updateUser(Number(id), userData as any);
    const response = await apiService.put<User>(`/users/${id}`, userData);
    return response.data!;
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
