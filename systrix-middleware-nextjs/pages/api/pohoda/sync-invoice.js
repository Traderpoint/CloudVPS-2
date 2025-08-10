/**
 * Pohoda Invoice Sync API
 * POST /api/pohoda/sync-invoice
 * Synchronizes invoice to Pohoda accounting system
 * Standalone implementation for systrix-middleware-nextjs
 */

const PohodaDirectClient = require('../../../lib/pohoda-direct-client');
const HostBillClient = require('../../../lib/hostbill-client');
const logger = require('../../../utils/logger');

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

  // Check if middleware should handle Pohoda sync
  const middlewareMode = process.env.POHODA_MIDDLEWARE_MODE?.toUpperCase();

  if (middlewareMode !== 'YES') {
    logger.info('Pohoda sync endpoint called but middleware mode disabled', {
      middlewareMode: middlewareMode || 'NOT_SET',
      recommendation: 'Use HostBill Pohoda module instead'
    });

    return res.status(200).json({
      success: true,
      message: 'Pohoda sync handled by HostBill module (middleware mode disabled)',
      middlewareMode: 'disabled',
      configured: true,
      recommendation: 'Use HostBill Pohoda module for better performance'
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
      notes
    } = req.body;

    // Validate required fields
    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: invoiceId'
      });
    }

    logger.info('Pohoda invoice sync requested via Middleware', {
      invoiceId,
      transactionId,
      paymentMethod,
      amount,
      currency,
      middlewareMode: 'enabled'
    });

    // Initialize services
    const pohodaClient = new PohodaDirectClient();
    const hostbillClient = new HostBillClient();

    // Check if Pohoda client is configured
    if (!pohodaClient.isConfigured()) {
      logger.warn('Pohoda direct client not configured - skipping sync', {
        invoiceId,
        status: pohodaClient.getStatus()
      });

      return res.status(200).json({
        success: true,
        message: 'Pohoda sync not configured - skipped',
        configured: false,
        invoiceId,
        status: pohodaClient.getStatus()
      });
    }

    // Step 1: Get invoice details from HostBill
    logger.info('Fetching invoice details from HostBill', { invoiceId });

    const invoiceResult = await hostbillClient.getInvoice(invoiceId);
    
    if (!invoiceResult.success) {
      throw new Error(`Failed to fetch invoice ${invoiceId}: ${invoiceResult.error}`);
    }

    const invoiceData = invoiceResult.invoice;
    
    logger.info('Invoice details retrieved successfully', {
      invoiceId,
      customerName: `${invoiceData.firstname} ${invoiceData.lastname}`,
      company: invoiceData.companyname,
      total: invoiceData.total,
      itemsCount: invoiceData.items?.length || 0
    });

    // Step 2: Prepare payment data (if provided)
    const paymentData = transactionId ? {
      transactionId,
      method: paymentMethod || 'unknown',
      amount: amount || parseFloat(invoiceData.total || invoiceData.grandtotal || 0),
      currency: currency,
      date: paymentDate || new Date(),
      notes: notes || `CloudVPS payment ${transactionId}`
    } : null;

    // Step 3: Sync to Pohoda via direct mServer connection
    logger.info('Starting Pohoda synchronization via mServer', {
      invoiceId,
      hasPaymentData: !!paymentData,
      syncType: paymentData ? 'invoice_with_payment' : 'invoice_only'
    });

    const syncResult = await pohodaClient.createInvoice(invoiceData, paymentData);

    if (syncResult.success) {
      logger.info('Pohoda invoice sync completed successfully', {
        invoiceId,
        transactionId,
        pohodaInvoiceId: syncResult.pohodaInvoiceId
      });

      return res.status(200).json({
        success: true,
        message: 'Invoice synchronized to Pohoda successfully via mServer',
        invoiceId,
        transactionId,
        pohodaInvoiceId: syncResult.pohodaInvoiceId,
        paymentMethod: paymentData?.method,
        amount: paymentData?.amount,
        currency: paymentData?.currency,
        syncType: paymentData ? 'invoice_with_payment' : 'invoice_only',
        mServerResponse: syncResult.mServerResponse,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.warn('Pohoda invoice sync failed', {
        invoiceId,
        transactionId,
        error: syncResult.error
      });

      return res.status(400).json({
        success: false,
        error: syncResult.error,
        invoiceId,
        transactionId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Pohoda invoice sync API error', {
      invoiceId: req.body.invoiceId,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: `Pohoda sync failed: ${error.message}`,
      invoiceId: req.body.invoiceId,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get Pohoda service status
 * GET /api/pohoda/status
 */
export async function getPohodaStatus(req, res) {
  try {
    const pohodaService = new PohodaService();
    const status = pohodaService.getStatus();

    return res.status(200).json({
      success: true,
      pohoda: status,
      endpoints: {
        syncInvoice: '/api/pohoda/sync-invoice',
        syncOrder: '/api/pohoda/sync-order',
        status: '/api/pohoda/status'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
