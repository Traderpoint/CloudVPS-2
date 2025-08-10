/**
 * Download invoice PDF API endpoint
 * GET /api/client/invoice-pdf?invoice_id=123
 */

const HostBillClient = require('../../../lib/hostbill-client');
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { invoice_id } = req.query;

  if (!invoice_id) {
    return res.status(400).json({
      success: false,
      error: 'invoice_id parameter is required'
    });
  }

  try {
    logger.info('🔍 Downloading invoice PDF', { invoice_id });

    const hostbillClient = new HostBillClient();
    
    // Try to get invoice PDF from HostBill
    const pdfResult = await hostbillClient.makeApiCall({
      call: 'getInvoicePDF',
      id: invoice_id
    });

    if (pdfResult && pdfResult.pdf) {
      // HostBill returns base64 encoded PDF
      const pdfBuffer = Buffer.from(pdfResult.pdf, 'base64');
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice_id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      logger.info('✅ Invoice PDF downloaded successfully', { 
        invoice_id, 
        size: pdfBuffer.length 
      });
      
      return res.status(200).send(pdfBuffer);
    } else {
      logger.warn('PDF not available from HostBill API', { invoice_id });

      return res.status(200).json({
        success: false,
        error: 'PDF not available',
        message: 'PDF stahování není momentálně dostupné',
        invoice_id: invoice_id,
        suggestion: 'Kontaktujte podporu pro získání PDF faktury'
      });
    }

  } catch (error) {
    logger.error('❌ Error downloading invoice PDF', {
      invoice_id,
      error: error.message
    });

    // Check if it's a HostBill API error
    if (error.message && error.message.includes('not supported')) {
      return res.status(501).json({
        success: false,
        error: 'PDF download not supported',
        message: 'HostBill API does not support PDF download for this invoice',
        details: error.message,
        invoice_id: invoice_id,
        suggestion: 'Please contact support or access the invoice directly in HostBill'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to download invoice PDF',
      details: error.message,
      invoice_id: invoice_id,
      timestamp: new Date().toISOString()
    });
  }
}
