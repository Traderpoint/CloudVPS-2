/**
 * Comgate Payment Initialization API
 * Handles Comgate payment initialization requests
 */

const ComgateProcessor = require('../../../../lib/comgate-processor');
const logger = require('../../../../utils/logger');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      orderId,
      invoiceId,
      amount,
      currency = 'CZK',
      customerEmail,
      customerName,
      customerPhone,
      description,
      returnUrl,
      cancelUrl,
      pendingUrl
    } = req.body;

    // Validate required fields
    if (!orderId || !amount || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, amount, customerEmail'
      });
    }

    logger.info('Comgate payment initialization request', {
      orderId,
      invoiceId,
      amount,
      currency,
      customerEmail
    });

    const comgateProcessor = new ComgateProcessor();

    // Prepare payment data
    const paymentData = {
      orderId,
      invoiceId: invoiceId || orderId,
      amount: parseFloat(amount),
      currency,
      customerEmail,
      customerName: customerName || 'Customer',
      customerPhone,
      description: description || `Payment for order ${orderId}`,
      returnUrl: returnUrl || `${process.env.MIDDLEWARE_URL || 'http://localhost:3005'}/api/payments/return?status=success&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=comgate`,
      cancelUrl: cancelUrl || `${process.env.MIDDLEWARE_URL || 'http://localhost:3005'}/api/payments/return?status=cancelled&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=comgate`,
      pendingUrl: pendingUrl || `${process.env.MIDDLEWARE_URL || 'http://localhost:3005'}/api/payments/return?status=pending&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=comgate`
    };

    // Initialize payment
    const result = await comgateProcessor.initializePayment(paymentData);

    if (result.success) {
      logger.info('Comgate payment initialized successfully', {
        orderId,
        transactionId: result.transactionId,
        redirectUrl: result.redirectUrl
      });

      return res.status(200).json({
        success: true,
        transactionId: result.transactionId,
        redirectUrl: result.redirectUrl,
        paymentMethod: 'comgate',
        status: result.status,
        message: result.message
      });
    } else {
      logger.error('Comgate payment initialization failed', {
        orderId,
        error: result.error
      });

      return res.status(400).json({
        success: false,
        error: result.error,
        paymentMethod: 'comgate'
      });
    }

  } catch (error) {
    logger.error('Comgate payment initialization error', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
