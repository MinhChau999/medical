import QRCode from 'qrcode';
import { QRPay } from 'vietnam-qr-pay';

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  subItems?: Array<{
    name: string;
    price: number;
  }>;
}

export interface InvoiceData {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentMethod?: string;
  customerNotes?: string;
  createdAt: Date;
  cashier?: string;
  restaurantInfo?: {
    name: string;
    address: string;
    phone: string;
    taxId?: string;
  };
  bankInfo?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export class InvoiceGenerator {
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  private static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  static async generateVietQR(
    bankCode: string,
    accountNumber: string,
    _accountName: string, // Not used by vietnam-qr-pay, but kept for interface consistency
    amount: number,
    content: string
  ): Promise<string> {
    try {
      // Create VietQR instance using static method
      const qrPay = QRPay.initVietQR({
        bankBin: bankCode, // Bank BIN code
        bankNumber: accountNumber, // Account number
        amount: amount.toString(), // Amount as string
        purpose: content, // Transfer content
      });

      // Generate QR string
      const qrString = qrPay.build();

      // Generate QR code image
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating VietQR code:', error);
      return '';
    }
  }

  static async generateInvoiceHTML(invoice: InvoiceData, qrCodeUrl?: string): Promise<string> {
    const formatCurrency = this.formatCurrency;
    const formatDate = this.formatDate;
    
    // Format currency compact
    const formatCurrencyShort = (amount: number): string => {
      return amount.toLocaleString('vi-VN') + 'đ';
    };

    // Calculate totals
    const itemCount = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
    const invoiceDate = invoice.createdAt || new Date();
    
    return `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Hóa đơn ${invoice.orderNumber}</title>
          <style>
            @page { 
              size: 80mm auto; 
              margin: 2mm;
            }
            
            @media screen {
              body {
                max-width: 300px;
                margin: 20px auto;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              }
            }
            
            @media print {
              body {
                width: 76mm;
                padding: 2mm;
                background: white;
              }
              .no-print { display: none; }
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
              background: white;
            }
            
            /* Header Styles */
            .header {
              text-align: center;
              padding-bottom: 10px;
              margin-bottom: 12px;
              border-bottom: 2px solid #000;
            }
            
            .store-name {
              font-size: 18px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 5px;
              letter-spacing: 1px;
            }
            
            .store-info {
              font-size: 11px;
              color: #666;
              margin-bottom: 2px;
            }
            
            .invoice-title {
              font-size: 16px;
              font-weight: bold;
              margin-top: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            /* Invoice Info */
            .invoice-meta {
              background: #f8f9fa;
              padding: 8px;
              margin-bottom: 12px;
              border-radius: 5px;
              font-size: 11px;
            }
            
            .meta-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            
            .meta-row:last-child {
              margin-bottom: 0;
            }
            
            .meta-label {
              font-weight: 600;
            }
            
            /* Items Section */
            .items-header {
              background: #000;
              color: white;
              padding: 6px 8px;
              font-weight: bold;
              font-size: 11px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            
            .item {
              border-bottom: 1px dashed #ccc;
              padding: 5px 0;
              font-size: 11px;
            }
            
            .item:last-child {
              border-bottom: none;
            }
            
            .item-main {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 2px;
            }
            
            .item-name {
              flex: 1;
              font-weight: 500;
              margin-right: 8px;
            }
            
            .item-qty {
              font-weight: bold;
              color: #007bff;
              margin-right: 8px;
              min-width: 25px;
              text-align: center;
            }
            
            .item-price {
              font-weight: bold;
              color: #28a745;
              min-width: 60px;
              text-align: right;
            }
            
            .sub-items {
              margin-left: 15px;
              margin-top: 3px;
            }
            
            .sub-item {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #666;
              margin-bottom: 1px;
              font-style: italic;
            }
            
            /* Totals Section */
            .totals {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px solid #000;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-size: 12px;
            }
            
            .total-row.discount {
              color: #dc3545;
            }
            
            .total-row.final {
              font-size: 16px;
              font-weight: bold;
              margin-top: 8px;
              padding-top: 8px;
              border-top: 2px solid #000;
              background: #f8f9fa;
              padding: 8px;
              border-radius: 5px;
            }
            
            /* QR Section */
            .qr-section {
              text-align: center;
              margin-top: 15px;
              padding: 10px;
              border: 2px dashed #666;
              border-radius: 8px;
              background: #f8f9fa;
            }
            
            .qr-title {
              font-weight: bold;
              font-size: 13px;
              margin-bottom: 8px;
              color: #007bff;
            }
            
            .qr-code {
              margin: 10px 0;
            }
            
            .qr-code img {
              width: 120px;
              height: 120px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background: white;
              padding: 2px;
            }
            
            .bank-info {
              font-size: 10px;
              text-align: left;
              background: white;
              padding: 8px;
              border-radius: 5px;
              margin-top: 8px;
            }
            
            .bank-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            
            .bank-label {
              font-weight: 500;
              color: #666;
            }
            
            .bank-value {
              font-weight: bold;
            }
            
            /* Footer */
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 12px;
              border-top: 2px solid #000;
              font-size: 11px;
            }
            
            .thank-you {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #28a745;
            }
            
            .website {
              font-weight: bold;
              color: #007bff;
              margin-top: 5px;
            }
            
            .powered-by {
              font-size: 9px;
              color: #999;
              margin-top: 8px;
            }
            
            /* Print Optimizations */
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .qr-section {
                break-inside: avoid;
              }
              
              .totals {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <div class="store-name">${invoice.restaurantInfo?.name || 'Medical Electronics Store'}</div>
            <div class="store-info">${invoice.restaurantInfo?.address || '123 Nguyễn Văn Linh, Q7, TP.HCM'}</div>
            <div class="store-info">☎ ${invoice.restaurantInfo?.phone || '028 1234 5678'}</div>
            ${invoice.restaurantInfo?.taxId ? `<div class="store-info">MST: ${invoice.restaurantInfo.taxId}</div>` : ''}
            <div class="invoice-title">Hóa Đơn Bán Hàng</div>
          </div>
          
          <!-- Invoice Meta -->
          <div class="invoice-meta">
            <div class="meta-row">
              <span class="meta-label">Số HĐ:</span>
              <span>${invoice.orderNumber}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Ngày:</span>
              <span>${formatDate(invoiceDate)}</span>
            </div>
          </div>
          
          <!-- Items Header -->
          <div class="items-header">
            Danh Sách Sản Phẩm
          </div>
          
          <!-- Items List -->
          <div class="items-list">
            ${invoice.items.map(item => {
              const itemTotal = item.price * item.quantity + 
                (item.subItems?.reduce((sum, sub) => sum + sub.price * item.quantity, 0) || 0);
              
              return `
                <div class="item">
                  <div class="item-main">
                    <div class="item-name">${item.name}</div>
                    <div class="item-qty">×${item.quantity}</div>
                    <div class="item-price">${formatCurrencyShort(itemTotal)}</div>
                  </div>
                  ${item.subItems && item.subItems.length > 0 ? `
                    <div class="sub-items">
                      ${item.subItems.map(sub => `
                        <div class="sub-item">
                          <span>+ ${sub.name}</span>
                          <span>${formatCurrencyShort(sub.price)}</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
          
          <!-- Totals -->
          <div class="totals">
            <div class="total-row">
              <span>Số lượng:</span>
              <span>${itemCount} sản phẩm</span>
            </div>
            <div class="total-row">
              <span>Tạm tính:</span>
              <span>${formatCurrencyShort(invoice.subtotal)}</span>
            </div>
            ${invoice.discount ? `
            <div class="total-row discount">
              <span>Giảm giá:</span>
              <span>-${formatCurrencyShort(invoice.discount)}</span>
            </div>` : ''}
            ${invoice.tax ? `
            <div class="total-row">
              <span>VAT:</span>
              <span>${formatCurrencyShort(invoice.tax)}</span>
            </div>` : ''}
            <div class="total-row final">
              <span>TỔNG CỘNG:</span>
              <span>${formatCurrencyShort(invoice.total)}</span>
            </div>
          </div>
          
          ${qrCodeUrl ? `
          <!-- QR Code Section -->
          <div class="qr-section">
            <div class="qr-title">💳 Thanh Toán QR Code</div>
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code" />
            </div>
            ${invoice.bankInfo ? `
            <div class="bank-info">
              <div class="bank-row">
                <span class="bank-label">Ngân hàng:</span>
                <span class="bank-value">${invoice.bankInfo.bankName}</span>
              </div>
              <div class="bank-row">
                <span class="bank-label">Số TK:</span>
                <span class="bank-value">${invoice.bankInfo.accountNumber}</span>
              </div>
              <div class="bank-row">
                <span class="bank-label">Chủ TK:</span>
                <span class="bank-value">${invoice.bankInfo.accountName}</span>
              </div>
              <div class="bank-row">
                <span class="bank-label">Số tiền:</span>
                <span class="bank-value">${formatCurrencyShort(invoice.total)}</span>
              </div>
              <div class="bank-row">
                <span class="bank-label">Nội dung:</span>
                <span class="bank-value">${invoice.orderNumber}</span>
              </div>
            </div>` : ''}
          </div>` : ''}
          
          <!-- Footer -->
          <div class="footer">
            <div class="thank-you">✨ Cảm Ơn Quý Khách! ✨</div>
            <div>Hẹn gặp lại quý khách</div>
            <div class="website">www.medical-store.vn</div>
            <div class="powered-by">Powered by Medical POS © ${new Date().getFullYear()}</div>
          </div>
        </body>
      </html>
    `;
  }

  static async printInvoice(invoiceData: InvoiceData, qrCodeUrl?: string): Promise<void> {
    const html = await this.generateInvoiceHTML(invoiceData, qrCodeUrl);
    
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile: open new window/tab
      const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
      
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 250);
        };
      } else {
        // If popup blocked, fallback to data URL
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } else {
      // For desktop: use iframe method
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-10000px';
      printFrame.style.left = '-10000px';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = 'none';
      
      document.body.appendChild(printFrame);
      
      const frameDoc = printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(html);
        frameDoc.close();
        
        // Print after content loads
        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (printError) {
            console.warn('Print error:', printError);
          }
          
          // Remove iframe after printing
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 1000);
        }, 500);
      }
    }
  }
}

export default InvoiceGenerator;