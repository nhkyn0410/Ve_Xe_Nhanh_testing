# Checklist nâng cấp frontend Vé Xe Nhanh

Mục tiêu: nâng cấp `frontend/` theo thiết kế trong `Vé Xe Nhanh/`, giữ nguyên luồng nghiệp vụ và API production hiện có.

Nguồn tham chiếu chính:

- `reverse_engineer.md` - kiến trúc tổng quan, actor, API, testing, deployment.
- `Vé Xe Nhanh/` - prototype customer redesign, design tokens, fonts, icons, assets, screen flows.
- `frontend/` - React/Vite/Tailwind/Ant Design production app cần nâng cấp.

## Nguyên tắc theo dõi

- `[ ]` Chưa làm.
- `[~]` Đang làm hoặc đã có một phần.
- `[x]` Hoàn tất và đã kiểm chứng.
- Mỗi mục hoàn tất nên ghi file chính đã chỉnh và lệnh kiểm chứng đã chạy.
- Không đánh dấu hoàn tất nếu chỉ port giao diện nhưng làm hỏng API, store, route hoặc auth guard.

## 0. Khảo sát và chốt phạm vi

- [x] Đọc `reverse_engineer.md` để nắm kiến trúc 4 web app: Customer, Operator, Trip Manager, Admin.
- [x] Xác định frontend production là React 18 + Vite + Tailwind + Ant Design + Zustand + React Router.
- [x] Xác định `Vé Xe Nhanh/` là prototype chạy bằng HTML, UMD React, Babel, global component và mock data.
- [x] Xác định không copy nguyên design canvas vào production.
- [x] Chốt phạm vi đợt 1: ưu tiên customer web trước operator/admin/trip-manager.
- [x] Chốt danh sách màn hình customer phải nâng cấp trong milestone đầu.

## 1. Design system và asset nền

- [x] Copy fonts Be Vietnam Pro từ `Vé Xe Nhanh/design-system/fonts/` sang `frontend/src/assets/fonts/` - đã copy 18 file `.ttf`.
- [x] Copy logo, hero image và icon cần thiết từ `Vé Xe Nhanh/design-system/assets/` - đã copy 16 asset vào `frontend/src/assets/brand/` và `frontend/src/assets/icons/vxn/`.
- [x] Thêm `@font-face` Be Vietnam Pro vào CSS production - khai báo đủ 18 weight/style trong `frontend/src/index.css`.
- [x] Cập nhật `frontend/src/styles/design-system.js` từ red/purple theme sang teal/saffron/neutral VXN.
- [x] Cập nhật Tailwind config để expose màu `vxn-teal`, `vxn-saffron`, `vxn-bg`, `vxn-border`.
- [x] Cập nhật Ant Design theme trong `ThemeProvider` theo token VXN.
- [x] Dọn hoặc sửa các utility gradient cũ đang hard-code blue/red/purple - đã đổi utility gradient/spinner/progress/table action sang token VXN.
- [x] Sửa lỗi comment CSS trong `frontend/src/styles/custom.css`.
- [ ] Kiểm tra màu, contrast và font trên Chrome desktop - môi trường hiện không có Chrome/Chromium headless để xác nhận bằng trình duyệt.
- [x] Kiểm tra build không lỗi sau khi đổi token - `npm run build` trong `frontend/` thành công.

## 2. Layout customer chung

