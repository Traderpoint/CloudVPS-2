/**
 * API endpoint to get recent orders with invoices
 * Used by Invoice Payment Test page
 */

const HostBillClient = require('../../../lib/hostbill-client');
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const limit = parseInt(req.query.limit) || 10;
    logger.info('Getting recent orders from HostBill', { limit });

    const hostbillClient = new HostBillClient();

    // Get orders from HostBill
    const ordersResult = await hostbillClient.makeApiCall({
      call: 'getOrders',
      limit: limit
    });

    if (!ordersResult || ordersResult.error) {
      throw new Error(ordersResult.error || 'Failed to get orders from HostBill');
    }

    // Get invoices for each order
    const ordersWithInvoices = [];
    
    if (ordersResult.orders && Array.isArray(ordersResult.orders)) {
      for (const order of ordersResult.orders.slice(0, limit)) {
        try {
          // Get invoices for this order
          // HostBill structure: order.invoice_id points to the main invoice for this order
          let invoices = [];

          if (order.invoice_id) {
            // Get the specific invoice for this order
            const invoicesResult = await hostbillClient.makeApiCall({
              call: 'getInvoices',
              'filter[id]': order.invoice_id
            });

            if (invoicesResult && invoicesResult.invoices) {
              const allInvoices = Array.isArray(invoicesResult.invoices)
                ? invoicesResult.invoices
                : Object.values(invoicesResult.invoices);

              // Find the invoice that matches this order's invoice_id
              invoices = allInvoices.filter(invoice =>
                invoice.id && invoice.id.toString() === order.invoice_id.toString()
              );

              logger.debug('Invoice lookup by invoice_id', {
                orderId: order.id,
                invoiceId: order.invoice_id,
                foundInvoices: invoices.length
              });
            }
          } else {
            logger.debug('Order has no invoice_id', { orderId: order.id });
          }

          ordersWithInvoices.push({
            id: order.id,
            number: order.number || order.id,
            client_id: order.client_id,
            client_name: `${order.client_firstname || ''} ${order.client_lastname || ''}`.trim(),
            client_email: order.client_email,
            product_name: order.product_name || order.name,
            status: order.status,
            total: order.total,
            currency: order.currency || 'CZK',
            date_created: order.date_created,
            invoices: invoices.map(invoice => ({
              id: invoice.id,
              number: invoice.number || invoice.id,
              status: invoice.status,
              total: invoice.total,
              currency: invoice.currency || 'CZK',
              date_created: invoice.date_created,
              date_due: invoice.date_due,
              date_paid: invoice.date_paid
            }))
          });
        } catch (invoiceError) {
          logger.warn('Failed to get invoices for order', { 
            orderId: order.id, 
            error: invoiceError.message 
          });
          
          ordersWithInvoices.push({
            id: order.id,
            number: order.number || order.id,
            client_id: order.client_id,
            client_name: `${order.client_firstname || ''} ${order.client_lastname || ''}`.trim(),
            client_email: order.client_email,
            product_name: order.product_name || order.name,
            status: order.status,
            total: order.total,
            currency: order.currency || 'CZK',
            date_created: order.date_created,
            invoices: []
          });
        }
      }
    }

    res.json({
      success: true,
      orders: ordersWithInvoices,
      total: ordersWithInvoices.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get recent orders', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get recent orders',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
