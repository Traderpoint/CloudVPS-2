// Real middleware status with HostBill integration
const HostBillClient = require('../../lib/hostbill-client');
const productMapper = require('../../lib/product-mapper');
const logger = require('../../utils/logger');
const { displayQuickLinks } = require('../../lib/startup-info');

// Dashboard stats tracking
let dashboardStats = {
  requests: 0,
  errors: 0,
  startTime: Date.now(),
  lastActivity: new Date(),
  recentRequests: []
};

// Flag to show startup info only once
let startupInfoShown = false;

export default async function handler(req, res) {
  // Show startup info on first request
  if (!startupInfoShown) {
    console.log('\n' + '='.repeat(80));
    console.log('🎛️  SYSTRIX MIDDLEWARE NEXTJS - SERVER RUNNING');
    console.log('='.repeat(80));
    console.log('📊 MAIN SERVICES:');
    console.log(`  Dashboard:        http://localhost:${process.env.PORT || 3005}/`);
    console.log(`  CloudVPS App:     http://localhost:3000/`);
    console.log(`  Partners Portal:  http://localhost:3006/`);
    console.log('\n🔌 API ENDPOINTS:');
    console.log(`  Status:           http://localhost:${process.env.PORT || 3005}/api/status`);
    console.log(`  Products:         http://localhost:${process.env.PORT || 3005}/api/products`);
    console.log(`  Affiliates:       http://localhost:${process.env.PORT || 3005}/api/affiliates`);
    console.log(`  Payment Methods:  http://localhost:${process.env.PORT || 3005}/api/payments/methods`);
    console.log(`  Test Connection:  http://localhost:${process.env.PORT || 3005}/api/test-connection`);
    console.log('\n📈 MONITORING & STATS:');
    console.log(`  Statistics:       http://localhost:${process.env.PORT || 3005}/api/stats`);
    console.log(`  Logs:             http://localhost:${process.env.PORT || 3005}/api/logs`);
    console.log(`  Product Mapping:  http://localhost:${process.env.PORT || 3005}/api/product-mapping`);
    console.log('\n' + '='.repeat(80));
    console.log('✅ Server is ready and listening for requests!');
    console.log('💡 Tip: Open the Dashboard URL in your browser to get started');
    console.log('='.repeat(80) + '\n');
    startupInfoShown = true;
  }

  // Increment request counter
  dashboardStats.requests++;
  dashboardStats.lastActivity = new Date();

  // Store recent request
  dashboardStats.recentRequests.unshift({
    method: req.method,
    url: req.url,
    timestamp: new Date(),
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });

  // Keep only last 50 requests
  if (dashboardStats.recentRequests.length > 50) {
    dashboardStats.recentRequests = dashboardStats.recentRequests.slice(0, 50);
  }

  const uptime = Math.floor((Date.now() - dashboardStats.startTime) / 1000);

  try {
    // Test HostBill connectivity
    let hostbillConnected = false;
    let hostbillError = null;

    try {
      const hostbillClient = new HostBillClient();
      const connectionTest = await hostbillClient.testConnection();
      hostbillConnected = connectionTest.success;
      if (!connectionTest.success) {
        hostbillError = connectionTest.message;
      }
    } catch (error) {
      hostbillConnected = false;
      hostbillError = error.message;
      logger.error('HostBill connection test failed in status endpoint', { error: error.message });
    }

    // Get product mapping stats
    const mappingStats = productMapper.getStats();

    const status = {
      online: true,
      port: process.env.PORT || 3005,
      version: '2.0.0',
      uptime: uptime,
      environment: process.env.NODE_ENV || 'development'
    };

    const response = {
      success: true,
      server: {
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '2.0.0',
        port: process.env.PORT || 3005,
        environment: process.env.NODE_ENV || 'development'
      },
      hostbill: {
        connected: hostbillConnected,
        api_url: process.env.HOSTBILL_API_URL,
        error: hostbillError
      },
      product_mapping: mappingStats,
      configuration: {
        log_level: process.env.LOG_LEVEL || 'info',
        default_currency: process.env.DEFAULT_CURRENCY || 'CZK',
        default_payment_method: process.env.DEFAULT_PAYMENT_METHOD || 'banktransfer'
      },
      status,
      mapping: {
        totalMappings: mappingStats.totalMappings,
        cloudVpsProducts: mappingStats.cloudVpsProducts.map(id => ({
          id,
          name: `Product ${id}`
        })),
        hostbillProducts: mappingStats.hostbillProducts.map(id => ({
          id,
          name: `HostBill Product ${id}`
        })),
        mappings: mappingStats.mappings
      },
      uptime,
      hostbillConnected,
      middlewareUrl: process.env.MIDDLEWARE_URL || `http://localhost:${process.env.PORT || 3005}`,
      lastUpdate: new Date().toISOString(),
      dashboardStats,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    dashboardStats.errors++;
    logger.error('Status endpoint error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
