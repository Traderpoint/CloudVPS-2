// Affiliate Products Test API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL;

  if (!middlewareUrl) {
    return res.status(500).json({
      success: false,
      error: 'MIDDLEWARE_URL not configured in environment variables'
    });
  }

  try {
    console.log('🔍 Fetching products from middleware...');

    const response = await fetch(`${middlewareUrl}/api/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: result.error || 'Failed to fetch products',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Products fetched successfully');

    return res.status(200).json({
      success: true,
      products: result.products || result.data || [],
      source: 'middleware',
      middleware_url: middlewareUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Products test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
