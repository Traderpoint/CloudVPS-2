/**
 * Comgate Payment Methods API
 * Handles Comgate payment methods retrieval
 */

const ComgateProcessor = require('../../../../lib/comgate-processor');
const logger = require('../../../../utils/logger');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      lang = 'cs',
      curr = 'CZK',
      country = 'CZ',
      price
    } = req.query;

    logger.info('Comgate payment methods request', {
      lang,
      curr,
      country,
      price
    });

    const comgateProcessor = new ComgateProcessor();

    // Prepare options
    const options = {
      lang,
      curr,
      country
    };

    if (price) {
      options.price = parseFloat(price);
    }

    // Get payment methods
    const result = await comgateProcessor.getPaymentMethods(options);

    if (result.success) {
      logger.info('Comgate payment methods retrieved successfully', {
        methodCount: result.methods.length
      });

      return res.status(200).json({
        success: true,
        methods: result.methods,
        message: result.message
      });
    } else {
      logger.error('Comgate payment methods retrieval failed', {
        error: result.error
      });

      return res.status(400).json({
        success: false,
        error: result.error,
        methods: []
      });
    }

  } catch (error) {
    logger.error('Comgate payment methods error', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      methods: [],
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
