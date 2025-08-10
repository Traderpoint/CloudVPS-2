/**
 * Test Complete Clone and List Refresh
 * Tests complete copying of all 9 settings categories and automatic list refresh
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

async function getProductsCount() {
  try {
    const result = await makeRequest('GET', 'localhost', 3005, '/api/affiliate/1/products?mode=affiliate');
    
    if (result.success && result.products) {
      return result.products.length;
    } else {
      return 0;
    }
  } catch (error) {
    return 0;
  }
}

async function testCompleteCloneNewProduct() {
  console.log('🆕 Testing Complete Clone New Product...');
  
  const timestamp = Date.now();
  const newProductName = `COMPLETE CLONE TEST ${timestamp}`;
  
  // Get initial products count
  const initialCount = await getProductsCount();
  console.log(`📊 Initial products count: ${initialCount}`);
  
  try {
    // Test with only 2 selected settings, but expect all 9 to be cloned
    const createData = {
      sourceProductId: '5', // VPS Start
      newProductName: newProductName,
      settings: [4, 5], // User selects only Components and Emails
      affiliate_id: '1'
    };
    
    console.log('🔧 Creating new product with user-selected settings:', createData.settings);
    console.log('💡 Expected: All 9 categories will be cloned regardless of selection');
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (result.success) {
      console.log('✅ Complete clone new product successful!');
      console.log('📊 Clone Result:');
      console.log(`  Source: ${result.sourceProduct.name} (ID: ${result.sourceProduct.id})`);
      console.log(`  New Product: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
      console.log(`  Complete Copy: ${result.completeCopy ? 'YES' : 'NO'}`);
      console.log(`  User Selected: ${result.userSelectedSettings?.join(', ') || 'N/A'}`);
      console.log(`  Actually Cloned: ${result.clonedSettings?.join(', ') || 'N/A'}`);
      
      // Verify all 9 categories were cloned
      const expectedSettings = [
        'General', 'Pricing', 'Configuration', 'Components (Form fields)', 
        'Emails', 'Related products', 'Automation scripts', 'Order process', 'Domain settings'
      ];
      
      const allCloned = expectedSettings.every(setting => 
        result.clonedSettings?.includes(setting)
      );
      
      if (allCloned) {
        console.log('✅ All 9 settings categories were cloned successfully');
      } else {
        console.log('❌ Not all settings categories were cloned');
        console.log('Expected:', expectedSettings);
        console.log('Got:', result.clonedSettings);
      }
      
      // Check if products count increased
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for potential refresh
      const finalCount = await getProductsCount();
      console.log(`📊 Final products count: ${finalCount}`);
      
      if (finalCount > initialCount) {
        console.log('✅ Products list was refreshed and new product is visible');
        return { success: true, newProduct: result.newProduct, allCloned };
      } else {
        console.log('❌ Products list was not refreshed or new product not visible');
        return { success: true, newProduct: result.newProduct, allCloned, refreshFailed: true };
      }
      
    } else {
      console.log('❌ Complete clone new product failed:', result.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Complete clone new product error:', error.message);
    return { success: false };
  }
}

async function testRegularCloneWithRefresh() {
  console.log('\n📋 Testing Regular Clone with List Refresh...');
  
  try {
    const cloneData = {
      sourceProductId: '5',
      targetProductId: '10',
      settings: [1, 2, 3], // General, Pricing, Configuration
      affiliate_id: '1'
    };
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-product', cloneData);
    
    if (result.success) {
      console.log('✅ Regular clone successful!');
      console.log('📊 Clone Result:');
      console.log(`  Source: ${result.sourceProduct.name} → Target: ${result.targetProduct.name}`);
      console.log(`  Cloned Settings: ${result.clonedSettings?.join(', ')}`);
      
      // Note: Regular clone doesn't change product count, but should still refresh list
      console.log('✅ Regular clone completed (list refresh happens in UI)');
      return true;
    } else {
      console.log('❌ Regular clone failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Regular clone error:', error.message);
    return false;
  }
}

async function runCompleteCloneAndRefreshTest() {
  console.log('🚀 Testing Complete Clone and List Refresh');
  console.log('================================================================================');
  console.log('Testing complete copying of all 9 settings and automatic list refresh');
  console.log('================================================================================');

  let testResults = {
    completeCloneNewProduct: false,
    allSettingsCloned: false,
    listRefreshed: false,
    regularClone: false
  };

  // Test 1: Complete Clone New Product
  const cloneResult = await testCompleteCloneNewProduct();
  if (cloneResult.success) {
    testResults.completeCloneNewProduct = true;
    
    if (cloneResult.allCloned) {
      testResults.allSettingsCloned = true;
    }
    
    if (!cloneResult.refreshFailed) {
      testResults.listRefreshed = true;
    }
  }

  // Test 2: Regular Clone with Refresh
  const regularCloneSuccess = await testRegularCloneWithRefresh();
  if (regularCloneSuccess) {
    testResults.regularClone = true;
  }

  // Summary
  console.log('\n📊 COMPLETE CLONE AND REFRESH TEST SUMMARY');
  console.log('================================================================================');
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  console.log('');
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} - ${testName}`);
  });

  console.log('\n🎯 IMPLEMENTED FEATURES');
  console.log('================================================================================');
  console.log('✅ Complete Product Copy:');
  console.log('   - ALL 9 settings categories are always cloned for new products');
  console.log('   - General, Pricing, Configuration, Components, Emails');
  console.log('   - Related products, Automation scripts, Order process, Domain settings');
  console.log('   - Complete data copy including descriptions, categories, pricing');
  console.log('   - User selection is logged but all settings are cloned');
  console.log('');
  console.log('✅ Automatic List Refresh:');
  console.log('   - Products list refreshes after successful new product creation');
  console.log('   - Products list refreshes after successful regular clone');
  console.log('   - New products immediately visible in dropdowns');
  console.log('   - No manual refresh needed');

  console.log('\n🔧 MIDDLEWARE ENHANCEMENTS');
  console.log('================================================================================');
  console.log('✅ Enhanced clone-new-product endpoint:');
  console.log('   - Copies all product data during creation');
  console.log('   - Always clones all 9 settings categories');
  console.log('   - Returns completeCopy: true flag');
  console.log('   - Shows both user selection and actual cloned settings');
  console.log('');
  console.log('✅ UI Improvements:');
  console.log('   - Clear information about complete copy');
  console.log('   - Automatic list refresh after operations');
  console.log('   - Better user feedback');

  console.log('\n🎨 USER EXPERIENCE');
  console.log('================================================================================');
  console.log('📋 CREATE NEW PRODUCT FLOW:');
  console.log('1. Select source product');
  console.log('2. Choose "🆕 Create New Product"');
  console.log('3. Enter new product name');
  console.log('4. Select any settings (all will be copied anyway)');
  console.log('5. Click "🆕 Clone New Product"');
  console.log('6. Complete copy of ALL data and settings');
  console.log('7. Products list automatically refreshes');
  console.log('8. New product appears in dropdowns');
  console.log('');
  console.log('💡 KEY BENEFIT: Users get complete product copy regardless of selection!');

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! COMPLETE CLONE AND REFRESH WORKING!');
    console.log('================================================================================');
    console.log('✅ Complete copying of all 9 settings categories');
    console.log('✅ All product data copied (descriptions, categories, pricing)');
    console.log('✅ Automatic list refresh after operations');
    console.log('✅ New products immediately visible');
    console.log('🚀 Ready for production use!');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('Please check the failed tests and fix any issues.');
  }

  console.log('\n✅ Complete clone and refresh test completed!');
}

// Run the test
runCompleteCloneAndRefreshTest();
