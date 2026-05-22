Mô tả 3.1.2. Vấn đề cần giải quyết

Nội dung phần này xác định các vấn đề cốt lõi cần xử lý khi xây dựng hệ thống đặt vé xe khách, bao gồm khó khăn trong tìm kiếm chuyến, nguy cơ đặt trùng ghế, quản lý vận hành nhà xe chưa tập trung, soát vé thủ công và yêu cầu kiểm soát giao dịch. Mỗi vấn đề được gắn với tác động nghiệp vụ và định hướng xử lý tương ứng, làm cơ sở để xác định yêu cầu hệ thống.

Mô tả 3.3.1.1. Tài khoản, xác thực và phân quyền

Nhóm yêu cầu này tập trung vào quản lý tài khoản, đăng nhập, xác thực và phân quyền cho từng actor. Hệ thống cần hỗ trợ cơ chế đăng nhập phù hợp cho User, Operator, Employee và Admin, đồng thời kiểm tra vai trò, trạng thái tài khoản và phạm vi dữ liệu trước khi cho phép truy cập chức năng.

Mô tả 3.3.1.2. Marketplace tìm chuyến và đặt vé

Phần này mô tả các chức năng chính của Marketplace dành cho Guest và User. Trọng tâm là quá trình hành khách tìm kiếm chuyến, lọc và so sánh kết quả, xem chi tiết chuyến, chọn ghế, nhập thông tin hành khách, sử dụng voucher và tra cứu vé. Đây là nhóm chức năng trực tiếp quyết định trải nghiệm đặt vé của người dùng.

Mô tả 3.3.1.3. Booking, ghế, thanh toán và vé điện tử

Nhóm yêu cầu này mô tả quy trình xử lý sau khi hành khách chọn chuyến. Hệ thống cần kiểm tra trạng thái ghế, giữ ghế tạm thời, tạo booking, xử lý thanh toán và phát hành vé điện tử có mã QR khi giao dịch đủ điều kiện xác nhận. Ngoài ra, hệ thống cũng cần hỗ trợ hủy booking hoặc ticket theo trạng thái hợp lệ và chính sách hoàn tiền.

Mô tả 3.3.1.4. Vận hành nhà xe

Các yêu cầu trong phần này phục vụ hoạt động quản lý của Operator. Nhà xe có thể quản lý hồ sơ, tuyến đường, điểm dừng, xe, sơ đồ ghế, chuyến xe, nhân viên, booking, payment, voucher, review và báo cáo. Nhóm chức năng này giúp dữ liệu vận hành của nhà xe được quản lý tập trung trong phạm vi được phân quyền.

Mô tả 3.3.1.5. Vận hành chuyến của Employee

Phần này tập trung vào các nghiệp vụ của Employee trong quá trình vận hành chuyến xe. Nhân viên có thể đăng nhập vào cổng trip-manager, xem chuyến được phân công, theo dõi danh sách hành khách, xác thực vé bằng QR hoặc mã vé và cập nhật trạng thái hành khách sau khi check-in. Các chức năng này hỗ trợ việc soát vé và kiểm soát hành khách tại thời điểm lên xe.

Mô tả 3.3.1.6. Quản trị nền tảng, hỗ trợ và thông báo

Nhóm yêu cầu này liên quan đến hoạt động quản trị, hỗ trợ và thông báo trong toàn hệ thống. Admin có thể quản lý người dùng, nhà xe, tuyến, chuyến, giao dịch, voucher, nội dung công khai, đánh giá và khiếu nại. Hệ thống cũng cần gửi thông báo cho các sự kiện quan trọng và hỗ trợ User hoặc Guest đã xác minh tạo yêu cầu hỗ trợ, khiếu nại.

Mô tả 3.3.2.1. Hiệu năng, khả dụng và độ tin cậy

Các yêu cầu phi chức năng ở phần này tập trung vào tốc độ phản hồi và tính ổn định của hệ thống. Những chức năng quan trọng như tìm kiếm chuyến, xem chi tiết chuyến và xử lý thanh toán cần có thời gian phản hồi phù hợp. Khi cổng thanh toán hoặc dịch vụ phụ trợ gặp lỗi, hệ thống vẫn phải giữ trạng thái giao dịch rõ ràng để tránh sai lệch booking, ticket hoặc payment.

