/**
 * Set Order Referrer API endpoint
 * POST /api/hostbill/set-order-referrer
 * Sets affiliate referrer for an order using HostBill setOrderReferrer API
 */

const HostBillClient = require('../../../lib/hostbill-client');
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    const { orderId, affiliateId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required'
      });
    }

    if (!affiliateId) {
      return res.status(400).json({
        success: false,
        error: 'affiliateId is required'
      });
    }

    logger.info('🔗 Setting order referrer', {
      orderId,
      affiliateId
    });

    const hostbillClient = new HostBillClient();
    
    // Call setOrderReferrer API
    const result = await hostbillClient.setOrderReferrer(orderId, affiliateId);

    if (result.success) {
      logger.info('✅ Order referrer set successfully', {
        orderId,
        affiliateId,
        result: result.result
      });

      return res.status(200).json({
        success: true,
        message: 'Order referrer set successfully',
        orderId: orderId,
        affiliateId: affiliateId,
        hostbillResponse: result.result,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.error('❌ Failed to set order referrer', {
        orderId,
        affiliateId,
        error: result.error
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to set order referrer',
        details: result.error,
        orderId: orderId,
        affiliateId: affiliateId
      });
    }

  } catch (error) {
    logger.error('❌ Error setting order referrer', {
      orderId: req.body?.orderId,
      affiliateId: req.body?.affiliateId,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