- [x] Hợp nhất hai `CustomerLayout` trùng vai trò trong `frontend/src/components/customer/` và `frontend/src/components/layouts/` - `components/layouts/CustomerLayout.jsx` re-export layout canonical từ `components/customer/CustomerLayout.jsx`.
- [x] Thiết kế lại customer chrome theo brand VXN: sidebar trái 256px, logo, nav, auth state, mobile drawer - thêm `components/customer/CustomerShell.jsx`; `npm run build` trong `frontend/` thành công.
- [x] Hiển thị `CustomerFooter` qua `CustomerShell` cho mọi trang customer mặc định; `NewHomePage.jsx` không còn footer cục bộ và page đặc biệt có thể ẩn bằng `hideFooter` - lint riêng footer/layout pass, `npm.cmd run build` trong `frontend/` thành công.
- [x] Tạo primitives dùng chung: `VxnButton`, `VxnCard`, `VxnChip`, `VxnPageHeader`, `VxnFieldShell` nếu thật sự giảm lặp - chưa tạo abstraction mới vì layout/home hiện tại chưa đủ lặp để đáng tách.
- [x] Dùng icon library hiện có thay vì nhúng global SVG từ prototype khi phù hợp - dùng Ant Design Icons trong header, footer và home.
- [~] Bảo đảm header/footer không che nội dung ở mobile - đã dùng responsive classes và drawer; footer đã đổi sang nền sáng xanh nhạt, bỏ chip ngôn ngữ `VI`, tăng logo và cân lại cỡ chữ; cần kiểm tra trực quan trên Chrome/mobile viewport.
- [x] Bảo đảm các trang customer vẫn giữ route hiện có - giữ `/`, `/trips`, `/search-results`, `/tickets/lookup`, auth/user routes; `npm run build` thành công.
- [~] Tách sidebar customer theo route mới: `/kham-pha` cho Khám phá, `/` và `/mua-ve` cho Mua vé, `/dich-vu-bo-tro` cho Dịch vụ bổ trợ, `/my-tickets` cho Hành trình; build chưa xác nhận được do lỗi Node/WSL 1 trong môi trường hiện tại.
- [~] Đồng bộ breadcrumb customer - thêm `CustomerBreadcrumb.jsx` dùng chung, thay breadcrumb thủ công trên các trang content, booking, vé, tài khoản và payment; đã bổ sung box menu hover cho breadcrumb `Tài khoản`; build chưa xác nhận được do lỗi Node/WSL 1 trong môi trường hiện tại.
- [~] Kiểm chứng trạng thái đăng nhập/đăng xuất và user menu - logic `authStore`/logout được giữ, cần click test với session thật.

## 3. Trang chủ và tìm kiếm

- [x] Fetch bundle từ Claude Design URL, đọc `README.md`, `chats/chat1.md`, `project/Vé Xe Nhanh.html` và các imports chính trước khi implement.
- [x] Nâng cấp `NewHomePage.jsx` theo prototype `HomeScreen` - đã đổi sang page frame có sidebar trái, hero top utility, search card nổi, các section đúng cấu trúc prototype và cân lại thang chữ cho route/operator/promo/content sections.
- [x] Dùng hero image thật từ prototype thay cho nền gradient/orb - dùng `frontend/src/assets/brand/hero-landscape.jpg` cho hero và route card nổi bật.
- [x] Cố định hero theo chiều cao viewport để search card không bị cắt trên màn hình thấp - `NewHomePage.jsx` dùng `lg:h-[100svh]`, search card `lg:bottom-6` nằm trong hero và không lấn section Tuyến phổ biến; `docker compose up -d --build frontend` build thành công.
- [x] Bỏ tự động nhập sẵn điểm đi/điểm đến trong search card - `initialValues` không còn set `fromCity/toCity`; chỉ giữ placeholder và validation bắt buộc.
- [x] Port search overlay card: điểm đi, điểm đến, ngày đi, đổi chiều, số khách, submit - giữ Ant Design Form/AutoComplete/DatePicker/Select nhưng style lại theo field shell của prototype.
- [x] Giữ logic `setSearchCriteria` và navigate `/search-results` - submit map về `{ fromCity, toCity, date, passengers }`, giới hạn khách theo rule hiện có.
- [x] Thêm tuyến phổ biến, lý do chọn VXN, nhà xe đối tác theo UI mới - thêm layout route card lớn/nhỏ, value props, operators và promo/blog strip.
- [x] Gắn ảnh thật cho ba bài trong mục `Cẩm nang xe khách` trên `NewHomePage.jsx`: mẹo chọn ghế, phở dọc QL1 và quy định hành lý; `npm.cmd run build` trong `frontend/` thành công.
- [x] Gắn ảnh nền cho các tuyến phổ biến bằng `frontend/src/assets/img/`; route card tự dùng ảnh làm background khi route có field `image`.
- [x] Thay mock route card bằng dữ liệu API nếu endpoint sẵn có; nếu chưa có thì tách rõ fallback - tách rõ `popularRoutesFallback` và `operatorFallback`, chưa gọi API mới vì production app chưa có endpoint homepage riêng.
- [~] Kiểm tra validation form: thiếu điểm đi/đến/ngày đi - Ant Design rules và toast đã giữ, cần click test trên trình duyệt.
- [~] Kiểm tra responsive desktop/tablet/mobile - layout đã dùng responsive grid/classes, cần kiểm tra trực quan trên Chrome/mobile viewport.

