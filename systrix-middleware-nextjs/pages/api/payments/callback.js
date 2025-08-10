/**
 * Payment Gateway Callback Handler
 * Handles direct notifications from payment gateways (IPN, webhooks, etc.)
 * Marks invoices as paid when payment is confirmed
 */

const HostBillClient = require('../../../lib/hostbill-client');
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    logger.info('🔔 Payment callback received', {
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Extract payment data from request (supports multiple gateway formats)
    const {
      // Common parameters
      status,
      orderId,
      invoiceId,
      transactionId,
      amount,
      currency,
      paymentMethod,
      
      // PayU specific
      PAYUID,
      REFNO,
      HASH,
      
      // Comgate specific
      merchant,
      test,
      price,
      curr,
      label,
      refId,
      method,
      
      // PayPal specific
      payment_status,
      txn_id,
      mc_gross,
      mc_currency,
      
      // Generic
      success,
      error,
      cancelled
    } = { ...req.query, ...req.body };

    // Determine payment status from various gateway formats
    let paymentStatus = 'unknown';
    let finalInvoiceId = invoiceId || label || refId;
    let finalTransactionId = transactionId || txn_id || PAYUID || REFNO;
    let finalAmount = amount || price || mc_gross;
    let finalCurrency = currency || curr || mc_currency || 'CZK';
    let finalPaymentMethod = paymentMethod || method || 'online';

    // Status mapping for different gateways
    if (status === 'success' || status === 'PAID' || payment_status === 'Completed' || success === 'true') {
      paymentStatus = 'success';
    } else if (status === 'cancelled' || cancelled === 'true' || payment_status === 'Cancelled') {
      paymentStatus = 'cancelled';
    } else if (status === 'pending' || payment_status === 'Pending') {
      paymentStatus = 'pending';
    } else if (status === 'failed' || error || payment_status === 'Failed') {
      paymentStatus = 'failed';
    }

    logger.info('📊 Processed callback data', {
      paymentStatus,
      finalInvoiceId,
      finalTransactionId,
      finalAmount,
      finalCurrency,
      finalPaymentMethod
    });

    // Mark invoice as paid if payment was successful
    if (paymentStatus === 'success' && finalInvoiceId && finalAmount) {
      try {
        const hostbillClient = new HostBillClient();

        // Log payment callback but don't process payment automatically
        // Let the payment complete flow handle the invoice marking
        logger.info('💰 Payment callback received - will be processed by payment complete flow', {
          invoiceId: finalInvoiceId,
          amount: finalAmount,
          currency: finalCurrency,
          transactionId: finalTransactionId,
          paymentMethod: finalPaymentMethod,
          note: 'Invoice marking will be handled by payment-complete page'
        });

        // Return success response to gateway
        res.status(200).json({
          success: true,
          message: 'Payment callback received - will be processed by payment complete flow',
          invoiceId: finalInvoiceId,
          transactionId: finalTransactionId,
          paymentMethod: finalPaymentMethod,
          amount: finalAmount,
          currency: finalCurrency,
          timestamp: new Date().toISOString(),
          note: 'Invoice marking will be handled by payment-complete page'
        });
        return;

      } catch (error) {
        logger.error('❌ Error processing payment callback', {
          invoiceId: finalInvoiceId,
          error: error.message,
          stack: error.stack
        });

        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Handle non-success statuses
    if (paymentStatus === 'cancelled') {
      logger.info('⚠️ Payment cancelled via callback', {
        invoiceId: finalInvoiceId,
        transactionId: finalTransactionId
      });

      res.status(200).json({
        success: true,
        message: 'Payment cancellation acknowledged',
        status: 'cancelled',
        invoiceId: finalInvoiceId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (paymentStatus === 'pending') {
      logger.info('⏳ Payment pending via callback', {
        invoiceId: finalInvoiceId,
        transactionId: finalTransactionId
      });

      res.status(200).json({
        success: true,
        message: 'Payment pending acknowledged',
        status: 'pending',
        invoiceId: finalInvoiceId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Unknown or failed status
    logger.warn('❓ Unknown payment status via callback', {
      paymentStatus,
      invoiceId: finalInvoiceId,
      transactionId: finalTransactionId,
      rawData: { ...req.query, ...req.body }
    });

    res.status(200).json({
      success: true,
      message: 'Callback received',
      status: paymentStatus,
      invoiceId: finalInvoiceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Payment callback handler error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
