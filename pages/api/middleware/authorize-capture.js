/**
 * CloudVPS API endpoint for complete payment workflow
 * Proxy endpoint to middleware authorize-capture API
 * 
 * Handles complete HostBill payment workflow:
 * 1. Authorize Payment (aktivace objednávky)
 * 2. Capture Payment (označení faktury jako PAID)
 * 3. Provision Ready (služby připraveny k poskytnutí)
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
    
    console.log('🔄 CloudVPS → Middleware: Processing complete payment workflow');
    console.log('🔗 Middleware URL:', middlewareUrl);
    console.log('📋 Request data:', req.body);

    // Forward request to middleware authorize-capture endpoint
    const response = await fetch(`${middlewareUrl}/api/payments/authorize-capture`, {
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
    
    console.log('✅ CloudVPS → Middleware: Payment workflow processed');
    console.log('📦 Result:', {
      success: data.success,
      workflow: data.workflow,
      orderId: data.orderId,
      invoiceId: data.invoiceId,
      amount: data.amount
    });

    res.json(data);

  } catch (error) {
    console.error('❌ CloudVPS → Middleware: Failed to process payment workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment workflow via middleware',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