## 4. Danh sách chuyến

- [~] Nâng cấp `TripsPage.jsx` theo prototype `SearchResultsScreen` - đã tách `/trips` thành trang bộ lọc tổng hiển thị toàn bộ chuyến tương lai, chưa hoàn tất visual full prototype.
- [ ] Giữ API `searchTrips`, filter, sort, pagination hiện có.
- [~] Tách trip normalization ra helper để tránh lặp và dễ test - hiện vẫn là helper nội bộ trong `TripsPage.jsx`, chưa tách file riêng.
- [~] Port trip result card: timeline, operator, rating, amenities, seat left, price, CTA - đã sửa để mọi chuyến trong `/trips` và `/search-results` đều hiển thị đầy đủ phần lịch trình/tiện ích, không chỉ item đầu tiên; thiết kế lại card gọn hơn với operator/timeline/price tách rõ, CTA nằm cùng cột giá ở hàng đáy, chữ timeline tăng cỡ khoảng 25%, số ghế còn nằm cạnh giá, tiện ích dạng icon + label lớn hơn; chính sách đã chuyển sang `TripDetailPage.jsx`.
- [x] Hiển thị đầy đủ điểm dừng trung gian trên trip card - `TripsPage.jsx` đọc `route.stops`, sắp xếp theo `order`, tính giờ theo `estimatedArrivalMinutes` và render timeline đầy đủ; `npm.cmd run build` trong `frontend/` thành công.
- [~] Đồng bộ hiển thị số ghế thực tế trên trip card/detail/seat selection - thêm `utils/seatAvailability.js` để tính ghế trống từ `seatLayout.layout`, `bookedSeats`, `lockedSeats`, rồi merge vào `TripsPage.jsx`, `TripDetailPage.jsx`, `SeatSelectionPage.jsx`; cần smoke test với chuyến có ghế đang giữ/đã đặt.
- [~] Thiết kế lại filter panel: khoảng giá, loại xe, nhà xe, giờ đi, tiện ích - thêm bộ lọc tổng điểm đi/điểm đến/khoảng ngày và sticky heading ở `TripsPage.jsx`.
- [~] Chuẩn hóa tên hiển thị nhà xe qua `operatorName || companyName` trên các màn customer/admin/operator chính; backend đã thêm field `operatorName` cho `BusOperator`.
- [~] Điều chỉnh filter aside của `TripsPage.jsx` để không đổi vị trí/chiều cao bất thường khi scroll/chọn filter - đã reserve scrollbar viewport trong `frontend/src/index.css`; sticky offset của sidebar giữ đúng bằng chiều cao search bar (`114px` desktop rộng, `198px` desktop hẹp) để không nhảy 24px giữa trạng thái sticky và normal flow; cần smoke test trực quan trên desktop/tablet.
- [ ] Hiển thị loading/empty/error theo style VXN.
- [~] Không làm mất route `/trips` và `/search-results` - `/trips` browse all, `/search-results` vẫn đọc search từ booking store; build chưa xác nhận được do lỗi Node/WSL 1.
- [ ] Kiểm tra chọn chuyến dẫn đúng `/trips/:tripId`.

## 5. Chi tiết chuyến và chọn ghế

