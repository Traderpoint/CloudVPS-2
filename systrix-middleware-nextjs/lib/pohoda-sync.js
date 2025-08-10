/**
 * Pohoda Sync Utility Module
 * Handles automatic synchronization with Pohoda accounting system
 * via Dativery API integration
 */

const logger = require('../utils/logger');

class PohodaSync {
  constructor() {
    this.eshopUrl = process.env.ESHOP_URL || 'http://localhost:3001';
    this.enabled = !!(process.env.DATIVERY_API_KEY && process.env.DATIVERY_API_URL);
    
    if (!this.enabled) {
      logger.warn('Pohoda sync not configured - sync operations will be skipped', {
        hasApiKey: !!process.env.DATIVERY_API_KEY,
        hasApiUrl: !!process.env.DATIVERY_API_URL
      });
    }
  }

  /**
   * Check if Pohoda sync is enabled and configured
   * @returns {boolean} True if sync is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Sync order creation to Pohoda
   * @param {Object} orderData - Order data to sync
   * @returns {Promise<Object>} Sync result
   */
  async syncOrderCreation(orderData) {
    if (!this.enabled) {
      return { success: true, message: 'Pohoda sync not configured - skipped', skipped: true };
    }

    try {
      logger.info('Pohoda sync: Creating order', {
        orderId: orderData.orderId,
        clientId: orderData.clientId,
        amount: orderData.totalPrice
      });

      const response = await fetch(`${this.eshopUrl}/api/sync-pohoda`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        logger.info('Pohoda sync: Order created successfully', {
          orderId: orderData.orderId,
          pohodaOrderId: result.pohodaOrderId
        });
      } else {
        logger.warn('Pohoda sync: Order creation failed', {
          orderId: orderData.orderId,
          error: result.error
        });
      }

      return result;

    } catch (error) {
      logger.error('Pohoda sync: Order creation exception', {
        orderId: orderData.orderId,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message,
        orderId: orderData.orderId
      };
    }
  }

  /**
   * Sync payment to Pohoda
   * @param {Object} paymentData - Payment data to sync
   * @returns {Promise<Object>} Sync result
   */
  async syncPayment(paymentData) {
    if (!this.enabled) {
      return { success: true, message: 'Pohoda sync not configured - skipped', skipped: true };
    }

    try {
      logger.info('Pohoda sync: Processing payment', {
        orderId: paymentData.orderId,
        invoiceId: paymentData.invoiceId,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount,
        status: paymentData.status
      });

      const response = await fetch(`${this.eshopUrl}/api/sync-pohoda-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        logger.info('Pohoda sync: Payment synchronized successfully', {
          orderId: paymentData.orderId,
          invoiceId: paymentData.invoiceId,
          transactionId: paymentData.transactionId,
          pohodaOrderId: result.pohodaOrderId
        });
      } else {
        logger.warn('Pohoda sync: Payment sync failed', {
          orderId: paymentData.orderId,
          invoiceId: paymentData.invoiceId,
          error: result.error
        });
      }

      return result;

    } catch (error) {
      logger.error('Pohoda sync: Payment sync exception', {
        orderId: paymentData.orderId,
        invoiceId: paymentData.invoiceId,
        transactionId: paymentData.transactionId,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message,
        orderId: paymentData.orderId,
        invoiceId: paymentData.invoiceId
      };
    }
  }

  /**
   * Sync order status change to Pohoda
   * @param {Object} statusData - Status change data
   * @returns {Promise<Object>} Sync result
   */
  async syncOrderStatus(statusData) {
    if (!this.enabled) {
      return { success: true, message: 'Pohoda sync not configured - skipped', skipped: true };
    }

    try {
      logger.info('Pohoda sync: Updating order status', {
        orderId: statusData.orderId,
        oldStatus: statusData.oldStatus,
        newStatus: statusData.newStatus
      });

      // For now, use the payment sync endpoint with status update
      const response = await fetch(`${this.eshopUrl}/api/sync-pohoda-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: statusData.orderId,
          invoiceId: statusData.invoiceId,
          status: statusData.newStatus,
          notes: `Order status changed from ${statusData.oldStatus} to ${statusData.newStatus}`,
          amount: statusData.amount || 0,
          currency: statusData.currency || 'CZK',
          paymentDate: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        logger.info('Pohoda sync: Order status updated successfully', {
          orderId: statusData.orderId,
          newStatus: statusData.newStatus
        });
      } else {
        logger.warn('Pohoda sync: Order status update failed', {
          orderId: statusData.orderId,
          error: result.error
        });
      }

      return result;

    } catch (error) {
      logger.error('Pohoda sync: Order status update exception', {
        orderId: statusData.orderId,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message,
        orderId: statusData.orderId
      };
    }
  }

  /**
   * Map CloudVPS payment method to Pohoda format
   * @param {string} paymentMethod - CloudVPS payment method
   * @returns {string} Pohoda payment method
   */
  mapPaymentMethodToPohoda(paymentMethod) {
    const mapping = {
      'comgate': 'Platební karta (ComGate)',
      'payu': 'Platební karta (PayU)',
      'banktransfer': 'Bankovní převod',
      'creditcard': 'Platební karta',
      'manual': 'Manuální platba',
      '0': 'Hotovost/Jiné',
      'null': 'Neurčeno'
    };

    return mapping[paymentMethod] || `Platba (${paymentMethod})`;
  }
}

/**
 * Map CloudVPS payment method to Pohoda format (standalone function)
 * @param {string} paymentMethod - CloudVPS payment method
 * @returns {string} Pohoda payment method
 */
function mapPaymentMethodToPohoda(paymentMethod) {
  const mapping = {
    'comgate': 'Platební karta (ComGate)',
    'payu': 'Platební karta (PayU)',
    'banktransfer': 'Bankovní převod',
    'creditcard': 'Platební karta',
    'manual': 'Manuální platba',
    '0': 'Hotovost/Jiné',
    'null': 'Neurčeno'
  };

  return mapping[paymentMethod] || `Platba (${paymentMethod})`;
}

module.exports = PohodaSync;
