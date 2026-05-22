const refSchema = (name) => ({ $ref: `#/components/schemas/${name}` });
const refParameter = (name) => ({ $ref: `#/components/parameters/${name}` });

const jsonContent = (schema) => ({
  'application/json': {
    schema,
  },
});

const response = (description, schema = refSchema('ApiResponse')) => ({
  description,
  content: jsonContent(schema),
});

const buildResponses = ({
  successCode = '200',
  successDescription = 'Thành công.',
  successSchema = 'ApiResponse',
  validationError = false,
  auth = false,
  forbidden = auth,
  badRequest = true,
  notFound = false,
}) => {
  const responses = {
    [successCode]: response(successDescription, refSchema(successSchema)),
  };

  if (badRequest) {
    responses['400'] = response(
      'Yêu cầu không hợp lệ.',
      refSchema(validationError ? 'ValidationErrorResponse' : 'ApiErrorResponse')
    );
  }

  if (auth) {
    responses['401'] = response(
      'Bạn chưa đăng nhập hoặc phiên đăng nhập không hợp lệ.',
      refSchema('ApiErrorResponse')
    );
  }

  if (forbidden) {
    responses['403'] = response(
      'Bạn không có quyền thực hiện thao tác này.',
      refSchema('ApiErrorResponse')
    );
  }

  if (notFound) {
    responses['404'] = response(
      'Không tìm thấy dữ liệu phù hợp.',
      refSchema('ApiErrorResponse')
    );
  }

  return responses;
};

const makeOperation = ({
  tags,
  summary,
  description,
  parameters = [],
  requestBody,
  responses,
  security = false,
  deprecated = false,
}) => ({
  tags: Array.isArray(tags) ? tags : [tags],
  summary,
  description,
  ...(parameters.length > 0 ? { parameters } : {}),
  ...(requestBody ? { requestBody } : {}),
  ...(security ? { security: [{ bearerAuth: [] }] } : {}),
  ...(deprecated ? { deprecated } : {}),
  responses,
});

const jsonRequestBody = (schemaName, description, required = true) => ({
  description,
  required,
  content: jsonContent(refSchema(schemaName)),
});

const multipartAvatarRequestBody = {
  description: 'Tải ảnh đại diện mới cho tài khoản.',
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        properties: {
          avatar: {
            type: 'string',
            format: 'binary',
            description: 'Tệp ảnh đại diện.',
          },
        },
        required: ['avatar'],
      },
    },
  },
};

