/**
 * Get Invoice Details API
 * Retrieves invoice information from HostBill
 */

const HostBillClient = require('../../../../lib/hostbill-client');
const logger = require('../../../../utils/logger');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { invoiceId } = req.query;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Invoice ID is required'
      });
    }

    logger.info('Getting invoice details', { invoiceId });

    const hostbillClient = new HostBillClient();

    if (!hostbillClient.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'HostBill client not configured'
      });
    }

    const result = await hostbillClient.getInvoice(invoiceId);
    
    if (result.success) {
      logger.info('Invoice details retrieved successfully', {
        invoiceId,
        status: result.invoice?.status
      });

      return res.status(200).json({
        success: true,
        invoice: result.invoice,
        invoiceId
      });
    } else {
      logger.error('Failed to get invoice details', {
        invoiceId,
        error: result.error
      });

      return res.status(404).json({
        success: false,
        error: result.error || 'Invoice not found',
        invoiceId
      });
    }

  } catch (error) {
    logger.error('Get invoice details error', {
      invoiceId: req.query.invoiceId,
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
