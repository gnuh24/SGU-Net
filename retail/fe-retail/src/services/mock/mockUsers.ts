import { User } from "../../types";

let users: User[] = [
  {
    id: 1,
    username: "admin",
    full_name: "Quản trị viên",
    role: "admin",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    username: "staff",
    full_name: "Nhân viên bán hàng",
    role: "staff",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    username: "tran",
    full_name: "Trần Văn A",
    role: "staff",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockUsers = users;

export const resetMockUsers = () => {
  users = [...mockUsers];
};
