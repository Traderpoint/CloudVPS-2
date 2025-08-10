/**
 * HostBill Delete Product API - Middleware
 * DELETE /api/hostbill/delete-product
 * Deletes a product using HostBill Admin API via middleware
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

  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use DELETE.' 
    });
  }

  try {
    const { productId, affiliate_id } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('🗑️ Deleting product via HostBill Admin API', {
      productId,
      affiliateId: affiliate_id || 'not specified',
      timestamp: new Date().toISOString()
    });

    const hostbillClient = new HostBillClient();

    // First, get product details for validation and logging
    let productToDelete = null;

    try {
      // Get categories to find the product
      const categoriesResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });

      if (categoriesResult.categories) {
        const categories = categoriesResult.categories || [];

        // Find the product in all categories
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

            const product = productsArray.find(p => p.id === productId || p.id === parseInt(productId));

            if (product) {
              productToDelete = {
                ...product,
                category: category.name,
                categoryId: category.id
              };
              break;
            }
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to get product details before deletion', { error: err.message });
    }

    if (!productToDelete) {
      return res.status(404).json({
        success: false,
        error: `Product ${productId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('📊 Product found for deletion', {
      productId: productToDelete.id,
      productName: productToDelete.name,
      category: productToDelete.category
    });

    // Call HostBill deleteProduct API
    const deleteParams = {
      call: 'deleteProduct',
      id: productId
    };

    logger.info('🔧 Calling deleteProduct with parameters', {
      productId,
      productName: productToDelete.name,
      deleteParams
    });

    const deleteResult = await hostbillClient.makeApiCall(deleteParams);

    if (!deleteResult || !deleteResult.success) {
      logger.error('❌ deleteProduct failed', {
        productId,
        productName: productToDelete.name,
        error: deleteResult?.error || 'Unknown error',
        result: deleteResult
      });

      return res.status(500).json({
        success: false,
        error: deleteResult?.error || 'Failed to delete product',
        hostbill_response: deleteResult,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('✅ Product deleted successfully', {
      productId,
      productName: productToDelete.name,
      category: productToDelete.category,
      hostbillResponse: deleteResult
    });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      deletedProduct: {
        id: productToDelete.id,
        name: productToDelete.name,
        category: productToDelete.category
      },
      affiliateId: affiliate_id || null,
      hostbill_response: deleteResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Delete product API error', {
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
