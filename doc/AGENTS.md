# AGENTS.md - Nhiệm vụ nâng cấp frontend Vé Xe Nhanh

## 1. Bối cảnh

Repo này là hệ thống đặt vé xe khách trực tuyến Vé Xe Nhanh.
Đọc `reverse_engineer.md` trước khi sửa lớn để nắm kiến trúc tổng quan.
Monorepo gồm `backend/`, `frontend/`, `e2e-tests/` và prototype `Vé Xe Nhanh/`.
Frontend production nằm trong `frontend/`.
Prototype thiết kế nằm trong `Vé Xe Nhanh/`.
Không coi prototype là source production.
Không copy nguyên design canvas vào frontend production.
Nhiệm vụ chính là nâng cấp UI/UX của `frontend/` theo tinh thần prototype.
Giữ API, route, store, auth guard và business flow đang hoạt động.
Ưu tiên customer web trước operator, trip-manager và admin.

## 2. Kiến trúc hệ thống

Client layer có 4 web app: Customer, Operator, Trip Manager, System Admin.
Customer phục vụ tìm chuyến, đặt vé, thanh toán, vé, review, loyalty.
Operator phục vụ tuyến, xe, chuyến, nhân viên, voucher, báo cáo.
Trip Manager phục vụ soát vé QR và quản lý hành khách realtime.
Admin phục vụ người dùng, nhà xe, nội dung, khiếu nại, báo cáo.
Backend là Express API gateway + business logic; MongoDB là database chính.
Redis dùng cho cache, queue hoặc seat/session-related flow nếu backend bật.
Payment gateway trọng tâm là VNPay và các provider mở rộng.
Frontend gọi API qua `frontend/src/services/`.
Frontend state dùng Zustand trong `frontend/src/store/`.
Routing dùng React Router trong `frontend/src/App.jsx`.
UI hiện dùng Tailwind CSS và Ant Design.

## 3. Source tham chiếu

`reverse_engineer.md` là tài liệu tổng quan sản phẩm, actor, API, testing, deploy.
`Vé Xe Nhanh/Vé Xe Nhanh.html` là host prototype, không đưa vào production.
`Vé Xe Nhanh/main.jsx` gom các artboard screen prototype.
`Vé Xe Nhanh/shared.jsx` chứa primitives, mock data, sidebar, frame, token helper.
`flow-discovery`, `flow-booking`, `flow-tickets`, `flow-account`, `flow-content` chứa screen prototypes.
`Vé Xe Nhanh/auth-flow.jsx` chứa login, register, recovery prototype.
`Vé Xe Nhanh/design-system/` chứa fonts, color/type CSS, logo, hero image, icons.
`FRONTEND_UPGRADE_CHECKLIST.md` là checklist tiến độ nâng cấp.

## 4. Nguyên tắc nâng cấp

Giữ behavior trước, thay visual sau.
Không đổi endpoint nếu không có lý do và không cập nhật service tương ứng.
Không xóa route cũ nếu route đó đang được link hoặc dùng trong flow.
Không thay đổi backend chỉ để phục vụ UI khi frontend có thể map dữ liệu hợp lý.
Không phá protected route hoặc allowed roles.
Không đưa mock data vào luồng production nếu API đã có dữ liệu.
Nếu cần fallback vì API thiếu, comment ngắn và ghi vào checklist.
Không dùng global `window.*`, Babel runtime, UMD script, design canvas hoặc tweaks panel.
Không tạo landing page marketing thay cho trải nghiệm đặt vé thật.
Giao diện customer phải mở thẳng vào chức năng tìm và đặt vé.
Ưu tiên pattern hiện có trong repo hơn abstraction mới.
Không refactor operator/admin khi đang làm customer nếu không cần thiết.
Không revert thay đổi của người khác trong worktree.

## 5. Design direction

Brand mới dùng Be Vietnam Pro.
Màu chính theo prototype là teal và saffron.
Teal chính `#006481`, teal đậm `#00476b`, saffron `#E89B26` và `#F3B132`.
Nền chính ưu tiên trắng và `#F9F9FF`; border chính `#DFE2EC`.
Text chính ưu tiên slate/ink từ prototype.
Giảm mạnh red/purple gradient cũ trên customer web.
Không dùng orb, blob, bokeh, nền gradient trang trí kiểu cũ cho customer.
Hero nên dùng ảnh thật `hero-landscape.jpg`.
Button/card radius nên giữ 4-12px, không lạm dụng `rounded-3xl`.
Dashboard operator/admin phải giữ mật độ thông tin cao và thao tác nhanh.

## 6. Thứ tự ưu tiên

Milestone 1: design system, asset nền, customer layout.
Milestone 2: home, search results, trip detail.
Milestone 3: seat map, passenger info, booking confirmation, payment states.
Milestone 4: tickets, guest lookup, cancellation.
Milestone 5: profile, loyalty, reviews, complaints.
Milestone 6: customer auth và content pages.
Milestone 7: harmonize operator, trip-manager, admin nếu còn scope.
Sau mỗi milestone phải build được frontend.
Sau các milestone booking phải smoke test luồng đặt vé.

