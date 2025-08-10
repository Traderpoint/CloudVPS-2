/**
 * HostBill Product Detail API - Middleware
 * GET /api/hostbill/product-detail?product_id=X&affiliate_id=Y
 * Gets detailed information about a specific product via middleware
 */

const HostBillClient = require('../../../lib/hostbill-client');
const logger = require('../../../utils/logger');

export default async function handler(req, res) {
  // Set CORS headers
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
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    const { product_id, affiliate_id } = req.query;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'product_id is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('🔍 Getting product detail via HostBill Admin API', {
      productId: product_id,
      affiliateId: affiliate_id || 'not specified',
      timestamp: new Date().toISOString()
    });

    const hostbillClient = new HostBillClient();

    // Get categories first
    const categoriesResult = await hostbillClient.makeApiCall({
      call: 'getOrderPages'
    });

    if (!categoriesResult.categories) {
      return res.status(500).json({
        success: false,
        error: 'No categories found',
        timestamp: new Date().toISOString()
      });
    }

    // Find the product in all categories
    let foundProduct = null;
    const categories = categoriesResult.categories || [];

    for (const category of categories) {
      const productsResult = await hostbillClient.makeApiCall({
        call: 'getProducts',
        id: category.id,
        visible: 1
      });

      if (productsResult.products) {
        const productsArray = Array.isArray(productsResult.products)
          ? productsResult.products
          : Object.values(productsResult.products);

        const product = productsArray.find(p => p.id === product_id || p.id === parseInt(product_id));

        if (product) {
          foundProduct = {
            ...product,
            category: category.name,
            categoryId: category.id
          };
          break;
        }
      }
    }

    if (!foundProduct) {
      return res.status(404).json({
        success: false,
        error: `Product ${product_id} not found`,
        timestamp: new Date().toISOString()
      });
    }

    // Get detailed product information using getProductDetails
    try {
      const productDetailResult = await hostbillClient.makeApiCall({
        call: 'getProductDetails',
        id: product_id,
        currency_id: affiliate_id ? undefined : 1 // Optional currency conversion
      });

      if (productDetailResult.success && productDetailResult.product) {
        // Merge additional details from getProductDetails
        foundProduct = {
          ...foundProduct,
          ...productDetailResult.product,
          // Keep category info from original search
          category: foundProduct.category,
          categoryId: foundProduct.categoryId
        };
        
        logger.info('✅ Enhanced product details retrieved', {
          productId: foundProduct.id,
          hasOptions: foundProduct.options ? foundProduct.options.length : 0,
          hasServer: foundProduct.server ? Object.keys(foundProduct.server).length : 0
        });
      }
    } catch (err) {
      logger.warn('Failed to get enhanced product details', { error: err.message });
      // Continue with basic product info
    }

    logger.info('✅ Product detail retrieved successfully', {
      productId: foundProduct.id,
      productName: foundProduct.name,
      category: foundProduct.category
    });

    return res.status(200).json({
      success: true,
      product: foundProduct,
      affiliateId: affiliate_id || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Product detail API error', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
