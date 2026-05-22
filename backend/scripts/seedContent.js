/**
 * Seed Blog (Cẩm nang & tin tức) + FAQ sample data.
 * Idempotent: blogs upserted by slug, FAQs skipped if an identical
 * question already exists. Safe to re-run.
 *
 * Usage: node scripts/seedContent.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../src/utils/logger');

const User = require('../src/models/User');
const Blog = require('../src/models/Blog');
const FAQ = require('../src/models/FAQ');

const IMG = {
  seat: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=70',
  food: 'https://store.longphuong.vn/wp-content/uploads/2023/02/bat-to-dung-pho-su-1.jpg',
  luggage:
    'https://xekhachtuanyen.vn/wp-content/uploads/2023/06/Chuan-bi-hanh-ly-khi-di-xe-khach-duong-dai.jpg',
  sapa: 'https://nhatotravel.vn/wp-content/uploads/2025/08/canh-dep-sapa-mua-he-1.jpg',
  promo: 'https://viettourist.com//resources/images/680dienbien/14.jpg',
  limousine:
    'https://chatgpt.com/backend-api/estuary/public_content/enc/eyJpZCI6Im1fNmEwODMzYTc4ZTdjODE5MWJjYWNhNGQ2MzYzOTQ5Yjc6ZmlsZV8wMDAwMDAwMDE2MmM3MjA5OGU2NjM2YWU0MTBjZDkwYyIsInRzIjoiMjA1ODkiLCJwIjoicHlpIiwiY2lkIjoiMSIsInNpZyI6Ijc1ZWJlYWUzYjgyYTA0ZDlhZTc0MTBhMjJkM2Q4ZGZmNzFmNmViNGE2NjBmZmE4NWJiMjJkNWQ3MDhhOTNhOWUiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsLCJjcyI6bnVsbCwiY2RuIjpudWxsLCJmbiI6bnVsbCwiY2QiOm51bGwsImNwIjpudWxsLCJtYSI6bnVsbH0=',
  road: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=70',
  night:
    'https://images.unsplash.com/photo-1474649107449-ea4f014b7e9f?auto=format&fit=crop&w=1200&q=70',
  tet: 'https://bocxeptaynguyen.vn/wp-content/uploads/2026/02/checklist-chuan-bi-khi-chuyen-nha-1024x768.jpg',
  western: 'https://1phutsaigon.vn/wp-content/uploads/2022/07/1-1.jpeg',
};

const tip = (label, body) =>
  `<div class="vxn-tip"><div class="vxn-tip-label">${label}</div><div class="vxn-tip-body">${body}</div></div>`;

const BLOGS = [
  {
    slug: 'cach-chon-ghe-dep-xe-giuong-nam',
    title: 'Cách chọn ghế đẹp trên xe giường nằm — chỗ nào êm nhất?',
    excerpt:
      'Ghế tầng dưới — giữa xe luôn ít rung lắc nhất. Tránh hàng cuối nếu hay say xe. Cabin VIP đáng tiền với chuyến dài.',
    category: 'guide',
    tags: ['Giường nằm', 'Limousine', 'Mẹo', 'Cẩm nang'],
    featuredImage: IMG.seat,
    readTime: 5,
    daysAgo: 4,
    views: 8421,
    content:
      `<p class="vxn-lead">Sau 17 năm đi xe khách dọc Bắc — Nam, tôi rút ra ba quy tắc đơn giản giúp bạn có chuyến đi êm ái nhất: chọn tầng đúng, chọn vị trí giữa, và <strong>tránh xa hàng cuối nếu bạn dễ say xe</strong>.</p>` +
      `<h2>1. Tầng dưới hay tầng trên?</h2>` +
      `<p>Tầng dưới luôn êm hơn vì gần trục xe. Nếu bạn say xe hoặc đi chuyến đêm, hãy chọn tầng dưới — đặc biệt là các hàng từ 2 đến 5. Tầng trên có view đẹp hơn ban ngày nhưng dao động lớn hơn khi xe vào cua hoặc đường xấu.</p>` +
      `<h2>2. Tránh hàng đầu và hàng cuối</h2>` +
      `<p>Hàng đầu sát kính lái — sáng đèn xe ngược chiều, hơi nóng máy. Hàng cuối thường là 5 ghế liền không có khoang riêng, lại ngay trên cầu sau nên rung lắc nhiều nhất. Các hàng giữa (3 — 5) là vùng "sweet spot".</p>` +
      tip(
        'MẸO NHỎ',
        'Nếu đặt vé qua VXN, sơ đồ ghế hiển thị rõ vị trí cabin và cửa sổ. Hãy hover từng ghế để xem chú thích trước khi chọn.'
      ) +
      `<h2>3. Cabin VIP — khi nào đáng tiền?</h2>` +
      `<p>Với chuyến dài trên 6 tiếng hoặc chuyến đêm, cabin VIP cá nhân (có rèm và cửa cabin) đáng để chi thêm 60 — 120k. Bạn có không gian riêng, rèm kéo lại để ngủ, và thường có sạc Type-C lẫn nước miễn phí.</p>`,
  },
  {
    slug: 'top-quan-pho-bo-doc-ql1',
    title: 'Top 8 quán phở bò trứ danh dọc QL1 Bắc — Trung',
    excerpt:
      'Cát Bà, Vinh, Đông Hà, Huế — những quán phở mở 24/7 phục vụ tài xế và khách đi đường dài.',
    category: 'travel_tips',
    tags: ['Ẩm thực', 'QL1', 'Mẹo du lịch'],
    featuredImage: IMG.food,
    readTime: 7,
    daysAgo: 8,
    views: 12340,
    content:
      `<p class="vxn-lead">Đi xe khách đường dài, bữa ăn dọc đường quyết định một nửa độ "sướng" của chuyến đi. Đây là 8 quán phở bò mở xuyên đêm mà cánh tài xế lâu năm hay ghé.</p>` +
      `<h2>Miền Bắc</h2>` +
      `<p>Trạm dừng Cát Bà và khu vực Phủ Lý có vài quán phở gia truyền nước trong, bánh mềm, mở từ 4h sáng phục vụ chuyến sớm.</p>` +
      `<h2>Bắc Trung Bộ</h2>` +
      `<p>Vinh nổi tiếng phở bò bắp, Đông Hà có phở khô ăn kèm rau sống. Huế thì đừng bỏ lỡ tô phở bò cay nhẹ đặc trưng.</p>` +
      tip(
        'GỢI Ý',
        'Báo phụ xe trước khi tới trạm dừng để giữ chỗ — chuyến đông khách thời gian dừng chỉ 15 — 20 phút.'
      ),
  },
  {
    slug: 'quy-dinh-hanh-ly-xe-khach-2026',
    title: 'Quy định mới về hành lý xe khách từ 06/2026',
    excerpt:
      'Bộ GTVT vừa ban hành quy định mới về khối lượng và kích thước hành lý ký gửi. Áp dụng từ 01/06/2026.',
    category: 'news',
    tags: ['Hành lý', 'Quy định', 'Tin tức'],
    featuredImage: IMG.luggage,
    readTime: 3,
    daysAgo: 11,
    views: 4892,
    content:
      `<p class="vxn-lead">Từ 01/06/2026, hành lý ký gửi miễn phí trên xe khách tuyến cố định được chuẩn hoá nhằm bảo đảm an toàn và công bằng giữa hành khách.</p>` +
      `<h2>Mức miễn phí</h2>` +
      `<p>Mỗi khách được mang tối đa 20kg hành lý ký gửi và 1 kiện xách tay không quá 7kg. Phần vượt được tính phí theo bảng giá của nhà xe.</p>` +
      `<h2>Vật phẩm hạn chế</h2>` +
      `<p>Chất dễ cháy nổ, hàng cồng kềnh quá kích thước khoang hành lý, và động vật sống (trừ thú cưng có lồng theo quy định) không được vận chuyển.</p>` +
      tip(
        'LƯU Ý',
        'Khai báo hành lý có giá trị cao khi gửi để được hỗ trợ bồi thường theo chính sách của hãng.'
      ),
  },
  {
    slug: 'sapa-mua-he-5-cung-trekking-nhe',
    title: 'Sapa mùa hè — 5 cung trekking nhẹ cho dân văn phòng',
    excerpt:
      'Trekking 1 ngày từ trung tâm Sapa: Cát Cát, Tả Phìn, đỉnh Hàm Rồng... đi về trong ngày, không tốn sức.',
    category: 'travel_tips',
    tags: ['Sapa', 'Trekking', 'Mẹo du lịch'],
    featuredImage: IMG.sapa,
    readTime: 8,
    daysAgo: 13,
    views: 6210,
    content:
      `<p class="vxn-lead">Không cần là dân leo núi chuyên nghiệp, bạn vẫn có thể tận hưởng Sapa mùa hè với 5 cung đi bộ nhẹ nhàng, về trong ngày.</p>` +
      `<h2>1. Bản Cát Cát</h2><p>Cung dễ nhất, khoảng 2 — 3 giờ cả đi lẫn về, phù hợp gia đình có trẻ nhỏ.</p>` +
      `<h2>2. Tả Phìn</h2><p>Làng người Dao đỏ, kết hợp tắm lá thuốc sau khi đi bộ.</p>` +
      `<h2>3. Đỉnh Hàm Rồng</h2><p>Vườn hoa, view toàn cảnh thị trấn — đẹp nhất lúc chiều muộn.</p>` +
      tip(
        'MẸO NHỎ',
        'Đi xe đêm từ Hà Nội, tới Sapa 5h sáng là vừa kịp ăn sáng rồi bắt đầu cung trekking đầu tiên.'
      ),
  },
  {
    slug: 'khuyen-mai-he-vxn-2026',
    title: 'Khuyến mãi hè VXN: giảm đến 35% toàn bộ tuyến miền Bắc',
    excerpt: 'Từ 15/05 đến 31/07/2026, áp dụng cho 50.000 vé đầu tiên. Đặt sớm để chọn ghế đẹp.',
    category: 'promotion',
    tags: ['Khuyến mãi', 'Ưu đãi hè'],
    featuredImage: IMG.promo,
    readTime: 2,
    daysAgo: 15,
    views: 18204,
    content:
      `<p class="vxn-lead">Mùa hè 2026, VXN tung gói ưu đãi lớn nhất năm cho toàn bộ tuyến miền Bắc.</p>` +
      `<h2>Chi tiết ưu đãi</h2><p>Giảm tới 35% giá vé, áp dụng cho 50.000 vé đầu tiên đặt qua ứng dụng và website từ 15/05 đến 31/07/2026.</p>` +
      `<h2>Cách nhận</h2><p>Mã giảm tự động áp dụng ở bước thanh toán cho khách thành viên. Khách mới chỉ cần đăng ký tài khoản trước khi đặt.</p>` +
      tip(
        'ĐẶT SỚM',
        'Số lượng có hạn — đặt sớm vừa được giá tốt vừa chọn được ghế tầng dưới, vị trí giữa xe.'
      ),
  },
  {
    slug: 'limousine-vs-giuong-nam-chon-loai-nao',
    title: 'Xe limousine vs giường nằm — chọn loại nào cho chuyến của bạn?',
    excerpt:
      'Limousine nhanh, riêng tư, hợp chuyến ngắn dưới 5 giờ. Giường nằm rẻ hơn, nằm thẳng lưng cho chuyến đêm dài.',
    category: 'guide',
    tags: ['Limousine', 'Giường nằm', 'Cẩm nang'],
    featuredImage: IMG.limousine,
    readTime: 6,
    daysAgo: 18,
    views: 5120,
    content:
      `<p class="vxn-lead">Hai dòng xe phổ biến nhất hiện nay, mỗi loại có thế mạnh riêng. Chọn đúng giúp chuyến đi thoải mái hơn nhiều.</p>` +
      `<h2>Limousine</h2><p>9 — 11 chỗ, ghế ngả, không gian riêng tư, đón trả linh hoạt. Hợp chuyến dưới 5 giờ và khách ưu tiên tốc độ.</p>` +
      `<h2>Giường nằm</h2><p>34 — 44 giường, nằm duỗi thẳng, giá mềm. Là lựa chọn tối ưu cho chuyến đêm dài trên 6 giờ.</p>` +
      tip(
        'CHỌN NHANH',
        'Chuyến dưới 5 giờ ban ngày → limousine. Chuyến đêm trên 6 giờ → giường nằm cabin VIP.'
      ),
  },
  {
    slug: 'san-ve-tet-2027-checklist-6-buoc',
    title: 'Săn vé Tết 2027 — checklist 6 bước không bỏ lỡ chuyến về nhà',
    excerpt:
      'Vé Tết mở bán sớm và hết rất nhanh. 6 bước chuẩn bị giúp bạn chắc suất về quê đón Tết.',
    category: 'guide',
    tags: ['Vé Tết', 'Checklist', 'Cẩm nang'],
    featuredImage: IMG.tet,
    readTime: 5,
    daysAgo: 21,
    views: 9870,
    content:
      `<p class="vxn-lead">Cao điểm Tết, vé các tuyến hot có thể hết trong vài giờ. Đây là checklist 6 bước để không lỡ chuyến.</p>` +
      `<h2>Chuẩn bị trước</h2><p>1. Đăng ký tài khoản & xác thực sớm. 2. Lưu sẵn danh sách hành khách. 3. Bật thông báo lịch mở bán.</p>` +
      `<h2>Khi mở bán</h2><p>4. Vào trước giờ mở 10 phút. 5. Chọn chuyến dự phòng. 6. Thanh toán nhanh trong thời gian giữ ghế.</p>` +
      tip(
        'QUAN TRỌNG',
        'Vé giữ tạm chỉ trong thời gian giới hạn — chuẩn bị sẵn phương thức thanh toán để không mất chỗ.'
      ),
  },
  {
    slug: 'vxn-ra-mat-12-tuyen-mien-tay',
    title: 'VXN ra mắt 12 tuyến mới khu vực miền Tây',
    excerpt:
      'Mở rộng mạng lưới về Cần Thơ, Cà Mau, Châu Đốc, Hà Tiên... với nhà xe đối tác đã xác thực.',
    category: 'company',
    tags: ['Tin VXN', 'Mở tuyến', 'Miền Tây'],
    featuredImage: IMG.western,
    readTime: 3,
    daysAgo: 24,
    views: 3410,
    content:
      `<p class="vxn-lead">VXN tiếp tục mở rộng mạng lưới với 12 tuyến mới khu vực Đồng bằng sông Cửu Long.</p>` +
      `<h2>Các tuyến mới</h2><p>TP.HCM đi Cần Thơ, Cà Mau, Châu Đốc, Hà Tiên, Bạc Liêu... với tần suất từ 4 — 12 chuyến/ngày.</p>` +
      `<h2>Cam kết chất lượng</h2><p>Toàn bộ nhà xe đối tác đều được xác thực, có đánh giá minh bạch từ hành khách thực tế.</p>` +
      tip(
        'TRẢI NGHIỆM',
        'Đặt thử tuyến mới trong tháng ra mắt để nhận ưu đãi giới thiệu dành cho khách tiên phong.'
      ),
  },
];

const FAQS = [
  // Đặt vé
  [
    'booking',
    'Đặt vé qua VXN có cần đăng ký tài khoản không?',
    'Bạn có thể đặt vé với tư cách khách (guest) chỉ với số điện thoại và email. Tuy nhiên, đăng ký tài khoản giúp bạn tích điểm thưởng, tra cứu vé nhanh và lưu danh sách hành khách thường đi.',
    1,
    ['tài khoản', 'guest'],
  ],
  [
    'booking',
    'Có thể đặt vé cho người khác đi không?',
    'Hoàn toàn được. Ở bước nhập thông tin hành khách, bạn chỉ cần điền đúng họ tên và số điện thoại của người đi thực tế. Vé điện tử sẽ được gửi tới email/điện thoại bạn đăng ký khi đặt.',
    2,
    ['đặt hộ'],
  ],
  [
    'booking',
    'Đặt tối đa bao nhiêu vé trong một lần?',
    'Mỗi lượt đặt hỗ trợ tối đa số ghế còn trống của chuyến, thông thường tới 10 vé/giao dịch. Với đoàn lớn hơn, vui lòng liên hệ CSKH để được hỗ trợ đặt theo đoàn.',
    3,
    ['nhóm', 'đoàn'],
  ],
  [
    'booking',
    'Vé giữ tạm thời trong bao lâu trước khi thanh toán?',
    'Sau khi chọn ghế, hệ thống giữ chỗ cho bạn trong một khoảng thời gian giới hạn để hoàn tất thanh toán. Hết thời gian, ghế sẽ được mở lại cho khách khác.',
    4,
    ['giữ ghế'],
  ],
  [
    'booking',
    'Trẻ em có cần mua vé riêng không?',
    'Quy định theo từng nhà xe. Thông thường trẻ dưới một chiều cao/độ tuổi nhất định được miễn vé khi ngồi cùng người lớn; trẻ lớn hơn cần mua vé như người lớn. Chi tiết hiển thị ở trang chính sách của chuyến.',
    5,
    ['trẻ em'],
  ],

  // Thanh toán
  [
    'payment',
    'VXN hỗ trợ những phương thức thanh toán nào?',
    'VXN hỗ trợ thanh toán qua cổng VNPay (thẻ ngân hàng nội địa, thẻ quốc tế, ví điện tử và QR). Một số tuyến hỗ trợ thanh toán khi lên xe tùy chính sách nhà xe.',
    1,
    ['vnpay', 'thẻ'],
  ],
  [
    'payment',
    'Thanh toán bị trừ tiền nhưng chưa nhận được vé thì sao?',
    'Trong đa số trường hợp vé sẽ được xác nhận trong vài phút. Nếu sau 15 phút chưa nhận được, vui lòng kiểm tra mục Hành trình hoặc liên hệ CSKH kèm mã giao dịch — khoản tiền sẽ được đối soát và hoàn nếu giao dịch không thành công.',
    2,
    ['lỗi thanh toán'],
  ],
  [
    'payment',
    'Tôi có nhận được hoá đơn VAT không?',
    'Có. Bạn có thể yêu cầu xuất hoá đơn điện tử cho đơn hàng trong mục chi tiết vé hoặc liên hệ CSKH trong vòng thời gian quy định kể từ ngày đi.',
    3,
    ['hoá đơn', 'vat'],
  ],

  // Đổi & huỷ vé
  [
    'cancellation',
    'Tôi có thể huỷ vé và được hoàn tiền không?',
    'Chính sách hoàn huỷ phụ thuộc từng nhà xe và thời điểm huỷ so với giờ khởi hành. Mức hoàn cụ thể được hiển thị rõ ở bước thanh toán và trong chi tiết vé.',
    1,
    ['hoàn tiền', 'huỷ'],
  ],
  [
    'cancellation',
    'Đổi giờ/đổi ngày chuyến đi như thế nào?',
    'Vào mục Hành trình, chọn vé cần đổi và làm theo hướng dẫn nếu nhà xe cho phép đổi. Phí đổi (nếu có) và khung thời gian được áp dụng theo chính sách hiển thị trên vé.',
    2,
    ['đổi vé'],
  ],
  [
    'cancellation',
    'Bao lâu thì tiền hoàn về tài khoản của tôi?',
    'Sau khi yêu cầu hoàn được duyệt, thời gian tiền về phụ thuộc ngân hàng/cổng thanh toán, thường trong vài ngày làm việc.',
    3,
    ['thời gian hoàn'],
  ],

  // Tài khoản
  [
    'account',
    'Làm sao để đặt lại mật khẩu khi quên?',
    'Tại màn hình đăng nhập, chọn "Quên mật khẩu", nhập email/số điện thoại đã đăng ký và làm theo hướng dẫn nhận mã xác thực để tạo mật khẩu mới.',
    1,
    ['mật khẩu'],
  ],
  [
    'account',
    'Tôi có thể đổi số điện thoại/email tài khoản không?',
    'Được. Vào Hồ sơ cá nhân để cập nhật thông tin. Một số thay đổi quan trọng có thể cần bước xác thực để bảo vệ tài khoản.',
    2,
    ['hồ sơ'],
  ],

  // Vé điện tử
  [
    'tickets',
    'Vé điện tử của tôi nằm ở đâu?',
    'Vé điện tử được gửi qua email/SMS sau khi thanh toán thành công và luôn có trong mục Hành trình của tài khoản. Bạn chỉ cần xuất trình mã QR khi lên xe.',
    1,
    ['vé điện tử', 'qr'],
  ],
  [
    'tickets',
    'Tôi có cần in vé giấy không?',
    'Không cần. Chỉ cần xuất trình mã QR trên điện thoại để nhân viên/quản lý chuyến quét khi lên xe.',
    2,
    ['in vé'],
  ],
  [
    'tickets',
    'Tra cứu vé khi đặt với tư cách khách (guest) thế nào?',
    'Dùng chức năng Tra cứu vé, nhập mã vé/đặt chỗ cùng số điện thoại đã dùng khi đặt để xem chi tiết và mã QR.',
    3,
    ['tra cứu', 'guest'],
  ],

  // Tuyến đường
  [
    'routes',
    'Làm sao biết điểm đón/trả cụ thể của chuyến?',
    'Điểm đón và điểm trả được hiển thị chi tiết ở trang chọn chuyến và trong chi tiết vé. Một số nhà xe có hỗ trợ trung chuyển — thông tin sẽ ghi rõ kèm theo.',
    1,
    ['điểm đón', 'trung chuyển'],
  ],
  [
    'routes',
    'Xe có dừng nghỉ dọc đường không?',
    'Các chuyến đường dài thường có 1 — 2 điểm dừng nghỉ. Thời gian và vị trí dừng tùy theo lịch trình của nhà xe, phụ xe sẽ thông báo trước khi tới trạm.',
    2,
    ['điểm dừng'],
  ],

  // Chính sách
  [
    'policies',
    'Quy định về hành lý ký gửi và xách tay ra sao?',
    'Thông thường mỗi khách được mang 20kg hành lý ký gửi và 1 kiện xách tay không quá 7kg. Phần vượt và vật phẩm hạn chế áp dụng theo chính sách của từng nhà xe.',
    1,
    ['hành lý'],
  ],
  [
    'policies',
    'Mang theo thú cưng có được không?',
    'Tùy chính sách từng nhà xe. Nếu được phép, thú cưng cần có lồng/giỏ phù hợp và tuân thủ quy định vệ sinh, an toàn cho hành khách khác.',
    2,
    ['thú cưng'],
  ],

  // Kỹ thuật
  [
    'technical',
    'Ứng dụng/website báo lỗi khi đặt vé, tôi nên làm gì?',
    'Hãy thử tải lại trang, kiểm tra kết nối mạng hoặc cập nhật ứng dụng lên bản mới nhất. Nếu vẫn lỗi, liên hệ CSKH kèm ảnh chụp màn hình để được hỗ trợ nhanh.',
    1,
    ['lỗi', 'bug'],
  ],
  [
    'technical',
    'Tôi không nhận được email/SMS xác nhận vé?',
    'Kiểm tra hộp thư rác/quảng cáo và đảm bảo email/số điện thoại nhập đúng. Vé luôn có sẵn trong mục Hành trình; nếu cần gửi lại, liên hệ CSKH.',
    2,
    ['không nhận email'],
  ],
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quikride', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  logger.info('MongoDB Connected (seedContent)');

  const author = await User.findOne({ role: 'admin' }).select('_id');
  if (!author) throw new Error('No admin user found to use as blog author');

  // ---- Blogs (upsert by slug) ----
  let blogCreated = 0;
  let blogUpdated = 0;
  for (const b of BLOGS) {
    const publishedAt = new Date(Date.now() - b.daysAgo * 86400000);
    const doc = {
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt,
      content: b.content,
      featuredImage: b.featuredImage,
      category: b.category,
      tags: b.tags,
      author: author._id,
      status: 'published',
      publishedAt,
      viewCount: b.views || 0,
      likeCount: Math.floor((b.views || 0) / 120),
      readTime: b.readTime,
    };
    const existing = await Blog.findOne({ slug: b.slug });
    if (existing) {
      await Blog.updateOne({ slug: b.slug }, { $set: doc });
      blogUpdated += 1;
    } else {
      await Blog.create(doc);
      blogCreated += 1;
    }
  }

  // ---- FAQs (skip if same question already exists) ----
  let faqCreated = 0;
  let faqSkipped = 0;
  for (const [category, question, answer, order, tags] of FAQS) {
    const exists = await FAQ.findOne({ question });
    if (exists) {
      faqSkipped += 1;
      continue;
    }
    await FAQ.create({
      category,
      question,
      answer,
      order,
      tags,
      isActive: true,
      viewCount: Math.floor(Math.random() * 800 + 50),
      helpfulCount: Math.floor(Math.random() * 180 + 20),
      notHelpfulCount: Math.floor(Math.random() * 8),
    });
    faqCreated += 1;
  }

  logger.info(
    `Blogs: +${blogCreated} created, ${blogUpdated} updated. FAQs: +${faqCreated} created, ${faqSkipped} skipped.`
  );
  console.log(
    `Blogs: +${blogCreated} created, ${blogUpdated} updated. FAQs: +${faqCreated} created, ${faqSkipped} skipped.`
  );
  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('seedContent failed:', err);
  process.exit(1);
});
