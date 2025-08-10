/**
 * Order Processor
 * Handles complete order processing workflow
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const productMapper = require('./product-mapper');
const PohodaSync = require('./pohoda-sync');

class OrderProcessor {
  constructor(hostbillClient) {
    this.hostbillClient = hostbillClient;
    this.pohodaSync = new PohodaSync();
  }

  /**
   * Process complete order workflow
   * @param {Object} orderData - Complete order data from Cloud VPS
   * @returns {Promise<Object>} Processing result
   */
  async processCompleteOrder(orderData) {
    const processingId = uuidv4();
    
    logger.info('Starting order processing', {
      processingId,
      customerEmail: orderData.customer.email,
      itemCount: orderData.items.length,
      hasAffiliate: !!orderData.affiliate
    });

    const result = {
      processingId,
      client: null,
      affiliate: null,
      orders: [],
      errors: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Step 1: Validate affiliate if present
      if (orderData.affiliate && orderData.affiliate.id) {
        logger.info('Validating affiliate', {
          processingId,
          affiliateId: orderData.affiliate.id
        });

        const affiliate = await this.hostbillClient.getAffiliate(orderData.affiliate.id);
        if (affiliate) {
          result.affiliate = affiliate;
          logger.info('Affiliate validated successfully', {
            processingId,
            affiliateId: affiliate.id,
            affiliateName: affiliate.name
          });
        } else {
          logger.warn('Invalid affiliate ID provided', {
            processingId,
            affiliateId: orderData.affiliate.id
          });
          result.errors.push(`Invalid affiliate ID: ${orderData.affiliate.id}`);
        }
      }

      // Step 2: Create client in HostBill
      logger.info('Creating client', {
        processingId,
        customerEmail: orderData.customer.email
      });

      let client;
      try {
        client = await this.hostbillClient.createClient({
          firstName: orderData.customer.firstName,
          lastName: orderData.customer.lastName,
          email: orderData.customer.email,
          phone: orderData.customer.phone,
          address: orderData.customer.address,
          city: orderData.customer.city,
          postalCode: orderData.customer.postalCode,
          country: orderData.customer.country,
          state: orderData.customer.state,
          company: orderData.customer.company
        });

        if (!client || !client.id) {
          throw new Error('Client creation returned invalid data');
        }

        logger.info('Client created/found successfully', {
          processingId,
          clientId: client.id,
          email: client.email
        });

      } catch (clientError) {
        logger.error('Failed to create/find client', {
          processingId,
          email: orderData.customer.email,
          error: clientError.message
        });

        result.errors.push({
          step: 'client_creation',
          error: clientError.message,
          details: 'Failed to create or find customer in HostBill'
        });

        return {
          success: false,
          error: `Failed to create customer: ${clientError.message}`,
          details: result.errors,
          processingId
        };
      }

      result.client = client;

      // Step 3: Note about affiliate assignment
      // Affiliate assignment will be done at order level using setOrderReferrer
      if (result.affiliate && client.id) {
        logger.info('Affiliate validated - will be assigned to orders', {
          processingId,
          clientId: client.id,
          affiliateId: result.affiliate.id
        });
      }

      // Step 4: Create ONE combined order for ALL items
      logger.info('Creating combined order for all items', {
        processingId,
        clientId: client.id,
        itemsCount: orderData.items.length,
        totalAmount: orderData.total || 0
      });

      try {
        // Prepare all items for combined invoice
        const invoiceItems = [];

        for (const item of orderData.items) {
          // Check if productId is already a HostBill ID (from billing.js)
          // or if it needs mapping from CloudVPS ID
          let hostbillProductId = item.productId;

          // If productId looks like CloudVPS ID (1, 2, 3, 4), try to map it
          if (['1', '2', '3', '4', 1, 2, 3, 4].includes(item.productId)) {
            const mappedId = productMapper.mapToHostBill(item.productId);
            if (mappedId) {
              hostbillProductId = mappedId;
              logger.info('Product ID mapped from CloudVPS to HostBill', {
                processingId,
                cloudVpsProductId: item.productId,
                hostbillProductId: mappedId
              });
            } else {
              logger.warn('No mapping found for CloudVPS product ID, using as-is', {
                processingId,
                productId: item.productId
              });
            }
          } else {
            logger.info('Product ID appears to be HostBill ID, using as-is', {
              processingId,
              productId: item.productId
            });
          }

          if (!hostbillProductId) {
            const error = `Invalid product ID: ${item.productId}`;
            logger.error('Product ID validation failed', {
              processingId,
              productId: item.productId,
              error
            });
            result.errors.push(error);
            continue;
          }

          logger.info('Preparing item for combined order', {
            processingId,
            cloudVpsProductId: item.productId,
            hostbillProductId,
            quantity: item.quantity,
            quantityType: typeof item.quantity,
            originalPrice: item.price,
            parsedPrice: parseFloat(item.price) || 0,
            fullItem: item
          });

          // Add item to invoice items array with billing cycle
          invoiceItems.push({
            type: 'product',
            product_id: hostbillProductId,
            description: item.name || `Product ${hostbillProductId}`,
            quantity: item.quantity || 1,
            price: parseFloat(item.price) || 0,
            cycle: item.cycle || item.billing_cycle || 'm', // Include billing cycle
            billing_cycle: item.billing_cycle || item.cycle || 'monthly' // Include full billing cycle name
          });
        }

        // Create draft order with multiple products (OFFICIAL HOSTBILL API)
        if (invoiceItems.length === 0) {
          throw new Error('No valid items found for order creation');
        }

        logger.info('Creating draft order with multiple products (OFFICIAL API)', {
          processingId,
          clientId: client.id,
          itemsCount: invoiceItems.length,
          totalAmount: orderData.total || invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        });

        // Transform invoiceItems to draft order format with billing cycle
        const orderItems = invoiceItems.map(item => ({
          product_id: item.product_id,
          productId: item.product_id,
          quantity: item.quantity,
          qty: item.quantity,
          name: item.description,
          description: item.description,
          cycle: item.cycle || 'm', // Include billing cycle
          billing_cycle: item.billing_cycle || 'monthly', // Include full billing cycle name
          configOptions: item.configOptions || {}
        }));

        const orderParams = {
          client_id: client.id,
          client_email: client.email || orderData.customer?.email,
          items: orderItems,
          payment_method: orderData.paymentMethod || 'banktransfer',
          currency: orderData.currency || 'CZK',
          affiliate_id: result.affiliate?.id,
          send_email: 0,
          status: 'pending'
        };

        logger.info('Draft order parameters', {
          processingId,
          clientId: client.id,
          clientEmail: orderParams.client_email,
          itemsCount: orderItems.length,
          orderItems: orderItems
        });

        const order = await this.hostbillClient.createDraftOrder(orderParams);

        logger.info('Draft order created successfully (OFFICIAL API)', {
          processingId,
          orderId: order.order_id,
          invoiceId: order.invoice_id,
          draftId: order.order?.draft_id,
          clientId: client.id,
          itemsCount: invoiceItems.length
        });

        // Assign affiliate to order if present (handled via API)
        if (result.affiliate && order.order_id) {
          try {
            await this.hostbillClient.assignOrderToAffiliate(order.order_id, result.affiliate.id);
            logger.info('Affiliate assigned to draft order', {
              processingId,
              orderId: order.order_id,
              affiliateId: result.affiliate.id
            });
          } catch (affiliateError) {
            logger.warn('Failed to assign affiliate to order', {
              processingId,
              orderId: order.order_id,
              affiliateId: result.affiliate.id,
              error: affiliateError.message
            });
            result.errors.push(`Failed to assign affiliate to order ${order.order_id}: ${affiliateError.message}`);
          }
        }

        // Get order details for response
        let orderDetails = null;
        let invoiceDetails = null;
        let actualInvoiceId = order.invoice_id; // Start with what we got from convertOrderDraft

        try {
          if (order.order_id) {
            logger.info('Getting draft order details', {
              processingId,
              orderId: order.order_id
            });
            const orderInfo = await this.hostbillClient.getOrder(order.order_id);
            orderDetails = orderInfo.order;

            // Try to get invoice_id from order details if not available from convertOrderDraft
            if (!actualInvoiceId && orderDetails?.invoice_id) {
              actualInvoiceId = orderDetails.invoice_id;
              logger.info('Found invoice_id in order details', {
                processingId,
                orderId: order.order_id,
                invoiceId: actualInvoiceId
              });
            }
          }

          if (actualInvoiceId) {
            logger.info('Getting order invoice details', {
              processingId,
              invoiceId: actualInvoiceId
            });
            const invoiceInfo = await this.hostbillClient.getInvoice(actualInvoiceId);
            invoiceDetails = invoiceInfo.invoice;
          }
        } catch (detailsError) {
          logger.warn('Failed to get order/invoice details', {
            processingId,
            orderId: order.order_id,
            invoiceId: actualInvoiceId,
            error: detailsError.message
          });
        }

        // Add draft order to results (OFFICIAL HOSTBILL API)
        result.orders.push({
          type: 'draft_order',
          orderId: order.order_id,
          invoiceId: actualInvoiceId,
          draftId: order.order?.draft_id,
          clientId: client.id,
          items: invoiceItems.map((item, index) => ({
            cloudVpsProductId: orderData.items[index]?.productId,
            hostbillProductId: item.product_id,
            productName: item.description,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: orderData.total || invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          currency: orderParams.currency,
          status: 'created',
          orderDetails: orderDetails,
          invoiceDetails: invoiceDetails,
          order: order
        });

      } catch (orderError) {
        const error = `Failed to create combined order: ${orderError.message}`;
        logger.error('Combined order creation failed', {
          processingId,
          error: orderError.message
        });
        result.errors.push(error);
      }

      // Step 5: Generate summary
      const successfulOrders = result.orders.length;
      const totalItems = orderData.items.length;

      logger.info('Order processing completed', {
        processingId,
        successfulOrders,
        totalItems,
        errorCount: result.errors.length,
        clientId: result.client?.id,
        affiliateId: result.affiliate?.id
      });

      result.summary = {
        totalItems,
        successfulOrders,
        failedItems: totalItems - successfulOrders,
        hasErrors: result.errors.length > 0,
        clientCreated: !!result.client,
        affiliateAssigned: !!result.affiliate
      };

      return {
        success: successfulOrders > 0,
        ...result
      };

    } catch (error) {
      logger.error('Order processing failed', {
        processingId,
        error: error.message,
        stack: error.stack
      });

      result.errors.push(`Processing failed: ${error.message}`);
      
      return {
        success: false,
        ...result
      };
    }
  }

  /**
   * Process simple order (single item)
   * @param {Object} orderData - Simple order data
   * @returns {Promise<Object>} Processing result
   */
  async processSimpleOrder(orderData) {
    const processingId = uuidv4();

    logger.info('Processing simple order', {
      processingId,
      productId: orderData.product_id,
      affiliateId: orderData.affiliate_id
    });

    try {
      // Map product ID
      const hostbillProductId = productMapper.mapToHostBill(orderData.product_id);

      if (!hostbillProductId) {
        throw new Error(`No HostBill mapping found for product ID: ${orderData.product_id}`);
      }

      // Create customer first if not provided
      let clientId = orderData.client_id;
      if (!clientId && (orderData.firstName || orderData.email)) {
        logger.info('Creating customer for simple order', { processingId });

        // Validate required customer fields
        if (!orderData.firstName || !orderData.lastName || !orderData.email) {
          throw new Error('Missing required customer fields: firstName, lastName, email are required');
        }

        const customerData = {
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          email: orderData.email,
          phone: orderData.phone || '',
          address: orderData.address || '',
          city: orderData.city || '',
          state: orderData.state || '',
          postcode: orderData.postcode || '',
          country: orderData.country || 'CZ'
        };

        const customer = await this.hostbillClient.createClient(customerData);
        if (customer && customer.id) {
          clientId = customer.id;
          logger.info('Customer created successfully', { processingId, clientId });
        } else {
          throw new Error('Failed to create customer: No client ID returned');
        }
      }

      if (!clientId) {
        throw new Error('No client_id provided and unable to create customer');
      }

      // Create order with customer
      const order = await this.hostbillClient.createOrder({
        ...orderData,
        client_id: clientId,
        product_id: hostbillProductId
      });

      logger.info('Simple order created successfully', {
        processingId,
        orderId: order.order_id,
        productId: hostbillProductId,
        clientId
      });

      return {
        success: true,
        processingId,
        order,
        hostbillProductId,
        cloudVpsProductId: orderData.product_id,
        clientId
      };

    } catch (error) {
      logger.error('Simple order processing failed', {
        processingId,
        error: error.message
      });

      return {
        success: false,
        processingId,
        error: error.message
      };
    }
  }

  /**
   * Get order status
   * @param {string} orderId - HostBill order ID
   * @returns {Promise<Object>} Order status
   */
  async getOrderStatus(orderId) {
    try {
      logger.info('Getting order status', { orderId });
      
      const order = await this.hostbillClient.getOrder(orderId);
      
      return {
        success: true,
        order,
        status: order.status,
        orderId
      };

    } catch (error) {
      logger.error('Failed to get order status', {
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
}

module.exports = OrderProcessor;
