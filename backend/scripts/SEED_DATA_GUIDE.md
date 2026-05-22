# Hướng dẫn tạo Seed Data chuẩn xác (cho agent / dev)

> Mục tiêu: agent khác đọc file này phải tạo được `backend/scripts/seedData.js`
> sao cho **MỌI chức năng trong hệ thống hoạt động được** (login mọi vai trò,
> search/đặt vé, thanh toán, vé, dashboard nhà xe có số liệu ≠ 0, review,
> khiếu nại, voucher, trip-manager/tài xế, admin, content, guest…).
>
> Nguyên tắc: chỉ điền field **thực sự có trong schema Mongoose**, ref trỏ
> đúng tên model đã đăng ký, mật khẩu để model tự hash. KHÔNG bịa field,
> KHÔNG hardcode tài khoản trong controller.

## 0. Trạng thái hiện tại — KHÔNG còn script seed nào

> ⚠️ Toàn bộ script seed cũ đã **bị xoá** vì chứa mock / số liệu không thực
> tế / hỏng: `seedData.js`, `seedRoutesEmployees.js`, `seedContent.js`,
> `ensureAdmin.js`, `clearData.js`.
>
> `package.json` vẫn còn `"seed": "node scripts/seedData.js"` nhưng **file
> chưa tồn tại** → chạy `npm run seed` lúc này lỗi `Cannot find module`.
> Đây là **hợp đồng vị trí**: tạo lại đúng `backend/scripts/seedData.js`
> (đừng đổi `package.json`, đừng tạo script song song). Tài khoản
> trip-manager/tài xế **không** còn hardcode trong controller — đăng nhập
> qua **Employee model** thật.

## 1. Cấu trúc file `seedData.js` mới

- Kết nối DB bằng config thật của dự án (`src/config` / biến môi trường),
  KHÔNG hardcode URI lạ.
- **Tự xoá sạch dữ liệu cũ rồi seed lại** (idempotent) — xoá theo thứ tự
  ngược phụ thuộc.
- In **"SEED SUMMARY"** ở cuối: liệt kê email/employeeCode + mật khẩu
  plaintext của admin / customer / operator / driver / trip_manager để test.
- Helper chạy hook cho model có `pre('save')`/`pre('validate')`:

```js
async function createWithHooks(Model, docs) {
  const out = [];
  for (const d of docs) out.push(await new Model(d).save()); // hook chạy
  return out;
}
function daysFromNow(days, hour = 7) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}
```

## 2. Thứ tự tạo BẮT BUỘC (theo phụ thuộc ref)

```
User → BusOperator → Employee → Bus → Route → Trip → Voucher
     → Booking → Payment → Ticket → Review → Complaint
Content độc lập: Banner, Blog (cần author = User._id), FAQ
```

Model đã đăng ký (`backend/src/models/`): **Banner, Blog, Booking, Bus,
BusOperator, Complaint, Employee, FAQ, Payment, Review, Route, Trip, User,
Voucher**. KHÔNG có model `Operator`, KHÔNG có model `Admin` (admin = User
`role:'admin'`). Ref sai/trỏ doc chưa tạo → 500 `MissingSchemaError`.

## 3. Quy tắc vàng (rút từ bug thực tế)

1. **KHÔNG tự hash mật khẩu.** User/Employee/BusOperator `pre('save')`
   bcrypt-hash (salt 12) khi `password` modified. Hash tay → hash 2 lần →
   không login được. Truyền **plaintext**. Dùng `createWithHooks`, KHÔNG
   `insertMany` (insertMany bỏ hook → mật khẩu không hash, code/số tự sinh
   không chạy).
2. **`ref` phải khớp tên model đăng ký.** Nhà xe = **`BusOperator`** (không
   phải `Operator`). Mọi ref/populate dùng `'BusOperator'`.
3. **Chỉ field có trong schema** (strict mode mặc định ON → field lạ bị
   loại **âm thầm**, trông "có" nhưng không lưu → tính năng phụ thuộc nó
   chết). Trước khi thêm field: mở `backend/src/models/<Model>.js` đọc
   `required` + `enum` + `validate` + hook.
4. **Số liệu thật.** Giá VND số nguyên (vd 250000), toạ độ VN thật, rating
   1–5, không số phi thực tế.

## 4. Cheat-sheet RÀNG BUỘC từng model (đã verify từ source)