## 7. Mapping màn hình customer

`HomeScreen` map vào `frontend/src/pages/NewHomePage.jsx`.
`SearchResultsScreen` map vào `frontend/src/pages/TripsPage.jsx`.
`TripDetailScreen` map vào `frontend/src/pages/TripDetailPage.jsx`.
`SeatPickerScreen` map vào `SeatMapComponent` và vùng chọn ghế trong `TripDetailPage`.
`PassengerInfoScreen` map vào `frontend/src/pages/PassengerInfoPage.jsx`.
`PaymentMethodScreen` và `PaymentResultScreen` map vào booking/payment pages hiện có.
`MyTicketsScreen` map vào `frontend/src/pages/customer/MyTicketsPage.jsx`.
`GuestLookupScreen` map vào `frontend/src/pages/GuestTicketLookupPage.jsx`.
`GuestCancelScreen` map vào `frontend/src/pages/CancelTicketPage.jsx`.
`ProfileScreen` map vào `frontend/src/pages/customer/ProfilePage.jsx`.
`LoyaltyScreen` và `LoyaltyHistoryScreen` map vào loyalty pages hiện có.
`ComplaintsScreen` map vào `MyComplaintsPage` và `ComplaintDetailPage`.
`ReviewsScreen` map vào `MyReviewsPage` và review modal.
`BlogListScreen`, `BlogDetailScreen`, `FAQScreen` map vào `NewsPage` hoặc route content mới.
`LoginScreen` map vào `CustomerLoginPage`; `RegisterScreen` map vào `CustomerRegisterPage`.

## 8. API và dữ liệu

Public search dùng trip/route APIs theo services hiện có.
Customer auth dùng customer/auth service hiện có.
Booking flow phải giữ `useBookingStore`.
Seat selection phải giữ selected seats theo format store đang dùng.
Trip detail phải xử lý các field có thể thiếu từ backend.
Price display phải dùng formatter VND thống nhất.
Ticket/QR, guest lookup/cancel, review, complaint, loyalty phải giữ API hiện có.
Operator/Admin pages phải giữ role và tenant boundary qua backend.
Payment pages không đổi callback URL nếu chưa cập nhật backend/env.

## 9. Component strategy

Tạo shared UI nhỏ khi dùng ít nhất 2-3 nơi.
Tránh tạo framework nội bộ quá lớn.
Dùng Ant Design cho form, modal, table nếu code hiện tại đã phụ thuộc.
Dùng Tailwind/CSS classes cho layout và visual.
Dùng icon library đang có; không nhúng nguyên object SVG global `ICONS` từ prototype.
Nếu phải dùng asset SVG riêng, import từ `frontend/src/assets/`.
CSS global phải hạn chế selector quá rộng.
Ant Design override phải đặt ở theme hoặc class scoped khi có thể.

## 10. Responsive và accessibility

Kiểm tra mobile 375px, tablet 768px, desktop 1440px.
Không để text tràn khỏi button/card.
Không để sticky summary che CTA trên mobile.
Form phải có label hoặc accessible name rõ.
Button icon-only phải có title/aria-label.
Keyboard focus phải nhìn thấy.
Loading, empty, error state phải đọc được.
Màu chữ trên nền ảnh phải đủ contrast.

## 11. Kiểm chứng

Chạy `npm run build` trong `frontend/` sau thay đổi đáng kể.
Chạy `npm run lint` và `npm run format:check` nếu dependency sẵn sàng.
Nếu dependencies chưa cài, báo rõ không chạy được.
Smoke test route `/`, `/trips`, `/search-results`, `/trips/:tripId`.
Smoke test `/booking/passenger-info` khi có booking store hợp lệ.
Smoke test `/my-tickets`, `/tickets/lookup`, `/tickets/cancel`.
Smoke test `/login`, `/register`, protected customer routes.
Kiểm tra console browser không có runtime error rõ ràng.
Kiểm tra Docker build nếu thay đổi config Docker/nginx/env.

## 12. Cập nhật checklist và bàn giao

Sau mỗi task, cập nhật `FRONTEND_UPGRADE_CHECKLIST.md`.
Đổi `[ ]` sang `[~]` khi bắt đầu một cụm việc lớn.
Đổi sang `[x]` chỉ khi đã kiểm chứng.
Ghi note ngắn nếu một mục bị chặn bởi API hoặc dữ liệu.
Khi bàn giao, nêu file đã sửa, route đã kiểm tra, lệnh đã chạy và rủi ro còn lại.
Không nói đã hoàn tất nếu build hoặc smoke test chưa chạy được.

## 13. Rủi ro cần tránh

Làm đẹp UI nhưng phá luồng đặt vé.
Port prototype mock data vào production.
Đổi theme toàn cục làm operator/admin khó dùng.
Seat map đẹp nhưng sai trạng thái ghế backend.
Payment callback route bị đổi ngoài ý muốn.
Auth redirect/protected route bị mất.
CSS global override Ant Design quá rộng.
Mobile layout không dùng được trong booking flow.
