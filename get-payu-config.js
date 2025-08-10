/**
 * PayU Configuration Extractor
 * Získá PayU konfiguraci z HostBill API
 */

const axios = require('axios');
const https = require('https');

// Ignore SSL certificate errors for test environment
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Create axios instance with SSL ignore
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// HostBill konfigurace
const HOSTBILL_URL = 'https://vps.kabel1it.cz';
const API_ID = 'adcdebb0e3b6f583052d';
const API_KEY = '341697c41aeb1c842f0d';

/**
 * Získá seznam platebních modulů
 */
async function getPaymentModules() {
  console.log('🔍 Získávám seznam platebních modulů...');
  
  try {
    const response = await axiosInstance.get(`${HOSTBILL_URL}/admin/api.php`, {
      params: {
        api_id: API_ID,
        api_key: API_KEY,
        call: 'getPaymentModules'
      }
    });

    if (response.data && response.data.modules) {
      console.log('✅ Platební moduly:');
      
      Object.entries(response.data.modules).forEach(([id, module]) => {
        console.log(`  ${id}: ${module.name} (${module.status})`);
        
        if (module.name.toLowerCase().includes('payu')) {
          console.log(`    🎯 PayU modul nalezen! ID: ${id}`);
        }
      });
      
      return response.data.modules;
    } else {
      console.log('❌ Nepodařilo se získat platební moduly');
      return null;
    }
  } catch (error) {
    console.error('❌ Chyba při získávání modulů:', error.message);
    return null;
  }
}

/**
 * Získá konfiguraci konkrétního modulu
 */
async function getModuleConfig(moduleId) {
  console.log(`\n🔧 Získávám konfiguraci modulu ${moduleId}...`);
  
  try {
    const response = await axiosInstance.get(`${HOSTBILL_URL}/admin/api.php`, {
      params: {
        api_id: API_ID,
        api_key: API_KEY,
        call: 'getPaymentModuleConfig',
        module_id: moduleId
      }
    });

    if (response.data) {
      console.log('✅ Konfigurace modulu:');
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.log('❌ Nepodařilo se získat konfiguraci modulu');
      return null;
    }
  } catch (error) {
    console.error('❌ Chyba při získávání konfigurace:', error.message);
    return null;
  }
}

/**
 * Pokusí se najít PayU salt v různých API calls
 */
async function findPayUSalt() {
  console.log('\n🔐 Hledám PayU salt...');
  
  // Zkus různé API calls které by mohly obsahovat PayU konfiguraci
  const apiCalls = [
    'getPaymentModules',
    'getPaymentGateways',
    'getConfiguration',
    'getSettings'
  ];

  for (const call of apiCalls) {
    try {
      console.log(`\n🔍 Zkouším API call: ${call}`);
      
      const response = await axiosInstance.get(`${HOSTBILL_URL}/admin/api.php`, {
        params: {
          api_id: API_ID,
          api_key: API_KEY,
          call: call
        }
      });

      if (response.data) {
        // Hledej PayU related data
        const dataStr = JSON.stringify(response.data, null, 2);
        
        // Hledej salt patterns
        const saltPatterns = [
          /salt["\s]*[:=]["\s]*([a-zA-Z0-9]+)/gi,
          /payu.*salt["\s]*[:=]["\s]*([a-zA-Z0-9]+)/gi,
          /merchant.*salt["\s]*[:=]["\s]*([a-zA-Z0-9]+)/gi
        ];

        saltPatterns.forEach(pattern => {
          const matches = dataStr.match(pattern);
          if (matches) {
            console.log(`🎯 Možný salt nalezen v ${call}:`, matches);
          }
        });

        // Hledej PayU specific data
        if (dataStr.toLowerCase().includes('payu')) {
          console.log(`📋 PayU data v ${call}:`);
          const lines = dataStr.split('\n').filter(line => 
            line.toLowerCase().includes('payu') || 
            line.toLowerCase().includes('salt') ||
            line.toLowerCase().includes('key')
          );
          lines.forEach(line => console.log(`  ${line.trim()}`));
        }
      }
    } catch (error) {
      console.log(`❌ ${call} selhal:`, error.message);
    }
  }
}

/**
 * Testuje různé salt hodnoty
 */
async function testSaltValues() {
  console.log('\n🧪 Testování běžných salt hodnot...');
  
  // Běžné PayU test salt hodnoty
  const commonSalts = [
    'eCwWELxi',
    'your_salt_here',
    'test_salt',
    'payu_salt',
    'salt123',
    '341697c41aeb1c842f0d', // Stejné jako API key
    'adcdebb0e3b6f583052d'   // Stejné jako API ID
  ];

  console.log('🔑 Běžné salt hodnoty k vyzkoušení:');
  commonSalts.forEach((salt, index) => {
    console.log(`  ${index + 1}. ${salt}`);
  });

  console.log('\n💡 Tip: Zkuste tyto hodnoty v simulate-payu-callback.js');
  console.log('Nebo se podívejte do HostBill admin -> Payment Modules -> PayU -> Configuration');
}

/**
 * Získá callback URL pro PayU modul
 */
async function getCallbackURL() {
  console.log('\n🔗 Zjišťujem callback URL...');
  
  // PayU callback URL pattern
  const payuModuleId = '10'; // Z předchozích testů
  const callbackUrl = `${HOSTBILL_URL}/index.php?done=true&cmd=callback&module=${payuModuleId}`;
  
  console.log('📍 PayU callback URL:', callbackUrl);
  
  // Test dostupnosti
  try {
    const response = await axiosInstance.get(callbackUrl, { timeout: 5000 });
    console.log('✅ Callback URL je dostupná (status:', response.status, ')');
  } catch (error) {
    console.log('⚠️ Callback URL test:', error.message);
  }
  
  return callbackUrl;
}

/**
 * Hlavní funkce
 */
async function main() {
  console.log('🚀 PayU Configuration Extractor');
  console.log('================================\n');

  // Získej platební moduly
  const modules = await getPaymentModules();
  
  if (modules) {
    // Najdi PayU modul
    const payuModule = Object.entries(modules).find(([id, module]) => 
      module.name.toLowerCase().includes('payu')
    );
    
    if (payuModule) {
      const [moduleId, moduleData] = payuModule;
      console.log(`\n🎯 PayU modul nalezen: ${moduleData.name} (ID: ${moduleId})`);
      
      // Získej konfiguraci PayU modulu
      await getModuleConfig(moduleId);
    }
  }

  // Hledej salt
  await findPayUSalt();
  
  // Test běžné salt hodnoty
  await testSaltValues();
  
  // Získej callback URL
  await getCallbackURL();

  console.log('\n📋 Shrnutí:');
  console.log('===========');
  console.log('1. Zkontrolujte PayU modul v HostBill admin');
  console.log('2. Najděte správný salt v konfiguraci modulu');
  console.log('3. Aktualizujte MERCHANT_SALT v simulate-payu-callback.js');
  console.log('4. Spusťte test: node test-complete-payu-flow.js');
}

// Spusť extractor
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getPaymentModules,
  getModuleConfig,
  findPayUSalt,
  testSaltValues,
  getCallbackURL
};
