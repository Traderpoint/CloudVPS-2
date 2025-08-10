/**
 * Test script for Pohoda Sync module
 * Tests the XML generation and Dativery API integration
 */

const http = require('http');

async function testPohodaSync() {
  console.log('🧪 Testing Pohoda Sync module...\n');

  // Test data simulating a real e-shop order
  const testOrderData = {
    clientId: 'TEST-CLIENT-123',
    orderId: `ORDER-POHODA-${Date.now()}`,
    cartItems: [
      {
        id: 'VPS-001',
        name: 'VPS Basic - 2GB RAM, 50GB SSD',
        quantity: 1,
        price: 599
      },
      {
        id: 'DOMAIN-001', 
        name: 'Doména .cz na 1 rok',
        quantity: 1,
        price: 299
      }
    ],
    totalPrice: 898,
    companyData: {
      obchodniJmeno: 'Test s.r.o.',
      ico: '12345678',
      dic: 'CZ12345678',
      adresa: 'Praha, Testovací 123'
    },
    email: 'test@example.com',
    name: 'Jan Testovací'
  };

  console.log('📋 Test Order Data:');
  console.log(`   Order ID: ${testOrderData.orderId}`);
  console.log(`   Client: ${testOrderData.companyData.obchodniJmeno}`);
  console.log(`   IČO: ${testOrderData.companyData.ico}`);
  console.log(`   Items: ${testOrderData.cartItems.length}`);
  console.log(`   Total: ${testOrderData.totalPrice} CZK`);
  console.log('');

  try {
    // Test the Pohoda sync API endpoint
    console.log('🔄 Testing Pohoda sync API endpoint...');
    
    const result = await callPohodaSyncAPI(testOrderData);
    
    if (result.success) {
      console.log('✅ Pohoda sync test completed successfully!');
      console.log('   Response:', result);
    } else {
      console.log('❌ Pohoda sync test failed!');
      console.log('   Error:', result.error);
      
      // Check if it's a configuration issue
      if (result.error && result.error.includes('DATIVERY_API_KEY')) {
        console.log('\n⚠️ Configuration Issue Detected:');
        console.log('   This is expected - Pohoda sync requires proper Dativery configuration');
        console.log('   See setup instructions below for configuration details');
      }
    }

  } catch (error) {
    console.log('💥 Test failed with error:', error.message);
  }

  // Display configuration information
  console.log('\n📋 Pohoda Sync Configuration Requirements:');
  console.log('');
  console.log('🔧 Required Environment Variables:');
  console.log('   DATIVERY_API_KEY=your_dativery_api_key');
  console.log('   DATIVERY_API_URL=https://api.dativery.com/v1');
  console.log('   POHODA_DATA_FILE=StwPh_ICO_YYYY.mdb');
  console.log('   POHODA_USERNAME=your_pohoda_username');
  console.log('   POHODA_PASSWORD=your_pohoda_password');
  console.log('');
  console.log('📊 Generated XML Structure Preview:');
  displayXMLStructure(testOrderData);
}

/**
 * Call the Pohoda sync API endpoint
 */
async function callPohodaSyncAPI(orderData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(orderData);

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/sync-pohoda',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve(jsonData);
        } catch (e) {
          resolve({ 
            success: false, 
            error: 'Invalid JSON response', 
            raw: responseData 
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Display the XML structure that would be generated
 */
function displayXMLStructure(orderData) {
  console.log('```xml');
  console.log('<?xml version="1.0" encoding="UTF-8"?>');
  console.log('<dataPack version="2.0" application="Next.js E-shop">');
  console.log('  <dataPackItem version="2.0">');
  console.log('    <order action="create">');
  console.log('      <orderHeader>');
  console.log('        <orderType>receivedOrder</orderType>');
  console.log(`        <numberOrder>${orderData.orderId}</numberOrder>`);
  console.log(`        <date>${new Date().toISOString().split('T')[0]}</date>`);
  console.log('        <partnerIdentity>');
  console.log(`          <name>${orderData.companyData.obchodniJmeno}</name>`);
  console.log(`          <company>${orderData.companyData.obchodniJmeno}</company>`);
  console.log(`          <ico>${orderData.companyData.ico}</ico>`);
  console.log(`          <dic>${orderData.companyData.dic}</dic>`);
  console.log('          <address>');
  console.log(`            <street>${orderData.companyData.adresa.split(', ')[1] || ''}</street>`);
  console.log(`            <city>${orderData.companyData.adresa.split(', ')[0] || ''}</city>`);
  console.log('          </address>');
  console.log(`          <email>${orderData.email}</email>`);
  console.log('        </partnerIdentity>');
  console.log(`        <totalPrice>${orderData.totalPrice}</totalPrice>`);
  console.log('        <currency>CZK</currency>');
  console.log('      </orderHeader>');
  console.log('      <orderDetail>');
  
  orderData.cartItems.forEach((item, index) => {
    console.log(`        <!-- Item ${index + 1}: ${item.name} -->`);
    console.log('        <orderItem>');
    console.log(`          <quantity>${item.quantity}</quantity>`);
    console.log(`          <text>${item.name}</text>`);
    console.log(`          <unitPrice>${(item.price / item.quantity)}</unitPrice>`);
    console.log(`          <totalPrice>${(item.price * item.quantity)}</totalPrice>`);
    console.log('          <stockItem>');
    console.log(`            <code>${item.id}</code>`);
    console.log('          </stockItem>');
    console.log('        </orderItem>');
  });
  
  console.log('      </orderDetail>');
  console.log('    </order>');
  console.log('  </dataPackItem>');
  console.log('</dataPack>');
  console.log('```');
}

// Run the test
if (require.main === module) {
  testPohodaSync()
    .then(() => {
      console.log('\n🏁 Pohoda sync test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testPohodaSync };
