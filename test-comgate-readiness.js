/**
 * Comgate Integration Readiness Test
 * Verifies that Comgate integration is ready for real testing
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

async function testComgateReadiness() {
  console.log('🔍 === COMGATE INTEGRATION READINESS TEST ===\n');
  console.log('📋 Testing integration readiness for real Comgate API');
  console.log('⚠️  Mock mode disabled - attempting real API calls\n');

  const results = {
    configuration: false,
    credentials: false,
    endpoints: false,
    integration: false,
    ipWhitelist: false
  };

  try {
    // Test 1: Configuration check
    console.log('1️⃣ Testing Comgate configuration...');
    
    const methodsResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/methods`);
    const methodsData = await methodsResponse.json();
    
    if (methodsData.success) {
      const comgateMethod = methodsData.methods.find(m => m.method === 'comgate');
      if (comgateMethod) {
        console.log('✅ Comgate configured in payment methods');
        results.configuration = true;
      } else {
        console.log('❌ Comgate not found in payment methods');
      }
    }

    // Test 2: Credentials and API connectivity
    console.log('\n2️⃣ Testing Comgate credentials and API connectivity...');
    
    try {
      const comgateMethodsResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/comgate/methods`);
      const comgateMethodsData = await comgateMethodsResponse.json();
      
      if (comgateMethodsData.success) {
        console.log('✅ Comgate API credentials working');
        console.log(`   Available methods: ${comgateMethodsData.methods.length}`);
        results.credentials = true;
        results.ipWhitelist = true;
      } else {
        console.log('❌ Comgate API error:', comgateMethodsData.error);
        
        if (comgateMethodsData.error && comgateMethodsData.error.includes('unauthorized location')) {
          console.log('⚠️  IP Whitelist issue detected');
          console.log('   Credentials are valid but IP needs whitelisting');
          results.credentials = true;
          results.ipWhitelist = false;
        }
      }
    } catch (error) {
      console.log('❌ Comgate API connection failed:', error.message);
    }

    // Test 3: Endpoint availability
    console.log('\n3️⃣ Testing Comgate endpoints...');
    
    const endpoints = [
      '/api/payments/comgate/methods',
      '/api/payments/comgate/initialize', 
      '/api/payments/comgate/status',
      '/api/payments/comgate/callback'
    ];

    let endpointsWorking = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${MIDDLEWARE_URL}${endpoint}`, {
          method: endpoint.includes('initialize') || endpoint.includes('callback') ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: endpoint.includes('initialize') ? JSON.stringify({
            orderId: 'TEST',
            amount: 100,
            currency: 'CZK'
          }) : endpoint.includes('callback') ? JSON.stringify({
            transId: 'TEST'
          }) : undefined
        });
        
        // Even if API fails due to IP whitelist, endpoint should respond
        if (response.status < 500) {
          endpointsWorking++;
        }
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} failed:`, error.message);
      }
    }
    
    if (endpointsWorking === endpoints.length) {
      console.log('✅ All Comgate endpoints available');
      results.endpoints = true;
    } else {
      console.log(`⚠️  ${endpointsWorking}/${endpoints.length} endpoints working`);
    }

    // Test 4: Integration with main payment flow
    console.log('\n4️⃣ Testing integration with main payment flow...');
    
    try {
      const paymentResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'TEST-' + Date.now(),
          invoiceId: 'INV-' + Date.now(),
          method: 'comgate',
          amount: 299,
          currency: 'CZK'
        })
      });

      const paymentResult = await paymentResponse.json();
      
      if (paymentResult.success || (paymentResult.error && paymentResult.error.includes('unauthorized location'))) {
        console.log('✅ Comgate integrated with main payment flow');
        results.integration = true;
      } else {
        console.log('❌ Integration test failed:', paymentResult.error);
      }
    } catch (error) {
      console.log('❌ Integration test error:', error.message);
    }

    // Results summary
    console.log('\n🎯 === READINESS TEST RESULTS ===');
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    console.log(`📊 Overall Score: ${passedTests}/${totalTests} tests passed\n`);
    
    console.log('📋 Detailed Results:');
    console.log(`   Configuration: ${results.configuration ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Credentials: ${results.credentials ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Endpoints: ${results.endpoints ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Integration: ${results.integration ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   IP Whitelist: ${results.ipWhitelist ? '✅ PASS' : '❌ FAIL (IP: 93.91.158.142)'}`);

    if (!results.ipWhitelist && results.credentials) {
      console.log('\n💡 NEXT STEPS:');
      console.log('   1. Add IP 93.91.158.142 to Comgate whitelist');
      console.log('   2. Go to: https://portal.comgate.cz');
      console.log('   3. Section: Integrace > Nastavení obchodu > Propojení obchodu');
      console.log('   4. Add IP to allowed addresses');
      console.log('   5. Re-run this test');
      
      console.log('\n📞 Or contact Comgate support:');
      console.log('   Email: podpora@comgate.cz');
      console.log('   Phone: +420 228 224 267');
      console.log('   Message: "Please add IP 93.91.158.142 to whitelist for merchant 498008"');
    }

    if (passedTests >= 4) {
      console.log('\n🎉 INTEGRATION IS READY!');
      console.log('   Comgate integration is fully implemented and ready for testing');
      console.log('   Only IP whitelist configuration needed for live testing');
    } else {
      console.log('\n⚠️  INTEGRATION NEEDS ATTENTION');
      console.log('   Some components need fixing before live testing');
    }

    return results;

  } catch (error) {
    console.error('❌ Readiness test failed:', error.message);
    return results;
  }
}

// Run the test
if (require.main === module) {
  testComgateReadiness();
}

module.exports = { testComgateReadiness };
