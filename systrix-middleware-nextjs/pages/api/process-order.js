/**
 * Process Order API for Middleware
 * POST /api/process-order
 * Processes complete order workflow including client creation, order creation, and affiliate assignment
 */

const HostBillClient = require('../../lib/hostbill-client');
const OrderProcessor = require('../../lib/order-processor');
const logger = require('../../utils/logger');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    logger.info('🚀 Order processing request received', {
      body: JSON.stringify(req.body, null, 2)
    });

    // Validate required fields
    const { customer, items, paymentMethod = 'banktransfer', total } = req.body;

    if (!customer || !items || !items.length) {
      logger.warn('❌ Missing required fields', { customer: !!customer, items: items?.length });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customer and items are required',
        timestamp: new Date().toISOString()
      });
    }

    // Initialize HostBill client and order processor
    const hostbillClient = new HostBillClient();
    const orderProcessor = new OrderProcessor(hostbillClient);

    // Generate processing ID
    const processingId = `PROC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('🔄 Processing order', {
      processingId,
      customerEmail: customer.email,
      itemsCount: items.length,
      paymentMethod,
      total
    });

    // Process the order
    const result = await orderProcessor.processCompleteOrder({
      processingId,
      customer,
      items,
      addons: req.body.addons || [],
      affiliate: req.body.affiliate,
      paymentMethod,
      total,
      source: req.body.source || 'middleware',
      test_mode: req.body.test_mode || false
    });

    if (result.success) {
      logger.info('✅ Order processed successfully', {
        processingId,
        clientId: result.clientId,
        ordersCount: result.orders?.length || 0
      });

      // Debug log the orders structure
      logger.info('📤 Process-order API response structure', {
        ordersCount: result.orders?.length || 0,
        firstOrder: result.orders?.[0] ? {
          orderId: result.orders[0].orderId,
          invoiceId: result.orders[0].invoiceId,
          type: result.orders[0].type,
          allKeys: Object.keys(result.orders[0])
        } : null
      });

      return res.status(200).json({
        success: true,
        message: 'Order processed successfully',
        processingId,
        clientId: result.clientId,
        orders: result.orders,
        affiliate: result.affiliate,
        client: result.client,
        errors: result.errors || [],
        timestamp: new Date().toISOString()
      });
    } else {
      logger.error('❌ Order processing failed', {
        processingId,
        error: result.error
      });

      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to process order',
        processingId,
        details: result.details,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('❌ Order processing error', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during order processing',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
