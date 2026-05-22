# CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI

## 1.1. Mô tả bài toán và lý do chọn đề tài

## 1.2. Mục tiêu của hệ thống

## 1.3. Đối tượng sử dụng hệ thống

## 1.4. Phạm vi đề tài

### 1.4.1. Phạm vi dành cho khách hàng

### 1.4.2. Phạm vi dành cho nhà xe

### 1.4.3. Phạm vi dành cho nhân viên nhà xe

### 1.4.4. Phạm vi dành cho quản trị viên

## 1.5. Ý nghĩa thực tiễn của đề tài

# CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG

## 2.1. Cơ sở lý thuyết

### 2.1.1. Tổng quan về hệ thống đặt vé xe khách trực tuyến

### 2.1.2. Mô hình marketplace trong hệ thống đặt vé

### 2.1.3. Quy trình đặt vé và thanh toán trực tuyến

### 2.1.4. Mô hình phân quyền theo vai trò

### 2.1.5. Vé điện tử và mã QR trong soát vé

## 2.2. Công nghệ sử dụng

### 2.2.1. Công nghệ Frontend

### 2.2.2. Công nghệ Backend

### 2.2.3. Cơ sở dữ liệu

### 2.2.4. Công nghệ hỗ trợ thanh toán

### 2.2.5. Công nghệ kiểm thử và triển khai

# CHƯƠNG 3. PHÂN TÍCH HỆ THỐNG

## 3.1. Khảo sát hiện trạng

## 3.2. Xác định yêu cầu hệ thống

### 3.2.1. Yêu cầu chức năng

### 3.2.2. Yêu cầu phi chức năng

## 3.3. Actor của hệ thống

### 3.3.1. Khách vãng lai

### 3.3.2. Khách hàng

### 3.3.3. Nhà xe

### 3.3.4. Nhân viên nhà xe

### 3.3.5. Quản trị viên hệ thống

## 3.4. Phân tích chức năng hệ thống

### 3.4.1. Chức năng dành cho khách vãng lai

### 3.4.2. Chức năng dành cho khách hàng

### 3.4.3. Chức năng dành cho nhà xe

### 3.4.4. Chức năng dành cho nhân viên nhà xe

### 3.4.5. Chức năng dành cho quản trị viên

## 3.5. Sơ đồ Use Case tổng quan

## 3.6. Đặc tả Use Case tổng quan

### 3.6.1. Tác nhân tham gia

### 3.6.2. Danh sách chức năng chính trong Use Case tổng quan

### 3.6.3. Mô tả luồng tương tác tổng quát

# CHƯƠNG 4. QUY TẮC NGHIỆP VỤ VÀ VẬN HÀNH HỆ THỐNG

## 4.1. Quy tắc nghiệp vụ của hệ thống

### 4.1.1. Quy tắc tìm kiếm chuyến xe

### 4.1.2. Quy tắc chọn ghế và giữ ghế

### 4.1.3. Quy tắc tạo booking

### 4.1.4. Quy tắc thanh toán

### 4.1.5. Quy tắc phát hành vé điện tử

### 4.1.6. Quy tắc hủy vé và hoàn tiền

### 4.1.7. Quy tắc quản lý chuyến xe

## 4.2. Quy tắc phân quyền chức năng

### 4.2.1. Phân quyền khách vãng lai

### 4.2.2. Phân quyền khách hàng

### 4.2.3. Phân quyền nhà xe

### 4.2.4. Phân quyền nhân viên nhà xe

### 4.2.5. Phân quyền quản trị viên

## 4.3. Trạng thái dữ liệu quan trọng

### 4.3.1. Trạng thái booking

### 4.3.2. Trạng thái vé

### 4.3.3. Trạng thái thanh toán

### 4.3.4. Trạng thái chuyến xe

### 4.3.5. Trạng thái khiếu nại

## 4.4. Quy tắc thông báo hệ thống

## 4.5. Tiêu chí nghiệm thu hệ thống

## 4.6. Rủi ro và biện pháp giảm thiểu

# CHƯƠNG 5. THIẾT KẾ HỆ THỐNG

## 5.1. Kiến trúc tổng thể hệ thống

## 5.2. Mô hình phân tầng của hệ thống

### 5.2.1. Tầng giao diện người dùng

### 5.2.2. Tầng xử lý nghiệp vụ

### 5.2.3. Tầng dữ liệu

### 5.2.4. Tầng tích hợp dịch vụ ngoài

## 5.3. Thiết kế luồng nghiệp vụ chính

### 5.3.1. Luồng đăng ký và đăng nhập

### 5.3.2. Luồng tìm kiếm chuyến xe

### 5.3.3. Luồng chọn ghế và giữ ghế

