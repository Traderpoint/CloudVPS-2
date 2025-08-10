/**
 * Health Check API
 * GET /api/health
 * Returns application health status
 */

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const healthData = {
      success: true,
      status: 'healthy',
      service: 'CloudVPS Frontend',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      middleware: {
        url: process.env.MIDDLEWARE_URL || 'http://localhost:3005',
        configured: !!(process.env.MIDDLEWARE_URL)
      },
      hostbill: {
        url: process.env.HOSTBILL_URL || 'https://vps.kabel1it.cz',
        configured: !!(process.env.HOSTBILL_API_URL && process.env.HOSTBILL_API_ID && process.env.HOSTBILL_API_KEY)
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
