/**
 * HostBill API Client
 * Secure client for communicating with HostBill Admin API
 */

const axios = require('axios');
const https = require('https');
const logger = require('../utils/logger');

class HostBillClient {
  constructor() {
    this.apiUrl = process.env.HOSTBILL_API_URL;
    this.apiId = process.env.HOSTBILL_API_ID;
    this.apiKey = process.env.HOSTBILL_API_KEY;
    this.baseUrl = process.env.HOSTBILL_BASE_URL;

    if (!this.apiUrl || !this.apiId || !this.apiKey) {
      throw new Error('HostBill API credentials are not configured');
    }

    // Create axios instance with SSL bypass for development
    this.httpClient = axios.create({
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Only for development
      })
    });

    logger.info('HostBill client initialized', {
      apiUrl: this.apiUrl,
      apiId: this.apiId,
      hasCredentials: !!(this.apiId && this.apiKey)
    });
  }

  /**
   * Make API call to HostBill using proven working method from test portal
   * @param {Object} params - API parameters
   * @returns {Promise<Object>} API response
   */
  async makeApiCall(params) {
    try {
      const payload = {
        api_id: this.apiId,
        api_key: this.apiKey,
        ...params
      };

      logger.debug('Making HostBill API call', {
        call: params.call,
        hasApiId: !!payload.api_id,
        hasApiKey: !!payload.api_key,
        apiId: this.apiId,
        apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'missing'
      });

      // Create form data manually
      const formData = new URLSearchParams();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key]);
        }
      });

      logger.debug('Form data being sent', {
        formDataString: formData.toString(),
        keys: Array.from(formData.keys())
      });

      const response = await this.httpClient.post(this.apiUrl, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data && response.data.success === false) {
        throw new Error(response.data.error || 'HostBill API call failed');
      }

      logger.debug('HostBill API call successful', {
        call: params.call,
        responseSize: JSON.stringify(response.data).length
      });

      return response.data;

    } catch (error) {
      logger.error('HostBill API call failed', {
        call: params.call,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Test connection to HostBill API
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      logger.info('Testing HostBill API connection');
      
      const result = await this.makeApiCall({
        call: 'getAffiliates'
      });

      logger.info('HostBill connection test successful');
      return {
        success: true,
        message: 'Connection successful',
        data: result
      };

    } catch (error) {
      logger.error('HostBill connection test failed', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Get all affiliates
   * @returns {Promise<Object>} Affiliates data
   */
  async getAffiliates() {
    try {
      logger.info('Getting affiliates from HostBill');
      
      const result = await this.makeApiCall({
        call: 'getAffiliates'
      });

      logger.info('Successfully retrieved affiliates', {
        count: result?.affiliates?.length || 0
      });

      return {
        success: true,
        affiliates: result.affiliates || [],
        total: result.affiliates?.length || 0
      };

    } catch (error) {
      logger.error('Failed to get affiliates', { error: error.message });
      throw error;
    }
  }

  /**
   * Get affiliate by ID
   * @param {string} affiliateId - Affiliate ID
   * @returns {Promise<Object>} Affiliate data
   */
  async getAffiliate(affiliateId) {
    try {
      logger.info('Getting affiliate by ID', { affiliateId });
      
      const result = await this.makeApiCall({
        call: 'getAffiliate',
        id: affiliateId
      });

      logger.info('Successfully retrieved affiliate', { affiliateId });

      // Return the affiliate data directly with id property
      return {
        success: true,
        id: result.affiliate.id,
        name: result.affiliate.firstname + ' ' + result.affiliate.lastname,
        email: result.affiliate.email,
        data: result
      };

    } catch (error) {
      logger.error('Failed to get affiliate', { affiliateId, error: error.message });
      throw error;
    }
  }

  /**
   * Get all products
   * @returns {Promise<Object>} Products data
   */
  async getProducts() {
    try {
      logger.info('Getting products from HostBill');
      
      const result = await this.makeApiCall({
        call: 'getProducts'
      });

      logger.info('Successfully retrieved products', {
        count: result?.products?.length || 0
      });

      return {
        success: true,
        products: result.products || [],
        total: result.products?.length || 0
      };

    } catch (error) {
      logger.error('Failed to get products', { error: error.message });
      throw error;
    }
  }

  /**
   * Get products for specific affiliate
   * @param {string} affiliateId - Affiliate ID
   * @returns {Promise<Object>} Products data
   */
  async getAffiliateProducts(affiliateId) {
    try {
      logger.info('Getting products for affiliate', { affiliateId });
      
      const result = await this.makeApiCall({
        call: 'getAffiliateProducts',
        affiliate_id: affiliateId
      });

      logger.info('Successfully retrieved affiliate products', { 
        affiliateId,
        count: result?.products?.length || 0
      });

      return {
        success: true,
        products: result.products || [],
        affiliate_id: affiliateId,
        total: result.products?.length || 0
      };

    } catch (error) {
      logger.error('Failed to get affiliate products', { 
        affiliateId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get payment modules (working HostBill API method)
   * @returns {Promise<Object>} Payment modules data
   */
  async getPaymentMethods() {
    try {
      logger.info('Getting payment modules from HostBill');

      const result = await this.makeApiCall({
        call: 'getPaymentModules'
      });

      logger.info('Successfully retrieved payment modules', {
        count: result?.modules ? Object.keys(result.modules).length : 0
      });

      return {
        success: true,
        modules: result.modules || {},
        total: result.modules ? Object.keys(result.modules).length : 0
      };

    } catch (error) {
      logger.error('Failed to get payment modules', { error: error.message });
      throw error;
    }
  }

  /**
   * Find client by email
   * @param {string} email - Client email
   * @returns {Promise<Object|null>} Client data or null if not found
   */
  async findClientByEmail(email) {
    try {
      logger.info('Finding client by email', { email });

      // Get all clients and filter by exact email match
      const result = await this.makeApiCall({
        call: 'getClients'
      });

      if (result && result.clients) {
        // Convert to array if it's an object
        let clients = result.clients;
        if (typeof clients === 'object' && !Array.isArray(clients)) {
          clients = Object.values(clients);
        }

        // Find client with exact email match
        const client = clients.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());

        if (client) {
          logger.info('Client found by exact email match', { clientId: client.id, email: client.email });
          return client;
        }
      }

      logger.info('No client found with exact email match', { email });
      return null;
    } catch (error) {
      logger.error('Error finding client by email', { email, error: error.message });
      return null;
    }
  }

  /**
   * Alternative method to find client by email using different API calls
   * @param {string} email - Client email
   * @returns {Promise<Object|null>} Client data or null if not found
   */
  async findClientByEmailAlternative(email) {
    try {
      logger.info('Finding client by email (alternative method)', { email });

      // Try method 1: getClients without email filter, then search manually
      const allClientsResult = await this.makeApiCall({
        call: 'getClients',
        limit: 100 // Get recent clients
      });

      if (allClientsResult && allClientsResult.clients) {
        const foundClient = allClientsResult.clients.find(client =>
          client.email && client.email.toLowerCase() === email.toLowerCase()
        );

        if (foundClient) {
          logger.info('Client found via alternative method', {
            clientId: foundClient.id,
            originalEmail: email,
            hostbillEmail: foundClient.email
          });
          // Return with original email from search, not HostBill's modified version
          return {
            ...foundClient,
            email: email, // Use original email from search
            hostbillEmail: foundClient.email // Keep HostBill's email for reference
          };
        }
      }

      // Try method 2: Use getClientDetails if we have any hints
      // This is a fallback that might work in some HostBill configurations
      try {
        const detailsResult = await this.makeApiCall({
          call: 'getClientDetails',
          email: email
        });

        if (detailsResult && detailsResult.client) {
          logger.info('Client found via getClientDetails', {
            clientId: detailsResult.client.id,
            originalEmail: email,
            hostbillEmail: detailsResult.client.email
          });
          // Return with original email from search, not HostBill's modified version
          return {
            ...detailsResult.client,
            email: email, // Use original email from search
            hostbillEmail: detailsResult.client.email // Keep HostBill's email for reference
          };
        }
      } catch (detailsError) {
        logger.debug('getClientDetails failed, continuing with other methods', {
          error: detailsError.message
        });
      }

      logger.info('No client found with alternative methods', { email });
      return null;
    } catch (error) {
      logger.error('Error in alternative client search', { email, error: error.message });
      return null;
    }
  }

  /**
   * Generate random password for new clients
   * @returns {string} Random password
   */
  generateRandomPassword() {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  }

  /**
   * Create client in HostBill or return existing one
   * @param {Object} clientData - Client information
   * @returns {Promise<Object>} Created or found client data
   */
  async createClient(clientData) {
    try {
      // First, try to find existing client
      const existingClient = await this.findClientByEmail(clientData.email);

      if (existingClient) {
        // Verify that existing client data matches input data
        const dataMatches = (
          existingClient.email === clientData.email &&
          existingClient.firstname === clientData.firstName &&
          existingClient.lastname === clientData.lastName
        );

        if (dataMatches) {
          logger.info('Using existing client with matching data', {
            clientId: existingClient.id,
            email: existingClient.email
          });
          return existingClient;
        } else {
          logger.warn('Existing client found but data does not match, creating new client', {
            existingEmail: existingClient.email,
            existingFirstName: existingClient.firstname,
            existingLastName: existingClient.lastname,
            inputEmail: clientData.email,
            inputFirstName: clientData.firstName,
            inputLastName: clientData.lastName
          });
        }
      }

      // If no existing client or data doesn't match, create new one
      logger.info('Creating client in HostBill', {
        email: clientData.email,
        firstName: clientData.firstName,
        lastName: clientData.lastName
      });

      const password = this.generateRandomPassword();
      const result = await this.makeApiCall({
        call: 'addClient',
        firstname: clientData.firstName,
        lastname: clientData.lastName,
        email: clientData.email,
        phonenumber: clientData.phone,
        address1: clientData.address,
        city: clientData.city,
        postcode: clientData.postalCode,
        country: clientData.country,
        state: clientData.state || '',
        companyname: clientData.company || '',
        password: password,
        password2: password, // HostBill requires password confirmation
        currency: process.env.DEFAULT_CURRENCY || 'CZK'
      });

      // Debug log the full response
      logger.debug('HostBill client_add response', { result });

      // Check if HostBill modified the email (common with duplicates)
      if (result.email && result.email !== clientData.email) {
        logger.warn('HostBill modified email address', {
          originalEmail: clientData.email,
          hostbillEmail: result.email,
          possibleDuplicate: true
        });
      }

      // Check for different possible response formats
      const clientId = result.client_id || result.id || result.clientId;

      if (!clientId) {
        // If client creation failed, it might be because client already exists
        // Try to find the client again with a different approach
        logger.warn('No client ID in response, trying to find existing client', { result });

        // Check if the error message indicates client already exists
        const errorMessage = result.error || result.message || JSON.stringify(result);
        if (errorMessage.toLowerCase().includes('already exists') ||
            errorMessage.toLowerCase().includes('duplicate') ||
            errorMessage.toLowerCase().includes('email')) {

          logger.info('Client might already exist, searching again', { email: clientData.email });

          // Try alternative search methods
          const foundClient = await this.findClientByEmailAlternative(clientData.email);
          if (foundClient) {
            // Verify that found client data matches input data
            const dataMatches = (
              foundClient.email === clientData.email &&
              foundClient.firstname === clientData.firstName &&
              foundClient.lastname === clientData.lastName
            );

            if (dataMatches) {
              logger.info('Found existing client via alternative search with matching data', {
                clientId: foundClient.id,
                email: foundClient.email
              });
              return foundClient;
            } else {
              logger.warn('Found existing client but data does not match', {
                foundEmail: foundClient.email,
                foundFirstName: foundClient.firstname,
                foundLastName: foundClient.lastname,
                inputEmail: clientData.email,
                inputFirstName: clientData.firstName,
                inputLastName: clientData.lastName
              });
            }
          }
        }

        logger.error('No client ID in response and no existing client found', { result });
        throw new Error(`Failed to create client - no client ID returned. Response: ${JSON.stringify(result)}`);
      }

      logger.info('Client created successfully', {
        clientId: clientId,
        originalEmail: clientData.email,
        hostbillEmail: result.email || 'not provided'
      });

      // ALWAYS return the original email from billing data, not HostBill's modified version
      return {
        id: clientId,
        email: clientData.email, // Use original email from billing, not HostBill's modified version
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        hostbillEmail: result.email // Keep HostBill's email for reference if needed
      };

    } catch (error) {
      logger.error('Failed to create client', {
        email: clientData.email,
        error: error.message
      });

      // If error suggests client already exists, try to find it
      if (error.message && (
          error.message.toLowerCase().includes('already exists') ||
          error.message.toLowerCase().includes('duplicate') ||
          error.message.toLowerCase().includes('email')
        )) {

        logger.info('Error suggests client exists, trying to find it', { email: clientData.email });
        const existingClient = await this.findClientByEmailAlternative(clientData.email);
        if (existingClient) {
          // Verify that existing client data matches input data
          const dataMatches = (
            existingClient.email === clientData.email &&
            existingClient.firstname === clientData.firstName &&
            existingClient.lastname === clientData.lastName
          );

          if (dataMatches) {
            logger.info('Successfully found existing client after error with matching data', {
              clientId: existingClient.id,
              email: existingClient.email
            });
            return existingClient;
          } else {
            logger.warn('Found existing client but data does not match', {
              existingEmail: existingClient.email,
              existingFirstName: existingClient.firstname,
              existingLastName: existingClient.lastname,
              inputEmail: clientData.email,
              inputFirstName: clientData.firstName,
              inputLastName: clientData.lastName
            });
          }
        }
      }

      throw error;
    }
  }

  /**
   * Create order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Order creation result
   */
  async createOrder(orderData) {
    try {
      logger.info('Creating order in HostBill', {
        productId: orderData.product_id,
        affiliateId: orderData.affiliate_id,
        originalPrice: orderData.price,
        originalAmount: orderData.amount,
        finalPrice: parseFloat(orderData.price) || parseFloat(orderData.amount) || 0
      });
      
      // Transform billing cycle to HostBill format
      let cycle = orderData.billing_cycle || 'monthly';
      if (cycle === 'monthly') cycle = 'm';
      if (cycle === 'quarterly') cycle = 'q';
      if (cycle === 'semiannually') cycle = 's';
      if (cycle === 'annually') cycle = 'a';
      if (cycle === 'biennially') cycle = 'b';
      if (cycle === 'triennially') cycle = 't';

      // Transform parameters to match HostBill API expectations
      const orderParams = {
        call: 'addOrder',
        client_id: orderData.client_id,
        product: orderData.product_id, // HostBill uses 'product' not 'product_id'
        cycle: cycle, // HostBill uses 'cycle' not 'billing_cycle'
        quantity: orderData.quantity || 1,
        payment_method: orderData.payment_method || 'banktransfer',
        currency: orderData.currency || 'CZK',
        notes: orderData.notes || '',
        confirm: 1, // Required for order creation
        invoice_generate: 1, // Generate invoice
        invoice_info: 1, // Include invoice info
        // CRITICAL: Add price and amount for proper invoice generation
        price: parseFloat(orderData.price) || parseFloat(orderData.amount) || 0,
        amount: parseFloat(orderData.amount) || parseFloat(orderData.price) || 0
      };

      // Add domain if provided
      if (orderData.domain) {
        orderParams.domain = orderData.domain;
      }

      // Note: Affiliate assignment is handled separately via setOrderReferrer
      // Do not add affiliate_id to order creation parameters

      // Add config options if provided - transform to proper format
      if (orderData.configoptions && Object.keys(orderData.configoptions).length > 0) {
        // HostBill expects config options as individual parameters like configoption[1]=value
        Object.keys(orderData.configoptions).forEach((key, index) => {
          orderParams[`configoption[${index + 1}]`] = orderData.configoptions[key];
        });
      }

      logger.debug('Transformed order parameters', { orderParams });

      const result = await this.makeApiCall(orderParams);

      logger.info('Successfully created order', { 
        orderId: result.order_id 
      });

      return {
        success: true,
        order_id: result.order_id,
        data: result
      };

    } catch (error) {
      logger.error('Failed to create order', { 
        orderData, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Assign affiliate to order using setOrderReferrer
   * @param {string} orderId - Order ID
   * @param {string} affiliateId - Affiliate ID
   * @returns {Promise<Object>} Assignment result
   */
  async setOrderReferrer(orderId, affiliateId) {
    try {
      logger.info('Assigning order to affiliate using setOrderReferrer', {
        orderId,
        affiliateId
      });

      const result = await this.makeApiCall({
        call: 'setOrderReferrer',
        id: parseInt(orderId), // Convert to number
        referral: parseInt(affiliateId) // Convert to number
      });

      logger.info('Order assigned to affiliate successfully', {
        orderId,
        affiliateId,
        result
      });

      return {
        success: true,
        orderId,
        affiliateId,
        message: 'Order assigned to affiliate successfully',
        result
      };

    } catch (error) {
      logger.error('Failed to assign order to affiliate', {
        orderId,
        affiliateId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get order details by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrder(orderId) {
    try {
      logger.info('Getting order details', { orderId });

      const result = await this.makeApiCall({
        call: 'getOrderDetails',
        id: orderId
      });

      logger.info('Successfully retrieved order details', { orderId });

      return {
        success: true,
        order: result.details || result,
        id: orderId
      };

    } catch (error) {
      logger.error('Failed to get order details', { orderId, error: error.message });
      throw error;
    }
  }

  /**
   * Get invoice details by ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice details
   */
  async getInvoice(invoiceId) {
    try {
      logger.info('Getting invoice details', { invoiceId });

      const result = await this.makeApiCall({
        call: 'getInvoice',
        id: invoiceId
      });

      logger.info('Successfully retrieved invoice details', { invoiceId });

      return {
        success: true,
        invoice: result,
        id: invoiceId
      };

    } catch (error) {
      logger.error('Failed to get invoice details', { invoiceId, error: error.message });
      throw error;
    }
  }

  /**
   * Get invoice status and payment information
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice status details
   */
  async getInvoiceStatus(invoiceId) {
    try {
      logger.info('Getting invoice status', { invoiceId });

      const invoiceResult = await this.getInvoice(invoiceId);

      if (invoiceResult.success && invoiceResult.invoice) {
        const invoice = invoiceResult.invoice;
        const isPaid = invoice.status === 'Paid' || invoice.status === 'paid' || invoice.status === 'PAID';

        logger.info('Invoice status retrieved', {
          invoiceId,
          status: invoice.status,
          total: invoice.total,
          credit: invoice.credit,
          isPaid
        });

        return {
          success: true,
          invoiceId,
          status: invoice.status,
          total: parseFloat(invoice.total || 0),
          credit: parseFloat(invoice.credit || 0),
          currency: invoice.currency || 'CZK',
          isPaid,
          invoice
        };
      } else {
        throw new Error('Invoice not found or invalid response');
      }

    } catch (error) {
      logger.error('Failed to get invoice status', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Add payment to invoice
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment result
   */
  async addInvoicePayment(paymentData) {
    try {
      const {
        invoice_id,
        amount,
        currency = 'CZK',
        date,
        method,
        transaction_id,
        notes
      } = paymentData;

      logger.info('Adding payment to invoice', {
        invoice_id,
        amount,
        currency,
        method,
        transaction_id
      });

      // Use working HostBill API call (addPayment is not supported)
      const result = await this.makeApiCall({
        call: 'addInvoicePayment',
        id: invoice_id,                    // Use 'id' instead of 'invoice_id'
        amount,
        paymentmodule: method || 'comgate', // Use 'paymentmodule' instead of 'method'
        fee: 0,
        date,
        transnumber: transaction_id,       // Use 'transnumber' instead of 'transaction_id'
        notes,
        send_email: 1  // Send email notification when payment is added
      });

      logger.info('Payment added to invoice successfully', {
        invoice_id,
        payment_id: result.payment_id
      });

      return {
        success: true,
        payment_id: result.payment_id,
        result
      };

    } catch (error) {
      logger.error('Failed to add payment to invoice', {
        invoice_id: paymentData.invoice_id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Mark invoice as paid by adding full payment
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Mark as paid result
   */
  async markInvoiceAsPaid(invoiceId) {
    try {
      logger.info('Marking invoice as paid by adding payment', { invoiceId });

      // First get invoice details to know the amount (if getInvoice worked)
      // Since getInvoice is not supported, we'll add a payment with a reasonable amount
      // This should be called after addInvoicePayment with the correct amount

      logger.info('Invoice payment should be added via addInvoicePayment method', {
        invoiceId,
        note: 'markInvoiceAsPaid is not supported by HostBill API'
      });

      return {
        success: true,
        message: 'Use addInvoicePayment method instead',
        result: { info: ['markInvoiceAsPaid is not supported - use addInvoicePayment'] }
      };

    } catch (error) {
      logger.error('Failed to mark invoice as paid', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create order with multiple products using Draft Order API (OFFICIAL APPROACH)
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createDraftOrder(orderData) {
    try {
      const {
        client_id,
        client_email,
        items,
        payment_method = 'banktransfer',
        currency = 'CZK',
        affiliate_id,
        send_email = 0,
        status = 'pending'
      } = orderData;

      logger.info('Creating draft order with multiple products (OFFICIAL API)', {
        clientId: client_id,
        clientEmail: client_email,
        itemsCount: Array.isArray(items) ? items.length : 0,
        paymentMethod: payment_method,
        currency,
        affiliateId: affiliate_id
      });

      // Step 1: Create empty order draft
      logger.info('Step 1: Creating order draft');
      const draftResult = await this.makeApiCall({
        call: 'createOrderDraft',
        client_id: client_id
      });

      if (!draftResult || !draftResult.draft_id) {
        throw new Error('Failed to create order draft');
      }

      const draftId = draftResult.draft_id;
      logger.info('Order draft created', { draftId });

      // Step 2: Add each product to the draft (call API multiple times for quantity > 1)
      if (Array.isArray(items)) {
        for (const item of items) {
          const productId = item.product_id || item.productId;
          const quantity = item.quantity || item.qty || 1;

          logger.info('Adding item to draft', {
            draftId,
            productId,
            quantity,
            itemName: item.description || item.name,
            note: `Will call addOrderDraftItem ${quantity} times`
          });

          // Get billing cycle from item or default to monthly
          let billingCycle = item.cycle || item.billing_cycle || 'm';

          // Transform billing cycle to HostBill format if needed
          const cycleMapping = {
            'monthly': 'm',
            'quarterly': 'q',
            'semiannually': 's',
            'annually': 'a',
            'biennially': 'b',
            'triennially': 't',
            // Also handle direct values
            'm': 'm',
            'q': 'q',
            's': 's',
            'a': 'a',
            'b': 'b',
            't': 't'
          };

          billingCycle = cycleMapping[billingCycle] || 'm';

          logger.info('Billing cycle for item', {
            draftId,
            productId,
            originalCycle: item.cycle || item.billing_cycle,
            mappedCycle: billingCycle,
            itemData: item
          });

          // Call addOrderDraftItem multiple times for each quantity
          for (let i = 0; i < quantity; i++) {
            logger.info(`Adding item ${i + 1}/${quantity} to draft`, {
              draftId,
              productId,
              iteration: i + 1,
              totalQuantity: quantity,
              billingCycle
            });

            const itemResult = await this.makeApiCall({
              call: 'addOrderDraftItem',
              id: draftId,
              prod_type: 'service',
              product: productId,
              cycle: billingCycle, // Use billing cycle from item
              qty: 1 // Always 1, we call the API multiple times for quantity
            });

            if (!itemResult || !itemResult.success) {
              throw new Error(`Failed to add item ${productId} (${i + 1}/${quantity}) to draft: ${itemResult?.error || 'Unknown error'}`);
            }

            logger.info(`Item ${i + 1}/${quantity} added to draft successfully`, {
              draftId,
              productId,
              itemId: itemResult.item_id,
              iteration: i + 1
            });
          }

          logger.info('All quantities added for product', {
            draftId,
            productId,
            totalQuantity: quantity,
            itemName: item.description || item.name
          });
        }
      }

      // Step 3: Convert draft to actual order
      logger.info('Step 3: Converting draft to order', { draftId });
      // Convert draft order - HostBill will auto-create invoice as "Paid"
      const convertParams = {
        call: 'convertOrderDraft',
        id: draftId,
        keep_draft: 0, // Delete draft after conversion
        module: payment_method
      };

      // Note: affiliate_id removed from convertOrderDraft as it doesn't work there
      // Affiliate assignment will be handled via setOrderReferrer after order creation

      logger.info('Converting draft with parameters', {
        draftId,
        paymentMethod: payment_method,
        convertParams
      });

      const convertResult = await this.makeApiCall(convertParams);

      // Get order details to find invoice_id if not returned by convertOrderDraft
      let actualInvoiceId = convertResult.invoice_id;

      if (!actualInvoiceId || actualInvoiceId === '0') {
        try {
          const orderDetails = await this.makeApiCall({
            call: 'getOrderDetails',
            id: convertResult.order_id
          });

          if (orderDetails.details && orderDetails.details.invoice_id && orderDetails.details.invoice_id !== '0') {
            actualInvoiceId = orderDetails.details.invoice_id;
            logger.info('Found invoice_id from order details', {
              orderId: convertResult.order_id,
              invoiceId: actualInvoiceId
            });
          }
        } catch (orderError) {
          logger.warn('Failed to get order details for invoice lookup', {
            orderId: convertResult.order_id,
            error: orderError.message
          });
        }
      }

      // If invoice was created and auto-marked as "Paid", reset it to "Unpaid"
      // This preserves billing cycles while ensuring proper payment flow
      if (actualInvoiceId && actualInvoiceId !== '0') {
        logger.info('Resetting auto-paid invoice to Unpaid status', {
          draftId,
          orderId: convertResult.order_id,
          invoiceId: actualInvoiceId,
          paymentMethod: payment_method
        });

        try {
          const statusResult = await this.makeApiCall({
            call: 'setInvoiceStatus',
            id: actualInvoiceId,
            status: 'Unpaid'
          });

          logger.info('Invoice status reset to Unpaid successfully', {
            invoiceId: actualInvoiceId,
            statusResult
          });
        } catch (statusError) {
          logger.warn('Failed to reset invoice status to Unpaid', {
            invoiceId: actualInvoiceId,
            error: statusError.message
          });
        }
      }

      if (!convertResult || !convertResult.order_id) {
        throw new Error('Failed to convert draft to order');
      }

      // Debug log the convert result to see what's available
      logger.info('Draft order created successfully', {
        orderId: convertResult.order_id,
        invoiceId: convertResult.invoice_id,
        draftId: draftId,
        itemsAdded: items?.length || 0,
        clientId: client_id,
        convertResultKeys: Object.keys(convertResult || {}),
        fullConvertResult: convertResult
      });

      return {
        success: true,
        order_id: convertResult.order_id,
        invoice_id: convertResult.invoice_id, // May be available from convert result
        order: {
          success: true,
          order_id: convertResult.order_id,
          draft_id: draftId,
          items_added: items?.length || 0,
          convert_result: convertResult
        }
      };

    } catch (error) {
      logger.error('Failed to create combined order', {
        clientId: orderData.client_id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create invoice with multiple items (DEPRECATED - use createCombinedOrder instead)
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoice(invoiceData) {
    logger.warn('createInvoice is deprecated, use createCombinedOrder for better HostBill integration');

    try {
      const {
        client_id,
        status = 'Unpaid',
        items,
        payment_method = 'banktransfer',
        currency = 'CZK',
        total
      } = invoiceData;

      logger.info('Creating invoice with multiple items', {
        clientId: client_id,
        itemsCount: Array.isArray(items) ? items.length : 0,
        total,
        currency
      });

      const result = await this.makeApiCall({
        call: 'addInvoice',
        client_id,
        status,
        items: typeof items === 'string' ? items : JSON.stringify(items),
        payment_method,
        currency,
        total
      });

      if (result && !result.error) {
        logger.info('Invoice created successfully', {
          invoiceId: result.invoice_id,
          clientId: client_id
        });

        return {
          success: true,
          invoice_id: result.invoice_id,
          invoice: result
        };
      } else {
        throw new Error(result?.error || 'Failed to create invoice');
      }

    } catch (error) {
      logger.error('Failed to create invoice', {
        clientId: invoiceData.client_id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update invoice status
   * @param {string} invoiceId - Invoice ID
   * @param {string} status - New status (Paid, Unpaid, Cancelled, etc.)
   * @returns {Promise<Object>} Update result
   */
  async updateInvoiceStatus(invoiceId, status = 'Paid') {
    try {
      logger.info('Updating invoice status', { invoiceId, status });

      // Use correct HostBill API call: setInvoiceStatus (this is the working one!)
      const result = await this.makeApiCall({
        call: 'setInvoiceStatus',
        id: invoiceId,  // Use 'id' parameter
        status: status
      });

      logger.info('Invoice status updated successfully', {
        invoiceId,
        status,
        result
      });

      return {
        success: true,
        result
      };

    } catch (error) {
      logger.error('Failed to update invoice status', {
        invoiceId,
        status,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Capture payment - Add payment to invoice (marks invoice as paid)
   * This moves the order lifecycle from "Capture Payment" to "Provision"
   * @param {Object} paymentData - Payment capture data
   * @returns {Promise<Object>} Capture result
   */
  async capturePayment(paymentData) {
    const {
      invoice_id,
      amount,
      module = 'BankTransfer',
      trans_id,
      note = 'Payment captured via API'
    } = paymentData;

    try {
      // Generate unique transaction ID if not provided
      const transactionId = trans_id || `CAPTURE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Capturing payment for invoice', {
        service: 'hostbill-client',
        invoice_id,
        amount,
        module,
        transactionId
      });

      // Add payment to invoice (this is the "Capture" action)
      // Use the working HostBill API call format
      const result = await this.makeApiCall({
        call: 'addInvoicePayment',
        id: invoice_id,                    // Use 'id' instead of 'invoice_id'
        amount: parseFloat(amount).toFixed(2),
        paymentmodule: module,             // Use 'paymentmodule' instead of 'module'
        fee: 0,
        transnumber: transactionId,        // Use 'transnumber' instead of 'trans_id'
        notes: note,
        send_email: 1  // Send email notification when payment is added
      });

      if (result && !result.error) {
        logger.info('Payment captured successfully', {
          service: 'hostbill-client',
          invoice_id,
          amount,
          transactionId
        });

        return {
          success: true,
          message: `Payment of ${amount} successfully captured for invoice ${invoice_id}`,
          data: {
            invoice_id: invoice_id,
            amount: parseFloat(amount),
            transaction_id: transactionId,
            payment_module: module,
            note: note,
            captured_at: new Date().toISOString()
          },
          hostbill_result: result
        };
      } else {
        const errorMessage = result?.error || 'Unknown error occurred during payment capture';

        logger.error('Failed to capture payment', {
          service: 'hostbill-client',
          invoice_id,
          amount,
          transactionId,
          error: errorMessage
        });

        return {
          success: false,
          error: 'Failed to capture payment',
          details: errorMessage,
          hostbill_result: result
        };
      }

    } catch (error) {
      logger.error('Capture payment error', {
        service: 'hostbill-client',
        invoice_id,
        amount,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Activate order (set order status to Active)
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Activation result
   */
  async activateOrder(orderId) {
    try {
      logger.info('Activating order', {
        service: 'hostbill-client',
        orderId
      });

      const result = await this.makeApiCall({
        call: 'setOrderActive',
        id: orderId
      });

      if (result && result.success) {
        logger.info('Order activated successfully', {
          service: 'hostbill-client',
          orderId,
          result: result.info
        });

        return {
          success: true,
          orderId,
          result: result.info
        };
      } else {
        const errorMessage = result?.error || 'Unknown error occurred during order activation';

        logger.error('Failed to activate order', {
          service: 'hostbill-client',
          orderId,
          error: errorMessage
        });

        return {
          success: false,
          error: 'Failed to activate order',
          details: errorMessage,
          hostbill_result: result
        };
      }

    } catch (error) {
      logger.error('Order activation error', {
        service: 'hostbill-client',
        orderId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status (Active, Pending, Cancelled, etc.)
   * @returns {Promise<Object>} Status update result
   */
  async setOrderStatus(orderId, status) {
    try {
      logger.info('Setting order status', {
        service: 'hostbill-client',
        orderId,
        status
      });

      const result = await this.makeApiCall({
        call: 'setOrderStatus',
        id: orderId,
        status: status
      });

      if (result && result.success) {
        logger.info('Order status updated successfully', {
          service: 'hostbill-client',
          orderId,
          status,
          result: result.info
        });

        return {
          success: true,
          orderId,
          status,
          result: result.info
        };
      } else {
        const errorMessage = result?.error || 'Unknown error occurred during order status update';

        logger.error('Failed to update order status', {
          service: 'hostbill-client',
          orderId,
          status,
          error: errorMessage
        });

        return {
          success: false,
          error: 'Failed to update order status',
          details: errorMessage,
          hostbill_result: result
        };
      }

    } catch (error) {
      logger.error('Order status update error', {
        service: 'hostbill-client',
        orderId,
        status,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Authorize payment for order (complete the Authorize Payment step in order lifecycle)
   * This typically involves activating the order after successful payment
   * @param {string} orderId - Order ID
   * @param {string} transactionId - Transaction ID from payment gateway
   * @returns {Promise<Object>} Authorization result
   */
  async authorizePayment(orderId, transactionId) {
    try {
      logger.info('Authorizing payment for order', {
        service: 'hostbill-client',
        orderId,
        transactionId
      });

      // Step 1: Activate the order (this completes the "Authorize Payment" step)
      const activationResult = await this.activateOrder(orderId);

      if (activationResult.success) {
        logger.info('Payment authorized successfully - order activated', {
          service: 'hostbill-client',
          orderId,
          transactionId,
          activationResult: activationResult.result
        });

        return {
          success: true,
          orderId,
          transactionId,
          action: 'order_activated',
          result: activationResult.result
        };
      } else {
        logger.error('Failed to authorize payment - order activation failed', {
          service: 'hostbill-client',
          orderId,
          transactionId,
          error: activationResult.error
        });

        return {
          success: false,
          error: 'Failed to authorize payment',
          details: activationResult.error,
          orderId,
          transactionId
        };
      }

    } catch (error) {
      logger.error('Payment authorization error', {
        service: 'hostbill-client',
        orderId,
        transactionId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = HostBillClient;
