// src/api/ordersApi.ts
import axios from "axios";
import { API_BASE_URL } from "../constants";

const ORDERS_API_URL = `${API_BASE_URL}/orders`;

export const ordersApi = {
  // 🟢 Lấy danh sách đơn hàng theo CustomerId
  getByCustomerId: (customerId: number) =>
    axios
      .get(ORDERS_API_URL, { params: { CustomerId: customerId } })
      .then((res) => res.data.data.data || []),
};