> Liệt kê field **bắt buộc** + **enum (giá trị đúng)** + validator chặn +
> hook tự sinh. Thiếu required → reject; sai enum → reject; field lạ → mất.

| Model (tên đăng ký) | required | enum (giá trị hợp lệ) | Validator / hook QUAN TRỌNG |
|---|---|---|---|
| **User** | `email, phone, fullName`; `password` (trừ khi có googleId/facebookId) | `gender: male\|female\|other`; `role: customer\|admin`; `loyaltyTier: bronze\|silver\|gold\|platinum` | email/phone regex; pass ≥6; bcrypt hash. unique: email, phone. Login cần `isActive:true, isBlocked:false`. Admin = role `'admin'` |
| **BusOperator** | `companyName, email, phone, password, businessLicense, taxCode` | `verificationStatus: pending\|approved\|rejected` | phone `^[0-9]{10,11}$`; bcrypt hash. unique: companyName, email. **Seed `verificationStatus:'approved', isActive:true, isSuspended:false`** (login chỉ check isActive+isSuspended; public profile cần cả 2) |
| **Employee** | `operatorId, employeeCode, fullName, phone, password, role` | `role: driver\|trip_manager`; `status: active\|on_leave\|suspended\|terminated`; `licenseClass: ''\|B\|C\|D\|E\|FB\|FC\|FD\|FE` | bcrypt hash. unique compound `{operatorId,employeeCode}`. **Driver bắt buộc** `licenseNumber` + `licenseClass` (≠'') + `licenseExpiry` **tương lai**. Seed cả driver & trip_manager `status:'active'` |
| **Bus** | `operatorId, busNumber, busType, seatLayout{floors,rows,columns,layout,totalSeats}` | `busType: limousine\|sleeper\|seater\|double_decker`; `status: active\|maintenance\|retired`; `seatLayout.floors: 1\|2`; `amenities ∈ wifi,ac,toilet,tv,water,blanket,pillow,charging,snack,entertainment` | `busNumber` `^[A-Z0-9-]+$`. **pre-save GHI ĐÈ `seatLayout.totalSeats`** = đếm nhãn ghế thật trong `layout` (2D array, loại `DRIVER/FLOOR_2/BUS/AISLE/rỗng`). `layout` phải có nhãn ghế thật, nếu không totalSeats=0 → Trip throw |
| **Route** | `operatorId, routeName, routeCode, origin{city,province}, destination{city,province}, distance, estimatedDuration`; mỗi `stops`: `name,order,estimatedArrivalMinutes` | — | `routeCode` `^[A-Z0-9-]+$`. lat −90..90, lng −180..180. stops≤15, pickup/dropoff≤20. `isActive:true` (search lọc). `basePrice` không required trong schema nhưng service ép `>0` → seed `basePrice>0`. **Seed `origin/destination/stops[].coordinates {lat,lng}` thật** để bản đồ Leaflet hiện |
| **Trip** | `routeId, busId, operatorId, driverId, tripManagerId, departureTime, arrivalTime, basePrice, finalPrice, totalSeats, availableSeats` | `status: scheduled\|ongoing\|completed\|cancelled`; `journey.currentStatus / JourneyStatus.status: preparing\|checking_tickets\|in_transit\|at_stop\|completed\|cancelled` | **`driverId` async-validate**: Employee phải `role:'driver' & status:'active'`. **`tripManagerId`**: `role:'trip_manager' & status:'active'`. **`departureTime` phải tương lai** (khi isNew) & **tạo bằng new+save**. `arrivalTime>departureTime`. pre-save tự tính `finalPrice` & lấy `totalSeats/availableSeats` từ `Bus.seatLayout` (Bus thiếu seatLayout → **throw**) |
| **Voucher** | `code, name, discountType, discountValue, validFrom, validUntil` | `discountType: percentage\|fixed`; `createdByModel: Admin\|BusOperator`; `applicableCustomerTiers ∈ bronze/silver/gold/platinum` | pre-save: uppercase code, %≤100, **`validFrom<validUntil`** (throw). Hợp lệ/đổi được: `isActive:true` & `validFrom≤now≤validUntil` & (`maxUsageTotal===null` hoặc `currentUsageCount<maxUsageTotal`). Public browse: `applicableCustomers:[]` & `operatorId:null`. **Đừng dùng `createdByModel:'Admin'`** (không có model Admin) |
| **Booking** | `bookingCode, tripId, operatorId, totalPrice, finalPrice, contactInfo.name, contactInfo.phone`; mỗi `seats[]`: `seatNumber,price,passengerName` | `status: pending\|confirmed\|cancelled\|completed\|refunded`; `paymentMethod: cash\|credit_card\|debit_card\|momo\|vnpay\|zalopay`; `paymentStatus: pending\|paid\|failed\|refunded`; `cancelledBy: customer\|operator\|system` | unique `bookingCode` (static `generateBookingCode()` → `BK{YYYYMMDD}{6}`). pre-save: `finalPrice = totalPrice*(1-discount/100) - voucherDiscount`. `customerId` KHÔNG required (guest). Booking 'confirmed' → cập nhật `Trip.bookedSeats[]` + giảm `availableSeats` cho khớp |
| **Payment** | `paymentCode, bookingId, operatorId, paymentMethod, amount` | `paymentMethod: vnpay\|atm_card\|credit_card\|debit_card\|momo\|zalopay\|cash`; `status: pending\|processing\|completed\|failed\|cancelled\|refunded\|partial_refund` | unique `paymentCode` (static `generatePaymentCode()` → `PAY{YYYYMMDD}{8}`). **Schema KHÔNG có `paidAt`** (chỉ `completedAt/processedAt/...`) — xem TRAP §6 |
| **Ticket** | `ticketCode, bookingId, tripId, operatorId, qrCode, qrCodeData, totalPrice`; mỗi `passengers[]`: `seatNumber,fullName` | `status: valid\|cancelled\|expired\|used` | unique `ticketCode` (static `generateTicketCode()` → `TKT-{YYYYMMDD}-{8}`) & unique `bookingId` (1 vé/booking). `qrCode`+`qrCodeData` là string bắt buộc → nếu không gen QR thật, để chuỗi placeholder ≠ rỗng |
| **Review** | `userId, bookingId, tripId, operatorId, overallRating(1–5)` | — | unique `bookingId` (1 review/booking). Service chỉ cho tạo khi `booking.status==='completed'`. Public list cần **`isPublished:true`** (default true) |
| **Complaint** | `subject, description, category, userId, userEmail, userPhone`; `notes[]`: `content,addedBy,addedByRole` | `category: booking\|payment\|service\|driver\|vehicle\|refund\|technical\|other`; `priority: low\|medium\|high\|urgent`; `status: open\|in_progress\|resolved\|closed\|rejected`; `notes[].addedByRole: admin\|customer` | `ticketNumber` **auto** `pre('validate')` (`TCKT-{YYYYMMDD}-{seq}`) → **bỏ trống**, dùng new+save |
| **Banner** | `title, imageUrl` | `position: homepage\|booking\|routes\|footer` | hiện ra cần `isActive:true` (+ now trong startDate/endDate nếu có) |
| **Blog** | `title, slug, excerpt, content, featuredImage, author` | `category: news\|guide\|promotion\|travel_tips\|company\|other`; `status: draft\|published\|archived` | unique `slug` — **set `slug` tường minh** (hook auto-slug chỉ chạy khi title modified & slug rỗng). Public cần `status:'published'` & `publishedAt≤now`. `author → User._id` |
| **FAQ** | `question, answer, category` | `category: booking\|payment\|cancellation\|account\|tickets\|routes\|policies\|technical\|other` | public cần `isActive:true` |

