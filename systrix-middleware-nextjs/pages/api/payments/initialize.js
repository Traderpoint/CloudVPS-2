/**
 * Payment Initialization API for Middleware
 * POST /api/payments/initialize
 * Initializes payment for an order/invoice through HostBill
 */

const HostBillClient = require('../../../lib/hostbill-client');
const PaymentProcessor = require('../../../lib/payment-processor');
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    logger.info('🚀 Payment initialization request received', {
      body: JSON.stringify(req.body, null, 2)
    });

    // Validate required fields and extract cart settings
    const {
      orderId,
      invoiceId,
      method,
      amount,
      currency = 'CZK',
      customerData,
      testFlow = false,
      returnUrl,
      cancelUrl,
      // Cart settings for proper price calculation
      billingPeriod,
      billingCycle,
      selectedOS,
      selectedApps,
      appliedPromo,
      cartSettings,
      // Dual pricing for ComGate vs HostBill
      comgateAmount,
      hostbillMonthlyAmount
    } = req.body;

    if (!orderId || !invoiceId || !method || !amount) {
      logger.warn('❌ Missing required fields', { orderId, invoiceId, method, amount });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, invoiceId, method, amount',
        timestamp: new Date().toISOString()
      });
    }

    // Validate payment method
    const supportedMethods = ['card', 'paypal', 'banktransfer', 'crypto', 'payu', 'comgate', 'comgate_advanced', 'comgate_external'];
    if (!supportedMethods.includes(method)) {
      logger.warn('❌ Unsupported payment method', { method, supportedMethods });
      return res.status(400).json({
        success: false,
        error: `Unsupported payment method: ${method}. Supported: ${supportedMethods.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      logger.warn('❌ Invalid amount', { amount, numericAmount });
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        timestamp: new Date().toISOString()
      });
    }

    // Recalculate amount if billing period suggests it should be higher
    let finalAmount = numericAmount;

    if (billingPeriod && cartSettings && parseInt(billingPeriod) > 1) {
      // Calculate expected amount based on billing period and cart settings
      const baseMonthlyPrice = 299; // VPS Basic base price
      const periodMultiplier = parseInt(billingPeriod);
      const osModifier = cartSettings.osModifier || 0;
      const periodDiscount = cartSettings.periodDiscount || 0;

      // Calculate expected total
      const adjustedMonthlyPrice = baseMonthlyPrice + osModifier;
      const totalBeforeDiscount = adjustedMonthlyPrice * periodMultiplier;
      const discountAmount = totalBeforeDiscount * (periodDiscount / 100);
      const expectedAmount = totalBeforeDiscount - discountAmount;

      // If provided amount is significantly lower than expected, use calculated amount
      const amountDifference = Math.abs(expectedAmount - numericAmount);
      const isAmountTooLow = numericAmount < (expectedAmount * 0.5); // Less than 50% of expected

      if (isAmountTooLow && amountDifference > 1000) {
        logger.warn('⚠️ Amount seems too low for billing period - recalculating', {
          providedAmount: numericAmount,
          expectedAmount: Math.round(expectedAmount),
          billingPeriod,
          baseMonthlyPrice,
          osModifier,
          periodDiscount: periodDiscount + '%',
          calculation: `(${baseMonthlyPrice} + ${osModifier}) × ${periodMultiplier} × ${(100-periodDiscount)/100} = ${Math.round(expectedAmount)}`
        });

        finalAmount = Math.round(expectedAmount);
      }
    }

    logger.info('💰 Payment initialization - dual pricing', {
      originalAmount: amount,
      numericAmount,
      finalAmount,
      comgateAmount: comgateAmount || 'not provided',
      hostbillMonthlyAmount: hostbillMonthlyAmount || 'not provided',
      method,
      billingPeriod,
      billingCycle,
      selectedOS,
      cartSettings,
      amountAdjusted: finalAmount !== numericAmount,
      note: 'ComGate gets total amount, HostBill should get monthly amount + billing cycle'
    });

    // Get configuration URLs for all payment methods
    const hostbillUrl = process.env.HOSTBILL_URL || 'https://vps.kabel1it.cz';
    const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

    // Use middleware return URLs that will redirect back to Cloud VPS
    const defaultReturnUrl = `${middlewareUrl}/api/payments/return?status=success&orderId=${orderId}&invoiceId=${invoiceId}${testFlow ? '&testFlow=true' : ''}`;
    const defaultCancelUrl = `${middlewareUrl}/api/payments/return?status=cancelled&orderId=${orderId}&invoiceId=${invoiceId}${testFlow ? '&testFlow=true' : ''}`;

    // Handle Comgate payments separately (external payment processor)
    if (method.toLowerCase() === 'comgate' || method.toLowerCase() === 'comgate_external' || method.toLowerCase() === 'comgate_advanced') {
      try {
        const ComgateProcessor = require('../../../lib/comgate-processor');
        const comgateProcessor = new ComgateProcessor();

        // Use middleware return URLs that will redirect back to Cloud VPS
        const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

        // Build return URLs with custom return URL if provided
        const returnUrlParam = returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : '';
        const testFlowParam = testFlow ? '&testFlow=true' : '';

        // Add billing period and cart settings to return URLs
        const billingParams = billingPeriod ? `&period=${billingPeriod}` : '';
        const osParams = selectedOS ? `&os=${selectedOS}` : '';
        const amountParams = `&amount=${numericAmount}`;

        // Update amount params with final amount
        const finalAmountParams = `&amount=${finalAmount}`;

        // ComGate will automatically append transId and refId to return URLs
        // Base return URL without ComGate parameters (they will be added automatically)
        const baseReturnUrl = `${middlewareUrl}/api/payments/return`;

        const comgatePaymentData = {
          orderId,
          invoiceId,
          amount: finalAmount, // Use recalculated amount
          currency,
          customerEmail: customerData?.email || 'customer@example.com',
          customerName: customerData?.name || 'Customer Name',
          description: `Payment for order ${orderId} (${billingPeriod || '1'} month${billingPeriod !== '1' ? 's' : ''})`,
          returnUrl: `${baseReturnUrl}?status=success&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}${finalAmountParams}${billingParams}${osParams}${testFlowParam}${returnUrlParam}`,
          cancelUrl: `${baseReturnUrl}?status=cancelled&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}${finalAmountParams}${billingParams}${osParams}${testFlowParam}${returnUrlParam}`,
          pendingUrl: `${baseReturnUrl}?status=pending&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}${finalAmountParams}${billingParams}${osParams}${testFlowParam}${returnUrlParam}`
        };

        logger.info('🔍 DEBUG: Comgate payment data prepared', {
          orderId,
          invoiceId,
          middlewareUrl,
          originalAmount: amount,
          numericAmount,
          comgateAmount: comgatePaymentData.amount,
          returnUrl: comgatePaymentData.returnUrl,
          cancelUrl: comgatePaymentData.cancelUrl,
          pendingUrl: comgatePaymentData.pendingUrl
        });

        const comgateResult = await comgateProcessor.initializePayment(comgatePaymentData);

        if (comgateResult.success) {
          logger.info('✅ Comgate payment initialized successfully', {
            orderId,
            transactionId: comgateResult.transactionId
          });

          return res.status(200).json({
            success: true,
            redirectRequired: true,
            paymentUrl: comgateResult.redirectUrl,
            paymentId: comgateResult.transactionId, // Use transactionId as paymentId for consistency
            transactionId: comgateResult.transactionId,
            paymentMethod: method, // Use actual method (comgate, comgate_external, or comgate_advanced)
            status: comgateResult.status,
            message: 'Comgate payment initialized successfully',
            timestamp: new Date().toISOString()
          });
        } else {
          throw new Error(comgateResult.error);
        }
      } catch (error) {
        logger.error('❌ Comgate payment initialization failed', {
          orderId,
          error: error.message
        });
        return res.status(500).json({
          success: false,
          error: `Comgate payment failed: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Initialize HostBill client and payment processor for other methods
    let hostbillClient, paymentProcessor;
    try {
      hostbillClient = new HostBillClient();
      paymentProcessor = new PaymentProcessor(hostbillClient);
    } catch (error) {
      logger.error('❌ Failed to initialize HostBill client or PaymentProcessor', {
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        error: `Failed to initialize payment processor: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }

    // Prepare payment data
    const paymentData = {
      orderId,
      invoiceId,
      method,
      amount: numericAmount,
      finalAmount, // Add finalAmount for consistent pricing
      currency,
      billingPeriod,
      selectedOS,
      returnUrl,
      testFlow,
      customerData: customerData || {},
      metadata: {
        source: 'middleware',
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      }
    };

    logger.info('🔄 Processing payment initialization', {
      orderId,
      invoiceId,
      method,
      amount: numericAmount,
      currency
    });

    // Initialize payment through HostBill
    const result = await initializePaymentWithHostBill(hostbillClient, paymentData);

    if (result.success) {
      logger.info('✅ Payment initialized successfully', {
        paymentId: result.paymentId,
        orderId: result.orderId,
        method: result.method,
        redirectRequired: result.redirectRequired
      });

      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        paymentId: result.paymentId,
        orderId: result.orderId,
        invoiceId: result.invoiceId,
        method: result.method,
        amount: result.amount,
        currency: result.currency,
        status: result.status,
        redirectRequired: result.redirectRequired,
        paymentUrl: result.paymentUrl,
        instructions: result.instructions,
        gateway: result.gateway,
        expiresAt: result.expiresAt,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.error('❌ Payment initialization failed', {
        orderId,
        error: result.error
      });

      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to initialize payment',
        orderId,
        invoiceId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('❌ Payment initialization error', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during payment initialization',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Initialize payment with HostBill
 * @param {HostBillClient} hostbillClient - HostBill client instance
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Payment initialization result
 */
async function initializePaymentWithHostBill(hostbillClient, paymentData) {
  const { orderId, invoiceId, method, amount, finalAmount, currency, billingPeriod, selectedOS, returnUrl, testFlow } = paymentData;
  
  try {
    logger.info('🎯 Initializing payment with HostBill', {
      orderId,
      invoiceId,
      method,
      amount,
      currency
    });

    // Generate unique payment ID
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get configuration URLs
    const hostbillUrl = process.env.HOSTBILL_URL || 'https://vps.kabel1it.cz';
    const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';



    // Map payment method to HostBill gateway ID (from payment-modules)
    const gatewayIdMapping = {
      'payu': '10',      // PayU
      'comgate': '130',  // Comgate
      'comgate_advanced': '133', // Comgate Advanced
      'comgate_external': 'external', // External Comgate (handled separately)
      'paypal': '112',   // PayPal Checkout v2
      'card': '121',     // Stripe Intents - 3D Secure
      'stripe': '121',   // Stripe alias
      'banktransfer': '3', // Bank transfer (estimated)
      'crypto': '4',     // Crypto (estimated)
      'bitcoin': '4'     // Bitcoin alias
    };

    const gatewayId = gatewayIdMapping[method.toLowerCase()];
    const hostbillGateway = method.toLowerCase();

    // Build return URLs with same parameters as ComGate (shared for all methods)
    const returnUrlParam = returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : '';
    const testFlowParam = testFlow ? '&testFlow=true' : '';
    const billingParams = billingPeriod ? `&period=${billingPeriod}` : '';
    const osParams = selectedOS ? `&os=${selectedOS}` : '';
    const finalAmountParams = `&amount=${finalAmount}`;

    // For testing purposes, create a test payment initialization
    // In production, this would call HostBill API to create payment session
    let result = {
      success: true,
      paymentId,
      orderId,
      invoiceId,
      method,
      amount: finalAmount, // Use finalAmount for consistent pricing
      currency,
      status: 'initialized',
      gateway: {
        id: hostbillGateway,
        name: getGatewayName(method),
        type: getGatewayType(method)
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    };

    // Set payment URL and redirect requirements based on method
    switch (method.toLowerCase()) {
      case 'card':
      case 'stripe':
        result.redirectRequired = true;
        if (!gatewayId) {
          throw new Error(`Gateway ID not found for payment method: ${method}`);
        }
        const returnUrlWithMethod = `${middlewareUrl}/api/payments/return?status=success&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}`;
        const cancelUrlWithMethod = `${middlewareUrl}/api/payments/return?status=cancelled&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}`;
        result.paymentUrl = `${hostbillUrl}/index.php?/cart/checkout/?invoiceid=${invoiceId}&paymentmethod=${gatewayId}&return=${encodeURIComponent(returnUrlWithMethod)}&cancel=${encodeURIComponent(cancelUrlWithMethod)}`;
        break;

      case 'paypal':
        result.redirectRequired = true;
        if (!gatewayId) {
          throw new Error(`Gateway ID not found for payment method: ${method}`);
        }
        const paypalReturnUrl = `${middlewareUrl}/api/payments/return?status=success&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}`;
        const paypalCancelUrl = `${middlewareUrl}/api/payments/return?status=cancelled&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}`;
        result.paymentUrl = `${hostbillUrl}/cart.php?a=checkout&invoiceid=${invoiceId}&paymentmethod=${gatewayId}&return=${encodeURIComponent(paypalReturnUrl)}&cancel=${encodeURIComponent(paypalCancelUrl)}`;
        break;

      case 'payu':
        result.redirectRequired = true;
        // Use dynamic gateway ID from mapping (PayU = 10)
        if (!gatewayId) {
          throw new Error(`Gateway ID not found for payment method: ${method}`);
        }

        // Use middleware return URLs for PayU with detailed parameters
        const payuReturnUrl = `${middlewareUrl}/api/payments/return?status=success&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}${finalAmountParams}${billingParams}${osParams}${testFlowParam}${returnUrlParam}`;
        const payuCancelUrl = `${middlewareUrl}/api/payments/return?status=cancelled&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}${finalAmountParams}${billingParams}${osParams}${testFlowParam}${returnUrlParam}`;
        result.paymentUrl = `${hostbillUrl}/index.php?/cart/checkout/?invoiceid=${invoiceId}&paymentmethod=${gatewayId}&return=${encodeURIComponent(payuReturnUrl)}&cancel=${encodeURIComponent(payuCancelUrl)}`;
        break;

      case 'comgate_external':
      case 'comgate_advanced':
        // External Comgate and Comgate Advanced are handled separately above, this should not be reached
        logger.warn(`⚠️ ${method} reached switch section - should be handled above`);
        throw new Error(`${method} should be handled separately above`);
        break;

      case 'banktransfer':
      case 'bank':
        result.redirectRequired = false;
        result.instructions = {
          method: 'Bankovní převod',
          amount: `${amount} ${currency}`,
          accountNumber: '123456789/0100',
          bankName: 'Komerční banka',
          variableSymbol: invoiceId,
          specificSymbol: orderId.replace(/[^0-9]/g, '').slice(-10),
          message: `Platba za objednávku ${orderId}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('cs-CZ')
        };
        break;

      case 'crypto':
      case 'bitcoin':
        result.redirectRequired = true;
        const cryptoReturnUrl = `${middlewareUrl}/api/payments/return?status=success&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}`;
        const cryptoCancelUrl = `${middlewareUrl}/api/payments/return?status=cancelled&orderId=${orderId}&invoiceId=${invoiceId}&paymentMethod=${method}`;
        result.paymentUrl = `${hostbillUrl}/cart.php?a=checkout&invoiceid=${invoiceId}&paymentmethod=bitcoin&return=${encodeURIComponent(cryptoReturnUrl)}&cancel=${encodeURIComponent(cryptoCancelUrl)}`;
        break;

      default:
        result.redirectRequired = true;
        result.paymentUrl = `${hostbillUrl}/index.php?/cart/checkout/?invoiceid=${invoiceId}&paymentmethod=${hostbillGateway}&return=${encodeURIComponent(defaultReturnUrl)}&cancel=${encodeURIComponent(defaultCancelUrl)}`;
    }

    logger.info('✅ Payment initialized with HostBill', {
      paymentId,
      method,
      redirectRequired: result.redirectRequired,
      hasPaymentUrl: !!result.paymentUrl,
      hasInstructions: !!result.instructions
    });

    return result;

  } catch (error) {
    logger.error('❌ HostBill payment initialization failed', {
      orderId,
      invoiceId,
      method,
      error: error.message
    });

    return {
      success: false,
      error: `HostBill payment initialization failed: ${error.message}`,
      orderId,
      invoiceId,
      method
    };
  }
}

/**
 * Get gateway display name
 * @param {string} method - Payment method
 * @returns {string} Gateway name
 */
function getGatewayName(method) {
  const names = {
    card: 'Credit Card',
    paypal: 'PayPal',
    banktransfer: 'Bank Transfer',
    crypto: 'Cryptocurrency',
    payu: 'PayU',
    comgate: 'Comgate',
    comgate_advanced: 'Comgate Advanced',
    comgate_external: 'Comgate External'
  };
  return names[method] || method;
}

/**
 * Get gateway type
 * @param {string} method - Payment method
 * @returns {string} Gateway type
 */
function getGatewayType(method) {
  const types = {
    card: 'redirect',
    paypal: 'redirect',
    banktransfer: 'manual',
    crypto: 'redirect',
    payu: 'redirect',
    comgate: 'redirect',
    comgate_advanced: 'external',
    comgate_external: 'external'
  };
  return types[method] || 'redirect';
}