const components = {
  parameters: {
    IdParam: {
      name: 'id',
      in: 'path',
      required: true,
      description: 'ID bản ghi.',
      schema: { type: 'string', example: '661f4a7e07f0c2de0f8e9001' },
    },
    TokenParam: {
      name: 'token',
      in: 'path',
      required: true,
      description: 'Mã xác thực hoặc mã đặt lại mật khẩu.',
      schema: { type: 'string', example: 'verify-token-123' },
    },
    BookingIdParam: {
      name: 'bookingId',
      in: 'path',
      required: true,
      description: 'ID đặt chỗ.',
      schema: { type: 'string', example: '661f4a7e07f0c2de0f8e9010' },
    },
    BookingCodeParam: {
      name: 'bookingCode',
      in: 'path',
      required: true,
      description: 'Mã đặt chỗ.',
      schema: { type: 'string', example: 'BK000001' },
    },
    TripIdParam: {
      name: 'tripId',
      in: 'path',
      required: true,
      description: 'ID chuyến đi.',
      schema: { type: 'string', example: '661f4a7e07f0c2de0f8e9020' },
    },
    PaymentIdParam: {
      name: 'paymentId',
      in: 'path',
      required: true,
      description: 'ID giao dịch thanh toán.',
      schema: { type: 'string', example: '661f4a7e07f0c2de0f8e9030' },
    },
    PaymentCodeParam: {
      name: 'paymentCode',
      in: 'path',
      required: true,
      description: 'Mã thanh toán.',
      schema: { type: 'string', example: 'PAY000001' },
    },
    OperatorIdParam: {
      name: 'operatorId',
      in: 'path',
      required: true,
      description: 'ID nhà xe.',
      schema: { type: 'string', example: '661f4a7e07f0c2de0f8e9040' },
    },
    ReviewIdParam: {
      name: 'reviewId',
      in: 'path',
      required: true,
      description: 'ID đánh giá.',
      schema: { type: 'string', example: '661f4a7e07f0c2de0f8e9050' },
    },
    PassengerIdParam: {
      name: 'passengerId',
      in: 'path',
      required: true,
      description: 'ID hành khách đã lưu.',
      schema: { type: 'string', example: '661f4a7e07f0c2de0f8e9060' },
    },
    PointIdParam: {
      name: 'pointId',
      in: 'path',
      required: true,
      description: 'ID điểm đón hoặc điểm trả.',
      schema: { type: 'string', example: '661f4a7e07f0c2de0f8e9070' },
    },
    RoleParam: {
      name: 'role',
      in: 'path',
      required: true,
      description: 'Vai trò nhân viên.',
      schema: {
        type: 'string',
        enum: ['driver', 'trip_manager'],
        example: 'driver',
      },
    },
    SlugParam: {
      name: 'slug',
      in: 'path',
      required: true,
      description: 'Slug bài viết.',
      schema: { type: 'string', example: 'meo-dat-ve-xe-cuoi-tuan' },
    },
    IdentifierParam: {
      name: 'identifier',
      in: 'path',
      required: true,
      description: 'Định danh OTP, có thể là email hoặc số điện thoại.',
      schema: { type: 'string', example: '0901234567' },
    },
    BusTypeParam: {
      name: 'busType',
      in: 'path',
      required: true,
      description: 'Loại xe cần lấy mẫu bố trí ghế.',
      schema: {
        type: 'string',
        example: 'limousine',
      },
    },
    TemplateKeyParam: {
      name: 'templateKey',
      in: 'path',
      required: true,
      description: 'Khóa mẫu bố trí ghế.',
      schema: { type: 'string', example: 'limousine-22' },
    },
    PageQuery: {
      name: 'page',
      in: 'query',
      required: false,
      description: 'Số trang hiện tại.',
      schema: { type: 'integer', minimum: 1, example: 1 },
    },
    LimitQuery: {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Số bản ghi trên mỗi trang.',
      schema: { type: 'integer', minimum: 1, example: 10 },
    },
    SearchQuery: {
      name: 'search',
      in: 'query',
      required: false,
      description: 'Từ khóa tìm kiếm.',
      schema: { type: 'string', example: 'Đà Lạt' },
    },
    StatusQuery: {
      name: 'status',
      in: 'query',
      required: false,
      description: 'Trạng thái cần lọc.',
      schema: { type: 'string', example: 'scheduled' },
    },
    TypeQuery: {
      name: 'type',
      in: 'query',
      required: false,
      description: 'Loại dữ liệu cần lọc.',
      schema: { type: 'string', example: 'upcoming' },
    },
    FromDateQuery: {
      name: 'fromDate',
      in: 'query',
      required: false,
      description: 'Ngày bắt đầu lọc.',
      schema: { type: 'string', format: 'date', example: '2026-04-20' },
    },
    ToDateQuery: {
      name: 'toDate',
      in: 'query',
      required: false,
      description: 'Ngày kết thúc lọc.',
      schema: { type: 'string', format: 'date', example: '2026-04-30' },
    },
    PeriodQuery: {
      name: 'period',
      in: 'query',
      required: false,
      description: 'Khoảng thời gian thống kê.',
      schema: { type: 'string', example: 'month' },
    },
    StartDateQuery: {
      name: 'startDate',
      in: 'query',
      required: false,
      description: 'Ngày bắt đầu thống kê.',
      schema: { type: 'string', format: 'date', example: '2026-04-01' },
    },
    EndDateQuery: {
      name: 'endDate',
      in: 'query',
      required: false,
      description: 'Ngày kết thúc thống kê.',
      schema: { type: 'string', format: 'date', example: '2026-04-30' },
    },
  },
  schemas: {
    ApiResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', nullable: true, example: 'Thao tác thành công.' },
        data: {
          type: 'object',
          nullable: true,
          additionalProperties: true,
        },
      },
    },
    ApiErrorResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        message: { type: 'string', example: 'Yêu cầu không hợp lệ.' },
        code: { type: 'string', nullable: true, example: 'INVALID_TOKEN' },
      },
    },
    ValidationErrorResponse: {
      allOf: [
        refSchema('ApiErrorResponse'),
        {
          type: 'object',
          properties: {
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Email không hợp lệ.' },
                },
              },
            },
          },
        },
      ],
    },
    HealthResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'API đang chạy' },
        timestamp: { type: 'string', format: 'date-time' },
        environment: { type: 'string', example: 'production' },
      },
    },
    SystemInfoResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'API v1' },
        version: { type: 'string', example: '1.0.0' },
        documentation: { type: 'string', example: '/api/v1/docs' },
      },
    },
    UserSummary: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '661f4a7e07f0c2de0f8e9001' },
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        phone: { type: 'string', example: '0901234567' },
        fullName: { type: 'string', example: 'Nguyễn Văn A' },
        role: { type: 'string', example: 'customer' },
        isEmailVerified: { type: 'boolean', example: true },
        isPhoneVerified: { type: 'boolean', example: false },
      },
    },
    OperatorSummary: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '661f4a7e07f0c2de0f8e9123' },
        companyName: { type: 'string', example: 'Xe Nhanh Express' },
        operatorName: { type: 'string', example: 'Vé Xe Nhanh Express' },
        email: { type: 'string', format: 'email', example: 'operator@example.com' },
        phone: { type: 'string', example: '0908888888' },
        taxCode: { type: 'string', example: '0312345678' },
        businessLicense: { type: 'string', example: 'GPKD-001' },
        isActive: { type: 'boolean', example: true },
      },
    },
    AuthTokens: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
    AuthSuccessResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Đăng nhập thành công' },
        data: {
          type: 'object',
          properties: {
            user: refSchema('UserSummary'),
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    OperatorAuthSuccessResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Đăng nhập thành công' },
        data: {
          type: 'object',
          properties: {
            operator: refSchema('OperatorSummary'),
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    UserProfileResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            user: refSchema('UserSummary'),
          },
        },
      },
    },
    UserCreatedResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Tạo tài khoản admin thành công' },
        data: {
          type: 'object',
          properties: {
            user: refSchema('UserSummary'),
          },
        },
      },
    },
    BootstrapAdminResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Khởi tạo admin đầu tiên thành công' },
        data: {
          type: 'object',
          properties: {
            user: refSchema('UserSummary'),
          },
        },
      },
    },
    RegisterRequest: {
      type: 'object',
      required: ['email', 'phone', 'password', 'fullName'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        phone: { type: 'string', example: '0901234567' },
        password: { type: 'string', format: 'password', example: 'SecurePass123' },
        fullName: { type: 'string', example: 'Nguyễn Văn A' },
      },
    },
    LoginRequest: {
      type: 'object',
      required: ['identifier', 'password'],
      properties: {
        identifier: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', format: 'password', example: 'SecurePass123' },
        rememberMe: { type: 'boolean', example: true },
      },
    },
    AdminLoginRequest: {
      type: 'object',
      required: ['identifier', 'password'],
      properties: {
        identifier: { type: 'string', example: 'admin@vexenhanh.com' },
        password: { type: 'string', format: 'password', example: 'Admin123' },
        rememberMe: { type: 'boolean', example: true },
      },
    },
    CreateAdminRequest: {
      type: 'object',
      required: ['email', 'phone', 'password', 'fullName'],
      properties: {
        email: { type: 'string', format: 'email', example: 'admin2@vexenhanh.com' },
        phone: { type: 'string', example: '0901234568' },
        password: { type: 'string', format: 'password', example: 'Admin123' },
        fullName: { type: 'string', example: 'Nguyen Van Admin' },
      },
    },
    BootstrapAdminRequest: {
      type: 'object',
      required: ['email', 'phone', 'password', 'fullName'],
      properties: {
        email: { type: 'string', format: 'email', example: 'admin@vexenhanh.com' },
        phone: { type: 'string', example: '0901234567' },
        password: { type: 'string', format: 'password', example: 'Admin123' },
        fullName: { type: 'string', example: 'System Administrator' },
        bootstrapSecret: {
          type: 'string',
          nullable: true,
          example: 'setup-first-admin-secret',
          description: 'Bắt buộc khi backend có cấu hình ADMIN_BOOTSTRAP_SECRET.',
        },
      },
    },
    RefreshTokenRequest: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
    ForgotPasswordRequest: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
      },
    },
    ResetPasswordRequest: {
      type: 'object',
      required: ['resetToken', 'newPassword'],
      properties: {
        resetToken: { type: 'string', example: 'reset-token-123' },
        newPassword: { type: 'string', format: 'password', example: 'NewSecurePass123' },
      },
    },
    VerifyPhoneRequest: {
      type: 'object',
      required: ['otp'],
      properties: {
        otp: { type: 'string', example: '123456' },
      },
    },
    OAuthRequest: {
      type: 'object',
      properties: {
        googleToken: { type: 'string', nullable: true },
        facebookToken: { type: 'string', nullable: true },
        profile: {
          type: 'object',
          additionalProperties: true,
          nullable: true,
        },
      },
      additionalProperties: true,
    },
    UpdateProfileRequest: {
      type: 'object',
      properties: {
        fullName: { type: 'string', example: 'Nguyễn Văn B' },
        dateOfBirth: { type: 'string', format: 'date', example: '1998-10-20' },
        gender: {
          type: 'string',
          enum: ['male', 'female', 'other'],
          example: 'male',
        },
      },
    },
    ChangePasswordRequest: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string', format: 'password', example: 'OldPass123' },
        newPassword: { type: 'string', format: 'password', example: 'NewPass123' },
      },
    },
    SavedPassengerRequest: {
      type: 'object',
      required: ['fullName', 'phone', 'idCard'],
      properties: {
        fullName: { type: 'string', example: 'Trần Thị B' },
        phone: { type: 'string', example: '0902345678' },
        idCard: { type: 'string', example: '079204001234' },
        email: { type: 'string', format: 'email', nullable: true },
      },
    },
    LoyaltyRedeemRequest: {
      type: 'object',
      properties: {
        points: { type: 'integer', example: 1000 },
        rewardId: { type: 'string', example: 'reward-voucher-01' },
      },
      additionalProperties: true,
    },
    OperatorRegisterRequest: {
      type: 'object',
      required: ['companyName', 'email', 'phone', 'password', 'businessLicense', 'taxCode'],
      properties: {
        companyName: { type: 'string', example: 'Xe Nhanh Express' },
        operatorName: { type: 'string', example: 'Vé Xe Nhanh Express' },
        email: { type: 'string', format: 'email', example: 'operator@example.com' },
        phone: { type: 'string', example: '0908888888' },
        password: { type: 'string', format: 'password', example: 'SecurePass123' },
        businessLicense: { type: 'string', example: 'GPKD-001' },
        taxCode: { type: 'string', example: '0312345678' },
        address: { type: 'string', nullable: true },
        website: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
      },
    },
    OperatorLoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'operator@example.com' },
        password: { type: 'string', format: 'password', example: 'SecurePass123' },
        rememberMe: { type: 'boolean', example: false },
      },
    },
    EmployeeLoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'hoa.manager@phuongtrang.com' },
        password: { type: 'string', format: 'password', example: 'manager123' },
      },
      additionalProperties: true,
    },
    TripManagerLoginRequest: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: {
          type: 'string',
          example: 'TM-PT-001',
        },
        password: {
          type: 'string',
          format: 'password',
          example: 'manager123',
        },
      },
    },
    GenericPayload: {
      type: 'object',
      additionalProperties: true,
      example: {
        name: 'Ví dụ dữ liệu',
      },
    },
    GenericStatusRequest: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'active' },
      },
      additionalProperties: true,
    },
    GenericReasonRequest: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: 'Cần cập nhật theo yêu cầu vận hành.' },
      },
      additionalProperties: true,
    },
    AssignComplaintRequest: {
      type: 'object',
      properties: {
        assignedTo: { type: 'string', example: '661f4a7e07f0c2de0f8e9001' },
      },
      additionalProperties: true,
    },
    ComplaintPriorityRequest: {
      type: 'object',
      properties: {
        priority: {
          type: 'string',
          example: 'high',
        },
      },
      additionalProperties: true,
    },
    ComplaintResolutionRequest: {
      type: 'object',
      properties: {
        resolution: {
          type: 'string',
          example: 'Đã liên hệ khách hàng và xử lý hoàn tiền.',
        },
      },
      additionalProperties: true,
    },
    ComplaintNoteRequest: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          example: 'Khách hàng đã cung cấp thêm bằng chứng.',
        },
        isInternal: {
          type: 'boolean',
          example: false,
        },
      },
      additionalProperties: true,
    },
    SatisfactionRequest: {
      type: 'object',
      properties: {
        satisfactionRating: { type: 'integer', example: 5 },
        satisfactionFeedback: {
          type: 'string',
          example: 'Dịch vụ hỗ trợ nhanh và rõ ràng.',
        },
      },
      additionalProperties: true,
    },
    ComplaintCreateRequest: {
      type: 'object',
      properties: {
        subject: { type: 'string', example: 'Xe khởi hành trễ' },
        description: {
          type: 'string',
          example: 'Chuyến xe khởi hành trễ 30 phút nhưng không có thông báo trước.',
        },
        category: { type: 'string', example: 'service' },
        bookingId: { type: 'string', nullable: true },
      },
      additionalProperties: true,
    },
    SeatLayoutBuildRequest: {
      type: 'object',
      properties: {
        busType: { type: 'string', example: 'limousine' },
        templateKey: { type: 'string', example: 'limousine-22' },
      },
      additionalProperties: true,
    },
    SeatLayoutValidateRequest: {
      type: 'object',
      properties: {
        busType: { type: 'string', example: 'limousine' },
        layout: {
          type: 'object',
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
    GuestOtpRequest: {
      type: 'object',
      properties: {
        phone: { type: 'string', nullable: true, example: '0901234567' },
        email: { type: 'string', nullable: true, example: 'guest@example.com' },
      },
    },
    GuestOtpVerifyRequest: {
      type: 'object',
      properties: {
        phone: { type: 'string', nullable: true, example: '0901234567' },
        email: { type: 'string', nullable: true, example: 'guest@example.com' },
        otp: { type: 'string', example: '123456' },
      },
      required: ['otp'],
    },
    GuestSessionUpdateRequest: {
      type: 'object',
      additionalProperties: true,
      example: {
        fullName: 'Khách vãng lai',
        phone: '0901234567',
      },
    },
    BookingHoldRequest: {
      type: 'object',
      properties: {
        tripId: { type: 'string', example: '661f4a7e07f0c2de0f8e9020' },
        seats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              seatNumber: { type: 'string', example: 'A1' },
            },
          },
        },
      },
      additionalProperties: true,
    },
    BookingConfirmRequest: {
      type: 'object',
      additionalProperties: true,
      example: {
        paymentMethod: 'vnpay',
        contactInfo: {
          name: 'Nguyễn Văn A',
          phone: '0901234567',
        },
      },
    },
    VoucherValidateRequest: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'WELCOME50' },
        bookingAmount: { type: 'number', example: 250000 },
        operatorId: { type: 'string', nullable: true },
        routeId: { type: 'string', nullable: true },
      },
      required: ['code'],
    },
    PaymentCreateRequest: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', example: '661f4a7e07f0c2de0f8e9010' },
        method: { type: 'string', example: 'vnpay' },
        returnUrl: { type: 'string', nullable: true },
      },
      additionalProperties: true,
    },
    RefundRequest: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 100000 },
        reason: { type: 'string', example: 'Khách hàng hủy vé đúng chính sách.' },
      },
      additionalProperties: true,
    },
    ReviewCreateRequest: {
      type: 'object',
      properties: {
        rating: { type: 'integer', example: 5 },
        comment: {
          type: 'string',
          example: 'Chuyến đi đúng giờ, phục vụ tốt.',
        },
      },
      additionalProperties: true,
    },
    ReviewOperatorResponseRequest: {
      type: 'object',
      properties: {
        response: {
          type: 'string',
          example: 'Cảm ơn bạn đã phản hồi. Nhà xe sẽ tiếp tục cải thiện dịch vụ.',
        },
      },
      required: ['response'],
    },
    ReviewReportRequest: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          example: 'Nội dung không phù hợp.',
        },
      },
      additionalProperties: true,
    },
    TicketLookupRequest: {
      type: 'object',
      required: ['ticketCode', 'phone'],
      properties: {
        ticketCode: { type: 'string', example: 'TK000001' },
        phone: { type: 'string', example: '0901234567' },
      },
    },
    TicketLookupOtpRequest: {
      type: 'object',
      properties: {
        phone: { type: 'string', nullable: true, example: '0901234567' },
        email: { type: 'string', nullable: true, example: 'user@example.com' },
      },
    },
    TicketLookupOtpVerifyRequest: {
      type: 'object',
      properties: {
        phone: { type: 'string', nullable: true, example: '0901234567' },
        email: { type: 'string', nullable: true, example: 'user@example.com' },
        otp: { type: 'string', example: '123456' },
      },
      required: ['otp'],
    },
    TicketGenerateRequest: {
      type: 'object',
      required: ['bookingId'],
      properties: {
        bookingId: { type: 'string', example: '661f4a7e07f0c2de0f8e9010' },
      },
    },
    VerifyQrRequest: {
      type: 'object',
      required: ['qrCodeData'],
      properties: {
        qrCodeData: {
          type: 'string',
          example: 'base64-or-encrypted-qr-payload',
        },
      },
    },
    TicketCancelRequest: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          example: 'Thay đổi kế hoạch cá nhân.',
        },
      },
      additionalProperties: true,
    },
    TicketChangeRequest: {
      type: 'object',
      required: ['newTripId', 'seats'],
      properties: {
        newTripId: { type: 'string', example: '661f4a7e07f0c2de0f8e9021' },
        seats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              seatNumber: { type: 'string', example: 'B2' },
            },
          },
        },
        reason: {
          type: 'string',
          nullable: true,
          example: 'Muốn đổi sang chuyến buổi tối.',
        },
      },
    },
    TripStatusRequest: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
          example: 'ongoing',
        },
        reason: {
          type: 'string',
          nullable: true,
          example: 'Bắt đầu đón khách.',
        },
      },
    },
    JourneyStatusRequest: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['preparing', 'checking_tickets', 'in_transit', 'at_stop', 'completed', 'cancelled'],
          example: 'in_transit',
        },
        stopIndex: {
          type: 'integer',
          nullable: true,
          example: 1,
        },
        location: {
          type: 'object',
          nullable: true,
          properties: {
            lat: { type: 'number', example: 10.762622 },
            lng: { type: 'number', example: 106.660172 },
          },
        },
        notes: {
          type: 'string',
          nullable: true,
          example: 'Xe đã rời trạm dừng gần nhất.',
        },
      },
    },
  },
};

const systemPaths = {
  '/health': {
    get: makeOperation({
      tags: 'Hệ thống',
      summary: 'Kiểm tra trạng thái dịch vụ',
      description: 'Trả về thông tin cơ bản để xác nhận backend đang hoạt động.',
      responses: {
        '200': response('Dịch vụ đang hoạt động.', refSchema('HealthResponse')),
      },
    }),
  },
  '/api/v1': {
    get: makeOperation({
      tags: 'Hệ thống',
      summary: 'Lấy thông tin API',
      description: 'Trả về phiên bản API hiện tại và đường dẫn tài liệu Swagger.',
      responses: {
        '200': response('Thông tin API.', refSchema('SystemInfoResponse')),
      },
    }),
  },
};

