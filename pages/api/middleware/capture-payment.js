/**
 * Middleware API: Capture Payment
 * POST /api/middleware/capture-payment
 * 
 * Proxy endpoint for capturing payments via middleware
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Forward request to middleware
    const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
    const response = await fetch(`${middlewareUrl}/api/invoices/capture-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    // Return the response from middleware
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Middleware capture payment proxy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to communicate with middleware',
      details: error.message
    });
  }
}
