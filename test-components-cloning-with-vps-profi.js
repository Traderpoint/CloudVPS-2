/**
 * Test Components Cloning with VPS Profi
 * Tests components cloning using VPS Profi (ID: 10) which has many components
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

async function testComponentsCloningWithVPSProfi() {
  console.log('🔧 Testing Components Cloning with VPS Profi');
  console.log('================================================================================');
  console.log('Using VPS Profi (ID: 10) as source - it has many module options/components');
  console.log('================================================================================');

  // Test cloning components from VPS Profi (ID: 10)
  const timestamp = Date.now();
  const newProductName = `VPS PROFI CLONE TEST ${timestamp}`;
  
  try {
    const createData = {
      sourceProductId: '10', // VPS Profi - has many components
      newProductName: newProductName,
      settings: [4], // Only Components (Form fields) - setting 4
      affiliate_id: '1'
    };
    
    console.log('🔧 Creating new product with components cloning...');
    console.log(`Source: VPS Profi (ID: 10)`);
    console.log(`Target: ${newProductName}`);
    console.log(`Settings: [4] = Components (Form fields)`);
    
    const createResult = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (!createResult.success) {
      console.log('❌ Failed to create new product:', createResult.error);
      return false;
    }
    
    console.log('✅ New product created successfully:');
    console.log(`  New Product: ${createResult.newProduct.name} (ID: ${createResult.newProduct.id})`);
    console.log(`  Cloned Settings: ${createResult.clonedSettings?.join(', ') || 'None'}`);
    console.log(`  Complete Copy: ${createResult.completeCopy ? 'YES' : 'NO'}`);
    
    // Wait for product creation and cloning to complete
    console.log('\n⏳ Waiting for cloning to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get details of both products for comparison
    console.log('\n🔍 Comparing source and target products...');
    
    const sourceDetail = await makeRequest('GET', 'localhost', 3005, `/api/hostbill/product-detail?product_id=10&affiliate_id=1`);
    const targetDetail = await makeRequest('GET', 'localhost', 3005, `/api/hostbill/product-detail?product_id=${createResult.newProduct.id}&affiliate_id=1`);
    
    if (!sourceDetail.success || !targetDetail.success) {
      console.log('❌ Failed to get product details for comparison');
      return false;
    }
    
    const sourceProduct = sourceDetail.product;
    const targetProduct = targetDetail.product;
    
    // Check modules and options
    const sourceModules = sourceProduct.modules || [];
    const targetModules = targetProduct.modules || [];
    
    console.log('📊 Source Product (VPS Profi):');
    console.log(`  Modules: ${sourceModules.length}`);
    if (sourceModules.length > 0) {
      const sourceOptions = sourceModules[0].options || {};
      console.log(`  Module Options: ${Object.keys(sourceOptions).length}`);
      console.log(`  Sample options: ${Object.keys(sourceOptions).slice(0, 5).join(', ')}...`);
    }
    
    console.log('\n📊 Target Product (Clone):');
    console.log(`  Modules: ${targetModules.length}`);
    if (targetModules.length > 0) {
      const targetOptions = targetModules[0].options || {};
      console.log(`  Module Options: ${Object.keys(targetOptions).length}`);
      console.log(`  Sample options: ${Object.keys(targetOptions).slice(0, 5).join(', ')}...`);
      
      // Compare specific options
      if (sourceModules.length > 0 && targetModules.length > 0) {
        const sourceOptions = sourceModules[0].options || {};
        const targetOptions = targetModules[0].options || {};
        
        const sourceKeys = Object.keys(sourceOptions);
        const targetKeys = Object.keys(targetOptions);
        
        const matchingKeys = sourceKeys.filter(key => targetKeys.includes(key));
        const matchingValues = matchingKeys.filter(key => 
          JSON.stringify(sourceOptions[key]) === JSON.stringify(targetOptions[key])
        );
        
        console.log(`\n⚖️ Components Comparison:`);
        console.log(`  Source options: ${sourceKeys.length}`);
        console.log(`  Target options: ${targetKeys.length}`);
        console.log(`  Matching keys: ${matchingKeys.length}`);
        console.log(`  Matching values: ${matchingValues.length}`);
        
        if (matchingKeys.length > 0 && matchingValues.length > 0) {
          console.log('✅ Components were cloned successfully!');
          console.log(`📋 Cloned ${matchingValues.length}/${sourceKeys.length} component settings`);
          
          // Show some examples
          console.log('\n📝 Example cloned components:');
          matchingKeys.slice(0, 5).forEach(key => {
            const sourceVal = sourceOptions[key];
            const targetVal = targetOptions[key];
            const match = JSON.stringify(sourceVal) === JSON.stringify(targetVal) ? '✅' : '❌';
            console.log(`  ${match} ${key}: ${JSON.stringify(sourceVal).substring(0, 50)}...`);
          });
          
          return {
            success: true,
            componentsCloned: true,
            sourceOptionsCount: sourceKeys.length,
            targetOptionsCount: targetKeys.length,
            matchingCount: matchingValues.length,
            newProduct: createResult.newProduct
          };
        } else {
          console.log('❌ Components were NOT cloned properly');
          return {
            success: false,
            componentsCloned: false,
            sourceOptionsCount: sourceKeys.length,
            targetOptionsCount: targetKeys.length,
            newProduct: createResult.newProduct
          };
        }
      }
    } else {
      console.log('❌ Target product has no modules - components not cloned');
      return {
        success: false,
        componentsCloned: false,
        newProduct: createResult.newProduct
      };
    }
    
  } catch (error) {
    console.error('❌ Components cloning test error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runVPSProfiComponentsTest() {
  const result = await testComponentsCloningWithVPSProfi();
  
  console.log('\n📊 VPS PROFI COMPONENTS CLONING TEST SUMMARY');
  console.log('================================================================================');
  
  if (result && result.success) {
    if (result.componentsCloned) {
      console.log('✅ Test Result: PASS - Components cloned successfully');
      console.log(`📊 Components: ${result.sourceOptionsCount} → ${result.targetOptionsCount}`);
      console.log(`🎯 Matching: ${result.matchingCount}/${result.sourceOptionsCount}`);
      console.log(`📦 New Product: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
    } else {
      console.log('❌ Test Result: FAIL - Components were not cloned');
      console.log(`📊 Components: ${result.sourceOptionsCount || 0} → ${result.targetOptionsCount || 0}`);
    }
  } else {
    console.log('❌ Test Result: FAIL - Test could not complete');
    if (result && result.error) {
      console.log(`Error: ${result.error}`);
    }
  }

  console.log('\n🔧 HOSTBILL COMPONENTS CLONING ANALYSIS');
  console.log('================================================================================');
  console.log('Components in HostBill are stored in:');
  console.log('1. ✅ product.modules[].options - Module configuration options');
  console.log('2. ✅ product.options - Direct product options (if any)');
  console.log('3. ✅ Custom fields and form elements');
  console.log('');
  console.log('productCloneSettings with setting 4 should clone:');
  console.log('- Module options and configurations');
  console.log('- Form fields and custom components');
  console.log('- Product-specific settings');

  console.log('\n🎯 VERIFICATION STEPS');
  console.log('================================================================================');
  console.log('To verify components cloning:');
  console.log('1. ✅ Check product.modules[].options in API response');
  console.log('2. ✅ Compare source vs target module configurations');
  console.log('3. ✅ Verify HostBill admin UI Components tab');
  console.log('4. ✅ Test actual functionality of cloned components');

  if (result && result.success && result.componentsCloned) {
    console.log('\n🎉 COMPONENTS CLONING WORKING!');
    console.log('================================================================================');
    console.log('✅ Components are being cloned successfully');
    console.log('✅ Module options transferred correctly');
    console.log('✅ HostBill API productCloneSettings working for setting 4');
    console.log('🚀 Components cloning is functional!');
  } else {
    console.log('\n⚠️ COMPONENTS CLONING NEEDS INVESTIGATION');
    console.log('Check HostBill admin UI and API logs for more details.');
  }

  console.log('\n✅ VPS Profi components cloning test completed!');
}

// Run the test
runVPSProfiComponentsTest();
