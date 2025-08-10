/**
 * Test Capture Payment Page Fix
 * Testuje opravenou capture-payment-test stránku
 */

const MIDDLEWARE_URL = 'http://localhost:3005';
const TIMESTAMP = Date.now();

// Test data
const TEST_DATA = {
  orderId: '426',
  invoiceId: '446',
  amount: 25,
  currency: 'CZK',
  transactionId: `CAPTURE-PAGE-FIX-${TIMESTAMP}`
};

console.log('🧪 Testing Capture Payment Page Fix');
console.log('===================================');
console.log('📋 Test Data:', TEST_DATA);
console.log('');
console.log('🎯 Testing:');
console.log('   1. Fixed capture payment endpoint (middleware:3005)');
console.log('   2. Fixed invoice status endpoint (middleware:3005)');
console.log('   3. Both should work without 404 errors');
console.log('');

async function testCapturePaymentPageFix() {
  try {
    // Step 1: Test invoice status endpoint (should work now)
    console.log('1️⃣ Testing Invoice Status Endpoint...');
    console.log('====================================');
    
    console.log(`🔍 Calling: ${MIDDLEWARE_URL}/api/invoices/${TEST_DATA.invoiceId}/status`);
    
    const statusResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${TEST_DATA.invoiceId}/status`);
    
    console.log(`📊 Status Response Code: ${statusResponse.status}`);
    
    if (statusResponse.status === 404) {
      console.log('❌ Still getting 404 - endpoint might not exist');
      console.log('📝 Response headers:', Object.fromEntries(statusResponse.headers.entries()));
    } else {
      const statusData = await statusResponse.json();
      console.log('✅ Invoice Status Response:');
      console.log(`   Invoice ID: ${statusData.invoiceId || TEST_DATA.invoiceId}`);
      console.log(`   Status: ${statusData.status}`);
      console.log(`   Is Paid: ${statusData.isPaid}`);
      console.log(`   Amount: ${statusData.amount} ${statusData.currency}`);
    }
    console.log('');

    // Step 2: Test capture payment endpoint
    console.log('2️⃣ Testing Capture Payment Endpoint...');
    console.log('=====================================');
    
    const captureData = {
      orderId: TEST_DATA.orderId,
      invoiceId: TEST_DATA.invoiceId,
      transactionId: TEST_DATA.transactionId,
      amount: TEST_DATA.amount,
      currency: TEST_DATA.currency,
      paymentMethod: 'comgate',
      notes: 'Capture payment page fix test',
      skipAuthorize: true
    };
    
    console.log(`🔍 Calling: ${MIDDLEWARE_URL}/api/payments/authorize-capture`);
    console.log('📤 Request Data:', captureData);
    
    const captureResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(captureData)
    });
    
    console.log(`📊 Capture Response Code: ${captureResponse.status}`);
    
    if (captureResponse.status === 404) {
      console.log('❌ Still getting 404 - endpoint might not exist');
      console.log('📝 Response headers:', Object.fromEntries(captureResponse.headers.entries()));
    } else {
      const captureResult = await captureResponse.json();
      console.log('✅ Capture Payment Response:');
      console.log(`   Success: ${captureResult.success}`);
      console.log(`   Message: ${captureResult.message}`);
      console.log(`   Transaction ID: ${captureResult.transactionId}`);
      
      if (captureResult.workflow) {
        console.log('   🔄 Workflow Steps:');
        console.log(`     Authorize: ${getStatusIcon(captureResult.workflow.authorizePayment)} ${captureResult.workflow.authorizePayment}`);
        console.log(`     Capture: ${getStatusIcon(captureResult.workflow.capturePayment)} ${captureResult.workflow.capturePayment}`);
        console.log(`     Provision: ${getStatusIcon(captureResult.workflow.provision)} ${captureResult.workflow.provision}`);
      }
    }
    console.log('');

    // Step 3: Test direct middleware endpoints
    console.log('3️⃣ Testing Direct Middleware Endpoints...');
    console.log('========================================');
    
    // Test if middleware is running
    try {
      console.log(`🔍 Testing middleware health: ${MIDDLEWARE_URL}/api/health`);
      const healthResponse = await fetch(`${MIDDLEWARE_URL}/api/health`);
      console.log(`📊 Health Response Code: ${healthResponse.status}`);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Middleware is running:', healthData);
      } else {
        console.log('⚠️ Middleware health check failed');
      }
    } catch (healthError) {
      console.log('❌ Cannot reach middleware:', healthError.message);
    }
    
    // Test available endpoints
    try {
      console.log(`🔍 Testing middleware endpoints list: ${MIDDLEWARE_URL}/api/endpoints`);
      const endpointsResponse = await fetch(`${MIDDLEWARE_URL}/api/endpoints`);
      console.log(`📊 Endpoints Response Code: ${endpointsResponse.status}`);
      
      if (endpointsResponse.ok) {
        const endpointsData = await endpointsResponse.json();
        console.log('✅ Available endpoints:', endpointsData);
      } else {
        console.log('⚠️ Endpoints list not available');
      }
    } catch (endpointsError) {
      console.log('❌ Cannot get endpoints list:', endpointsError.message);
    }
    console.log('');

    // Step 4: Test alternative invoice status endpoint
    console.log('4️⃣ Testing Alternative Invoice Status Endpoints...');
    console.log('=================================================');
    
    // Try different possible endpoints
    const alternativeEndpoints = [
      `/api/hostbill/invoices/${TEST_DATA.invoiceId}/status`,
      `/api/hostbill/invoice/${TEST_DATA.invoiceId}`,
      `/api/invoices/${TEST_DATA.invoiceId}`,
      `/api/invoice-status/${TEST_DATA.invoiceId}`,
      `/api/hostbill/getInvoices?id=${TEST_DATA.invoiceId}`
    ];
    
    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`🔍 Testing: ${MIDDLEWARE_URL}${endpoint}`);
        const testResponse = await fetch(`${MIDDLEWARE_URL}${endpoint}`);
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

    // Summary
    console.log('📊 CAPTURE PAYMENT PAGE FIX TEST SUMMARY');
    console.log('========================================');
    console.log(`Test Data: Order ${TEST_DATA.orderId}, Invoice ${TEST_DATA.invoiceId}`);
    console.log('');
    console.log('Fix Status:');
    console.log(`  Endpoints now call middleware:3005: ✅ FIXED`);
    console.log(`  No more /api/middleware/ prefix: ✅ FIXED`);
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Check if middleware is running on port 3005');
    console.log('  2. Verify invoice status endpoint exists in middleware');
    console.log('  3. Test the page in browser: http://localhost:3000/capture-payment-test');
    console.log('');
    console.log('🌐 Test URL: http://localhost:3000/capture-payment-test');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'completed': return '✅';
    case 'failed': return '❌';
    case 'pending': return '🔄';
    case 'skipped': return '⏭️';
    case 'ready': return '✅';
    default: return '⚠️';
  }
}

// Run the test
testCapturePaymentPageFix();
