/**
 * Simple Communication Test between CloudVPS and Middleware
 * Tests the correct ports: CloudVPS (3000) ↔ Middleware (3005)
 */

// Use built-in fetch (Node.js 18+) or create a simple HTTP test

const CLOUDVPS_URL = 'http://localhost:3000';
const MIDDLEWARE_URL = 'http://localhost:3005';

// Simple HTTP test function using Node.js built-in modules
async function testUrl(url, description) {
  return new Promise((resolve) => {
    const http = require('http');
    const https = require('https');
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.get(url, (res) => {
      console.log(`✅ ${description}: OK (Status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}: FAILED - ${error.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`❌ ${description}: TIMEOUT`);
      resolve(false);
    });
  });
}

async function testCommunication() {
  console.log('🧪 === SIMPLE COMMUNICATION TEST ===\n');
  console.log('🎯 Testing CloudVPS (3000) ↔ Middleware (3005) communication');
  console.log('📝 Remember: Middleware MUST run ONLY on port 3005!\n');

  let allPassed = true;

  // Test 1: Check if CloudVPS is running
  console.log('1️⃣ Testing CloudVPS availability...');
  const cloudvpsResult = await testUrl(CLOUDVPS_URL, 'CloudVPS (port 3000)');
  if (!cloudvpsResult) allPassed = false;

  // Test 2: Check if Middleware is running on port 3005
  console.log('\n2️⃣ Testing Middleware availability...');
  const middlewareResult = await testUrl(MIDDLEWARE_URL, 'Middleware (port 3005)');
  if (!middlewareResult) allPassed = false;

  // Test 3: Test Middleware API endpoints
  console.log('\n3️⃣ Testing Middleware API endpoints...');

  const healthResult = await testUrl(`${MIDDLEWARE_URL}/api/health`, 'Middleware Health API');
  if (!healthResult) allPassed = false;

  const paymentModulesResult = await testUrl(`${MIDDLEWARE_URL}/api/payment-modules`, 'Middleware Payment Modules API');
  if (!paymentModulesResult) allPassed = false;

  // Test 4: Test CloudVPS → Middleware communication
  console.log('\n4️⃣ Testing CloudVPS → Middleware communication...');

  const cloudvpsApiResult = await testUrl(`${CLOUDVPS_URL}/api/hostbill/payment-modules`, 'CloudVPS → Middleware API');
  if (!cloudvpsApiResult) allPassed = false;

  // Test 5: Test Invoice Payment Test page
  console.log('\n5️⃣ Testing Invoice Payment Test page...');
  const invoicePageResult = await testUrl(`${CLOUDVPS_URL}/invoice-payment-test`, 'Invoice Payment Test Page');
  if (!invoicePageResult) allPassed = false;

  // Test 6: Test recent orders API (used by Invoice Payment Test)
  console.log('\n6️⃣ Testing recent orders API...');
  const ordersApiResult = await testUrl(`${MIDDLEWARE_URL}/api/orders/recent?limit=5`, 'Recent Orders API');
  if (!ordersApiResult) allPassed = false;

  // Summary
  console.log('\n📊 === TEST SUMMARY ===');
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('🎉 CloudVPS ↔ Middleware communication is working correctly!');
    console.log('\n🔗 Available URLs:');
    console.log('   CloudVPS: http://localhost:3000');
    console.log('   Middleware: http://localhost:3005');
    console.log('   Middleware Dashboard: http://localhost:3005/dashboard');
    console.log('   Invoice Payment Test: http://localhost:3000/invoice-payment-test');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('🔧 Please check the issues above');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Ensure CloudVPS is running: npm run dev (in main folder)');
    console.log('   2. Ensure Middleware is running: npm run dev (in systrix-middleware-nextjs folder)');
    console.log('   3. Verify Middleware runs ONLY on port 3005');
    console.log('   4. Check .env.local has NEXT_PUBLIC_MIDDLEWARE_URL=http://localhost:3005');
  }

  return allPassed;
}

// Run the test
if (require.main === module) {
  testCommunication()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testCommunication };
