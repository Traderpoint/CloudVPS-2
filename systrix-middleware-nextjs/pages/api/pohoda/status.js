/**
 * Pohoda Status API
 * GET /api/pohoda/status
 * Returns Pohoda service configuration and status
 */

const PohodaDirectClient = require('../../../lib/pohoda-direct-client');
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Check middleware mode
    const middlewareMode = process.env.POHODA_MIDDLEWARE_MODE?.toUpperCase();

    logger.info('Pohoda status check requested', {
      middlewareMode: middlewareMode || 'NOT_SET'
    });

    const pohodaClient = new PohodaDirectClient();
    const status = pohodaClient.getStatus();

    // Add middleware mode information
    status.middlewareMode = middlewareMode || 'NOT_SET';
    status.middlewareEnabled = middlewareMode === 'YES';
    status.recommendation = middlewareMode !== 'YES' ?
      'Use HostBill Pohoda module for better performance' :
      'Middleware mode active';

    // Additional environment check for direct mServer connection
    const envCheck = {
      POHODA_MIDDLEWARE_MODE: middlewareMode || 'NOT_SET',
      POHODA_MSERVER_URL: !!process.env.POHODA_MSERVER_URL,
      POHODA_DATA_FILE: !!process.env.POHODA_DATA_FILE,
      POHODA_USERNAME: !!process.env.POHODA_USERNAME,
      POHODA_PASSWORD: !!process.env.POHODA_PASSWORD,
      POHODA_SYNC_ENABLED: process.env.POHODA_SYNC_ENABLED === 'true'
    };

    const configurationComplete = Object.values(envCheck).every(Boolean);

    logger.info('Pohoda status check completed', {
      configured: status.configured,
      enabled: status.enabled,
      configurationComplete
    });

    return res.status(200).json({
      success: true,
      pohoda: {
        ...status,
        configurationComplete,
        environmentVariables: envCheck
      },
      endpoints: {
        syncInvoice: '/api/pohoda/sync-invoice',
        syncOrder: '/api/pohoda/sync-order',
        status: '/api/pohoda/status'
      },
      middleware: {
        name: 'systrix-middleware-nextjs',
        version: '1.0.0',
        port: process.env.PORT || 3005
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Pohoda status check failed', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: `Pohoda status check failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}
