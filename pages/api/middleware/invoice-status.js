// Invoice Status API - CloudVPS to Middleware
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL;
  const { invoiceId } = req.query;

  if (!middlewareUrl) {
    return res.status(500).json({
      success: false,
      error: 'MIDDLEWARE_URL not configured in environment variables'
    });
  }

  if (!invoiceId) {
    return res.status(400).json({
      success: false,
      error: 'invoiceId parameter is required'
    });
  }

  try {
    console.log('🔍 Checking invoice status through middleware...');
    console.log('📋 Invoice ID:', invoiceId);

    // Forward request to middleware
    const response = await fetch(`${middlewareUrl}/api/invoices/${invoiceId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Middleware invoice status check failed:', result);
      return res.status(response.status).json({
        success: false,
        error: result.error || 'Invoice status check failed',
        details: result,
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Invoice status retrieved successfully');

    return res.status(200).json({
      success: true,
      invoiceId: invoiceId,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      paid: result.paid,
      details: result,
      source: 'cloudvps_payment_flow_test',
      middleware_url: middlewareUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Invoice status check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