## 5. Bao phủ chức năng — seed gì để "chạy được"

Seed cho **mỗi nhà xe** một bộ đầy đủ; mốc thời gian tham chiếu = **tháng
hiện tại** (dashboard tính theo current month).

- **Login mọi vai trò:** ≥1 `User role:'admin'`; vài `User role:'customer'`
  (isActive, !isBlocked); mỗi operator ≥1 `Employee role:'driver'` + ≥1
  `role:'trip_manager'` (active, driver đủ license). Operator login bằng
  email/password (approved/active/!suspended).
- **Search & trip detail:** Route có `origin/destination.city+province` +
  `coordinates` thật + `stops`; Bus có `seatLayout.layout` nhãn ghế thật;
  Trip `status:'scheduled'`, `departureTime` **tương lai**,
  `availableSeats>0`. Seed nhiều chuyến **+3/+7/+14/+30 ngày** trên các
  tuyến phổ biến (HCM–Đà Lạt, Hà Nội–Sa Pa…).
- **Đặt vé:** Booking đủ ref + `seats[]` + `contactInfo`; có cả booking
  `confirmed` (đồng bộ `Trip.bookedSeats`/`availableSeats`) lẫn `pending`.
- **Thanh toán + Dashboard ≠ 0:** mỗi operator, **trong tháng hiện tại**:
  vài `Payment status:'completed'` (amount = booking.finalPrice, link
  Booking đúng `operatorId`) + Booking `confirmed/completed` có `finalPrice`
  + Trip `departureTime` trong tháng có `bookedSeats` + Ticket
  (`createdAt` trong tháng). **Đọc kỹ TRAP `paidAt` §6** nếu không doanh
  thu dashboard = 0.
