import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SMSOptions {
  to: string;
  message: string;
}

interface NotificationTemplate {
  name: string;
  subject?: string;
  variables: Record<string, any>;
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Email Methods
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `Medical Electronics <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || this.stripHtml(options.html),
        html: options.html,
      };

      const info = await this.emailTransporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      
      // Log notification
      await this.logNotification({
        type: 'email',
        recipient: options.to,
        subject: options.subject,
        status: 'sent',
        metadata: { messageId: info.messageId },
      });

      return true;
    } catch (error) {
      logger.error('Email sending failed:', error);
      
      await this.logNotification({
        type: 'email',
        recipient: options.to,
        subject: options.subject,
        status: 'failed',
        metadata: { error: (error as Error).message },
      });

      return false;
    }
  }

  async sendSMS(options: SMSOptions): Promise<boolean> {
    try {
      // Here you would integrate with SMS providers like Twilio, Nexmo, etc.
      // For demo purposes, we'll just log and return
      logger.info(`SMS to ${options.to}: ${options.message}`);

      await this.logNotification({
        type: 'sms',
        recipient: options.to,
        subject: 'SMS',
        status: 'sent',
        metadata: { message: options.message },
      });

      return true;
    } catch (error) {
      logger.error('SMS sending failed:', error);
      return false;
    }
  }

  // Template Methods
  async sendTemplateEmail(template: NotificationTemplate, to: string): Promise<boolean> {
    const html = await this.renderTemplate(template.name, template.variables);
    return this.sendEmail({
      to,
      subject: template.subject || this.getTemplateSubject(template.name),
      html,
    });
  }

  // Order Notifications
  async sendOrderConfirmation(orderId: string): Promise<void> {
    const orderData = await this.getOrderData(orderId);
    if (!orderData) return;

    const template = {
      name: 'order-confirmation',
      subject: `Order Confirmed - #${orderData.order_number}`,
      variables: orderData,
    };

    await this.sendTemplateEmail(template, orderData.customer_email);
  }

  async sendOrderStatusUpdate(orderId: string, newStatus: string): Promise<void> {
    const orderData = await this.getOrderData(orderId);
    if (!orderData) return;

    const statusMessages: Record<string, string> = {
      confirmed: 'Your order has been confirmed',
      processing: 'Your order is being processed',
      shipped: 'Your order has been shipped',
      delivered: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled',
    };

    const html = `
      <h2>Order Status Update</h2>
      <p>Dear ${orderData.customer_name},</p>
      <p>${statusMessages[newStatus] || 'Your order status has been updated'}.</p>
      <p><strong>Order Number:</strong> ${orderData.order_number}</p>
      <p><strong>New Status:</strong> ${newStatus.toUpperCase()}</p>
      <p>You can track your order at any time by logging into your account.</p>
      <p>Thank you for shopping with Medical Electronics!</p>
    `;

    await this.sendEmail({
      to: orderData.customer_email,
      subject: `Order #${orderData.order_number} - Status Update`,
      html,
    });

    // Also send SMS for important status updates
    if (['shipped', 'delivered', 'cancelled'].includes(newStatus)) {
      await this.sendSMS({
        to: orderData.customer_phone,
        message: `Order #${orderData.order_number}: ${statusMessages[newStatus]}`,
      });
    }
  }

  // Customer Notifications
  async sendWelcomeEmail(customerId: string): Promise<void> {
    const customer = await this.getCustomerData(customerId);
    if (!customer) return;

    const html = `
      <h2>Welcome to Medical Electronics!</h2>
      <p>Dear ${customer.first_name},</p>
      <p>Thank you for creating an account with us. We're excited to have you as part of our community!</p>
      <h3>Your Benefits:</h3>
      <ul>
        <li>Exclusive member discounts</li>
        <li>Early access to new products</li>
        <li>Loyalty points on every purchase</li>
        <li>Free shipping on orders over ₫500,000</li>
      </ul>
      <p>Start shopping now and enjoy these benefits!</p>
      <p>Best regards,<br>Medical Electronics Team</p>
    `;

    await this.sendEmail({
      to: customer.email,
      subject: 'Welcome to Medical Electronics!',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <p><a href="${resetUrl}" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
    });
  }

  // Inventory Notifications
  async sendLowStockAlert(productId: string, currentStock: number): Promise<void> {
    const product = await this.getProductData(productId);
    if (!product) return;

    const managers = await this.getManagers();
    
    const html = `
      <h2>Low Stock Alert</h2>
      <p>The following product is running low on stock:</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Product:</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">${product.name}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>SKU:</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">${product.sku}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Current Stock:</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">${currentStock}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Threshold:</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">${product.low_stock_threshold}</td>
        </tr>
      </table>
      <p>Please reorder this product soon to avoid stockout.</p>
    `;

    for (const manager of managers) {
      await this.sendEmail({
        to: manager.email,
        subject: `Low Stock Alert: ${product.name}`,
        html,
      });
    }
  }

  // Marketing Notifications
  async sendPromotionalEmail(customerId: string, promotion: any): Promise<void> {
    const customer = await this.getCustomerData(customerId);
    if (!customer) return;

    const html = `
      <h2>${promotion.title}</h2>
      <p>Dear ${customer.first_name},</p>
      <p>${promotion.description}</p>
      <p><strong>Discount:</strong> ${promotion.discount}% OFF</p>
      <p><strong>Valid until:</strong> ${new Date(promotion.valid_until).toLocaleDateString()}</p>
      <p>Use code: <strong>${promotion.code}</strong></p>
      <p><a href="${process.env.FRONTEND_URL}/shop" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Shop Now</a></p>
    `;

    await this.sendEmail({
      to: customer.email,
      subject: promotion.title,
      html,
    });
  }

  async sendBulkEmail(customerIds: string[], subject: string, content: string): Promise<void> {
    const customers = await this.getCustomersByIds(customerIds);
    
    for (const customer of customers) {
      const personalizedContent = content
        .replace('{first_name}', customer.first_name)
        .replace('{last_name}', customer.last_name)
        .replace('{email}', customer.email);

      await this.sendEmail({
        to: customer.email,
        subject,
        html: personalizedContent,
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Helper Methods
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private async renderTemplate(templateName: string, variables: Record<string, any>): Promise<string> {
    // In a real app, you would use a template engine like Handlebars or EJS
    // For now, we'll use simple string replacement
    const templates: Record<string, string> = {
      'order-confirmation': `
        <h2>Order Confirmation</h2>
        <p>Dear {customer_name},</p>
        <p>Thank you for your order! We've received your order and will process it soon.</p>
        <p><strong>Order Number:</strong> {order_number}</p>
        <p><strong>Total Amount:</strong> {total_amount}</p>
        <p><strong>Payment Method:</strong> {payment_method}</p>
        <h3>Order Items:</h3>
        {items_html}
        <p>We'll notify you when your order ships.</p>
        <p>Thank you for shopping with Medical Electronics!</p>
      `,
    };

    let template = templates[templateName] || '';
    
    Object.entries(variables).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return template;
  }

  private getTemplateSubject(templateName: string): string {
    const subjects: Record<string, string> = {
      'order-confirmation': 'Order Confirmation',
      'order-shipped': 'Your Order Has Been Shipped',
      'welcome': 'Welcome to Medical Electronics',
    };

    return subjects[templateName] || 'Medical Electronics Notification';
  }

  private async logNotification(data: {
    type: string;
    recipient: string;
    subject: string;
    status: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO notification_logs (id, type, recipient, subject, status, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          uuidv4(),
          data.type,
          data.recipient,
          data.subject,
          data.status,
          JSON.stringify(data.metadata || {}),
        ]
      );
    } catch (error) {
      logger.error('Failed to log notification:', error);
    }
  }

  private async getOrderData(orderId: string): Promise<any> {
    const result = await pool.query(
      `SELECT o.*, u.email as customer_email, u.phone as customer_phone,
              u.first_name || ' ' || u.last_name as customer_name
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );
    return result.rows[0];
  }

  private async getCustomerData(customerId: string): Promise<any> {
    const result = await pool.query(
      `SELECT u.*, c.*
       FROM users u
       LEFT JOIN customers c ON u.id = c.id
       WHERE u.id = $1`,
      [customerId]
    );
    return result.rows[0];
  }

  private async getProductData(productId: string): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );
    return result.rows[0];
  }

  private async getManagers(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM users WHERE role IN ('admin', 'manager') AND status = 'active'`
    );
    return result.rows;
  }

  private async getCustomersByIds(customerIds: string[]): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM users WHERE id = ANY($1)`,
      [customerIds]
    );
    return result.rows;
  }
}