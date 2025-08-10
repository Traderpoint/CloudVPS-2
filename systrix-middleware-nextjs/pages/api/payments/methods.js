// Payment methods API with real HostBill integration and Comgate
const HostBillClient = require('../../../lib/hostbill-client');
const PaymentProcessor = require('../../../lib/payment-processor');
const ComgateProcessor = require('../../../lib/comgate-processor');
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    logger.info('Payment methods API called');

    const hostbillClient = new HostBillClient();

    // Try to get payment methods from HostBill
    let result;
    try {
      const paymentResult = await hostbillClient.makeApiCall({
        call: 'getPaymentMethods'
      });

      logger.info('HostBill payment methods response', { paymentResult });

      // Check if we have gateways data
      if (paymentResult && paymentResult.gateways && paymentResult.gateways.length > 0) {
        result = {
          success: true,
          methods: paymentResult.gateways,
          total: paymentResult.gateways.length,
          enabled: paymentResult.gateways.filter(g => g.enabled).length
        };
      } else {
        // Use fallback if no gateways returned
        throw new Error('No payment gateways returned from HostBill');
      }
    } catch (error) {
      logger.warn('Failed to get payment methods from HostBill, using fallback', { error: error.message });

      // Fallback to default payment methods including Comgate
      result = {
        success: true,
        methods: [
          { id: 'card', name: 'Credit Card', enabled: true, type: 'redirect', method: 'card' },
          { id: 'paypal', name: 'PayPal', enabled: true, type: 'redirect', method: 'paypal' },
          { id: 'banktransfer', name: 'Bank Transfer', enabled: true, type: 'manual', method: 'banktransfer' },
          { id: 'crypto', name: 'Cryptocurrency', enabled: true, type: 'redirect', method: 'crypto' },
          { id: 'payu', name: 'PayU', enabled: true, type: 'redirect', method: 'payu' },
          { id: 'comgate', name: 'Comgate Payments', enabled: true, type: 'redirect', method: 'comgate' }
        ],
        total: 6,
        enabled: 6,
        fallback: true
      };
    }

    if (result.success) {
      logger.info('Payment methods fetched successfully', { 
        total: result.total,
        enabled: result.enabled
      });

      res.status(200).json({
        success: true,
        methods: result.methods,
        total: result.total,
        enabled: result.enabled,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.warn('Failed to fetch payment methods', { 
        error: result.error 
      });

      res.status(500).json({
        success: false,
        error: result.error,
        methods: [],
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Payment methods API error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: error.message,
      methods: [],
      timestamp: new Date().toISOString()
    });
  }
}