Mô tả 3.3.2.2. Nhất quán dữ liệu, bảo mật và quyền riêng tư

Nội dung phần này nhấn mạnh việc bảo vệ dữ liệu và kiểm soát quyền truy cập. Hệ thống phải đảm bảo dữ liệu ghế, booking, payment và ticket nhất quán trong toàn bộ quy trình đặt vé. Đồng thời, backend cần kiểm tra xác thực, vai trò và phạm vi dữ liệu; mã QR phải được xác thực phía server; các thao tác nhạy cảm cần có log để truy vết.

Mô tả 3.3.2.3. Trải nghiệm, mở rộng và bảo trì

Các yêu cầu trong phần này hướng đến trải nghiệm sử dụng rõ ràng, khả năng mở rộng và khả năng bảo trì lâu dài. Luồng tìm chuyến, chọn ghế, nhập thông tin hành khách, thanh toán và nhận vé cần dễ sử dụng trên cả desktop và mobile. Hệ thống cũng cần được tổ chức theo module để thuận tiện cho phát triển, kiểm thử, mở rộng nhà xe, chuyến xe và tích hợp thêm dịch vụ bên ngoài.

Mô tả 3.4.1. Nhóm chức năng theo miền nghiệp vụ

Phần này tổng hợp các nhóm chức năng chính của hệ thống theo từng miền nghiệp vụ. Mỗi nhóm thể hiện mã chức năng, actor chính và phạm vi xử lý, chẳng hạn tài khoản, Marketplace đặt vé, Booking–Ticket–Payment, Operator OS, vận hành chuyến, quản trị nền tảng, hỗ trợ và tin cậy. Cách phân nhóm này giúp nhìn rõ cấu trúc chức năng tổng thể trước khi đi vào thiết kế chi tiết.
Mô tả 3.4.2. Quan hệ chức năng theo vòng đời giao dịch

Nội dung phần này thể hiện mối liên hệ giữa các nhóm chức năng theo từng giai đoạn của một giao dịch đặt vé. Quy trình bắt đầu từ tìm kiếm chuyến, chọn chuyến, giữ ghế, tạo booking, thanh toán, phát hành vé, vận hành chuyến và xử lý hậu mãi. Mỗi giai đoạn đều có đầu vào, bước xử lý chính và kết quả đầu ra rõ ràng, giúp xác định luồng nghiệp vụ xuyên suốt của hệ thống.

Mô tả 3.6.1. Danh sách Use Case

Phần này tổng hợp các Use Case chính trong hệ thống và actor tham gia tương ứng. Các Use Case bao phủ từ chức năng của Guest/User như tìm kiếm chuyến, chọn ghế, thanh toán, nhận vé, đến chức năng của Operator, Employee, Admin và System. Việc liệt kê Use Case giúp làm rõ phạm vi chức năng tổng quan trước khi đi vào mô tả chi tiết từng luồng nghiệp vụ.

Mô tả 4.1. Nguyên tắc nghiệp vụ nền tảng

Các nguyên tắc nghiệp vụ nền tảng xác định những quy tắc cốt lõi mà hệ thống phải tuân thủ trong toàn bộ quá trình vận hành. Nội dung tập trung vào mô hình marketplace nhiều nhà xe, giới hạn dữ liệu theo tenant, kiểm soát ghế như tài nguyên giao dịch, truy vết booking/payment/ticket và bảo vệ dữ liệu cá nhân theo vai trò. Đây là cơ sở để đảm bảo hệ thống vận hành nhất quán, minh bạch và an toàn.

Mô tả 4.2. Quy tắc vòng đời đặt vé

Phần này mô tả các quy tắc nghiệp vụ áp dụng trong toàn bộ vòng đời đặt vé, từ tìm kiếm chuyến, chọn ghế, giữ ghế, tạo booking, thanh toán, phát hành vé đến hủy vé và hoàn tiền. Các quy tắc giúp hệ thống tránh các lỗi quan trọng như bán trùng ghế, tạo giao dịch không hợp lệ, phát hành vé khi chưa đủ điều kiện hoặc hoàn tiền sai trạng thái. Nội dung này là nền tảng để kiểm soát logic nghiệp vụ đặt vé.

