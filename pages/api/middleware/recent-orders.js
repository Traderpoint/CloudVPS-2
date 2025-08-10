/**
 * CloudVPS API endpoint to get recent orders via middleware
 * Proxy endpoint to avoid CORS issues
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
    const limit = req.query.limit || 10;
    
    console.log('🔍 CloudVPS → Middleware: Getting recent orders');
    console.log('🔗 Middleware URL:', middlewareUrl);
    console.log('📊 Limit:', limit);

    const response = await fetch(`${middlewareUrl}/api/orders/recent?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Middleware responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ CloudVPS → Middleware: Orders received');
    console.log('📦 Orders count:', data.orders?.length || 0);

    res.json(data);

  } catch (error) {
    console.error('❌ CloudVPS → Middleware: Failed to get recent orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent orders from middleware',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
