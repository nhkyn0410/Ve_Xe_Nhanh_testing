const swaggerUi = require('swagger-ui-express');
const { components, paths } = require('./openapi');

const getServerUrl = (req) => {
  if (process.env.SWAGGER_SERVER_URL) {
    return process.env.SWAGGER_SERVER_URL.replace(/\/+$/, '');
  }

  return `${req.protocol}://${req.get('host')}`;
};

const buildSwaggerSpec = (serverUrl) => ({
  openapi: '3.0.3',
  info: {
    title: 'Vé Xe Nhanh API',
    version: '1.0.0',
    description: [
      'Tài liệu OpenAPI cho hệ thống Vé Xe Nhanh.',
      'Swagger UI được cấu hình theo hướng dễ mở rộng để có thể bổ sung mô tả endpoint theo từng nhóm route mà không cần thay đổi cấu trúc backend.',
    ].join(' '),
  },
  servers: [
    {
      url: serverUrl,
      description: 'Máy chủ API hiện tại',
    },
  ],
  tags: [
    { name: 'Hệ thống', description: 'Kiểm tra sức khỏe hệ thống và thông tin API cơ bản.' },
    { name: 'Xác thực', description: 'Đăng ký, đăng nhập và xác thực người dùng.' },
    { name: 'Người dùng', description: 'Hồ sơ, điểm thưởng và vé của khách hàng.' },
    { name: 'Nhà xe', description: 'Nghiệp vụ công khai và vận hành dành cho nhà xe.' },
    { name: 'Quản trị', description: 'Quản trị người dùng, nhà xe, nội dung và báo cáo hệ thống.' },
    { name: 'Đặt chỗ', description: 'Giữ ghế, xác nhận đơn và quản lý đặt chỗ.' },
    { name: 'Xe', description: 'Tra cứu xe và dựng sơ đồ ghế.' },
    { name: 'Khiếu nại', description: 'Tiếp nhận và xử lý khiếu nại.' },
    { name: 'Nội dung', description: 'Banner, bài viết và FAQ hiển thị cho người dùng.' },
    { name: 'Nhân viên', description: 'Đăng nhập và công việc dành cho nhân viên nhà xe.' },
    { name: 'Khách vãng lai', description: 'OTP và phiên làm việc cho khách chưa có tài khoản.' },
    { name: 'Thanh toán', description: 'Phương thức thanh toán, giao dịch và đối soát.' },
    { name: 'Đánh giá', description: 'Đánh giá chuyến đi và phản hồi đánh giá.' },
    { name: 'Tuyến đường', description: 'Tra cứu tuyến xe công khai.' },
    { name: 'Vé', description: 'Tra cứu, phát hành và thao tác trên vé.' },
    { name: 'Chuyến đi', description: 'Tra cứu chuyến đi và giá động.' },
    { name: 'Điều hành chuyến', description: 'Nghiệp vụ điều hành trong ngày chạy xe.' },
    { name: 'Mã giảm giá', description: 'Kiểm tra và lấy danh sách mã giảm giá công khai.' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    ...components,
  },
  paths,
});

const setupSwagger = (app, apiVersion) => {
  app.get('/api-docs.json', (req, res) => {
    res.json(buildSwaggerSpec(getServerUrl(req)));
  });

  app.get(`/api/${apiVersion}/docs.json`, (req, res) => {
    res.json(buildSwaggerSpec(getServerUrl(req)));
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(null, {
      explorer: true,
      customSiteTitle: 'Tài liệu API Vé Xe Nhanh',
      swaggerOptions: {
        url: '/api-docs.json',
        displayRequestDuration: true,
        persistAuthorization: true,
        docExpansion: 'list',
      },
    })
  );

  app.get(`/api/${apiVersion}/docs`, (req, res) => {
    res.redirect('/api-docs');
  });
};

module.exports = {
  setupSwagger,
};
