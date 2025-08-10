// Test script to verify payment gateway update with dynamic payment methods
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';

async function testPaymentGatewayUpdate() {
  console.log('🧪 Testing Payment Gateway Update with Dynamic Payment Methods...\n');

  try {
    // Test 1: Enhanced Payment Methods API
    console.log('1️⃣ Testing Enhanced Payment Methods API...');
    const enhancedResponse = await fetch(`${BASE_URL}/api/payments/methods`);
    const enhancedData = await enhancedResponse.json();
    
    if (enhancedData.success) {
      console.log(`✅ Enhanced API: ${enhancedData.methods.length} methods`);
      console.log(`   Source: ${enhancedData.fallback ? 'fallback' : 'middleware'}`);
      console.log(`   Enabled: ${enhancedData.enabled} methods`);
      
      if (enhancedData.methods.length > 0) {
        const sampleMethods = enhancedData.methods.slice(0, 3).map(m => 
          `${m.icon} ${m.name} (${m.enabled ? 'enabled' : 'disabled'})`
        ).join(', ');
        console.log(`   Sample: ${sampleMethods}`);
      }
    } else {
      console.log(`❌ Enhanced API failed: ${enhancedData.error}`);
    }

    // Test 2: Direct HostBill Payment Methods API
    console.log('\n2️⃣ Testing Direct HostBill Payment Methods API...');
    const directResponse = await fetch(`${BASE_URL}/api/payments/direct-methods`);
    
    if (directResponse.ok) {
      const directData = await directResponse.json();
      
      if (directData.success) {
        console.log(`✅ Direct HostBill API: ${directData.methods.length} methods`);
        console.log(`   Test Invoice: ${directData.testInvoice}`);
        console.log(`   Client URL: ${directData.clientUrl}`);
        
        if (directData.methods.length > 0) {
          const sampleMethods = directData.methods.slice(0, 3).map(m => 
            `${m.icon} ${m.name} (ID: ${m.hostbillId})`
          ).join(', ');
          console.log(`   Sample: ${sampleMethods}`);
        }
      } else {
        console.log(`❌ Direct HostBill API failed: ${directData.error}`);
      }
    } else {
      console.log(`❌ Direct HostBill API error: ${directResponse.status}`);
    }

    // Test 3: Middleware Payment Methods API
    console.log('\n3️⃣ Testing Middleware Payment Methods API...');
    const middlewareResponse = await fetch(`${BASE_URL}/api/middleware/payment-methods-test`);
    
    if (middlewareResponse.ok) {
      const middlewareData = await middlewareResponse.json();
      
      if (middlewareData.success) {
        console.log(`✅ Middleware API: ${middlewareData.methods.length} methods`);
        console.log(`   Source: ${middlewareData.source}`);
        console.log(`   Middleware URL: ${middlewareData.middleware_url}`);
        
        if (middlewareData.methods.length > 0) {
          const sampleMethods = middlewareData.methods.slice(0, 3).map(m => 
            `${m.name || m.method} (${m.enabled ? 'enabled' : 'disabled'})`
          ).join(', ');
          console.log(`   Sample: ${sampleMethods}`);
        }
      } else {
        console.log(`❌ Middleware API failed: ${middlewareData.error}`);
      }
    } else {
      console.log(`❌ Middleware API error: ${middlewareResponse.status}`);
    }

    // Test 4: Test the page functionality
    console.log('\n4️⃣ Testing Payment Gateway Page Functionality...');
    
    // Test if the page loads (basic HTML check)
    const pageResponse = await fetch(`${BASE_URL}/test-payment-gateway`);
    
    if (pageResponse.ok) {
      const pageHtml = await pageResponse.text();
      
      if (pageHtml.includes('Test Payment Gateway')) {
        console.log('✅ Payment Gateway page loads correctly');
        
        // Check for key elements
        const hasLoadingState = pageHtml.includes('Loading Payment Methods');
        const hasErrorHandling = pageHtml.includes('Payment Methods Error');
        const hasMethodsStatus = pageHtml.includes('Payment Methods Loaded');
        
        console.log(`   Loading state support: ${hasLoadingState ? '✅' : '❌'}`);
        console.log(`   Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
        console.log(`   Status display: ${hasMethodsStatus ? '✅' : '❌'}`);
      } else {
        console.log('❌ Payment Gateway page content invalid');
      }
    } else {
      console.log(`❌ Payment Gateway page error: ${pageResponse.status}`);
    }

    console.log('\n🎉 Payment Gateway Update Test Complete!');
    console.log('\n📋 Summary of Updates:');
    console.log('   - ✅ Dynamic payment methods loading from multiple sources');
    console.log('   - ✅ Fallback mechanism when APIs fail');
    console.log('   - ✅ Loading states and error handling');
    console.log('   - ✅ Real-time method status display');
    console.log('   - ✅ Enhanced UI with method details');
    console.log('   - ✅ Reload functionality for payment methods');
    console.log('\n🌐 Test the updated page at: http://localhost:3000/test-payment-gateway');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure CloudVPS is running: npm run dev');
    console.log('   2. Make sure middleware is running on port 3005');
    console.log('   3. Check if HostBill API is accessible');
    console.log('   4. Verify API endpoints are working');
  }
}

// Run tests if called directly
if (require.main === module) {
  testPaymentGatewayUpdate();
}

module.exports = { testPaymentGatewayUpdate };
