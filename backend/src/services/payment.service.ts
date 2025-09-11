import crypto from 'crypto';
import axios from 'axios';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

interface PaymentConfig {
  provider: 'stripe' | 'paypal' | 'vnpay' | 'momo' | 'zalopay';
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  webhookSecret?: string;
  environment: 'sandbox' | 'production';
}

interface PaymentIntent {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  provider: string;
  metadata?: Record<string, any>;
}

interface CardDetails {
  number: string;
  expMonth: number;
  expYear: number;
  cvv: string;
  holderName: string;
}

interface BankTransferDetails {
  bankCode: string;
  accountNumber?: string;
  accountName?: string;
}

interface WalletDetails {
  provider: 'momo' | 'zalopay' | 'applepay' | 'googlepay';
  phoneNumber?: string;
  token?: string;
}

export class PaymentService {
  private configs: Map<string, PaymentConfig> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Stripe configuration
    if (process.env.STRIPE_API_KEY) {
      this.configs.set('stripe', {
        provider: 'stripe',
        apiKey: process.env.STRIPE_API_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      });
    }

    // VNPay configuration (popular in Vietnam)
    if (process.env.VNPAY_MERCHANT_ID) {
      this.configs.set('vnpay', {
        provider: 'vnpay',
        merchantId: process.env.VNPAY_MERCHANT_ID,
        secretKey: process.env.VNPAY_SECRET_KEY,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      });
    }

