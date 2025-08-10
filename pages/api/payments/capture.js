// Payment capture API endpoint
// Handles payment capture requests from payment gateways

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invoiceId, paymentId, amount, method } = req.body;

    console.log('💰 Payment capture request:', {
      invoiceId,
      paymentId,
      amount,
      method
    });

    // Forward to middleware for processing
    const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
    
    const response = await fetch(`${middlewareUrl}/api/invoices/capture-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId,
        paymentId,
        amount,
        method
      })
    });

    if (!response.ok) {
      throw new Error(`Middleware responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Payment capture result:', result);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Payment capture error:', error);
    res.status(500).json({ 
      error: 'Payment capture failed',
      message: error.message 
    });
  }
}