Mô tả 4.3. Quy tắc phân quyền chức năng

Nội dung phần này xác định phạm vi dữ liệu và thao tác của từng actor trong hệ thống. Guest, User, Operator, Employee, Admin và System đều có quyền truy cập khác nhau tùy theo vai trò và trách nhiệm. Quy tắc phân quyền giúp ngăn truy cập sai phạm vi, bảo vệ dữ liệu nhạy cảm và đảm bảo các thao tác quan trọng như refund, khóa tài khoản, duyệt nhà xe hoặc cập nhật trạng thái đều được kiểm soát.

Mô tả 4.4.1. Trạng thái booking

Phần này mô tả các trạng thái chính của booking trong hệ thống. Booking có thể bắt đầu ở trạng thái pending, sau đó được xác nhận, hủy, hoàn tất hoặc hoàn tiền tùy theo kết quả xử lý. Việc định nghĩa rõ trạng thái booking giúp hệ thống kiểm soát chính xác quá trình đặt vé, thanh toán, hủy vé và báo cáo giao dịch.

Mô tả 4.4.2. Trạng thái vé

Các trạng thái vé thể hiện khả năng sử dụng của vé sau khi được phát hành. Vé có thể còn hiệu lực, đã sử dụng, đã hủy hoặc hết hạn. Việc quản lý trạng thái vé giúp nhân viên kiểm tra vé chính xác khi check-in, đồng thời tránh trường hợp vé đã dùng, đã hủy hoặc hết hạn vẫn được sử dụng để lên xe.

Mô tả 4.4.3. Trạng thái thanh toán

Phần này mô tả vòng đời của một giao dịch thanh toán, từ khi mới tạo, đang xử lý, hoàn tất, thất bại, bị hủy đến hoàn tiền toàn phần hoặc một phần. Các trạng thái này giúp hệ thống xác định booking có đủ điều kiện xác nhận hay chưa, đồng thời hỗ trợ đối soát, xử lý lỗi thanh toán và hoàn tiền khi cần.

Mô tả 4.4.4. Trạng thái chuyến xe

Các trạng thái chuyến xe phản ánh quá trình vận hành của một chuyến, từ đã lên lịch, đang chạy, hoàn thành đến bị hủy. Trạng thái chuyến ảnh hưởng trực tiếp đến việc hiển thị chuyến, mở bán vé, check-in hành khách và xử lý hủy/hoàn tiền. Việc quản lý rõ trạng thái chuyến giúp tránh bán vé cho chuyến không còn đủ điều kiện vận hành.

Mô tả 4.4.5. Trạng thái khiếu nại

Phần này mô tả các trạng thái xử lý khiếu nại từ lúc mới tạo đến khi được tiếp nhận, xử lý, giải quyết, đóng hoặc từ chối. Mỗi trạng thái phản ánh tiến độ xử lý và trách nhiệm của các bên liên quan. Việc định nghĩa rõ trạng thái khiếu nại giúp hệ thống theo dõi quá trình hỗ trợ khách hàng và xử lý tranh chấp minh bạch hơn.

Mô tả 4.5. Quy tắc thông báo hệ thống

Nội dung phần này xác định các sự kiện cần gửi thông báo, người nhận, mức độ bắt buộc và nội dung tối thiểu của thông báo. Các sự kiện quan trọng gồm tạo booking, thanh toán thành công/thất bại, phát hành vé, hủy vé/hoàn tiền, thay đổi chuyến, phân công chuyến, cập nhật khiếu nại và khóa/mở tài khoản. Quy tắc này giúp đảm bảo người dùng và các bên liên quan nhận được thông tin kịp thời trong quá trình sử dụng hệ thống.
Mô tả 4.6. Tiêu chí nghiệm thu hệ thống

Phần này xác định các tiêu chí dùng để kiểm tra hệ thống sau khi hoàn thiện các chức năng chính. Nội dung tập trung vào những nghiệp vụ quan trọng như tìm kiếm chuyến, giữ ghế, tạo booking, thanh toán, phát hành vé, tra cứu vé, hủy vé, phân quyền dữ liệu và quét QR. Mỗi tiêu chí đều đi kèm cách xác nhận cụ thể, giúp quá trình kiểm thử và nghiệm thu có căn cứ rõ ràng.

