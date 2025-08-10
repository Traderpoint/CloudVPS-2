/**
 * Mark Invoice as Paid API
 * POST /api/payments/mark-paid
 * Marks an invoice as PAID directly via middleware
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

  try {
    const {
      invoiceId,
      orderId,
      amount,
      currency = 'CZK',
      paymentMethod = 'Manual Payment',
      transactionId,
      notes
    } = req.body;

    if (!invoiceId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: invoiceId and amount'
      });
    }

    console.log('✅ Marking invoice as PAID via middleware:', {
      invoiceId,
      orderId,
      amount,
      currency,
      paymentMethod,
      transactionId,
      middlewareUrl
    });

    // Call middleware to mark invoice as paid
    const response = await fetch(`${middlewareUrl}/api/invoices/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId,
        orderId,
        amount,
        currency,
        paymentMethod,
        transactionId: transactionId || `MANUAL-${Date.now()}`,
        notes: notes || `Invoice marked as PAID manually. Amount: ${amount} ${currency}`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Middleware error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Invoice marked as PAID successfully via middleware:', result);

      res.json({
        success: true,
        message: 'Invoice marked as PAID successfully',
        invoiceId,
        orderId,
        amount,
        currency,
        paymentMethod,
        transactionId: result.transactionId || transactionId,
        invoiceStatus: result.invoiceStatus,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(result.error || 'Failed to mark invoice as paid');
    }

  } catch (error) {
    console.error('❌ Error marking invoice as paid:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to mark invoice as paid',
      details: error.message,
      middleware_url: middlewareUrl,
      timestamp: new Date().toISOString()
    });
  }
}
