/**
 * Middleware Payment Modules API
 * GET /api/middleware-payment-modules
 * Returns available payment modules from middleware with ComGate as primary
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

  try {
    console.log('🔍 Fetching payment modules from middleware...');

    // Query middleware for available payment modules
    const response = await fetch(`${middlewareUrl}/api/payment-modules`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Middleware responded with status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.modules) {
      console.log('✅ Payment modules retrieved from middleware:', result.modules.length);

      // Enhanced response with frontend-friendly data and ComGate prioritization
      const enhancedMethods = result.modules.map(module => ({
        id: module.method || module.id || module.name?.toLowerCase(),
        name: module.name,
        type: module.type || 'redirect',
        enabled: module.enabled !== false,
        requiresRedirect: module.type === 'redirect' || module.requiresRedirect,
        hostbillId: module.hostbillId || module.id,
        icon: getPaymentMethodIcon(module.method || module.name),
        description: getPaymentMethodDescription(module.method || module.name),
        processingTime: getPaymentMethodProcessingTime(module.method || module.name),
        fees: getPaymentMethodFees(module.method || module.name),
        minAmount: getPaymentMethodMinAmount(module.method || module.name),
        maxAmount: getPaymentMethodMaxAmount(module.method || module.name),
        supportedCurrencies: ['CZK', 'EUR', 'USD'],
        warning: module.warning || null,
        source: 'middleware'
      }));

      // Sort methods to put ComGate first
      const sortedMethods = enhancedMethods.sort((a, b) => {
        if (a.id === 'comgate' || a.name?.toLowerCase().includes('comgate')) return -1;
        if (b.id === 'comgate' || b.name?.toLowerCase().includes('comgate')) return 1;
        return 0;
      });

      res.status(200).json({
        success: true,
        message: 'Payment modules retrieved successfully from middleware',
        methods: sortedMethods,
        total: sortedMethods.length,
        enabled: sortedMethods.filter(m => m.enabled).length,
        middleware_url: middlewareUrl,
        source: 'middleware-payment-modules',
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Failed to get payment modules:', result);
      
      // Return fallback methods with ComGate as primary
      const fallbackMethods = getFallbackPaymentMethods();
      
      res.status(200).json({
        success: true,
        message: 'Payment methods retrieved (fallback)',
        methods: fallbackMethods,
        total: fallbackMethods.length,
        enabled: fallbackMethods.length,
        fallback: true,
        middleware_error: result.error,
        source: 'fallback',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error fetching payment modules:', error);
    
    // Return fallback methods on error
    const fallbackMethods = getFallbackPaymentMethods();
    
    res.status(200).json({
      success: true,
      message: 'Payment methods retrieved (fallback)',
      methods: fallbackMethods,
      total: fallbackMethods.length,
      enabled: fallbackMethods.length,
      fallback: true,
      error: error.message,
      source: 'fallback',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get payment method icon
 */
function getPaymentMethodIcon(method) {
  const methodLower = method?.toLowerCase() || '';
  const icons = {
    comgate: '🔷',
    card: '💳',
    paypal: '🅿️',
    banktransfer: '🏦',
    crypto: '₿',
    payu: '💰'
  };
  
  // Check for ComGate variations
  if (methodLower.includes('comgate')) return '🔷';
  
  return icons[methodLower] || '💰';
}

/**
 * Get payment method description
 */
function getPaymentMethodDescription(method) {
  const methodLower = method?.toLowerCase() || '';
  const descriptions = {
    comgate: 'Česká platební brána - karty, bankovní převody',
    card: 'Visa, Mastercard, American Express',
    paypal: 'PayPal účet nebo karta přes PayPal',
    banktransfer: 'Přímý bankovní převod',
    crypto: 'Bitcoin, Ethereum a další kryptoměny',
    payu: 'PayU platební brána'
  };
  
  if (methodLower.includes('comgate')) return descriptions.comgate;
  
  return descriptions[methodLower] || 'Platební metoda';
}