const authPaths = {
  '/api/v1/auth/register': {
    post: makeOperation({
      tags: 'Xác thực',
      summary: 'Đăng ký tài khoản khách hàng',
      description: 'Tạo mới một tài khoản khách hàng và trả về bộ token đăng nhập.',
      requestBody: jsonRequestBody('RegisterRequest', 'Thông tin đăng ký tài khoản khách hàng.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Đăng ký thành công.',
        successSchema: 'AuthSuccessResponse',
        validationError: true,
      }),
    }),
  },
  '/api/v1/auth/login': {
    post: makeOperation({
      tags: 'Xác thực',
      summary: 'Đăng nhập tài khoản',
      description: 'Đăng nhập bằng email hoặc số điện thoại để lấy access token và refresh token cho tài khoản người dùng.',
      requestBody: jsonRequestBody('LoginRequest', 'Thông tin đăng nhập của khách hàng.'),
      responses: {
        '200': response('Đăng nhập thành công.', refSchema('AuthSuccessResponse')),
        '400': response('Yêu cầu không hợp lệ.', refSchema('ValidationErrorResponse')),
        '401': response('Email/số điện thoại hoặc mật khẩu không đúng.', refSchema('ApiErrorResponse')),
      },
    }),
  },
  '/api/v1/auth/refresh-token': {
    post: makeOperation({
      tags: 'Xác thực',
      summary: 'Làm mới access token',
      description: 'Sử dụng refresh token để cấp lại access token mới.',
      requestBody: jsonRequestBody('RefreshTokenRequest', 'Refresh token hợp lệ.'),
      responses: buildResponses({
        successDescription: 'Làm mới token thành công.',
      }),
    }),
  },
  '/api/v1/auth/forgot-password': {
    post: makeOperation({
      tags: 'Xác thực',
      summary: 'Gửi yêu cầu quên mật khẩu',
      description: 'Gửi email đặt lại mật khẩu tới địa chỉ email đã đăng ký.',
      requestBody: jsonRequestBody('ForgotPasswordRequest', 'Email cần đặt lại mật khẩu.'),
      responses: buildResponses({
        successDescription: 'Đã tiếp nhận yêu cầu quên mật khẩu.',
      }),
    }),
  },
  '/api/v1/auth/reset-password': {
    post: makeOperation({
      tags: 'Xác thực',
      summary: 'Đặt lại mật khẩu',
      description: 'Đặt lại mật khẩu bằng mã reset hợp lệ.',
      requestBody: jsonRequestBody('ResetPasswordRequest', 'Mã reset và mật khẩu mới.'),
      responses: buildResponses({
        successDescription: 'Đặt lại mật khẩu thành công.',
      }),
    }),
  },
  '/api/v1/auth/verify-email/{token}': {
    get: makeOperation({
      tags: 'Xác thực',
      summary: 'Xác thực email',
      description: 'Kích hoạt email của tài khoản bằng mã xác thực.',
      parameters: [refParameter('TokenParam')],
      responses: buildResponses({
        successDescription: 'Xác thực email thành công.',
        successSchema: 'ApiResponse',
        notFound: false,
      }),
    }),
  },
  '/api/v1/auth/google': {
    post: makeOperation({
      tags: 'Xác thực',
      summary: 'Đăng nhập bằng Google',
      description: 'Đăng nhập hoặc đăng ký tài khoản bằng thông tin xác thực Google.',
      requestBody: jsonRequestBody('OAuthRequest', 'Google token hoặc hồ sơ Google đã xác thực.'),
      responses: buildResponses({
        successDescription: 'Đăng nhập bằng Google thành công.',
        successSchema: 'AuthSuccessResponse',
      }),
    }),
  },
  '/api/v1/auth/facebook': {
    post: makeOperation({
      tags: 'Xác thực',
      summary: 'Đăng nhập bằng Facebook',
      description: 'Đăng nhập hoặc đăng ký tài khoản bằng thông tin xác thực Facebook.',
      requestBody: jsonRequestBody('OAuthRequest', 'Facebook token hoặc hồ sơ Facebook đã xác thực.'),
      responses: buildResponses({
        successDescription: 'Đăng nhập bằng Facebook thành công.',
        successSchema: 'AuthSuccessResponse',
      }),
    }),
  },
  '/api/v1/auth/me': {
    get: makeOperation({
      tags: 'Xác thực',
      summary: 'Lấy tài khoản hiện tại',
      description: 'Trả về thông tin của người dùng đang đăng nhập.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thông tin tài khoản thành công.',
        successSchema: 'UserProfileResponse',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/auth/logout': {
    post: makeOperation({
      tags: 'Xác thực',
      summary: 'Đăng xuất',
      description: 'Kết thúc phiên làm việc hiện tại ở phía client.',
      security: true,
      responses: buildResponses({
        successDescription: 'Đăng xuất thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/auth/send-phone-otp': {
    post: makeOperation({
      tags: 'Xác thực',
      summary: 'Gửi OTP xác thực số điện thoại',
      description: 'Gửi mã OTP đến số điện thoại của tài khoản đang đăng nhập.',
      security: true,
      responses: buildResponses({
        successDescription: 'Đã gửi OTP xác thực số điện thoại.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/auth/verify-phone': {
    post: makeOperation({
      tags: 'Xác thực',
      summary: 'Xác thực số điện thoại',
      description: 'Xác thực số điện thoại bằng mã OTP đã gửi trước đó.',
      security: true,
      requestBody: jsonRequestBody('VerifyPhoneRequest', 'Mã OTP xác thực số điện thoại.'),
      responses: buildResponses({
        successDescription: 'Xác thực số điện thoại thành công.',
        auth: true,
        forbidden: false,
        validationError: true,
      }),
    }),
  },
};

const userPaths = {
  '/api/v1/users/profile': {
    get: makeOperation({
      tags: 'Người dùng',
      summary: 'Lấy hồ sơ khách hàng',
      description: 'Lấy thông tin hồ sơ của khách hàng đang đăng nhập.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy hồ sơ thành công.',
        successSchema: 'UserProfileResponse',
        auth: true,
        forbidden: false,
      }),
    }),
    put: makeOperation({
      tags: 'Người dùng',
      summary: 'Cập nhật hồ sơ khách hàng',
      description: 'Cập nhật các thông tin cơ bản trong hồ sơ khách hàng.',
      security: true,
      requestBody: jsonRequestBody('UpdateProfileRequest', 'Thông tin hồ sơ cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật hồ sơ thành công.',
        auth: true,
        forbidden: false,
        validationError: true,
      }),
    }),
  },
  '/api/v1/users/avatar': {
    post: makeOperation({
      tags: 'Người dùng',
      summary: 'Tải ảnh đại diện',
      description: 'Tải lên ảnh đại diện mới cho tài khoản khách hàng.',
      security: true,
      requestBody: multipartAvatarRequestBody,
      responses: buildResponses({
        successDescription: 'Tải ảnh đại diện thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
    delete: makeOperation({
      tags: 'Người dùng',
      summary: 'Xóa ảnh đại diện',
      description: 'Xóa ảnh đại diện hiện tại của khách hàng.',
      security: true,
      responses: buildResponses({
        successDescription: 'Xóa ảnh đại diện thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/users/change-password': {
    put: makeOperation({
      tags: 'Người dùng',
      summary: 'Đổi mật khẩu',
      description: 'Thay đổi mật khẩu của tài khoản khách hàng.',
      security: true,
      requestBody: jsonRequestBody('ChangePasswordRequest', 'Mật khẩu hiện tại và mật khẩu mới.'),
      responses: buildResponses({
        successDescription: 'Đổi mật khẩu thành công.',
        auth: true,
        forbidden: false,
        validationError: true,
      }),
    }),
  },
  '/api/v1/users/saved-passengers': {
    post: makeOperation({
      tags: 'Người dùng',
      summary: 'Thêm hành khách thường đi',
      description: 'Lưu nhanh thông tin hành khách để dùng lại khi đặt vé.',
      security: true,
      requestBody: jsonRequestBody('SavedPassengerRequest', 'Thông tin hành khách cần lưu.'),
      responses: buildResponses({
        successDescription: 'Thêm hành khách thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/users/saved-passengers/{passengerId}': {
    delete: makeOperation({
      tags: 'Người dùng',
      summary: 'Xóa hành khách thường đi',
      description: 'Xóa một hành khách đã lưu khỏi danh sách thường dùng.',
      security: true,
      parameters: [refParameter('PassengerIdParam')],
      responses: buildResponses({
        successDescription: 'Xóa hành khách thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
  '/api/v1/users/points-history': {
    get: makeOperation({
      tags: 'Người dùng',
      summary: 'Lấy lịch sử điểm thưởng',
      description: 'Lấy toàn bộ lịch sử tích lũy và sử dụng điểm thưởng của khách hàng.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy lịch sử điểm thưởng thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/users/loyalty/history': {
    get: makeOperation({
      tags: 'Người dùng',
      summary: 'Lấy lịch sử thành viên thân thiết',
      description: 'Xem lịch sử thay đổi hạng và các giao dịch liên quan đến chương trình thân thiết.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy lịch sử thành viên thân thiết thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/users/loyalty/overview': {
    get: makeOperation({
      tags: 'Người dùng',
      summary: 'Lấy tổng quan điểm thưởng',
      description: 'Lấy thông tin tổng quan về điểm hiện tại và hạng thành viên của khách hàng.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy tổng quan điểm thưởng thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/users/loyalty/redeem': {
    post: makeOperation({
      tags: 'Người dùng',
      summary: 'Đổi điểm thưởng',
      description: 'Đổi điểm tích lũy lấy ưu đãi hoặc phần thưởng.',
      security: true,
      requestBody: jsonRequestBody('LoyaltyRedeemRequest', 'Thông tin phần thưởng cần đổi bằng điểm.'),
      responses: buildResponses({
        successDescription: 'Đổi điểm thưởng thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/users/tickets': {
    get: makeOperation({
      tags: 'Người dùng',
      summary: 'Lấy danh sách vé của tôi',
      description: 'Lấy danh sách vé của khách hàng, hỗ trợ lọc theo trạng thái, khoảng thời gian và từ khóa.',
      security: true,
      parameters: [
        refParameter('TypeQuery'),
        refParameter('StatusQuery'),
        refParameter('SearchQuery'),
        refParameter('FromDateQuery'),
        refParameter('ToDateQuery'),
        refParameter('PageQuery'),
        refParameter('LimitQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy danh sách vé thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/users/tickets/{id}': {
    get: makeOperation({
      tags: 'Người dùng',
      summary: 'Lấy chi tiết vé',
      description: 'Lấy thông tin chi tiết của một vé theo ID.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết vé thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
  '/api/v1/users/tickets/{id}/download': {
    get: makeOperation({
      tags: 'Người dùng',
      summary: 'Tải vé PDF',
      description: 'Tải xuống vé điện tử ở định dạng PDF.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Tải vé PDF thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
  '/api/v1/users/tickets/{id}/resend': {
    post: makeOperation({
      tags: 'Người dùng',
      summary: 'Gửi lại thông tin vé',
      description: 'Gửi lại email hoặc thông báo chứa thông tin vé cho khách hàng.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Gửi lại thông tin vé thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
  '/api/v1/users/tickets/{id}/cancel': {
    post: makeOperation({
      tags: 'Người dùng',
      summary: 'Hủy vé',
      description: 'Hủy vé hiện có theo chính sách hoàn hủy của hệ thống.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('TicketCancelRequest', 'Lý do hủy vé, nếu có.', false),
      responses: buildResponses({
        successDescription: 'Hủy vé thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
};

const operatorPaths = {
  '/api/v1/operators/register': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Đăng ký nhà xe',
      description: 'Tạo tài khoản nhà xe mới để tham gia nền tảng.',
      requestBody: jsonRequestBody('OperatorRegisterRequest', 'Thông tin đăng ký nhà xe.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Đăng ký nhà xe thành công.',
        successSchema: 'OperatorAuthSuccessResponse',
      }),
    }),
  },
  '/api/v1/operators/login': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Đăng nhập nhà xe',
      description: 'Đăng nhập tài khoản nhà xe để quản trị vận hành.',
      requestBody: jsonRequestBody('OperatorLoginRequest', 'Thông tin đăng nhập nhà xe.'),
      responses: buildResponses({
        successDescription: 'Đăng nhập nhà xe thành công.',
        successSchema: 'OperatorAuthSuccessResponse',
      }),
    }),
  },
  '/api/v1/operators': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy danh sách nhà xe',
      description: 'Lấy danh sách công khai các nhà xe đang hiển thị trên hệ thống.',
      responses: buildResponses({
        successDescription: 'Lấy danh sách nhà xe thành công.',
      }),
    }),
  },
  '/api/v1/operators/{id}': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy chi tiết nhà xe',
      description: 'Lấy thông tin công khai của một nhà xe theo ID.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết nhà xe thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/me/profile': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy hồ sơ nhà xe',
      description: 'Lấy hồ sơ của nhà xe đang đăng nhập.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy hồ sơ nhà xe thành công.',
        auth: true,
      }),
    }),
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Cập nhật hồ sơ nhà xe',
      description: 'Cập nhật thông tin hồ sơ và nhận diện thương hiệu của nhà xe.',
      security: true,
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin hồ sơ nhà xe cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật hồ sơ nhà xe thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/dashboard/stats': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy thống kê bảng điều khiển',
      description: 'Lấy số liệu tổng quan phục vụ bảng điều khiển vận hành của nhà xe.',
      security: true,
      parameters: [
        refParameter('PeriodQuery'),
        refParameter('StartDateQuery'),
        refParameter('EndDateQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy thống kê bảng điều khiển thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/routes': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Tạo tuyến đường',
      description: 'Tạo mới một tuyến đường thuộc nhà xe đang đăng nhập.',
      security: true,
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin tuyến đường mới.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo tuyến đường thành công.',
        auth: true,
      }),
    }),
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy danh sách tuyến đường của nhà xe',
      description: 'Lấy toàn bộ tuyến đường do nhà xe quản lý.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách tuyến đường thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/routes/{id}': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy chi tiết tuyến đường',
      description: 'Lấy thông tin chi tiết của một tuyến đường thuộc nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết tuyến đường thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Cập nhật tuyến đường',
      description: 'Cập nhật thông tin tuyến đường của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin tuyến đường cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật tuyến đường thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    delete: makeOperation({
      tags: 'Nhà xe',
      summary: 'Xóa tuyến đường',
      description: 'Xóa một tuyến đường khỏi danh sách quản lý của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Xóa tuyến đường thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/routes/{id}/toggle-active': {
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Bật hoặc tắt tuyến đường',
      description: 'Chuyển trạng thái hiển thị hoặc hoạt động của tuyến đường.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Cập nhật trạng thái tuyến đường thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/routes/{id}/pickup-points': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Thêm điểm đón',
      description: 'Thêm một điểm đón mới vào tuyến đường của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin điểm đón cần thêm.'),
      responses: buildResponses({
        successDescription: 'Thêm điểm đón thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/routes/{id}/pickup-points/{pointId}': {
    delete: makeOperation({
      tags: 'Nhà xe',
      summary: 'Xóa điểm đón',
      description: 'Xóa một điểm đón khỏi tuyến đường của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam'), refParameter('PointIdParam')],
      responses: buildResponses({
        successDescription: 'Xóa điểm đón thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/routes/{id}/dropoff-points': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Thêm điểm trả',
      description: 'Thêm một điểm trả mới vào tuyến đường của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin điểm trả cần thêm.'),
      responses: buildResponses({
        successDescription: 'Thêm điểm trả thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/routes/{id}/dropoff-points/{pointId}': {
    delete: makeOperation({
      tags: 'Nhà xe',
      summary: 'Xóa điểm trả',
      description: 'Xóa một điểm trả khỏi tuyến đường của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam'), refParameter('PointIdParam')],
      responses: buildResponses({
        successDescription: 'Xóa điểm trả thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/buses': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Tạo xe',
      description: 'Tạo mới một xe thuộc đội xe của nhà xe.',
      security: true,
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin xe cần tạo.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo xe thành công.',
        auth: true,
      }),
    }),
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy danh sách xe của nhà xe',
      description: 'Lấy danh sách toàn bộ xe thuộc nhà xe đang đăng nhập.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách xe thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/buses/statistics': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy thống kê đội xe',
      description: 'Lấy số liệu thống kê về đội xe của nhà xe.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thống kê đội xe thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/buses/{id}': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy chi tiết xe',
      description: 'Lấy thông tin chi tiết của một xe thuộc nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết xe thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Cập nhật xe',
      description: 'Cập nhật thông tin của một xe thuộc nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin xe cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật xe thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    delete: makeOperation({
      tags: 'Nhà xe',
      summary: 'Xóa xe',
      description: 'Xóa một xe khỏi đội xe của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Xóa xe thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/buses/{id}/status': {
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Cập nhật trạng thái xe',
      description: 'Cập nhật trạng thái hoạt động của xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericStatusRequest', 'Trạng thái mới của xe.'),
      responses: buildResponses({
        successDescription: 'Cập nhật trạng thái xe thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/employees': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Tạo nhân viên',
      description: 'Tạo mới nhân viên lái xe hoặc điều hành chuyến cho nhà xe.',
      security: true,
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin nhân viên cần tạo.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo nhân viên thành công.',
        auth: true,
      }),
    }),
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy danh sách nhân viên',
      description: 'Lấy danh sách toàn bộ nhân viên của nhà xe.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách nhân viên thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/employees/statistics': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy thống kê nhân sự',
      description: 'Lấy số liệu thống kê về nhân viên của nhà xe.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thống kê nhân sự thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/employees/available/{role}': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy danh sách nhân viên khả dụng',
      description: 'Lấy danh sách nhân viên còn khả dụng theo vai trò để phân công chuyến.',
      security: true,
      parameters: [refParameter('RoleParam')],
      responses: buildResponses({
        successDescription: 'Lấy danh sách nhân viên khả dụng thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/employees/{id}': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy chi tiết nhân viên',
      description: 'Lấy thông tin chi tiết của một nhân viên.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết nhân viên thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Cập nhật nhân viên',
      description: 'Cập nhật hồ sơ nhân viên của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin nhân viên cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật nhân viên thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    delete: makeOperation({
      tags: 'Nhà xe',
      summary: 'Xóa nhân viên',
      description: 'Xóa một nhân viên khỏi hệ thống của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Xóa nhân viên thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/employees/{id}/status': {
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Cập nhật trạng thái nhân viên',
      description: 'Cập nhật trạng thái làm việc của nhân viên.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericStatusRequest', 'Trạng thái mới của nhân viên.'),
      responses: buildResponses({
        successDescription: 'Cập nhật trạng thái nhân viên thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/employees/{id}/reset-password': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Đặt lại mật khẩu nhân viên',
      description: 'Đặt lại mật khẩu cho một nhân viên thuộc nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Đặt lại mật khẩu nhân viên thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/trips': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Tạo chuyến đi',
      description: 'Tạo mới một chuyến đi thuộc nhà xe.',
      security: true,
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin chuyến đi cần tạo.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo chuyến đi thành công.',
        auth: true,
      }),
    }),
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy danh sách chuyến đi',
      description: 'Lấy toàn bộ chuyến đi thuộc phạm vi quản lý của nhà xe.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách chuyến đi thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/trips/recurring': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Tạo chuyến đi lặp lại',
      description: 'Tạo hàng loạt chuyến đi theo lịch lặp lại.',
      security: true,
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin lịch lặp lại của chuyến đi.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo chuyến đi lặp lại thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/trips/statistics': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy thống kê chuyến đi',
      description: 'Lấy số liệu thống kê về chuyến đi của nhà xe.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thống kê chuyến đi thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/trips/{id}': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy chi tiết chuyến đi',
      description: 'Lấy thông tin chi tiết của một chuyến đi thuộc nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết chuyến đi thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Cập nhật chuyến đi',
      description: 'Cập nhật thông tin vận hành của chuyến đi.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin chuyến đi cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật chuyến đi thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    delete: makeOperation({
      tags: 'Nhà xe',
      summary: 'Xóa chuyến đi',
      description: 'Xóa một chuyến đi khỏi danh sách vận hành của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Xóa chuyến đi thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/trips/{id}/dynamic-pricing': {
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Cấu hình giá linh hoạt',
      description: 'Thiết lập chính sách giá linh hoạt cho chuyến đi.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Cấu hình giá linh hoạt của chuyến đi.'),
      responses: buildResponses({
        successDescription: 'Cấu hình giá linh hoạt thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/trips/{id}/cancel': {
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Hủy chuyến đi',
      description: 'Hủy một chuyến đi và cập nhật trạng thái cho hành khách liên quan.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericReasonRequest', 'Lý do hủy chuyến đi.', false),
      responses: buildResponses({
        successDescription: 'Hủy chuyến đi thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/bookings': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy danh sách đặt chỗ của nhà xe',
      description: 'Lấy danh sách đặt chỗ phát sinh trên các chuyến thuộc nhà xe.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách đặt chỗ thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/bookings/statistics': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy thống kê đặt chỗ',
      description: 'Lấy số liệu thống kê về đơn đặt chỗ của nhà xe.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thống kê đặt chỗ thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/bookings/{bookingId}/payment': {
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Cập nhật thanh toán của đặt chỗ',
      description: 'Cập nhật trạng thái hoặc thông tin thanh toán của một đơn đặt chỗ.',
      security: true,
      parameters: [refParameter('BookingIdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin thanh toán cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật thanh toán thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/vouchers': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Tạo mã giảm giá',
      description: 'Tạo mới một mã giảm giá do nhà xe quản lý.',
      security: true,
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin mã giảm giá cần tạo.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo mã giảm giá thành công.',
        auth: true,
      }),
    }),
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy danh sách mã giảm giá',
      description: 'Lấy toàn bộ mã giảm giá do nhà xe tạo.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách mã giảm giá thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/vouchers/statistics': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy thống kê mã giảm giá',
      description: 'Lấy số liệu tổng quan về hiệu quả sử dụng mã giảm giá của nhà xe.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thống kê mã giảm giá thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/vouchers/{id}': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy chi tiết mã giảm giá',
      description: 'Lấy thông tin chi tiết của một mã giảm giá do nhà xe quản lý.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết mã giảm giá thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Cập nhật mã giảm giá',
      description: 'Cập nhật cấu hình hoặc nội dung của mã giảm giá.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin mã giảm giá cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật mã giảm giá thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    delete: makeOperation({
      tags: 'Nhà xe',
      summary: 'Xóa mã giảm giá',
      description: 'Xóa một mã giảm giá khỏi hệ thống nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Xóa mã giảm giá thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/vouchers/{id}/usage-report': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy báo cáo sử dụng mã giảm giá',
      description: 'Lấy báo cáo sử dụng chi tiết của một mã giảm giá.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy báo cáo sử dụng mã giảm giá thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/vouchers/{id}/activate': {
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Kích hoạt mã giảm giá',
      description: 'Kích hoạt lại một mã giảm giá của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Kích hoạt mã giảm giá thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/vouchers/{id}/deactivate': {
    put: makeOperation({
      tags: 'Nhà xe',
      summary: 'Vô hiệu hóa mã giảm giá',
      description: 'Tạm ngừng sử dụng một mã giảm giá của nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Vô hiệu hóa mã giảm giá thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/payments': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy danh sách thanh toán',
      description: 'Lấy danh sách giao dịch thanh toán thuộc phạm vi quản lý của nhà xe.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách thanh toán thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/payments/statistics': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy thống kê thanh toán',
      description: 'Lấy số liệu thống kê về các giao dịch thanh toán của nhà xe.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thống kê thanh toán thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/payments/{paymentId}/refund': {
    post: makeOperation({
      tags: 'Nhà xe',
      summary: 'Hoàn tiền giao dịch',
      description: 'Thực hiện hoàn tiền cho một giao dịch thanh toán.',
      security: true,
      parameters: [refParameter('PaymentIdParam')],
      requestBody: jsonRequestBody('RefundRequest', 'Thông tin hoàn tiền.'),
      responses: buildResponses({
        successDescription: 'Hoàn tiền giao dịch thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/operators/reports/revenue': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy báo cáo doanh thu',
      description: 'Lấy báo cáo doanh thu chi tiết của nhà xe.',
      security: true,
      parameters: [
        refParameter('StartDateQuery'),
        refParameter('EndDateQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy báo cáo doanh thu thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/reports/revenue/summary': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy tổng quan doanh thu',
      description: 'Lấy số liệu tổng quan doanh thu theo khoảng thời gian.',
      security: true,
      parameters: [
        refParameter('StartDateQuery'),
        refParameter('EndDateQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy tổng quan doanh thu thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/reports/revenue/by-route': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy doanh thu theo tuyến đường',
      description: 'Lấy báo cáo doanh thu được nhóm theo từng tuyến đường.',
      security: true,
      parameters: [
        refParameter('StartDateQuery'),
        refParameter('EndDateQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy doanh thu theo tuyến đường thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/reports/revenue/trend': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy xu hướng doanh thu',
      description: 'Lấy dữ liệu xu hướng doanh thu theo thời gian.',
      security: true,
      parameters: [
        refParameter('StartDateQuery'),
        refParameter('EndDateQuery'),
        refParameter('PeriodQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy xu hướng doanh thu thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/reports/cancellation': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy báo cáo hủy vé',
      description: 'Lấy báo cáo thống kê liên quan đến hủy vé và hủy chuyến.',
      security: true,
      parameters: [
        refParameter('StartDateQuery'),
        refParameter('EndDateQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy báo cáo hủy vé thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/operators/reports/growth': {
    get: makeOperation({
      tags: 'Nhà xe',
      summary: 'Lấy chỉ số tăng trưởng',
      description: 'Lấy các chỉ số tăng trưởng và hiệu suất vận hành của nhà xe.',
      security: true,
      parameters: [
        refParameter('StartDateQuery'),
        refParameter('EndDateQuery'),
        refParameter('PeriodQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy chỉ số tăng trưởng thành công.',
        auth: true,
      }),
    }),
  },
};

const adminPaths = {
  '/api/v1/admin/bootstrap': {
    post: makeOperation({
      tags: 'Quản trị',
      summary: 'Bootstrap admin đầu tiên',
      description: 'Khởi tạo tài khoản admin đầu tiên khi hệ thống chưa có admin nào. Sau khi đã có admin đầu tiên, endpoint này sẽ tự khóa. Nếu có cấu hình ADMIN_BOOTSTRAP_SECRET thì cần gửi thêm bootstrapSecret.',
      requestBody: jsonRequestBody('BootstrapAdminRequest', 'Thông tin admin đầu tiên cần khởi tạo.'),
      responses: {
        '201': response('Khởi tạo admin đầu tiên thành công.', refSchema('BootstrapAdminResponse')),
        '400': response('Yêu cầu không hợp lệ.', refSchema('ValidationErrorResponse')),
        '403': response('Bootstrap secret không hợp lệ.', refSchema('ApiErrorResponse')),
        '409': response('Hệ thống đã có admin và không còn cho phép bootstrap.', refSchema('ApiErrorResponse')),
      },
    }),
  },
  '/api/v1/admin/login': {
    post: makeOperation({
      tags: 'Quản trị',
      summary: 'Đăng nhập admin',
      description: 'Đăng nhập tài khoản quản trị bằng email hoặc số điện thoại. Endpoint này từ chối tài khoản không có vai trò admin.',
      requestBody: jsonRequestBody('AdminLoginRequest', 'Thông tin đăng nhập của quản trị viên.'),
      responses: {
        '200': response('Đăng nhập admin thành công.', refSchema('AuthSuccessResponse')),
        '400': response('Yêu cầu không hợp lệ.', refSchema('ValidationErrorResponse')),
        '401': response('Email/số điện thoại hoặc mật khẩu không đúng.', refSchema('ApiErrorResponse')),
        '403': response('Tài khoản không có quyền truy cập khu vực quản trị.', refSchema('ApiErrorResponse')),
      },
    }),
  },
  '/api/v1/admin/operators': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy danh sách nhà xe',
      description: 'Lấy danh sách toàn bộ nhà xe để quản trị viên xét duyệt và theo dõi.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách nhà xe thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/admin/operators/{id}': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy chi tiết nhà xe',
      description: 'Lấy thông tin chi tiết của một nhà xe để phục vụ quản trị.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết nhà xe thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/operators/{id}/approve': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Duyệt nhà xe',
      description: 'Phê duyệt hồ sơ đăng ký của một nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Duyệt nhà xe thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/operators/{id}/reject': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Từ chối nhà xe',
      description: 'Từ chối hồ sơ đăng ký của một nhà xe.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericReasonRequest', 'Lý do từ chối hồ sơ.', false),
      responses: buildResponses({
        successDescription: 'Từ chối nhà xe thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/operators/{id}/suspend': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Tạm ngưng nhà xe',
      description: 'Tạm ngưng hoạt động của một nhà xe trên hệ thống.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericReasonRequest', 'Lý do tạm ngưng hoạt động.', false),
      responses: buildResponses({
        successDescription: 'Tạm ngưng nhà xe thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/operators/{id}/resume': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Khôi phục nhà xe',
      description: 'Khôi phục hoạt động cho một nhà xe đã bị tạm ngưng.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Khôi phục nhà xe thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/users/statistics': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy thống kê người dùng',
      description: 'Lấy số liệu thống kê tổng quan về người dùng trên toàn hệ thống.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thống kê người dùng thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/admin/users': {
    post: makeOperation({
      tags: 'Quản trị',
      summary: 'Tạo tài khoản admin',
      description: 'Tạo thêm tài khoản quản trị mới. Chỉ admin đã đăng nhập mới có thể thực hiện thao tác này.',
      security: true,
      requestBody: jsonRequestBody('CreateAdminRequest', 'Thông tin tài khoản admin mới.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo tài khoản admin thành công.',
        successSchema: 'UserCreatedResponse',
        auth: true,
        validationError: true,
      }),
    }),
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy danh sách người dùng',
      description: 'Lấy danh sách người dùng để quản trị viên theo dõi và xử lý.',
      security: true,
      parameters: [
        refParameter('SearchQuery'),
        refParameter('StatusQuery'),
        refParameter('PageQuery'),
        refParameter('LimitQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy danh sách người dùng thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/admin/users/{id}': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy chi tiết người dùng',
      description: 'Lấy thông tin chi tiết của một người dùng trên hệ thống.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết người dùng thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/users/{id}/block': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Khóa người dùng',
      description: 'Khóa tài khoản của một người dùng.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericReasonRequest', 'Lý do khóa tài khoản.', false),
      responses: buildResponses({
        successDescription: 'Khóa người dùng thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/users/{id}/unblock': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Mở khóa người dùng',
      description: 'Mở khóa tài khoản của một người dùng.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Mở khóa người dùng thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/users/{id}/reset-password': {
    post: makeOperation({
      tags: 'Quản trị',
      summary: 'Đặt lại mật khẩu người dùng',
      description: 'Đặt lại mật khẩu cho tài khoản người dùng.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Đặt lại mật khẩu người dùng thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/reports/overview': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy tổng quan hệ thống',
      description: 'Lấy báo cáo tổng quan phục vụ bảng điều khiển quản trị.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy tổng quan hệ thống thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/admin/complaints/statistics': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy thống kê khiếu nại',
      description: 'Lấy số liệu thống kê toàn hệ thống về khiếu nại.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thống kê khiếu nại thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/admin/complaints': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy danh sách khiếu nại',
      description: 'Lấy danh sách khiếu nại để xử lý ở cấp quản trị.',
      security: true,
      parameters: [
        refParameter('StatusQuery'),
        refParameter('SearchQuery'),
        refParameter('PageQuery'),
        refParameter('LimitQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy danh sách khiếu nại thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/admin/complaints/{id}/assign': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Phân công xử lý khiếu nại',
      description: 'Phân công một người phụ trách xử lý khiếu nại.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('AssignComplaintRequest', 'Thông tin người được phân công.'),
      responses: buildResponses({
        successDescription: 'Phân công xử lý khiếu nại thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/complaints/{id}/status': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Cập nhật trạng thái khiếu nại',
      description: 'Cập nhật trạng thái xử lý của một khiếu nại.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericStatusRequest', 'Trạng thái xử lý mới của khiếu nại.'),
      responses: buildResponses({
        successDescription: 'Cập nhật trạng thái khiếu nại thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/complaints/{id}/priority': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Cập nhật mức độ ưu tiên khiếu nại',
      description: 'Cập nhật độ ưu tiên xử lý cho một khiếu nại.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('ComplaintPriorityRequest', 'Mức độ ưu tiên mới của khiếu nại.'),
      responses: buildResponses({
        successDescription: 'Cập nhật mức độ ưu tiên thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/complaints/{id}/resolve': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Đánh dấu khiếu nại đã xử lý',
      description: 'Hoàn tất quy trình xử lý và ghi nhận kết quả giải quyết khiếu nại.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('ComplaintResolutionRequest', 'Thông tin kết quả xử lý khiếu nại.'),
      responses: buildResponses({
        successDescription: 'Đánh dấu khiếu nại đã xử lý thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/content/statistics': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy thống kê nội dung',
      description: 'Lấy số liệu tổng quan của banner, blog và FAQ trên hệ thống.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thống kê nội dung thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/admin/banners': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy danh sách banner',
      description: 'Lấy danh sách banner phục vụ quản trị nội dung.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách banner thành công.',
        auth: true,
      }),
    }),
    post: makeOperation({
      tags: 'Quản trị',
      summary: 'Tạo banner',
      description: 'Tạo mới một banner hiển thị trên trang nội dung.',
      security: true,
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin banner cần tạo.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo banner thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/admin/banners/{id}': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Cập nhật banner',
      description: 'Cập nhật thông tin của một banner.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin banner cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật banner thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    delete: makeOperation({
      tags: 'Quản trị',
      summary: 'Xóa banner',
      description: 'Xóa một banner khỏi hệ thống nội dung.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Xóa banner thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/blogs': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy danh sách bài viết',
      description: 'Lấy danh sách bài viết phục vụ quản trị nội dung.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách bài viết thành công.',
        auth: true,
      }),
    }),
    post: makeOperation({
      tags: 'Quản trị',
      summary: 'Tạo bài viết',
      description: 'Tạo mới một bài viết nội dung.',
      security: true,
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin bài viết cần tạo.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo bài viết thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/admin/blogs/{id}': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy chi tiết bài viết',
      description: 'Lấy thông tin chi tiết của một bài viết theo ID.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết bài viết thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Cập nhật bài viết',
      description: 'Cập nhật nội dung của một bài viết.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin bài viết cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật bài viết thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    delete: makeOperation({
      tags: 'Quản trị',
      summary: 'Xóa bài viết',
      description: 'Xóa một bài viết khỏi hệ thống.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Xóa bài viết thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/admin/faqs': {
    get: makeOperation({
      tags: 'Quản trị',
      summary: 'Lấy danh sách câu hỏi thường gặp',
      description: 'Lấy danh sách FAQ để quản trị viên chỉnh sửa.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách FAQ thành công.',
        auth: true,
      }),
    }),
    post: makeOperation({
      tags: 'Quản trị',
      summary: 'Tạo câu hỏi thường gặp',
      description: 'Tạo mới một mục FAQ.',
      security: true,
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin FAQ cần tạo.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo FAQ thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/admin/faqs/{id}': {
    put: makeOperation({
      tags: 'Quản trị',
      summary: 'Cập nhật câu hỏi thường gặp',
      description: 'Cập nhật nội dung của một mục FAQ.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin FAQ cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật FAQ thành công.',
        auth: true,
        notFound: true,
      }),
    }),
    delete: makeOperation({
      tags: 'Quản trị',
      summary: 'Xóa câu hỏi thường gặp',
      description: 'Xóa một mục FAQ khỏi hệ thống.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Xóa FAQ thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
};

const bookingPaths = {
  '/api/v1/bookings/hold-seats': {
    post: makeOperation({
      tags: 'Đặt chỗ',
      summary: 'Giữ chỗ tạm thời',
      description: 'Giữ tạm thời các ghế đã chọn trước khi xác nhận đặt chỗ.',
      requestBody: jsonRequestBody('BookingHoldRequest', 'Thông tin ghế cần giữ tạm thời.'),
      responses: buildResponses({
        successDescription: 'Giữ chỗ tạm thời thành công.',
      }),
    }),
  },
  '/api/v1/bookings/{bookingId}/confirm': {
    post: makeOperation({
      tags: 'Đặt chỗ',
      summary: 'Xác nhận đặt chỗ',
      description: 'Xác nhận một lượt giữ chỗ thành đặt chỗ chính thức.',
      parameters: [refParameter('BookingIdParam')],
      requestBody: jsonRequestBody('BookingConfirmRequest', 'Thông tin xác nhận đặt chỗ.'),
      responses: buildResponses({
        successDescription: 'Xác nhận đặt chỗ thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/bookings/{bookingId}/extend': {
    post: makeOperation({
      tags: 'Đặt chỗ',
      summary: 'Gia hạn giữ chỗ',
      description: 'Gia hạn thời gian giữ chỗ cho một lượt đặt chỗ tạm thời.',
      parameters: [refParameter('BookingIdParam')],
      responses: buildResponses({
        successDescription: 'Gia hạn giữ chỗ thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/bookings/{bookingId}/release': {
    post: makeOperation({
      tags: 'Đặt chỗ',
      summary: 'Nhả giữ chỗ',
      description: 'Nhả các ghế đang được giữ tạm thời trong một lượt đặt chỗ.',
      parameters: [refParameter('BookingIdParam')],
      responses: buildResponses({
        successDescription: 'Nhả giữ chỗ thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/bookings/code/{bookingCode}': {
    get: makeOperation({
      tags: 'Đặt chỗ',
      summary: 'Tra cứu đặt chỗ theo mã',
      description: 'Lấy thông tin đặt chỗ bằng mã đặt chỗ.',
      parameters: [refParameter('BookingCodeParam')],
      responses: buildResponses({
        successDescription: 'Tra cứu đặt chỗ thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/bookings/trips/{tripId}/available-seats': {
    get: makeOperation({
      tags: 'Đặt chỗ',
      summary: 'Lấy ghế còn trống của chuyến đi',
      description: 'Lấy danh sách ghế còn trống của một chuyến đi cụ thể.',
      parameters: [refParameter('TripIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy danh sách ghế còn trống thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/bookings/guest/cancel': {
    post: makeOperation({
      tags: 'Đặt chỗ',
      summary: 'Hủy đặt chỗ của khách vãng lai',
      description: 'Hủy một đặt chỗ của khách vãng lai mà không cần đăng nhập.',
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin định danh đặt chỗ cần hủy.'),
      responses: buildResponses({
        successDescription: 'Hủy đặt chỗ của khách vãng lai thành công.',
      }),
    }),
  },
  '/api/v1/bookings/my-bookings': {
    get: makeOperation({
      tags: 'Đặt chỗ',
      summary: 'Lấy danh sách đặt chỗ của tôi',
      description: 'Lấy danh sách các lượt đặt chỗ của khách hàng đang đăng nhập.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách đặt chỗ của tôi thành công.',
        auth: true,
      }),
    }),
  },
  '/api/v1/bookings/{bookingId}/cancel': {
    post: makeOperation({
      tags: 'Đặt chỗ',
      summary: 'Hủy đặt chỗ',
      description: 'Hủy một đặt chỗ thuộc tài khoản hiện tại.',
      security: true,
      parameters: [refParameter('BookingIdParam')],
      requestBody: jsonRequestBody('GenericReasonRequest', 'Lý do hủy đặt chỗ.', false),
      responses: buildResponses({
        successDescription: 'Hủy đặt chỗ thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
  '/api/v1/bookings/{bookingId}': {
    get: makeOperation({
      tags: 'Đặt chỗ',
      summary: 'Lấy chi tiết đặt chỗ',
      description: 'Lấy thông tin chi tiết của một lượt đặt chỗ.',
      parameters: [refParameter('BookingIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết đặt chỗ thành công.',
        notFound: true,
      }),
    }),
  },
};

const busPaths = {
  '/api/v1/buses/search': {
    get: makeOperation({
      tags: 'Xe',
      summary: 'Tìm kiếm xe',
      description: 'Tìm kiếm xe công khai theo tiêu chí phù hợp.',
      parameters: [refParameter('SearchQuery')],
      responses: buildResponses({
        successDescription: 'Tìm kiếm xe thành công.',
      }),
    }),
  },
  '/api/v1/buses/seat-layout/templates': {
    get: makeOperation({
      tags: 'Xe',
      summary: 'Lấy toàn bộ mẫu bố trí ghế',
      description: 'Lấy danh sách toàn bộ mẫu bố trí ghế có sẵn.',
      responses: buildResponses({
        successDescription: 'Lấy danh sách mẫu bố trí ghế thành công.',
      }),
    }),
  },
  '/api/v1/buses/seat-layout/templates/{busType}': {
    get: makeOperation({
      tags: 'Xe',
      summary: 'Lấy mẫu bố trí ghế theo loại xe',
      description: 'Lấy danh sách mẫu bố trí ghế tương ứng với một loại xe cụ thể.',
      parameters: [refParameter('BusTypeParam')],
      responses: buildResponses({
        successDescription: 'Lấy mẫu bố trí ghế theo loại xe thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/buses/seat-layout/templates/{busType}/{templateKey}': {
    get: makeOperation({
      tags: 'Xe',
      summary: 'Lấy chi tiết mẫu bố trí ghế',
      description: 'Lấy cấu hình chi tiết của một mẫu bố trí ghế.',
      parameters: [refParameter('BusTypeParam'), refParameter('TemplateKeyParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết mẫu bố trí ghế thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/buses/seat-layout/build': {
    post: makeOperation({
      tags: 'Xe',
      summary: 'Sinh sơ đồ ghế',
      description: 'Sinh nhanh sơ đồ ghế từ cấu hình đầu vào.',
      requestBody: jsonRequestBody('SeatLayoutBuildRequest', 'Thông tin đầu vào để sinh sơ đồ ghế.'),
      responses: buildResponses({
        successDescription: 'Sinh sơ đồ ghế thành công.',
      }),
    }),
  },
  '/api/v1/buses/seat-layout/validate': {
    post: makeOperation({
      tags: 'Xe',
      summary: 'Kiểm tra sơ đồ ghế',
      description: 'Kiểm tra tính hợp lệ của một sơ đồ ghế trước khi sử dụng.',
      requestBody: jsonRequestBody('SeatLayoutValidateRequest', 'Sơ đồ ghế cần kiểm tra.'),
      responses: buildResponses({
        successDescription: 'Kiểm tra sơ đồ ghế thành công.',
      }),
    }),
  },
};

const complaintPaths = {
  '/api/v1/complaints': {
    post: makeOperation({
      tags: 'Khiếu nại',
      summary: 'Tạo khiếu nại',
      description: 'Tạo mới một khiếu nại hoặc phản ánh từ phía khách hàng.',
      security: true,
      requestBody: jsonRequestBody('ComplaintCreateRequest', 'Thông tin khiếu nại cần gửi.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo khiếu nại thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
    get: makeOperation({
      tags: 'Khiếu nại',
      summary: 'Lấy danh sách khiếu nại của tôi',
      description: 'Lấy danh sách khiếu nại do tài khoản hiện tại tạo ra.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách khiếu nại thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/complaints/{id}': {
    get: makeOperation({
      tags: 'Khiếu nại',
      summary: 'Lấy chi tiết khiếu nại',
      description: 'Lấy thông tin chi tiết của một khiếu nại.',
      security: true,
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết khiếu nại thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
  '/api/v1/complaints/{id}/notes': {
    post: makeOperation({
      tags: 'Khiếu nại',
      summary: 'Thêm ghi chú khiếu nại',
      description: 'Bổ sung ghi chú hoặc trao đổi thêm vào một khiếu nại.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('ComplaintNoteRequest', 'Nội dung ghi chú bổ sung.'),
      responses: buildResponses({
        successDescription: 'Thêm ghi chú khiếu nại thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
  '/api/v1/complaints/{id}/satisfaction': {
    put: makeOperation({
      tags: 'Khiếu nại',
      summary: 'Đánh giá mức độ hài lòng',
      description: 'Gửi đánh giá mức độ hài lòng sau khi khiếu nại đã được xử lý.',
      security: true,
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('SatisfactionRequest', 'Điểm hài lòng và phản hồi bổ sung.'),
      responses: buildResponses({
        successDescription: 'Gửi đánh giá hài lòng thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
};

const contentPaths = {
  '/api/v1/content/banners': {
    get: makeOperation({
      tags: 'Nội dung',
      summary: 'Lấy danh sách banner',
      description: 'Lấy danh sách banner đang hiển thị ở phía người dùng.',
      responses: buildResponses({
        successDescription: 'Lấy danh sách banner thành công.',
      }),
    }),
  },
  '/api/v1/content/banners/{id}/view': {
    post: makeOperation({
      tags: 'Nội dung',
      summary: 'Ghi nhận lượt xem banner',
      description: 'Ghi nhận một lượt xem banner để phục vụ thống kê.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Ghi nhận lượt xem banner thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/content/banners/{id}/click': {
    post: makeOperation({
      tags: 'Nội dung',
      summary: 'Ghi nhận lượt nhấp banner',
      description: 'Ghi nhận một lượt nhấp vào banner để phục vụ thống kê.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Ghi nhận lượt nhấp banner thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/content/blogs': {
    get: makeOperation({
      tags: 'Nội dung',
      summary: 'Lấy danh sách bài viết',
      description: 'Lấy danh sách bài viết công khai dành cho người dùng.',
      parameters: [
        refParameter('SearchQuery'),
        refParameter('PageQuery'),
        refParameter('LimitQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Lấy danh sách bài viết thành công.',
      }),
    }),
  },
  '/api/v1/content/blogs/{slug}': {
    get: makeOperation({
      tags: 'Nội dung',
      summary: 'Lấy chi tiết bài viết',
      description: 'Lấy chi tiết một bài viết theo slug.',
      parameters: [refParameter('SlugParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết bài viết thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/content/blogs/{id}/like': {
    post: makeOperation({
      tags: 'Nội dung',
      summary: 'Thích bài viết',
      description: 'Ghi nhận một lượt thích cho bài viết.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Thích bài viết thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/content/faqs': {
    get: makeOperation({
      tags: 'Nội dung',
      summary: 'Lấy danh sách câu hỏi thường gặp',
      description: 'Lấy danh sách FAQ công khai cho người dùng.',
      responses: buildResponses({
        successDescription: 'Lấy danh sách FAQ thành công.',
      }),
    }),
  },
  '/api/v1/content/faqs/{id}': {
    get: makeOperation({
      tags: 'Nội dung',
      summary: 'Lấy chi tiết câu hỏi thường gặp',
      description: 'Lấy chi tiết một mục FAQ theo ID.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết FAQ thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/content/faqs/{id}/helpful': {
    post: makeOperation({
      tags: 'Nội dung',
      summary: 'Đánh dấu FAQ hữu ích',
      description: 'Ghi nhận đánh giá hữu ích cho một câu hỏi thường gặp.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Đánh dấu FAQ hữu ích thành công.',
        notFound: true,
      }),
    }),
  },
};

const employeePaths = {
  '/api/v1/employees/login': {
    post: makeOperation({
      tags: 'Nhân viên',
      summary: 'Đăng nhập nhân viên',
      description: 'Đăng nhập cho tài khoản nhân viên như lái xe hoặc điều hành chuyến.',
      requestBody: jsonRequestBody('EmployeeLoginRequest', 'Thông tin đăng nhập nhân viên.'),
      responses: buildResponses({
        successDescription: 'Đăng nhập nhân viên thành công.',
      }),
    }),
  },
  '/api/v1/employees/my-trips': {
    get: makeOperation({
      tags: 'Nhân viên',
      summary: 'Lấy chuyến đi được phân công',
      description: 'Lấy danh sách chuyến đi được phân công cho nhân viên đang đăng nhập.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy chuyến đi được phân công thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
};

const guestPaths = {
  '/api/v1/guest/request-otp': {
    post: makeOperation({
      tags: 'Khách vãng lai',
      summary: 'Yêu cầu OTP cho khách vãng lai',
      description: 'Gửi OTP cho khách vãng lai để xác thực phiên làm việc.',
      requestBody: jsonRequestBody('GuestOtpRequest', 'Email hoặc số điện thoại nhận OTP.'),
      responses: buildResponses({
        successDescription: 'Yêu cầu OTP thành công.',
      }),
    }),
  },
  '/api/v1/guest/verify-otp': {
    post: makeOperation({
      tags: 'Khách vãng lai',
      summary: 'Xác thực OTP của khách vãng lai',
      description: 'Xác thực OTP để tạo hoặc kích hoạt phiên khách vãng lai.',
      requestBody: jsonRequestBody('GuestOtpVerifyRequest', 'Thông tin OTP cần xác thực.'),
      responses: buildResponses({
        successDescription: 'Xác thực OTP thành công.',
      }),
    }),
  },
  '/api/v1/guest/session': {
    get: makeOperation({
      tags: 'Khách vãng lai',
      summary: 'Lấy thông tin phiên khách vãng lai',
      description: 'Lấy thông tin hiện tại của phiên khách vãng lai.',
      responses: buildResponses({
        successDescription: 'Lấy thông tin phiên khách vãng lai thành công.',
      }),
    }),
    put: makeOperation({
      tags: 'Khách vãng lai',
      summary: 'Cập nhật phiên khách vãng lai',
      description: 'Cập nhật thông tin đang lưu trong phiên khách vãng lai.',
      requestBody: jsonRequestBody('GuestSessionUpdateRequest', 'Dữ liệu phiên cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật phiên khách vãng lai thành công.',
      }),
    }),
    delete: makeOperation({
      tags: 'Khách vãng lai',
      summary: 'Xóa phiên khách vãng lai',
      description: 'Xóa phiên làm việc của khách vãng lai.',
      responses: buildResponses({
        successDescription: 'Xóa phiên khách vãng lai thành công.',
      }),
    }),
  },
  '/api/v1/guest/extend-session': {
    post: makeOperation({
      tags: 'Khách vãng lai',
      summary: 'Gia hạn phiên khách vãng lai',
      description: 'Gia hạn thời gian hiệu lực của phiên khách vãng lai.',
      responses: buildResponses({
        successDescription: 'Gia hạn phiên khách vãng lai thành công.',
      }),
    }),
  },
  '/api/v1/guest/otp-status/{identifier}': {
    get: makeOperation({
      tags: 'Khách vãng lai',
      summary: 'Kiểm tra trạng thái OTP',
      description: 'Kiểm tra trạng thái OTP đã gửi cho email hoặc số điện thoại.',
      parameters: [refParameter('IdentifierParam')],
      responses: buildResponses({
        successDescription: 'Kiểm tra trạng thái OTP thành công.',
      }),
    }),
  },
};

const paymentPaths = {
  '/api/v1/payments/methods': {
    get: makeOperation({
      tags: 'Thanh toán',
      summary: 'Lấy danh sách phương thức thanh toán',
      description: 'Lấy danh sách phương thức thanh toán đang hỗ trợ.',
      responses: buildResponses({
        successDescription: 'Lấy danh sách phương thức thanh toán thành công.',
      }),
    }),
  },
  '/api/v1/payments/banks': {
    get: makeOperation({
      tags: 'Thanh toán',
      summary: 'Lấy danh sách ngân hàng VNPay',
      description: 'Lấy danh sách ngân hàng hỗ trợ thanh toán qua VNPay.',
      responses: buildResponses({
        successDescription: 'Lấy danh sách ngân hàng thành công.',
      }),
    }),
  },
  '/api/v1/payments/vnpay/callback': {
    get: makeOperation({
      tags: 'Thanh toán',
      summary: 'Nhận callback từ VNPay',
      description: 'Điểm nhận callback máy chủ từ VNPay sau khi giao dịch được xử lý.',
      responses: buildResponses({
        successDescription: 'Xử lý callback từ VNPay thành công.',
      }),
    }),
  },
  '/api/v1/payments/vnpay/return': {
    get: makeOperation({
      tags: 'Thanh toán',
      summary: 'Xử lý điều hướng trả về từ VNPay',
      description: 'Điểm nhận điều hướng trình duyệt quay lại từ VNPay.',
      responses: buildResponses({
        successDescription: 'Xử lý điều hướng trả về từ VNPay thành công.',
      }),
    }),
  },
  '/api/v1/payments/code/{paymentCode}': {
    get: makeOperation({
      tags: 'Thanh toán',
      summary: 'Tra cứu thanh toán theo mã',
      description: 'Lấy thông tin giao dịch thanh toán theo mã thanh toán.',
      parameters: [refParameter('PaymentCodeParam')],
      responses: buildResponses({
        successDescription: 'Tra cứu thanh toán thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/payments/create': {
    post: makeOperation({
      tags: 'Thanh toán',
      summary: 'Tạo giao dịch thanh toán',
      description: 'Khởi tạo giao dịch thanh toán cho một đặt chỗ.',
      requestBody: jsonRequestBody('PaymentCreateRequest', 'Thông tin cần thiết để tạo giao dịch thanh toán.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo giao dịch thanh toán thành công.',
      }),
    }),
  },
  '/api/v1/payments/booking/{bookingId}': {
    get: makeOperation({
      tags: 'Thanh toán',
      summary: 'Lấy danh sách thanh toán theo đặt chỗ',
      description: 'Lấy tất cả giao dịch thanh toán gắn với một đặt chỗ.',
      security: true,
      parameters: [refParameter('BookingIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy danh sách thanh toán theo đặt chỗ thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
  '/api/v1/payments/my-payments': {
    get: makeOperation({
      tags: 'Thanh toán',
      summary: 'Lấy thanh toán của tôi',
      description: 'Lấy danh sách các giao dịch thanh toán của người dùng hiện tại.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thanh toán của tôi thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/payments/handle-expired': {
    post: makeOperation({
      tags: 'Thanh toán',
      summary: 'Xử lý giao dịch hết hạn',
      description: 'Kích hoạt xử lý các giao dịch thanh toán đã hết hạn.',
      requestBody: jsonRequestBody('GenericPayload', 'Thông tin bổ sung nếu cần.', false),
      responses: buildResponses({
        successDescription: 'Xử lý giao dịch hết hạn thành công.',
      }),
    }),
  },
  '/api/v1/payments/{paymentCode}/status': {
    get: makeOperation({
      tags: 'Thanh toán',
      summary: 'Tra cứu trạng thái giao dịch',
      description: 'Tra cứu trạng thái hiện tại của một giao dịch thanh toán.',
      parameters: [refParameter('PaymentCodeParam')],
      responses: buildResponses({
        successDescription: 'Tra cứu trạng thái giao dịch thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/payments/{paymentId}': {
    get: makeOperation({
      tags: 'Thanh toán',
      summary: 'Lấy chi tiết thanh toán',
      description: 'Lấy chi tiết một giao dịch thanh toán theo ID.',
      security: true,
      parameters: [refParameter('PaymentIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết thanh toán thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
};

const reviewPaths = {
  '/api/v1/reviews/bookings/{bookingId}/review': {
    post: makeOperation({
      tags: 'Đánh giá',
      summary: 'Tạo đánh giá cho đặt chỗ',
      description: 'Tạo đánh giá cho một đặt chỗ mà khách hàng đã hoàn thành.',
      security: true,
      parameters: [refParameter('BookingIdParam')],
      requestBody: jsonRequestBody('ReviewCreateRequest', 'Thông tin đánh giá cần gửi.'),
      responses: buildResponses({
        successCode: '201',
        successDescription: 'Tạo đánh giá thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/reviews/bookings/{bookingId}/can-review': {
    get: makeOperation({
      tags: 'Đánh giá',
      summary: 'Kiểm tra khả năng đánh giá',
      description: 'Kiểm tra xem một đặt chỗ đã đủ điều kiện để đánh giá hay chưa.',
      security: true,
      parameters: [refParameter('BookingIdParam')],
      responses: buildResponses({
        successDescription: 'Kiểm tra điều kiện đánh giá thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/reviews/bookings/{bookingId}/send-review-invitation': {
    post: makeOperation({
      tags: 'Đánh giá',
      summary: 'Gửi lời mời đánh giá',
      description: 'Gửi lại lời mời đánh giá cho một đặt chỗ hợp lệ.',
      security: true,
      parameters: [refParameter('BookingIdParam')],
      responses: buildResponses({
        successDescription: 'Gửi lời mời đánh giá thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/reviews/trips/{tripId}/reviews': {
    get: makeOperation({
      tags: 'Đánh giá',
      summary: 'Lấy đánh giá theo chuyến đi',
      description: 'Lấy danh sách đánh giá công khai của một chuyến đi.',
      parameters: [refParameter('TripIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy đánh giá theo chuyến đi thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/reviews/operators/{operatorId}/reviews': {
    get: makeOperation({
      tags: 'Đánh giá',
      summary: 'Lấy đánh giá theo nhà xe',
      description: 'Lấy danh sách đánh giá công khai của một nhà xe.',
      parameters: [refParameter('OperatorIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy đánh giá theo nhà xe thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/reviews/users/my-reviews': {
    get: makeOperation({
      tags: 'Đánh giá',
      summary: 'Lấy đánh giá của tôi',
      description: 'Lấy danh sách đánh giá do khách hàng hiện tại đã gửi.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy đánh giá của tôi thành công.',
        auth: true,
        notFound: false,
      }),
    }),
  },
  '/api/v1/reviews/reviews/{reviewId}/response': {
    post: makeOperation({
      tags: 'Đánh giá',
      summary: 'Phản hồi đánh giá',
      description: 'Cho phép nhà xe phản hồi một đánh giá của khách hàng.',
      security: true,
      parameters: [refParameter('ReviewIdParam')],
      requestBody: jsonRequestBody('ReviewOperatorResponseRequest', 'Nội dung phản hồi của nhà xe.'),
      responses: buildResponses({
        successDescription: 'Phản hồi đánh giá thành công.',
        auth: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/reviews/reviews/{reviewId}/report': {
    post: makeOperation({
      tags: 'Đánh giá',
      summary: 'Báo cáo đánh giá',
      description: 'Gửi báo cáo về một đánh giá có nội dung không phù hợp.',
      security: true,
      parameters: [refParameter('ReviewIdParam')],
      requestBody: jsonRequestBody('ReviewReportRequest', 'Lý do báo cáo đánh giá.'),
      responses: buildResponses({
        successDescription: 'Báo cáo đánh giá thành công.',
        auth: true,
        forbidden: false,
        notFound: true,
      }),
    }),
  },
};

const routePaths = {
  '/api/v1/routes/search': {
    get: makeOperation({
      tags: 'Tuyến đường',
      summary: 'Tìm kiếm tuyến đường',
      description: 'Tìm kiếm tuyến đường công khai theo điểm đi và điểm đến.',
      parameters: [refParameter('SearchQuery')],
      responses: buildResponses({
        successDescription: 'Tìm kiếm tuyến đường thành công.',
      }),
    }),
  },
};

const ticketPaths = {
  '/api/v1/tickets/lookup/request-otp': {
    post: makeOperation({
      tags: 'Vé',
      summary: 'Yêu cầu OTP tra cứu vé',
      description: 'Gửi OTP để bắt đầu quy trình tra cứu vé bằng email hoặc số điện thoại.',
      requestBody: jsonRequestBody('TicketLookupOtpRequest', 'Thông tin nhận OTP để tra cứu vé.'),
      responses: buildResponses({
        successDescription: 'Yêu cầu OTP tra cứu vé thành công.',
      }),
    }),
  },
  '/api/v1/tickets/lookup/verify-otp': {
    post: makeOperation({
      tags: 'Vé',
      summary: 'Xác thực OTP tra cứu vé',
      description: 'Xác thực OTP để tiếp tục quy trình tra cứu vé.',
      requestBody: jsonRequestBody('TicketLookupOtpVerifyRequest', 'Thông tin OTP tra cứu vé.'),
      responses: buildResponses({
        successDescription: 'Xác thực OTP tra cứu vé thành công.',
      }),
    }),
  },
  '/api/v1/tickets/lookup': {
    post: makeOperation({
      tags: 'Vé',
      summary: 'Tra cứu vé',
      description: 'Tra cứu vé bằng mã vé và số điện thoại.',
      requestBody: jsonRequestBody('TicketLookupRequest', 'Thông tin tra cứu vé.'),
      responses: buildResponses({
        successDescription: 'Tra cứu vé thành công.',
        validationError: true,
      }),
      deprecated: true,
    }),
  },
  '/api/v1/tickets/generate': {
    post: makeOperation({
      tags: 'Vé',
      summary: 'Sinh vé điện tử',
      description: 'Sinh vé điện tử từ một đặt chỗ hợp lệ.',
      requestBody: jsonRequestBody('TicketGenerateRequest', 'Thông tin đặt chỗ cần sinh vé.'),
      responses: buildResponses({
        successDescription: 'Sinh vé điện tử thành công.',
      }),
    }),
  },
  '/api/v1/tickets/customer/my-tickets': {
    get: makeOperation({
      tags: 'Vé',
      summary: 'Lấy vé của khách hàng',
      description: 'Lấy danh sách vé ở nhánh route dành cho khách hàng.',
      responses: buildResponses({
        successDescription: 'Lấy danh sách vé của khách hàng thành công.',
      }),
    }),
  },
  '/api/v1/tickets/trip/{tripId}/passengers': {
    get: makeOperation({
      tags: 'Vé',
      summary: 'Lấy danh sách hành khách của chuyến đi',
      description: 'Lấy danh sách hành khách trên một chuyến đi cụ thể.',
      parameters: [refParameter('TripIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy danh sách hành khách thành công.',
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/tickets/trip/{tripId}/verify': {
    post: makeOperation({
      tags: 'Vé',
      summary: 'Xác minh vé bằng QR',
      description: 'Xác minh tính hợp lệ của vé bằng dữ liệu QR trên một chuyến đi.',
      parameters: [refParameter('TripIdParam')],
      requestBody: jsonRequestBody('VerifyQrRequest', 'Dữ liệu QR cần xác minh.'),
      responses: buildResponses({
        successDescription: 'Xác minh vé bằng QR thành công.',
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/tickets/operator/stats': {
    get: makeOperation({
      tags: 'Vé',
      summary: 'Lấy thống kê vé',
      description: 'Lấy số liệu thống kê liên quan đến vé cho nhà xe hoặc bộ phận vận hành.',
      responses: buildResponses({
        successDescription: 'Lấy thống kê vé thành công.',
      }),
    }),
  },
  '/api/v1/tickets/{id}/cancel': {
    post: makeOperation({
      tags: 'Vé',
      summary: 'Hủy vé trực tiếp',
      description: 'Hủy một vé theo ID.',
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('TicketCancelRequest', 'Lý do hủy vé.', false),
      responses: buildResponses({
        successDescription: 'Hủy vé thành công.',
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/tickets/{id}/change': {
    post: makeOperation({
      tags: 'Vé',
      summary: 'Đổi vé',
      description: 'Đổi vé sang chuyến đi hoặc ghế mới.',
      parameters: [refParameter('IdParam')],
      requestBody: jsonRequestBody('TicketChangeRequest', 'Thông tin chuyến đi mới và ghế mới.'),
      responses: buildResponses({
        successDescription: 'Đổi vé thành công.',
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/tickets/{id}/download': {
    get: makeOperation({
      tags: 'Vé',
      summary: 'Tải vé PDF',
      description: 'Tải tệp PDF của vé điện tử theo ID.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Tải vé PDF thành công.',
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/tickets/{id}/resend': {
    post: makeOperation({
      tags: 'Vé',
      summary: 'Gửi lại thông tin vé',
      description: 'Gửi lại thông báo hoặc email chứa thông tin vé.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Gửi lại thông tin vé thành công.',
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/tickets/booking/{bookingId}': {
    get: makeOperation({
      tags: 'Vé',
      summary: 'Lấy vé theo đặt chỗ',
      description: 'Lấy vé gắn với một đặt chỗ cụ thể.',
      parameters: [refParameter('BookingIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy vé theo đặt chỗ thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/tickets/{id}': {
    get: makeOperation({
      tags: 'Vé',
      summary: 'Lấy chi tiết vé',
      description: 'Lấy thông tin chi tiết của một vé theo ID.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết vé thành công.',
        validationError: true,
        notFound: true,
      }),
    }),
  },
};

const tripPaths = {
  '/api/v1/trips/search': {
    get: makeOperation({
      tags: 'Chuyến đi',
      summary: 'Tìm kiếm chuyến đi',
      description: 'Tìm kiếm chuyến đi công khai theo tiêu chí của khách hàng.',
      parameters: [
        refParameter('SearchQuery'),
        refParameter('FromDateQuery'),
        refParameter('ToDateQuery'),
      ],
      responses: buildResponses({
        successDescription: 'Tìm kiếm chuyến đi thành công.',
      }),
    }),
  },
  '/api/v1/trips/{id}': {
    get: makeOperation({
      tags: 'Chuyến đi',
      summary: 'Lấy chi tiết chuyến đi',
      description: 'Lấy thông tin công khai chi tiết của một chuyến đi.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết chuyến đi thành công.',
        notFound: true,
      }),
    }),
  },
  '/api/v1/trips/{id}/dynamic-price': {
    get: makeOperation({
      tags: 'Chuyến đi',
      summary: 'Lấy giá linh hoạt của chuyến đi',
      description: 'Lấy mức giá linh hoạt hiện tại của một chuyến đi.',
      parameters: [refParameter('IdParam')],
      responses: buildResponses({
        successDescription: 'Lấy giá linh hoạt thành công.',
        notFound: true,
      }),
    }),
  },
};

const tripManagerPaths = {
  '/api/v1/trip-manager/login': {
    post: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Đăng nhập điều hành chuyến',
      description: 'Đăng nhập bằng mã nhân viên hoặc tên đăng nhập dành cho điều hành chuyến và tài xế.',
      requestBody: jsonRequestBody('TripManagerLoginRequest', 'Thông tin đăng nhập điều hành chuyến.'),
      responses: buildResponses({
        successDescription: 'Đăng nhập điều hành chuyến thành công.',
        validationError: true,
      }),
    }),
  },
  '/api/v1/trip-manager/me': {
    get: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Lấy thông tin tài khoản điều hành chuyến',
      description: 'Lấy thông tin của điều hành chuyến hoặc tài xế đang đăng nhập.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy thông tin điều hành chuyến thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/trip-manager/trips': {
    get: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Lấy danh sách chuyến được phân công',
      description: 'Lấy danh sách chuyến đi được gán cho điều hành chuyến hoặc tài xế hiện tại.',
      security: true,
      responses: buildResponses({
        successDescription: 'Lấy danh sách chuyến được phân công thành công.',
        auth: true,
        forbidden: false,
      }),
    }),
  },
  '/api/v1/trip-manager/trips/{tripId}': {
    get: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Lấy chi tiết chuyến được phân công',
      description: 'Lấy thông tin chi tiết và hành khách của một chuyến được phân công.',
      security: true,
      parameters: [refParameter('TripIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy chi tiết chuyến được phân công thành công.',
        auth: true,
        forbidden: false,
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/trip-manager/trips/{tripId}/start': {
    post: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Bắt đầu chuyến đi',
      description: 'Đánh dấu một chuyến đi đã bắt đầu khởi hành.',
      security: true,
      parameters: [refParameter('TripIdParam')],
      responses: buildResponses({
        successDescription: 'Bắt đầu chuyến đi thành công.',
        auth: true,
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/trip-manager/trips/{tripId}/complete': {
    post: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Hoàn thành chuyến đi',
      description: 'Đánh dấu một chuyến đi đã hoàn thành.',
      security: true,
      parameters: [refParameter('TripIdParam')],
      responses: buildResponses({
        successDescription: 'Hoàn thành chuyến đi thành công.',
        auth: true,
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/trip-manager/trips/{tripId}/status': {
    put: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Cập nhật trạng thái chuyến đi',
      description: 'Cập nhật trạng thái tổng thể của chuyến đi và kích hoạt các quy trình liên quan.',
      security: true,
      parameters: [refParameter('TripIdParam')],
      requestBody: jsonRequestBody('TripStatusRequest', 'Trạng thái mới của chuyến đi.'),
      responses: buildResponses({
        successDescription: 'Cập nhật trạng thái chuyến đi thành công.',
        auth: true,
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/trip-manager/trips/{tripId}/passengers': {
    get: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Lấy danh sách hành khách',
      description: 'Lấy danh sách hành khách của chuyến đi đang phụ trách.',
      security: true,
      parameters: [refParameter('TripIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy danh sách hành khách thành công.',
        auth: true,
        forbidden: false,
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/trip-manager/trips/{tripId}/verify-ticket': {
    post: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Xác minh vé khi lên xe',
      description: 'Xác minh vé của hành khách bằng QR trong quá trình lên xe.',
      security: true,
      parameters: [refParameter('TripIdParam')],
      requestBody: jsonRequestBody('VerifyQrRequest', 'Dữ liệu QR cần xác minh.'),
      responses: buildResponses({
        successDescription: 'Xác minh vé thành công.',
        auth: true,
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/trip-manager/trips/{tripId}/journey': {
    get: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Lấy hành trình chuyến đi',
      description: 'Lấy chi tiết hành trình, trạm dừng và lịch sử trạng thái của chuyến đi.',
      security: true,
      parameters: [refParameter('TripIdParam')],
      responses: buildResponses({
        successDescription: 'Lấy hành trình chuyến đi thành công.',
        auth: true,
        forbidden: false,
        validationError: true,
        notFound: true,
      }),
    }),
  },
  '/api/v1/trip-manager/trips/{tripId}/journey/status': {
    put: makeOperation({
      tags: 'Điều hành chuyến',
      summary: 'Cập nhật trạng thái hành trình',
      description: 'Cập nhật trạng thái từng chặng trong hành trình của chuyến đi.',
      security: true,
      parameters: [refParameter('TripIdParam')],
      requestBody: jsonRequestBody('JourneyStatusRequest', 'Thông tin trạng thái hành trình cần cập nhật.'),
      responses: buildResponses({
        successDescription: 'Cập nhật trạng thái hành trình thành công.',
        auth: true,
        validationError: true,
        notFound: true,
      }),
    }),
  },
};

const voucherPaths = {
  '/api/v1/vouchers/validate': {
    post: makeOperation({
      tags: 'Mã giảm giá',
      summary: 'Kiểm tra mã giảm giá',
      description: 'Kiểm tra tính hợp lệ của mã giảm giá theo ngữ cảnh đặt chỗ hiện tại.',
      requestBody: jsonRequestBody('VoucherValidateRequest', 'Thông tin mã giảm giá cần kiểm tra.'),
      responses: buildResponses({
        successDescription: 'Kiểm tra mã giảm giá thành công.',
      }),
    }),
  },
  '/api/v1/vouchers/public': {
    get: makeOperation({
      tags: 'Mã giảm giá',
      summary: 'Lấy danh sách mã giảm giá công khai',
      description: 'Lấy danh sách mã giảm giá công khai dành cho người dùng.',
      responses: buildResponses({
        successDescription: 'Lấy danh sách mã giảm giá công khai thành công.',
      }),
    }),
  },
};

const paths = {
  ...systemPaths,
  ...authPaths,
  ...userPaths,
  ...operatorPaths,
  ...adminPaths,
  ...bookingPaths,
  ...busPaths,
  ...complaintPaths,
  ...contentPaths,
  ...employeePaths,
  ...guestPaths,
  ...paymentPaths,
  ...reviewPaths,
  ...routePaths,
  ...ticketPaths,
  ...tripPaths,
  ...tripManagerPaths,
  ...voucherPaths,
};

module.exports = {
  components,
  paths,
};
