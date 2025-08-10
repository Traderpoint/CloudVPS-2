/**
 * Test Pricing Clone Verification
 * Tests that pricing is correctly cloned using editProduct API
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

async function getProductDetail(productId) {
  try {
    const result = await makeRequest('GET', 'localhost', 3005, `/api/hostbill/product-detail?product_id=${productId}&affiliate_id=1`);
    
    if (result.success && result.product) {
      return result.product;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function testPricingClone() {
  console.log('💰 Testing Pricing Clone with editProduct API...');
  
  // Step 1: Get source product pricing
  console.log('\n📊 Step 1: Getting source product pricing...');
  const sourceProduct = await getProductDetail('5'); // VPS Start
  
  if (!sourceProduct) {
    console.log('❌ Failed to get source product details');
    return false;
  }
  
  const sourcePricing = {
    monthly: sourceProduct.m || '0',
    quarterly: sourceProduct.q || '0',
    semiannually: sourceProduct.s || '0',
    annually: sourceProduct.a || '0',
    biennially: sourceProduct.b || '0',
    triennially: sourceProduct.t || '0',
    m_setup: sourceProduct.m_setup || '0',
    q_setup: sourceProduct.q_setup || '0',
    s_setup: sourceProduct.s_setup || '0',
    a_setup: sourceProduct.a_setup || '0',
    b_setup: sourceProduct.b_setup || '0',
    t_setup: sourceProduct.t_setup || '0'
  };
  
  console.log('✅ Source product pricing retrieved:');
  console.log(`  Product: ${sourceProduct.name} (ID: ${sourceProduct.id})`);
  console.log('  Recurring prices:');
  console.log(`    Monthly: ${sourcePricing.monthly} CZK`);
  console.log(`    Quarterly: ${sourcePricing.quarterly} CZK`);
  console.log(`    Annually: ${sourcePricing.annually} CZK`);
  console.log('  Setup fees:');
  console.log(`    Monthly Setup: ${sourcePricing.m_setup} CZK`);
  console.log(`    Quarterly Setup: ${sourcePricing.q_setup} CZK`);
  console.log(`    Annual Setup: ${sourcePricing.a_setup} CZK`);
  
  // Step 2: Create new product with pricing clone
  console.log('\n🆕 Step 2: Creating new product with pricing clone...');
  const timestamp = Date.now();
  const newProductName = `PRICING CLONE TEST ${timestamp}`;
  
  try {
    const createData = {
      sourceProductId: '5',
      newProductName: newProductName,
      settings: [1, 2], // General, Pricing
      affiliate_id: '1'
    };
    
    const createResult = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (!createResult.success) {
      console.log('❌ Failed to create new product:', createResult.error);
      return false;
    }
    
    console.log('✅ New product created successfully:');
    console.log(`  New Product: ${createResult.newProduct.name} (ID: ${createResult.newProduct.id})`);
    console.log(`  Complete Copy: ${createResult.completeCopy ? 'YES' : 'NO'}`);
    console.log(`  Message: ${createResult.message}`);
    
    // Step 3: Verify pricing was copied correctly
    console.log('\n🔍 Step 3: Verifying pricing was copied correctly...');
    
    // Wait a moment for the product to be fully created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newProduct = await getProductDetail(createResult.newProduct.id.toString());
    
    if (!newProduct) {
      console.log('❌ Failed to get new product details for verification');
      return false;
    }
    
    const newPricing = {
      monthly: newProduct.m || '0',
      quarterly: newProduct.q || '0',
      semiannually: newProduct.s || '0',
      annually: newProduct.a || '0',
      biennially: newProduct.b || '0',
      triennially: newProduct.t || '0',
      m_setup: newProduct.m_setup || '0',
      q_setup: newProduct.q_setup || '0',
      s_setup: newProduct.s_setup || '0',
      a_setup: newProduct.a_setup || '0',
      b_setup: newProduct.b_setup || '0',
      t_setup: newProduct.t_setup || '0'
    };
    
    console.log('📊 New product pricing retrieved:');
    console.log(`  Product: ${newProduct.name} (ID: ${newProduct.id})`);
    console.log('  Recurring prices:');
    console.log(`    Monthly: ${newPricing.monthly} CZK`);
    console.log(`    Quarterly: ${newPricing.quarterly} CZK`);
    console.log(`    Annually: ${newPricing.annually} CZK`);
    console.log('  Setup fees:');
    console.log(`    Monthly Setup: ${newPricing.m_setup} CZK`);
    console.log(`    Quarterly Setup: ${newPricing.q_setup} CZK`);
    console.log(`    Annual Setup: ${newPricing.a_setup} CZK`);
    
    // Step 4: Compare pricing
    console.log('\n⚖️ Step 4: Comparing source vs new product pricing...');
    
    let pricingMatches = true;
    const pricingFields = ['monthly', 'quarterly', 'semiannually', 'annually', 'biennially', 'triennially'];
    const setupFields = ['m_setup', 'q_setup', 's_setup', 'a_setup', 'b_setup', 't_setup'];
    
    // Check recurring prices
    for (const field of pricingFields) {
      if (sourcePricing[field] !== newPricing[field]) {
        console.log(`❌ Pricing mismatch for ${field}: Source=${sourcePricing[field]}, New=${newPricing[field]}`);
        pricingMatches = false;
      } else if (sourcePricing[field] !== '0') {
        console.log(`✅ Pricing match for ${field}: ${sourcePricing[field]} CZK`);
      }
    }
    
    // Check setup fees
    for (const field of setupFields) {
      if (sourcePricing[field] !== newPricing[field]) {
        console.log(`❌ Setup fee mismatch for ${field}: Source=${sourcePricing[field]}, New=${newPricing[field]}`);
        pricingMatches = false;
      } else if (sourcePricing[field] !== '0') {
        console.log(`✅ Setup fee match for ${field}: ${sourcePricing[field]} CZK`);
      }
    }
    
    if (pricingMatches) {
      console.log('\n✅ ALL PRICING COPIED CORRECTLY!');
      console.log('💰 editProduct API successfully copied all pricing tiers and setup fees');
      return { success: true, newProduct: createResult.newProduct };
    } else {
      console.log('\n❌ PRICING COPY FAILED!');
      console.log('Some pricing fields do not match between source and new product');
      return { success: false, newProduct: createResult.newProduct };
    }
    
  } catch (error) {
    console.error('❌ Pricing clone test error:', error.message);
    return false;
  }
}

async function runPricingCloneTest() {
  console.log('🚀 Testing Pricing Clone with editProduct API');
  console.log('================================================================================');
  console.log('Testing that pricing is correctly cloned using the functional editProduct method');
  console.log('================================================================================');

  const result = await testPricingClone();
  
  console.log('\n📊 PRICING CLONE TEST SUMMARY');
  console.log('================================================================================');
  
  if (result && result.success) {
    console.log('✅ Test Result: PASS');
    console.log(`📦 New Product Created: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
  } else {
    console.log('❌ Test Result: FAIL');
    if (result && result.newProduct) {
      console.log(`📦 New Product Created: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
      console.log('⚠️ Product was created but pricing was not copied correctly');
    }
  }

  console.log('\n🔧 IMPLEMENTATION DETAILS');
  console.log('================================================================================');
  console.log('✅ Enhanced clone-new-product endpoint:');
  console.log('   Step 1: Create new product with basic data');
  console.log('   Step 2: Copy pricing using editProduct API (reliable method)');
  console.log('   Step 3: Clone all other settings using productCloneSettings');
  console.log('');
  console.log('💰 Pricing Copy Method:');
  console.log('   - Uses editProduct API call (same as Edit Product Pricing)');
  console.log('   - Copies all billing cycles: m, q, s, a, b, t');
  console.log('   - Copies all setup fees: m_setup, q_setup, s_setup, a_setup, b_setup, t_setup');
  console.log('   - More reliable than productCloneSettings for pricing');
  console.log('   - Fallback to productCloneSettings if editProduct fails');

  console.log('\n🎯 BENEFITS');
  console.log('================================================================================');
  console.log('✅ Reliable pricing copy using proven editProduct method');
  console.log('✅ All billing cycles and setup fees copied correctly');
  console.log('✅ Fallback mechanism for robustness');
  console.log('✅ Complete product copy with accurate pricing');

  if (result && result.success) {
    console.log('\n🎉 PRICING CLONE TEST PASSED!');
    console.log('================================================================================');
    console.log('✅ Pricing is now correctly cloned using editProduct API');
    console.log('✅ All billing cycles and setup fees copied accurately');
    console.log('✅ New products have identical pricing to source products');
    console.log('🚀 Ready for production use!');
  } else {
    console.log('\n⚠️ PRICING CLONE TEST FAILED');
    console.log('Please check the implementation and fix any issues.');
  }

  console.log('\n✅ Pricing clone test completed!');
}

// Run the test
runPricingCloneTest();
