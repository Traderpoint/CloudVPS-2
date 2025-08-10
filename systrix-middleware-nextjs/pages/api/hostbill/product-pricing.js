/**
 * HostBill Product Pricing API
 * GET /api/hostbill/product-pricing
 * Tests product pricing for different billing cycles
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
    const { product_id, cycle = 'm', affiliate_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'product_id is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('🔍 Testing product pricing', {
      productId: product_id,
      cycle: cycle,
      affiliateId: affiliate_id || 'not specified',
      timestamp: new Date().toISOString()
    });

    const hostbillClient = new HostBillClient();

    // Method 1: Try getProducts API to get pricing (need to get categories first)
    try {
      logger.info('📊 Method 1: Using getProducts API with categories');

      // First get categories
      const categoriesResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });

      if (!categoriesResult.categories) {
        throw new Error('No categories found');
      }

      // Get products from all categories
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
            foundProduct = product;
            break;
          }
        }
      }

      if (foundProduct) {
        const product = foundProduct;
        
        if (product) {
          logger.info('✅ Product found via getProducts', {
            productId: product.id,
            productName: product.name,
            monthlyPrice: product.m || '0',
            annuallyPrice: product.a || '0',
            bienniallyPrice: product.b || '0',
            rawProduct: product
          });

          // Extract pricing for the specific cycle - HostBill returns direct price fields
          let price = 0;
          let setupFee = 0;
          let priceStatus = 'not_set';

          // HostBill getProducts returns prices directly as m, q, s, a, b, t
          const cyclePrice = parseFloat(product[cycle] || 0);
          const setupField = cycle + '_setup';
          const cycleSetup = parseFloat(product[setupField] || 0);

          if (cyclePrice > 0) {
            price = cyclePrice;
            setupFee = cycleSetup;
            priceStatus = 'set_in_hostbill';
          } else if (product[cycle] !== undefined) {
            // Price field exists but is 0
            priceStatus = 'set_but_zero';
          }

          return res.status(200).json({
            success: true,
            method: 'getProducts',
            productId: product.id,
            productName: product.name,
            cycle: cycle,
            price: price,
            setupFee: setupFee,
            priceStatus: priceStatus,
            currency: 'CZK',
            affiliateId: affiliate_id || null,
            allPrices: {
              monthly: product.m || '0',
              quarterly: product.q || '0',
              semiannually: product.s || '0',
              annually: product.a || '0',
              biennially: product.b || '0',
              triennially: product.t || '0'
            },
            note: priceStatus === 'set_in_hostbill' ? 'Price is set in HostBill' :
                  priceStatus === 'set_but_zero' ? 'Price is set in HostBill but is zero' :
                  'Price is not set in HostBill',
            timestamp: new Date().toISOString()
          });
        } else {
          logger.warn('⚠️ Product not found in getProducts result', {
            productId: product_id,
            availableProducts: productsArray.map(p => ({ id: p.id, name: p.name }))
          });
        }
      } else {
        logger.warn('⚠️ No products in getProducts result', { productsResult });
      }
    } catch (getProductsError) {
      logger.error('❌ getProducts method failed', {
        error: getProductsError.message,
        stack: getProductsError.stack
      });
    }

    // Method 2: Try getProductInfo API
    try {
      logger.info('📊 Method 2: Using getProductInfo API');
      
      const productInfoResult = await hostbillClient.makeApiCall({
        call: 'getProductInfo',
        id: product_id
      });

      if (productInfoResult && productInfoResult.product) {
        const product = productInfoResult.product;
        
        logger.info('✅ Product info found', {
          productId: product.id,
          productName: product.name,
          pricing: product.pricing || 'No pricing data'
        });

        // Extract pricing for the specific cycle
        let price = 0;
        let setupFee = 0;
        let priceStatus = 'not_set';

        if (product.pricing && product.pricing[cycle]) {
          const cyclePrice = parseFloat(product.pricing[cycle].price || 0);
          const cycleSetup = parseFloat(product.pricing[cycle].setup || 0);

          if (cyclePrice > 0) {
            price = cyclePrice;
            setupFee = cycleSetup;
            priceStatus = 'set_in_hostbill';
          } else {
            priceStatus = 'set_but_zero';
          }
        }

        return res.status(200).json({
          success: true,
          method: 'getProductInfo',
          productId: product.id,
          productName: product.name,
          cycle: cycle,
          price: price,
          setupFee: setupFee,
          priceStatus: priceStatus,
          currency: 'CZK',
          affiliateId: affiliate_id || null,
          fullPricing: product.pricing || {},
          note: priceStatus === 'set_in_hostbill' ? 'Price is set in HostBill' :
                priceStatus === 'set_but_zero' ? 'Price is set in HostBill but is zero' :
                'Price is not set in HostBill',
          timestamp: new Date().toISOString()
        });
      }
    } catch (getProductInfoError) {
      logger.error('❌ getProductInfo method failed', {
        error: getProductInfoError.message
      });
    }

    // Method 3: Try direct pricing calculation
    try {
      logger.info('📊 Method 3: Direct pricing calculation');
      
      // Try to calculate pricing based on known base prices
      const basePrices = {
        '5': 299,   // VPS Start
        '10': 599,  // VPS Profi
        '11': 999,  // VPS Premium
        '12': 1999  // VPS Enterprise
      };

      const basePrice = basePrices[product_id];
      if (basePrice) {
        logger.info('✅ Using base price calculation', {
          productId: product_id,
          basePrice: basePrice,
          cycle: cycle
        });

        return res.status(200).json({
          success: true,
          method: 'basePriceCalculation',
          productId: product_id,
          productName: `VPS Product ${product_id}`,
          cycle: cycle,
          price: basePrice,
          setupFee: 0,
          priceStatus: 'fallback_calculation',
          currency: 'CZK',
          affiliateId: affiliate_id || null,
          note: 'Price is not set in HostBill, using fallback calculation',
          timestamp: new Date().toISOString()
        });
      }
    } catch (calculationError) {
      logger.error('❌ Base price calculation failed', {
        error: calculationError.message
      });
    }

    // If all methods fail
    logger.error('❌ All pricing methods failed', {
      productId: product_id,
      cycle: cycle
    });

    return res.status(404).json({
      success: false,
      error: `Product pricing not found for product ${product_id} with cycle ${cycle}`,
      productId: product_id,
      cycle: cycle,
      methods_tried: ['getProducts', 'getProductInfo', 'basePriceCalculation'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Product pricing API error', {
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