    // MoMo configuration
    if (process.env.MOMO_PARTNER_CODE) {
      this.configs.set('momo', {
        provider: 'momo',
        merchantId: process.env.MOMO_PARTNER_CODE,
        apiKey: process.env.MOMO_ACCESS_KEY,
        secretKey: process.env.MOMO_SECRET_KEY,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      });
    }
  }

  // Create payment intent
  async createPaymentIntent(
    orderId: string,
    amount: number,
    currency: string = 'VND',
    provider: string = 'vnpay'
  ): Promise<PaymentIntent> {
    const paymentId = uuidv4();
    
    try {
      // Save payment intent to database
      await pool.query(
        `INSERT INTO payment_transactions 
         (id, order_id, amount, currency, status, provider, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [paymentId, orderId, amount, currency, 'pending', provider]
      );

      const paymentIntent: PaymentIntent = {
        id: paymentId,
        orderId,
        amount,
        currency,
        status: 'pending',
        provider,
      };

      // Process with specific provider
      switch (provider) {
        case 'stripe':
          return await this.processStripePayment(paymentIntent);
        case 'vnpay':
          return await this.processVNPayPayment(paymentIntent);
        case 'momo':
          return await this.processMoMoPayment(paymentIntent);
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      logger.error('Payment intent creation failed:', error);
      throw error;
    }
  }

  // Process card payment
  async processCardPayment(
    orderId: string,
    amount: number,
    cardDetails: CardDetails
  ): Promise<any> {
    try {
      // Validate card details
      this.validateCardDetails(cardDetails);

      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(
        orderId,
        amount,
        'VND',
        'stripe'
      );

      // In production, this would integrate with actual payment gateway
      // For demo, we'll simulate successful payment
      const result = await this.simulatePaymentProcessing(paymentIntent);

      // Update order status if payment successful
      if (result.status === 'completed') {
        await this.updateOrderPaymentStatus(orderId, 'paid', paymentIntent.id);
      }

      return result;
    } catch (error) {
      logger.error('Card payment processing failed:', error);
      throw error;
    }
  }

  // Process bank transfer
  async processBankTransfer(
    orderId: string,
    amount: number,
    bankDetails: BankTransferDetails
  ): Promise<any> {
    try {
      const paymentIntent = await this.createPaymentIntent(
        orderId,
        amount,
        'VND',
        'bank_transfer'
      );

      // Generate bank transfer reference
      const reference = this.generateTransferReference(orderId);

      // Save bank transfer details
      await pool.query(
        `INSERT INTO bank_transfers 
         (payment_id, bank_code, reference_code, amount, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [paymentIntent.id, bankDetails.bankCode, reference, amount, 'pending']
      );

      return {
        ...paymentIntent,
        reference,
        bankDetails: {
          bankCode: bankDetails.bankCode,
          accountNumber: this.getBankAccountNumber(bankDetails.bankCode),
          accountName: 'Medical Electronics Ltd',
          amount,
          reference,
          message: `Payment for order ${orderId}`,
        },
      };
    } catch (error) {
      logger.error('Bank transfer processing failed:', error);
      throw error;
    }
  }

  // Process wallet payment (MoMo, ZaloPay, etc.)
  async processWalletPayment(
    orderId: string,
    amount: number,
    walletDetails: WalletDetails
  ): Promise<any> {
    try {
      const provider = walletDetails.provider === 'momo' ? 'momo' : 'zalopay';
      const paymentIntent = await this.createPaymentIntent(
        orderId,
        amount,
        'VND',
        provider
      );

      if (provider === 'momo') {
        return await this.processMoMoPayment(paymentIntent);
      } else {
        return await this.processZaloPayPayment(paymentIntent);
      }
    } catch (error) {
      logger.error('Wallet payment processing failed:', error);
      throw error;
    }
  }

  // VNPay specific implementation
  private async processVNPayPayment(paymentIntent: PaymentIntent): Promise<any> {
    const config = this.configs.get('vnpay');
    if (!config) throw new Error('VNPay not configured');

    const vnpayUrl = config.environment === 'production'
      ? 'https://pay.vnpay.vn/vpcpay.html'
      : 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

    const params: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.merchantId,
      vnp_Amount: paymentIntent.amount * 100, // VNPay requires amount in smallest unit
      vnp_CurrCode: paymentIntent.currency,
      vnp_TxnRef: paymentIntent.id,
      vnp_OrderInfo: `Payment for order ${paymentIntent.orderId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: this.formatVNPayDate(new Date()),
    };

    // Sort params and create signature
    const sortedParams = this.sortObject(params);
    const signData = new URLSearchParams(sortedParams).toString();
    const signature = this.createVNPaySignature(signData, config.secretKey!);
    
    sortedParams['vnp_SecureHash'] = signature;

    const paymentUrl = `${vnpayUrl}?${new URLSearchParams(sortedParams).toString()}`;

    return {
      ...paymentIntent,
      paymentUrl,
      qrCode: await this.generateQRCode(paymentUrl),
    };
  }

  // MoMo specific implementation
  private async processMoMoPayment(paymentIntent: PaymentIntent): Promise<any> {
    const config = this.configs.get('momo');
    if (!config) throw new Error('MoMo not configured');

    const endpoint = config.environment === 'production'
      ? 'https://payment.momo.vn/v2/gateway/api/create'
      : 'https://test-payment.momo.vn/v2/gateway/api/create';

    const requestId = uuidv4();
    const orderId = paymentIntent.orderId;
    const orderInfo = `Payment for order ${orderId}`;
    const redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment/callback';
    const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:3000/api/payment/momo/ipn';
    const amount = paymentIntent.amount.toString();
    const requestType = 'captureWallet';
    const extraData = '';

    // Create signature
    const rawSignature = `accessKey=${config.apiKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.merchantId}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto
      .createHmac('sha256', config.secretKey!)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: config.merchantId,
      partnerName: 'Medical Electronics',
      storeId: 'MedicalElectronics',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      extraData,
      requestType,
      signature,
    };

    try {
      const response = await axios.post(endpoint, requestBody);
      
      return {
        ...paymentIntent,
        paymentUrl: response.data.payUrl,
        qrCode: response.data.qrCodeUrl,
        deeplink: response.data.deeplink,
      };
    } catch (error) {
      logger.error('MoMo payment request failed:', error);
      throw error;
    }
  }

  // ZaloPay implementation (placeholder)
  private async processZaloPayPayment(paymentIntent: PaymentIntent): Promise<any> {
    // ZaloPay integration would go here
    // For now, return a simulated response
    return {
      ...paymentIntent,
      paymentUrl: `https://zalopay.vn/payment/${paymentIntent.id}`,
      qrCode: await this.generateQRCode(`zalopay://payment/${paymentIntent.id}`),
    };
  }

  // Stripe implementation (placeholder)
  private async processStripePayment(paymentIntent: PaymentIntent): Promise<any> {
    const config = this.configs.get('stripe');
    if (!config) throw new Error('Stripe not configured');

    // In production, use actual Stripe SDK
    // For demo, simulate Stripe payment
    return {
      ...paymentIntent,
      clientSecret: `pi_${paymentIntent.id}_secret_${uuidv4()}`,
      publishableKey: config.apiKey,
    };
  }

  // Verify payment callback
  async verifyPaymentCallback(provider: string, params: any): Promise<any> {
    switch (provider) {
      case 'vnpay':
        return await this.verifyVNPayCallback(params);
      case 'momo':
        return await this.verifyMoMoCallback(params);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Verify VNPay callback
  private async verifyVNPayCallback(params: any): Promise<any> {
    const config = this.configs.get('vnpay');
    if (!config) throw new Error('VNPay not configured');

    const secureHash = params.vnp_SecureHash;
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const sortedParams = this.sortObject(params);
    const signData = new URLSearchParams(sortedParams).toString();
    const checkSum = this.createVNPaySignature(signData, config.secretKey!);

    if (secureHash === checkSum) {
      const paymentId = params.vnp_TxnRef;
      const responseCode = params.vnp_ResponseCode;

      if (responseCode === '00') {
        // Payment successful
        await this.updatePaymentStatus(paymentId, 'completed');
        return { success: true, paymentId };
      } else {
        // Payment failed
        await this.updatePaymentStatus(paymentId, 'failed');
        return { success: false, paymentId, error: 'Payment failed' };
      }
    } else {
      throw new Error('Invalid signature');
    }
  }

  // Verify MoMo callback
  private async verifyMoMoCallback(params: any): Promise<any> {
    const config = this.configs.get('momo');
    if (!config) throw new Error('MoMo not configured');

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = params;

    // Verify signature
    const rawSignature = `accessKey=${config.apiKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const checkSignature = crypto
      .createHmac('sha256', config.secretKey!)
      .update(rawSignature)
      .digest('hex');

    if (signature === checkSignature) {
      if (resultCode === '0') {
        // Payment successful
        const paymentId = await this.getPaymentIdByOrderId(orderId);
        await this.updatePaymentStatus(paymentId, 'completed');
        return { success: true, paymentId, transactionId: transId };
      } else {
        // Payment failed
        const paymentId = await this.getPaymentIdByOrderId(orderId);
        await this.updatePaymentStatus(paymentId, 'failed');
        return { success: false, paymentId, error: message };
      }
    } else {
      throw new Error('Invalid signature');
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<any> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) throw new Error('Payment not found');

      const refundAmount = amount || payment.amount;
      const refundId = uuidv4();

      // Save refund record
      await pool.query(
        `INSERT INTO payment_refunds 
         (id, payment_id, amount, reason, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [refundId, paymentId, refundAmount, reason, 'pending']
      );

      // Process refund with provider
      let refundResult;
      switch (payment.provider) {
        case 'stripe':
          refundResult = await this.processStripeRefund(payment, refundAmount);
          break;
        case 'vnpay':
          refundResult = await this.processVNPayRefund(payment, refundAmount);
          break;
        case 'momo':
          refundResult = await this.processMoMoRefund(payment, refundAmount);
          break;
        default:
          throw new Error(`Refund not supported for provider: ${payment.provider}`);
      }

      // Update refund status
      await pool.query(
        `UPDATE payment_refunds 
         SET status = $1, processed_at = NOW()
         WHERE id = $2`,
        [refundResult.success ? 'completed' : 'failed', refundId]
      );

      return refundResult;
    } catch (error) {
      logger.error('Refund processing failed:', error);
      throw error;
    }
  }

  // Process Stripe refund (placeholder)
  private async processStripeRefund(payment: any, amount: number): Promise<any> {
    // Stripe refund logic would go here
    return { success: true, refundId: uuidv4() };
  }

  // Process VNPay refund
  private async processVNPayRefund(payment: any, amount: number): Promise<any> {
    // VNPay refund logic would go here
    return { success: true, refundId: uuidv4() };
  }

  // Process MoMo refund
  private async processMoMoRefund(payment: any, amount: number): Promise<any> {
    // MoMo refund logic would go here
    return { success: true, refundId: uuidv4() };
  }

  // Helper methods
  private validateCardDetails(cardDetails: CardDetails): void {
    // Remove spaces and validate card number
    const cardNumber = cardDetails.number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNumber)) {
      throw new Error('Invalid card number');
    }

    // Validate expiry
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    if (
      cardDetails.expYear < currentYear ||
      (cardDetails.expYear === currentYear && cardDetails.expMonth < currentMonth)
    ) {
      throw new Error('Card has expired');
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
      throw new Error('Invalid CVV');
    }
  }

  private async simulatePaymentProcessing(paymentIntent: PaymentIntent): Promise<any> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Randomly succeed or fail for demo
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      await this.updatePaymentStatus(paymentIntent.id, 'completed');
      return { ...paymentIntent, status: 'completed' };
    } else {
      await this.updatePaymentStatus(paymentIntent.id, 'failed');
      throw new Error('Payment processing failed');
    }
  }

  private generateTransferReference(orderId: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ME${timestamp}${random}`;
  }

  private getBankAccountNumber(bankCode: string): string {
    // Return demo bank account numbers based on bank code
    const accounts: Record<string, string> = {
      VCB: '1234567890123',
      TCB: '9876543210987',
      ACB: '1111222233334',
      VPB: '5555666677778',
    };
    return accounts[bankCode] || '0000000000000';
  }

  private async generateQRCode(data: string): Promise<string> {
    // In production, use actual QR code generator
    // For demo, return a placeholder
    return `data:image/png;base64,${Buffer.from(data).toString('base64')}`;
  }

  private sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  private createVNPaySignature(data: string, secretKey: string): string {
    return crypto
      .createHmac('sha512', secretKey)
      .update(data)
      .digest('hex');
  }

  private formatVNPayDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private async updatePaymentStatus(paymentId: string, status: string): Promise<void> {
    await pool.query(
      `UPDATE payment_transactions 
       SET status = $1, updated_at = NOW()
       WHERE id = $2`,
      [status, paymentId]
    );
  }

  private async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: string,
    paymentId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE orders 
       SET payment_status = $1, payment_id = $2, updated_at = NOW()
       WHERE id = $3`,
      [paymentStatus, paymentId, orderId]
    );
  }

  private async getPaymentById(paymentId: string): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM payment_transactions WHERE id = $1',
      [paymentId]
    );
    return result.rows[0];
  }

  private async getPaymentIdByOrderId(orderId: string): Promise<string> {
    const result = await pool.query(
      'SELECT id FROM payment_transactions WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );
    return result.rows[0]?.id;
  }

  // Get payment methods
  async getAvailablePaymentMethods(): Promise<any[]> {
    const methods = [];

    if (this.configs.has('stripe')) {
      methods.push({
        id: 'card',
        name: 'Credit/Debit Card',
        icon: 'credit_card',
        enabled: true,
      });
    }

    if (this.configs.has('vnpay')) {
      methods.push({
        id: 'vnpay',
        name: 'VNPay',
        icon: 'account_balance',
        enabled: true,
      });
    }

    if (this.configs.has('momo')) {
      methods.push({
        id: 'momo',
        name: 'MoMo Wallet',
        icon: 'account_balance_wallet',
        enabled: true,
      });
    }

    // Always available methods
    methods.push(
      {
        id: 'cash',
        name: 'Cash',
        icon: 'payments',
        enabled: true,
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        icon: 'account_balance',
        enabled: true,
      }
    );

    return methods;
  }

  // Get payment history
  async getPaymentHistory(filters?: any): Promise<any[]> {
    let query = `
      SELECT 
        pt.*,
        o.order_number,
        u.first_name || ' ' || u.last_name as customer_name
      FROM payment_transactions pt
      LEFT JOIN orders o ON pt.order_id = o.id
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.startDate) {
      query += ` AND pt.created_at >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ` AND pt.created_at <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    if (filters?.status) {
      query += ` AND pt.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.provider) {
      query += ` AND pt.provider = $${paramIndex++}`;
      params.push(filters.provider);
    }

    query += ' ORDER BY pt.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    return result.rows;
  }
}