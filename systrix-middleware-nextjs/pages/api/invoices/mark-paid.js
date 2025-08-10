/**
 * Mark Invoice as Paid API
 * Marks invoice as paid in HostBill after successful payment
 *
 * According to HostBill API documentation (https://api2.hostbillapp.com/):
 * - The proper way to mark invoice as paid is using addInvoicePayment API call
 * - HostBill automatically updates invoice status to 'Paid' when payment is added
 * - Alternative method is setInvoiceStatus for direct status change
 */

const HostBillClient = require('../../../lib/hostbill-client.js');
const PohodaDirectClient = require('../../../lib/pohoda-direct-client');

/**
 * Synchronize payment to Pohoda system (direct integration)
 * @param {Object} paymentData - Payment data to sync
 * @param {Object} hostbillClient - HostBill client instance
 * @returns {Promise<Object>} Sync result
 */
async function syncPaymentToPohoda(paymentData, hostbillClient) {
  // Check if middleware should handle Pohoda sync
  const middlewareMode = process.env.POHODA_MIDDLEWARE_MODE?.toUpperCase();

  if (middlewareMode !== 'YES') {
    console.log('ℹ️ Pohoda Sync: Middleware mode disabled - HostBill module handles sync', {
      invoiceId: paymentData.invoiceId,
      middlewareMode: middlewareMode || 'NOT_SET',
      recommendation: 'Use HostBill Pohoda module for better performance'
    });

    return {
      success: true,
      message: 'Pohoda sync handled by HostBill module (middleware mode disabled)',
      middlewareMode: 'disabled',
      configured: true
    };
  }

  try {
    console.log('🔄 Pohoda Sync: Starting direct payment synchronization via Middleware...', {
      invoiceId: paymentData.invoiceId,
      transactionId: paymentData.transactionId,
      amount: paymentData.amount,
      middlewareMode: 'enabled'
    });

    // Initialize Pohoda direct client
    const pohodaClient = new PohodaDirectClient();

    if (!pohodaClient.isConfigured()) {
      console.log('⚠️ Pohoda Sync: Not configured - skipping sync', {
        invoiceId: paymentData.invoiceId,
        status: pohodaClient.getStatus()
      });
      return {
        success: true,
        message: 'Pohoda sync not configured - skipped',
        configured: false
      };
    }

    // Get invoice details from HostBill
    console.log('🔍 Fetching invoice details from HostBill for Pohoda sync...');
    const invoiceResult = await hostbillClient.getInvoice(paymentData.invoiceId);

    if (!invoiceResult.success) {
      throw new Error(`Failed to fetch invoice details: ${invoiceResult.error}`);
    }

    const invoiceData = invoiceResult.invoice;

    console.log('✅ Invoice details retrieved for Pohoda sync', {
      invoiceId: paymentData.invoiceId,
      customerName: `${invoiceData.firstname} ${invoiceData.lastname}`,
      company: invoiceData.companyname,
      total: invoiceData.total,
      itemsCount: invoiceData.items?.length || 0
    });

    // Prepare payment data for Pohoda
    const pohodaPaymentData = {
      transactionId: paymentData.transactionId,
      method: paymentData.paymentMethod || 'unknown',
      amount: paymentData.amount,
      currency: paymentData.currency || 'CZK',
      date: paymentData.paymentDate || new Date(),
      notes: paymentData.notes || `CloudVPS payment ${paymentData.transactionId}`
    };

    // Sync to Pohoda using direct mServer client
    const syncResult = await pohodaClient.createInvoice(invoiceData, pohodaPaymentData);

    if (syncResult.success) {
      console.log('✅ Pohoda Sync: Invoice synchronized successfully via mServer', {
        invoiceId: paymentData.invoiceId,
        transactionId: paymentData.transactionId,
        pohodaInvoiceId: syncResult.pohodaInvoiceId
      });
      return {
        success: true,
        pohodaInvoiceId: syncResult.pohodaInvoiceId,
        message: syncResult.message,
        mServerResponse: syncResult.mServerResponse
      };
    } else {
      console.warn('⚠️ Pohoda Sync: mServer sync failed', {
        invoiceId: paymentData.invoiceId,
        error: syncResult.error
      });
      return {
        success: false,
        error: syncResult.error
      };
    }

  } catch (error) {
    console.error('❌ Pohoda Sync: Exception during direct sync', {
      invoiceId: paymentData.invoiceId,
      error: error.message
    });
    return {
      success: false,
      error: error.message
    };
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      invoiceId,
      transactionId,
      paymentMethod,
      amount,
      currency = 'CZK',
      paymentDate,
      notes,
      useDirectStatusUpdate = false  // Option to use setInvoiceStatus instead of addInvoicePayment
    } = req.body;

    // Validate required fields
    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: invoiceId'
      });
    }

    console.log('Marking invoice as paid according to HostBill API documentation', {
      invoiceId,
      transactionId,
      paymentMethod,
      amount,
      currency,
      useDirectStatusUpdate
    });

    const hostbillClient = new HostBillClient();

    // Method selection based on HostBill API documentation
    if (useDirectStatusUpdate) {
      // Method 2: Direct status update using setInvoiceStatus
      console.log('Using direct status update method (setInvoiceStatus)');

      try {
        const statusResult = await hostbillClient.updateInvoiceStatus(invoiceId, 'Paid');

        if (statusResult.success) {
          console.log('Invoice marked as PAID using setInvoiceStatus', {
            invoiceId,
            result: statusResult.result
          });

          return res.status(200).json({
            success: true,
            method: 'setInvoiceStatus',
            message: 'Invoice marked as paid using direct status update',
            invoiceId,
            result: statusResult.result
          });
        } else {
          throw new Error(`setInvoiceStatus failed: ${JSON.stringify(statusResult.error)}`);
        }
      } catch (error) {
        console.error('Direct status update failed', {
          invoiceId,
          error: error.message
        });

        return res.status(500).json({
          success: false,
          error: `Failed to update invoice status: ${error.message}`,
          method: 'setInvoiceStatus'
        });
      }
    }

    // Method 1: Add payment using addInvoicePayment (recommended by HostBill API docs)
    console.log('Using payment addition method (addInvoicePayment) - recommended by HostBill API');

    let paymentAmount = parseFloat(amount) || 0;

    // If no amount provided, get it from HostBill
    if (!paymentAmount || paymentAmount <= 0) {
      console.log('No amount provided, fetching invoice details from HostBill', { invoiceId });

      try {
        // Use getInvoices API call to get invoice amount
        const invoiceResult = await hostbillClient.makeApiCall({
          call: 'getInvoices',
          'filter[id]': invoiceId
        });

        if (invoiceResult && !invoiceResult.error && invoiceResult.invoices) {
          const invoice = invoiceResult.invoices.find(inv => inv.id == invoiceId);
          if (invoice) {
            paymentAmount = parseFloat(invoice.grandtotal || invoice.total || invoice.subtotal2 || 0);
            console.log('Retrieved invoice amount from HostBill', {
              invoiceId,
              amount: paymentAmount,
              grandtotal: invoice.grandtotal,
              total: invoice.total,
              subtotal2: invoice.subtotal2
            });
          } else {
            throw new Error(`Invoice ${invoiceId} not found in HostBill`);
          }
        } else {
          throw new Error(`Failed to fetch invoice ${invoiceId}: ${JSON.stringify(invoiceResult.error)}`);
        }
      } catch (fetchError) {
        console.error('Failed to fetch invoice amount from HostBill', {
          invoiceId,
          error: fetchError.message
        });

        return res.status(400).json({
          success: false,
          error: `Could not determine invoice amount: ${fetchError.message}`,
          invoiceId
        });
      }
    }

    // Validate that we have a real transaction ID
    if (!transactionId) {
      console.error('❌ No transaction ID provided - cannot mark invoice as paid without real transaction ID');
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required for marking invoice as paid',
        invoiceId
      });
    }

    // Prepare payment data according to HostBill API documentation
    const paymentData = {
      invoice_id: invoiceId,
      amount: paymentAmount,
      currency: currency,
      date: paymentDate || new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      method: paymentMethod || 'comgate',
      transaction_id: transactionId, // Only use real transaction ID
      notes: notes || `Payment processed via ${paymentMethod || 'payment gateway'} with transaction ${transactionId} - ${new Date().toISOString()}`
    };

    console.log('Adding payment to invoice according to HostBill API documentation', paymentData);

    const paymentResult = await hostbillClient.addInvoicePayment(paymentData);

    if (paymentResult.success) {
      console.log('Payment added successfully - HostBill automatically marked invoice as PAID', {
        invoiceId,
        transactionId,
        paymentId: paymentResult.payment_id,
        amount: paymentAmount,
        currency
      });

      // Step 3: Automatic Pohoda synchronization after successful payment
      console.log('🔄 Step 3: Starting automatic Pohoda payment synchronization...');

      let pohodaSyncResult = { success: false, error: 'Not attempted' };
      try {
        pohodaSyncResult = await syncPaymentToPohoda({
          invoiceId,
          orderId: invoiceId, // Use invoiceId as orderId fallback
          transactionId,
          paymentMethod: paymentMethod || 'comgate',
          amount: paymentAmount,
          currency,
          paymentDate: paymentDate || new Date().toISOString().split('T')[0],
          notes: notes || `Payment processed via ${paymentMethod || 'payment gateway'} with transaction ${transactionId}`
        }, hostbillClient);

        if (pohodaSyncResult.success) {
          console.log('✅ Step 3 COMPLETE: Invoice synchronized to Pohoda successfully', {
            invoiceId,
            transactionId,
            pohodaInvoiceId: pohodaSyncResult.pohodaInvoiceId
          });
        } else {
          console.warn('⚠️ Step 3 WARNING: Pohoda sync failed but payment was processed', {
            invoiceId,
            transactionId,
            pohodaError: pohodaSyncResult.error
          });
        }
      } catch (pohodaError) {
        console.error('❌ Step 3 ERROR: Pohoda sync failed with exception', {
          invoiceId,
          transactionId,
          error: pohodaError.message
        });
        pohodaSyncResult = { success: false, error: pohodaError.message };
        // Don't fail the entire payment process if Pohoda sync fails
      }

      return res.status(200).json({
        success: true,
        method: 'addInvoicePayment',
        message: 'Payment added successfully - invoice automatically marked as paid by HostBill',
        invoiceId,
        transactionId,
        paymentId: paymentResult.payment_id,
        payment: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          method: paymentData.method,
          transactionId: paymentData.transaction_id,
          date: paymentData.date
        },
        result: paymentResult.result,
        pohodaSync: pohodaSyncResult // Include Pohoda sync result
      });
    } else {
      console.error('Failed to add payment to invoice', {
        invoiceId,
        error: paymentResult.error
      });

      return res.status(400).json({
        success: false,
        method: 'addInvoicePayment',
        error: `Failed to add payment: ${JSON.stringify(paymentResult.error)}`,
        invoiceId
      });
    }

  } catch (error) {
    console.error('Mark invoice as paid error', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
