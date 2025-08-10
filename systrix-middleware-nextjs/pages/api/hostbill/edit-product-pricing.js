/**
 * HostBill Edit Product Pricing API
 * POST /api/hostbill/edit-product-pricing
 * Updates product pricing for different billing cycles using HostBill Admin API
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

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { product_id, prices, affiliate_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'product_id is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!prices || typeof prices !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'prices object is required',
        example: {
          prices: {
            m: { recurring: 299, setup: 0 },
            a: { recurring: 299, setup: 0 },
            b: { recurring: 299, setup: 0 }
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    logger.info('🔧 Updating product pricing via HostBill Admin API', {
      productId: product_id,
      prices: prices,
      affiliateId: affiliate_id || 'not specified',
      timestamp: new Date().toISOString()
    });

    const hostbillClient = new HostBillClient();

    // First get current product info (need to get categories first)
    let currentProduct = null;

    try {
      // Get categories
      const categoriesResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });

      if (!categoriesResult.categories) {
        throw new Error('No categories found');
      }

      // Get products from all categories to find the target product
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
            currentProduct = { product: product };
            break;
          }
        }
      }
    } catch (err) {
      logger.error('Failed to get current product info', { error: err.message });
    }

    if (!currentProduct || !currentProduct.product) {
      return res.status(404).json({
        success: false,
        error: `Product ${product_id} not found`,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('📊 Current product info', {
      productId: currentProduct.product.id,
      productName: currentProduct.product.name,
      currentPrices: {
        monthly: currentProduct.product.m || '0',
        quarterly: currentProduct.product.q || '0',
        semiannually: currentProduct.product.s || '0',
        annually: currentProduct.product.a || '0',
        biennially: currentProduct.product.b || '0',
        triennially: currentProduct.product.t || '0'
      }
    });

    // Prepare editProduct parameters
    const editParams = {
      call: 'editProduct',
      id: product_id
    };

    // Add pricing parameters for each billing cycle
    const supportedCycles = ['m', 'q', 's', 'a', 'b', 't'];
    const updatedPrices = {};

    for (const cycle of supportedCycles) {
      if (prices[cycle]) {
        const priceData = prices[cycle];
        
        // Set recurring price
        if (priceData.recurring !== undefined) {
          editParams[cycle] = priceData.recurring.toString();
          updatedPrices[cycle] = priceData.recurring;
        }
        
        // Set setup fee
        if (priceData.setup !== undefined) {
          editParams[`${cycle}_setup`] = priceData.setup.toString();
          updatedPrices[`${cycle}_setup`] = priceData.setup;
        }
      }
    }

    logger.info('🔧 Calling editProduct with parameters', {
      productId: product_id,
      editParams: editParams,
      updatedPrices: updatedPrices
    });

    // Call HostBill editProduct API
    const editResult = await hostbillClient.makeApiCall(editParams);

    if (!editResult || !editResult.success) {
      logger.error('❌ editProduct failed', {
        productId: product_id,
        error: editResult?.error || 'Unknown error',
        result: editResult
      });

      return res.status(500).json({
        success: false,
        error: editResult?.error || 'Failed to update product pricing',
        hostbill_response: editResult,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('✅ Product pricing updated successfully', {
      productId: product_id,
      updatedPrices: updatedPrices,
      hostbillResponse: editResult
    });

    // Get updated product info to verify changes
    let updatedProduct = null;

    try {
      // Get categories again
      const categoriesResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });

      if (categoriesResult.categories) {
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
              updatedProduct = { product: product };
              break;
            }
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to get updated product info', { error: err.message });
    }

    const finalPrices = {
      monthly: updatedProduct?.product?.m || '0',
      quarterly: updatedProduct?.product?.q || '0',
      semiannually: updatedProduct?.product?.s || '0',
      annually: updatedProduct?.product?.a || '0',
      biennially: updatedProduct?.product?.b || '0',
      triennially: updatedProduct?.product?.t || '0'
    };

    return res.status(200).json({
      success: true,
      message: 'Product pricing updated successfully',
      productId: product_id,
      productName: updatedProduct?.product?.name || `Product ${product_id}`,
      updatedPrices: updatedPrices,
      finalPrices: finalPrices,
      affiliateId: affiliate_id || null,
      hostbill_response: editResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Edit product pricing API error', {
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
