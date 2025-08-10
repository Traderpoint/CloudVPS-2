/**
 * Test Page Products Loading
 * Tests if products are loading correctly on the middleware-affiliate-products page
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

async function testMiddlewareAffiliateAPI() {
  console.log('🎯 Testing Middleware Affiliate API (what the page should call)...');
  
  const testEndpoints = [
    '/api/middleware/affiliate/1/products?mode=affiliate',
    '/api/middleware/affiliate/1/products',
    '/api/hostbill/affiliates/1/products',
    '/api/hostbill/products?affiliate_id=1'
  ];

  for (const endpoint of testEndpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint}`);
      
      const result = await makeRequest('GET', 'localhost', 3000, endpoint);
      
      if (result.success && result.products) {
        console.log('✅ API Response successful');
        console.log(`📊 Found ${result.products.length} products`);
        
        // Show first few products
        const firstProducts = result.products.slice(0, 3);
        console.log('📋 Sample products:');
        firstProducts.forEach(product => {
          console.log(`  - ID: ${product.id}, Name: ${product.name}, Category: ${product.category || 'N/A'}`);
        });
        
        return { endpoint, products: result.products };
        
      } else {
        console.log('❌ API Response failed:', result.error || 'No products found');
        if (result.raw) {
          console.log('📋 Raw response:', result.raw.substring(0, 200) + '...');
        }
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
  }
  
  return null;
}

async function testDirectHostBillAPI() {
  console.log('\n🔧 Testing Direct HostBill API calls...');
  
  try {
    // Test getting categories first
    console.log('📂 Testing getOrderPages (categories)...');
    const categoriesResult = await makeRequest('GET', 'localhost', 3000, '/api/hostbill/categories');
    
    if (categoriesResult.success) {
      console.log('✅ Categories loaded successfully');
      console.log(`📊 Found ${categoriesResult.categories?.length || 0} categories`);
    } else {
      console.log('❌ Categories failed:', categoriesResult.error);
    }
    
    // Test getting products for a specific category
    console.log('\n📦 Testing getProducts for category...');
    const productsResult = await makeRequest('GET', 'localhost', 3000, '/api/hostbill/products?category_id=1');
    
    if (productsResult.success) {
      console.log('✅ Products loaded successfully');
      console.log(`📊 Found ${productsResult.products?.length || 0} products`);
    } else {
      console.log('❌ Products failed:', productsResult.error);
    }
    
  } catch (error) {
    console.error('❌ Direct HostBill API test failed:', error.message);
  }
}

async function runPageProductsTest() {
  console.log('🚀 Testing Page Products Loading');
  console.log('================================================================================');
  console.log('Checking why products are not loading in View Details dropdown');
  console.log('================================================================================');

  // Test 1: Try to find working affiliate products API
  const workingAPI = await testMiddlewareAffiliateAPI();
  
  // Test 2: Test direct HostBill API calls
  await testDirectHostBillAPI();
  
  // Summary and recommendations
  console.log('\n📊 PAGE PRODUCTS LOADING ANALYSIS');
  console.log('================================================================================');
  
  if (workingAPI) {
    console.log(`✅ Working API found: ${workingAPI.endpoint}`);
    console.log(`📊 Products available: ${workingAPI.products.length}`);
    console.log('\n🔧 RECOMMENDATION:');
    console.log(`Update loadAffiliateProducts() to call: ${workingAPI.endpoint}`);
  } else {
    console.log('❌ No working affiliate products API found');
    console.log('\n🔧 POSSIBLE SOLUTIONS:');
    console.log('1. Check if middleware server is running on port 3005');
    console.log('2. Create missing API endpoints');
    console.log('3. Update API calls to use existing endpoints');
    console.log('4. Use direct HostBill API calls instead of middleware');
  }
  
  console.log('\n🐛 DEBUGGING STEPS FOR VIEW DETAILS:');
  console.log('================================================================================');
  console.log('1. Check debug info on page (Data loaded, Products count)');
  console.log('2. Open browser console and check for errors');
  console.log('3. Check Network tab for failed API calls');
  console.log('4. Verify loadAffiliateProducts() is called');
  console.log('5. Check if data.products is populated');
  console.log('6. Verify allProducts state is updated');
  
  console.log('\n🔧 CURRENT PAGE FLOW:');
  console.log('================================================================================');
  console.log('1. Page loads → useEffect calls loadAffiliateProducts()');
  console.log('2. loadAffiliateProducts() calls middleware API');
  console.log('3. data state is updated with products');
  console.log('4. useEffect(loadAllProducts, [data]) updates allProducts');
  console.log('5. allProducts populates View Details dropdown');
  console.log('6. User selects product and clicks View Details');
  console.log('7. loadProductDetail() calls /api/hostbill/product-detail');
  
  console.log('\n✅ Page products loading test completed!');
}

// Run the test
runPageProductsTest();
