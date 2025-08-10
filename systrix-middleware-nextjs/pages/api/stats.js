/**
 * Stats endpoint for Systrix Middleware NextJS
 * Returns middleware statistics and metrics
 */

const HostBillClient = require('../../lib/hostbill-client');
const productMapper = require('../../lib/product-mapper');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const hostbillClient = new HostBillClient();
    
    // Get product mapping stats
    const mappingStats = productMapper.getStats();

    // Check HostBill connectivity
    let hostbillConnected = false;
    let hostbillError = null;
    
    try {
      const connectionTest = await hostbillClient.testConnection();
      hostbillConnected = connectionTest.success;
      if (!connectionTest.success) {
        hostbillError = connectionTest.message;
      }
    } catch (error) {
      hostbillConnected = false;
      hostbillError = error.message;
    }

    const stats = {
      success: true,
      middleware: {
        name: 'Systrix Middleware NextJS',
        version: '2.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3005
      },
      hostbill: {
        connected: hostbillConnected,
        url: process.env.HOSTBILL_BASE_URL,
        error: hostbillError
      },
      productMapping: {
        totalMappings: mappingStats.totalMappings,
        cloudVpsProducts: mappingStats.cloudVpsProducts,
        hostbillProducts: mappingStats.hostbillProducts,
        mappings: mappingStats.mappings
      },
      configuration: {
        logLevel: process.env.LOG_LEVEL || 'info',
        defaultCurrency: process.env.DEFAULT_CURRENCY || 'CZK',
        defaultPaymentMethod: process.env.DEFAULT_PAYMENT_METHOD || 'banktransfer',
        dashboardEnabled: process.env.DASHBOARD_ENABLED === 'true'
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
