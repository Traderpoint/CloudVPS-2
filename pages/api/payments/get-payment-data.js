// API endpoint to get payment data by transaction ID
// This provides a direct way to fetch payment data instead of relying on URL parameters

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transactionId, invoiceId, orderId } = req.query;

  if (!transactionId && !invoiceId && !orderId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: transactionId, invoiceId, or orderId' 
    });
  }

  try {
    console.log('🔍 Getting payment data for:', { transactionId, invoiceId, orderId });

    // For now, return the data that would normally come from URL parameters
    // In a real implementation, this would query a database or payment service
    const paymentData = {
      transactionId: transactionId || `LOOKUP-${Date.now()}`,
      paymentId: transactionId || `LOOKUP-${Date.now()}`,
      invoiceId: invoiceId || 'UNKNOWN',
      orderId: orderId || 'UNKNOWN',
      amount: 2500, // This would come from database/payment service
      currency: 'CZK',
      paymentMethod: 'comgate',
      status: 'success',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Payment data retrieved:', paymentData);

    res.status(200).json({
      success: true,
      data: paymentData
    });

  } catch (error) {
    console.error('❌ Error getting payment data:', error);
    res.status(500).json({
      error: 'Failed to get payment data',
      message: error.message
    });
  }
}
