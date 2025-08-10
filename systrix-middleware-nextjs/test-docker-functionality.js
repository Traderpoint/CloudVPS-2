// Test script to verify Docker container functionality
// Run this after starting the Docker container

const axios = require('axios');

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    console.log(`🧪 Testing ${method} ${endpoint}...`);
    
    const config = {
      method,
      url: `${MIDDLEWARE_URL}${endpoint}`,
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
  console.log('🐳 Testing Systrix Middleware NextJS Docker Container');
  console.log('====================================================');
  console.log(`🌐 Middleware URL: ${MIDDLEWARE_URL}`);
  console.log('');

  const tests = [
    // Basic health checks
    { name: 'Health Check', endpoint: '/api/health' },
    { name: 'Status Check', endpoint: '/api/status' },
    
    // Dashboard
    { name: 'Dashboard Page', endpoint: '/dashboard' },
    
    // API endpoints
    { name: 'Products API', endpoint: '/api/products' },
    { name: 'Payment Methods', endpoint: '/api/payments/methods' },
    { name: 'Product Mapping', endpoint: '/api/product-mapping' },
    
    // HostBill connectivity
    { name: 'HostBill Connection Test', endpoint: '/api/test-connection' },
    
    // Order creation test
    {
      name: 'Order Creation Test',
      endpoint: '/api/orders/create',
      method: 'POST',
      data: {
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
      }
    }
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
      if (test.endpoint === '/api/health' && result.data) {
        console.log(`   📊 HostBill: ${result.data.hostbill?.status || 'unknown'}`);
        console.log(`   🕐 Uptime: ${result.data.uptime || 'unknown'}`);
      }
      
      if (test.endpoint === '/api/status' && result.data) {
        console.log(`   📈 Version: ${result.data.version || 'unknown'}`);
        console.log(`   🔧 Environment: ${result.data.environment || 'unknown'}`);
      }
      
      if (test.endpoint === '/api/orders/create' && result.data) {
        console.log(`   📋 Order ID: ${result.data.orders?.[0]?.orderId || 'unknown'}`);
        console.log(`   💰 Total: ${result.data.orders?.[0]?.totalAmount || 'unknown'} CZK`);
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
    console.log('🎉 All tests passed! Docker container is fully functional.');
    console.log('');
    console.log('🌐 Available endpoints:');
    console.log(`   Dashboard: ${MIDDLEWARE_URL}/dashboard`);
    console.log(`   Health: ${MIDDLEWARE_URL}/api/health`);
    console.log(`   Status: ${MIDDLEWARE_URL}/api/status`);
    console.log(`   Orders: ${MIDDLEWARE_URL}/api/orders/create`);
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Check the container logs:');
    console.log('   docker-compose logs -f');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error.message);
  process.exit(1);
});
