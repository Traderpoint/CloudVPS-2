// Real products API with HostBill integration
const HostBillClient = require('../../lib/hostbill-client');
const productMapper = require('../../lib/product-mapper');
const logger = require('../../utils/logger');

export default async function handler(req, res) {
  try {
    logger.info('Products API called', { method: req.method });

    // Get product mapping stats
    const mappingStats = productMapper.getStats();

    let hostbillProducts = [];
    let hostbillError = null;

    // Try to fetch real products from HostBill
    try {
      const hostbillClient = new HostBillClient();
      const productsResult = await hostbillClient.makeApiCall({
        call: 'getProducts'
      });

      hostbillProducts = productsResult.products || [];
      logger.info('HostBill products fetched successfully', {
        count: hostbillProducts.length
      });
    } catch (error) {
      hostbillError = error.message;
      logger.error('Error fetching HostBill products', { error: error.message });

      // Use fallback products for development
      hostbillProducts = [
        { id: '5', name: 'VPS Start', price: 299, currency: 'CZK' },
        { id: '10', name: 'VPS Profi', price: 599, currency: 'CZK' },
        { id: '11', name: 'VPS Premium', price: 999, currency: 'CZK' },
        { id: '12', name: 'VPS Enterprise', price: 1999, currency: 'CZK' }
      ];
    }

    // Cloud VPS products (these are our internal products)
    const cloudVpsProducts = [
      { id: '1', name: 'VPS Basic', price: 299, currency: 'CZK' },
      { id: '2', name: 'VPS Pro', price: 599, currency: 'CZK' },
      { id: '3', name: 'VPS Premium', price: 999, currency: 'CZK' },
      { id: '4', name: 'VPS Enterprise', price: 1999, currency: 'CZK' }
    ];

    const response = {
      success: true,
      cloudVpsProducts,
      hostbillProducts,
      mappings: mappingStats.mappings,
      product_mapping: mappingStats,
      totalProducts: cloudVpsProducts.length,
      totalHostBillProducts: hostbillProducts.length,
      totalMappings: mappingStats.totalMappings,
      hostbillConnected: !hostbillError,
      hostbillError,
      lastSync: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    logger.info('Products API response prepared', {
      cloudVpsCount: cloudVpsProducts.length,
      hostbillCount: hostbillProducts.length,
      mappingsCount: mappingStats.totalMappings
    });

    res.status(200).json(response);

  } catch (error) {
    logger.error('Products API error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
