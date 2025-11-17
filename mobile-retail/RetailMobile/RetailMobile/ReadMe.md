# Getting Started

Welcome to the Uno Platform!

To discover how to get started with your new app: https://aka.platform.uno/get-started

For more information on how to use the Uno.Sdk or upgrade Uno Platform packages in your solution: https://aka.platform.uno/using-uno-sdk


#Dự án này sử dụng:
Framework: .NET 9
Platforms: Mobile (Android/iOS), WebAssembly (WASM), Desktop
Presentation: MVVM
Markup: XAML
Theme: Material
Extensions:
    DI (Dependency Injection)
    Configuration
    Localization
    HTTP client (.NET SDK only, thuần C#)
    Navigation regions
Features:
    Uno Toolkit
    PWA manifest
    VSCode debugging
    Skia renderer
Authentication: None

# Hướng dẫn cài đặt môi trường & chạy dự án Uno Platform

Dưới đây là hướng dẫn chi tiết các bước chuẩn bị môi trường, cài các package, extension, workload cần thiết và cách chạy dự án Uno Platform mà bạn đã tạo.

---

## 1. Yêu cầu môi trường

* Windows 10/11 hoặc macOS (nếu build iOS)
* **.NET SDK 9.x**
* Visual Studio 2022

---

## 2. Cài Visual Studio Extension cho Uno Platform

1. Mở **Visual Studio Installer → Modify**
2. Tick các workloads:

   * **Mobile development with .NET** (Android SDK + Emulator)
   * **Desktop development with C# / .NET**
   * **ASP.NET and web development** (WebAssembly nếu muốn)
3. Trong Visual Studio: **Extensions → Manage Extensions → Online**

   * Tìm **Uno Platform Solution Templates** và cài đặt

---

## 3. Cài Workloads cần thiết (dotnet CLI)

Chạy terminal hoặc PowerShell:

```bash
# Android
dotnet workload install android

# iOS (trên macOS, nếu cần)
dotnet workload install ios

# WebAssembly
dotnet workload install wasm-tools

# Desktop (Windows)
dotnet workload install maui
```

> Chú ý: iOS chỉ build được trên macOS với Xcode.

---

## 4. Cài NuGet packages phổ biến cho Uno Platform

Trong thư mục project của bạn:

```bash
# Cài Uno Toolkit
dotnet add package Uno.Toolkit

# Cài Uno Material Design
dotnet add package Uno.Toolkit.WinUI.Material

# Cài SkiaSharp để vẽ đồ họa
dotnet add package SkiaSharp.Views.Uno.WinUI
```

* Kiểm tra các package đã cài:

```bash
dotnet list package
```

---

## 5. Cấu trúc project Uno Platform

```
MyUnoApp/
│  MyUnoApp.csproj
├── Presentation/     # XAML pages
├── ViewModels/       # MVVM ViewModels
├── Styles/           # Theme & Color palettes
└── Platforms/
    ├── Android/
    ├── iOS/
    ├── Windows/
    └── WebAssembly/
```

---

## 6. Chạy dự án

### 6.1 Android

**Visual Studio:**

1. Chọn **Android Emulator** hoặc thiết bị thật
2. Chọn cấu hình **Debug – Android**
3. Nhấn **F5 (Run)**

**CLI:**

```bash
dotnet build -f net9.0-android
dotnet run -f net9.0-android
```

APK sẽ xuất ra trong `bin/Debug/net9.0-android/`

### 6.2 WebAssembly (WASM)

**Visual Studio:** Chọn cấu hình **Debug – WebAssembly**, nhấn **F5**

**CLI:**

```bash
dotnet build -f net9.0-browserwasm
dotnet run -f net9.0-browserwasm
```

Mở browser tại `http://localhost:5000`

### 6.3 Desktop Windows

```bash
dotnet run -f net9.0-desktop
```

---

## 7. Kiểm tra môi trường

Uno Platform có tool kiểm tra môi trường:

```bash
dotnet tool install -g Uno.Check
uno-check
```

* Kiểm tra .NET SDK, Android SDK, WASM tools, VS workloads

---

## 8. Ghi chú

* Nếu bạn dùng **Visual Studio** để phát triển → CLI `uno --version` không cần thiết.
* Workloads Android + WASM + Desktop phải được cài để build trên từng nền tảng.
* Khi cài thêm packages, luôn chạy `dotnet restore` để cập nhật dependencies.