- [~] Nâng cấp `TripDetailPage.jsx` theo prototype `TripDetailScreen` - đã bổ sung timeline start → stops → destination, thêm `RouteMiniMap` cho bản đồ lộ trình có Google Maps Embed optional qua `VITE_GOOGLE_MAPS_EMBED_API_KEY` và fallback sơ đồ tuyến nội bộ; còn cần smoke test trực quan với dữ liệu thật nhiều điểm dừng.
- [ ] Giữ API `getTripDetails` và `getAvailableSeats`.
- [ ] Giữ store booking: `selectedTrip`, `selectedSeats`, pickup, dropoff.
- [~] Làm sticky breadcrumb/booking stepper cho `TripDetailPage.jsx`, `SeatSelectionPage.jsx` và `PassengerInfoPage.jsx`; đã chỉnh offset desktop/mobile, sticky summary bên phải và căn giữa riêng hàng stepper không bao gồm breadcrumb.
- [ ] Nâng cấp `SeatMapComponent.jsx` theo visual sleeper bus hai tầng trong prototype.
- [ ] Giữ logic không chọn ghế đã booked/held và giới hạn số ghế.
- [~] Thêm legend ghế rõ ràng: trống, đang chọn, đang giữ, đã đặt - đã đồng bộ ghế `held` trong `SeatMapComponent.jsx` sang nền/viền vàng như legend và bỏ overlay ổ khóa.
- [ ] Thiết kế lại pickup/dropoff selector theo card/timeline.
- [ ] Thiết kế sticky booking summary bên phải trên desktop.
- [ ] Bảo đảm mobile vẫn thao tác được chọn ghế và CTA.
- [ ] Kiểm tra dữ liệu seatLayout từ backend với nhiều loại xe.

## 6. Passenger info, booking confirmation, payment

- [ ] Nâng cấp `PassengerInfoPage.jsx` theo prototype `PassengerInfoScreen`.
- [~] Giữ validation passenger, phone, email, id card nếu đang có - đã sửa `PassengerInfoPage.jsx` để checkbox "Người liên hệ là hành khách 1" tự sync contact sang hành khách 1 và không bắt required riêng cho hành khách 1.
- [ ] Tích hợp saved passengers nếu API/store đã có.
- [~] Nâng cấp `BookingConfirmationPage.jsx` theo payment/summary style mới - đã thêm bản đồ nhỏ cho điểm đón/trả bằng `RouteMiniMap`, giữ link chỉ đường Google Maps hiện có; chưa nâng cấp toàn bộ visual payment summary.
- [~] Cân lại sidebar xác nhận vé: giảm padding/cỡ chữ card liên hệ nhà xe, điểm đón-trả và thêm chế độ compact cho `RouteMiniMap`; cần smoke test responsive.
- [~] Chỉnh card sidebar xác nhận vé chỉ hiển thị điểm đón, nút chỉ đường và bản đồ vuông; ưu tiên OpenStreetMap cho vị trí lên xe, fallback sơ đồ tuyến khi thiếu tọa độ.
- [~] Giữ luồng tạo booking và payment hiện có - đã thiết kế lại bước chọn phương thức thanh toán trong `PassengerInfoPage.jsx` theo layout phương thức/ngân hàng/tóm tắt đơn; vẫn gọi `createPayment` endpoint hiện có và map online methods qua VNPay.
- [x] Gắn logo thật cho payment method và bank selector trong `PassengerInfoPage.jsx` từ `frontend/src/assets/payment-logos/` và `payment-logos/banks/`; đã chỉnh riêng VIB để logo không bị cắt, cân lại kích thước logo ATM và logo Tiền mặt để không tràn viền trong card thanh toán; đã bỏ chữ dưới logo ngân hàng và căn giữa đều logo trong từng ô; `npm.cmd run build` trong `frontend/` thành công.
- [ ] Nâng cấp các trang `VNPayReturn`, `BookingSuccess`, `BookingFailure`.
- [ ] Bảo đảm callback payment không bị đổi route ngoài `App.jsx`.
- [ ] Kiểm tra happy path: search -> trip detail -> seat -> passenger -> payment.
- [ ] Kiểm tra failure path: hết ghế, hold timeout, payment fail.

## 7. Vé điện tử và khách không đăng nhập

