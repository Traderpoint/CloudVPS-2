/**
 * Payment Processor
 * Handles payment processing workflow with HostBill payment gateways
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const ComgateProcessor = require('./comgate-processor');

class PaymentProcessor {
  constructor(hostbillClient) {
    this.hostbillClient = hostbillClient;
    this.comgateProcessor = new ComgateProcessor();
    this.supportedGateways = new Map();
    this.initializeSupportedGateways();
  }

  /**
   * Initialize supported payment gateways mapping
   */
  initializeSupportedGateways() {
    // Map CloudVPS payment methods to HostBill gateway IDs
    this.supportedGateways.set('card', {
      id: process.env.HOSTBILL_GATEWAY_CARD || '1',
      name: 'Credit Card',
      type: 'redirect',
      requiresRedirect: true
    });

    this.supportedGateways.set('paypal', {
      id: process.env.HOSTBILL_GATEWAY_PAYPAL || '2',
      name: 'PayPal',
      type: 'redirect',
      requiresRedirect: true
    });

    this.supportedGateways.set('banktransfer', {
      id: process.env.HOSTBILL_GATEWAY_BANK || '3',
      name: 'Bank Transfer',
      type: 'manual',
      requiresRedirect: false
    });

    this.supportedGateways.set('crypto', {
      id: process.env.HOSTBILL_GATEWAY_CRYPTO || '4',
      name: 'Cryptocurrency',
      type: 'redirect',
      requiresRedirect: true
    });

    this.supportedGateways.set('payu', {
      id: process.env.HOSTBILL_GATEWAY_PAYU || '5',
      name: 'PayU',
      type: 'redirect',
      requiresRedirect: true
    });

    logger.info('Payment gateways initialized', {
      gateways: Array.from(this.supportedGateways.keys())
    });
  }

  /**
   * Get available payment methods
   * @returns {Promise<Array>} Available payment methods
   */
  async getAvailablePaymentMethods() {
    try {
      logger.info('Fetching available payment methods');

      let hostbillGateways = [];

      try {
        // Try to get HostBill payment gateways
        hostbillGateways = await this.hostbillClient.getPaymentGateways();
        logger.info('HostBill gateways retrieved', { count: hostbillGateways.length });
      } catch (hostbillError) {
        logger.warn('Failed to get HostBill payment gateways, using all as enabled', {
          error: hostbillError.message
        });

        // Use fallback - assume all gateways are enabled for testing
        hostbillGateways = [
          { id: '1', name: 'Credit Card', enabled: true },
          { id: '2', name: 'PayPal', enabled: true },
          { id: '3', name: 'Bank Transfer', enabled: true },
          { id: '4', name: 'Cryptocurrency', enabled: true },
          { id: '5', name: 'PayU', enabled: true }
        ];
      }

      const availableMethods = [];

      // Map HostBill gateways to our supported methods
      for (const [method, config] of this.supportedGateways) {
        // Find matching HostBill gateway by method or ID
        const hostbillGateway = hostbillGateways.find(g =>
          g.method === method || g.id === config.id
        );

        if (hostbillGateway && hostbillGateway.enabled) {
          // Gateway is active in HostBill
          availableMethods.push({
            id: method,
            name: config.name,
            type: config.type,
            requiresRedirect: config.requiresRedirect,
            hostbillId: config.id,
            enabled: true,
            description: this.getPaymentMethodDescription(method)
          });
        } else {
          // Gateway not found or disabled in HostBill
          availableMethods.push({
            id: method,
            name: config.name,
            type: config.type,
            requiresRedirect: config.requiresRedirect,
            hostbillId: config.id,
            enabled: false,
            description: this.getPaymentMethodDescription(method),
            reason: 'Not enabled in HostBill'
          });
        }
      }

      logger.info('Payment methods processed', {
        total: availableMethods.length,
        enabled: availableMethods.filter(m => m.enabled).length
      });

      return {
        success: true,
        methods: availableMethods,
        total: availableMethods.length,
        enabled: availableMethods.filter(m => m.enabled).length
      };

    } catch (error) {
      logger.error('Failed to get payment methods', { error: error.message });
      
      return {
        success: false,
        error: error.message,
        methods: []
      };
    }
  }

  /**
   * Get payment method description
   * @param {string} method - Payment method ID
   * @returns {string} Description
   */
  getPaymentMethodDescription(method) {
    const descriptions = {
      card: 'Platba kartou (Visa, MasterCard)',
      paypal: 'Platba přes PayPal účet',
      banktransfer: 'Bankovní převod',
      crypto: 'Platba kryptoměnou (Bitcoin, Ethereum)',
      payu: 'Platba přes PayU bránu'
    };

    return descriptions[method] || 'Platební metoda';
  }

  /**
   * Process payment for order
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(paymentData) {
    const paymentId = uuidv4();
    
    logger.info('Processing payment', {
      paymentId,
      orderId: paymentData.order_id,
      method: paymentData.payment_method,
      amount: paymentData.amount
    });

    try {
      // Validate payment method
      const gateway = this.supportedGateways.get(paymentData.payment_method);
      if (!gateway) {
        throw new Error(`Unsupported payment method: ${paymentData.payment_method}`);
      }

      // Get payment URL from HostBill
      const paymentResult = await this.hostbillClient.getPaymentUrl({
        order_id: paymentData.order_id,
        gateway_id: gateway.id,
        return_url: paymentData.return_url || process.env.PAYMENT_RETURN_URL,
        cancel_url: paymentData.cancel_url || process.env.PAYMENT_CANCEL_URL
      });

      logger.info('Payment URL generated', {
        paymentId,
        orderId: paymentData.order_id,
        hasUrl: !!paymentResult.payment_url
      });

      return {
        success: true,
        paymentId,
        orderId: paymentData.order_id,
        paymentMethod: paymentData.payment_method,
        paymentUrl: paymentResult.payment_url,
        requiresRedirect: gateway.requiresRedirect,
        gatewayName: gateway.name,
        instructions: this.getPaymentInstructions(paymentData.payment_method)
      };

    } catch (error) {
      logger.error('Payment processing failed', {
        paymentId,
        orderId: paymentData.order_id,
        error: error.message
      });

      return {
        success: false,
        paymentId,
        orderId: paymentData.order_id,
        error: error.message
      };
    }
  }

  /**
   * Get payment instructions for method
   * @param {string} method - Payment method
   * @returns {string} Instructions
   */
  getPaymentInstructions(method) {
    const instructions = {
      card: 'Budete přesměrováni na bezpečnou platební bránu pro zadání údajů karty.',
      paypal: 'Budete přesměrováni na PayPal pro dokončení platby.',
      banktransfer: 'Obdržíte pokyny pro bankovní převod na váš email.',
      crypto: 'Budete přesměrováni na krypto platební bránu.',
      payu: 'Budete přesměrováni na PayU platební bránu.'
    };

    return instructions[method] || 'Postupujte podle pokynů na platební bráně.';
  }

  /**
   * Verify payment status
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Payment status
   */
  async verifyPaymentStatus(orderId) {
    try {
      logger.info('Verifying payment status', { orderId });

      const paymentStatus = await this.hostbillClient.getPaymentStatus(orderId);

      logger.info('Payment status retrieved', {
        orderId,
        status: paymentStatus.status
      });

      return {
        success: true,
        orderId,
        status: paymentStatus.status,
        amount: paymentStatus.amount,
        currency: paymentStatus.currency,
        paidAt: paymentStatus.paid_at,
        transactionId: paymentStatus.transaction_id
      };

    } catch (error) {
      logger.error('Failed to verify payment status', {
        orderId,
        error: error.message
      });

      return {
        success: false,
        orderId,
        error: error.message
      };
    }
  }

  /**
   * Handle payment callback/webhook
   * @param {Object} callbackData - Callback data from payment gateway
   * @returns {Promise<Object>} Callback processing result
   */
  async handlePaymentCallback(callbackData) {
    const callbackId = uuidv4();
    
    logger.info('Processing payment callback', {
      callbackId,
      orderId: callbackData.order_id,
      status: callbackData.status
    });

    try {
      // Process callback with HostBill
      const result = await this.hostbillClient.processPaymentCallback(callbackData);

      logger.info('Payment callback processed', {
        callbackId,
        orderId: callbackData.order_id,
        success: result.success
      });

      return {
        success: true,
        callbackId,
        orderId: callbackData.order_id,
        processed: result.success,
        message: result.message || 'Callback processed successfully'
      };

    } catch (error) {
      logger.error('Payment callback processing failed', {
        callbackId,
        orderId: callbackData.order_id,
        error: error.message
      });

      return {
        success: false,
        callbackId,
        orderId: callbackData.order_id,
        error: error.message
      };
    }
  }
}

module.exports = PaymentProcessor;