### 5.3.4. Luồng đặt vé và thanh toán

### 5.3.5. Luồng phát hành vé điện tử

### 5.3.6. Luồng quét QR và xác nhận hành khách

### 5.3.7. Luồng hủy vé và hoàn tiền

## 5.4. Sơ đồ trình tự quy trình đặt vé và thanh toán

## 5.5. Sơ đồ hoạt động quy trình đặt vé

## 5.7. Thiết kế API/Route chính

# CHƯƠNG 6. THIẾT KẾ CƠ SỞ DỮ LIỆU

## 6.1. Tổng quan cơ sở dữ liệu

## 6.2. Mô hình dữ liệu mức cao

### 6.2.1. Nguyên tắc thiết kế dữ liệu

### 6.2.2. Các nhóm thực thể dữ liệu chính

### 6.2.3. Quan hệ dữ liệu chính

### 6.2.4. Dữ liệu snapshot quan trọng

## 6.4. Mô tả các collection chính

### 6.4.1. Collection User

### 6.4.2. Collection BusOperator

### 6.4.3. Collection Route

### 6.4.4. Collection StopPoint

### 6.4.5. Collection Bus

### 6.4.6. Collection Employee

### 6.4.7. Collection Trip

### 6.4.8. Collection Booking

### 6.4.9. Collection Ticket

### 6.4.10. Collection Payment

### 6.4.11. Collection Voucher

### 6.4.12. Collection Review

### 6.4.13. Collection Complaint

### 6.4.14. Collection Banner, Blog, FAQ

## 6.5. Quan hệ giữa các collection

## 6.6. Ràng buộc toàn vẹn dữ liệu

# CHƯƠNG 7. THIẾT KẾ GIAO DIỆN

## 7.1. Giao diện dành cho khách hàng

### 7.1.1. Giao diện trang chủ

### 7.1.2. Giao diện tìm kiếm chuyến xe

### 7.1.3. Giao diện danh sách chuyến xe

### 7.1.4. Giao diện chi tiết chuyến xe

### 7.1.5. Giao diện chọn ghế

### 7.1.6. Giao diện nhập thông tin hành khách

### 7.1.7. Giao diện thanh toán

### 7.1.8. Giao diện vé của tôi

### 7.1.9. Giao diện tra cứu vé

### 7.1.10. Giao diện hủy vé/khiếu nại

## 7.2. Giao diện dành cho nhà xe

### 7.2.1. Giao diện dashboard nhà xe

### 7.2.2. Giao diện quản lý tuyến đường

### 7.2.3. Giao diện quản lý điểm dừng

### 7.2.4. Giao diện quản lý xe

### 7.2.5. Giao diện quản lý chuyến xe

### 7.2.6. Giao diện quản lý nhân viên

### 7.2.7. Giao diện quản lý doanh thu và báo cáo

## 7.3. Giao diện dành cho nhân viên nhà xe

### 7.3.1. Giao diện dashboard nhân viên

### 7.3.2. Giao diện chuyến được phân công

### 7.3.3. Giao diện danh sách hành khách

### 7.3.4. Giao diện quét mã QR

## 7.4. Giao diện dành cho quản trị viên

### 7.4.1. Giao diện dashboard quản trị

### 7.4.2. Giao diện quản lý người dùng

### 7.4.3. Giao diện quản lý nhà xe

### 7.4.4. Giao diện quản lý chuyến xe

### 7.4.5. Giao diện quản lý giao dịch

### 7.4.6. Giao diện quản lý khiếu nại

### 7.4.7. Giao diện quản lý nội dung

# CHƯƠNG 8. KIỂM THỬ HỆ THỐNG

## 8.1. Mục tiêu kiểm thử

## 8.2. Phạm vi kiểm thử

## 8.3. Phương pháp kiểm thử

## 8.4. Bảng test case

### 8.4.1. Test case đăng nhập

### 8.4.2. Test case tìm kiếm chuyến xe

### 8.4.3. Test case chọn ghế

### 8.4.4. Test case đặt vé

### 8.4.5. Test case thanh toán

### 8.4.6. Test case tra cứu vé

### 8.4.7. Test case hủy vé

### 8.4.8. Test case quản lý chuyến xe

### 8.4.9. Test case quét mã QR

## 8.5. Kết quả kiểm thử

## 8.6. Đánh giá kết quả kiểm thử

# CHƯƠNG 9. ĐÁNH GIÁ KẾT QUẢ VÀ HƯỚNG PHÁT TRIỂN

## 9.1. Kết quả đạt được

## 9.2. Ưu điểm của hệ thống

## 9.3. Hạn chế của hệ thống

## 9.4. Hướng phát triển trong tương lai
