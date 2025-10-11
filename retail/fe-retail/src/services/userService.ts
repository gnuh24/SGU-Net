import { apiService } from "./apiService";
import {
  User,
  UserFormData,
  PaginatedResponse,
  PaginationParams,
} from "../types";

export class UserService {
  async getUsers(params: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await apiService.get<PaginatedResponse<User>>("/users", {
      params,
    });
    return response.data!;
  }

  async getUserById(id: number): Promise<User> {
    const response = await apiService.get<User>(`/users/${id}`);
    return response.data!;
  }

  async createUser(userData: UserFormData): Promise<User> {
    const response = await apiService.post<User>("/users", userData);
    return response.data!;
  }

  async updateUser(id: number, userData: Partial<UserFormData>): Promise<User> {
    const response = await apiService.put<User>(`/users/${id}`, userData);
    return response.data!;
  }

  async deleteUser(id: number): Promise<void> {
    await apiService.delete(`/users/${id}`);
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiService.put(`/users/${id}/password`, {
      currentPassword,
      newPassword,
    });
  }

  async toggleUserStatus(id: number): Promise<User> {
    const response = await apiService.put<User>(`/users/${id}/toggle-status`);
    return response.data!;
  }
}

export const userService = new UserService();
