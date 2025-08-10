/**
 * Comgate Payment Processor
 * Handles Comgate payment processing workflow
 */

const ComgateClient = require('./comgate-client');
const logger = require('../utils/logger');

class ComgateProcessor {
  constructor() {
    this.comgateClient = new ComgateClient();
  }

  /**
   * Initialize Comgate payment
   * @param {Object} paymentData - Payment initialization data
   * @returns {Promise<Object>} Payment initialization result
   */
  async initializePayment(paymentData) {
    try {
      const {
        orderId,
        invoiceId,
        orderNumber,
        amount,
        currency = 'CZK',
        customerEmail,
        customerName,
        customerPhone,
        description,
        returnUrl,
        cancelUrl,
        pendingUrl
      } = paymentData;

      if (!this.comgateClient.isConfigured()) {
        throw new Error('Comgate is not properly configured');
      }

      // Prepare payment data for Comgate
      const baseUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
      const comgatePaymentData = {
        price: parseFloat(amount),
        currency,
        label: description || `Invoice ${invoiceId || orderId}`,
        refId: invoiceId || orderId, // Use Invoice ID as refId
        email: customerEmail,
        fullName: customerName,
        phone: customerPhone,
        method: 'ALL', // Let customer choose payment method
        country: 'CZ',
        lang: 'cs',
        returnUrl: returnUrl || `${baseUrl}/api/payments/return?status=success&invoiceId=${invoiceId}&orderId=${orderId}&amount=${amount}&paymentMethod=comgate`,
        cancelUrl: cancelUrl || `${baseUrl}/api/payments/return?status=cancelled&invoiceId=${invoiceId}&orderId=${orderId}&amount=${amount}&paymentMethod=comgate`,
        pendingUrl: pendingUrl || `${baseUrl}/api/payments/return?status=pending&invoiceId=${invoiceId}&orderId=${orderId}&amount=${amount}&paymentMethod=comgate`
      };

      logger.info('Initializing Comgate payment', {
        orderId,
        invoiceId,
        amount,
        currency,
        customerEmail,
        refId: comgatePaymentData.refId,
        returnUrl: comgatePaymentData.returnUrl,
        cancelUrl: comgatePaymentData.cancelUrl,
        pendingUrl: comgatePaymentData.pendingUrl,
        comgatePrice: comgatePaymentData.price,
        originalAmount: amount,
        processedPrice: parseFloat(amount)
      });

      const result = await this.comgateClient.createPayment(comgatePaymentData);

      return {
        success: true,
        transactionId: result.transId,
        redirectUrl: result.redirect,
        paymentMethod: 'comgate',
        status: 'pending',
        message: 'Payment initialized successfully'
      };

    } catch (error) {
      logger.error('Failed to initialize Comgate payment', {
        error: error.message,
        paymentData
      });

      return {
        success: false,
        error: error.message,
        paymentMethod: 'comgate',
        status: 'failed'
      };
    }
  }

  /**
   * Check payment status
   * @param {string} transactionId - Comgate transaction ID
   * @returns {Promise<Object>} Payment status result
   */
  async checkPaymentStatus(transactionId) {
    try {
      if (!this.comgateClient.isConfigured()) {
        throw new Error('Comgate is not properly configured');
      }

      logger.info('Checking Comgate payment status', { transactionId });

      const result = await this.comgateClient.getPaymentStatus(transactionId);

      // Map Comgate status to our standard status
      let status = 'unknown';
      let paid = false;

      switch (result.status) {
        case 'PAID':
          status = 'paid';
          paid = true;
          break;
        case 'PENDING':
          status = 'pending';
          break;
        case 'CANCELLED':
          status = 'cancelled';
          break;
        case 'AUTHORIZED':
          status = 'authorized';
          break;
        default:
          status = 'unknown';
      }

      return {
        success: true,
        transactionId: result.transId,
        status,
        paid,
        amount: result.price / 100, // Convert from cents
        currency: result.curr,
        refId: result.refId,
        email: result.email,
        paymentMethod: result.method,
        payerName: result.payerName,
        payerAccount: result.payerAcc,
        fee: result.fee !== 'unknown' ? parseFloat(result.fee) / 100 : null,
        variableSymbol: result.vs,
        testMode: result.test === 'true'
      };

    } catch (error) {
      logger.error('Failed to check Comgate payment status', {
        transactionId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        transactionId
      };
    }
  }

  /**
   * Cancel payment
   * @param {string} transactionId - Comgate transaction ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPayment(transactionId) {
    try {
      if (!this.comgateClient.isConfigured()) {
        throw new Error('Comgate is not properly configured');
      }

      logger.info('Cancelling Comgate payment', { transactionId });

      const result = await this.comgateClient.cancelPayment(transactionId);

      return {
        success: true,
        transactionId,
        message: 'Payment cancelled successfully'
      };

    } catch (error) {
      logger.error('Failed to cancel Comgate payment', {
        transactionId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        transactionId
      };
    }
  }

  /**
   * Refund payment
   * @param {string} transactionId - Comgate transaction ID
   * @param {number} amount - Refund amount
   * @param {string} refId - Refund reference ID
   * @returns {Promise<Object>} Refund result
   */
  async refundPayment(transactionId, amount, refId = null) {
    try {
      if (!this.comgateClient.isConfigured()) {
        throw new Error('Comgate is not properly configured');
      }

      logger.info('Refunding Comgate payment', { 
        transactionId, 
        amount, 
        refId 
      });

      const result = await this.comgateClient.refundPayment(transactionId, amount, refId);

      return {
        success: true,
        transactionId,
        amount,
        refId,
        message: 'Payment refunded successfully'
      };

    } catch (error) {
      logger.error('Failed to refund Comgate payment', {
        transactionId,
        amount,
        refId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        transactionId
      };
    }
  }

  /**
   * Get available payment methods
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Available payment methods
   */
  async getPaymentMethods(options = {}) {
    try {
      if (!this.comgateClient.isConfigured()) {
        throw new Error('Comgate is not properly configured');
      }

      logger.info('Getting Comgate payment methods', options);

      const result = await this.comgateClient.getPaymentMethods(options);

      return {
        success: true,
        methods: result.methods || [],
        message: 'Payment methods retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get Comgate payment methods', {
        options,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        methods: []
      };
    }
  }

  /**
   * Process webhook/callback from Comgate
   * @param {Object} callbackData - Callback data from Comgate
   * @returns {Promise<Object>} Callback processing result
   */
  async processCallback(callbackData) {
    try {
      logger.info('Processing Comgate callback', callbackData);

      // Comgate sends callback data in specific format
      // This would typically include transaction status update
      const {
        transId,
        status,
        price,
        curr,
        refId,
        email,
        method
      } = callbackData;

      // Verify the callback authenticity if needed
      // (Comgate may include signature verification)

      return {
        success: true,
        transactionId: transId,
        status,
        amount: price ? price / 100 : null,
        currency: curr,
        refId,
        email,
        paymentMethod: method,
        message: 'Callback processed successfully'
      };

    } catch (error) {
      logger.error('Failed to process Comgate callback', {
        callbackData,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get processor configuration info
   * @returns {Object} Configuration information
   */
  getConfigInfo() {
    return {
      name: 'Comgate',
      ...this.comgateClient.getConfigInfo()
    };
  }
}

module.exports = ComgateProcessor;