- [ ] Nâng cấp `MyTicketsPage.jsx` theo prototype `MyTicketsScreen`.
- [ ] Nâng cấp ticket detail/QR nếu route hoặc component hiện có hỗ trợ.
- [~] Cân lại `SaffronTicketCard`: căn giữa khung khởi hành/đến nơi, tăng padding và sửa fallback biển số xe từ `busNumber`; cần smoke test trên `/my-tickets` và `/tickets/lookup`.
- [~] Chuẩn hóa nhãn loại xe customer-facing qua `formatBusType` để enum backend như `sleeper`, `seater`, `double_decker` hiển thị tiếng Việt; cần kiểm tra trực quan các trang vé và chuyến.
- [ ] Nâng cấp `GuestTicketLookupPage.jsx` theo prototype `GuestLookupScreen`.
- [ ] Nâng cấp `CancelTicketPage.jsx` theo prototype `GuestCancelScreen` và policy hiện có.
- [~] Giữ API ticket lookup, OTP, cancel, download PDF, QR - đã sửa `GuestTicketLookupPage.jsx` không gửi field phone/email rỗng, normalize phone, chấp nhận `0...`, `+84...`, `84...`, hiển thị lỗi backend dạng string; backend `ticket.routes.js` bỏ qua field rỗng, normalize phone trước validate, `ticket.service.js` lookup các format phone tương đương để tránh 400 khi nhập số có khoảng trắng/khác format lưu; `bookings/code/:bookingCode` nay nhận `phone` hoặc `email` để luồng OTP email mở chi tiết booking không bị 400.
- [ ] Hiển thị trạng thái vé: valid, used, cancelled, refund processing.
- [ ] Kiểm tra quyền xem vé: customer chỉ xem vé của mình, guest qua OTP.

## 8. Tài khoản, loyalty, review, complaint

- [~] Nâng cấp `ProfilePage.jsx` theo prototype `ProfileScreen` - bổ sung box lối tắt tiện ích tài khoản, gắn menu tài khoản dùng chung trong breadcrumb và hỗ trợ nhảy đến phần hành khách đã lưu qua hash.
- [ ] Nâng cấp `LoyaltyOverviewPage.jsx` và `LoyaltyHistoryPage.jsx`.
- [ ] Nâng cấp `MyReviewsPage.jsx` và modal tạo review.
- [ ] Nâng cấp `MyComplaintsPage.jsx`, `ComplaintDetailPage.jsx`, complaint modal.
- [ ] Giữ auth guard `ProtectedRoute allowedRoles={['customer']}`.
- [ ] Giữ API user, loyalty, review, complaint hiện có.
- [ ] Mask PII khi hiển thị CCCD, phone, email theo context phù hợp.
- [ ] Kiểm tra empty state và error state cho từng tab.

## 9. Content và auth customer

- [x] Gắn featured image cho bài `top-quan-pho-bo-doc-ql1` sang URL Long Phương trong `backend/scripts/seedContent.js`; `node --check backend/scripts/seedContent.js` thành công, frontend `NewsPage`/`BlogCard` đọc ảnh từ `featuredImage`.
- [x] Gắn featured image theo bài cho `quy-dinh-hanh-ly-xe-khach-2026`, `sapa-mua-he-5-cung-trekking-nhe`, `khuyen-mai-he-vxn-2026`, `limousine-vs-giuong-nam-chon-loai-nao`, `san-ve-tet-2027-checklist-6-buoc`, `vxn-ra-mat-12-tuyen-mien-tay` trong `backend/scripts/seedContent.js`.
- [x] Đổi hero image khu vực "Đi xa hơn với mỗi hành trình" trong `NewsPage.jsx` sang ảnh Lang Biang Đà Lạt; `npm.cmd run build` trong `frontend/` thành công.
- [~] Tạo skeleton `ExplorePage.jsx` cho `/kham-pha` với TODO cho tin tức, chuyến phổ biến, nhà xe nổi bật và chương trình; chưa có thiết kế/data contract chính thức.
- [~] Tạo skeleton `AddonsPage.jsx` cho `/dich-vu-bo-tro` để sidebar không trỏ nhầm sang Thành viên; chưa kích hoạt mua add-on ngoài booking flow.
- [ ] Nâng cấp `NewsPage.jsx` theo prototype blog list/detail/FAQ.
- [ ] Nếu chưa có route FAQ/blog-detail, tạo route rõ ràng hoặc giữ trong NewsPage theo scope.
- [~] Nâng cấp `CustomerLoginPage.jsx` theo prototype `LoginScreen` - auth shell đã thêm nút về trang chủ và tăng kích thước logo; chưa nâng cấp toàn bộ visual form.
- [~] Nâng cấp `CustomerRegisterPage.jsx` theo prototype `RegisterScreen` - dùng chung auth shell đã có nút về trang chủ và logo lớn hơn; chưa nâng cấp toàn bộ visual form.
- [ ] Không phá logic login/register hiện có với `authStore`.
- [~] Cân lại `AdminLoginPage.jsx`: dùng logo VXN chính thức, bỏ ghi nhớ máy/quên mật khẩu khỏi form và đưa trạng thái TLS vào giữa form; cần smoke test đăng nhập admin.
- [ ] Giữ social login ở trạng thái đang phát triển nếu backend chưa hỗ trợ.
- [ ] Kiểm tra redirect sau đăng nhập từ protected route.