Mô tả 4.7. Rủi ro và biện pháp giảm thiểu

Nội dung phần này liệt kê các rủi ro có thể ảnh hưởng đến hoạt động của hệ thống, như bán trùng ghế, callback thanh toán trễ hoặc trùng, lộ dữ liệu giữa các nhà xe, phân quyền Employee chưa chặt, chính sách hoàn tiền chưa rõ và thông báo thất bại. Với mỗi rủi ro, hệ thống đưa ra biện pháp giảm thiểu tương ứng nhằm hạn chế lỗi nghiệp vụ, bảo vệ dữ liệu và đảm bảo giao dịch được xử lý chính xác.

Mô tả 5.18. Thiết kế API/Route chính

Phần này mô tả các nhóm API chính của hệ thống theo từng miền chức năng. Các route được chia thành nhóm như Auth/User, Public marketplace, Booking, Payment, Ticket, Operator, Trip-manager, Admin và Support. Cách phân chia này giúp backend tổ chức rõ trách nhiệm từng nhóm API, đồng thời hỗ trợ frontend gọi đúng endpoint theo từng vai trò và nghiệp vụ.

Mô tả 6.2.2. Các nhóm thực thể dữ liệu chính

Nội dung phần này tổng hợp các nhóm dữ liệu chính đang được sử dụng trong hệ thống. Các thực thể được chia theo miền như Identity, Transport, Booking/Ticket, Payment/Promotion, Trust/Support và Content. Việc phân nhóm giúp làm rõ cấu trúc dữ liệu tổng thể trước khi đi vào mô tả chi tiết từng collection.

Mô tả 6.4.1. Collection User

Collection User lưu thông tin tài khoản của khách hàng và quản trị viên nội bộ. Các thuộc tính chính gồm email, số điện thoại, mật khẩu, họ tên, thông tin hồ sơ, vai trò, trạng thái xác minh, hành khách lưu sẵn, điểm loyalty và trạng thái tài khoản. Đây là collection trung tâm phục vụ đăng nhập, quản lý hồ sơ cá nhân, đặt vé, tích điểm và kiểm soát quyền truy cập của người dùng.

Mô tả 6.4.2. Collection BusOperator

Collection BusOperator lưu thông tin của nhà xe tham gia hệ thống. Dữ liệu bao gồm tên pháp lý, tên hiển thị, thông tin đăng nhập, giấy phép kinh doanh, mã số thuế, địa chỉ, tài khoản ngân hàng, trạng thái duyệt hồ sơ, thống kê vận hành và tỷ lệ commission. Collection này phục vụ quản lý hồ sơ nhà xe, duyệt KYC, vận hành nhà xe và đối soát doanh thu.

Mô tả 6.4.3. Collection Route

Collection Route quản lý thông tin tuyến đường thuộc một nhà xe. Các thuộc tính chính gồm mã tuyến, điểm đi, điểm đến, danh sách điểm đón/trả, điểm dừng dọc tuyến, khoảng cách, thời gian di chuyển dự kiến và giá cơ bản. Collection này là nền tảng để tạo chuyến xe và hỗ trợ người dùng tìm kiếm chuyến phù hợp.

Mô tả 6.4.4. Collection StopPoint

Collection StopPoint lưu thông tin các điểm đón, điểm trả hoặc điểm dừng của nhà xe. Dữ liệu gồm mã điểm dừng, tên, loại điểm, địa chỉ, tọa độ, trạng thái sử dụng và ghi chú vận hành. Collection này giúp chuẩn hóa dữ liệu địa điểm, hỗ trợ cấu hình tuyến và hiển thị chính xác điểm đón/trả cho hành khách.

Mô tả 6.4.5. Collection Bus

Collection Bus lưu thông tin phương tiện của nhà xe. Các thuộc tính chính gồm biển số, loại xe, số tầng, số hàng/cột ghế, sơ đồ ghế, tổng số ghế, tiện ích và trạng thái khai thác. Collection này phục vụ quản lý phương tiện, kiểm soát sơ đồ ghế và gán xe cho từng chuyến cụ thể.

