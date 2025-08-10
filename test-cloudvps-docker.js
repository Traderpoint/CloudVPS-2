// Test script to verify CloudVPS Docker container functionality
// Run this after starting the Docker container

const axios = require('axios');

const CLOUDVPS_URL = process.env.CLOUDVPS_URL || 'http://localhost:3000';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    console.log(`🧪 Testing ${method} ${endpoint}...`);
    
    const config = {
      method,
      url: `${CLOUDVPS_URL}${endpoint}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${endpoint} - Status: ${response.status}`);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ ${endpoint} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🐳 Testing CloudVPS Docker Container');
  console.log('====================================');
  console.log(`🌐 CloudVPS URL: ${CLOUDVPS_URL}`);
  console.log('');

  const tests = [
    // Basic pages
    { name: 'Home Page', endpoint: '/' },
    { name: 'VPS Selection Page', endpoint: '/vps' },
    { name: 'Billing Page', endpoint: '/billing' },
    { name: 'Test Cart Page', endpoint: '/test-cart' },
    
    // API endpoints - Auth
    { name: 'NextAuth Session', endpoint: '/api/auth/session' },
    { name: 'NextAuth Providers', endpoint: '/api/auth/providers' },
    
    // API endpoints - Orders
    { name: 'Orders Create API', endpoint: '/api/orders/create', method: 'POST', data: {
      type: 'complete',
      customer: {
        firstName: 'Docker',
        lastName: 'Test',
        email: 'docker-test@example.com',
        phone: '+420123456789',
        address: 'Test Address 123',
        city: 'Prague',
        postalCode: '12000',
        country: 'CZ'
      },
      items: [
        {
          productId: 1,
          name: 'VPS Start',
          price: 249,
          quantity: 1,
          cycle: 'm'
        }
      ],
      paymentMethod: 'banktransfer',
      total: 249
    }},
    
    // API endpoints - Payments
    { name: 'Payment Initialize', endpoint: '/api/payments/initialize', method: 'POST', data: {
      invoiceId: 'test-123',
      amount: 249,
      method: 'comgate'
    }},
    
    // API endpoints - Middleware communication
    { name: 'Middleware Recent Orders', endpoint: '/api/middleware/recent-orders' },
    { name: 'Middleware Affiliate Products', endpoint: '/api/middleware/affiliate-products' },
    { name: 'Middleware Payment Methods', endpoint: '/api/middleware/payment-methods-test' },
    
    // API endpoints - HostBill direct
    { name: 'HostBill Products', endpoint: '/api/hostbill/products' },
    { name: 'HostBill Affiliates', endpoint: '/api/hostbill/affiliates' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(
      test.endpoint, 
      test.method || 'GET', 
      test.data || null
    );
    
    if (result.success) {
      passed++;
      
      // Show additional info for specific endpoints
      if (test.endpoint === '/api/auth/session' && result.data) {
        console.log(`   👤 User: ${result.data.user ? 'Logged in' : 'Not logged in'}`);
      }
      
      if (test.endpoint === '/api/orders/create' && result.data) {
        console.log(`   📋 Order: ${result.data.success ? 'Created' : 'Failed'}`);
        if (result.data.orders?.[0]) {
          console.log(`   💰 Total: ${result.data.orders[0].totalAmount || 'unknown'} CZK`);
        }
      }
      
      if (test.endpoint === '/api/hostbill/products' && result.data) {
        console.log(`   📦 Products: ${result.data.products?.length || 0} found`);
      }
    } else {
      failed++;
    }
    
    console.log('');
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('');
    console.log('🎉 All tests passed! CloudVPS Docker container is fully functional.');
    console.log('');
    console.log('🌐 Available features:');
    console.log(`   VPS Selection: ${CLOUDVPS_URL}/vps`);
    console.log(`   Billing Form: ${CLOUDVPS_URL}/billing`);
    console.log(`   Google OAuth: ${CLOUDVPS_URL}/api/auth/signin`);
    console.log(`   Test Cart: ${CLOUDVPS_URL}/test-cart`);
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Check the container logs:');
    console.log('   docker-compose logs -f cloudvps');
    
    if (failed > passed) {
      console.log('');
      console.log('🔧 Common issues:');
      console.log('   - Environment variables not configured (.env file)');
      console.log('   - Google OAuth credentials invalid');
      console.log('   - HostBill API credentials invalid');
      console.log('   - Middleware not running on port 3005');
      process.exit(1);
    }
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error.message);
  process.exit(1);
});
