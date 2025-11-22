# 🏬 SGU-Net

## 🔐 A. Staff Login
- Đăng nhập dành cho **Staff (nhân viên)**

---

## ⚙️ B. Chức năng

### I. Quản lý **Supplier**
1. Xem danh sách Supplier  
   - Có phân trang, sắp xếp (sort), và tìm kiếm  
2. Thêm Supplier  
3. Sửa Supplier  
4. Xóa Supplier *(ngoại trừ Supplier mặc định)*

---

### II. Quản lý **Category**
1. Xem danh sách Category  
   - Có phân trang, sắp xếp, và tìm kiếm  
2. Thêm Category  
3. Sửa Category  
4. Xóa Category *(ngoại trừ Category mặc định)*

---

### III. Quản lý **Khách hàng**
1. Xem danh sách khách hàng  
   - Có phân trang, sắp xếp, tìm kiếm  
2. Xem chi tiết khách hàng  
   - Thông tin chi tiết  
   - Danh sách các đơn hàng đã từng mua  
     - Có thể xem chi tiết từng đơn hàng  
3. Thêm khách hàng mới  
4. Cập nhật thông tin khách hàng  
5. Xóa khách hàng  

---

### IV. Quản lý **Sản phẩm**
1. Xem danh sách sản phẩm  
   - Có phân trang, sắp xếp, tìm kiếm  
2. Xem chi tiết sản phẩm  
3. Thêm sản phẩm mới  
   - Số lượng ban đầu = 0  
   - Chọn Category và Supplier khi thêm  
4. Sửa thông tin sản phẩm  
5. Xóa sản phẩm  

---

### V. Quản lý **Đơn hàng**
1. Xem danh sách đơn hàng  
   - Có phân trang, sắp xếp, tìm theo ID đơn hàng hoặc khách hàng  
2. Xem chi tiết đơn hàng  

---

### VI. Quản lý **Mã giảm giá**
1. Xem danh sách mã giảm giá  
2. Thêm mã giảm giá  
3. Cập nhật mã giảm giá  
4. Xóa mã giảm giá  

---

### VII. **Mua hàng**
1. Chức năng mua hàng  
   - Tìm kiếm và thêm sản phẩm vào giỏ  
   - Tìm sản phẩm bằng **QR code**  
   - Áp dụng **mã giảm giá**  
2. Thanh toán  
   - **COD:** Thanh toán khi nhận hàng  
   - **Online:** Quét mã QR để thanh toán  

---

### VIII. Quản lý **Nhập kho**
1. Xem danh sách sản phẩm đã nhập kho  
   - Liệt kê các **Inventory** (có phân trang, tìm kiếm, lọc, v.v.)  
2. Nhập kho  
   - Chọn sản phẩm có sẵn  
   - Nhập số lượng và các thông tin cần thiết  
   - Sau khi nhập, **số lượng sản phẩm tự động tăng**  

---

### IX. **Thống kê**
1. Thống kê doanh thu theo:  
   - Ngày  
   - Tháng  
   - Quý  
   - Năm  

2. Thống kê sản phẩm bán chạy nhất theo:  
   - Số lượng  
   - Category  

3. Thống kê khách hàng mua hàng nhiều nhất theo:  
   - Doanh thu  
   - Số lượng đơn hàng  
