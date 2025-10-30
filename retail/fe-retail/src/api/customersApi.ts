import axios from "axios";

const API_BASE_URL = "https://localhost:5620/api/v1/customers";

export const customersApi = {
  // 🟢 Lấy danh sách
  getAll: (params?: any) =>
    axios.get(API_BASE_URL, { params }).then((res) => res.data.data.data),

  // 🟢 Lấy chi tiết
  getById: (id: number) =>
    axios.get(`${API_BASE_URL}/${id}`).then((res) => res.data.data),

  // 🟢 Tạo mới
  create: (data: any) =>
    axios.post(API_BASE_URL, data).then((res) => res.data.data),

  // 🟢 Cập nhật
  update: (id: number, data: any) =>
    axios.put(`${API_BASE_URL}/${id}`, data).then((res) => res.data.data),

  // 🗑️ Xóa
  delete: (id: number) => axios.delete(`${API_BASE_URL}/${id}`),
};
