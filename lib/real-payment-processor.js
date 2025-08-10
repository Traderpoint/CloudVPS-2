/**
 * Real Payment Processor for CloudVPS
 * Based on test-complete-real-flow.js logic
 * Handles complete payment workflow from order creation to completion
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

class RealPaymentProcessor {
  constructor() {
    this.baseUrl = BASE_URL;
    this.middlewareUrl = MIDDLEWARE_URL;
  }

  /**
   * Initialize payment for real order
   * @param {Object} orderData - Order data from CloudVPS
   * @returns {Promise<Object>} Payment initialization result
   */
  async initializePayment(orderData) {
    try {
      console.log('🚀 RealPaymentProcessor: Initializing payment for order:', orderData.orderId);

      const paymentData = {
        orderId: orderData.orderId,
        invoiceId: orderData.invoiceId,
        method: orderData.paymentMethod || orderData.method || 'comgate', // Support both paymentMethod and method
        amount: parseFloat(orderData.amount),
        currency: orderData.currency || 'CZK',
        customerData: {
          email: orderData.customerEmail,
          name: orderData.customerName,
          phone: orderData.customerPhone
        },
        testFlow: orderData.testMode || false,
        returnUrl: `${this.baseUrl}/payment-complete`,
        cancelUrl: `${this.baseUrl}/payment-cancelled`,
        // Additional order context
        billingPeriod: orderData.billingPeriod,
        billingCycle: orderData.billingCycle,
        selectedOS: orderData.selectedOS,
        selectedApps: orderData.selectedApps,
        appliedPromo: orderData.appliedPromo
      };

      console.log('📤 Calling payment initialization API with real order data...');

      const response = await fetch(`${this.baseUrl}/api/middleware/initialize-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`Payment initialization failed: HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const realTransactionId = result.transactionId || result.paymentId;
        
        console.log('✅ Payment initialized successfully');
        console.log('   Real Transaction ID:', realTransactionId);
        console.log('   Payment URL:', result.paymentUrl?.substring(0, 60) + '...');

        return {
          success: true,
          transactionId: realTransactionId,
          paymentId: result.paymentId,
          paymentUrl: result.paymentUrl,
          redirectRequired: result.redirectRequired,
          paymentMethod: result.paymentMethod,
          orderId: orderData.orderId,
          invoiceId: orderData.invoiceId,
          amount: orderData.amount,
          currency: orderData.currency
        };
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }

    } catch (error) {
      console.error('❌ RealPaymentProcessor: Payment initialization failed:', error);
      return {
        success: false,
        error: error.message,
        orderId: orderData.orderId,
        invoiceId: orderData.invoiceId
      };
    }
  }

  /**
   * Process payment callback (called by middleware return handler)
   * @param {Object} callbackData - Callback data from payment gateway
   * @returns {Promise<Object>} Callback processing result
   */
  async processPaymentCallback(callbackData) {
    try {
      console.log('🔔 RealPaymentProcessor: Processing payment callback:', callbackData);

      const {
        status,
        transactionId,
        orderId,
        invoiceId,
        amount,
        currency,
        paymentMethod
      } = callbackData;

      if (status === 'success' && transactionId) {
        console.log('✅ Payment successful, processing completion...');

        // Prepare data for payment-complete page
        const successData = {
          transactionId,
          paymentId: transactionId,
          orderId,
          invoiceId,
          amount,
          currency: currency || 'CZK',
          paymentMethod: paymentMethod || 'comgate',
          status: 'success',
          timestamp: new Date().toISOString()
        };

        return {
          success: true,
          redirectUrl: this.buildSuccessUrl(successData),
          paymentData: successData,
          message: 'Payment completed successfully'
        };

      } else if (status === 'cancelled') {
        console.log('⚠️ Payment cancelled by user');

        return {
          success: false,
          redirectUrl: `${this.baseUrl}/payment-cancelled?orderId=${orderId}&reason=cancelled`,
          message: 'Payment was cancelled by user'
        };

      } else {
        throw new Error(`Payment failed: ${status}`);
      }

    } catch (error) {
      console.error('❌ RealPaymentProcessor: Callback processing failed:', error);
      return {
        success: false,
        error: error.message,
        redirectUrl: `${this.baseUrl}/payment-error?error=${encodeURIComponent(error.message)}`
      };
    }
  }

  /**
   * Auto-capture payment (called from payment-complete page)
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Capture result
   */
  async autoCapturePayment(paymentData) {
    try {
      console.log('💰 RealPaymentProcessor: Auto-capturing payment:', paymentData.transactionId);

      // Validate transaction ID (prevent mock IDs)
      if (!paymentData.transactionId || paymentData.transactionId.startsWith('AUTO-')) {
        throw new Error('Invalid transaction ID - cannot capture payment without real transaction ID');
      }

      const captureData = {
        invoice_id: paymentData.invoiceId,
        amount: parseFloat(paymentData.amount),
        module: paymentData.paymentMethod === 'comgate' ? 'Comgate' : 'BankTransfer',
        trans_id: paymentData.transactionId,
        note: `Auto-capture for CloudVPS order ${paymentData.orderId} - Transaction: ${paymentData.transactionId} - Amount: ${paymentData.amount} ${paymentData.currency}`
      };

      const response = await fetch(`${this.middlewareUrl}/api/invoices/capture-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(captureData)
      });

      if (!response.ok) {
        throw new Error(`Auto-capture failed: HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Auto-capture successful');
        return {
          success: true,
          message: result.message,
          transactionId: paymentData.transactionId,
          amount: paymentData.amount,
          invoiceId: paymentData.invoiceId
        };
      } else {
        throw new Error(result.error || 'Auto-capture failed');
      }

    } catch (error) {
      console.error('❌ RealPaymentProcessor: Auto-capture failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark invoice as paid (called from payment-complete page)
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Mark paid result
   */
  async markInvoicePaid(paymentData) {
    try {
      console.log('📋 RealPaymentProcessor: Marking invoice as paid:', paymentData.invoiceId);

      // Validate transaction ID (prevent mock IDs)
      if (!paymentData.transactionId || paymentData.transactionId.startsWith('AUTO-')) {
        throw new Error('Invalid transaction ID - cannot mark invoice as paid without real transaction ID');
      }

      const markPaidData = {
        invoiceId: paymentData.invoiceId,
        transactionId: paymentData.transactionId,
        paymentMethod: paymentData.paymentMethod || 'comgate',
        amount: parseFloat(paymentData.amount),
        currency: paymentData.currency || 'CZK',
        notes: `CloudVPS payment completed - Order: ${paymentData.orderId} - Transaction: ${paymentData.transactionId}`
      };

      const response = await fetch(`${this.middlewareUrl}/api/invoices/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(markPaidData)
      });

      if (!response.ok) {
        throw new Error(`Mark paid failed: HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Invoice marked as paid successfully');
        return {
          success: true,
          message: result.message,
          transactionId: paymentData.transactionId,
          invoiceId: paymentData.invoiceId
        };
      } else {
        throw new Error(result.error || 'Mark paid failed');
      }

    } catch (error) {
      console.error('❌ RealPaymentProcessor: Mark paid failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build success URL with payment data
   * @param {Object} successData - Success data
   * @returns {string} Success URL
   */
  buildSuccessUrl(successData) {
    const params = new URLSearchParams({
      transactionId: successData.transactionId,
      paymentId: successData.paymentId,
      orderId: successData.orderId,
      invoiceId: successData.invoiceId,
      amount: successData.amount,
      currency: successData.currency,
      paymentMethod: successData.paymentMethod,
      status: successData.status
    });

    return `${this.baseUrl}/payment-complete?${params.toString()}`;
  }

  /**
   * Get payment status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(transactionId) {
    try {
      console.log('🔍 RealPaymentProcessor: Getting payment status:', transactionId);

      // This would typically call ComGate status API
      // For now, return basic status based on transaction ID format
      if (transactionId && !transactionId.startsWith('AUTO-')) {
        return {
          success: true,
          transactionId,
          status: 'completed',
          message: 'Payment completed successfully'
        };
      } else {
        return {
          success: false,
          transactionId,
          status: 'invalid',
          message: 'Invalid transaction ID'
        };
      }

    } catch (error) {
      console.error('❌ RealPaymentProcessor: Status check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = RealPaymentProcessor;
