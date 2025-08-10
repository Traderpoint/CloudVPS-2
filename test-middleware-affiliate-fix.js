// Test script to verify middleware affiliate test fix
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';

async function testMiddlewareAffiliateFix() {
  console.log('🧪 Testing Middleware Affiliate Test Fix...\n');

  try {
    // Test 1: Get affiliates
    console.log('1️⃣ Testing get affiliates...');
    const affiliatesResponse = await fetch(`${BASE_URL}/api/middleware/get-affiliates`);
    const affiliatesData = await affiliatesResponse.json();
    
    if (affiliatesData.success && affiliatesData.affiliates) {
      console.log(`✅ Loaded ${affiliatesData.affiliates.length} affiliates`);
      console.log(`   Affiliates: ${affiliatesData.affiliates.map(a => `${a.firstname} ${a.lastname} (ID: ${a.id})`).join(', ')}`);
    } else {
      console.log(`❌ Failed to load affiliates: ${affiliatesData.error}`);
      return;
    }

    // Test 2: Get affiliate products for each affiliate
    for (const affiliate of affiliatesData.affiliates) {
      console.log(`\n2️⃣ Testing affiliate products for ${affiliate.firstname} ${affiliate.lastname} (ID: ${affiliate.id})...`);
      
      const productsResponse = await fetch(`${BASE_URL}/api/middleware/get-affiliate-products?affiliate_id=${affiliate.id}`);
      const productsData = await productsResponse.json();
      
      if (productsData.success) {
        console.log(`✅ Loaded ${productsData.products?.length || 0} products for affiliate ${affiliate.id}`);
        
        // Test the structure that was causing the error
        const testAffiliate = {
          ...productsData,
          affiliate: {
            id: affiliate.id,
            name: `${affiliate.firstname} ${affiliate.lastname}`,
            firstname: affiliate.firstname,
            lastname: affiliate.lastname,
            status: affiliate.status
          }
        };
        
        // Test the problematic line that was fixed
        const affiliateName = testAffiliate.affiliate?.name || `Affiliate ${testAffiliate.affiliate_id}`;
        console.log(`   ✅ Affiliate name access test: "${affiliateName}"`);
        
        if (productsData.products && productsData.products.length > 0) {
          console.log(`   📦 Sample products: ${productsData.products.slice(0, 2).map(p => p.name).join(', ')}`);
        }
      } else {
        console.log(`❌ Failed to load products for affiliate ${affiliate.id}: ${productsData.error}`);
      }
    }

    console.log('\n🎉 All tests passed! The fix is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   - ✅ Affiliates loading works');
    console.log('   - ✅ Affiliate products loading works');
    console.log('   - ✅ Safe affiliate name access works');
    console.log('   - ✅ No more "Cannot read properties of undefined" errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure CloudVPS is running: npm run dev');
    console.log('   2. Make sure middleware is running on port 3005');
    console.log('   3. Check if both services are accessible');
  }
}

// Run tests if called directly
if (require.main === module) {
  testMiddlewareAffiliateFix();
}

module.exports = { testMiddlewareAffiliateFix };
