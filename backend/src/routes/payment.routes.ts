import { Router } from 'express';
import { PaymentService } from '../services/payment.service';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const paymentService = new PaymentService();

// Get available payment methods
router.get('/methods', async (req, res) => {
  try {
    const methods = await paymentService.getAvailablePaymentMethods();
    res.json(methods);
  } catch (error) {
    logger.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Create payment intent
router.post('/intent', authenticate, async (req, res) => {
  try {
    const { orderId, amount, currency, provider } = req.body;
    
    const paymentIntent = await paymentService.createPaymentIntent(
      orderId,
      amount,
      currency,
      provider
    );
    
    res.json(paymentIntent);
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Process card payment
router.post('/card', authenticate, async (req, res) => {
  try {
    const { orderId, amount, cardDetails } = req.body;
    
    const result = await paymentService.processCardPayment(
      orderId,
      amount,
      cardDetails
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Error processing card payment:', error);
    res.status(500).json({ error: 'Failed to process card payment' });
  }
});

// Process bank transfer
router.post('/bank-transfer', authenticate, async (req, res) => {
  try {
    const { orderId, amount, bankDetails } = req.body;
    
    const result = await paymentService.processBankTransfer(
      orderId,
      amount,
      bankDetails
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Error processing bank transfer:', error);
    res.status(500).json({ error: 'Failed to process bank transfer' });
  }
});

// Process wallet payment
router.post('/wallet', authenticate, async (req, res) => {
  try {
    const { orderId, amount, walletDetails } = req.body;
    
    const result = await paymentService.processWalletPayment(
      orderId,
      amount,
      walletDetails
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Error processing wallet payment:', error);
    res.status(500).json({ error: 'Failed to process wallet payment' });
  }
});

// Payment callback handlers
router.get('/callback/vnpay', async (req, res) => {
  try {
    const result = await paymentService.verifyPaymentCallback('vnpay', req.query);
    
    if (result.success) {
      res.redirect(`${process.env.FRONTEND_URL}/payment/success?id=${result.paymentId}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed?id=${result.paymentId}`);
    }
  } catch (error) {
    logger.error('VNPay callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
  }
});

router.post('/callback/momo', async (req, res) => {
  try {
    const result = await paymentService.verifyPaymentCallback('momo', req.body);
    
    if (result.success) {
      res.redirect(`${process.env.FRONTEND_URL}/payment/success?id=${result.paymentId}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed?id=${result.paymentId}`);
    }
  } catch (error) {
    logger.error('MoMo callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
  }
});

// IPN (Instant Payment Notification) handlers
router.post('/ipn/vnpay', async (req, res) => {
  try {
    const result = await paymentService.verifyPaymentCallback('vnpay', req.query);
    
    if (result.success) {
      res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      res.status(200).json({ RspCode: '01', Message: 'Failed' });
    }
  } catch (error) {
    logger.error('VNPay IPN error:', error);
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
});

router.post('/ipn/momo', async (req, res) => {
  try {
    const result = await paymentService.verifyPaymentCallback('momo', req.body);
    res.status(204).send(); // MoMo expects 204 No Content
  } catch (error) {
    logger.error('MoMo IPN error:', error);
    res.status(204).send();
  }
});

// Refund payment
router.post('/refund', authenticate, async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;
    
    const result = await paymentService.refundPayment(paymentId, amount, reason);
    
    res.json(result);
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Get payment history
router.get('/history', authenticate, async (req, res) => {
  try {
    const history = await paymentService.getPaymentHistory(req.query);
    res.json(history);
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Webhook handlers for payment providers
router.post('/webhook/stripe', async (req, res) => {
  try {
    // Stripe webhook handling
    const sig = req.headers['stripe-signature'];
    // Verify webhook signature and process event
    logger.info('Stripe webhook received');
    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

export default router;