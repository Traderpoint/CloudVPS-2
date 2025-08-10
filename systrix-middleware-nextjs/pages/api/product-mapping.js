/**
 * Product mapping endpoint for Systrix Middleware NextJS
 * Returns product mapping information and statistics
 */

const productMapper = require('../../lib/product-mapper');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = productMapper.getStats();
    
    const response = {
      success: true,
      ...stats,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Product mapping endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product mapping',
      message: error.message
    });
  }
}
