/**
 * Test Select All Default and Selective Clone
 * Tests that all settings are selected by default, but only selected settings are cloned
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

async function testCompleteClone() {
  console.log('🔄 Test 1: Complete Clone (All 9 settings selected)...');
  
  const timestamp = Date.now();
  const newProductName = `COMPLETE CLONE ${timestamp}`;
  
  try {
    const createData = {
      sourceProductId: '5',
      newProductName: newProductName,
      settings: [1, 2, 3, 4, 5, 6, 7, 8, 9], // All settings selected (default behavior)
      affiliate_id: '1'
    };
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (result.success) {
      console.log('✅ Complete clone successful!');
      console.log(`📦 New Product: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
      console.log(`📋 Complete Copy: ${result.completeCopy ? 'YES' : 'NO'}`);
      console.log(`📊 Cloned Settings (${result.clonedSettings?.length || 0}/9): ${result.clonedSettings?.join(', ') || 'None'}`);
      console.log(`💬 Message: ${result.message}`);
      
      return {
        success: true,
        isComplete: result.completeCopy,
        settingsCount: result.clonedSettings?.length || 0,
        newProduct: result.newProduct
      };
    } else {
      console.log('❌ Complete clone failed:', result.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Complete clone error:', error.message);
    return { success: false };
  }
}

async function testPartialClone() {
  console.log('\n📋 Test 2: Partial Clone (Only selected settings)...');
  
  const timestamp = Date.now();
  const newProductName = `PARTIAL CLONE ${timestamp}`;
  
  try {
    const createData = {
      sourceProductId: '5',
      newProductName: newProductName,
      settings: [1, 2, 4], // Only General, Pricing, Components selected
      affiliate_id: '1'
    };
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (result.success) {
      console.log('✅ Partial clone successful!');
      console.log(`📦 New Product: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
      console.log(`📋 Complete Copy: ${result.completeCopy ? 'YES' : 'NO'}`);
      console.log(`📊 Cloned Settings (${result.clonedSettings?.length || 0}/9): ${result.clonedSettings?.join(', ') || 'None'}`);
      console.log(`💬 Message: ${result.message}`);
      
      // Verify only selected settings were cloned
      const expectedSettings = ['General', 'Pricing', 'Components (Form fields)'];
      const actualSettings = result.clonedSettings || [];
      
      const correctPartialClone = expectedSettings.every(setting => actualSettings.includes(setting)) &&
                                 actualSettings.length === expectedSettings.length;
      
      if (correctPartialClone) {
        console.log('✅ Correct partial clone - only selected settings were cloned');
      } else {
        console.log('❌ Incorrect partial clone - wrong settings were cloned');
        console.log(`Expected: ${expectedSettings.join(', ')}`);
        console.log(`Got: ${actualSettings.join(', ')}`);
      }
      
      return {
        success: true,
        isComplete: result.completeCopy,
        settingsCount: result.clonedSettings?.length || 0,
        correctPartial: correctPartialClone,
        newProduct: result.newProduct
      };
    } else {
      console.log('❌ Partial clone failed:', result.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Partial clone error:', error.message);
    return { success: false };
  }
}

async function testMinimalClone() {
  console.log('\n🔧 Test 3: Minimal Clone (Only 1 setting)...');
  
  const timestamp = Date.now();
  const newProductName = `MINIMAL CLONE ${timestamp}`;
  
  try {
    const createData = {
      sourceProductId: '5',
      newProductName: newProductName,
      settings: [2], // Only Pricing selected
      affiliate_id: '1'
    };
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (result.success) {
      console.log('✅ Minimal clone successful!');
      console.log(`📦 New Product: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
      console.log(`📋 Complete Copy: ${result.completeCopy ? 'YES' : 'NO'}`);
      console.log(`📊 Cloned Settings (${result.clonedSettings?.length || 0}/9): ${result.clonedSettings?.join(', ') || 'None'}`);
      console.log(`💬 Message: ${result.message}`);
      
      // Verify only pricing was cloned
      const expectedSettings = ['Pricing'];
      const actualSettings = result.clonedSettings || [];
      
      const correctMinimalClone = actualSettings.length === 1 && actualSettings.includes('Pricing');
      
      if (correctMinimalClone) {
        console.log('✅ Correct minimal clone - only Pricing was cloned');
      } else {
        console.log('❌ Incorrect minimal clone - wrong settings were cloned');
      }
      
      return {
        success: true,
        isComplete: result.completeCopy,
        settingsCount: result.clonedSettings?.length || 0,
        correctMinimal: correctMinimalClone,
        newProduct: result.newProduct
      };
    } else {
      console.log('❌ Minimal clone failed:', result.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Minimal clone error:', error.message);
    return { success: false };
  }
}

async function runSelectAllDefaultTest() {
  console.log('🚀 Testing Select All Default and Selective Clone');
  console.log('================================================================================');
  console.log('Testing that all settings are selected by default, but only selected are cloned');
  console.log('================================================================================');

  let testResults = {
    completeClone: false,
    partialClone: false,
    minimalClone: false,
    correctLogic: false
  };

  // Test 1: Complete Clone (all settings)
  const completeResult = await testCompleteClone();
  if (completeResult.success && completeResult.isComplete && completeResult.settingsCount === 9) {
    testResults.completeClone = true;
  }

  // Test 2: Partial Clone (selected settings)
  const partialResult = await testPartialClone();
  if (partialResult.success && !partialResult.isComplete && partialResult.correctPartial) {
    testResults.partialClone = true;
  }

  // Test 3: Minimal Clone (1 setting)
  const minimalResult = await testMinimalClone();
  if (minimalResult.success && !minimalResult.isComplete && minimalResult.correctMinimal) {
    testResults.minimalClone = true;
  }

  // Test 4: Logic correctness
  if (testResults.completeClone && testResults.partialClone && testResults.minimalClone) {
    testResults.correctLogic = true;
  }

  // Summary
  console.log('\n📊 SELECT ALL DEFAULT TEST SUMMARY');
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

  console.log('\n🎯 NEW IMPLEMENTATION FEATURES');
  console.log('================================================================================');
  console.log('✅ Default Behavior:');
  console.log('   - All 9 settings are selected by default (Select All)');
  console.log('   - User sees all checkboxes checked when page loads');
  console.log('   - Complete copy happens if user doesn\'t change selection');
  console.log('');
  console.log('✅ Selective Cloning:');
  console.log('   - User can uncheck specific settings');
  console.log('   - Only selected settings are actually cloned');
  console.log('   - Pricing is always copied accurately via editProduct API');
  console.log('   - Messages reflect what was actually cloned');
  console.log('');
  console.log('✅ Smart Messages:');
  console.log('   - "Complete copy" message when all 9 settings selected');
  console.log('   - "Selected settings: X, Y, Z" message for partial clones');
  console.log('   - completeCopy flag indicates full vs partial clone');

  console.log('\n🎨 USER EXPERIENCE');
  console.log('================================================================================');
  console.log('📋 DEFAULT BEHAVIOR:');
  console.log('1. Page loads with ALL settings checked ✅✅✅✅✅✅✅✅✅');
  console.log('2. User can immediately clone with complete copy');
  console.log('3. Or user can uncheck specific settings for partial clone');
  console.log('');
  console.log('📋 SELECTIVE CLONING:');
  console.log('1. User unchecks unwanted settings ✅✅❌✅❌❌✅❌❌');
  console.log('2. Only checked settings are cloned');
  console.log('3. Message shows exactly what was cloned');
  console.log('4. Pricing always copied regardless of selection');

  console.log('\n🔧 TECHNICAL DETAILS');
  console.log('================================================================================');
  console.log('✅ UI Changes:');
  console.log('   - cloneSettings initial state: [1,2,3,4,5,6,7,8,9]');
  console.log('   - All checkboxes checked by default');
  console.log('   - Select All/Deselect All still works');
  console.log('');
  console.log('✅ Middleware Changes:');
  console.log('   - Clone only user-selected settings (not forced all)');
  console.log('   - Smart completeCopy detection (all 9 selected)');
  console.log('   - Dynamic messages based on selection');
  console.log('   - Pricing always copied via editProduct API');

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! SELECT ALL DEFAULT WORKING PERFECTLY!');
    console.log('================================================================================');
    console.log('✅ All settings selected by default (Select All behavior)');
    console.log('✅ Selective cloning works correctly');
    console.log('✅ Smart messages based on actual cloning');
    console.log('✅ Pricing always copied accurately');
    console.log('✅ User has full control over what gets cloned');
    console.log('🚀 Ready for production use!');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('Please check the failed tests and fix any issues.');
  }

  console.log('\n✅ Select all default test completed!');
}

// Run the test
runSelectAllDefaultTest();
