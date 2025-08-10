// Test connection API with real HostBill integration
const HostBillClient = require('../../lib/hostbill-client');
const logger = require('../../utils/logger');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    logger.info('Test connection API called');

    const hostbillClient = new HostBillClient();
    const connectionTest = await hostbillClient.testConnection();

    if (connectionTest.connected) {
      logger.info('HostBill connection test successful');

      res.status(200).json({
        success: true,
        message: connectionTest.message,
        hostbill: {
          connected: true,
          api_url: process.env.HOSTBILL_API_URL,
          response_time: 'fast',
          affiliate_count: connectionTest.affiliateCount || 0
        },
        middleware: {
          status: 'operational',
          version: '2.0.0',
          port: process.env.PORT || 3005
        },
        timestamp: new Date().toISOString()
      });
    } else {
      logger.warn('HostBill connection test failed', {
        error: connectionTest.message
      });

      res.status(503).json({
        success: false,
        message: 'HostBill connection failed',
        error: connectionTest.message,
        hostbill: {
          connected: false,
          api_url: process.env.HOSTBILL_API_URL,
          error: connectionTest.message
        },
        middleware: {
          status: 'operational',
          version: '2.0.0',
          port: process.env.PORT || 3005
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Test connection API error', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
      hostbill: {
        connected: false,
        api_url: process.env.HOSTBILL_API_URL,
        error: error.message
      },
      middleware: {
        status: 'error',
        version: '2.0.0',
        port: process.env.PORT || 3005
      },
      timestamp: new Date().toISOString()
    });
  }
}
