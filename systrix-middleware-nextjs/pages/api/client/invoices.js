// Client Invoices API - Get client invoices from HostBill
// GET /api/client/invoices?client_id=123

import { HostBillClient } from '../../../lib/hostbill-client';
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { client_id, limit = 50 } = req.query;

  if (!client_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Client ID is required' 
    });
  }

  try {
    logger.info(`🔍 Fetching invoices for client ID: ${client_id}`);

    const hostbill = new HostBillClient();
    
    // Get client invoices from HostBill
    const invoicesData = await hostbill.makeApiCall({
      call: 'getClientInvoices',
      client_id: client_id,
      limit: limit
    });

    if (!invoicesData.success) {
      logger.error(`❌ Failed to fetch invoices for client ${client_id}:`, invoicesData.error);
      return res.status(404).json({
        success: false,
        error: 'Invoices not found'
      });
    }

    const invoices = (invoicesData.invoices || []).map(invoice => {
      const amount = parseFloat(invoice.total || 0);
      const currency = invoice.currency || 'CZK';
      
      // Determine status
      let status = 'unpaid';
      if (invoice.status === 'Paid') {
        status = 'paid';
      } else if (invoice.status === 'Cancelled') {
        status = 'cancelled';
      } else if (invoice.datepaid) {
        status = 'paid';
      } else if (invoice.duedate && new Date(invoice.duedate) < new Date()) {
        status = 'overdue';
      }

      // Parse invoice items
      const items = [];
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
          items.push({
            description: item.description || item.item || 'Service',
            quantity: parseInt(item.qty || 1),
            unitPrice: parseFloat(item.amount || 0),
            total: parseFloat(item.amount || 0) * parseInt(item.qty || 1)
          });
        });
      }

      return {
        id: `INV-${invoice.id}`,
        number: invoice.number || invoice.id,
        date: invoice.date || invoice.datecreated,
        dueDate: invoice.duedate,
        amount: `${amount} ${currency}`,
        amountNumeric: amount,
        currency: currency,
        status: status,
        description: invoice.notes || items[0]?.description || `Invoice ${invoice.id}`,
        serviceId: invoice.rel_id || null,
        serviceName: invoice.rel_type || null,
        paidDate: invoice.datepaid || null,
        paymentMethod: invoice.gateway || null,
        items: items,
        subtotal: parseFloat(invoice.subtotal || 0),
        tax: parseFloat(invoice.tax || 0),
        credit: parseFloat(invoice.credit || 0)
      };
    });

    // Calculate statistics
    const stats = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      unpaid: invoices.filter(i => i.status === 'unpaid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      cancelled: invoices.filter(i => i.status === 'cancelled').length,
      totalAmount: invoices.reduce((sum, i) => sum + i.amountNumeric, 0),
      paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amountNumeric, 0),
      unpaidAmount: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + i.amountNumeric, 0)
    };

    logger.info(`✅ Loaded ${invoices.length} invoices for client ${client_id}`);

    res.status(200).json({
      success: true,
      data: invoices,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error fetching client invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client invoices',
      details: error.message
    });
  }
}
