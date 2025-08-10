/**
 * Comgate Payment Status API
 * Handles Comgate payment status checks
 */

const ComgateProcessor = require('../../../../lib/comgate-processor');
const logger = require('../../../../utils/logger');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Get transaction ID from query params or body
    const transactionId = req.method === 'GET' 
      ? req.query.transactionId 
      : req.body.transactionId;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: transactionId'
      });
    }

    logger.info('Comgate payment status check request', { transactionId });

    const comgateProcessor = new ComgateProcessor();

    // Check payment status
    const result = await comgateProcessor.checkPaymentStatus(transactionId);

    if (result.success) {
      logger.info('Comgate payment status retrieved successfully', {
        transactionId,
        status: result.status,
        paid: result.paid
      });

      return res.status(200).json({
        success: true,
        transactionId: result.transactionId,
        status: result.status,
        paid: result.paid,
        amount: result.amount,
        currency: result.currency,
        refId: result.refId,
        email: result.email,
        paymentMethod: result.paymentMethod,
        payerName: result.payerName,
        payerAccount: result.payerAccount,
        fee: result.fee,
        variableSymbol: result.variableSymbol,
        testMode: result.testMode
      });
    } else {
      logger.error('Comgate payment status check failed', {
        transactionId,
        error: result.error
      });

      return res.status(400).json({
        success: false,
        error: result.error,
        transactionId
      });
    }

  } catch (error) {
    logger.error('Comgate payment status check error', {
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