Mô tả 6.4.6. Collection Employee

Collection Employee quản lý tài khoản nhân viên thuộc nhà xe. Dữ liệu bao gồm mã nhân viên, thông tin cá nhân, thông tin liên hệ, mật khẩu, vai trò, giấy phép lái xe nếu có, trạng thái làm việc và thời gian bắt đầu/kết thúc công việc. Collection này hỗ trợ nhà xe phân quyền nhân viên, gán tài xế hoặc trip-manager cho chuyến và kiểm soát hoạt động vận hành.

Mô tả 6.4.7. Collection Trip

Collection Trip lưu thông tin chuyến xe cụ thể được tạo từ tuyến, xe và nhà xe. Các thuộc tính chính gồm route, bus, operator, driver, trip manager, thời gian khởi hành/đến, giá vé, tổng số ghế, ghế còn trống, danh sách ghế đã đặt, trạng thái chuyến, thông tin hủy chuyến và dữ liệu hành trình. Collection này là trung tâm của nghiệp vụ tìm chuyến, đặt vé, quản lý ghế và vận hành chuyến xe.
Mô tả 6.4.8. Collection Booking

Collection Booking lưu thông tin đơn đặt vé của hành khách. Dữ liệu bao gồm mã booking, chuyến xe, khách hàng, nhà xe, trạng thái booking, danh sách ghế, thông tin liên hệ, điểm đón/trả, tổng tiền, voucher, phương thức thanh toán và thông tin hủy/hoàn tiền nếu có. Collection này đóng vai trò trung tâm trong luồng đặt vé, giúp liên kết giữa hành khách, chuyến xe, thanh toán và vé điện tử.

Mô tả 6.4.9. Collection Ticket

Collection Ticket lưu thông tin vé điện tử được phát hành sau khi booking đủ điều kiện xác nhận. Các thuộc tính chính gồm mã vé, booking liên quan, khách hàng, chuyến xe, nhà xe, mã QR, file PDF nếu có, danh sách hành khách, thông tin chuyến, tổng tiền và trạng thái sử dụng vé. Collection này phục vụ tra cứu vé, gửi vé cho hành khách và xác thực vé khi check-in.

Mô tả 6.4.10. Collection Payment

Collection Payment quản lý thông tin giao dịch thanh toán của booking. Dữ liệu gồm mã thanh toán, booking liên quan, phương thức thanh toán, cổng thanh toán, số tiền, trạng thái giao dịch, mã giao dịch từ provider, URL thanh toán, thời gian xử lý, lý do lỗi và thông tin hoàn tiền. Collection này giúp hệ thống theo dõi, xác nhận, đối soát và xử lý các giao dịch thanh toán.

Mô tả 6.4.11. Collection Voucher

Collection Voucher lưu thông tin mã giảm giá được sử dụng trong hệ thống. Các thuộc tính chính gồm mã voucher, tên, mô tả, nhà xe sở hữu nếu là voucher cấp Operator, loại giảm giá, giá trị giảm, điều kiện đơn tối thiểu, giới hạn sử dụng, thời gian hiệu lực, trạng thái hoạt động và phạm vi áp dụng. Collection này hỗ trợ kiểm tra điều kiện và áp dụng khuyến mãi khi người dùng đặt vé.

Mô tả 6.4.12. Collection VoucherWallet

Collection VoucherWallet quản lý các voucher mà khách hàng đã lưu vào tài khoản. Dữ liệu gồm khách hàng sở hữu, voucher được lưu, trạng thái sử dụng và các mốc thời gian lưu, dùng hoặc xóa voucher. Collection này giúp người dùng quản lý voucher cá nhân và hỗ trợ hệ thống kiểm soát trạng thái sử dụng khuyến mãi.

Mô tả 6.4.13. Collection Review

Collection Review lưu thông tin đánh giá của người dùng sau chuyến đi. Dữ liệu gồm người đánh giá, booking được đánh giá, chuyến xe, nhà xe, điểm tổng thể, điểm chi tiết về xe, tài xế, đúng giờ, dịch vụ, nội dung nhận xét, ảnh đính kèm và phản hồi từ nhà xe. Collection này hỗ trợ đánh giá chất lượng dịch vụ và giúp hành khách tham khảo thông tin trước khi chọn nhà xe.

