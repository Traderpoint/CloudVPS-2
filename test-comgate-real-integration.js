/**
 * Test Comgate Integration with Real Credentials
 * Tests the complete Comgate payment flow with real API credentials
 */

// Using built-in fetch (Node.js 18+)

const MIDDLEWARE_URL = 'http://localhost:3005';
const COMGATE_MERCHANT_ID = '498008';
const COMGATE_SECRET = 'WCJmtaUl94nEKQGMSj1JaYnOLcJORoVI';

console.log('🧪 Testing Comgate Integration with Real Credentials');
console.log('================================================================================');
console.log(`📡 Middleware URL: ${MIDDLEWARE_URL}`);
console.log(`🏪 Merchant ID: ${COMGATE_MERCHANT_ID}`);
console.log(`🔐 Secret: ${COMGATE_SECRET.substring(0, 8)}***`);
console.log('================================================================================\n');

async function testComgateIntegration() {
  const results = {
    middlewareConnection: false,
    comgateCredentials: false,
    paymentMethods: false,
    paymentCreation: false,
    paymentStatus: false
  };

  try {
    // Test 1: Middleware Connection
    console.log('🔍 Test 1: Testing middleware connection...');
    try {
      const response = await fetch(`${MIDDLEWARE_URL}/api/status`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Middleware connection: OK');
        results.middlewareConnection = true;
      } else {
        console.log('❌ Middleware connection: FAILED');
      }
    } catch (error) {
      console.log('❌ Middleware connection: FAILED -', error.message);
    }

    // Test 2: Comgate Credentials
    console.log('\n🔍 Test 2: Testing Comgate credentials...');
    try {
      const response = await fetch(`${MIDDLEWARE_URL}/api/payments/comgate/methods`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Comgate credentials: OK');
        console.log(`   Available methods: ${data.methods.length}`);
        results.comgateCredentials = true;
        results.paymentMethods = true;
      } else {
        console.log('❌ Comgate credentials: FAILED -', data.error);
      }
    } catch (error) {
      console.log('❌ Comgate credentials: FAILED -', error.message);
    }

    // Test 3: Payment Creation
    console.log('\n🔍 Test 3: Testing payment creation...');
    try {
      const paymentData = {
        orderId: 'TEST-' + Date.now(),
        invoiceId: 'INV-' + Date.now(),
        method: 'comgate',
        amount: 100, // 100 CZK
        currency: 'CZK',
        customerData: {
          email: 'test@example.com',
          fullName: 'Test User',
          phone: '+420123456789'
        }
      };

      const response = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (result.success && result.transactionId) {
        console.log('✅ Payment creation: OK');
        console.log(`   Transaction ID: ${result.transactionId}`);
        console.log(`   Payment URL: ${result.paymentUrl || 'N/A'}`);
        results.paymentCreation = true;

        // Test 4: Payment Status Check
        console.log('\n🔍 Test 4: Testing payment status check...');
        try {
          const statusResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/comgate/status?transactionId=${result.transactionId}`);
          const statusData = await statusResponse.json();
          
          if (statusData.success) {
            console.log('✅ Payment status check: OK');
            console.log(`   Status: ${statusData.status}`);
            console.log(`   Amount: ${statusData.amount} ${statusData.currency}`);
            results.paymentStatus = true;
          } else {
            console.log('❌ Payment status check: FAILED -', statusData.error);
          }
        } catch (error) {
          console.log('❌ Payment status check: FAILED -', error.message);
        }
      } else {
        console.log('❌ Payment creation: FAILED -', result.error);
      }
    } catch (error) {
      console.log('❌ Payment creation: FAILED -', error.message);
    }

    // Summary
    console.log('\n================================================================================');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('================================================================================');
    console.log(`🔗 Middleware Connection: ${results.middlewareConnection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔐 Comgate Credentials: ${results.comgateCredentials ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`💳 Payment Methods: ${results.paymentMethods ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🚀 Payment Creation: ${results.paymentCreation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📊 Payment Status: ${results.paymentStatus ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Comgate integration is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Please check the configuration and try again.');
    }

  } catch (error) {
    console.error('💥 Critical error during testing:', error);
  }
}

// Run the test
testComgateIntegration().catch(console.error);
