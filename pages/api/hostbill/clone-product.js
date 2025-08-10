/**
 * HostBill Clone Product API
 * POST /api/hostbill/clone-product
 * Clones settings from one product to another using HostBill Admin API
 */

import https from 'https';
import { URL } from 'url';

const HOSTBILL_CONFIG = {
  apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
  apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
  apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d'
};

// Helper function to make HostBill API calls
async function makeHostBillApiCall(params) {
  return new Promise((resolve, reject) => {
    const url = new URL(HOSTBILL_CONFIG.apiUrl);

    // Add API credentials and parameters
    const searchParams = new URLSearchParams({
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      ...params
    });

    url.search = searchParams.toString();

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      rejectUnauthorized: false // For self-signed certificates
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

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
    const { sourceProductId, targetProductId, settings, affiliate_id } = req.body;

    if (!sourceProductId || !targetProductId) {
      return res.status(400).json({
        success: false,
        error: 'sourceProductId and targetProductId are required',
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

    console.log('📋 Cloning product settings via HostBill Admin API', {
      sourceProductId,
      targetProductId,
      settings: settingsLabels,
      affiliateId: affiliate_id || 'not specified',
      timestamp: new Date().toISOString()
    });

    // First, get source product details
    let sourceProduct = null;
    let targetProduct = null;

    try {
      // Get categories
      const categoriesResult = await makeHostBillApiCall({
        call: 'getOrderPages'
      });

      if (!categoriesResult.categories) {
        throw new Error('No categories found');
      }

      const categories = categoriesResult.categories || [];

      // Find both products
      for (const category of categories) {
        const productsResult = await makeHostBillApiCall({
          call: 'getProducts',
          id: category.id,
          visible: 1
        });

        if (productsResult.products) {
          const productsArray = Array.isArray(productsResult.products)
            ? productsResult.products
            : Object.values(productsResult.products);

          if (!sourceProduct) {
            const source = productsArray.find(p => p.id === sourceProductId || p.id === parseInt(sourceProductId));
            if (source) {
              sourceProduct = source;
            }
          }

          if (!targetProduct) {
            const target = productsArray.find(p => p.id === targetProductId || p.id === parseInt(targetProductId));
            if (target) {
              targetProduct = target;
            }
          }

          if (sourceProduct && targetProduct) break;
        }
      }
    } catch (err) {
      console.error('Failed to get product info', { error: err.message });
    }

    if (!sourceProduct) {
      return res.status(404).json({
        success: false,
        error: `Source product ${sourceProductId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    if (!targetProduct) {
      return res.status(404).json({
        success: false,
        error: `Target product ${targetProductId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    console.log('📊 Products found', {
      sourceProduct: { id: sourceProduct.id, name: sourceProduct.name },
      targetProduct: { id: targetProduct.id, name: targetProduct.name }
    });

    // Prepare clone parameters according to HostBill API documentation
    // Convert arrays to proper format for HostBill API
    const cloneParams = {
      call: 'productCloneSettings',
      source_product_id: sourceProductId,
      'target_product_ids[]': targetProductId, // Single target product ID
      'settings[]': settings // Array of settings to copy (1-7)
    };

    console.log('🔧 Calling productCloneSettings with parameters', {
      sourceProductId,
      targetProductId,
      settings: settings,
      settingsLabels: settingsLabels,
      cloneParams
    });

    // Call HostBill productCloneSettings API
    const cloneResult = await makeHostBillApiCall(cloneParams);

    if (!cloneResult || !cloneResult.success) {
      console.error('❌ productCloneSettings failed', {
        sourceProductId,
        targetProductId,
        error: cloneResult?.error || 'Unknown error',
        result: cloneResult
      });

      return res.status(500).json({
        success: false,
        error: cloneResult?.error || 'Failed to clone product',
        hostbill_response: cloneResult,
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Product cloned successfully', {
      sourceProductId,
      targetProductId,
      clonedSettings: settingsLabels,
      hostbillResponse: cloneResult
    });

    return res.status(200).json({
      success: true,
      message: 'Product cloned successfully',
      sourceProduct: {
        id: sourceProduct.id,
        name: sourceProduct.name
      },
      targetProduct: {
        id: targetProduct.id,
        name: targetProduct.name
      },
      clonedSettings: settingsLabels,
      affiliateId: affiliate_id || null,
      hostbill_response: cloneResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Clone product API error', {
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
