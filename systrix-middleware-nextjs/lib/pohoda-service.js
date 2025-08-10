/**
 * Pohoda Service
 * Complete Pohoda integration service for systrix-middleware-nextjs
 * Handles all Pohoda synchronization without external dependencies
 */

const PohodaXMLGenerator = require('./pohoda-xml-generator');
const logger = require('../utils/logger');

class PohodaService {
  constructor() {
    this.xmlGenerator = new PohodaXMLGenerator();
    this.dativeryApiKey = process.env.DATIVERY_API_KEY;
    this.dativeryApiUrl = process.env.DATIVERY_API_URL || 'https://api.dativery.com/v1';
    this.pohodaDataFile = process.env.POHODA_DATA_FILE;
    this.pohodaUsername = process.env.POHODA_USERNAME;
    this.pohodaPassword = process.env.POHODA_PASSWORD;
    this.enabled = this.isConfigured();

    if (!this.enabled) {
      logger.warn('Pohoda service not configured - sync operations will be skipped', {
        hasApiKey: !!this.dativeryApiKey,
        hasApiUrl: !!this.dativeryApiUrl,
        hasDataFile: !!this.pohodaDataFile,
        hasCredentials: !!(this.pohodaUsername && this.pohodaPassword)
      });
    } else {
      logger.info('Pohoda service initialized successfully', {
        dativeryUrl: this.dativeryApiUrl,
        dataFile: this.pohodaDataFile
      });
    }
  }

  /**
   * Check if Pohoda service is properly configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!(
      this.dativeryApiKey &&
      this.dativeryApiUrl &&
      this.pohodaDataFile &&
      this.pohodaUsername &&
      this.pohodaPassword
    );
  }

  /**
   * Sync invoice to Pohoda after successful payment
   * @param {Object} invoiceData - Invoice data from HostBill
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Sync result
   */
  async syncInvoiceAfterPayment(invoiceData, paymentData) {
    if (!this.enabled) {
      logger.info('Pohoda sync skipped - not configured', {
        invoiceId: invoiceData.id
      });
      return { 
        success: true, 
        message: 'Pohoda sync not configured - skipped', 
        skipped: true 
      };
    }

    try {
      logger.info('Starting Pohoda invoice sync after payment', {
        invoiceId: invoiceData.id,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount,
        method: paymentData.method
      });

      // Generate XML for Pohoda invoice
      const xml = this.xmlGenerator.generateInvoiceXML(invoiceData, paymentData);

      // Send to Dativery API
      const result = await this.sendToDativery(xml, 'invoice', invoiceData.id);

      if (result.success) {
        logger.info('Pohoda invoice sync completed successfully', {
          invoiceId: invoiceData.id,
          transactionId: paymentData.transactionId,
          pohodaInvoiceId: invoiceData.id
        });

        return {
          success: true,
          message: 'Invoice synchronized to Pohoda successfully',
          pohodaInvoiceId: invoiceData.id,
          transactionId: paymentData.transactionId,
          dativeryResponse: result.response
        };
      } else {
        logger.warn('Pohoda invoice sync failed', {
          invoiceId: invoiceData.id,
          error: result.error
        });

        return {
          success: false,
          error: result.error,
          invoiceId: invoiceData.id
        };
      }

    } catch (error) {
      logger.error('Pohoda invoice sync exception', {
        invoiceId: invoiceData.id,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        invoiceId: invoiceData.id
      };
    }
  }

  /**
   * Sync order to Pohoda (for order creation)
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Sync result
   */
  async syncOrder(orderData) {
    if (!this.enabled) {
      logger.info('Pohoda sync skipped - not configured', {
        orderId: orderData.orderId
      });
      return { 
        success: true, 
        message: 'Pohoda sync not configured - skipped', 
        skipped: true 
      };
    }

    try {
      logger.info('Starting Pohoda order sync', {
        orderId: orderData.orderId,
        customerEmail: orderData.customer?.email,
        itemsCount: orderData.items?.length || 0
      });

      // Generate XML for Pohoda order
      const xml = this.xmlGenerator.generateOrderXML(orderData);

      // Send to Dativery API
      const result = await this.sendToDativery(xml, 'order', orderData.orderId);

      if (result.success) {
        logger.info('Pohoda order sync completed successfully', {
          orderId: orderData.orderId,
          pohodaOrderId: orderData.orderId
        });

        return {
          success: true,
          message: 'Order synchronized to Pohoda successfully',
          pohodaOrderId: orderData.orderId,
          dativeryResponse: result.response
        };
      } else {
        logger.warn('Pohoda order sync failed', {
          orderId: orderData.orderId,
          error: result.error
        });

        return {
          success: false,
          error: result.error,
          orderId: orderData.orderId
        };
      }

    } catch (error) {
      logger.error('Pohoda order sync exception', {
        orderId: orderData.orderId,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        orderId: orderData.orderId
      };
    }
  }

  /**
   * Send XML data to Dativery API
   * @param {string} xml - Generated XML
   * @param {string} type - Type of data (invoice/order)
   * @param {string} id - Record ID
   * @returns {Promise<Object>} API result
   */
  async sendToDativery(xml, type, id) {
    try {
      logger.debug('Sending XML to Dativery API', {
        type,
        id,
        url: `${this.dativeryApiUrl}/pohoda/import`,
        xmlLength: xml.length
      });

      const response = await fetch(`${this.dativeryApiUrl}/pohoda/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Authorization': `Bearer ${this.dativeryApiKey}`,
          'X-Pohoda-DataFile': this.pohodaDataFile,
          'X-Pohoda-Username': this.pohodaUsername,
          'X-Pohoda-Password': this.pohodaPassword
        },
        body: xml
      });

      if (!response.ok) {
        throw new Error(`Dativery API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logger.debug('Dativery API response received', {
        type,
        id,
        success: result.success || response.ok,
        response: result
      });

      return {
        success: true,
        response: result
      };

    } catch (error) {
      logger.error('Failed to send XML to Dativery API', {
        type,
        id,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get service status and configuration
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      configured: this.isConfigured(),
      dativeryUrl: this.dativeryApiUrl,
      dataFile: this.pohodaDataFile,
      hasCredentials: !!(this.pohodaUsername && this.pohodaPassword),
      hasApiKey: !!this.dativeryApiKey
    };
  }
}

module.exports = PohodaService;
