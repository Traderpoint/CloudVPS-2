/**
 * HostBill Invoice Set Status API
 * Simple endpoint to set invoice status using setInvoiceStatus
 */

const HostBillClient = require('../../../lib/hostbill-client');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { invoiceId, status = 'Paid', transactionId, notes } = req.body;

    // Validate required parameters
    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: invoiceId'
      });
    }

    console.log('🔄 Setting invoice status', {
      invoiceId,
      status,
      transactionId,
      notes
    });

    const hostbillClient = new HostBillClient();

    // Set invoice status using HostBill setInvoiceStatus API
    const statusResult = await hostbillClient.makeApiCall({
      call: 'setInvoiceStatus',
      id: invoiceId,
      status: status
    });

    if (statusResult && !statusResult.error) {
      console.log('✅ Invoice status set successfully', {
        invoiceId,
        status,
        result: statusResult
      });

      // Optional: Add transaction record if transactionId provided
      if (transactionId) {
        try {
          console.log('🔄 Adding transaction record...', { transactionId });
          
          const transactionResult = await hostbillClient.makeApiCall({
            call: 'addTransaction',
            invoice_id: invoiceId,
            transaction_id: transactionId,
            description: notes || `Payment via transaction ${transactionId}`,
            in: '1.00', // Minimal amount for record keeping
            gateway: 'manual'
          });

          if (transactionResult && !transactionResult.error) {
            console.log('✅ Transaction record added', { transactionId });
          } else {
            console.warn('⚠️ Transaction record failed (not critical)', transactionResult);
          }
        } catch (transactionError) {
          console.warn('⚠️ Transaction record error (not critical):', transactionError.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Invoice #${invoiceId} marked as ${status}`,
        invoiceId,
        status,
        transactionId,
        result: statusResult
      });

    } else {
      console.error('❌ HostBill setInvoiceStatus failed', {
        invoiceId,
        status,
        error: statusResult?.error || 'Unknown error'
      });

      return res.status(500).json({
        success: false,
        error: statusResult?.error || 'Failed to set invoice status',
        invoiceId,
        status
      });
    }

  } catch (error) {
    console.error('❌ Set invoice status error', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Internal server error while setting invoice status'
    });
  }
}
