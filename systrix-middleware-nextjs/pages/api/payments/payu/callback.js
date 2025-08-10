/**
 * PayU Payment Callback Handler
 * Handles PayU payment notifications and marks invoices as paid
 */

const logger = require('../../../../utils/logger');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    logger.info('PayU callback received', { body: req.body });

    const {
      txnid,
      mihpayid,
      status,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      hash
    } = req.body;

    // Validate required fields
    if (!txnid || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required callback data'
      });
    }

    // Process successful payment
    if (status === 'success') {
      logger.info('PayU payment successful', {
        txnid,
        mihpayid,
        amount,
        email
      });

      // Log successful payment but don't auto-mark invoice as paid
      // Let the payment success flow handle the invoice marking
      if (txnid && amount) {
        logger.info('PayU payment successful - will be processed by payment success flow', {
          txnid,
          mihpayid,
          amount,
          note: 'Invoice marking will be handled by payment-success-flow page'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'PayU callback processed successfully - will be handled by payment success flow',
        status: 'PAID',
        transactionId: mihpayid,
        invoiceUpdated: false, // Invoice marking is handled by payment-success-flow page
        note: 'Invoice marking will be handled by payment-success-flow page'
      });
    } else {
      logger.warn('PayU payment failed or pending', {
        txnid,
        status,
        amount
      });

      return res.status(200).json({
        success: true,
        message: 'PayU callback processed',
        status: status.toUpperCase(),
        transactionId: mihpayid,
        invoiceUpdated: false
      });
    }

  } catch (error) {
    logger.error('PayU callback processing error', {
      error: error.message,
      body: req.body
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
