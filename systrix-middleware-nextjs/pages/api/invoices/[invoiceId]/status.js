/**
 * Invoice Status API Endpoint
 * GET /api/invoices/[invoiceId]/status
 *
 * Retrieves comprehensive invoice status information including:
 * - Invoice details from HostBill
 * - Order number lookup
 * - Payment verification
 * - Complete status summary
 */

const logger = require('../../../../utils/logger');
const HostBillClient = require('../../../../lib/hostbill-client');

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { invoiceId } = req.query;

  if (!invoiceId) {
    return res.status(400).json({
      success: false,
      error: 'Invoice ID is required'
    });
  }

  logger.info('Checking comprehensive invoice status', {
    service: 'invoice-status-api',
    invoiceId,
    method: req.method,
    userAgent: req.headers['user-agent']
  });

  try {
    const hostbillClient = new HostBillClient();

    let invoiceDetails = null;
    let orderNumber = null;
    let invoiceAmount = null;
    let invoiceStatus = null;
    let isPaid = false;
    let datePaid = null;
    let clientInfo = null;
    // Step 1: Try to get invoice details using getInvoices with filter
    try {
      const invoicesResult = await hostbillClient.makeApiCall({
        call: 'getInvoices',
        'filter[id]': invoiceId
      });

      if (invoicesResult && !invoicesResult.error && invoicesResult.invoices) {
        const invoice = invoicesResult.invoices.find(inv => inv.id == invoiceId);
        if (invoice) {
          invoiceDetails = invoice;
          // Use grandtotal (original amount) instead of total (remaining amount)
          invoiceAmount = invoice.grandtotal || invoice.subtotal2 || invoice.total;
          invoiceStatus = invoice.status;
          datePaid = invoice.datepaid;

          // Extract client information
          clientInfo = {
            firstName: invoice.firstname,
            lastName: invoice.lastname,
            companyName: invoice.companyname,
            clientId: invoice.client_id
          };

          // Determine if invoice is paid - ONLY use status field and datepaid
          // Do NOT use credit comparison as it can be misleading
          isPaid = invoiceStatus === 'Paid' ||
                  invoiceStatus === 'paid' ||
                  invoiceStatus === 'PAID' ||
                  (invoice.datepaid && invoice.datepaid !== '0000-00-00' && invoice.datepaid !== '' && invoice.datepaid !== '0000-00-00 00:00:00');

          logger.info('Invoice details retrieved successfully', {
            service: 'invoice-status-api',
            invoiceId,
            status: invoiceStatus,
            amount: invoiceAmount,
            isPaid
          });
        }
      }
    } catch (invoiceError) {
      logger.warn('Failed to get invoice details', {
        service: 'invoice-status-api',
        invoiceId,
        error: invoiceError.message
      });
    }

    // Step 2: Try to find order number by checking recent orders
    try {
      const possibleOrderIds = [];

      // Generate range of possible order IDs (last 50 orders from current range)
      for (let i = 180; i <= 250; i++) {
        possibleOrderIds.push(i.toString());
      }

      for (const orderId of possibleOrderIds) {
        try {
          const orderResult = await hostbillClient.makeApiCall({
            call: 'getOrderDetails',
            id: orderId
          });

          if (orderResult && !orderResult.error && orderResult.details) {
            if (orderResult.details.invoice_id == invoiceId) {
              orderNumber = orderResult.details.number;
              logger.info('Order number found', {
                service: 'invoice-status-api',
                invoiceId,
                orderId,
                orderNumber
              });
              break;
            }
          }
        } catch (orderError) {
          // Continue trying other order IDs
        }
      }
    } catch (orderLookupError) {
      logger.warn('Failed to lookup order number', {
        service: 'invoice-status-api',
        invoiceId,
        error: orderLookupError.message
      });
    }

    // Step 3: Prepare comprehensive response
    const statusResponse = {
      success: true,
      invoiceId,
      orderNumber: orderNumber || 'N/A',
      amount: invoiceAmount || 'Unknown',
      currency: 'CZK',
      status: invoiceStatus || 'Unknown',
      isPaid,
      datePaid: datePaid || null,
      clientInfo,
      verification: {
        timestamp: new Date().toISOString(),
        source: 'HostBill API',
        method: 'getInvoices with filter'
      },
      details: invoiceDetails
    };

    // Step 4: Create formatted summary message
    let summaryMessage = '';
    const displayAmount = invoiceAmount || 'N/A';
    if (isPaid) {
      summaryMessage = `✅ FAKTURA ID: ${invoiceId}, ORDER NUMBER: ${orderNumber || 'N/A'}, na částku ${displayAmount} CZK, byla úspěšně uhrazena a faktura úspěšně označena jako PAID.`;
    } else {
      summaryMessage = `⚠️ FAKTURA ID: ${invoiceId}, ORDER NUMBER: ${orderNumber || 'N/A'}, na částku ${displayAmount} CZK, je stále UNPAID nebo PENDING.`;
    }

    statusResponse.summary = summaryMessage;

    logger.info('Invoice status check completed', {
      service: 'invoice-status-api',
      invoiceId,
      orderNumber,
      status: invoiceStatus,
      isPaid,
      summary: summaryMessage
    });

    return res.status(200).json(statusResponse);

  } catch (error) {
    logger.error('Invoice status check failed', {
      service: 'invoice-status-api',
      invoiceId,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to check invoice status',
      details: error.message,
      invoiceId,
      fallbackMessage: `❌ Nepodařilo se ověřit stav faktury ID: ${invoiceId}. Zkontrolujte prosím HostBill admin panel.`
    });
  }
}
