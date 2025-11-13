Okie 😎 Mình tổng hợp lại danh sách chức năng đã phân quyền, bao gồm **Staff (Thu ngân)** và **Admin (Quản lý)**, luôn cả in hóa đơn.

---

# **Danh sách chức năng theo Role**

## **A. Login**

| Chức năng | Staff | Admin |
| --------- | ----- | ----- |
| Login     | ✅     | ✅     |

---

## **B. Chức năng nghiệp vụ**

### **I. Quản lý Supplier**

| Chức năng                                           | Staff | Admin |
| --------------------------------------------------- | ----- | ----- |
| Xem danh sách supplier (phân trang, sort, tìm kiếm) | ❌     | ✅     |
| Thêm Supplier                                       | ❌     | ✅     |
| Sửa Supplier                                        | ❌     | ✅     |
| Xóa Supplier (ngoại trừ mặc định)                   | ❌     | ✅     |

---

### **II. Quản lý Category**

| Chức năng                                           | Staff | Admin |
| --------------------------------------------------- | ----- | ----- |
| Xem danh sách category (phân trang, sort, tìm kiếm) | ❌     | ✅     |
| Thêm Category                                       | ❌     | ✅     |
| Sửa Category                                        | ❌     | ✅     |
| Xóa Category (ngoại trừ mặc định)                   | ❌     | ✅     |

---

### **III. Quản lý thông tin khách hàng**

| Chức năng                                             | Staff | Admin |
| ----------------------------------------------------- | ----- | ----- |
| Xem danh sách khách hàng (phân trang, sort, tìm kiếm) | ✅     | ✅     |
| Xem chi tiết khách hàng + đơn hàng                    | ✅     | ✅     |
| Thêm khách hàng                                       | ✅     | ✅     |
| Sửa thông tin khách hàng                              | ✅     | ✅     |
| Xóa khách hàng                                        | ❌     | ✅     |

---

### **IV. Quản lý sản phẩm**

| Chức năng                                           | Staff | Admin |
| --------------------------------------------------- | ----- | ----- |
| Xem danh sách sản phẩm (phân trang, sort, tìm kiếm) | ✅     | ✅     |
| Xem chi tiết sản phẩm                               | ✅     | ✅     |
| Thêm sản phẩm                                       | ❌     | ✅     |
| Sửa sản phẩm                                        | ❌     | ✅     |
| Xóa sản phẩm                                        | ❌     | ✅     |

---

### **V. Quản lý đơn hàng**

| Chức năng                                           | Staff                 | Admin       |
| --------------------------------------------------- | --------------------- | ----------- |
| Xem danh sách đơn hàng (phân trang, sort, tìm kiếm) | ✅ (chỉ đơn liên quan) | ✅ (toàn bộ) |
| Xem chi tiết đơn hàng                               | ✅                     | ✅           |
| In hóa đơn                                          | ✅                     | ✅           |

---

### **VI. Quản lý mã giảm giá**

| Chức năng                 | Staff | Admin |
| ------------------------- | ----- | ----- |
| Xem danh sách mã giảm giá | ❌     | ✅     |
| Thêm mã giảm giá          | ❌     | ✅     |
| Cập nhật mã giảm giá      | ❌     | ✅     |
| Xóa mã giảm giá           | ❌     | ✅     |

---

### **VII. Mua hàng & Thanh toán**

| Chức năng                        | Staff | Admin                   |
| -------------------------------- | ----- | ----------------------- |
| Tìm kiếm sản phẩm & thêm vào giỏ | ✅     | ✅ (thường dùng để test) |
| Tìm sản phẩm bằng QR             | ✅     | ✅                       |
| Áp dụng mã giảm giá              | ✅     | ✅                       |
| Thanh toán COD / Online          | ✅     | ✅                       |

---

### **VIII. Quản lý nhập kho**

| Chức năng                                   | Staff | Admin |
| ------------------------------------------- | ----- | ----- |
| Xem danh sách nhập kho (phân trang, search) | ❌     | ✅     |
| Nhập kho (cập nhật số lượng)                | ❌     | ✅     |

---

### **IX. Thống kê**

| Chức năng                                                    | Staff | Admin |
| ------------------------------------------------------------ | ----- | ----- |
| Thống kê doanh thu (ngày/tháng/quý/năm)                      | ❌     | ✅     |
| Thống kê sản phẩm bán chạy (số lượng, category)              | ❌     | ✅     |
| Thống kê khách hàng mua nhiều nhất (doanh thu, số lượng đơn) | ❌     | ✅     |

---

💡 **Ghi chú:**

* Staff tập trung vào **bán hàng, thanh toán, xem và cập nhật thông tin khách hàng cơ bản**.
* Admin toàn quyền quản lý hệ thống: **supplier, category, sản phẩm, kho, đơn hàng, mã giảm giá, thống kê**.
* In hóa đơn: cả Staff và Admin đều có quyền, Staff in cho đơn mình bán, Admin có thể in lại để kiểm tra.

---

Nếu bạn muốn, mình có thể vẽ luôn **sơ đồ UI/Menu phân quyền** theo 2 role này để nhìn trực quan, tiện dùng cho thiết kế frontend hoặc phân quyền API.
Bạn có muốn mình làm luôn không?
