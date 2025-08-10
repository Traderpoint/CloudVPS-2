/**
 * Comgate Payment Gateway Client
 * Handles communication with Comgate API for payment processing
 */

const logger = require('../utils/logger');

class ComgateClient {
  constructor() {
    this.baseUrl = process.env.COMGATE_API_URL || 'https://payments.comgate.cz/v2.0';
    this.merchant = process.env.COMGATE_MERCHANT_ID;
    this.secret = process.env.COMGATE_SECRET;
    this.testMode = process.env.COMGATE_TEST_MODE === 'true';
    this.mockMode = process.env.COMGATE_MOCK_MODE === 'true';

    // Log configuration for debugging
    logger.info('Comgate client initialized', {
      baseUrl: this.baseUrl,
      merchant: this.merchant ? `${this.merchant.substring(0, 3)}***` : 'not set',
      secret: this.secret ? `${this.secret.substring(0, 8)}***` : 'not set',
      testMode: this.testMode,
      mockMode: this.mockMode
    });

    // Debug: Log all environment variables related to Comgate
    logger.info('Environment variables debug', {
      COMGATE_MERCHANT_ID: process.env.COMGATE_MERCHANT_ID ? 'set' : 'not set',
      COMGATE_SECRET: process.env.COMGATE_SECRET ? 'set' : 'not set',
      COMGATE_TEST_MODE: process.env.COMGATE_TEST_MODE,
      COMGATE_MOCK_MODE: process.env.COMGATE_MOCK_MODE
    });

    if (!this.merchant || !this.secret) {
      logger.warn('Comgate credentials not configured - using mock mode');
      this.mockMode = true;
    }
  }