- **Vé:** mỗi booking đã confirmed/paid → 1 `Ticket status:'valid'` (qrCode
  placeholder ≠ rỗng).
- **Review:** vài Booking `status:'completed'` có `customerId`; tạo Review
  cho một số (isPublished:true), chừa vài cái KHÔNG có Review (thẻ "chờ
  đánh giá").
- **Khiếu nại:** vài Complaint nhiều `category/status` (bỏ trống
  `ticketNumber`).
- **Voucher:** ≥1 voucher hệ thống đang hiệu lực (`isActive`,
  `validFrom` quá khứ, `validUntil` xa, `applicableCustomers:[]`,
  `operatorId:null`, %≤100).
- **Trip-manager / tài xế:** Trip gán đúng `tripManagerId`/`driverId` của
  Employee đã seed; có chuyến `scheduled` (sắp chạy) để start/journey.
- **Admin oversight:** tự thoả khi đã seed đủ các model trên (đa nhà xe,
  đa trạng thái).
- **Content:** Banner (`isActive`), Blog (`published`, `publishedAt` quá
  khứ, `author`=User), FAQ (`isActive`) — phủ vài category.
- **Guest:** Booking `customerId:null, isGuestBooking:true` + Ticket có
  `passengers[].phone/email` & `contactInfo` (tra cứu vé khách). Session
  guest/OTP nằm ở Redis — không seed DB.

## 6. TRAP đã biết — KHÔNG dính

1. **`Payment.paidAt` lệch schema (làm doanh thu dashboard = 0).**
   `dashboard.service.getRevenueStats` match `status:'completed'` **và
   `paidAt` trong khoảng** — nhưng Payment schema **không có field
   `paidAt`**. Strict mode mặc định sẽ **xoá** `paidAt` khi
   `Payment.create`. → Phải ghi `paidAt` bằng đường vòng: sau khi tạo
   Payment, `Payment.collection.updateOne({_id},{ $set:{ paidAt: <date
   trong tháng> }})` (hoặc tạo bằng `{ strict:false }`). Đặt thêm
   `completedAt` cho hợp lý. (Các thống kê payment khác chỉ dùng
   `status/amount/createdAt` nên không cần.)
2. **Không có model `Admin`.** `Voucher.createdByModel` enum cho `'Admin'`
   + `createdBy` refPath, nhưng KHÔNG có `mongoose.model('Admin')`. Seed
   voucher: dùng `createdByModel:'BusOperator'` (+ operatorId) hoặc bỏ
   trống `createdBy/createdByModel`. Admin là `User role:'admin'`.
3. **Bus.seatLayout pre-save ghi đè `totalSeats`.** Đếm nhãn ghế thật
   trong `layout`. `layout` rỗng/không có nhãn ghế → totalSeats=0 → Trip
   pre-save **throw** "Bus không có thông tin sơ đồ ghế". Phải dựng
   `layout` 2D có nhãn ghế thật (vd `A1,A2,…`), `DRIVER/AISLE` để đúng vị
   trí.
4. **Trip async-validate driver/manager.** Tạo Employee (đúng
   role+active+license) **trước** Trip; nếu không Trip bị reject.
5. **Trip `departureTime` quá khứ bị reject** (validator chỉ khi isNew).
   Mọi chuyến seed phải tương lai và tạo qua new+save/`.create()`.
6. **Booking.finalPrice tự tính lại** = `totalPrice*(1-discount/100) -
   voucherDiscount`. Set `totalPrice/discount/voucherDiscount` nhất quán,
   đừng kỳ vọng `finalPrice` mình gán "đứng yên".
7. **Blog.slug**: hook auto chỉ chạy khi title modified & slug rỗng — luôn
   set `slug` tường minh (unique).

## 7. Khuôn mẫu

```js
const operators = await createWithHooks(BusOperator, [{
  companyName: 'Nhà xe Phương Trang', email: 'op@vexenhanh.vn',
  phone: '0901234567', password: 'op123' /* hook hash */,
  businessLicense: 'GP-0123', taxCode: '0312345678',
  verificationStatus: 'approved', isActive: true, isSuspended: false,
}]);

const employees = await createWithHooks(Employee, [
  { operatorId: operators[0]._id, employeeCode: 'DRV001', fullName: 'Trần Văn Tài',
    phone: '0902000001', password: 'emp123', role: 'driver', status: 'active',
    licenseNumber: '79K1-12345', licenseClass: 'D',
    licenseExpiry: daysFromNow(900) },
  { operatorId: operators[0]._id, employeeCode: 'TM001', fullName: 'Lê Thị Quản',
    phone: '0902000002', password: 'emp123', role: 'trip_manager',
    status: 'active' },
]);

// Bus: layout 2D có nhãn ghế thật (pre-save tự đếm totalSeats)
const buses = await Bus.create([{
  operatorId: operators[0]._id, busNumber: '79B-12345', busType: 'sleeper',
  status: 'active', amenities: ['wifi','ac','water'],
  seatLayout: { floors: 1, rows: 2, columns: 3, totalSeats: 6,
    layout: [['A1','A2','A3'],['B1','B2','B3']] },
}]);

const routes = await Route.create([{
  operatorId: operators[0]._id, routeCode: 'HCM-DL', routeName: 'TP HCM - Đà Lạt',
  origin: { city: 'TP HCM', province: 'TP HCM', coordinates:{lat:10.762,lng:106.660} },
  destination: { city:'Đà Lạt', province:'Lâm Đồng', coordinates:{lat:11.940,lng:108.458} },
  distance: 300, estimatedDuration: 480, basePrice: 250000,
  stops: [{ name:'Bảo Lộc', order:1, estimatedArrivalMinutes:300,
            coordinates:{lat:11.546,lng:107.808} }],
}]);

const trips = await Trip.create([{
  operatorId: operators[0]._id, routeId: routes[0]._id, busId: buses[0]._id,
  driverId: employees[0]._id, tripManagerId: employees[1]._id,
  departureTime: daysFromNow(3, 7), arrivalTime: daysFromNow(3, 15),
  basePrice: 250000, // finalPrice/totalSeats/availableSeats: pre-save tự lo
}]);

// Payment + TRAP paidAt cho dashboard:
const pay = await Payment.create([{ /* paymentCode auto? -> dùng generatePaymentCode */ }]);
await Payment.collection.updateOne({ _id: pay[0]._id },
  { $set: { paidAt: new Date() /* trong tháng hiện tại */ } });
```

## 8. Checklist "xong"

- [ ] Đã tạo `backend/scripts/seedData.js` (đúng path `npm run seed`), tự
      clear trước khi seed, in SEED SUMMARY.
- [ ] `cd backend && npm run seed` chạy hết, không lỗi schema/validation.
- [ ] `npm run dev` không `MissingSchemaError`.
- [ ] Login: admin / customer / operator / driver / trip_manager đều vào
      được.
- [ ] Search ra chuyến tương lai; trip detail hiện bản đồ Leaflet (toạ độ
      thật).
- [ ] Dashboard nhà xe: revenue / bookings / trips / tickets đều **≠ 0**
      (đã xử lý TRAP `paidAt`).
- [ ] Có vé/booking/voucher/review/complaint/guest để test từng luồng.
- [ ] Không field ngoài schema, không hash tay, ref khớp tên model, không
      hardcode tài khoản trong controller.

## 9. Nguyên tắc vàng

> **Trung thực hơn là cho đủ.** Số liệu không có field thật để chứa thì
> đừng bịa — bỏ đi hoặc seed đúng cái model hỗ trợ. Nếu một chức năng cần
> dữ liệu mà schema không cho (vd `paidAt`), xử lý đúng cách đã ghi ở §6,
> đừng nhét field giả. Seed data là "sự thật" để cả hệ thống test dựa vào.