## 10. Operator, trip manager, admin sau customer

- [ ] Đánh giá có áp dụng toàn bộ VXN tokens cho operator/admin hay chỉ harmonize nhẹ.
- [ ] Không làm mất tính dense dashboard của operator/admin.
- [ ] Kiểm tra operator tenant boundary: mọi thao tác operator vẫn qua API hiện có.
- [x] Thêm CRUD danh mục điểm dừng cho operator và đổi form tuyến sang chọn điểm có sẵn - backend thêm `StopPoint` + `/operators/stops` CRUD, route snapshot thêm `stopId`; frontend `/operator/stops` tạo/sửa/xóa điểm dừng và `RoutesPage.jsx` chọn nhiều điểm lên xe, xuống xe, điểm dừng giữa hành trình từ catalog. `npm run build` trong `frontend/` thành công; `node.exe -c` pass cho các file backend mới.
- [x] Thêm seed khoảng 200 điểm dừng cho catalog operator - `backend/scripts/seedStopPoints.js` upsert idempotent vào `stop_points`, phân bổ theo các nhà xe approved hiện có; thêm script `npm run seed:stops`; `node.exe -c backend/scripts/seedStopPoints.js` pass; đã chạy seed local vào MongoDB `vexenhanh` ngày 2026-05-21 với 200 điểm dừng.
- [~] Tách seed nhà xe, tuyến đường và nhân viên thành các script riêng - thêm `backend/scripts/seedBusOperators.js`, `backend/scripts/seedRoutes.js`, `backend/scripts/seedEmployees.js` và npm scripts `seed:operators`, `seed:routes`, `seed:employees`; route seed lấy pickup/dropoff/stops từ `stop_points`, `seedStopPoints.js` ưu tiên nhà xe seed khi phân điểm; `node --check` pass cho 4 script liên quan, ESLint/Prettier pass cho 3 script mới; cần chạy seed thực tế để xác nhận dữ liệu DB.
- [~] Thêm seed xe và chuyến xe tách riêng - `backend/scripts/seedBuses.js` tạo xe cho nhà xe seed, `backend/scripts/seedTrips.js` tạo mặc định 15 chuyến từ 22/05/2026 đến 30/06/2026, lấy tuyến/xe/tài xế/quản lý chuyến cùng `operatorId`; thêm npm scripts `seed:buses`, `seed:trips`; `node --check`, ESLint và Prettier pass cho 2 script mới; cần chạy seed thực tế để xác nhận dữ liệu DB.
- [x] Thêm seed customer lịch sử chuyến đi - `backend/scripts/seedCustomerHistory.js` tạo user `customer.history@vexenhanh.vn` có booking/ticket/payment/review cho các chuyến đã đi và 5000 điểm thành viên; `node --check scripts/seedCustomerHistory.js`, `npm run seed:customer-history:dns` và query xác nhận DB pass.
- [x] Thêm seed customer có lịch sử khiếu nại - `backend/scripts/seedComplaintCustomer.js` tạo user `customer.complaints@vexenhanh.vn` với các khiếu nại open/in_progress/resolved; `node --check scripts/seedComplaintCustomer.js`, `npm run seed:complaint-customer:dns` và query xác nhận DB pass.
- [x] Nâng UI `/operator/stops` với bản đồ Leaflet hiển thị toàn bộ điểm dừng có tọa độ, panel thống kê tổng hợp bên phải và bảng danh sách giữ bên dưới; frontend gom nhiều trang API để tránh thiếu điểm trên map; `npm run build` trong `frontend/` thành công.
- [x] Tinh chỉnh bản đồ `/operator/stops`: bật wheel/touch/double-click zoom, chuyển nút zoom sang góc phải với kích thước lớn hơn và thêm thước tỷ lệ; `npm run build` trong `frontend/` thành công.
- [~] Bỏ nút hủy chuyến khỏi `TripManagerDashboard.jsx`; cần smoke test route `/trip-manager/dashboard` với tài khoản trip-manager.
- [x] Sửa luồng soát vé QR thanh toán tiền mặt: khi nhân viên xác nhận đã nhận tiền, backend cập nhật cả `Booking.paymentStatus=paid` và `Payment.status=completed`, đồng thời tự đồng bộ lại cash payment nếu vé đã dùng nhưng payment còn pending; đã backfill local 1 giao dịch cash bị lệch `pending / booking:paid`.
- [x] Bổ sung summary soát vé QR cho vé tiền mặt và vé đã thanh toán trong `QRScannerPage.jsx`: hiển thị khách liên hệ, hành khách/ghế, chuyến/điểm đón trả, trạng thái thanh toán và số tiền cần thu/đã thu; SĐT hiển thị dạng mask; `npx eslint src/pages/trip-manager/QRScannerPage.jsx --ext .jsx`, `npx prettier --check src/pages/trip-manager/QRScannerPage.jsx` và `npm run build` trong `frontend/` thành công.
- [x] Sửa bản đồ lộ trình ở `TripDetailPage`: dùng điểm đón/trả có tọa độ làm anchor khi origin/destination chỉ có city/province, và `RouteMiniMap` vẫn render Leaflet nếu một vài điểm thiếu tọa độ; `npm run build` trong `frontend/` thành công.
- [x] Thêm bản đồ xem trước trong form tạo/sửa tuyến `RoutesPage.jsx`: khi chọn điểm lên xe, điểm dừng giữa hành trình hoặc điểm xuống xe, modal render ngay lộ trình bằng `RouteMiniMap`; `npm run build` trong `frontend/` thành công.
- [x] Thêm voucher hệ thống cho admin: backend có `/admin/vouchers` CRUD cho voucher global `operatorId=null`, public suggestion trả cả mã nhà xe và mã admin, frontend có trang `/admin/vouchers`; thêm trang ví voucher khách `/voucher-wallet`. `node.exe -c` pass các file backend liên quan và `npm run build` trong `frontend/` thành công.
- [ ] Kiểm tra trip-manager QR scanner trên mobile/tablet.
- [ ] Kiểm tra admin table, filter, modal, content management sau khi đổi token toàn cục.