/**
 * Get payment method processing time
 */
function getPaymentMethodProcessingTime(method) {
  const methodLower = method?.toLowerCase() || '';
  const times = {
    comgate: 'Okamžitě',
    card: 'Okamžitě',
    paypal: 'Okamžitě',
    banktransfer: '1-2 pracovní dny',
    crypto: '10-60 minut',
    payu: 'Okamžitě'
  };
  
  if (methodLower.includes('comgate')) return times.comgate;
  
  return times[methodLower] || 'Okamžitě';
}

/**
 * Get payment method fees
 */
function getPaymentMethodFees(method) {
  const methodLower = method?.toLowerCase() || '';
  const fees = {
    comgate: { type: 'percentage', value: 1.9, fixed: 0 },
    card: { type: 'percentage', value: 2.9, fixed: 0 },
    paypal: { type: 'percentage', value: 3.4, fixed: 10 },
    banktransfer: { type: 'fixed', value: 0, fixed: 0 },
    crypto: { type: 'percentage', value: 1.0, fixed: 0 },
    payu: { type: 'percentage', value: 2.5, fixed: 0 }
  };
  
  if (methodLower.includes('comgate')) return fees.comgate;
  
  return fees[methodLower] || { type: 'percentage', value: 2.0, fixed: 0 };
}

/**
 * Get payment method minimum amount
 */
function getPaymentMethodMinAmount(method) {
  const methodLower = method?.toLowerCase() || '';
  const minAmounts = {
    comgate: 10,
    card: 50,
    paypal: 50,
    banktransfer: 100,
    crypto: 100,
    payu: 50
  };
  
  if (methodLower.includes('comgate')) return minAmounts.comgate;
  
  return minAmounts[methodLower] || 50;
}

/**
 * Get payment method maximum amount
 */
function getPaymentMethodMaxAmount(method) {
  const methodLower = method?.toLowerCase() || '';
  const maxAmounts = {
    comgate: 500000,
    card: 100000,
    paypal: 50000,
    banktransfer: 1000000,
    crypto: 500000,
    payu: 100000
  };
  
  if (methodLower.includes('comgate')) return maxAmounts.comgate;
  
  return maxAmounts[methodLower] || 999999;
}

/**
 * Get fallback payment methods when middleware is unavailable (ComGate first)
 */
function getFallbackPaymentMethods() {
  return [
    {
      id: 'comgate',
      name: 'ComGate',
      type: 'redirect',
      enabled: true,
      requiresRedirect: true,
      hostbillId: '1',
      icon: '🔷',
      description: 'Česká platební brána - karty, bankovní převody',
      processingTime: 'Okamžitě',
      fees: { type: 'percentage', value: 1.9, fixed: 0 },
      minAmount: 10,
      maxAmount: 500000,
      supportedCurrencies: ['CZK', 'EUR'],
      fallback: true,
      source: 'fallback'
    },
    {
      id: 'card',
      name: 'Platební karta',
      type: 'redirect',
      enabled: true,
      requiresRedirect: true,
      hostbillId: '2',
      icon: '💳',
      description: 'Visa, Mastercard, American Express',
      processingTime: 'Okamžitě',
      fees: { type: 'percentage', value: 2.9, fixed: 0 },
      minAmount: 50,
      maxAmount: 100000,
      supportedCurrencies: ['CZK', 'EUR', 'USD'],
      fallback: true,
      source: 'fallback'
    },
    {
      id: 'banktransfer',
      name: 'Bankovní převod',
      type: 'manual',
      enabled: true,
      requiresRedirect: false,
      hostbillId: '3',
      icon: '🏦',
      description: 'Převod z bankovního účtu',
      processingTime: '1-2 pracovní dny',
      fees: { type: 'fixed', value: 0, fixed: 0 },
      minAmount: 100,
      maxAmount: 1000000,
      supportedCurrencies: ['CZK', 'EUR'],
      fallback: true,
      source: 'fallback'
    }
  ];
}
