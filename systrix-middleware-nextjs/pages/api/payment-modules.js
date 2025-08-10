// Payment modules API - get active payment modules from HostBill using proven method
const HostBillClient = require('../../lib/hostbill-client');
const logger = require('../../utils/logger');

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
    logger.info('Getting payment modules from HostBill API');

    // Use HostBillClient to get payment modules
    const hostbillClient = new HostBillClient();

    logger.debug('Calling HostBill getPaymentMethods API via client');
    const modulesData = await hostbillClient.getPaymentMethods();

    logger.debug('HostBill API response:', modulesData);

    if (!modulesData.success) {
      throw new Error('HostBill API call failed');
    }

    // Map modules to our format
    const modules = modulesData.modules || {};
    const mappedModules = [];

    // Known module mappings based on real HostBill data
    const moduleMapping = {
      '10': {
        method: 'payu',
        name: 'PayU',
        type: 'redirect',
        icon: '💰',
        isExternal: false,
        status: 'Active & Mapped'
      },
      '121': {
        method: 'card',
        name: 'Stripe Intents - 3D Secure',
        type: 'redirect',
        icon: '💳',
        isExternal: false,
        status: 'Active & Mapped'
      },
      '130': {
        method: 'comgate',
        name: 'Comgate',
        type: 'redirect',
        icon: '🌐',
        isExternal: false,
        status: 'Active & Mapped'
      },
      '133': {
        method: 'comgate_advanced',
        name: 'Comgate Advanced',
        type: 'redirect',
        icon: '🌐',
        isExternal: false,
        status: 'Active & Mapped'
      }
    };

    // Add external Comgate module (not from HostBill)
    const externalModules = [
      {
        id: 'comgate_external',
        name: 'Comgate External',
        method: 'comgate_external',
        type: 'external',
        icon: '🟣',
        enabled: true,
        source: 'external-api',
        known: true,
        hostbillModuleId: 'external',
        isExternal: true,
        status: 'External',
        description: 'External Gateway - Direct API Integration',
        integration: 'Comgate operates independently from HostBill. Payments are processed directly through Comgate API.',
        integrationStatus: 'Ready to use - External payment processor integrated via middleware',
        apiEndpoint: 'https://payments.comgate.cz/v2.0',
        testMode: true,
        merchantId: '498008',
        rawModule: { id: 'comgate_external', name: 'Comgate External' }
      }
    ];

    // Process modules from HostBill API response (object format: ID -> name)
    for (const [moduleId, moduleName] of Object.entries(modules)) {
      const mapping = moduleMapping[moduleId];

      mappedModules.push({
        id: moduleId,
        name: moduleName,
        method: mapping?.method || `module${moduleId}`,
        type: mapping?.type || 'redirect',
        icon: mapping?.icon || '💳',
        enabled: true, // All modules from getPaymentModules are active
        source: mapping?.isExternal ? 'external-api' : 'hostbill-api',
        known: !!mapping,
        hostbillModuleId: moduleId,
        isExternal: mapping?.isExternal || false,
        status: mapping?.status || 'Active from HostBill',
        description: mapping?.description,
        integration: mapping?.integration,
        integrationStatus: mapping?.integrationStatus,
        apiEndpoint: mapping?.apiEndpoint,
        testMode: mapping?.testMode,
        merchantId: mapping?.merchantId,
        rawModule: { id: moduleId, name: moduleName }
      });

      logger.debug('Payment module mapped', {
        moduleId,
        moduleName,
        method: mapping?.method || `module${moduleId}`,
        known: !!mapping
      });
    }

    // Add external modules
    mappedModules.push(...externalModules);
    logger.debug('Added external modules', { count: externalModules.length });

    logger.info('Payment modules retrieved and mapped', {
      total: mappedModules.length,
      known: mappedModules.filter(m => m.known).length,
      unknown: mappedModules.filter(m => !m.known).length,
      hostbillTotal: Object.keys(modules).length,
      externalTotal: externalModules.length
    });

    res.status(200).json({
      success: true,
      modules: mappedModules,
      rawModules: modules,
      total: mappedModules.length,
      known: mappedModules.filter(m => m.known).length,
      unknown: mappedModules.filter(m => !m.known).length,
      apiInfo: {
        hasGetPaymentMethods: true,
        totalFromHostBill: modulesData.total || 0
      },
      source: 'middleware-hostbill-api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get payment modules', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get payment modules',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
