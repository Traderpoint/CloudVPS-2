// API endpoint to get all products via middleware
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('🔍 Fetching all products via middleware...');

    const middlewareUrl = process.env.MIDDLEWARE_URL;

    if (!middlewareUrl) {
      return res.status(500).json({
        success: false,
        error: 'MIDDLEWARE_URL not configured in environment variables',
        note: 'Please set MIDDLEWARE_URL in .env.local file'
      });
    }
    const response = await fetch(`${middlewareUrl}/api/products/all`);
    
    if (!response.ok) {
      throw new Error(`Middleware responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Successfully fetched ${data.totalProducts} products via middleware`);
      res.status(200).json(data);
    } else {
      console.error('❌ Middleware returned error:', data.error);
      res.status(500).json({
        success: false,
        error: data.error || 'Failed to fetch products from middleware'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching all products via middleware:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
