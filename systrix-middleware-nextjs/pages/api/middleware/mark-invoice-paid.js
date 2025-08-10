/**
 * CloudVPS API endpoint to mark invoice as paid via middleware
 * Proxy endpoint to avoid CORS issues
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
    
    console.log('💳 CloudVPS → Middleware: Marking invoice as paid');
    console.log('🔗 Middleware URL:', middlewareUrl);
    console.log('📋 Request data:', req.body);

    const response = await fetch(`${middlewareUrl}/api/invoices/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Middleware responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ CloudVPS → Middleware: Invoice payment processed');
    console.log('📦 Result:', data);

    res.json(data);

  } catch (error) {
    console.error('❌ CloudVPS → Middleware: Failed to mark invoice as paid:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark invoice as paid via middleware',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
