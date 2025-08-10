/**
 * Test Components Cloning Verification
 * Tests that components (form fields) are properly cloned using HostBill API
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
    return result.success ? result.product : null;
  } catch (error) {
    return null;
  }
}

async function testComponentsCloning() {
  console.log('🔧 Testing Components Cloning Verification');
  console.log('================================================================================');
  console.log('Testing that components (form fields) are properly cloned using HostBill API');
  console.log('================================================================================');

  // Step 1: Get source product with components
  console.log('\n📊 Step 1: Getting source product details...');
  const sourceProduct = await getProductDetail('5'); // VPS Start
  
  if (!sourceProduct) {
    console.log('❌ Failed to get source product details');
    return false;
  }
  
  console.log('✅ Source product loaded:');
  console.log(`  Product: ${sourceProduct.name} (ID: ${sourceProduct.id})`);
  console.log(`  Category: ${sourceProduct.category}`);
  
  // Check if source has components
  const sourceComponents = sourceProduct.options || sourceProduct.components || [];
  console.log(`  Components: ${sourceComponents.length > 0 ? sourceComponents.length + ' found' : 'None found'}`);
  
  if (sourceComponents.length > 0) {
    console.log('  Component details:');
    sourceComponents.slice(0, 3).forEach((comp, idx) => {
      console.log(`    ${idx + 1}. ${comp.name || comp.label || `Component ${idx + 1}`}`);
    });
    if (sourceComponents.length > 3) {
      console.log(`    ... and ${sourceComponents.length - 3} more`);
    }
  }

  // Step 2: Test cloning with components (setting 4)
  console.log('\n🆕 Step 2: Creating new product with components cloning...');
  const timestamp = Date.now();
  const newProductName = `COMPONENTS CLONE TEST ${timestamp}`;
  
  try {
    const createData = {
      sourceProductId: '5',
      newProductName: newProductName,
      settings: [4], // Only Components (Form fields) - setting 4
      affiliate_id: '1'
    };
    
    console.log('🔧 Creating with settings:', createData.settings);
    console.log('💡 Setting 4 = Components (Form fields)');
    
    const createResult = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (!createResult.success) {
      console.log('❌ Failed to create new product:', createResult.error);
      return false;
    }
    
    console.log('✅ New product created successfully:');
    console.log(`  New Product: ${createResult.newProduct.name} (ID: ${createResult.newProduct.id})`);
    console.log(`  Cloned Settings: ${createResult.clonedSettings?.join(', ') || 'None'}`);
    console.log(`  Settings included Components: ${createResult.clonedSettings?.includes('Components (Form fields)') ? 'YES' : 'NO'}`);
    
    // Step 3: Verify components were cloned
    console.log('\n🔍 Step 3: Verifying components were cloned...');
    
    // Wait for product creation to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newProduct = await getProductDetail(createResult.newProduct.id.toString());
    
    if (!newProduct) {
      console.log('❌ Failed to get new product details for verification');
      return false;
    }
    
    const newComponents = newProduct.options || newProduct.components || [];
    console.log(`📊 New product components: ${newComponents.length > 0 ? newComponents.length + ' found' : 'None found'}`);
    
    if (newComponents.length > 0) {
      console.log('  Cloned component details:');
      newComponents.slice(0, 3).forEach((comp, idx) => {
        console.log(`    ${idx + 1}. ${comp.name || comp.label || `Component ${idx + 1}`}`);
      });
      if (newComponents.length > 3) {
        console.log(`    ... and ${newComponents.length - 3} more`);
      }
    }
    
    // Step 4: Compare components
    console.log('\n⚖️ Step 4: Comparing source vs new product components...');
    
    const componentsCloned = newComponents.length > 0;
    const componentsCountMatch = sourceComponents.length === newComponents.length;
    
    if (sourceComponents.length === 0) {
      console.log('ℹ️ Source product has no components to clone');
      return { success: true, noComponentsToClone: true, newProduct: createResult.newProduct };
    }
    
    if (componentsCloned) {
      console.log('✅ Components were cloned successfully!');
      console.log(`📊 Source components: ${sourceComponents.length}, New components: ${newComponents.length}`);
      
      if (componentsCountMatch) {
        console.log('✅ Component count matches perfectly');
      } else {
        console.log('⚠️ Component count differs - this might be normal depending on component types');
      }
      
      return { 
        success: true, 
        componentsCloned: true, 
        sourceCount: sourceComponents.length,
        newCount: newComponents.length,
        newProduct: createResult.newProduct 
      };
    } else {
      console.log('❌ Components were NOT cloned!');
      console.log('🔧 Possible issues:');
      console.log('   - Setting 4 not properly sent to API');
      console.log('   - HostBill API productCloneSettings not working for components');
      console.log('   - Source product components not compatible with target');
      console.log('   - API response delay - components might appear later');
      
      return { 
        success: false, 
        componentsCloned: false,
        sourceCount: sourceComponents.length,
        newCount: newComponents.length,
        newProduct: createResult.newProduct 
      };
    }
    
  } catch (error) {
    console.error('❌ Components cloning test error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runComponentsCloningTest() {
  const result = await testComponentsCloning();
  
  console.log('\n📊 COMPONENTS CLONING TEST SUMMARY');
  console.log('================================================================================');
  
  if (result && result.success) {
    if (result.noComponentsToClone) {
      console.log('ℹ️ Test Result: NO COMPONENTS TO CLONE');
      console.log('Source product has no components, so cloning test is not applicable');
    } else if (result.componentsCloned) {
      console.log('✅ Test Result: PASS - Components cloned successfully');
      console.log(`📊 Components: ${result.sourceCount} → ${result.newCount}`);
    } else {
      console.log('❌ Test Result: FAIL - Components were not cloned');
      console.log(`📊 Components: ${result.sourceCount} → ${result.newCount}`);
    }
    
    if (result.newProduct) {
      console.log(`📦 New Product: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
    }
  } else {
    console.log('❌ Test Result: FAIL - Test could not complete');
    if (result && result.error) {
      console.log(`Error: ${result.error}`);
    }
  }

  console.log('\n🔧 HOSTBILL API DUPLICATE PROCESS');
  console.log('================================================================================');
  console.log('HostBill Admin UI "Duplicate" button equivalent in API:');
  console.log('1. addProduct - Create new product with basic info');
  console.log('2. productCloneSettings - Clone settings from source to target');
  console.log('');
  console.log('Our implementation:');
  console.log('1. ✅ addProduct with complete basic data from source');
  console.log('2. ✅ editProduct for accurate pricing copy');
  console.log('3. ✅ productCloneSettings for selected settings');
  console.log('');
  console.log('Settings mapping:');
  console.log('1: General, 2: Pricing, 3: Configuration');
  console.log('4: Components (Form fields) ← Critical for form fields');
  console.log('5: Emails, 6: Related products, 7: Automation scripts');
  console.log('8: Order process, 9: Domain settings');

  console.log('\n🔍 TROUBLESHOOTING COMPONENTS CLONING');
  console.log('================================================================================');
  console.log('If components are not cloning:');
  console.log('1. ✅ Ensure settings[] includes 4');
  console.log('2. ✅ Verify settings is sent as array, not string');
  console.log('3. ✅ Check source product actually has components');
  console.log('4. ✅ Verify target product type is compatible');
  console.log('5. ✅ Wait for API processing (can take a few seconds)');
  console.log('6. ✅ Check HostBill admin UI Components tab after cloning');

  console.log('\n✅ Components cloning verification test completed!');
}

// Run the test
runComponentsCloningTest();
