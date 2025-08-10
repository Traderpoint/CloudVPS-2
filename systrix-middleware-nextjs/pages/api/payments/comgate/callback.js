/**
 * Comgate Payment Callback API
 * Handles Comgate payment status callbacks/webhooks
 */

const ComgateProcessor = require('../../../../lib/comgate-processor');
const logger = require('../../../../utils/logger');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    logger.info('Comgate payment callback received', {
      body: req.body,
      headers: req.headers
    });

    const comgateProcessor = new ComgateProcessor();

    // Process the callback
    const result = await comgateProcessor.processCallback(req.body);

    if (result.success) {
      logger.info('Comgate callback processed successfully', {
        transactionId: result.transactionId,
        status: result.status
      });

      // Log successful payment but don't auto-mark invoice as paid
      // Let the payment complete flow handle the invoice marking
      if (result.status === 'PAID' && result.refId) {
        logger.info('Comgate payment successful - will be processed by payment complete flow', {
          refId: result.refId,
          transactionId: result.transactionId,
          amount: result.amount,
          currency: result.currency || 'CZK',
          note: 'Invoice marking will be handled by payment-complete page'
        });
      }

      // Return HTTP 200 to confirm receipt
      return res.status(200).json({
        success: true,
        message: 'Callback processed successfully - will be handled by payment complete flow',
        paymentStatus: result.status,
        invoiceUpdated: false, // Invoice marking is handled by payment-complete page
        note: 'Invoice marking will be handled by payment-complete page'
      });
    } else {
      logger.error('Comgate callback processing failed', {
        error: result.error
      });

      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Comgate callback processing error', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
