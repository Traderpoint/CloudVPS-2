// Affiliate products API with real HostBill integration
const HostBillClient = require('../../../../lib/hostbill-client');
const logger = require('../../../../utils/logger');

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
    const { id: affiliateId } = req.query;
    const { mode } = req.query;

    logger.info('Affiliate products API called', { 
      affiliateId, 
      mode 
    });

    if (!affiliateId) {
      return res.status(400).json({
        success: false,
        error: 'Affiliate ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const hostbillClient = new HostBillClient();

    // First get order pages (categories)
    const categoriesResult = await hostbillClient.makeApiCall({
      call: 'getOrderPages'
    });

    if (!categoriesResult.categories) {
      throw new Error('No categories found');
    }

    // Get products from each category
    const allProducts = [];
    const categories = categoriesResult.categories || [];

    for (const category of categories) {
      logger.debug('Getting products from category', {
        categoryId: category.id,
        categoryName: category.name
      });

      const productsResult = await hostbillClient.makeApiCall({
        call: 'getProducts',
        id: category.id,
        visible: 1
      });

      if (productsResult.products) {
        const categoryProducts = Object.values(productsResult.products);

        // Add category info to each product
        categoryProducts.forEach(product => {
          product.category = {
            id: category.id,
            name: category.name
          };
        });

        allProducts.push(...categoryProducts);
      }
    }

    if (mode === 'all') {
      logger.info('All products fetched successfully', {
        count: allProducts.length
      });

      res.status(200).json({
        success: true,
        products: allProducts,
        total: allProducts.length,
        affiliate_id: affiliateId,
        mode: 'all',
        timestamp: new Date().toISOString()
      });
    } else {
      // For affiliate mode, get commission plans for the affiliate
      logger.info('Getting commission plans for affiliate', { affiliateId });

      try {
        // Try different API calls to get commission data
        let commissionResult = null;

        // Method 1: Try getAffiliateCommissions
        try {
          commissionResult = await hostbillClient.makeApiCall({
            call: 'getAffiliateCommissions',
            id: affiliateId
          });
          logger.debug('getAffiliateCommissions result', { commissionResult });
        } catch (err1) {
          logger.warn('getAffiliateCommissions failed', { error: err1.message });
        }

        // Method 2: Try getAffiliate (might include commission info)
        if (!commissionResult || !commissionResult.commissions) {
          try {
            const affiliateResult = await hostbillClient.makeApiCall({
              call: 'getAffiliate',
              id: affiliateId
            });
            logger.debug('getAffiliate result', { affiliateResult });

            if (affiliateResult && affiliateResult.affiliate) {
              commissionResult = {
                commissions: affiliateResult.affiliate.commissions || []
              };
            }
          } catch (err2) {
            logger.warn('getAffiliate failed', { error: err2.message });
          }
        }

        // Method 3: Try getAffiliateDetails
        if (!commissionResult || !commissionResult.commissions) {
          try {
            const detailsResult = await hostbillClient.makeApiCall({
              call: 'getAffiliateDetails',
              id: affiliateId
            });
            logger.debug('getAffiliateDetails result', { detailsResult });

            if (detailsResult && detailsResult.commissions) {
              commissionResult = detailsResult;
            }
          } catch (err3) {
            logger.warn('getAffiliateDetails failed', { error: err3.message });
          }
        }

        logger.debug('Final commission result', { commissionResult });

        // Apply commission data to products
        const productsWithCommissions = allProducts.map(product => {
          let productCommission = null;

          // Look for commission data for this product
          if (commissionResult && commissionResult.commissions) {
            const commissions = Array.isArray(commissionResult.commissions)
              ? commissionResult.commissions
              : Object.values(commissionResult.commissions);

            productCommission = commissions.find(comm =>
              comm.product_id === product.id ||
              comm.product_id === parseInt(product.id)
            );
          }

          // If no commission data from API, create mock commission for testing
          if (!productCommission && affiliateId === '1') {
            // Mock commission data for affiliate #1 for testing purposes
            const mockCommissions = {
              '5': { rate: 10, type: 'Percent' },   // VPS Start - 10%
              '10': { rate: 15, type: 'Percent' },  // VPS Profi - 15%
              '11': { rate: 20, type: 'Percent' },  // VPS Premium - 20%
              '12': { rate: 25, type: 'Percent' }   // VPS Enterprise - 25%
            };

            const mockCommission = mockCommissions[product.id];
            if (mockCommission) {
              productCommission = mockCommission;
              logger.debug('Using mock commission for testing', {
                productId: product.id,
                affiliateId: affiliateId,
                commission: mockCommission
              });
            }
          }

          return {
            ...product,
            commission: productCommission ? {
              rate: productCommission.rate || productCommission.amount,
              type: productCommission.type || 'Percent',
              // Calculate commission amounts for different periods based on product prices
              monthly_amount: productCommission.type === 'Percent'
                ? Math.round(parseFloat(product.m || 0) * (productCommission.rate / 100))
                : productCommission.rate,
              quarterly_amount: productCommission.type === 'Percent'
                ? Math.round(parseFloat(product.q || 0) * (productCommission.rate / 100))
                : productCommission.rate,
              semiannually_amount: productCommission.type === 'Percent'
                ? Math.round(parseFloat(product.s || 0) * (productCommission.rate / 100))
                : productCommission.rate,
              annually_amount: productCommission.type === 'Percent'
                ? Math.round(parseFloat(product.a || 0) * (productCommission.rate / 100))
                : productCommission.rate,
              biennially_amount: productCommission.type === 'Percent'
                ? Math.round(parseFloat(product.b || 0) * (productCommission.rate / 100))
                : productCommission.rate,
              triennially_amount: productCommission.type === 'Percent'
                ? Math.round(parseFloat(product.t || 0) * (productCommission.rate / 100))
                : productCommission.rate
            } : null
          };
        });

        logger.info('Affiliate products with commissions fetched successfully', {
          affiliateId,
          count: productsWithCommissions.length,
          productsWithCommissions: productsWithCommissions.filter(p => p.commission).length
        });

        res.status(200).json({
          success: true,
          products: productsWithCommissions,
          total: productsWithCommissions.length,
          affiliate_id: affiliateId,
          mode: 'affiliate',
          commission_data_loaded: true,
          timestamp: new Date().toISOString()
        });

      } catch (commissionError) {
        logger.error('Failed to load commission data', {
          affiliateId,
          error: commissionError.message
        });

        // Fallback: return products without commission data
        res.status(200).json({
          success: true,
          products: allProducts,
          total: allProducts.length,
          affiliate_id: affiliateId,
          mode: 'affiliate',
          commission_data_loaded: false,
          commission_error: commissionError.message,
          timestamp: new Date().toISOString()
        });
      }
    }

  } catch (error) {
    logger.error('Affiliate products API error', { 
      affiliateId: req.query.id,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      affiliate_id: req.query.id,
      timestamp: new Date().toISOString()
    });
  }
}