## 11. Kiểm thử và chất lượng

- [x] Chạy `npm run build` trong `frontend/` - `npm.cmd run build` thành công sau chỉnh hiển thị điểm dừng trip card/detail.
- [~] Chạy `npm run lint` trong `frontend/` nếu dependency đã cài - repo-wide lint còn fail bởi nhiều lỗi hiện hữu ngoài phạm vi; lint riêng `TripsPage.jsx` và `TripDetailPage.jsx` đã pass.
- [ ] Chạy test frontend nếu có test liên quan.
- [ ] Chạy e2e smoke cho customer booking flow nếu môi trường sẵn sàng.
- [ ] Kiểm tra console không có runtime error ở các route chính.
- [ ] Kiểm tra responsive: 375px, 768px, 1440px.
- [ ] Kiểm tra accessibility cơ bản: label form, focus ring, keyboard navigation.
- [ ] Kiểm tra performance: không import ảnh/font quá nặng không cần thiết.
- [ ] Kiểm tra Docker build frontend nếu đụng cấu hình build/nginx.

## 12. Ghi chú quyết định

- [ ] Ghi lại component nào được port từ prototype và component nào giữ production.
- [ ] Ghi lại mọi route mới hoặc API assumption mới.
- [ ] Ghi lại mọi điểm còn mock/fallback.
- [~] Backend email: đồng bộ cấu hình SMTP cho OTP/ticket/notification; ticket email/resend nay gửi thật khi có SMTP/Gmail config dù `DEMO_MODE=true`, không mark sent nếu email bị tắt; payment success callback nay await tạo vé + notification để log rõ kết quả, trang hoàn tất bỏ nút `Gửi email` trùng và chỉ giữ resend; cần smoke test thanh toán tạo vé với SMTP thật.
- [ ] Ghi lại rủi ro còn lại trước khi bàn giao.
