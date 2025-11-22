
* **Staff (Thu ngân)** → làm nghiệp vụ bán hàng và nhập dữ liệu cơ bản
* **Manager (Quản lý cửa hàng)** → toàn quyền nghiệp vụ: Supplier, Category, Product, Customer, Order, Inventory, Discount, Report
* **Admin (Quản trị hệ thống)** → chỉ quản lý tài khoản + setting hệ thống, không đụng dữ liệu nghiệp vụ

---

# **Danh sách chức năng theo Role (Staff – Manager – Admin)**

## **A. Đăng nhập**

| Chức năng | Staff | Manager | Admin |
| --------- | ----- | ------- | ----- |
| Login     | ✅     | ✅       | ✅     |

---

# **B. Chức năng nghiệp vụ**

---

## **I. Quản lý Supplier**

| Chức năng                    | Staff | Manager | Admin |
| ---------------------------- | ----- | ------- | ----- |
| Xem danh sách (search, sort) | ❌     | ✅       | ❌     |
| Thêm Supplier                | ❌     | ✅       | ❌     |
| Sửa Supplier                 | ❌     | ✅       | ❌     |
| Xóa Supplier                 | ❌     | ✅       | ❌     |

---

## **II. Quản lý Category**

| Chức năng     | Staff | Manager | Admin |
| ------------- | ----- | ------- | ----- |
| Xem danh sách | ❌     | ✅       | ❌     |
| Thêm Category | ❌     | ✅       | ❌     |
| Sửa Category  | ❌     | ✅       | ❌     |
| Xóa Category  | ❌     | ✅       | ❌     |

---

## **III. Quản lý Khách hàng**

| Chức năng                | Staff | Manager | Admin |
| ------------------------ | ----- | ------- | ----- |
| Xem danh sách khách hàng | ✅     | ✅       | ❌     |
| Xem chi tiết + đơn hàng  | ✅     | ✅       | ❌     |
| Thêm khách hàng          | ✅     | ✅       | ❌     |
| Sửa khách hàng           | ✅     | ✅       | ❌     |
| Xóa khách hàng           | ❌     | ✅       | ❌     |

---

## **IV. Quản lý Sản phẩm**

| Chức năng              | Staff                                        | Manager | Admin |
| ---------------------- | -------------------------------------------- | ------- | ----- |
| Xem danh sách sản phẩm | ❌ / (hoặc cho phép Staff chỉ xem tên + giá?) | ✅       | ❌     |
| Xem chi tiết sản phẩm  | ❌ / (tuỳ bạn)                                | ✅       | ❌     |
| Thêm sản phẩm          | ❌                                            | ✅       | ❌     |
| Sửa sản phẩm           | ❌                                            | ✅       | ❌     |
| Xóa sản phẩm           | ❌                                            | ✅       | ❌     |

> 💡 *Nếu bạn muốn Staff chỉ bán hàng mà không thấy danh sách sản phẩm — có thể bật chế độ chỉ quét mã vạch (No Product Browser Mode). Bạn chọn kiểu nào thì mình điều chỉnh.*

---

## **V. Quản lý Đơn hàng**

| Chức năng              | Staff                    | Manager        | Admin |
| ---------------------- | ------------------------ | -------------- | ----- |
| Xem danh sách đơn hàng | ❌ (chỉ xem đơn mình tạo) | ✅ (xem tất cả) | ❌     |
| Xem chi tiết           | ✅                        | ✅              | ❌     |
| In hóa đơn             | ✅                        | ✅              | ❌     |

---

## **VI. Quản lý Mã giảm giá**

| Chức năng               | Staff | Manager | Admin                                  |
| ----------------------- | ----- | ------- | -------------------------------------- |
| Xem mã giảm giá áp dụng | ✅     | ✅       | ❌                                      |
| Xem toàn bộ mã giảm giá | ❌     | ✅       | ❌                                      |
| Thêm mã giảm giá        | ❌     | ❌       | ❌ / (tuỳ hệ thống muốn để Manager làm) |
| Cập nhật mã giảm giá    | ❌     | ❌       | ❌                                      |
| Xóa mã giảm giá         | ❌     | ❌       | ❌                                      |

> ❗ Thông thường: **Manager quản lý mã giảm giá**, còn Admin không quản lý nghiệp vụ.
> Nếu bạn muốn Manager toàn quyền → mình sẽ bật lại tất cả quyền Discount.

---

## **VII. Bán hàng & Thanh toán**

| Chức năng              | Staff | Manager | Admin |
| ---------------------- | ----- | ------- | ----- |
| Tìm sản phẩm / quét QR | ✅     | ✅       | ❌     |
| Thêm vào giỏ           | ✅     | ✅       | ❌     |
| Áp mã giảm giá         | ✅     | ✅       | ❌     |
| Thanh toán COD/Online  | ✅     | ✅       | ❌     |

---

## **VIII. Nhập kho**

| Chức năng                | Staff | Manager | Admin |
| ------------------------ | ----- | ------- | ----- |
| Xem danh sách nhập kho   | ❌     | ✅       | ❌     |
| Nhập hàng (update stock) | ❌     | ✅       | ❌     |

---

## **IX. Thống kê**

| Chức năng                 | Staff | Manager | Admin |
| ------------------------- | ----- | ------- | ----- |
| Doanh thu ngày/tháng/quý  | ❌     | ✅       | ❌     |
| Sản phẩm bán chạy         | ❌     | ✅       | ❌     |
| Khách hàng mua nhiều nhất | ❌     | ✅       | ❌     |

---

## **X. Quản lý tài khoản (Admin)**

| Chức năng                     | Staff | Manager | Admin |
| ----------------------------- | ----- | ------- | ----- |
| Xem danh sách nhân viên       | ❌     | ❌       | ✅     |
| Thêm tài khoản                | ❌     | ❌       | ✅     |
| Sửa thông tin, reset mật khẩu | ❌     | ❌       | ✅     |
| Phân quyền role               | ❌     | ❌       | ✅     |
| Khoá / mở tài khoản           | ❌     | ❌       | ✅     |

> Admin ở đây mang tính **IT System Admin**, không tham gia vận hành cửa hàng.

---

## **Tóm lại mô hình phân vai**

### **Staff**

👉 Bán hàng, xử lý đơn, thêm khách, áp mã giảm giá, in hóa đơn.

### **Manager**

👉 Toàn quyền nghiệp vụ bán lẻ: Supplier, Category, Product, Customer, Order, Inventory, Discount, Reports.

### **Admin**

👉 Chỉ quản lý tài khoản hệ thống, role, quyền, setting.

---
