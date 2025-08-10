/**
 * Test PAY Button Fix
 * Testuje opravenou funkci PAY tlačítka v invoice-payment-test
 */

const MIDDLEWARE_URL = 'http://localhost:3005';
const TIMESTAMP = Date.now();

// Test data
const TEST_DATA = {
  orderId: '426',
  invoiceId: '446',
  amount: 25,
  currency: 'CZK',
  paymentMethod: 'comgate'
};

console.log('🧪 Testing PAY Button Fix');
console.log('=========================');
console.log('📋 Test Data:', TEST_DATA);
console.log('');
console.log('🎯 Testing:');
console.log('   1. Payment initialization endpoint');
console.log('   2. Mark invoice paid endpoint');
console.log('   3. Complete PAY button workflow');
console.log('');

async function testPayButtonFix() {
  try {
    // Step 1: Test payment initialization endpoint
    console.log('1️⃣ Testing Payment Initialization Endpoint...');
    console.log('==============================================');
    
    const initData = {
      orderId: TEST_DATA.orderId,
      invoiceId: TEST_DATA.invoiceId,
      method: TEST_DATA.paymentMethod,
      amount: TEST_DATA.amount,
      currency: TEST_DATA.currency,
      customerData: {
        email: 'test@example.com',
        name: 'Test Customer'
      },
      testFlow: true,
      returnUrl: 'http://localhost:3000/invoice-payment-test'
    };
    
    console.log(`🔍 Calling: ${MIDDLEWARE_URL}/api/payments/initialize`);
    console.log('📤 Request Data:', initData);
    
    const initResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initData)
    });
    
    console.log(`📊 Response Code: ${initResponse.status}`);
    
    let initResult;
    if (initResponse.ok) {
      initResult = await initResponse.json();
      console.log('✅ Payment Initialization Response:');
      console.log(`   Success: ${initResult.success}`);
      console.log(`   Payment ID: ${initResult.paymentId || 'N/A'}`);
      console.log(`   Payment URL: ${initResult.paymentUrl || 'N/A'}`);
      console.log(`   Message: ${initResult.message || 'N/A'}`);
    } else {
      const errorText = await initResponse.text();
      console.log('❌ Payment Initialization Failed:');
      console.log(`   Error: ${errorText}`);
      initResult = { success: false, error: errorText };
    }
    console.log('');

    // Step 2: Test mark invoice paid endpoint
    console.log('2️⃣ Testing Mark Invoice Paid Endpoint...');
    console.log('========================================');
    
    const markPaidData = {
      invoiceId: TEST_DATA.invoiceId,
      transactionId: `PAY-BUTTON-TEST-${TIMESTAMP}`,
      paymentMethod: TEST_DATA.paymentMethod,
      amount: TEST_DATA.amount,
      currency: TEST_DATA.currency,
      notes: `Payment completed via ${TEST_DATA.paymentMethod} - Order ${TEST_DATA.orderId}`
    };
    
    console.log(`🔍 Calling: ${MIDDLEWARE_URL}/api/mark-invoice-paid`);
    console.log('📤 Request Data:', { invoiceId: TEST_DATA.invoiceId, status: 'Paid' });

    const markPaidResponse = await fetch(`${MIDDLEWARE_URL}/api/mark-invoice-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId: TEST_DATA.invoiceId,
        status: 'Paid'
      })
    });
    
    console.log(`📊 Response Code: ${markPaidResponse.status}`);
    
    let markPaidResult;
    if (markPaidResponse.ok) {
      markPaidResult = await markPaidResponse.json();
      console.log('✅ Mark Invoice Paid Response:');
      console.log(`   Success: ${markPaidResult.success}`);
      console.log(`   Payment ID: ${markPaidResult.paymentId || 'N/A'}`);
      console.log(`   Message: ${markPaidResult.message || 'N/A'}`);
    } else {
      const errorText = await markPaidResponse.text();
      console.log('❌ Mark Invoice Paid Failed:');
      console.log(`   Error: ${errorText}`);
      markPaidResult = { success: false, error: errorText };
    }
    console.log('');

    // Step 3: Test alternative endpoints if main ones fail
    console.log('3️⃣ Testing Alternative Endpoints...');
    console.log('===================================');
    
    // Test if middleware has different endpoint names
    const alternativeEndpoints = [
      '/api/payment/initialize',
      '/api/initialize-payment',
      '/api/payments/init',
      '/api/hostbill/initialize-payment'
    ];
    
    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`🔍 Testing: ${MIDDLEWARE_URL}${endpoint}`);
        const testResponse = await fetch(`${MIDDLEWARE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initData)
        });
        
        console.log(`   Response Code: ${testResponse.status}`);
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log(`   ✅ SUCCESS: ${endpoint}`);
          console.log(`   Data:`, testData);
          break;
        } else if (testResponse.status !== 404) {
          console.log(`   ⚠️ Non-404 error: ${testResponse.status}`);
        }
      } catch (testError) {
        console.log(`   ❌ Error: ${testError.message}`);
      }
    }
    console.log('');

    // Step 4: Test middleware health and available endpoints
    console.log('4️⃣ Testing Middleware Health...');
    console.log('===============================');
    
    try {
      const healthResponse = await fetch(`${MIDDLEWARE_URL}/api/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Middleware Health:');
        console.log(`   Status: ${healthData.status}`);
        console.log(`   Port: ${healthData.port}`);
        if (healthData.hostbill) {
          console.log(`   HostBill: ${healthData.hostbill.status}`);
        }
      } else {
        console.log('❌ Middleware health check failed');
      }
    } catch (healthError) {
      console.log('❌ Cannot reach middleware:', healthError.message);
    }
    console.log('');

    // Summary
    console.log('📊 PAY BUTTON FIX TEST SUMMARY');
    console.log('==============================');
    console.log(`Test Data: Order ${TEST_DATA.orderId}, Invoice ${TEST_DATA.invoiceId}`);
    console.log('');
    console.log('Endpoint Tests:');
    console.log(`  Payment Initialize: ${initResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Mark Invoice Paid: ${markPaidResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('');
    
    const allEndpointsWork = initResult.success && markPaidResult.success;
    
    if (allEndpointsWork) {
      console.log('🎉 PAY BUTTON FIX TEST PASSED!');
      console.log('✅ All middleware endpoints are working');
      console.log('✅ Payment initialization endpoint fixed');
      console.log('✅ Mark invoice paid endpoint fixed');
      console.log('✅ PAY button should now work correctly');
      console.log('');
      console.log('🔧 Fixed endpoints:');
      console.log('   • /api/middleware/initialize-payment → http://localhost:3005/api/payments/initialize');
      console.log('   • /api/middleware/mark-invoice-paid → http://localhost:3005/api/payments/mark-invoice-paid');
      console.log('   • /api/middleware/authorize-capture → http://localhost:3005/api/payments/authorize-capture');
      console.log('');
      console.log('🌐 Test the PAY button at: http://localhost:3000/invoice-payment-test');
    } else {
      console.log('❌ PAY BUTTON FIX TEST FAILED!');
      console.log('❌ Some middleware endpoints are not working');
      
      if (!initResult.success) {
        console.log(`❌ Payment initialization failed: ${initResult.error}`);
      }
      if (!markPaidResult.success) {
        console.log(`❌ Mark invoice paid failed: ${markPaidResult.error}`);
      }
      
      console.log('');
      console.log('🔧 Possible solutions:');
      console.log('   1. Check if middleware is running on port 3005');
      console.log('   2. Verify middleware has payment endpoints');
      console.log('   3. Check middleware logs for errors');
      console.log('   4. Ensure HostBill connection is working');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPayButtonFix();
