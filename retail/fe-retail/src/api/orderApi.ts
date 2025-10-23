// src/api/ordersApi.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:5260/api/v1/orders";

export const ordersApi = {
  // 🟢 Lấy danh sách đơn hàng theo CustomerId
  getByCustomerId: (customerId: number) =>
    axios
      .get(API_BASE_URL, { params: { CustomerId: customerId } })
      .then((res) => res.data.data.data || []),
};
