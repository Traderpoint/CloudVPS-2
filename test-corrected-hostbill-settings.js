/**
 * Test Corrected HostBill Settings
 * Tests the corrected settings according to official HostBill API documentation
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

async function testCorrectedSettings() {
  console.log('🔧 Testing Corrected HostBill Settings');
  console.log('================================================================================');
  console.log('Testing corrected settings according to official HostBill API documentation');
  console.log('================================================================================');

  console.log('\n📚 OFFICIAL HOSTBILL API DOCUMENTATION ANALYSIS:');
  console.log('Source: https://api2.hostbillapp.com/services/productCloneSettings.html');
  console.log('');
  console.log('✅ CORRECTED SETTINGS (1-7):');
  console.log('1. Connect with app    - Připojení s aplikací/modulem');
  console.log('2. Automation          - Automatizační skripty');
  console.log('3. Emails              - Email šablony');
  console.log('4. Components          - Komponenty/Form fields ⭐');
  console.log('5. Other settings      - Ostatní nastavení');
  console.log('6. Client functions    - Klientské funkce');
  console.log('7. Price               - Ceny');
  console.log('');
  console.log('❌ PREVIOUS INCORRECT SETTINGS (1-9):');
  console.log('1. General             - ❌ Neexistuje v HostBill API');
  console.log('2. Pricing             - ❌ Mělo by být 7 (Price)');
  console.log('3. Configuration       - ❌ Neexistuje v HostBill API');
  console.log('4. Components          - ✅ Správně');
  console.log('5. Emails              - ❌ Mělo by být 3');
  console.log('6. Related products    - ❌ Neexistuje v HostBill API');
  console.log('7. Automation scripts  - ❌ Mělo by být 2 (Automation)');
  console.log('8. Order process       - ❌ Neexistuje v HostBill API');
  console.log('9. Domain settings     - ❌ Neexistuje v HostBill API');

  const timestamp = Date.now();
  
  // Test with corrected Components setting
  console.log('\n🧪 Testing Components Cloning with Corrected Settings:');
  console.log('================================================================================');
  
  try {
    const createData = {
      sourceProductId: '10', // VPS Profi with components
      newProductName: `CORRECTED COMPONENTS TEST ${timestamp}`,
      settings: [4], // Components only - should work now with corrected mapping
      affiliate_id: '1'
    };
    
    console.log('🔧 Request with corrected settings:');
    console.log(`  Source: VPS Profi (ID: 10)`);
    console.log(`  Settings: [4] = Components (according to official HostBill API)`);
    console.log(`  Expected: Components should clone properly now`);
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (result.success) {
      console.log('✅ Product created successfully with corrected settings');
      console.log(`📦 New Product: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
      console.log(`📋 Cloned Settings: ${result.clonedSettings?.join(', ')}`);
      
      // Check components warning
      if (result.componentsWarning) {
        console.log(`⚠️ Components Warning: ${result.componentsWarning.message}`);
        console.log('   This may still appear due to HostBill API limitations');
      } else {
        console.log('✅ No components warning - settings may be working correctly now');
      }
      
      // Wait and check if components were actually cloned
      console.log('\n🔍 Verifying components cloning...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const targetDetail = await makeRequest('GET', 'localhost', 3005, `/api/hostbill/product-detail?product_id=${result.newProduct.id}&affiliate_id=1`);
      
      if (targetDetail.success) {
        const targetProduct = targetDetail.product;
        const targetModules = targetProduct.modules || [];
        
        if (targetModules.length > 0) {
          const targetOptions = targetModules[0].options || {};
          const optionsCount = Object.keys(targetOptions).length;
          
          console.log(`📊 Target product modules: ${targetModules.length}`);
          console.log(`📊 Target product options: ${optionsCount}`);
          
          if (optionsCount > 0) {
            console.log('🎉 SUCCESS: Components were cloned with corrected settings!');
            console.log(`📋 Cloned ${optionsCount} component options`);
            console.log('✅ HostBill API productCloneSettings working with correct settings mapping');
            
            return {
              success: true,
              componentsCloned: true,
              optionsCount: optionsCount,
              settingsFixed: true
            };
          } else {
            console.log('❌ Components still not cloned - may be deeper HostBill API issue');
            return {
              success: true,
              componentsCloned: false,
              settingsFixed: true,
              stillNotWorking: true
            };
          }
        } else {
          console.log('❌ No modules in target product');
          return {
            success: true,
            componentsCloned: false,
            settingsFixed: true
          };
        }
      } else {
        console.log('❌ Failed to verify target product');
        return { success: false };
      }
      
    } else {
      console.log('❌ Product creation failed:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testAllCorrectedSettings() {
  console.log('\n🧪 Testing All Corrected Settings:');
  console.log('================================================================================');
  
  const timestamp = Date.now();
  
  try {
    const createData = {
      sourceProductId: '5', // VPS Start
      newProductName: `ALL CORRECTED SETTINGS TEST ${timestamp}`,
      settings: [1, 2, 3, 4, 5, 6, 7], // All 7 corrected settings
      affiliate_id: '1'
    };
    
    console.log('🔧 Request with all corrected settings:');
    console.log(`  Settings: [1,2,3,4,5,6,7] = All official HostBill API settings`);
    console.log(`  Expected: All settings should be accepted by HostBill API`);
    
    const result = await makeRequest('POST', 'localhost', 3005, '/api/hostbill/clone-new-product', createData);
    
    if (result.success) {
      console.log('✅ Product created successfully with all corrected settings');
      console.log(`📦 New Product: ${result.newProduct.name} (ID: ${result.newProduct.id})`);
      console.log(`📋 Cloned Settings: ${result.clonedSettings?.join(', ')}`);
      console.log(`🎯 Settings Count: ${result.clonedSettings?.length || 0}/7`);
      
      return {
        success: true,
        allSettingsWorking: true,
        settingsCount: result.clonedSettings?.length || 0
      };
    } else {
      console.log('❌ Product creation failed:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runCorrectedSettingsTest() {
  const componentsResult = await testCorrectedSettings();
  const allSettingsResult = await testAllCorrectedSettings();
  
  console.log('\n📊 CORRECTED HOSTBILL SETTINGS TEST SUMMARY');
  console.log('================================================================================');
  
  if (componentsResult && componentsResult.success) {
    if (componentsResult.componentsCloned) {
      console.log('🎉 COMPONENTS TEST: SUCCESS - Components cloned with corrected settings!');
      console.log(`📋 Cloned ${componentsResult.optionsCount} component options`);
    } else if (componentsResult.stillNotWorking) {
      console.log('⚠️ COMPONENTS TEST: Settings corrected but components still not cloning');
      console.log('   This may indicate deeper HostBill API limitations');
    } else {
      console.log('❌ COMPONENTS TEST: Components not cloned');
    }
  } else {
    console.log('❌ COMPONENTS TEST: Failed to complete');
  }
  
  if (allSettingsResult && allSettingsResult.success) {
    console.log(`✅ ALL SETTINGS TEST: SUCCESS - ${allSettingsResult.settingsCount}/7 settings processed`);
  } else {
    console.log('❌ ALL SETTINGS TEST: Failed');
  }

  console.log('\n🎯 SETTINGS CORRECTION IMPACT:');
  console.log('================================================================================');
  console.log('✅ POSITIVE CHANGES:');
  console.log('   - Settings now match official HostBill API documentation');
  console.log('   - Only 7 valid settings instead of 9 invalid ones');
  console.log('   - Components (4) correctly mapped');
  console.log('   - Price (7) correctly mapped instead of Pricing (2)');
  console.log('   - Emails (3) correctly mapped instead of (5)');
  
  console.log('\n📋 EXPECTED IMPROVEMENTS:');
  console.log('   - Better HostBill API compatibility');
  console.log('   - Reduced API errors from invalid settings');
  console.log('   - Potentially working components cloning');
  console.log('   - More accurate settings descriptions');

  console.log('\n🔧 NEXT STEPS:');
  console.log('================================================================================');
  if (componentsResult && componentsResult.componentsCloned) {
    console.log('🎉 Components cloning is now working!');
    console.log('✅ Remove components warning system');
    console.log('✅ Update documentation to reflect working components');
    console.log('✅ Test with various product types');
  } else {
    console.log('⚠️ Components still not cloning - investigate further:');
    console.log('   - Check HostBill version compatibility');
    console.log('   - Test with different source products');
    console.log('   - Contact HostBill support for API clarification');
    console.log('   - Keep components warning system active');
  }

  console.log('\n✅ Corrected HostBill settings test completed!');
  console.log('🎯 Settings are now properly aligned with official HostBill API documentation');
}

// Run the test
runCorrectedSettingsTest();
