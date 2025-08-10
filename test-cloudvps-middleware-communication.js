/**
 * Test komunikace mezi CloudVPS a Middleware
 * Testuje všechny middleware endpointy z test-portálu
 */

const BASE_URL = 'http://localhost:3000';
const MIDDLEWARE_URL = 'http://localhost:3005';

async function testCommunication() {
  console.log('🔍 TESTING CLOUDVPS ↔ MIDDLEWARE COMMUNICATION');
  console.log('═'.repeat(60));
  
  let allTestsPassed = true;
  
  // Test 1: Direct Middleware Connectivity
  console.log('\n1️⃣ DIRECT MIDDLEWARE CONNECTIVITY');
  console.log('-'.repeat(40));
  
  const middlewareEndpoints = [
    { name: 'Health Check', path: '/health' },
    { name: 'Affiliates', path: '/api/affiliates' },
    { name: 'Products', path: '/api/products' },
    { name: 'Test Connection', path: '/api/test-connection' },
    { name: 'Payment Methods', path: '/api/payments/methods' }
  ];
  
  for (const endpoint of middlewareEndpoints) {
    try {
      const response = await fetch(`${MIDDLEWARE_URL}${endpoint.path}`);
      if (response.ok) {
        console.log(`✅ ${endpoint.name}: OK (${response.status})`);
      } else {
        console.log(`❌ ${endpoint.name}: Failed (${response.status})`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      allTestsPassed = false;
    }
  }
  
  // Test 2: CloudVPS API Endpoints (via middleware)
  console.log('\n2️⃣ CLOUDVPS API ENDPOINTS (VIA MIDDLEWARE)');
  console.log('-'.repeat(40));
  
  const cloudvpsApiEndpoints = [
    { name: 'Middleware Health', path: '/api/middleware/health' },
    { name: 'Middleware Test Affiliate', path: '/api/middleware/test-affiliate' },
    { name: 'Middleware Get Affiliates', path: '/api/middleware/get-affiliates' },
    { name: 'Middleware Get All Products', path: '/api/middleware/get-all-products' },
    { name: 'Middleware Get Product Mapping', path: '/api/middleware/get-product-mapping' }
  ];
  
  for (const endpoint of cloudvpsApiEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: OK - ${data.success ? 'Success' : 'Failed'}`);
        if (!data.success) allTestsPassed = false;
      } else {
        console.log(`❌ ${endpoint.name}: Failed (${response.status})`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      allTestsPassed = false;
    }
  }
  
  // Test 3: Test Portal Pages
  console.log('\n3️⃣ TEST PORTAL PAGES');
  console.log('-'.repeat(40));
  
  const testPages = [
    { name: 'Test Portal', path: '/test-portal' },
    { name: 'Middleware Test', path: '/middleware-test' },
    { name: 'Middleware Affiliate Test', path: '/middleware-affiliate-test' },
    { name: 'Middleware Products', path: '/middleware-affiliate-products' },
    { name: 'Middleware Order Test', path: '/middleware-order-test' },
    { name: 'Payment Methods Test', path: '/payment-methods-test' },
    { name: 'Middleware Dashboard', path: '/middleware-dashboard' }
  ];
  
  for (const page of testPages) {
    try {
      const response = await fetch(`${BASE_URL}${page.path}`);
      if (response.ok) {
        console.log(`✅ ${page.name}: Accessible`);
      } else {
        console.log(`❌ ${page.name}: Failed (${response.status})`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${page.name}: Error - ${error.message}`);
      allTestsPassed = false;
    }
  }
  
  // Test 4: Configuration Check
  console.log('\n4️⃣ CONFIGURATION CHECK');
  console.log('-'.repeat(40));
  
  try {
    const response = await fetch(`${MIDDLEWARE_URL}/`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Middleware Root: ${data.name || 'OK'}`);
      console.log(`   Port: ${data.port || '3005'}`);
      console.log(`   Version: ${data.version || 'Unknown'}`);
    }
  } catch (error) {
    console.log(`❌ Middleware Root: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Results
  console.log('\n' + '═'.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL COMMUNICATION TESTS PASSED! 🎉');
    console.log('\n✅ COMMUNICATION STATUS:');
    console.log('   🌐 CloudVPS: http://localhost:3000 ✅');
    console.log('   🔗 Middleware: http://localhost:3010 ✅');
    console.log('   📡 Communication: WORKING ✅');
    console.log('   🧪 Test Portal: FUNCTIONAL ✅');
    
    console.log('\n🎯 READY FOR TESTING:');
    console.log('   • All middleware endpoints accessible');
    console.log('   • CloudVPS API routes working');
    console.log('   • Test portal pages loading');
    console.log('   • Communication flow established');
    
  } else {
    console.log('❌ SOME COMMUNICATION ISSUES DETECTED');
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('   1. Ensure both servers are running');
    console.log('   2. Check CloudVPS: npm run dev (port 3000)');
    console.log('   3. Check Middleware: npm start (port 3010)');
    console.log('   4. Verify CORS configuration');
  }
  
  console.log('\n📊 TEST SUMMARY:');
  console.log(`   Status: ${allTestsPassed ? 'PASS' : 'FAIL'}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
}

// Run the test
testCommunication().catch(console.error);
