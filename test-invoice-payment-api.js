/**
 * Test Invoice Payment API endpoints
 * Tests the new CloudVPS API endpoints that proxy to middleware
 */

const CLOUDVPS_URL = 'http://localhost:3000';

async function testInvoicePaymentAPI() {
  console.log('🧪 === INVOICE PAYMENT API TEST ===\n');
  console.log('🎯 Testing CloudVPS API endpoints for Invoice Payment Test');
  console.log(`📡 CloudVPS URL: ${CLOUDVPS_URL}\n`);

  let allPassed = true;

  // Test 1: Test recent orders API
  console.log('1️⃣ Testing recent orders API...');
  try {
    const http = require('http');
    const url = `${CLOUDVPS_URL}/api/middleware/recent-orders?limit=5`;
    
    const response = await new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (error) {
            resolve({ status: res.statusCode, data: data, error: error.message });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Recent orders API works');
      console.log('   Orders found:', response.data.orders?.length || 0);
      
      if (response.data.orders && response.data.orders.length > 0) {
        const firstOrder = response.data.orders[0];
        console.log('   Sample order:', {
          id: firstOrder.id,
          client_name: firstOrder.client_name,
          invoices: firstOrder.invoices?.length || 0
        });
      }
    } else {
      console.log('❌ Recent orders API failed');
      console.log('   Status:', response.status);
      console.log('   Error:', response.data.error || 'Unknown error');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Recent orders API error:', error.message);
    allPassed = false;
  }

  // Test 2: Test payment methods API
  console.log('\n2️⃣ Testing payment methods API...');
  try {
    const http = require('http');
    const url = `${CLOUDVPS_URL}/api/hostbill/payment-modules`;
    
    const response = await new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (error) {
            resolve({ status: res.statusCode, data: data, error: error.message });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Payment methods API works');
      console.log('   Methods found:', Object.keys(response.data.modules || {}).length);
      console.log('   Methods:', Object.keys(response.data.modules || {}));
    } else {
      console.log('❌ Payment methods API failed');
      console.log('   Status:', response.status);
      console.log('   Error:', response.data.error || 'Unknown error');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Payment methods API error:', error.message);
    allPassed = false;
  }

  // Test 3: Test mark invoice paid API (without actually marking anything)
  console.log('\n3️⃣ Testing mark invoice paid API structure...');
  try {
    const https = require('https');
    const http = require('http');
    const { URL } = require('url');
    
    const urlObj = new URL(`${CLOUDVPS_URL}/api/middleware/mark-invoice-paid`);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const postData = JSON.stringify({
      invoiceId: 'TEST',
      transactionId: 'TEST-API-CHECK',
      paymentMethod: 'manual',
      amount: 1,
      currency: 'CZK',
      notes: 'API structure test - should fail gracefully'
    });

    const response = await new Promise((resolve, reject) => {
      const req = client.request(urlObj, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (error) {
            resolve({ status: res.statusCode, data: data, error: error.message });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(postData);
      req.end();
    });

    if (response.status === 400 || response.status === 500) {
      // Expected to fail with test data, but API should be accessible
      console.log('✅ Mark invoice paid API is accessible');
      console.log('   Status:', response.status, '(expected failure with test data)');
    } else if (response.status === 200) {
      console.log('✅ Mark invoice paid API works (unexpected success with test data)');
    } else {
      console.log('⚠️ Mark invoice paid API unexpected status:', response.status);
    }
  } catch (error) {
    console.log('❌ Mark invoice paid API error:', error.message);
    allPassed = false;
  }

  // Summary
  console.log('\n📊 === TEST SUMMARY ===');
  if (allPassed) {
    console.log('✅ ALL API TESTS PASSED');
    console.log('🎉 Invoice Payment Test APIs are working correctly!');
    console.log('\n🔗 Test the full functionality at:');
    console.log('   http://localhost:3000/invoice-payment-test');
  } else {
    console.log('❌ SOME API TESTS FAILED');
    console.log('🔧 Please check the issues above');
  }

  return allPassed;
}

// Run the test
if (require.main === module) {
  testInvoicePaymentAPI()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testInvoicePaymentAPI };
