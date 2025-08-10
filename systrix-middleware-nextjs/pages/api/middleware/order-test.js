// Test endpoint for middleware order processing
// Used by test portal to verify middleware functionality

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orderData = req.body;
    
    console.log('🧪 CloudVPS → Middleware: Order test');
    console.log('📦 Order data:', JSON.stringify(orderData, null, 2));

    const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
    
    const response = await fetch(`${middlewareUrl}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Middleware responded with status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ CloudVPS → Middleware: Order test successful');
    console.log('📋 Result:', JSON.stringify(result, null, 2));
    
    res.json({
      success: true,
      message: 'Order test completed successfully',
      middlewareResponse: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ CloudVPS → Middleware: Order test failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Order test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
