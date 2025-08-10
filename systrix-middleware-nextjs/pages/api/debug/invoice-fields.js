/**
 * Debug API endpoint to check invoice fields structure
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
    logger.info('Debug: Analyzing invoice fields structure');
    const hostbillClient = new HostBillClient();
    
    // Get a few invoices to see their structure
    const invoicesResult = await hostbillClient.makeApiCall({
      call: 'getInvoices',
      limit: 3
    });

    if (!invoicesResult || !invoicesResult.invoices) {
      return res.status(500).json({
        success: false,
        error: 'No invoices returned from HostBill'
      });
    }

    const invoices = Array.isArray(invoicesResult.invoices) 
      ? invoicesResult.invoices 
      : Object.values(invoicesResult.invoices);
    
    // Get orders for comparison
    const ordersResult = await hostbillClient.makeApiCall({
      call: 'getOrders',
      limit: 2
    });

    const orders = ordersResult && ordersResult.orders
      ? (Array.isArray(ordersResult.orders) ? ordersResult.orders : Object.values(ordersResult.orders))
      : [];

    // Analyze structure
    const analysis = {
      invoicesCount: invoices.length,
      ordersCount: orders.length,
      invoiceFields: [],
      orderFields: [],
      orderRelatedFields: [],
      potentialMatches: []
    };

    // Analyze first invoice
    if (invoices.length > 0) {
      const firstInvoice = invoices[0];
      analysis.invoiceFields = Object.keys(firstInvoice);
      
      // Find order-related fields
      analysis.orderRelatedFields = Object.keys(firstInvoice).filter(key => 
        key.toLowerCase().includes('order') || 
        key.toLowerCase().includes('service') ||
        key.toLowerCase().includes('product') ||
        key.toLowerCase().includes('client')
      );
    }

    // Analyze first order
    if (orders.length > 0) {
      const firstOrder = orders[0];
      analysis.orderFields = Object.keys(firstOrder);
      
      // Try to find matching invoices
      const orderId = firstOrder.id;
      const matchingInvoices = invoices.filter(invoice => {
        const matches = [];
        Object.keys(invoice).forEach(key => {
          if (invoice[key] && invoice[key].toString() === orderId.toString()) {
            matches.push({ field: key, value: invoice[key] });
          }
        });
        return matches.length > 0;
      });
      
      analysis.potentialMatches = matchingInvoices.map(invoice => ({
        invoiceId: invoice.id,
        matchingFields: Object.keys(invoice).filter(key => 
          invoice[key] && invoice[key].toString() === orderId.toString()
        ).map(key => ({ field: key, value: invoice[key] }))
      }));
    }

    // Sample data for debugging
    const sampleData = {
      sampleInvoice: invoices[0] || null,
      sampleOrder: orders[0] || null
    };

    res.json({
      success: true,
      analysis,
      sampleData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Debug invoice fields failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to debug invoice fields',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
