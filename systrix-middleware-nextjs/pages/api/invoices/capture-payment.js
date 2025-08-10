/**
 * HostBill API: Capture Payment (Add Payment to Invoice)
 * POST /api/invoices/capture-payment
 * 
 * This endpoint adds a payment to an invoice, effectively marking it as paid
 * and moving the order lifecycle from "Capture Payment" to "Provision"
 */

const logger = require('../../../utils/logger');
const HostBillClient = require('../../../lib/hostbill-client');

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const {
    invoice_id,
    amount,
    module = 'BankTransfer', // Default payment module
    trans_id,
    note = 'Payment captured via API'
  } = req.body;

  // Validate required parameters
  if (!invoice_id) {
    return res.status(400).json({
      success: false,
      error: 'Invoice ID is required'
    });
  }

  if (!amount) {
    return res.status(400).json({
      success: false,
      error: 'Payment amount is required'
    });
  }

  logger.info('Capturing payment for invoice', {
    service: 'capture-payment-api',
    invoice_id,
    amount,
    module,
    trans_id,
    method: req.method,
    userAgent: req.headers['user-agent']
  });

  try {
    const hostbillClient = new HostBillClient();

    // Generate unique transaction ID if not provided
    const transactionId = trans_id || `CAPTURE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Step 1: Get invoice details first to validate
    let invoiceDetails = null;
    try {
      const invoicesResult = await hostbillClient.makeApiCall({
        call: 'getInvoices',
        'filter[id]': invoice_id
      });

      if (invoicesResult && !invoicesResult.error && invoicesResult.invoices) {
        const invoice = invoicesResult.invoices.find(inv => inv.id == invoice_id);
        if (invoice) {
          invoiceDetails = invoice;
          logger.info('Invoice found for capture', {
            service: 'capture-payment-api',
            invoice_id,
            current_status: invoice.status,
            total_amount: invoice.total,
            grandtotal: invoice.grandtotal
          });
        } else {
          throw new Error(`Invoice ${invoice_id} not found`);
        }
      } else {
        throw new Error(`Failed to retrieve invoice ${invoice_id}`);
      }
    } catch (invoiceError) {
      logger.error('Failed to retrieve invoice for capture', {
        service: 'capture-payment-api',
        invoice_id,
        error: invoiceError.message
      });
      
      return res.status(404).json({
        success: false,
        error: `Invoice ${invoice_id} not found or inaccessible`,
        details: invoiceError.message
      });
    }

    // Step 2: Add payment to invoice (this is the "Capture" action)
    logger.info('Adding payment to invoice (capturing)', {
      service: 'capture-payment-api',
      invoice_id,
      amount,
      module,
      transactionId
    });

    const captureResult = await hostbillClient.makeApiCall({
      call: 'addInvoicePayment',
      id: invoice_id,                    // Use 'id' instead of 'invoice_id'
      amount: parseFloat(amount).toFixed(2),
      paymentmodule: module,             // Use 'paymentmodule' instead of 'module'
      fee: 0,
      transnumber: transactionId,        // Use 'transnumber' instead of 'trans_id'
      notes: note,
      send_email: 1  // Send email notification when payment is added
    });

    if (captureResult && !captureResult.error) {
      logger.info('Payment captured successfully', {
        service: 'capture-payment-api',
        invoice_id,
        amount,
        transactionId,
        result: captureResult
      });

      // Step 3: Get updated invoice status
      let updatedInvoice = null;
      try {
        const updatedResult = await hostbillClient.makeApiCall({
          call: 'getInvoices',
          'filter[id]': invoice_id
        });

        if (updatedResult && !updatedResult.error && updatedResult.invoices) {
          updatedInvoice = updatedResult.invoices.find(inv => inv.id == invoice_id);
        }
      } catch (updateError) {
        logger.warn('Could not retrieve updated invoice status', {
          service: 'capture-payment-api',
          invoice_id,
          error: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: `Payment of ${amount} successfully captured for invoice ${invoice_id}`,
        data: {
          invoice_id: invoice_id,
          amount: parseFloat(amount),
          transaction_id: transactionId,
          payment_module: module,
          note: note,
          previous_status: invoiceDetails?.status,
          current_status: updatedInvoice?.status || 'Unknown',
          capture_result: captureResult,
          captured_at: new Date().toISOString()
        }
      });

    } else {
      const errorMessage = captureResult?.error || 'Unknown error occurred during payment capture';
      
      logger.error('Failed to capture payment', {
        service: 'capture-payment-api',
        invoice_id,
        amount,
        transactionId,
        error: errorMessage,
        result: captureResult
      });

      return res.status(400).json({
        success: false,
        error: 'Failed to capture payment',
        details: errorMessage,
        hostbill_result: captureResult
      });
    }

  } catch (error) {
    logger.error('Capture payment API error', {
      service: 'capture-payment-api',
      invoice_id,
      amount,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error during payment capture',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
