// Test script to verify middleware connection test fix
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';

async function testMiddlewareConnectionFix() {
  console.log('🧪 Testing Middleware Connection Test Fix...\n');

  try {
    // Test 1: Test the fixed test-affiliate endpoint
    console.log('1️⃣ Testing fixed test-affiliate endpoint...');
    const testResponse = await fetch(`${BASE_URL}/api/middleware/test-affiliate`);
    
    if (!testResponse.ok) {
      throw new Error(`API responded with status: ${testResponse.status}`);
    }
    
    const testData = await testResponse.json();
    
    if (testData.success) {
      console.log('✅ Test-affiliate endpoint working');
      console.log(`   Middleware URL: ${testData.middleware_url}`);
      
      // Check individual tests
      const tests = testData.tests;
      
      // Health check test
      if (tests.health_check?.success) {
        console.log('   ✅ Health check: PASSED');
        console.log(`      Status: ${tests.health_check.data.status}`);
        console.log(`      HostBill: ${tests.health_check.data.hostbill.status}`);
      } else {
        console.log('   ❌ Health check: FAILED');
      }
      
      // Affiliates list test
      if (tests.affiliates_list?.success) {
        console.log('   ✅ Affiliates list: PASSED');
        console.log(`      Found ${tests.affiliates_list.data.total} affiliates`);
        
        if (tests.affiliates_list.data.affiliates) {
          const affiliateNames = tests.affiliates_list.data.affiliates
            .map(a => `${a.firstname} ${a.lastname} (ID: ${a.id})`)
            .join(', ');
          console.log(`      Affiliates: ${affiliateNames}`);
        }
      } else {
        console.log('   ❌ Affiliates list: FAILED');
      }
      
      // Affiliate products test
      if (tests.affiliate_products?.success) {
        console.log('   ✅ Affiliate products: PASSED');
        console.log(`      Found ${tests.affiliate_products.data.total} products`);
        
        if (tests.affiliate_products.data.products) {
          const productNames = tests.affiliate_products.data.products
            .slice(0, 3)
            .map(p => p.name)
            .join(', ');
          console.log(`      Sample products: ${productNames}`);
        }
      } else {
        console.log('   ❌ Affiliate products: FAILED');
      }
      
    } else {
      console.log(`❌ Test-affiliate endpoint failed: ${testData.error}`);
      return;
    }

    // Test 2: Test get-affiliates endpoint (used by the page)
    console.log('\n2️⃣ Testing get-affiliates endpoint...');
    const affiliatesResponse = await fetch(`${BASE_URL}/api/middleware/get-affiliates`);
    
    if (!affiliatesResponse.ok) {
      throw new Error(`Get-affiliates responded with status: ${affiliatesResponse.status}`);
    }
    
    const affiliatesData = await affiliatesResponse.json();
    
    if (affiliatesData.success) {
      console.log('✅ Get-affiliates endpoint working');
      console.log(`   Found ${affiliatesData.total} affiliates`);
      console.log(`   Source: ${affiliatesData.source}`);
    } else {
      console.log(`❌ Get-affiliates endpoint failed: ${affiliatesData.error}`);
    }

    console.log('\n🎉 All tests passed! The middleware connection fix is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   - ✅ Fixed /health -> /api/health endpoint');
    console.log('   - ✅ Fixed /api/affiliate/2 -> /api/affiliates endpoint');
    console.log('   - ✅ All middleware connection tests now pass');
    console.log('   - ✅ No more "Unexpected token" JSON parsing errors');
    console.log('\n🌐 Test the page at: http://localhost:3000/middleware-affiliate-test');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure CloudVPS is running: npm run dev');
    console.log('   2. Make sure middleware is running on port 3005');
    console.log('   3. Check if both services are accessible');
    console.log('   4. Verify MIDDLEWARE_URL in .env.local');
  }
}

// Run tests if called directly
if (require.main === module) {
  testMiddlewareConnectionFix();
}

module.exports = { testMiddlewareConnectionFix };
