# Vé Xe Nhanh - Hệ Thống Đặt Vé Xe Khách Trực Tuyến

Nền tảng đặt vé xe khách hiện đại, nhanh chóng và tiện lợi. Kết nối khách hàng với các nhà xe, tạo nên trải nghiệm đặt vé trực tuyến tuyệt vời.

---

## Mục Lục

- [Tổng Quan](#tổng-quan)
- [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
- [Tính Năng Chính](#tính-năng-chính)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Lộ Trình Phát Triển](#lộ-trình-phát-triển)
- [Hướng Dẫn Cài Đặt](#hướng-dẫn-cài-đặt)
- [Tài Liệu API](#tài-liệu-api)
- [Sơ Đồ Database](#sơ-đồ-database)
- [Kiểm Thử](#kiểm-thử)
- [Triển Khai](#triển-khai)
- [Bảo Mật](#bảo-mật)
- [Hiệu Năng](#hiệu-năng)
- [Xử Lý Sự Cố](#xử-lý-sự-cố)

---

## Tổng Quan

**Vé Xe Nhanh** là một hệ thống đặt vé xe khách trực tuyến toàn diện, được xây dựng theo kiến trúc hiện đại, cho phép:

- Khách hàng: Tìm kiếm, đặt vé và thanh toán dễ dàng 24/7
- Vé điện tử: Quản lý vé với mã QR an toàn, chống giả mạo
- Nhà xe: Quản lý tuyến đường, lịch trình, doanh thu một cách hiệu quả
- Quản lý chuyến: Soát vé điện tử, quản lý hành khách real-time
- Admin hệ thống: Giám sát và quản trị tổng thể nền tảng

### Giải Pháp Cho Các Vấn Đề

#### Quy trình cũ
- Phải đến trực tiếp bến xe để đặt vé
- Không biết trước ghế còn trống
- Vé giấy dễ mất mát, giả mạo
- Khó quản lý, đối soát thủ công
- Tốn thời gian 15-30 phút/lần

#### Quy trình mới
- Đặt vé online mọi lúc, mọi nơi
- Xem tức thời ghế còn trống
- Vé điện tử với mã QR an toàn
- Quản lý tự động, báo cáo thời gian thực
- Chỉ mất 3-5 phút hoàn tất

---

## Kiến Trúc Hệ Thống

### Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Customer  │  │ Operator  │  │   Trip    │  │  System   │  │
│  │    Web    │  │  Dashboard│  │  Manager  │  │   Admin   │  │
│  │           │  │           │  │    Web    │  │ Dashboard │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  │
│        │              │              │              │         │
│        └──────────────┴──────────────┴──────────────┘         │
│                           │                                    │
└───────────────────────────┼────────────────────────────────────┘
                            │
                    ┌───────▼──────┐
                    │   CDN/Nginx  │
                    │ Load Balancer│
                    └───────┬──────┘
                            │
┌───────────────────────────┼────────────────────────────────────┐
│                      API GATEWAY                               │
│                   (Express + JWT Auth)                         │
└───────────────────────────┬────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐   ┌────────▼────────┐   ┌─────▼──────┐
│   Business   │   │   Notification  │   │  Payment   │
│    Logic     │   │     Service     │   │  Gateway   │
│              │   │  (Email/SMS)    │   │ Integration│
└───────┬──────┘   └────────┬────────┘   └─────┬──────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐   ┌────────▼────────┐   ┌─────▼──────┐
│   MongoDB    │   │     Redis       │   │  File      │
│   Database   │   │  Cache/Queue    │   │  Storage   │
│              │   │                 │   │(Cloudinary)│
└──────────────┘   └─────────────────┘   └────────────┘
```

### 4 Trang Web Riêng Biệt

Hệ thống được chia thành **4 ứng dụng web độc lập**:

#### 1. Trang Khách Hàng (Customer Web)
- **Địa chỉ:** `https://vexenhanh.com`
- **Mục đích:** Tìm kiếm và đặt vé cho khách hàng
- **Tính năng:**
  - Tìm kiếm chuyến xe
  - Đặt vé và thanh toán trực tuyến
  - Quản lý vé cá nhân
  - Đánh giá và nhận xét
  - Tích lũy điểm thưởng
- **Đăng nhập:** Email/Số điện thoại + Mật khẩu, hoặc qua Google, Facebook

#### 2. Trang Nhà Xe (Operator Dashboard)
- **Địa chỉ:** `https://operator.vexenhanh.com`
- **Mục đích:** Quản lý hoạt động kinh doanh của nhà xe
- **Tính năng:**
  - Bảng điều khiển doanh thu thời gian thực
  - Quản lý tuyến đường và xe
  - Tạo lịch trình chuyến xe
  - Quản lý nhân viên
  - Báo cáo chi tiết
  - Quản lý phiếu giảm giá và khuyến mãi
- **Đăng nhập:** Email doanh nghiệp + Mật khẩu (riêng biệt)

#### 3. Trang Quản Lý Chuyến (Trip Manager Web)
- **Địa chỉ:** `https://trip.vexenhanh.com`
- **Mục đích:** Soát vé và quản lý hành khách
- **Tính năng:**
  - Quét mã QR xác thực vé
  - Danh sách hành khách thời gian thực
  - Đánh dấu đã lên xe
  - Cập nhật trạng thái chuyến
  - Thống kê tỉ lệ lấp đầy
- **Đăng nhập:** Mã nhân viên + Mật khẩu (riêng biệt)

#### 4. Trang Quản Trị Hệ Thống (System Admin)
- **Địa chỉ:** `https://admin.vexenhanh.com`
- **Mục đích:** Quản trị và giám sát toàn hệ thống
- **Tính năng:**
  - Bảng điều khiển tổng quan hệ thống
  - Quản lý người dùng và nhà xe
  - Duyệt đăng ký nhà xe
  - Quản lý nội dung (banner, blog, câu hỏi thường gặp)
  - Xử lý khiếu nại
  - Báo cáo và phân tích
- **Đăng nhập:** Tài khoản quản trị (bảo mật cao)

---

## Tính Năng Chính

### Dành cho Khách Hàng

#### Tìm Kiếm & Đặt Vé
- Tìm kiếm chuyến xe theo tuyến, ngày giờ với bộ lọc
- So sánh nhiều nhà xe, giá vé, tiện ích
- Xem sơ đồ ghế thời gian thực (ghế trống/đã đặt)
- Chọn tối đa 6 ghế mỗi lần đặt
- Giữ ghế tạm thời 15 phút khi đang đặt
- Nhập thông tin hành khách chi tiết
- Chọn điểm đón và điểm trả linh hoạt

#### Thanh Toán
- Đa dạng phương thức thanh toán:
  - Ví điện tử: MoMo, VNPay, ZaloPay, ShopeePay
  - Thẻ ATM nội địa
  - Thẻ quốc tế: Visa, Mastercard, JCB
  - Chuyển khoản ngân hàng
  - Thanh toán khi lên xe
- Áp dụng mã phiếu giảm giá
- Bảo mật tuân thủ tiêu chuẩn PCI-DSS
- Hoàn tiền tự động khi thanh toán thất bại

#### Vé Điện Tử
- Nhận vé điện tử dạng PDF qua email
- Mã QR chứa thông tin mã hóa
- Gửi qua email và tin nhắn
- Lưu lịch sử vé trong tài khoản
- Tải vé bất kỳ lúc nào

#### Quản Lý Vé
- Xem danh sách vé: sắp tới, đã đi, đã hủy
- Tìm kiếm vé theo mã, ngày, tuyến
- Hủy vé theo chính sách (hoàn tiền tự động)
- Đổi vé sang chuyến khác (tính chênh lệch)
- Thông báo nhắc nhở trước giờ xuất bến

#### Khác
- Đánh giá và nhận xét chuyến đi (1-5 sao)
- Tích lũy điểm thưởng mỗi chuyến
- Hạng thành viên: Đồng, Bạc, Vàng, Bạch Kim
- Lưu danh sách hành khách thường đi
- Xem lịch sử đặt vé và giao dịch

---

### Dành cho Nhà Xe

#### Bảng Điều Khiển & Phân Tích
- Bảng điều khiển thời gian thực:
  - Tổng doanh thu (ngày/tuần/tháng/năm)
  - Số vé đã bán
  - Tỷ lệ lấp đầy trung bình
  - Biểu đồ xu hướng
- Báo cáo chi tiết:
  - Doanh thu theo tuyến
  - Tuyến đường phổ biến nhất
  - Tỷ lệ hủy vé
  - Xuất file Excel/PDF

#### Quản Lý Tuyến & Xe
- Quản lý tuyến đường:
  - Tạo/sửa/xóa tuyến
  - Thiết lập điểm đi, đến, điểm dừng
  - Khoảng cách và thời gian dự kiến
  - Tích hợp Google Maps
- Quản lý xe:
  - Thêm/sửa/xóa xe (biển số, loại xe)
  - Thiết lập sơ đồ ghế linh hoạt (1-2 tầng)
  - Cấu hình tiện ích xe (WiFi, điều hòa, nhà vệ sinh...)
  - Trạng thái xe (hoạt động/bảo trì)

#### Lịch Trình & Định Giá
- Tạo lịch trình chuyến xe:
  - Chọn tuyến, xe, tài xế, quản lý chuyến
  - Giờ đi, giờ đến dự kiến
  - Sao chép lịch trình định kỳ
  - Hủy/sửa chuyến
- Quản lý giá vé:
  - Thiết lập bảng giá linh hoạt
  - Điều chỉnh giá theo nhu cầu
  - Tạo mã phiếu giảm giá
  - Thiết lập điều kiện áp dụng

#### Quản Lý Nhân Viên
- Quản lý nhân viên:
  - Thêm tài xế, quản lý chuyến
  - Phân quyền truy cập
  - Xem lịch trình làm việc
  - Theo dõi tình trạng (hoạt động/không hoạt động)

---

### Dành cho Quản Lý Chuyến

#### Soát Vé Điện Tử
- Quét mã QR:
  - Mở camera hoặc tải ảnh lên
  - Tự động giải mã và xác thực
  - Kiểm tra vé: hợp lệ, đúng chuyến, chưa sử dụng
  - Hiển thị thông tin hành khách đầy đủ
- Xác nhận lên xe:
  - Đánh dấu vé đã sử dụng
  - Không thể quét lại vé đã dùng
  - Cập nhật danh sách thời gian thực

#### Quản Lý Hành Khách
- Danh sách hành khách:
  - Xem tất cả hành khách của chuyến
  - Phân biệt: đã lên xe / chưa lên xe
  - Tìm kiếm theo tên, ghế, SĐT
  - Thống kê: đã lên/tổng số
- Cập nhật trạng thái chuyến:
  - Chưa bắt đầu → Đang diễn ra → Hoàn thành
  - Thông báo tự động cho hành khách

---

### Dành cho Quản Trị Hệ Thống

#### Quản Lý Người Dùng & Nhà Xe
- Quản lý người dùng:
  - Xem danh sách tất cả người dùng
  - Tìm kiếm, lọc, phân trang
  - Khóa/mở khóa tài khoản
  - Đặt lại mật khẩu
- Duyệt nhà xe:
  - Xem yêu cầu đăng ký nhà xe mới
  - Kiểm tra giấy tờ (giấy phép kinh doanh, mã số thuế)
  - Phê duyệt/từ chối
  - Tạm ngưng/khôi phục nhà xe

#### Quản Lý Nội Dung
- Quản lý nội dung:
  - Tải lên và quản lý banner
  - Thêm/sửa/xóa bài viết blog
  - Quản lý câu hỏi thường gặp
  - Cài đặt tối ưu hóa công cụ tìm kiếm

#### Hỗ Trợ & Phân Tích
- Xử lý khiếu nại:
  - Hệ thống phiếu hỗ trợ
  - Phân loại và ưu tiên
  - Phân công cho nhân viên
  - Theo dõi tiến độ
- Báo cáo tổng hợp:
  - Bảng điều khiển hệ thống
  - Chỉ số tăng trưởng
  - Tuyến đường/nhà xe hàng đầu
  - Phân tích doanh thu

---

## Công Nghệ Sử Dụng

### Công Nghệ Frontend

| Công nghệ | Phiên bản | Mục đích |
|-----------|---------|----------|
| React | 18.2.0 | Thư viện giao diện người dùng |
| Vite | 5.0.0 | Công cụ build nhanh |
| Tailwind CSS | 3.3.5 | Framework CSS tiện ích |
| Ant Design | 5.11.0 | Thành phần giao diện doanh nghiệp |
| Zustand | 4.4.6 | Quản lý trạng thái nhẹ |
| React Router | 6.20.0 | Định tuyến phía client |
| Axios | 1.6.0 | Thư viện HTTP |
| Socket.IO Client | 4.6.0 | Giao tiếp thời gian thực |
| QRCode.react | 3.1.0 | Tạo mã QR |
| Day.js | 1.11.10 | Thao tác ngày tháng |
| React Hot Toast | 2.4.1 | Thông báo |

### Công Nghệ Backend

| Công nghệ | Phiên bản | Mục đích |
|-----------|---------|----------|
| Node.js | ≥18.0.0 | Môi trường chạy JavaScript |
| Express | 4.18.2 | Framework web |
| MongoDB | ≥6.0 | Cơ sở dữ liệu NoSQL |
| Mongoose | 8.0.0 | Công cụ ODM cho MongoDB |
| Redis | ≥6.0 | Bộ nhớ đệm và lưu phiên |
| JWT | 9.0.2 | Token xác thực |
| bcryptjs | 2.4.3 | Mã hóa mật khẩu |
| Helmet | 7.1.0 | Tiêu đề bảo mật |
| CORS | 2.8.5 | Chia sẻ tài nguyên liên nguồn |
| Express Validator | 7.0.1 | Xác thực đầu vào |
| Rate Limit | 7.1.0 | Giới hạn tốc độ API |
| Nodemailer | 6.9.7 | Gửi email |
| Socket.IO | 4.6.0 | Máy chủ WebSocket |
| PDFKit | 0.13.0 | Tạo file PDF |
| QRCode | 1.5.3 | Tạo mã QR |
| Winston | 3.11.0 | Hệ thống ghi nhật ký |

### Dịch Vụ Bên Thứ Ba

| Dịch vụ | Mục đích |
|---------|---------|
| VNPay, MoMo, ZaloPay | Cổng thanh toán |
| SendGrid / AWS SES | Dịch vụ email giao dịch |
| VNPT SMS / Viettel SMS | Thông báo tin nhắn (OTP, cảnh báo) |
| Cloudinary | Tải lên hình ảnh/file và CDN |
| Google Maps API | Mã hóa địa lý và bản đồ |
| Google/Facebook OAuth | Đăng nhập mạng xã hội |

### Công Cụ Vận Hành & Hạ Tầng

| Công cụ | Mục đích |
|------|---------|
| Docker | Đóng gói container |
| Docker Compose | Điều phối nhiều container |
| GitHub Actions | Đường ống CI/CD |
| Nginx | Máy chủ proxy ngược và web |
| CloudFlare | CDN và bảo vệ DDoS |
| AWS/Azure/GCP | Lưu trữ đám mây |
| MongoDB Atlas | MongoDB được quản lý (tùy chọn) |
| Redis Cloud | Redis được quản lý (tùy chọn) |

---

## Cấu Trúc Dự Án

```
Ve_Xe_Nhanh/
│
├── backend/                          # Backend Node.js + Express
│   ├── src/
│   │   ├── controllers/              # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── operator.controller.js
│   │   │   ├── route.controller.js
│   │   │   ├── bus.controller.js
│   │   │   ├── trip.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── ticket.controller.js
│   │   │   └── admin.controller.js
│   │   │
│   │   ├── models/                   # MongoDB Schemas
│   │   │   ├── User.js
│   │   │   ├── BusOperator.js
│   │   │   ├── Route.js
│   │   │   ├── Bus.js
│   │   │   ├── Trip.js
│   │   │   ├── Booking.js
│   │   │   ├── Ticket.js
│   │   │   ├── Payment.js
│   │   │   ├── Review.js
│   │   │   ├── Voucher.js
│   │   │   └── Employee.js
│   │   │
│   │   ├── routes/                   # API Routes
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── operator.routes.js
│   │   │   ├── trip.routes.js
│   │   │   ├── booking.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── ticket.routes.js
│   │   │   └── admin.routes.js
│   │   │
│   │   ├── middleware/               # Express Middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   ├── upload.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── morgan.middleware.js
│   │   │
│   │   ├── services/                 # Business Logic
│   │   │   ├── auth.service.js
│   │   │   ├── email.service.js
│   │   │   ├── sms.service.js
│   │   │   ├── payment.service.js
│   │   │   ├── qr.service.js
│   │   │   ├── pdf.service.js
│   │   │   └── seat.service.js
│   │   │
│   │   ├── utils/                    # Utilities
│   │   │   ├── logger.js
│   │   │   ├── logHelpers.js
│   │   │   ├── constants.js
│   │   │   ├── validators.js
│   │   │   └── helpers.js
│   │   │
│   │   ├── config/                   # Configuration
│   │   │   ├── database.js
│   │   │   ├── redis.js
│   │   │   ├── cloudinary.js
│   │   │   └── payment.js
│   │   │
│   │   └── server.js                 # Entry point
│   │
│   ├── tests/                        # Backend tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── logs/                         # Log files
│   │   ├── application-YYYY-MM-DD.log
│   │   ├── error-YYYY-MM-DD.log
│   │   └── exceptions-YYYY-MM-DD.log
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── frontend/                         # Frontend React + Vite
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   │   ├── common/
│   │   │   ├── search/
│   │   │   ├── booking/
│   │   │   └── dashboard/
│   │   │
│   │   ├── pages/                    # Page components
│   │   │   ├── customer/
│   │   │   ├── operator/
│   │   │   ├── trip-manager/
│   │   │   ├── admin/
│   │   │   └── auth/
│   │   │
│   │   ├── services/                 # API Services
│   │   ├── store/                    # State Management
│   │   ├── hooks/                    # Custom React Hooks
│   │   ├── utils/                    # Utilities
│   │   ├── assets/                   # Static assets
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── public/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── docs/                             # Documentation
│   ├── PROJECT_PHASES.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
├── .gitignore
├── docker-compose.yml
├── LICENSE
└── README.md
```

---

## Lộ Trình Phát Triển

Dự án được chia thành **7 giai đoạn (phases)** phát triển, từ setup cơ bản đến các tính năng nâng cao:

### Tổng Quan Phases

| Phase | Tên | Thời gian | Độ ưu tiên | Trạng thái |
|-------|-----|-----------|------------|------------|
| Phase 1 | Setup & Core Infrastructure | 2 tuần | Cao | Hoàn thành |
| Phase 2 | Route & Bus Management | 2 tuần | Cao | Đang thực hiện |
| Phase 3 | Booking System | 3 tuần | Cao | Chưa bắt đầu |
| Phase 4 | Ticket Management | 2 tuần | Cao | Chưa bắt đầu |
| Phase 5 | Bus Operator Admin | 2 tuần | Trung bình | Chưa bắt đầu |
| Phase 6 | System Admin | 1.5 tuần | Trung bình | Chưa bắt đầu |
| Phase 7 | Additional Features & Polish | 2 tuần | Thấp | Chưa bắt đầu |

**Tổng thời gian dự kiến:** ~14.5 tuần (≈ 3.5 tháng)

### Sản Phẩm Khả Thi Tối Thiểu (MVP)
MVP bao gồm giai đoạn 1-4, cho phép hệ thống hoạt động cơ bản với đầy đủ chức năng cốt lõi:
- Đăng ký, đăng nhập
- Tìm kiếm và đặt vé
- Thanh toán trực tuyến
- Vé điện tử với QR
- Quản lý tuyến, xe, lịch trình

Chi tiết đầy đủ: Xem [docs/PROJECT_PHASES.md](docs/PROJECT_PHASES.md)

---

## Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống

#### Yêu Cầu Phần Mềm
- **Node.js:** >= 18.0.0
- **npm:** >= 9.0.0 (hoặc yarn >= 1.22.0)
- **MongoDB:** >= 6.0
- **Redis:** >= 6.0
- **Git:** >= 2.30.0

#### Yêu Cầu Phần Cứng (Phát Triển)
- **RAM:** >= 8GB (khuyến nghị 16GB)
- **Bộ nhớ:** >= 10GB còn trống
- **CPU:** Dual-core 2GHz trở lên

### Các Bước Cài Đặt

#### 1. Sao Chép Mã Nguồn

```bash
git clone https://github.com/yourusername/Ve_Xe_Nhanh.git
cd Ve_Xe_Nhanh
```

#### 2. Thiết Lập Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env từ template
cp .env.example .env

# Chỉnh sửa file .env với thông tin của bạn
nano .env
```

**Cấu hình .env quan trọng:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/vexenhanh

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Payment Gateways
VNPAY_TMN_CODE=your-vnpay-code
VNPAY_HASH_SECRET=your-vnpay-secret
```

**Chạy Backend:**
```bash
# Development mode (with nodemon auto-reload)
npm run dev

# Production mode
npm start

# Run tests
npm test
```

Backend sẽ chạy tại: `http://localhost:5500`

#### 3. Thiết Lập Frontend

**Chạy Backend:**
```bash
# Di chuyển vào thư mục frontend (từ root)
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa .env
nano .env
```

**Cấu hình .env:**
```env
# API URL
VITE_API_URL=http://localhost:5500/api/v1

# WebSocket URL
VITE_WS_URL=ws://localhost:5500
```

**Chạy Frontend:**
```bash
# Development mode (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Frontend sẽ chạy tại: `http://localhost:3000`

#### 4. Thiết Lập Cơ Sở Dữ Liệu

**MongoDB:**
```bash
# Start MongoDB service (Ubuntu/Debian)
sudo systemctl start mongod

# Hoặc nếu dùng Docker
docker run -d -p 27017:27017 --name mongodb mongo:6

# Verify connection
mongosh
```

**Redis:**
```bash
# Start Redis service
sudo systemctl start redis

# Hoặc nếu dùng Docker
docker run -d -p 6379:6379 --name redis redis:6

# Verify connection
redis-cli ping
# Should return: PONG
```

#### 5. Nạp Dữ Liệu Mẫu (Tùy Chọn)

```bash
cd backend
npm run seed
```

### Thiết Lập Docker (Khuyến Nghị Cho Môi Trường Sản Xuất)

```bash
# Build và chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild sau khi thay đổi code
docker-compose up -d --build
```

---

## Tài Liệu API

### API Base URL
```
Development: http://localhost:5500/api/v1
Production:  https://api.vexenhanh.com/v1
```

### Tài Liệu Swagger/OpenAPI
Truy cập tại: `http://localhost:5500/api-docs`

### Xác Thực
Hầu hết các API sau khi đăng nhập đều yêu cầu gửi JWT token trong header. Token giúp hệ thống biết người gọi API là ai, có vai trò gì và có được phép thực hiện hành động đó hay không.

```bash
# Header format
Authorization: Bearer <your_jwt_token>
```

### Quy Ước Chung

- **Public API:** Không cần đăng nhập, ví dụ tìm chuyến xe, xem tuyến đường, đăng ký, đăng nhập.
- **Customer API:** Dành cho khách hàng đã đăng nhập, ví dụ đặt vé, thanh toán, xem vé của mình.
- **Operator API:** Dành cho nhà xe, dùng để quản lý tuyến, xe, chuyến, nhân viên và doanh thu.
- **Trip Manager API:** Dành cho nhân viên quản lý chuyến, dùng để soát vé, cập nhật khách đã lên xe và trạng thái chuyến.
- **Admin API:** Dành cho quản trị hệ thống, dùng để quản lý toàn bộ người dùng, nhà xe, nội dung và báo cáo.
- **Request body:** Dữ liệu client gửi lên server, thường ở dạng JSON.
- **Response body:** Dữ liệu server trả về cho client, thường gồm trạng thái xử lý, thông báo và dữ liệu chi tiết.

### Danh Sách API Theo Chức Năng

#### 1. Nhóm Auth API - Đăng Ký, Đăng Nhập, Phiên Làm Việc

Nhóm API này xử lý việc tạo tài khoản, đăng nhập, đăng xuất, làm mới token và lấy thông tin người dùng hiện tại. Đây là nhóm API đầu tiên mà frontend cần tích hợp vì các API quan trọng khác phụ thuộc vào token đăng nhập.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| POST | `/auth/register` | Public | Tạo tài khoản khách hàng mới bằng email, số điện thoại, mật khẩu và họ tên. |
| POST | `/auth/login` | Public | Kiểm tra email/số điện thoại và mật khẩu, sau đó trả về access token để sử dụng các API cần đăng nhập. |
| POST | `/auth/logout` | Đã đăng nhập | Đăng xuất tài khoản hiện tại, vô hiệu hóa hoặc xóa phiên đăng nhập phía server nếu hệ thống có lưu phiên. |
| POST | `/auth/refresh-token` | Public/Refresh token | Cấp access token mới khi access token cũ hết hạn nhưng refresh token vẫn hợp lệ. |
| GET | `/auth/me` | Đã đăng nhập | Lấy thông tin tài khoản đang đăng nhập, ví dụ họ tên, email, số điện thoại, vai trò và trạng thái tài khoản. |
| POST | `/auth/forgot-password` | Public | Gửi yêu cầu quên mật khẩu, hệ thống gửi mã OTP hoặc đường dẫn đặt lại mật khẩu qua email/SMS. |
| POST | `/auth/reset-password` | Public | Đặt lại mật khẩu mới bằng token/OTP hợp lệ. |
| POST | `/auth/verify-otp` | Public | Xác minh mã OTP khi đăng ký, đổi mật khẩu hoặc xác thực số điện thoại/email. |

**Ví dụ đăng ký tài khoản:**

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "0901234567",
  "password": "SecurePass123",
  "fullName": "Nguyen Van A"
}
```

**Khi nào dùng:** Khi người dùng mới mở ứng dụng và muốn tạo tài khoản để đặt vé, lưu lịch sử vé và nhận thông báo.

**Kết quả mong đợi:** Server tạo tài khoản mới, trả về thông tin người dùng và token đăng nhập nếu đăng ký thành công.

**Ví dụ đăng nhập:**

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Khi nào dùng:** Khi người dùng đã có tài khoản và muốn vào hệ thống.

**Kết quả mong đợi:** Server trả về access token, refresh token và thông tin cơ bản của người dùng.

#### 2. Nhóm User API - Quản Lý Tài Khoản Khách Hàng

Nhóm API này phục vụ các thao tác cá nhân của khách hàng như xem hồ sơ, cập nhật thông tin, đổi mật khẩu, quản lý hành khách thường đi và xem điểm thưởng.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/users/profile` | Customer | Lấy hồ sơ cá nhân của khách hàng đang đăng nhập. |
| PUT | `/users/profile` | Customer | Cập nhật họ tên, số điện thoại, ngày sinh, giới tính hoặc thông tin liên hệ. |
| PUT | `/users/change-password` | Customer | Đổi mật khẩu khi người dùng vẫn nhớ mật khẩu cũ. |
| GET | `/users/saved-passengers` | Customer | Lấy danh sách hành khách thường đi để điền nhanh khi đặt vé. |
| POST | `/users/saved-passengers` | Customer | Thêm một hành khách thường đi mới. |
| PUT | `/users/saved-passengers/:id` | Customer | Cập nhật thông tin hành khách thường đi. |
| DELETE | `/users/saved-passengers/:id` | Customer | Xóa hành khách thường đi khỏi tài khoản. |
| GET | `/users/loyalty` | Customer | Xem điểm thưởng, hạng thành viên và lịch sử cộng/trừ điểm. |

**Khi nào dùng:** Sau khi khách hàng đăng nhập và vào trang tài khoản cá nhân.

**Kết quả mong đợi:** Khách hàng quản lý được thông tin cá nhân và dữ liệu hỗ trợ đặt vé nhanh hơn.

#### 3. Nhóm Route API - Tuyến Đường

Route là tuyến cố định giữa điểm đi và điểm đến, ví dụ `Ha Noi -> Da Nang`. Nhóm API này giúp khách hàng xem tuyến đang khai thác, còn nhà xe dùng để tạo và quản lý tuyến của mình.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/routes` | Public | Lấy danh sách tuyến đường đang hoạt động, có thể lọc theo điểm đi, điểm đến hoặc nhà xe. |
| GET | `/routes/:id` | Public | Xem chi tiết một tuyến, gồm điểm đi, điểm đến, điểm dừng, khoảng cách và thời gian dự kiến. |
| POST | `/routes` | Operator | Tạo tuyến mới cho nhà xe. |
| PUT | `/routes/:id` | Operator | Cập nhật thông tin tuyến như điểm dừng, thời gian dự kiến hoặc trạng thái hoạt động. |
| DELETE | `/routes/:id` | Operator | Ngừng khai thác hoặc xóa tuyến nếu chưa phát sinh dữ liệu ràng buộc. |

**Khi nào dùng:** Khi khách hàng tìm tuyến xe hoặc nhà xe cấu hình tuyến trước khi tạo lịch chạy.

**Kết quả mong đợi:** Hệ thống có dữ liệu tuyến rõ ràng để dùng cho tìm kiếm chuyến và lập lịch.

#### 4. Nhóm Bus API - Quản Lý Xe Và Sơ Đồ Ghế

Nhóm API này dành chủ yếu cho nhà xe. Mỗi xe có biển số, loại xe, số tầng, số ghế, tiện ích và sơ đồ ghế. Dữ liệu này ảnh hưởng trực tiếp tới màn hình chọn ghế của khách hàng.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/buses` | Operator | Lấy danh sách xe thuộc nhà xe đang đăng nhập. |
| GET | `/buses/:id` | Operator | Xem chi tiết một xe, gồm biển số, loại xe, tiện ích và sơ đồ ghế. |
| POST | `/buses` | Operator | Thêm xe mới vào hệ thống của nhà xe. |
| PUT | `/buses/:id` | Operator | Cập nhật thông tin xe, tiện ích hoặc trạng thái hoạt động/bảo trì. |
| DELETE | `/buses/:id` | Operator | Xóa hoặc vô hiệu hóa xe không còn khai thác. |
| GET | `/buses/:id/seat-map` | Operator | Lấy sơ đồ ghế của xe để kiểm tra hoặc chỉnh sửa. |
| PUT | `/buses/:id/seat-map` | Operator | Cập nhật sơ đồ ghế, ví dụ ghế thường, giường nằm, tầng 1/tầng 2. |

**Khi nào dùng:** Khi nhà xe thiết lập đội xe hoặc thay đổi cấu hình ghế.

**Kết quả mong đợi:** Khi tạo chuyến, hệ thống biết chuyến đó dùng xe nào và có những ghế nào để bán.

#### 5. Nhóm Trip API - Tìm Kiếm Và Quản Lý Chuyến Xe

Trip là một chuyến xe cụ thể chạy vào ngày giờ cụ thể trên một tuyến cụ thể. Đây là nhóm API quan trọng nhất đối với chức năng tìm kiếm và đặt vé.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/trips/search` | Public | Tìm chuyến xe theo điểm đi, điểm đến, ngày khởi hành, số ghế, nhà xe hoặc khoảng giá. |
| GET | `/trips/:id` | Public | Xem chi tiết chuyến, gồm giờ đi, giờ đến, nhà xe, xe, giá vé, điểm đón/trả và tiện ích. |
| GET | `/trips/:id/seats` | Public | Lấy tình trạng ghế theo thời gian thực: ghế trống, đang giữ, đã bán hoặc không khả dụng. |
| POST | `/trips` | Operator | Tạo chuyến xe mới từ tuyến, xe, tài xế, giờ khởi hành và giá vé. |
| PUT | `/trips/:id` | Operator | Cập nhật thông tin chuyến nếu chưa khởi hành hoặc chưa bị khóa chỉnh sửa. |
| PATCH | `/trips/:id/status` | Operator/Trip Manager | Cập nhật trạng thái chuyến: chưa chạy, đang chạy, hoàn thành hoặc đã hủy. |
| DELETE | `/trips/:id` | Operator | Hủy hoặc xóa chuyến theo chính sách hệ thống. |

**Ví dụ tìm kiếm chuyến xe:**

```bash
GET /api/v1/trips/search?from=Ha Noi&to=Da Nang&date=2024-01-15
```

**Khi nào dùng:** Khi khách hàng nhập điểm đi, điểm đến và ngày đi trên trang tìm kiếm.

**Kết quả mong đợi:** Server trả về danh sách chuyến phù hợp, kèm giá vé, giờ đi, nhà xe, số ghế còn lại và thông tin cần để người dùng chọn chuyến.

#### 6. Nhóm Booking API - Giữ Ghế Và Đặt Vé

Booking là đơn đặt vé. Một booking có thể chứa một hoặc nhiều ghế, thông tin hành khách, điểm đón/trả và trạng thái thanh toán. Nhóm API này cần kiểm tra kỹ vì dễ phát sinh lỗi trùng ghế, hết thời gian giữ ghế hoặc thanh toán thất bại.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| POST | `/bookings` | Customer | Tạo booking mới, giữ ghế tạm thời và lưu thông tin hành khách. |
| GET | `/bookings` | Customer | Lấy danh sách booking của khách hàng đang đăng nhập. |
| GET | `/bookings/:id` | Customer | Xem chi tiết một booking, gồm ghế, hành khách, số tiền và trạng thái. |
| PATCH | `/bookings/:id/cancel` | Customer | Hủy booking hoặc vé theo chính sách hoàn tiền. |
| PATCH | `/bookings/:id/change-trip` | Customer | Đổi vé sang chuyến khác nếu chính sách cho phép. |
| POST | `/bookings/:id/apply-voucher` | Customer | Áp dụng mã giảm giá vào booking trước khi thanh toán. |
| DELETE | `/bookings/:id/voucher` | Customer | Gỡ mã giảm giá khỏi booking. |

**Ví dụ tạo booking:**

```bash
POST /api/v1/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "tripId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "seats": ["A1", "A2"],
  "passengers": [
    {
      "fullName": "Nguyen Van A",
      "phone": "0901234567",
      "idCard": "001234567890"
    }
  ],
  "pickupPoint": "Ben xe Luong Yen",
  "dropoffPoint": "Ben xe Da Nang",
  "email": "user@example.com"
}
```

**Khi nào dùng:** Khi khách hàng đã chọn chuyến, chọn ghế và bấm tiếp tục đặt vé.

**Kết quả mong đợi:** Server kiểm tra ghế còn trống, giữ ghế trong một khoảng thời gian, tạo booking ở trạng thái chờ thanh toán và trả về tổng tiền cần thanh toán.

#### 7. Nhóm Payment API - Thanh Toán Và Hoàn Tiền

Nhóm API này kết nối hệ thống với cổng thanh toán như MoMo, VNPay, ZaloPay hoặc thẻ ngân hàng. Đây là nhóm API có rủi ro cao, cần log đầy đủ và kiểm tra chữ ký callback từ cổng thanh toán.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| POST | `/payments/create` | Customer | Tạo yêu cầu thanh toán cho booking và trả về link/QR thanh toán. |
| GET | `/payments/:id` | Customer | Xem trạng thái một giao dịch thanh toán. |
| POST | `/payments/vnpay/callback` | Public | Nhận kết quả thanh toán từ VNPay sau khi người dùng thanh toán xong. |
| POST | `/payments/momo/callback` | Public | Nhận kết quả thanh toán từ MoMo. |
| POST | `/payments/zalopay/callback` | Public | Nhận kết quả thanh toán từ ZaloPay. |
| POST | `/payments/:id/refund` | Operator/Admin | Tạo yêu cầu hoàn tiền khi hủy vé hoặc giao dịch cần xử lý lại. |
| GET | `/payments/history` | Customer | Xem lịch sử thanh toán của khách hàng. |

**Khi nào dùng:** Sau khi booking được tạo và khách hàng chọn phương thức thanh toán.

**Kết quả mong đợi:** Nếu thanh toán thành công, booking chuyển sang trạng thái đã thanh toán và hệ thống phát hành vé điện tử.

#### 8. Nhóm Ticket API - Vé Điện Tử Và QR

Ticket là vé cuối cùng được dùng khi khách lên xe. Mỗi vé có mã vé, mã QR, thông tin chuyến, ghế, hành khách và trạng thái sử dụng.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/tickets` | Customer | Lấy danh sách vé của khách hàng. |
| GET | `/tickets/:id` | Customer | Xem chi tiết vé điện tử. |
| GET | `/tickets/:id/download` | Customer | Tải vé dạng PDF để lưu hoặc in ra. |
| GET | `/tickets/:id/qr` | Customer | Lấy mã QR của vé để hiển thị trên màn hình. |
| POST | `/tickets/verify` | Trip Manager | Xác thực vé bằng mã QR khi khách lên xe. |
| PATCH | `/tickets/:id/check-in` | Trip Manager | Đánh dấu vé đã được sử dụng sau khi xác thực hợp lệ. |
| PATCH | `/tickets/:id/cancel` | Customer/Operator | Hủy vé theo chính sách cho phép. |

**Khi nào dùng:** Sau khi thanh toán thành công hoặc khi nhân viên quét vé tại điểm lên xe.

**Kết quả mong đợi:** Khách hàng nhận được vé điện tử, còn nhân viên có thể xác thực vé thật/giả và tránh dùng lại vé nhiều lần.

#### 9. Nhóm Review API - Đánh Giá Chuyến Đi

Nhóm API này cho phép khách hàng đánh giá chuyến đi sau khi hoàn thành. Dữ liệu đánh giá giúp khách hàng khác chọn nhà xe tốt hơn và giúp nhà xe cải thiện dịch vụ.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/reviews` | Public | Lấy danh sách đánh giá, có thể lọc theo nhà xe, chuyến hoặc số sao. |
| POST | `/reviews` | Customer | Tạo đánh giá mới cho chuyến đã đi. |
| PUT | `/reviews/:id` | Customer | Cập nhật nội dung đánh giá của chính mình. |
| DELETE | `/reviews/:id` | Customer/Admin | Xóa đánh giá không phù hợp hoặc do người dùng yêu cầu. |
| POST | `/reviews/:id/reply` | Operator | Nhà xe phản hồi đánh giá của khách hàng. |

**Khi nào dùng:** Khi chuyến đã hoàn thành và khách hàng muốn phản hồi chất lượng dịch vụ.

**Kết quả mong đợi:** Hệ thống lưu điểm sao, nhận xét và phản hồi để hiển thị công khai theo quy định.

#### 10. Nhóm Voucher API - Mã Giảm Giá Và Khuyến Mãi

Voucher giúp giảm giá booking theo phần trăm hoặc số tiền cố định. API cần kiểm tra điều kiện như thời hạn, số lượt dùng, tuyến áp dụng, nhà xe áp dụng và giá trị đơn tối thiểu.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/vouchers` | Customer/Operator | Lấy danh sách mã giảm giá có thể sử dụng hoặc do nhà xe tạo. |
| GET | `/vouchers/:code/validate` | Customer | Kiểm tra mã giảm giá có hợp lệ với booking hiện tại hay không. |
| POST | `/vouchers` | Operator/Admin | Tạo mã giảm giá mới. |
| PUT | `/vouchers/:id` | Operator/Admin | Cập nhật điều kiện, số lượng hoặc thời hạn mã giảm giá. |
| PATCH | `/vouchers/:id/status` | Operator/Admin | Bật/tắt mã giảm giá. |
| DELETE | `/vouchers/:id` | Operator/Admin | Xóa mã giảm giá nếu chưa phát sinh ràng buộc. |

**Khi nào dùng:** Khi khách hàng nhập mã giảm giá ở màn hình thanh toán hoặc nhà xe tạo chương trình khuyến mãi.

**Kết quả mong đợi:** Booking được giảm đúng số tiền nếu mã hợp lệ, hoặc trả về lý do không áp dụng được nếu mã không hợp lệ.

#### 11. Nhóm Operator API - Quản Lý Nhà Xe

Nhóm API này dành cho tài khoản nhà xe để quản lý hồ sơ doanh nghiệp, nhân viên, cấu hình vận hành và xem dữ liệu kinh doanh.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/operators/profile` | Operator | Lấy thông tin nhà xe đang đăng nhập. |
| PUT | `/operators/profile` | Operator | Cập nhật thông tin doanh nghiệp, logo, hotline, địa chỉ và mô tả. |
| GET | `/operators/dashboard` | Operator | Lấy dữ liệu tổng quan: doanh thu, số vé bán, tỷ lệ lấp đầy và chuyến sắp chạy. |
| GET | `/operators/revenue` | Operator | Xem báo cáo doanh thu theo ngày, tháng, tuyến hoặc chuyến. |
| GET | `/operators/employees` | Operator | Lấy danh sách nhân viên của nhà xe. |
| POST | `/operators/employees` | Operator | Thêm nhân viên như tài xế, phụ xe hoặc quản lý chuyến. |
| PUT | `/operators/employees/:id` | Operator | Cập nhật thông tin và quyền của nhân viên. |
| PATCH | `/operators/employees/:id/status` | Operator | Khóa/mở khóa tài khoản nhân viên. |

**Khi nào dùng:** Khi nhà xe truy cập dashboard để vận hành kinh doanh hằng ngày.

**Kết quả mong đợi:** Nhà xe nắm được tình hình hoạt động và quản lý được tài nguyên của mình.

#### 12. Nhóm Trip Manager API - Soát Vé Và Quản Lý Chuyến Đang Chạy

Nhóm API này dùng trên trang quản lý chuyến hoặc thiết bị di động của nhân viên. Mục tiêu là kiểm soát danh sách khách, xác thực vé và cập nhật tiến độ chuyến.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/trip-manager/trips` | Trip Manager | Lấy danh sách chuyến được phân công cho nhân viên. |
| GET | `/trip-manager/trips/:id/passengers` | Trip Manager | Xem danh sách hành khách của chuyến, gồm ghế, trạng thái check-in và thông tin liên hệ. |
| POST | `/trip-manager/tickets/scan` | Trip Manager | Gửi dữ liệu QR lên server để xác thực vé. |
| PATCH | `/trip-manager/passengers/:ticketId/check-in` | Trip Manager | Đánh dấu hành khách đã lên xe. |
| PATCH | `/trip-manager/trips/:id/status` | Trip Manager | Cập nhật trạng thái chuyến trong quá trình vận hành. |
| POST | `/trip-manager/trips/:id/incident` | Trip Manager | Ghi nhận sự cố như khách vắng mặt, xe trễ, đổi xe hoặc vấn đề hành lý. |

**Khi nào dùng:** Khi nhân viên bắt đầu ca làm, kiểm tra danh sách khách và quét vé tại điểm đón.

**Kết quả mong đợi:** Hệ thống biết chính xác khách nào đã lên xe, vé nào đã sử dụng và chuyến đang ở trạng thái nào.

#### 13. Nhóm Admin API - Quản Trị Toàn Hệ Thống

Nhóm API này dành cho quản trị viên nền tảng. Admin có quyền cao nhất, nên các API này cần phân quyền chặt chẽ, ghi log thao tác và có cơ chế kiểm soát rủi ro.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/admin/dashboard` | Admin | Xem tổng quan toàn hệ thống: người dùng, nhà xe, doanh thu, booking và lỗi vận hành. |
| GET | `/admin/users` | Admin | Quản lý danh sách người dùng, tìm kiếm, lọc và phân trang. |
| PATCH | `/admin/users/:id/status` | Admin | Khóa hoặc mở khóa tài khoản người dùng. |
| GET | `/admin/operators` | Admin | Xem danh sách nhà xe trên nền tảng. |
| PATCH | `/admin/operators/:id/approve` | Admin | Duyệt nhà xe mới sau khi kiểm tra hồ sơ. |
| PATCH | `/admin/operators/:id/reject` | Admin | Từ chối hồ sơ nhà xe và ghi rõ lý do. |
| GET | `/admin/bookings` | Admin | Tra cứu booking toàn hệ thống để hỗ trợ khách hàng hoặc xử lý khiếu nại. |
| GET | `/admin/payments` | Admin | Theo dõi giao dịch thanh toán, đối soát và xử lý lỗi. |
| GET | `/admin/reports` | Admin | Xuất báo cáo tổng hợp theo thời gian, nhà xe, tuyến hoặc trạng thái. |
| GET | `/admin/audit-logs` | Admin | Xem lịch sử thao tác quan trọng của admin, operator và hệ thống. |

**Khi nào dùng:** Khi đội vận hành cần giám sát nền tảng, duyệt nhà xe, hỗ trợ người dùng hoặc đối soát dữ liệu.

**Kết quả mong đợi:** Admin kiểm soát được chất lượng nền tảng và xử lý được các trường hợp bất thường.

#### 14. Nhóm Notification API - Email, SMS, Thông Báo

Nhóm API này xử lý thông báo cho khách hàng, nhà xe và nhân viên. Thông báo có thể được gửi qua email, SMS, push notification hoặc hiển thị trong ứng dụng.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| GET | `/notifications` | Đã đăng nhập | Lấy danh sách thông báo của tài khoản hiện tại. |
| PATCH | `/notifications/:id/read` | Đã đăng nhập | Đánh dấu một thông báo là đã đọc. |
| PATCH | `/notifications/read-all` | Đã đăng nhập | Đánh dấu toàn bộ thông báo là đã đọc. |
| POST | `/notifications/send` | Admin/System | Gửi thông báo chủ động cho một nhóm người dùng. |
| PUT | `/notifications/preferences` | Đã đăng nhập | Cập nhật tùy chọn nhận thông báo qua email, SMS hoặc push. |

**Khi nào dùng:** Khi có sự kiện như đặt vé thành công, thanh toán thành công, chuyến sắp khởi hành, chuyến bị hủy hoặc có hoàn tiền.

**Kết quả mong đợi:** Người dùng nhận được thông tin đúng lúc và không bỏ lỡ thay đổi quan trọng.

#### 15. Nhóm Upload API - Tải Lên Tệp Và Hình Ảnh

Nhóm API này dùng để tải ảnh đại diện, logo nhà xe, giấy phép kinh doanh, ảnh xe hoặc tài liệu xác minh.

| Method | Endpoint | Quyền truy cập | Mục đích |
|--------|----------|----------------|----------|
| POST | `/uploads/image` | Đã đăng nhập | Tải lên một hình ảnh đơn lẻ như avatar, logo hoặc ảnh xe. |
| POST | `/uploads/documents` | Operator/Admin | Tải lên giấy tờ xác minh của nhà xe. |
| DELETE | `/uploads/:id` | Chủ sở hữu/Admin | Xóa tệp đã tải lên nếu không còn sử dụng. |

**Khi nào dùng:** Khi người dùng cập nhật ảnh đại diện hoặc nhà xe gửi hồ sơ xét duyệt.

**Kết quả mong đợi:** Server lưu tệp lên Cloudinary hoặc storage tương đương và trả về URL để frontend hiển thị.

### Luồng API Nghiệp Vụ Quan Trọng

#### Luồng đặt vé của khách hàng

1. `GET /trips/search` - Khách tìm chuyến theo điểm đi, điểm đến và ngày đi.
2. `GET /trips/:id/seats` - Frontend lấy sơ đồ ghế và tình trạng ghế mới nhất.
3. `POST /bookings` - Khách chọn ghế, nhập thông tin hành khách và tạo booking.
4. `POST /bookings/:id/apply-voucher` - Nếu có mã giảm giá, hệ thống kiểm tra và áp dụng.
5. `POST /payments/create` - Khách chọn phương thức thanh toán và tạo giao dịch.
6. `POST /payments/{gateway}/callback` - Cổng thanh toán báo kết quả về server.
7. `GET /tickets` hoặc `GET /tickets/:id` - Khách xem vé điện tử sau khi thanh toán thành công.

#### Luồng soát vé tại xe

1. `GET /trip-manager/trips` - Nhân viên xem chuyến được phân công.
2. `GET /trip-manager/trips/:id/passengers` - Nhân viên xem danh sách khách của chuyến.
3. `POST /trip-manager/tickets/scan` - Nhân viên quét QR trên vé.
4. `PATCH /trip-manager/passengers/:ticketId/check-in` - Nếu vé hợp lệ, đánh dấu khách đã lên xe.
5. `PATCH /trip-manager/trips/:id/status` - Cập nhật trạng thái chuyến khi bắt đầu, đang chạy hoặc hoàn thành.

#### Luồng nhà xe tạo chuyến

1. `POST /routes` - Nhà xe tạo tuyến đường nếu tuyến chưa có.
2. `POST /buses` - Nhà xe thêm xe và cấu hình sơ đồ ghế.
3. `POST /operators/employees` - Nhà xe thêm tài xế hoặc quản lý chuyến.
4. `POST /trips` - Nhà xe tạo chuyến cụ thể theo tuyến, xe, giờ chạy và giá vé.
5. `GET /operators/dashboard` - Nhà xe theo dõi vé bán và doanh thu của chuyến.

### Mã Trạng Thái Phản Hồi Thường Gặp

| Mã | Ý nghĩa | Khi nào xảy ra |
|----|---------|----------------|
| 200 | Thành công | Request xử lý thành công và có dữ liệu trả về. |
| 201 | Đã tạo mới | Tạo tài khoản, booking, tuyến, xe hoặc chuyến thành công. |
| 400 | Dữ liệu không hợp lệ | Thiếu trường bắt buộc, sai định dạng email, số điện thoại hoặc ngày giờ. |
| 401 | Chưa xác thực | Không gửi token hoặc token không hợp lệ/hết hạn. |
| 403 | Không đủ quyền | Người dùng đăng nhập nhưng không có vai trò phù hợp để gọi API. |
| 404 | Không tìm thấy | Không tồn tại tài nguyên như chuyến, booking, vé hoặc người dùng. |
| 409 | Xung đột dữ liệu | Ghế đã có người khác đặt, mã giảm giá đã hết lượt hoặc dữ liệu bị trùng. |
| 422 | Không thể xử lý nghiệp vụ | Dữ liệu đúng định dạng nhưng không thỏa điều kiện, ví dụ hủy vé quá hạn. |
| 500 | Lỗi server | Có lỗi ngoài dự kiến trong hệ thống backend. |

### Cấu Trúc Response Gợi Ý

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "bookingId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "status": "pending_payment",
    "totalAmount": 720000
  }
}
```

Khi có lỗi:

```json
{
  "success": false,
  "message": "Selected seat is no longer available",
  "errorCode": "SEAT_ALREADY_BOOKED"
}
```

Chi tiết đầy đủ: Xem [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

---

## Sơ Đồ Database

Hệ thống sử dụng MongoDB với các collections chính:

### Các Collection Chính

1. **users** - Khách hàng
2. **busoperators** - Nhà xe
3. **routes** - Tuyến đường
4. **buses** - Phương tiện
5. **trips** - Lịch trình chuyến xe
6. **bookings** - Đặt vé
7. **tickets** - Vé điện tử
8. **payments** - Thanh toán
9. **reviews** - Đánh giá
10. **vouchers** - Mã giảm giá
11. **employees** - Nhân viên

### Sơ Đồ Schema
```
users ────┐
          ├──> bookings ───> tickets ───> payments
trips ────┘                    │
  │                            └──> reviews
  ├── routes
  ├── buses
  ├── busoperators
  └── employees
```

Chi tiết đầy đủ: Xem [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

---

## Kiểm Thử

### Kiểm Thử Backend

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js

# Watch mode
npm run test:watch
```

**Mục Tiêu Độ Phủ Kiểm Thử:** ≥ 70%

### Kiểm Thử Frontend

```bash
cd frontend

# Run all tests
npm test

# Run with UI
npm run test:ui

# Coverage
npm run test:coverage
```

### Kiểm Thử End-to-End (Cypress)

```bash
# Install Cypress
npm install cypress --save-dev

# Open Cypress
npx cypress open

# Run headless
npx cypress run
```

---

## Triển Khai

### Danh Sách Kiểm Tra Sản Xuất

- [ ] Biến môi trường đã được cấu hình
- [ ] Chỉ mục MongoDB đã được tạo
- [ ] Redis đã được cấu hình
- [ ] Chứng chỉ SSL đã được cài đặt
- [ ] CORS đã được cấu hình đúng
- [ ] Giới hạn tốc độ đã được bật
- [ ] Công cụ giám sát đã được thiết lập
- [ ] Chiến lược sao lưu đã có
- [ ] CDN đã được cấu hình (CloudFlare)
- [ ] DNS tên miền đã được cấu hình

### Các Tùy Chọn Triển Khai

#### Tùy Chọn 1: Docker (Khuyến Nghị)

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

#### Tùy Chọn 2: Triển Khai Thủ Công

**Backend (PM2):**
```bash
npm install -g pm2
cd backend
npm run build
pm2 start npm --name "vexenhanh-api" -- start
pm2 save
pm2 startup
```

**Frontend (Nginx):**
```bash
cd frontend
npm run build
# Copy dist/ to /var/www/vexenhanh
sudo cp -r dist/* /var/www/vexenhanh/
```

#### Tùy Chọn 3: Nền Tảng Đám Mây

- **Heroku:** `git push heroku main`
- **Vercel:** Triển khai Frontend
- **AWS:** EC2 + RDS + ElastiCache
- **Google Cloud:** App Engine + Cloud SQL
- **Azure:** App Service + Cosmos DB

Chi tiết: Xem [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Bảo Mật

### Các Biện Pháp Bảo Mật Đã Triển Khai

#### Xác Thực & Phân Quyền
- JWT token có thời hạn
- Mã hóa mật khẩu bcrypt (12 vòng)
- OAuth 2.0 (Google, Facebook)
- Kiểm soát truy cập dựa trên vai trò
- Quản lý phiên (hết hạn 30 phút)
- Xác thực OTP (Email/SMS)

#### Bảo Mật API
- Mã hóa HTTPS/TLS 1.3
- Tiêu đề bảo mật Helmet.js
- CORS được cấu hình đúng
- Giới hạn tốc độ (100 yêu cầu/phút/IP)
- Xác thực đầu vào (express-validator)
- Phòng chống SQL injection (Mongoose)
- Bảo vệ XSS
- Token CSRF

#### Bảo Mật Thanh Toán
- Tuân thủ PCI-DSS
- Không lưu trữ thẻ tín dụng
- Mã hóa cổng thanh toán
- Ghi nhật ký giao dịch

#### Bảo Vệ Dữ Liệu
- Mã hóa dữ liệu nhạy cảm
- Ẩn danh dữ liệu cá nhân
- Sẵn sàng tuân thủ GDPR
- Sao lưu định kỳ

### Thực Hành Bảo Mật Tốt Nhất

```bash
# 1. Update dependencies regularly
npm audit
npm audit fix

# 2. Environment variables security
# Never commit .env files
# Use strong secrets (min 32 chars)

# 3. HTTPS only in production
# Configure SSL certificates

# 4. Monitor logs for suspicious activity
# Use tools like Sentry, LogRocket
```

---

## Hiệu Năng

### Tối Ưu Hóa Hiệu Năng

#### Backend
- Đánh chỉ mục cơ sở dữ liệu cho truy vấn thường xuyên
- Bộ nhớ đệm Redis (tình trạng ghế, phiên)
- Gộp kết nối (MongoDB, Redis)
- Tối ưu hóa truy vấn (giới hạn, chọn trường)
- Phân trang cho tập dữ liệu lớn
- Nén dữ liệu (gzip)
- CDN cho tài nguyên tĩnh (CloudFlare)

#### Frontend
- Chia tách mã (React.lazy, Suspense)
- Tải hình ảnh lười biếng
- Ghi nhớ (React.memo, useMemo)
- Cuộn ảo cho danh sách dài
- Debouncing đầu vào tìm kiếm
- Service Worker (PWA)
- Tối ưu hóa tài nguyên (hình ảnh, font)

### Mục Tiêu Hiệu Năng

| Chỉ số | Mục tiêu | Hiện tại |
|--------|--------|---------|
| Thời gian tải trang | ≤ 2s | 1.8s |
| Thời gian phản hồi API | ≤ 200ms | 150ms |
| Truy vấn tìm kiếm | ≤ 3s | 2.5s |
| Xử lý thanh toán | ≤ 5s | 4s |
| Thời gian hoạt động | ≥ 99.9% | 99.95% |

### Công Cụ Giám Sát
- **New Relic** - Giám sát hiệu năng ứng dụng
- **Google Analytics** - Phân tích người dùng
- **Sentry** - Theo dõi lỗi
- **Prometheus + Grafana** - Số liệu

---

## Xử Lý Sự Cố

### Các Vấn Đề Thường Gặp

#### 1. Kết Nối MongoDB Thất Bại
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string
echo $MONGODB_URI
```

#### 2. Kết Nối Redis Thất Bại
```bash
# Check Redis status
redis-cli ping

# Start Redis
sudo systemctl start redis
```

#### 3. Cổng Đang Được Sử Dụng
```bash
# Find process using port 5500
lsof -i :5500

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5501
```

#### 4. Frontend Không Thể Kết Nối Backend
- Kiểm tra cấu hình CORS trong backend
- Xác minh VITE_API_URL trong frontend .env
- Kiểm tra backend có đang chạy không

#### 5. Lỗi Cổng Thanh Toán
- Xác minh khóa API trong .env
- Kiểm tra URL callback
- Xem lại nhật ký cổng thanh toán

### Chế Độ Debug

```bash
# Backend debug mode
DEBUG=* npm run dev

# Frontend debug mode
VITE_DEBUG=true npm run dev
```

### Vị Trí Nhật Ký

```bash
# Backend logs
tail -f backend/logs/application-YYYY-MM-DD.log

# PM2 logs
pm2 logs vexenhanh-api

# Docker logs
docker logs vexenhanh-backend
```

---





