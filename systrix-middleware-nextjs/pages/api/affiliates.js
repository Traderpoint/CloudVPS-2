// Affiliates API with real HostBill integration
const HostBillClient = require('../../lib/hostbill-client');
const logger = require('../../utils/logger');

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    logger.info('Affiliates API called');

    const hostbillClient = new HostBillClient();
    const result = await hostbillClient.makeApiCall({
      call: 'getAffiliates'
    });

    logger.info('Affiliates fetched successfully', {
      count: result.affiliates ? result.affiliates.length : 0
    });

    res.status(200).json({
      success: true,
      affiliates: result.affiliates || [],
      total: result.affiliates ? result.affiliates.length : 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Affiliates API error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
