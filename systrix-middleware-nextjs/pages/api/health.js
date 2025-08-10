// Real health check with HostBill connectivity test
const HostBillClient = require('../../lib/hostbill-client');
const logger = require('../../utils/logger');

export default async function handler(req, res) {
  try {
    // Test HostBill connectivity
    let hostbillStatus = 'unknown';
    let hostbillError = null;

    try {
      const hostbillClient = new HostBillClient();
      const connectionTest = await hostbillClient.testConnection();
      hostbillStatus = connectionTest.success ? 'connected' : 'disconnected';
      if (!connectionTest.success) {
        hostbillError = connectionTest.message;
      }
    } catch (error) {
      hostbillStatus = 'error';
      hostbillError = error.message;
      logger.error('HostBill health check failed', { error: error.message });
    }

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '2.0.0',
      port: process.env.PORT || 3005,
      environment: process.env.NODE_ENV || 'development',
      hostbill: {
        status: hostbillStatus,
        api_url: process.env.HOSTBILL_API_URL,
        error: hostbillError
      },
      services: {
        database: 'not_applicable',
        cache: 'not_applicable',
        external_apis: {
          hostbill: hostbillStatus
        }
      }
    };

    // Return 503 if HostBill is not accessible (optional - depends on requirements)
    const statusCode = hostbillStatus === 'connected' ? 200 : 200; // Keep 200 for now

    res.status(statusCode).json(healthData);

  } catch (error) {
    logger.error('Health check endpoint error', { error: error.message });

    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '2.0.0'
    });
  }
}
