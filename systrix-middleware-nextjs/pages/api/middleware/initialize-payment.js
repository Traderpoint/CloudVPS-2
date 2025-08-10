/**
 * Initialize Payment API - CloudVPS to Middleware
 * Enhanced with RealPaymentProcessor logic for consistent payment handling
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

  try {
    console.log('🚀 API: Initializing payment through middleware with RealPaymentProcessor logic...');
    console.log('📤 Payment data:', JSON.stringify(req.body, null, 2));

    // Extract and validate required fields
    const {
      orderId,
      invoiceId,
      method,
      amount,
      currency,
      customerData,
      testFlow,
      returnUrl,
      cancelUrl,
      billingPeriod,
      billingCycle,
      selectedOS,
      selectedApps,
      appliedPromo
    } = req.body;

    // Validate required fields
    if (!orderId || !invoiceId || !method || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, invoiceId, method, amount',
        timestamp: new Date().toISOString()
      });
    }

    // Prepare enhanced payment data for middleware (RealPaymentProcessor style)
    const paymentData = {
      orderId: String(orderId),
      invoiceId: String(invoiceId),
      method,
      amount: parseFloat(amount),
      currency: currency || 'CZK',
      customerData: {
        email: customerData?.email || 'test@example.com',
        name: customerData?.name || 'Test Customer',
        phone: customerData?.phone || ''
      },
      testFlow: testFlow || false,
      returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-success-flow`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-cancelled`,
      source: 'cloudvps_real_payment_flow',
      // Additional context for better payment processing
      billingPeriod,
      billingCycle,
      selectedOS,
      selectedApps,
      appliedPromo
    };

    console.log('📤 Enhanced payment data for middleware:', paymentData);

    // Forward enhanced request to middleware
    const response = await fetch(`${middlewareUrl}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error(`Middleware HTTP error: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Payment initialized successfully via middleware:', result);

      // Extract real transaction ID from middleware response
      const realTransactionId = result.transactionId || result.paymentId;

      // Validate that we got a real transaction ID (not mock)
      if (!realTransactionId || realTransactionId.startsWith('AUTO-')) {
        console.warn('⚠️ Warning: Received mock transaction ID:', realTransactionId);
      } else {
        console.log('✅ Real transaction ID received:', realTransactionId);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully via middleware',
        transactionId: realTransactionId,
        paymentId: result.paymentId || realTransactionId,
        paymentUrl: result.paymentUrl || result.url,
        redirectRequired: result.redirectRequired,
        paymentMethod: result.paymentMethod || method,
        orderId: orderId,
        invoiceId: invoiceId,
        amount: amount,
        currency: currency || 'CZK',
        source: 'cloudvps_real_payment_flow',
        middleware_response: result,
        timestamp: new Date().toISOString()
      });

    } else {
      throw new Error(result.error || 'Middleware payment initialization failed');
    }

  } catch (error) {
    console.error('❌ Payment initialization error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
