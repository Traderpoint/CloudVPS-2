/**
 * Mark invoice as PAID using setInvoiceStatus
 * POST /api/mark-invoice-paid
 */

const HostBillClient = require('../../lib/hostbill-client');

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { invoiceId, status = 'Paid' } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing invoiceId'
      });
    }

    console.log('🔄 Marking invoice as PAID', {
      invoiceId,
      status,
      timestamp: new Date().toISOString()
    });

    const hostbillClient = new HostBillClient();

    // Step 1: Add payment record with Credit Balance method (only for Paid status)
    if (status === 'Paid') {
      try {
        const paymentData = {
          invoice_id: invoiceId,
          amount: 1, // Minimal amount to create payment record
          currency: 'CZK',
          date: new Date().toISOString().split('T')[0],
          method: '0', // Use ID "0" for Credit Balance/Manual payments
          transaction_id: `CREDIT-BALANCE-${Date.now()}`,
          notes: 'Invoice marked as PAID via Credit Balance'
        };

        console.log('💰 Adding Credit Balance payment record...', paymentData);

        const paymentResult = await hostbillClient.addInvoicePayment(paymentData);

        if (paymentResult.success) {
          console.log('✅ Credit Balance payment record added', {
            invoiceId,
            paymentId: paymentResult.payment_id
          });
        } else {
          console.log('⚠️ Payment record failed, continuing with status update...', paymentResult.error);
        }
      } catch (paymentError) {
        console.log('⚠️ Payment record error, continuing with status update...', paymentError.message);
      }
    }

    // Step 2: Use setInvoiceStatus to mark invoice as PAID
    const result = await hostbillClient.updateInvoiceStatus(invoiceId, status);

    if (result.success) {
      console.log('✅ Invoice marked as PAID successfully', {
        invoiceId,
        result: result.result
      });

      res.status(200).json({
        success: true,
        invoiceId,
        status,
        result: result.result,
        message: `Invoice #${invoiceId} marked as ${status}`,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Failed to mark invoice as PAID', {
        invoiceId,
        error: result.error
      });

      res.status(500).json({
        success: false,
        invoiceId,
        error: result.error,
        message: `Failed to mark invoice #${invoiceId} as ${status}`,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Error marking invoice as paid:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
