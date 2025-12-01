
-----

# RetailMobile - Hướng dẫn Cài đặt & Phát triển (Linux/Arch Focus)

Dự án ứng dụng bán lẻ đa nền tảng (Mobile, Web, Desktop) sử dụng **Uno Platform** và **.NET 9**.

## Thông tin dự án

  * **Framework:** .NET 9
  * **Platforms:**
      * Mobile: Android (Target `net9.0-android`)
      * Web: WebAssembly (Target `net9.0-browserwasm`)
      * Desktop: Linux GTK / Windows (Target `net9.0-desktop`)
  * **Architecture:** MVVM (CommunityToolkit)
  * **UI:** XAML + Material Theme (Uno.Toolkit)
  * **IDE khuyên dùng:** JetBrains Rider

-----

## 1\. Yêu cầu môi trường (Prerequisites)

### Hệ điều hành

  * Linux (Arch, Ubuntu, Fedora...), Windows 10/11 hoặc macOS.
  * *Lưu ý cho Arch User:* Bắt buộc sử dụng các gói **binary** từ Microsoft (không dùng gói `dotnet-sdk` mặc định của community repo).

### Cài đặt .NET 9 SDK & Runtime

Mở Terminal và chạy lệnh (Ví dụ cho **Arch Linux** dùng `paru`):

```bash
# Gỡ các bản dotnet cũ hoặc bản community (nếu có) để tránh xung đột
# Cài đặt bộ 3: SDK, Runtime, và ASP.NET Runtime (để chạy server/wasm)
paru -S dotnet-sdk-9.0-bin dotnet-runtime-9.0-bin aspnet-runtime-9.0-bin
```

### Cài đặt Android SDK (Bắt buộc nếu build Android)

1.  Khuyên dùng: Cài đặt **Android Studio**, mở lên và vào *SDK Manager* để tải SDK mới nhất.
2.  **Cấu hình biến môi trường** (Thêm vào `~/.config/fish/config.fish` hoặc `~/.bashrc`):
    ```bash
    # Thay đổi đường dẫn nếu bạn cài ở vị trí khác
    export ANDROID_HOME="$HOME/Android/Sdk"
    export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$PATH"
    ```

-----

## 2\. Cài đặt IDE & Mở dự án

1.  Cài đặt **JetBrains Rider** (Phiên bản mới nhất hỗ trợ .NET 9).
2.  Tại màn hình Welcome của Rider, chọn **Open**.
3.  Tìm đến file **Solution** để mở:
    👉 `SGU-Net/mobile-retail/RetailMobile/RetailMobile.sln`
    > **Tuyệt đối lưu ý:** Không mở file `.csproj` rời rạc, cũng không mở file `.slnx` (Preview). Phải mở đúng file `.sln` để IDE nhận diện đủ cấu hình.

-----

## 3\. Cài đặt Workloads

Sau khi cài .NET, bạn cần cài thêm các "phụ kiện" để build được Mobile và WASM. Chạy lệnh sau trong Terminal:

```bash
# Cài workload cho Android và WebAssembly
sudo dotnet workload install android wasm-tools
```

*(Lưu ý: Trên Linux không cần cài workload `maui` hay `ios` nếu bạn không dev MAUI thuần hoặc không kết nối máy Mac).*

-----

## 4\. Khôi phục thư viện (Restore Packages)

Dự án sử dụng *Central Package Management*, nên bạn không cần add package thủ công. Chỉ cần restore:

```bash
cd SGU-Net/mobile-retail/RetailMobile
dotnet restore RetailMobile.sln
```

-----

## 5\. Chạy dự án (Run & Debug)

Có 3 môi trường chính để chạy. Sử dụng Terminal ngay tại thư mục chứa file `.sln` hoặc dùng nút Run của Rider.

### Cách 1: Chạy bản Desktop (Khuyên dùng cho Dev Linux)

Đây là cách nhanh nhất để code logic và sửa giao diện UI mà không cần máy ảo nặng nề. App sẽ chạy dạng cửa sổ GTK native trên Linux.

```bash
dotnet run --project RetailMobile/RetailMobile.csproj -f net9.0-desktop
```

### Cách 2: Chạy bản Android

Yêu cầu: Đã bật sẵn Android Emulator hoặc cắm điện thoại thật (bật USB Debugging).

```bash
dotnet run --project RetailMobile/RetailMobile.csproj -f net9.0-android
```

### Cách 3: Chạy bản WebAssembly (WASM)

Chạy trên trình duyệt. Lưu ý: WASM có thể hạn chế một số tính năng native (như SQLite trực tiếp nếu chưa config).

```bash
dotnet run --project RetailMobile/RetailMobile.csproj -f net9.0-browserwasm
```

*Truy cập: `http://localhost:5000`*

-----

## 6\. Debug lỗi thường gặp (Troubleshooting)

### Lỗi "Android SDK not found"

  * Kiểm tra lại biến môi trường `ANDROID_HOME` đã set chưa (`echo $ANDROID_HOME`).
  * Đảm bảo đã cài `android-sdk-platform-tools` và `android-sdk-build-tools`.

### Lỗi "Target platform identifier android was not recognized"

  * Do bạn đang dùng bản .NET SDK community (source-built). Hãy gỡ ra và cài bản `-bin` (Microsoft binary) như hướng dẫn ở mục 1.

### Lỗi hiển thị Font/Icon trong Terminal Rider

  * Vào Settings -\> Editor -\> Color Scheme -\> Console Font -\> Chọn **JetBrains Mono**.

-----

## 7\. Kiểm tra sức khỏe môi trường (Uno Check)

Nếu gặp lỗi lạ, hãy dùng tool này để nó tự quét và fix lỗi:

```bash
dotnet tool install -g Uno.Check
uno-check
```

-----