Mô tả 6.4.14. Collection Complaint

Collection Complaint quản lý các khiếu nại hoặc yêu cầu hỗ trợ của người dùng. Dữ liệu gồm mã khiếu nại, tiêu đề, mô tả, nhóm vấn đề, mức độ ưu tiên, trạng thái xử lý, thông tin người tạo, booking/chuyến liên quan, người được phân công, tệp đính kèm, ghi chú nội bộ và kết quả xử lý. Collection này hỗ trợ quá trình tiếp nhận, theo dõi và giải quyết khiếu nại một cách có kiểm soát.

Mô tả 6.4.15. Collection Banner

Collection Banner lưu thông tin các banner hiển thị trên giao diện người dùng. Dữ liệu gồm tiêu đề, mô tả, ảnh desktop/mobile, liên kết điều hướng, vị trí hiển thị, thứ tự, trạng thái bật/tắt, thời gian hiển thị và thống kê lượt tương tác. Collection này phục vụ quản lý nội dung quảng bá, thông báo hoặc khuyến mãi trên hệ thống.

Mô tả 6.4.16. Collection Blog

Collection Blog lưu thông tin các bài viết nội dung công khai. Các thuộc tính chính gồm tiêu đề, đường dẫn định danh, tóm tắt, nội dung bài viết, ảnh đại diện, danh mục, tác giả, trạng thái xuất bản, thời điểm xuất bản, lượt xem, lượt thích và dữ liệu SEO. Collection này hỗ trợ hệ thống hiển thị tin tức, hướng dẫn, khuyến mãi hoặc nội dung hỗ trợ người dùng.

Mô tả 6.4.17. Collection FAQ

Collection FAQ quản lý các câu hỏi thường gặp trên hệ thống. Dữ liệu gồm câu hỏi, câu trả lời, nhóm FAQ, thứ tự hiển thị, trạng thái công khai, lượt xem, số lượt đánh giá hữu ích hoặc không hữu ích và nhãn tìm kiếm. Collection này giúp người dùng tự tra cứu thông tin hỗ trợ nhanh trước khi cần tạo yêu cầu khiếu nại hoặc liên hệ trực tiếp.

Mô tả 7.5.1. Màn hình khách hàng

Liệt kê các màn hình chính dành cho khách hàng trong quá trình sử dụng hệ thống. Các màn hình bao phủ luồng từ trang chủ tìm vé, danh sách chuyến, chi tiết chuyến, chọn ghế, nhập thông tin hành khách, thanh toán, xác nhận booking, kết quả thanh toán, vé của tôi, tra cứu vé khách vãng lai, hủy vé, hồ sơ cá nhân, loyalty, đánh giá và khiếu nại. Nội dung này giúp xác định rõ các giao diện cần xây dựng để phục vụ đầy đủ luồng đặt vé của người dùng.

Mô tả 7.5.2. Màn hình nhà xe

Mô tả các màn hình phục vụ nhà xe trong quá trình quản lý vận hành. Các màn hình chính gồm dashboard nhà xe, quản lý tuyến đường, điểm dừng, xe, cấu hình sơ đồ ghế, quản lý chuyến, tạo hoặc cập nhật chuyến, quản lý nhân viên, giao dịch, báo cáo, voucher và đánh giá nhà xe. Nhóm màn hình này hỗ trợ Operator theo dõi hoạt động kinh doanh, quản lý dữ liệu vận hành và xử lý các nghiệp vụ thuộc phạm vi nhà xe.
Mô tả 7.5.3. Màn hình nhân viên vận hành chuyến

Phần này mô tả các màn hình dành cho nhân viên vận hành chuyến, chủ yếu phục vụ nghiệp vụ trip-manager. Các màn hình bao gồm dashboard, chuyến đang vận hành, danh sách hành khách, quét mã QR và kết quả xác thực vé. Nhóm giao diện này giúp nhân viên theo dõi chuyến được phân công, kiểm tra hành khách lên xe và cập nhật trạng thái soát vé nhanh chóng.

Mô tả 8.4.1. Test case đăng nhập

