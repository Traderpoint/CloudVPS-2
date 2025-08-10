/**
 * Test Payment Modules Display
 * Verifies that Comgate is displayed correctly as external module
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

async function testPaymentModulesDisplay() {
  console.log('🧪 === PAYMENT MODULES DISPLAY TEST ===\n');
  console.log('🎯 Testing Comgate display as unified external module');

  try {
    // Test payment-modules endpoint
    console.log('1️⃣ Testing payment-modules endpoint...');
    const modulesResponse = await fetch(`${MIDDLEWARE_URL}/api/payment-modules`);
    const modulesData = await modulesResponse.json();
    
    if (modulesData.success) {
      console.log('✅ Payment modules endpoint working');
      console.log(`   Total modules: ${modulesData.modules.length}`);
      
      // Find Comgate module
      const comgateModule = modulesData.modules.find(m => m.method === 'comgate');
      
      if (comgateModule) {
        console.log('\n🌐 Comgate Module Details:');
        console.log(`   Name: ${comgateModule.name}`);
        console.log(`   Method: ${comgateModule.method}`);
        console.log(`   Type: ${comgateModule.type}`);
        console.log(`   Is External: ${comgateModule.isExternal}`);
        console.log(`   Status: ${comgateModule.status}`);
        console.log(`   Icon: ${comgateModule.icon}`);
        console.log(`   Source: ${comgateModule.source}`);
        
        if (comgateModule.isExternal) {
          console.log('\n🎉 SUCCESS: Comgate is correctly marked as external!');
          console.log(`   Description: ${comgateModule.description}`);
          console.log(`   Integration: ${comgateModule.integration}`);
          console.log(`   API Endpoint: ${comgateModule.apiEndpoint}`);
          console.log(`   Test Mode: ${comgateModule.testMode}`);
          console.log(`   Merchant ID: ${comgateModule.merchantId}`);
        } else {
          console.log('❌ ERROR: Comgate is not marked as external');
        }
      } else {
        console.log('❌ ERROR: Comgate module not found');
      }
      
      // List all modules
      console.log('\n📋 All Available Modules:');
      modulesData.modules.forEach(module => {
        const externalFlag = module.isExternal ? ' [EXTERNAL]' : '';
        console.log(`   • ${module.name} (${module.method})${externalFlag}`);
      });
      
    } else {
      console.log('❌ Payment modules endpoint failed:', modulesData.error);
    }

    console.log('\n🎯 === DISPLAY TEST SUMMARY ===');
    console.log('✅ Payment modules display test completed');
    
    console.log('\n📋 Expected Display Changes:');
    console.log('   • Comgate should appear ONLY ONCE in the modules grid');
    console.log('   • Comgate should have PURPLE border (color: #9c27b0)');
    console.log('   • Comgate should show "🌐 External" status');
    console.log('   • Comgate should display external integration info');
    console.log('   • No duplicate Comgate in "External Payment Processors" section');
    
    console.log('\n🌐 Browser Testing:');
    console.log('   • Open: http://localhost:3000/middleware-payment-modules');
    console.log('   • Look for Comgate with purple border');
    console.log('   • Verify it shows external integration details');
    console.log('   • Confirm no duplicate Comgate sections');

  } catch (error) {
    console.error('❌ Display test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testPaymentModulesDisplay();
}

module.exports = { testPaymentModulesDisplay };
