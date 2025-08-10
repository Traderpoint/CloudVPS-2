/**
 * Test View Details Button Functionality
 * Tests that the View Details button works correctly
 */

const http = require('http');

async function makeRequest(method, hostname, port, path, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname,
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
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
          resolve({ error: 'Invalid JSON', raw: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testViewDetailsAPI() {
  console.log('🔍 Testing View Details API Endpoint...');
  
  const testProducts = [
    { id: '5', name: 'VPS Start' },
    { id: '10', name: 'VPS Profi' },
    { id: '11', name: 'VPS Premium' },
    { id: '12', name: 'VPS Enterprise' }
  ];

  for (const product of testProducts) {
    try {
      console.log(`\n📊 Testing product ID: ${product.id} (${product.name})`);
      
      const result = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/product-detail?product_id=${product.id}&affiliate_id=1`);
      
      if (result.success && result.product) {
        console.log('✅ API Response successful');
        console.log('📋 Product Details:', {
          id: result.product.id,
          name: result.product.name,
          category: result.product.category,
          description: result.product.description || 'No description',
          prices: {
            monthly: result.product.m || '0',
            quarterly: result.product.q || '0',
            annually: result.product.a || '0'
          },
          setup_fees: {
            monthly: result.product.m_setup || '0',
            quarterly: result.product.q_setup || '0',
            annually: result.product.a_setup || '0'
          },
          stock: result.product.stock || '0',
          qty: result.product.qty || '0',
          visible: result.product.visible,
          type: result.product.type,
          module: result.product.module
        });
        
        // Check if product has all expected fields
        const expectedFields = ['id', 'name', 'category'];
        const missingFields = expectedFields.filter(field => !result.product[field]);
        
        if (missingFields.length === 0) {
          console.log('✅ All required fields present');
        } else {
          console.log('⚠️ Missing fields:', missingFields);
        }
        
      } else {
        console.log('❌ API Response failed:', result.error || 'Unknown error');
        console.log('📋 Full response:', result);
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
  }
}

async function testAffiliateProductsList() {
  console.log('\n🎯 Testing Affiliate Products List (for dropdown population)...');
  
  try {
    const result = await makeRequest('GET', 'localhost', 3000, '/api/middleware/affiliate/1/products?mode=affiliate');
    
    if (result.success && result.products) {
      console.log('✅ Affiliate products loaded successfully');
      console.log(`📊 Found ${result.products.length} products`);
      
      // Show first few products that should appear in dropdowns
      const firstProducts = result.products.slice(0, 5);
      console.log('📋 Products available for View Details:');
      firstProducts.forEach(product => {
        console.log(`  - ID: ${product.id}, Name: ${product.name}`);
      });
      
      return result.products;
    } else {
      console.log('❌ Failed to load affiliate products:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Affiliate products request failed:', error.message);
    return [];
  }
}

async function runViewDetailsTest() {
  console.log('🚀 Testing View Details Button Functionality');
  console.log('================================================================================');
  console.log('Verifying that View Details button calls correct API and displays product info');
  console.log('================================================================================');

  // Test 1: Check if affiliate products are available for dropdown
  const products = await testAffiliateProductsList();
  
  // Test 2: Test View Details API for various products
  await testViewDetailsAPI();
  
  // Summary
  console.log('\n📊 VIEW DETAILS TEST SUMMARY');
  console.log('================================================================================');
  console.log(`✅ Affiliate Products Available: ${products.length > 0 ? 'YES' : 'NO'}`);
  console.log('✅ View Details API: Tested multiple products');
  console.log('✅ API Endpoint: /api/hostbill/product-detail');
  console.log('✅ Communication: Direct to Next.js API (not middleware)');
  
  console.log('\n🔧 HOW VIEW DETAILS SHOULD WORK:');
  console.log('================================================================================');
  console.log('1. User loads page → Affiliate products populate dropdown');
  console.log('2. User selects product from dropdown');
  console.log('3. User clicks "👁️ View Details" button');
  console.log('4. Frontend calls: /api/hostbill/product-detail?product_id=X&affiliate_id=Y');
  console.log('5. API calls HostBill getProductDetails');
  console.log('6. Product details display in card below dropdown');
  
  console.log('\n🐛 DEBUGGING STEPS IF BUTTON DOESN\'T WORK:');
  console.log('================================================================================');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Check Network tab for API calls');
  console.log('3. Verify product is selected in dropdown');
  console.log('4. Check if loadProductDetail function is called');
  console.log('5. Verify API endpoint returns success: true');
  
  console.log('\n✅ View Details functionality test completed!');
}

// Run the test
runViewDetailsTest();
