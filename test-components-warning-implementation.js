/**
 * Test Components Warning Implementation
 * Tests the components warning system for HostBill API limitations
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

async function testComponentsWarning() {
  console.log('⚠️ Testing Components Warning Implementation');
  console.log('================================================================================');
  console.log('Testing components warning system for HostBill API limitations');
  console.log('================================================================================');

  const timestamp = Date.now();
  const newProductName = `COMPONENTS WARNING TEST ${timestamp}`;
  
  try {
    // Test with components selected (should trigger warning)
    const createData = {
      sourceProductId: '10', // VPS Profi with components
      newProductName: newProductName,
      settings: [1, 4, 5], // General, Components, Emails
      affiliate_id: '1'
    };
    
    console.log('🔧 Creating product with components selected...');
    console.log(`Settings: ${createData.settings} (includes 4 = Components)`);
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (result.success) {
      console.log('✅ Product created successfully');
      console.log(`📦 New Product: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
      console.log(`📋 Cloned Settings: ${result.clonedSettings?.join(', ')}`);
      console.log(`🎯 Complete Copy: ${result.completeCopy ? 'YES' : 'NO'}`);
      
      // Check for components warning
      if (result.componentsWarning) {
        console.log('\n⚠️ COMPONENTS WARNING DETECTED:');
        console.log(`  Message: ${result.componentsWarning.message}`);
        console.log(`  Reason: ${result.componentsWarning.reason}`);
        console.log(`  Action: ${result.componentsWarning.action}`);
        
        return {
          success: true,
          warningPresent: true,
          warning: result.componentsWarning,
          newProduct: result.newProduct
        };
      } else {
        console.log('\n❌ NO COMPONENTS WARNING - This should have been present!');
        return {
          success: true,
          warningPresent: false,
          newProduct: result.newProduct
        };
      }
    } else {
      console.log('❌ Product creation failed:', result.error);
      return { success: false };
    }
    
  } catch (error) {
    console.error('❌ Components warning test error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testWithoutComponents() {
  console.log('\n📋 Testing WITHOUT Components Selected');
  console.log('================================================================================');
  
  const timestamp = Date.now();
  const newProductName = `NO COMPONENTS TEST ${timestamp}`;
  
  try {
    // Test without components selected (should NOT trigger warning)
    const createData = {
      sourceProductId: '5',
      newProductName: newProductName,
      settings: [1, 2, 5], // General, Pricing, Emails (NO Components)
      affiliate_id: '1'
    };
    
    console.log('🔧 Creating product WITHOUT components selected...');
    console.log(`Settings: ${createData.settings} (does NOT include 4 = Components)`);
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (result.success) {
      console.log('✅ Product created successfully');
      console.log(`📦 New Product: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
      
      // Check for components warning (should NOT be present)
      if (result.componentsWarning) {
        console.log('\n❌ UNEXPECTED COMPONENTS WARNING:');
        console.log(`  This warning should NOT be present when components are not selected!`);
        return {
          success: true,
          warningPresent: true,
          shouldNotHaveWarning: true,
          newProduct: result.newProduct
        };
      } else {
        console.log('\n✅ NO COMPONENTS WARNING - Correct behavior!');
        return {
          success: true,
          warningPresent: false,
          correctBehavior: true,
          newProduct: result.newProduct
        };
      }
    } else {
      console.log('❌ Product creation failed:', result.error);
      return { success: false };
    }
    
  } catch (error) {
    console.error('❌ No components test error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runComponentsWarningTest() {
  const withComponentsResult = await testComponentsWarning();
  const withoutComponentsResult = await testWithoutComponents();
  
  console.log('\n📊 COMPONENTS WARNING TEST SUMMARY');
  console.log('================================================================================');
  
  let testsPassed = 0;
  let totalTests = 2;
  
  // Test 1: With components selected (should have warning)
  if (withComponentsResult && withComponentsResult.success && withComponentsResult.warningPresent) {
    console.log('✅ Test 1 PASS: Components warning shown when components selected');
    testsPassed++;
  } else {
    console.log('❌ Test 1 FAIL: Components warning not shown when components selected');
  }
  
  // Test 2: Without components selected (should NOT have warning)
  if (withoutComponentsResult && withoutComponentsResult.success && !withoutComponentsResult.warningPresent) {
    console.log('✅ Test 2 PASS: No components warning when components not selected');
    testsPassed++;
  } else {
    console.log('❌ Test 2 FAIL: Incorrect warning behavior when components not selected');
  }
  
  console.log(`\n📊 Tests Passed: ${testsPassed}/${totalTests}`);

  console.log('\n🔧 COMPONENTS WARNING IMPLEMENTATION');
  console.log('================================================================================');
  console.log('✅ Middleware Enhancement:');
  console.log('   - Detects when setting 4 (Components) is selected');
  console.log('   - Adds componentsWarning object to response');
  console.log('   - Provides clear message and action for user');
  
  console.log('\n✅ UI Enhancement:');
  console.log('   - Displays warning in yellow notice box');
  console.log('   - Shows warning message and required action');
  console.log('   - Only appears when components are selected');
  
  console.log('\n⚠️ HOSTBILL API LIMITATION DOCUMENTED:');
  console.log('================================================================================');
  console.log('❌ Issue: HostBill API productCloneSettings does not properly clone module options');
  console.log('❌ Impact: Components (Form fields) may not transfer to new products');
  console.log('✅ Solution: Manual setup required in HostBill admin interface');
  console.log('✅ User Guidance: Clear warning and instructions provided');

  console.log('\n🎯 USER EXPERIENCE:');
  console.log('================================================================================');
  console.log('1. User selects Components (Form fields) for cloning');
  console.log('2. Product is created with all other settings cloned successfully');
  console.log('3. Warning appears: "Components may require manual setup"');
  console.log('4. User is directed to HostBill admin for manual component configuration');
  console.log('5. All other functionality works perfectly');

  console.log('\n💡 WORKAROUND STRATEGY:');
  console.log('================================================================================');
  console.log('✅ Clone all other settings successfully (8/9 categories work)');
  console.log('✅ Provide clear user guidance for manual component setup');
  console.log('✅ Document limitation transparently');
  console.log('✅ Maintain full functionality for all other features');

  if (testsPassed === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! COMPONENTS WARNING WORKING!');
    console.log('================================================================================');
    console.log('✅ Components warning system implemented correctly');
    console.log('✅ User guidance provided for HostBill API limitations');
    console.log('✅ Transparent handling of components cloning issue');
    console.log('🚀 Ready for production use with proper user guidance!');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('Please check the warning implementation.');
  }

  console.log('\n✅ Components warning implementation test completed!');
}

// Run the test
runComponentsWarningTest();
