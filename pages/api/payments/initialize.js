/**
 * Payment Initialization API
 * POST /api/payments/initialize
 * Initializes payment for an order/invoice
 */

const axios = require('axios');

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

  try {
    console.log('🚀 Initializing payment...');
    console.log('📤 Payment data:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    const { orderId, invoiceId, method, amount, currency = 'CZK', customerData } = req.body;

    if (!orderId || !invoiceId || !method || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, invoiceId, method, amount',
        timestamp: new Date().toISOString()
      });
    }

    // Validate payment method
    const supportedMethods = ['card', 'paypal', 'banktransfer', 'crypto', 'payu', 'comgate'];
    if (!supportedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported payment method: ${method}. Supported: ${supportedMethods.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        timestamp: new Date().toISOString()
      });
    }

    // Prepare payment data for middleware
    const paymentData = {
      orderId,
      invoiceId,
      method,
      amount: numericAmount,
      currency,
      customerData: req.body.customerData || {},
      metadata: {
        source: 'cloudvps_frontend',
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      }
    };

    console.log('🔄 Sending to middleware:', JSON.stringify(paymentData, null, 2));

    // Try middleware first
    try {
      console.log('🔗 Calling middleware at:', `${middlewareUrl}/api/payments/initialize`);
      console.log('🔍 DEBUG: Middleware URL from env:', process.env.MIDDLEWARE_URL);
      console.log('🔍 DEBUG: Payment data being sent:', JSON.stringify(paymentData, null, 2));

      const response = await axios.post(`${middlewareUrl}/api/payments/initialize`, paymentData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });

      const result = response.data;

      if (result.success) {
        console.log('✅ Payment initialized via middleware:', result);

        return res.status(200).json({
          success: true,
          message: 'Payment initialized successfully',
          paymentId: result.paymentId,
          transactionId: result.transactionId, // ✅ ADD MISSING TRANSACTION ID
          orderId: result.orderId,
          invoiceId: result.invoiceId,
          method: result.method,
          amount: result.amount,
          currency: result.currency,
          status: result.status,
          redirectRequired: result.redirectRequired,
          paymentUrl: result.paymentUrl,
          instructions: result.instructions,
          gateway: {
            id: result.gateway?.id,
            name: result.gateway?.name,
            type: result.gateway?.type
          },
          expiresAt: result.expiresAt,
          source: 'middleware',
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn('⚠️ Middleware payment initialization failed:', result.error);
        throw new Error(result.error || 'Middleware failed');
      }
    } catch (middlewareError) {
      console.error('❌ MIDDLEWARE REQUIRED - NO FALLBACKS ALLOWED!');
      console.error('🔍 Middleware error details:', {
        message: middlewareError.message,
        code: middlewareError.code,
        response: middlewareError.response?.data,
        status: middlewareError.response?.status
      });

      return res.status(500).json({
        success: false,
        error: 'Middleware is required for all payments. No fallbacks allowed.',
        message: 'Payment processing requires middleware. Please ensure middleware is running on port 3005.',
        middlewareError: middlewareError.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error initializing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize payment',
      details: error.message,
      middleware_url: middlewareUrl,
      timestamp: new Date().toISOString()
    });
  }
}

// ❌ ALL FALLBACK FUNCTIONS REMOVED - MIDDLEWARE REQUIRED FOR ALL PAYMENTS
