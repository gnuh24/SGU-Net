Ah ok 😎, hiểu ý bạn rồi — bây giờ bạn muốn **Staff (Thu ngân) được phép thao tác tất cả nghiệp vụ bán hàng và quản lý dữ liệu trực tiếp**, còn **Admin (Quản lý) chỉ tập trung vào quản lý hệ thống, tài khoản, quyền hạn**, kiểu “Admin là giám sát, Staff là người vận hành thực tế”.

Mình sẽ sửa lại danh sách chức năng theo hướng này:

---

# **Danh sách chức năng theo Role (Staff vs Admin)**

## **A. Login**

| Chức năng | Staff | Admin |
| --------- | ----- | ----- |
| Login     | ✅     | ✅     |

---

## **B. Chức năng nghiệp vụ**

### **I. Quản lý Supplier**

| Chức năng                                           | Staff | Admin |
| --------------------------------------------------- | ----- | ----- |
| Xem danh sách supplier (phân trang, sort, tìm kiếm) | ✅     | ❌     |
| Thêm Supplier                                       | ✅     | ❌     |
| Sửa Supplier                                        | ✅     | ❌     |
| Xóa Supplier (ngoại trừ mặc định)                   | ✅     | ❌     |

---

### **II. Quản lý Category**

| Chức năng                                           | Staff | Admin |
| --------------------------------------------------- | ----- | ----- |
| Xem danh sách category (phân trang, sort, tìm kiếm) | ✅     | ❌     |
| Thêm Category                                       | ✅     | ❌     |
| Sửa Category                                        | ✅     | ❌     |
| Xóa Category (ngoại trừ mặc định)                   | ✅     | ❌     |

---

### **III. Quản lý thông tin khách hàng**

| Chức năng                                             | Staff | Admin |
| ----------------------------------------------------- | ----- | ----- |
| Xem danh sách khách hàng (phân trang, sort, tìm kiếm) | ✅     | ❌     |
| Xem chi tiết khách hàng + đơn hàng                    | ✅     | ❌     |
| Thêm khách hàng                                       | ✅     | ❌     |
| Sửa thông tin khách hàng                              | ✅     | ❌     |
| Xóa khách hàng                                        | ✅     | ❌     |

---

### **IV. Quản lý sản phẩm**

| Chức năng                                           | Staff | Admin |
| --------------------------------------------------- | ----- | ----- |
| Xem danh sách sản phẩm (phân trang, sort, tìm kiếm) | ✅     | ❌     |
| Xem chi tiết sản phẩm                               | ✅     | ❌     |
| Thêm sản phẩm                                       | ✅     | ❌     |
| Sửa sản phẩm                                        | ✅     | ❌     |
| Xóa sản phẩm                                        | ✅     | ❌     |

---

### **V. Quản lý đơn hàng**

| Chức năng                                           | Staff | Admin |
| --------------------------------------------------- | ----- | ----- |
| Xem danh sách đơn hàng (phân trang, sort, tìm kiếm) | ✅     | ❌     |
| Xem chi tiết đơn hàng                               | ✅     | ❌     |
| In hóa đơn                                          | ✅     | ❌     |

---

### **VI. Quản lý mã giảm giá**

| Chức năng                 | Staff | Admin |
| ------------------------- | ----- | ----- |
| Xem danh sách mã giảm giá | ✅     | ❌     |
| Thêm mã giảm giá          | ✅     | ❌     |
| Cập nhật mã giảm giá      | ✅     | ❌     |
| Xóa mã giảm giá           | ✅     | ❌     |

---

### **VII. Mua hàng & Thanh toán**

| Chức năng                        | Staff | Admin |
| -------------------------------- | ----- | ----- |
| Tìm kiếm sản phẩm & thêm vào giỏ | ✅     | ❌     |
| Tìm sản phẩm bằng QR             | ✅     | ❌     |
| Áp dụng mã giảm giá              | ✅     | ❌     |
| Thanh toán COD / Online          | ✅     | ❌     |

---

### **VIII. Quản lý nhập kho**

| Chức năng                                   | Staff | Admin |
| ------------------------------------------- | ----- | ----- |
| Xem danh sách nhập kho (phân trang, search) | ✅     | ❌     |
| Nhập kho (cập nhật số lượng)                | ✅     | ❌     |

---

### **IX. Thống kê**

| Chức năng                                                    | Staff | Admin |
| ------------------------------------------------------------ | ----- | ----- |
| Thống kê doanh thu (ngày/tháng/quý/năm)                      | ✅     | ❌     |
| Thống kê sản phẩm bán chạy (số lượng, category)              | ✅     | ❌     |
| Thống kê khách hàng mua nhiều nhất (doanh thu, số lượng đơn) | ✅     | ❌     |

---

### **X. Quản lý tài khoản / quyền hạn**

| Chức năng                                       | Staff | Admin |
| ----------------------------------------------- | ----- | ----- |
| Quản lý tài khoản Staff / Admin                 | ❌     | ✅     |
| Phân quyền role, reset mật khẩu, khóa tài khoản | ❌     | ✅     |

---

💡 **Ghi chú:**

* **Staff**: vận hành toàn bộ nghiệp vụ thực tế, từ bán hàng, nhập kho, quản lý sản phẩm, khách hàng, đơn hàng, thanh toán, in hóa đơn, đến thống kê.
* **Admin**: tập trung **quản lý hệ thống, tài khoản nhân viên, phân quyền**, không trực tiếp bán hàng hay thao tác dữ liệu thường nhật.

---

