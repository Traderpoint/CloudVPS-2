/**
 * HostBill Clone New Product API - Middleware
 * POST /api/hostbill/clone-new-product
 * Creates a new product and clones settings from source product using HostBill Admin API via middleware
 */

const HostBillClient = require('../../../lib/hostbill-client');
const logger = require('../../../utils/logger');

// HostBill API settings mapping according to documentation
const SETTINGS_MAP = {
  1: 'Connect with app',
  2: 'Automation',
  3: 'Emails',
  4: 'Components',
  5: 'Other settings',
  6: 'Client functions',
  7: 'Price'
};

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
    const { sourceProductId, newProductName, settings, affiliate_id } = req.body;

    if (!sourceProductId || !newProductName) {
      return res.status(400).json({
        success: false,
        error: 'sourceProductId and newProductName are required',
        timestamp: new Date().toISOString()
      });
    }

    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'settings array is required',
        example: {
          settings: [1, 2, 4] // General, Pricing, Components
        },
        timestamp: new Date().toISOString()
      });
    }

    const settingsLabels = settings.map(id => SETTINGS_MAP[id]).filter(Boolean);

    logger.info('🆕 Creating new product and cloning settings via HostBill Admin API', {
      sourceProductId,
      newProductName,
      settings: settingsLabels,
      affiliateId: affiliate_id || 'not specified',
      timestamp: new Date().toISOString()
    });

    const hostbillClient = new HostBillClient();

    // First, get source product details for validation and category info
    let sourceProduct = null;
    let sourceCategory = null;

    try {
      // Get categories
      const categoriesResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });

      if (!categoriesResult.categories) {
        throw new Error('No categories found');
      }

      const categories = categoriesResult.categories || [];

      // Find source product and its category
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

          const source = productsArray.find(p => p.id === sourceProductId || p.id === parseInt(sourceProductId));
          if (source) {
            sourceProduct = source;
            sourceCategory = category;
            break;
          }
        }
      }
    } catch (err) {
      logger.error('Failed to get source product info', { error: err.message });
    }

    if (!sourceProduct) {
      return res.status(404).json({
        success: false,
        error: `Source product ${sourceProductId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('📊 Source product found', {
      sourceProduct: { id: sourceProduct.id, name: sourceProduct.name },
      category: sourceCategory.name
    });

    // Step 1: Create new product with complete data copy including module
    logger.info('🔧 Step 1: Creating new product with complete data from source including module');

    const createProductParams = {
      call: 'addProduct',
      name: newProductName.trim(),
      category_id: sourceCategory.id,

      // 1. General - Copy all general settings
      type: sourceProduct.type || 'hosting',
      module: sourceProduct.module || '', // Critical for components - must match source
      visible: sourceProduct.visible || 1,
      description: sourceProduct.description || '',
      code: sourceProduct.code || '',

      // 2. Pricing - Copy all pricing tiers and setup fees
      m: sourceProduct.m || '0',
      q: sourceProduct.q || '0',
      s: sourceProduct.s || '0',
      a: sourceProduct.a || '0',
      b: sourceProduct.b || '0',
      t: sourceProduct.t || '0',
      m_setup: sourceProduct.m_setup || '0',
      q_setup: sourceProduct.q_setup || '0',
      s_setup: sourceProduct.s_setup || '0',
      a_setup: sourceProduct.a_setup || '0',
      b_setup: sourceProduct.b_setup || '0',
      t_setup: sourceProduct.t_setup || '0',

      // 3. Configuration - Copy configuration settings
      stock: sourceProduct.stock || '0',
      qty: sourceProduct.qty || '0',
      weight: sourceProduct.weight || '0',
      tax: sourceProduct.tax || '1',
      tax_group_id: sourceProduct.tax_group_id || '1',

      // 4. Components (Form fields) - Will be handled by settings clone
      // 5. Emails - Will be handled by settings clone
      // 6. Related products - Will be handled by settings clone
      // 7. Automation scripts - Copy automation settings
      autosetup: sourceProduct.autosetup || '0',

      // 8. Order process - Copy order process settings
      paytype: sourceProduct.paytype || 'Regular',

      // 9. Domain settings - Copy domain settings
      domain_options: sourceProduct.domain_options || '0',
      subdomain: sourceProduct.subdomain || '',
      owndomain: sourceProduct.owndomain || '0',
      owndomainwithus: sourceProduct.owndomainwithus || '0'
    };

    const createResult = await hostbillClient.makeApiCall(createProductParams);

    if (!createResult || !createResult.success) {
      logger.error('❌ Failed to create new product', {
        error: createResult?.error || 'Unknown error',
        result: createResult
      });

      return res.status(500).json({
        success: false,
        error: createResult?.error || 'Failed to create new product',
        hostbill_response: createResult,
        timestamp: new Date().toISOString()
      });
    }

    const newProductId = createResult.product_id || createResult.id;
    
    if (!newProductId) {
      return res.status(500).json({
        success: false,
        error: 'New product created but ID not returned',
        hostbill_response: createResult,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('✅ New product created successfully', {
      newProductId,
      newProductName
    });

    // Step 2: Copy pricing using editProduct API (more reliable than productCloneSettings for pricing)
    logger.info('🔧 Step 2: Copying pricing using editProduct API');

    try {
      const pricingParams = {
        call: 'editProduct',
        id: newProductId
      };

      // Copy all pricing tiers and setup fees from source product
      const pricingFields = ['m', 'q', 's', 'a', 'b', 't'];
      const setupFields = ['m_setup', 'q_setup', 's_setup', 'a_setup', 'b_setup', 't_setup'];

      // Add pricing parameters
      pricingFields.forEach(field => {
        if (sourceProduct[field] && sourceProduct[field] !== '0') {
          pricingParams[field] = sourceProduct[field].toString();
        }
      });

      // Add setup fee parameters
      setupFields.forEach(field => {
        if (sourceProduct[field] && sourceProduct[field] !== '0') {
          pricingParams[field] = sourceProduct[field].toString();
        }
      });

      logger.info('💰 Copying pricing with editProduct', {
        sourceProductId,
        newProductId,
        pricingParams: pricingParams
      });

      const pricingResult = await hostbillClient.makeApiCall(pricingParams);

      if (pricingResult && pricingResult.success) {
        logger.info('✅ Pricing copied successfully using editProduct');
      } else {
        logger.warn('⚠️ Pricing copy failed, will rely on productCloneSettings', {
          error: pricingResult?.error || 'Unknown error'
        });
      }
    } catch (pricingError) {
      logger.warn('⚠️ Pricing copy error, will rely on productCloneSettings', {
        error: pricingError.message
      });
    }

    // Step 2.5: Copy module options if Components (setting 4) is selected
    if (settings.includes(4) && sourceProduct.modules && sourceProduct.modules.length > 0) {
      logger.info('🔧 Step 2.5: Copying module options for Components');

      try {
        const sourceModule = sourceProduct.modules[0];
        const moduleOptions = sourceModule.options || {};

        if (Object.keys(moduleOptions).length > 0) {
          // Try multiple approaches to copy module options

          // Approach 1: Use editProduct with module options
          const moduleParams = {
            call: 'editProduct',
            id: newProductId,
            ...moduleOptions // Spread all module options
          };

          logger.info('🔧 Approach 1: Copying module options with editProduct', {
            sourceProductId,
            newProductId,
            optionsCount: Object.keys(moduleOptions).length,
            sampleOptions: Object.keys(moduleOptions).slice(0, 5)
          });

          const moduleResult = await hostbillClient.makeApiCall(moduleParams);

          if (moduleResult && moduleResult.success) {
            logger.info('✅ Module options copied successfully using editProduct');
          } else {
            logger.warn('⚠️ editProduct failed for module options', {
              error: moduleResult?.error || 'Unknown error'
            });

            // Approach 2: Try productCloneSettings with just components
            logger.info('🔧 Approach 2: Trying productCloneSettings for components only');

            const componentCloneParams = {
              call: 'productCloneSettings',
              source_product_id: sourceProductId.toString(),
              'target_product_ids[]': newProductId.toString(),
              'settings[]': [4] // Only components
            };

            const componentResult = await hostbillClient.makeApiCall(componentCloneParams);

            if (componentResult && componentResult.success) {
              logger.info('✅ Components cloned using productCloneSettings');
            } else {
              logger.warn('⚠️ productCloneSettings also failed for components', {
                error: componentResult?.error || 'Unknown error'
              });
            }
          }
        }
      } catch (moduleError) {
        logger.warn('⚠️ Module options copy error, will rely on productCloneSettings', {
          error: moduleError.message
        });
      }
    }

    // Step 3: Clone selected settings from source to new product
    logger.info('🔧 Step 3: Cloning selected settings to new product');

    const cloneParams = {
      call: 'productCloneSettings',
      source_product_id: sourceProductId.toString(),
      'target_product_ids[]': newProductId.toString(),
      'settings[]': settings // Clone only user-selected settings
    };

    logger.info('📋 Cloning user-selected settings', {
      sourceProductId,
      newProductId,
      selectedSettings: settings,
      settingsLabels: settingsLabels,
      cloneParams: cloneParams,
      settingsIncludesComponents: settings.includes(4)
    });

    const cloneResult = await hostbillClient.makeApiCall(cloneParams);

    if (!cloneResult || !cloneResult.success) {
      logger.warn('⚠️ Product created and pricing copied, but settings clone failed', {
        newProductId,
        error: cloneResult?.error || 'Unknown error',
        result: cloneResult
      });

      // Return partial success - product was created but settings weren't cloned
      return res.status(200).json({
        success: true,
        warning: 'Product created with pricing but settings clone failed',
        message: 'New product created with pricing copied, but settings clone had issues',
        sourceProduct: {
          id: sourceProduct.id,
          name: sourceProduct.name
        },
        newProduct: {
          id: newProductId,
          name: newProductName.trim()
        },
        clonedSettings: settingsLabels,
        selectedSettings: settingsLabels,
        completeCopy: false,
        affiliateId: affiliate_id || null,
        hostbill_create_response: createResult,
        hostbill_clone_response: cloneResult,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('✅ Product created with pricing and selected settings cloned successfully', {
      sourceProductId,
      newProductId,
      clonedSettings: settingsLabels,
      selectedSettings: settings,
      pricingCopied: true,
      hostbillResponse: cloneResult
    });

    // Determine if this was a complete copy (all 9 settings selected)
    const isCompleteCopy = settings.length === 9 && settings.includes(1) && settings.includes(2) &&
                          settings.includes(3) && settings.includes(4) && settings.includes(5) &&
                          settings.includes(6) && settings.includes(7) && settings.includes(8) && settings.includes(9);

    // Check if components were requested but may not have cloned properly
    const componentsRequested = settings.includes(4);
    const hasComponentsWarning = componentsRequested;

    return res.status(200).json({
      success: true,
      message: isCompleteCopy
        ? 'New product created with complete copy including pricing and all settings'
        : `New product created with pricing and selected settings: ${settingsLabels.join(', ')}`,
      sourceProduct: {
        id: sourceProduct.id,
        name: sourceProduct.name
      },
      newProduct: {
        id: newProductId,
        name: newProductName.trim()
      },
      clonedSettings: settingsLabels, // Show cloned settings
      selectedSettings: settingsLabels, // Same as cloned
      completeCopy: isCompleteCopy,
      componentsWarning: hasComponentsWarning ? {
        message: 'Components (Form fields) may require manual setup in HostBill admin',
        reason: 'HostBill API productCloneSettings has limitations with module options',
        action: 'Please verify components in HostBill admin and configure manually if needed'
      } : null,
      affiliateId: affiliate_id || null,
      hostbill_create_response: createResult,
      hostbill_clone_response: cloneResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Clone new product API error', {
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
