import {
  User,
  UserFormData,
  PaginatedResponse,
  PaginationParams,
} from "../../types";
import { mockUsers } from "./mockUsers";

class MockUserService {
  async getUsers(params: PaginationParams): Promise<PaginatedResponse<User>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = mockUsers.slice(start, end);
    return { data, total: mockUsers.length, page, pageSize } as any;
  }

  async getUserById(id: number): Promise<User> {
    const u = mockUsers.find((m) => m.id === id);
    if (!u) throw new Error("User not found");
    return u as any;
  }

  async createUser(userData: UserFormData): Promise<User> {
    const newUser: User = {
      id: Math.max(...mockUsers.map((u) => u.id)) + 1,
      username: userData.username,
      full_name: userData.full_name || userData.username,
      role: userData.role || "staff",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any;
    mockUsers.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<UserFormData>): Promise<User> {
    const idx = mockUsers.findIndex((u) => u.id === Number(id));
    if (idx === -1) throw new Error("User not found");
    const updated = {
      ...mockUsers[idx],
      ...userData,
      updated_at: new Date().toISOString(),
    } as any;
    mockUsers[idx] = updated;
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    const idx = mockUsers.findIndex((u) => u.id === Number(id));
    if (idx === -1) throw new Error("User not found");
    mockUsers.splice(idx, 1);
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // In mock we don't store password, so just return
    return;
  }

  async toggleUserStatus(id: number): Promise<User> {
    const idx = mockUsers.findIndex((u) => u.id === Number(id));
    if (idx === -1) throw new Error("User not found");
    mockUsers[idx].status =
      mockUsers[idx].status === "active" ? "inactive" : "active";
    return mockUsers[idx] as any;
  }
}

export const mockUserService = new MockUserService();
