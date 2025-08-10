// Order creation API with real HostBill integration
const HostBillClient = require('../../../lib/hostbill-client');
const OrderProcessor = require('../../../lib/order-processor');
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    logger.info('Order creation API called', { 
      hasOrderData: !!req.body,
      orderType: req.body?.type || 'unknown'
    });

    const orderData = req.body;

    // Validate required fields
    if (!orderData) {
      return res.status(400).json({
        success: false,
        error: 'Order data is required',
        timestamp: new Date().toISOString()
      });
    }

    const hostbillClient = new HostBillClient();
    const orderProcessor = new OrderProcessor(hostbillClient);

    let result;

    // Process different types of orders
    if (orderData.type === 'complete' && orderData.customer && orderData.items) {
      // Complete order with customer and multiple items
      result = await orderProcessor.processCompleteOrder(orderData);
    } else if (orderData.product_id) {
      // Simple order with single product
      result = await orderProcessor.processSimpleOrder(orderData);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data. Either provide complete order with customer and items, or simple order with product_id',
        timestamp: new Date().toISOString()
      });
    }

    if (result.success) {
      logger.info('Order processed successfully', {
        processingId: result.processingId,
        ordersCreated: result.orders?.length || 1
      });

      // Format response in requested format
      const formattedResponse = {
        success: true,
        processingId: result.processingId,
        timestamp: new Date().toISOString(),
        affiliate: result.affiliate ? {
          id: result.affiliate.id,
          name: result.affiliate.name,
          status: result.affiliate.data?.affiliate?.status || 'active'
        } : null,
        orders: result.orders?.map(order => ({
          orderId: order.orderId || order.hostbillOrderId,
          orderNumber: order.orderDetails?.number || null,
          invoiceId: order.invoiceId,
          product: order.productName,
          price: order.price || 0,
          currency: order.currency || 'CZK',
          priceFormatted: `${order.price || 0} ${order.currency || 'CZK'}`,
          status: order.status,
          details: {
            cloudVpsProductId: order.cloudVpsProductId,
            hostbillProductId: order.hostbillProductId,
            domain: order.domain,
            quantity: order.quantity
          }
        })) || [],
        summary: {
          totalOrders: result.orders?.length || 0,
          clientId: result.client?.id,
          affiliateAssigned: !!result.affiliate
        },
        // Include raw data for debugging
        raw: result
      };

      // Debug log the response structure
      logger.info('📤 Middleware API response structure', {
        ordersCount: formattedResponse.orders?.length || 0,
        firstOrder: formattedResponse.orders?.[0] ? {
          orderId: formattedResponse.orders[0].orderId,
          invoiceId: formattedResponse.orders[0].invoiceId,
          product: formattedResponse.orders[0].product
        } : null,
        rawOrdersCount: result.orders?.length || 0,
        rawFirstOrder: result.orders?.[0] ? {
          orderId: result.orders[0].orderId,
          invoiceId: result.orders[0].invoiceId,
          hostbillOrderId: result.orders[0].hostbillOrderId
        } : null
      });

      res.status(200).json(formattedResponse);
    } else {
      logger.warn('Order processing failed', { 
        processingId: result.processingId,
        errors: result.errors
      });

      res.status(400).json({
        success: false,
        ...result,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Order creation API error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
