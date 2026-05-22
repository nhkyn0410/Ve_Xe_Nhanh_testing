const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');
const logger = require('../utils/logger');

/**
 * VNPay Service
 * Integrates with VNPay payment gateway (Demo/Sandbox environment)
 *
 * VNPay Demo Credentials:
 * - TMN Code: Use your registered TMN code or demo code
 * - Secret Key: Use your secret key
 * - Payment URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
 */
class VNPayService {
  constructor() {
    // VNPay Configuration (Demo/Sandbox)
    this.vnp_TmnCode = process.env.VNP_TMN_CODE || 'DEMO';
    this.vnp_HashSecret = process.env.VNP_HASH_SECRET || 'DEMO_SECRET_KEY';
    this.vnp_Url = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnp_ReturnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3000/payment/vnpay-return';
    this.vnp_Api = process.env.VNP_API || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
  }

  /**
   * Sort object keys alphabetically
   */
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      sorted[key] = obj[key];
    }

    return sorted;
  }

  /**
   * Create HMAC SHA512 signature
   */
  createSignature(data, secretKey) {
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
    return signed;
  }

  /**
   * Create payment URL
   *
   * @param {Object} params - Payment parameters
   * @param {string} params.paymentCode - Unique payment code
   * @param {number} params.amount - Amount in VND
   * @param {string} params.orderInfo - Order description
   * @param {string} params.orderType - Order type (e.g., 'billpayment', 'topup')
   * @param {string} params.ipAddress - Customer IP address
   * @param {string} params.bankCode - Bank code (optional, e.g., 'NCB', 'VNPAYQR')
   * @param {string} params.locale - Language (vi or en)
   * @returns {string} Payment URL
   */
  createPaymentUrl(params) {
    const {
      paymentCode,
      amount,
      orderInfo,
      orderType = 'billpayment',
      ipAddress,
      bankCode = '',
      locale = 'vn',
    } = params;

    // Create date in format: yyyyMMddHHmmss
    const createDate = moment().format('YYYYMMDDHHmmss');
    const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');

    // Build VNPay parameters
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: paymentCode,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100, // VNPay requires amount in smallest unit (VND * 100)
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddress,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Add bank code if specified
    if (bankCode) {
      vnp_Params.vnp_BankCode = bankCode;
    }

    // Sort parameters
    vnp_Params = this.sortObject(vnp_Params);

    // Create signature data and URL
    // VNPay uses application/x-www-form-urlencoded format:
    // - Encode special characters with %XX
    // - Encode space as + (not %20)
    const signData = querystring.stringify(vnp_Params).replace(/%20/g, '+');

    // Create signature from the same string that will be in URL
    const secureHash = this.createSignature(signData, this.vnp_HashSecret);
    vnp_Params['vnp_SecureHash'] = secureHash;

    // Create payment URL with the same encoding
    const paymentUrl = `${this.vnp_Url}?${querystring.stringify(vnp_Params).replace(/%20/g, '+')}`;

    return paymentUrl;
  }

  /**
   * Verify callback signature from VNPay
   *
   * @param {Object} vnpParams - Parameters from VNPay callback
   * @returns {boolean} True if signature is valid
   */
  verifyReturnUrl(vnpParams) {
    const secureHash = vnpParams['vnp_SecureHash'];

    // Remove hash params
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort parameters
    const sortedParams = this.sortObject(vnpParams);

    // Create signature data using the same encoding as when creating payment URL
    // VNPay uses application/x-www-form-urlencoded (space = +)
    const signData = querystring.stringify(sortedParams).replace(/%20/g, '+');

    // Create signature
    const checkSum = this.createSignature(signData, this.vnp_HashSecret);

    return secureHash === checkSum;
  }

  /**
   * Process VNPay callback response
   *
   * @param {Object} vnpParams - Parameters from VNPay callback
   * @returns {Object} Processed payment result
   */
  processCallback(vnpParams) {
    // Verify signature
    const isValid = this.verifyReturnUrl(vnpParams);

    if (!isValid) {
      return {
        success: false,
        code: 'INVALID_SIGNATURE',
        message: 'Chữ ký không hợp lệ',
      };
    }

    // Extract payment information
    const paymentCode = vnpParams['vnp_TxnRef'];
    const amount = parseInt(vnpParams['vnp_Amount']) / 100; // Convert back to VND
    const responseCode = vnpParams['vnp_ResponseCode'];
    const transactionNo = vnpParams['vnp_TransactionNo'];
    const bankCode = vnpParams['vnp_BankCode'];
    const cardType = vnpParams['vnp_CardType'];
    const payDate = vnpParams['vnp_PayDate'];
    const orderInfo = vnpParams['vnp_OrderInfo'];
    const transactionStatus = vnpParams['vnp_TransactionStatus'];

    // Check response code
    // 00: Success
    // Other codes: Failed
    const success = responseCode === '00';

    const result = {
      success,
      code: responseCode,
      message: this.getResponseMessage(responseCode),
      paymentCode,
      amount,
      transactionId: transactionNo,
      bankCode,
      cardType,
      payDate,
      orderInfo,
      transactionStatus,
      rawData: vnpParams,
    };

    return result;
  }

  /**
   * Get response message based on response code
   *
   * @param {string} code - VNPay response code
   * @returns {string} Vietnamese message
   */
  getResponseMessage(code) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
      '13': 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Lỗi không xác định',
    };

    return messages[code] || 'Lỗi không xác định';
  }

  /**
   * Query transaction status from VNPay
   *
   * @param {Object} params - Query parameters
   * @param {string} params.paymentCode - Payment code (vnp_TxnRef)
   * @param {string} params.transactionDate - Transaction date (yyyyMMddHHmmss)
   * @param {string} params.ipAddress - IP address
   * @returns {Object} Transaction status
   */
  async queryTransaction(params) {
    const { paymentCode, transactionDate, ipAddress } = params;

    const requestId = moment().format('YYYYMMDDHHmmss');
    const orderId = paymentCode;

    let vnp_Params = {
      vnp_RequestId: requestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Query transaction ${orderId}`,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
      vnp_IpAddr: ipAddress,
    };

    // Sort and create signature
    const sortedParams = this.sortObject(vnp_Params);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const secureHash = this.createSignature(signData, this.vnp_HashSecret);

    vnp_Params['vnp_SecureHash'] = secureHash;

    try {
      const response = await fetch(this.vnp_Api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vnp_Params),
      });

      const result = await response.json();

      return {
        success: result.vnp_ResponseCode === '00',
        code: result.vnp_ResponseCode,
        message: this.getResponseMessage(result.vnp_ResponseCode),
        transactionStatus: result.vnp_TransactionStatus,
        amount: result.vnp_Amount ? parseInt(result.vnp_Amount) / 100 : 0,
        rawData: result,
      };
    } catch (error) {
      return {
        success: false,
        code: 'ERROR',
        message: 'Không thể truy vấn giao dịch',
        error: error.message,
      };
    }
  }

  /**
   * Refund transaction
   *
   * @param {Object} params - Refund parameters
   * @param {string} params.paymentCode - Original payment code
   * @param {number} params.amount - Refund amount
   * @param {string} params.transactionDate - Original transaction date (yyyyMMddHHmmss)
   * @param {string} params.transactionType - Transaction type ('02': full refund, '03': partial refund)
   * @param {string} params.ipAddress - IP address
   * @param {string} params.user - User performing refund
   * @returns {Object} Refund result
   */
  async refundTransaction(params) {
    const {
      paymentCode,
      amount,
      transactionDate,
      transactionType = '02', // 02: full, 03: partial
      ipAddress,
      user = 'admin',
    } = params;

    const requestId = moment().format('YYYYMMDDHHmmss');

    let vnp_Params = {
      vnp_RequestId: requestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'refund',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_TransactionType: transactionType,
      vnp_TxnRef: paymentCode,
      vnp_Amount: amount * 100, // Convert to smallest unit
      vnp_OrderInfo: `Refund for ${paymentCode}`,
      vnp_TransactionNo: '', // Can be empty for refund by TxnRef
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
      vnp_CreateBy: user,
      vnp_IpAddr: ipAddress,
    };

    // Sort and create signature
    const sortedParams = this.sortObject(vnp_Params);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const secureHash = this.createSignature(signData, this.vnp_HashSecret);

    vnp_Params['vnp_SecureHash'] = secureHash;

    try {
      const response = await fetch(this.vnp_Api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vnp_Params),
      });

      const result = await response.json();

      return {
        success: result.vnp_ResponseCode === '00',
        code: result.vnp_ResponseCode,
        message: this.getResponseMessage(result.vnp_ResponseCode),
        transactionId: result.vnp_TransactionNo,
        rawData: result,
      };
    } catch (error) {
      return {
        success: false,
        code: 'ERROR',
        message: 'Không thể hoàn tiền',
        error: error.message,
      };
    }
  }

  /**
   * Get available bank list for VNPay
   */
  getBankList() {
    return [
      { code: 'VNPAYQR', name: 'Cổng thanh toán VNPAYQR' },
      { code: 'VNBANK', name: 'Thanh toán qua thẻ ATM/Tài khoản nội địa' },
      { code: 'INTCARD', name: 'Thanh toán qua thẻ quốc tế' },
      { code: 'NCB', name: 'Ngân hàng NCB' },
      { code: 'VIETCOMBANK', name: 'Ngân hàng Vietcombank' },
      { code: 'VIETINBANK', name: 'Ngân hàng Vietinbank' },
      { code: 'BIDV', name: 'Ngân hàng BIDV' },
      { code: 'AGRIBANK', name: 'Ngân hàng Agribank' },
      { code: 'TECHCOMBANK', name: 'Ngân hàng Techcombank' },
      { code: 'ACB', name: 'Ngân hàng ACB' },
      { code: 'VPBANK', name: 'Ngân hàng VPBank' },
      { code: 'TPBANK', name: 'Ngân hàng TPBank' },
      { code: 'SACOMBANK', name: 'Ngân hàng Sacombank' },
      { code: 'HDBANK', name: 'Ngân hàng HDBank' },
      { code: 'DONGABANK', name: 'Ngân hàng Đông Á' },
      { code: 'EXIMBANK', name: 'Ngân hàng Eximbank' },
      { code: 'MBBANK', name: 'Ngân hàng MB' },
      { code: 'SCB', name: 'Ngân hàng SCB' },
      { code: 'SEABANK', name: 'Ngân hàng SeABank' },
      { code: 'SHB', name: 'Ngân hàng SHB' },
      { code: 'OCB', name: 'Ngân hàng OCB' },
    ];
  }
}

module.exports = new VNPayService();
