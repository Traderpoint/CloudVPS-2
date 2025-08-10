// Client Services API - Get client services from HostBill
// GET /api/client/services?client_id=123

import { HostBillClient } from '../../../lib/hostbill-client';
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { client_id } = req.query;

  if (!client_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Client ID is required' 
    });
  }

  try {
    logger.info(`🔍 Fetching services for client ID: ${client_id}`);

    const hostbill = new HostBillClient();
    
    // Get client accounts (services) from HostBill
    const accountsData = await hostbill.makeApiCall({
      call: 'getClientAccounts',
      client_id: client_id
    });

    if (!accountsData.success) {
      logger.error(`❌ Failed to fetch services for client ${client_id}:`, accountsData.error);
      return res.status(404).json({
        success: false,
        error: 'Services not found'
      });
    }

    const accounts = accountsData.accounts || [];
    
    // Format services data
    const services = await Promise.all(accounts.map(async (account) => {
      try {
        // Get product details for each service
        const productData = await hostbill.makeApiCall({
          call: 'getProductDetails',
          id: account.product_id
        });

        const product = productData.product || {};
        
        // Parse tags for CPU, RAM, Storage info
        const tags = product.tags || {};
        let cpu = '', ram = '', storage = '';
        
        Object.entries(tags).forEach(([tagId, tagValue]) => {
          const value = tagValue.toUpperCase();
          if (value.includes('CPU') || value.includes('VCPU')) {
            cpu = tagValue;
          } else if (value.includes('RAM') || value.includes('GB RAM')) {
            ram = tagValue;
          } else if (value.includes('SSD') || value.includes('GB SSD')) {
            storage = tagValue;
          }
        });

        return {
          id: account.id,
          name: product.name || account.domain || `Service ${account.id}`,
          domain: account.domain || `service${account.id}.systrix.cz`,
          status: account.status || 'active',
          nextDue: account.nextduedate || null,
          price: account.recurring_amount ? `${account.recurring_amount} ${account.currency || 'CZK'}` : 'N/A',
          billingCycle: account.billingcycle || 'monthly',
          type: product.category || 'VPS',
          cpu: cpu || 'N/A',
          ram: ram || 'N/A',
          storage: storage || 'N/A',
          bandwidth: 'Unlimited',
          ipAddress: account.dedicatedip || 'N/A',
          location: 'Praha, CZ',
          created: account.regdate || null,
          autoRenew: account.domainstatus !== 'Cancelled',
          productId: account.product_id,
          features: [
            'Root přístup',
            'SSD úložiště', 
            'DDoS ochrana',
            '24/7 monitoring'
          ]
        };
      } catch (error) {
        logger.error(`❌ Error processing service ${account.id}:`, error);
        return {
          id: account.id,
          name: account.domain || `Service ${account.id}`,
          domain: account.domain || `service${account.id}.systrix.cz`,
          status: account.status || 'active',
          nextDue: account.nextduedate || null,
          price: account.recurring_amount ? `${account.recurring_amount} ${account.currency || 'CZK'}` : 'N/A',
          type: 'Service',
          cpu: 'N/A',
          ram: 'N/A', 
          storage: 'N/A'
        };
      }
    }));

    // Calculate statistics
    const stats = {
      total: services.length,
      active: services.filter(s => s.status === 'Active').length,
      suspended: services.filter(s => s.status === 'Suspended').length,
      pending: services.filter(s => s.status === 'Pending').length,
      cancelled: services.filter(s => s.status === 'Cancelled').length
    };

    logger.info(`✅ Loaded ${services.length} services for client ${client_id}`);

    res.status(200).json({
      success: true,
      data: services,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Error fetching client services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client services',
      details: error.message
    });
  }
}