Nhóm test case này kiểm tra các tình huống liên quan đến đăng nhập hệ thống. Nội dung bao gồm mở trang đăng nhập, đăng nhập đúng thông tin, nhập sai mật khẩu, submit form trống và đăng nhập bằng thông tin không hợp lệ. Các trường hợp kiểm thử giúp đảm bảo hệ thống xác thực đúng người dùng, hiển thị lỗi phù hợp và không cho truy cập vào khu vực được bảo vệ khi chưa hợp lệ.

Mô tả 8.4.2. Test case tìm chuyến xe

Nhóm test case này dùng để kiểm tra chức năng tìm kiếm chuyến xe. Các tình huống chính gồm tìm chuyến theo điểm đi/đến/ngày, lọc kết quả theo giá hoặc loại xe và xử lý trường hợp không có chuyến phù hợp. Mục tiêu là đảm bảo hệ thống trả về danh sách chuyến chính xác, hiển thị bộ lọc đúng và có trạng thái rỗng rõ ràng khi không có dữ liệu.

Mô tả 8.4.3. Test case chọn ghế

Phần này kiểm tra các tình huống khi người dùng chọn ghế trong luồng đặt vé. Hệ thống cần cho phép chọn ghế còn trống, từ chối ghế đã được đặt và tạo trạng thái giữ ghế thành công khi người dùng chọn ghế hợp lệ. Các test case này giúp giảm rủi ro bán trùng ghế và đảm bảo dữ liệu ghế được cập nhật đúng.

Mô tả 8.4.4. Test case đặt vé

Nhóm test case này kiểm tra toàn bộ luồng đặt vé từ đăng nhập, tìm chuyến, chọn ghế, nhập thông tin đến thanh toán. Các trường hợp lỗi như thiếu thông tin liên hệ hoặc booking hết hạn giữ ghế cũng được kiểm tra. Mục tiêu là đảm bảo booking chỉ được tạo và chuyển tiếp thanh toán khi dữ liệu hợp lệ.

Mô tả 8.4.5. Test case thanh toán

Phần này tập trung kiểm tra quá trình tạo payment và xử lý callback từ cổng thanh toán. Hệ thống cần tạo đúng paymentUrl với số tiền chính xác, cập nhật booking sang trạng thái đã thanh toán khi callback hợp lệ và từ chối xử lý nếu callback sai amount hoặc chữ ký. Nhóm test này giúp đảm bảo tính chính xác và an toàn của giao dịch thanh toán.

Mô tả 8.4.6. Test case tra cứu vé

Nhóm test case này kiểm tra chức năng tra cứu vé, đặc biệt với khách vãng lai. Khi nhập đúng booking code và thông tin xác minh, hệ thống phải hiển thị thông tin vé phù hợp. Ngược lại, nếu thông tin xác minh sai, hệ thống không được hiển thị dữ liệu nhạy cảm nhằm đảm bảo quyền riêng tư và an toàn thông tin.

Mô tả 8.4.7. Test case hủy vé

Phần này kiểm tra các tình huống hủy booking hoặc vé. Hệ thống cần cho phép hủy khi booking hợp lệ, từ chối khi người dùng không có quyền và tạo hoặc cập nhật thông tin refund nếu booking đã phát sinh thanh toán. Các test case này giúp đảm bảo quá trình hủy vé tuân thủ đúng trạng thái và chính sách xử lý.

Mô tả 8.4.8. Test case quản lý chuyến xe

Nhóm test case này kiểm tra nghiệp vụ quản lý chuyến của Operator. Hệ thống cần cho phép tạo chuyến hợp lệ, từ chối tạo chuyến với route hoặc bus không thuộc nhà xe và cảnh báo khi có xung đột lịch xe hoặc tài xế. Mục tiêu là đảm bảo dữ liệu chuyến xe được tạo đúng phạm vi và tránh lỗi vận hành.

Mô tả 8.4.9. Test case quét mã QR

Phần này kiểm tra chức năng quét mã QR khi hành khách lên xe. Hệ thống cần xác nhận vé hợp lệ và cập nhật trạng thái vé đã sử dụng sau khi quét thành công. Với vé đã dùng, sai chuyến hoặc hết hạn, hệ thống phải từ chối check-in để tránh gian lận và đảm bảo quá trình soát vé chính xác.