  /**
   * Get authorization header for Comgate API
   * @returns {string} Base64 encoded authorization header
   */
  getAuthHeader() {
    const credentials = `${this.merchant}:${this.secret}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Make API call to Comgate
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} API response
   */
  async makeApiCall(endpoint, method = 'GET', data = null) {
    // Mock mode for testing when real credentials are not available
    if (this.mockMode) {
      return this.mockApiCall(endpoint, method, data);
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;

      const options = {
        method,
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      logger.info('Making Comgate API call', {
        endpoint,
        method,
        testMode: this.testMode
      });

      const response = await fetch(url, options);

      // Check if response is empty or not JSON
      const responseText = await response.text();
      if (!responseText.trim()) {
        logger.warn('Empty response from Comgate API', { endpoint });
        return { code: 0, message: 'Empty response', methods: [] };
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Failed to parse Comgate API response', {
          endpoint,
          responseText: responseText.substring(0, 200),
          parseError: parseError.message
        });
        throw new Error(`Invalid JSON response from Comgate API: ${parseError.message}`);
      }

      if (result.code !== undefined && result.code !== 0) {
        logger.error('Comgate API error', {
          code: result.code,
          message: result.message,
          endpoint
        });
        throw new Error(`Comgate API error: ${result.message} (code: ${result.code})`);
      }

      logger.info('Comgate API call successful', { endpoint, transId: result.transId });
      return result;

    } catch (error) {
      logger.error('Comgate API call failed', {
        endpoint,
        method,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Mock API call for testing purposes
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Mock API response
   */
  async mockApiCall(endpoint, method = 'GET', data = null) {
    logger.info('Making mock Comgate API call', {
      endpoint,
      method,
      mockMode: true
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (endpoint === '/payment.json' && method === 'POST') {
      // Mock payment creation
      const transId = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      return {
        code: 0,
        message: 'OK',
        transId,
        redirect: `https://payments.comgate.cz/client/instructions/index?id=${transId}`
      };
    }

    if (endpoint.includes('/payment/transId/') && method === 'GET') {
      // Mock payment status
      const transId = endpoint.split('/')[3].replace('.json', '');
      return {
        code: 0,
        message: 'OK',
        test: 'true',
        price: data?.price || 69000,
        curr: 'CZK',
        label: 'Test Payment',
        refId: data?.refId || 'test-order',
        method: 'CARD_CZ_CSOB_2',
        email: data?.email || 'test@example.com',
        transId,
        status: 'PENDING', // Could be PAID, CANCELLED, AUTHORIZED
        payerName: 'Test User',
        payerAcc: '****1234',
        fee: '1500',
        vs: '123456789'
      };
    }

    if (endpoint === '/method.json' && method === 'GET') {
      // Mock payment methods
      return {
        methods: [
          {
            id: 'CARD_CZ_CSOB_2',
            group: 'card',
            groupLabel: 'Platební karty',
            name: 'Platební karta',
            name_short: 'Karta',
            description: 'Platba platební kartou',
            logo: 'https://payments.comgate.cz/images/methods/card.png'
          },
          {
            id: 'BANK_CZ_CSOB',
            group: 'bank',
            groupLabel: 'Bankovní převody',
            name: 'ČSOB',
            name_short: 'ČSOB',
            description: 'Bankovní převod ČSOB',
            logo: 'https://payments.comgate.cz/images/methods/csob.png'
          }
        ]
      };
    }

    if (endpoint.includes('/payment/transId/') && method === 'DELETE') {
      // Mock payment cancellation
      return {
        code: 0,
        message: 'OK'
      };
    }

    if (endpoint === '/refund.json' && method === 'POST') {
      // Mock refund
      return {
        code: 0,
        message: 'OK'
      };
    }

    if (endpoint === '/recurring.json' && method === 'POST') {
      // Mock recurring payment
      const transId = `MOCK-REC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      return {
        code: 0,
        message: 'OK',
        transId
      };
    }

    // Default mock response
    return {
      code: 0,
      message: 'OK (Mock Mode)'
    };
  }

  /**
   * Create payment in Comgate
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment creation result
   */
  async createPayment(paymentData) {
    const {
      price,
      currency = 'CZK',
      label,
      refId,
      email,
      fullName,
      phone,
      method = 'ALL',
      country = 'CZ',
      lang = 'cs',
      returnUrl,
      cancelUrl,
      pendingUrl
    } = paymentData;

    // Validate required parameters
    if (!returnUrl) {
      throw new Error('returnUrl is required for Comgate payment');
    }
    if (!email) {
      throw new Error('email is required for Comgate payment');
    }
    if (!price || price <= 0) {
      throw new Error('price must be greater than 0');
    }

    logger.info('Creating Comgate payment with data', {
      price,
      currency,
      label,
      refId,
      email,
      returnUrl,
      cancelUrl,
      pendingUrl,
      testMode: this.testMode
    });

    const requestData = {
      // Required parameters
      merchant: this.merchant,
      test: this.testMode ? 'true' : 'false',
      country,
      price: Math.round(price * 100), // Convert to cents (haléře)
      curr: currency,
      label: label.substring(0, 16), // Max 16 characters according to API
      refId: refId.toString(), // Reference ID as string
      method,
      email,
      fullName,
      phone,
      lang,
      // Payment creation mode - always use background creation
      prepareOnly: 'true',
      secret: this.secret,
      // URL settings for payment callbacks
      url_paid: returnUrl,
      url_cancelled: cancelUrl,
      url_pending: pendingUrl,
      // Server-to-server callback URL for transaction notifications
      url_notify: `${process.env.MIDDLEWARE_URL || 'http://localhost:3005'}/api/payments/comgate-callback`,
      // Additional recommended parameters
      delivery: 'ELECTRONIC_DELIVERY', // For VPS services
      category: 'OTHER' // For services/digital products
    };

    logger.info('Creating Comgate payment', {
      refId,
      price,
      currency,
      testMode: this.testMode
    });

    const result = await this.makeApiCall('/payment.json', 'POST', requestData);

    // Update return URLs with transaction ID after payment creation
    if (result.success !== false && result.transId) {
      logger.info('✅ ComGate payment created, updating return URLs with transaction ID', {
        transId: result.transId,
        refId
      });

      // Store transaction data for return URL processing
      global.comgateTransactions = global.comgateTransactions || new Map();
      global.comgateTransactions.set(refId, {
        transId: result.transId,
        refId,
        status: 'PENDING',
        price,
        curr: currency,
        method: 'COMGATE',
        timestamp: new Date().toISOString(),
        source: 'payment_creation'
      });

      // Also store by transaction ID
      global.comgateTransactions.set(result.transId, {
        transId: result.transId,
        refId,
        status: 'PENDING',
        price,
        curr: currency,
        method: 'COMGATE',
        timestamp: new Date().toISOString(),
        source: 'payment_creation'
      });

      logger.info('✅ Transaction data stored for return URL processing', {
        transId: result.transId,
        refId,
        storageKeys: [refId, result.transId]
      });
    }

    return result;
  }

  /**
   * Get payment status
   * @param {string} transId - Transaction ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(transId) {
    logger.info('Getting Comgate payment status', { transId });
    return await this.makeApiCall(`/payment/transId/${transId}.json`);
  }

  /**
   * Cancel payment
   * @param {string} transId - Transaction ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPayment(transId) {
    logger.info('Cancelling Comgate payment', { transId });
    return await this.makeApiCall(`/payment/transId/${transId}.json`, 'DELETE');
  }

  /**
   * Refund payment
   * @param {string} transId - Transaction ID
   * @param {number} amount - Refund amount in original currency
   * @param {string} refId - Refund reference ID
   * @returns {Promise<Object>} Refund result
   */
  async refundPayment(transId, amount, refId = null) {
    const requestData = {
      transId,
      amount: Math.round(amount * 100), // Convert to cents
      test: this.testMode
    };

    if (refId) {
      requestData.refId = refId;
    }

    logger.info('Refunding Comgate payment', { 
      transId, 
      amount, 
      refId, 
      testMode: this.testMode 
    });

    return await this.makeApiCall('/refund.json', 'POST', requestData);
  }

  /**
   * Get available payment methods
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Available payment methods
   */
  async getPaymentMethods(options = {}) {
    const {
      lang = 'cs',
      curr = 'CZK',
      country = 'CZ',
      price = null
    } = options;

    const params = new URLSearchParams({
      lang,
      curr,
      country
    });

    if (price) {
      params.append('price', Math.round(price * 100));
    }

    logger.info('Getting Comgate payment methods', { lang, curr, country, price });
    
    const endpoint = `/method.json?${params.toString()}`;
    return await this.makeApiCall(endpoint);
  }

  /**
   * Create recurring payment
   * @param {Object} recurringData - Recurring payment data
   * @returns {Promise<Object>} Recurring payment result
   */
  async createRecurringPayment(recurringData) {
    const {
      price,
      currency = 'CZK',
      label,
      refId,
      initRecurringId,
      name = null
    } = recurringData;

    const requestData = {
      test: this.testMode,
      price: Math.round(price * 100), // Convert to cents
      curr: currency,
      label: label.substring(0, 16), // Max 16 characters
      refId,
      initRecurringId
    };

    if (name) {
      requestData.name = name;
    }

    logger.info('Creating Comgate recurring payment', { 
      refId, 
      price, 
      currency, 
      initRecurringId,
      testMode: this.testMode 
    });

    return await this.makeApiCall('/recurring.json', 'POST', requestData);
  }

  /**
   * Check if Comgate is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!(this.merchant && this.secret);
  }

  /**
   * Get configuration info
   * @returns {Object} Configuration information
   */
  getConfigInfo() {
    return {
      configured: this.isConfigured(),
      testMode: this.testMode,
      mockMode: this.mockMode,
      merchant: this.merchant ? `${this.merchant.substring(0, 3)}***` : 'Not set',
      baseUrl: this.baseUrl
    };
  }
}

module.exports = ComgateClient;
