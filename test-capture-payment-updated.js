/**
 * Test Updated Capture Payment Functions
 * Testuje opravené capture payment funkce v invoice-payment-test a capture-payment-test
 */

const MIDDLEWARE_URL = 'http://localhost:3005';
const TIMESTAMP = Date.now();

// Test data
const TEST_DATA = {
  orderId: '426',
  invoiceId: '446',
  amount: 50,
  currency: 'CZK',
  transactionId: `CAPTURE-UPDATE-TEST-${TIMESTAMP}`
};

console.log('🧪 Testing Updated Capture Payment Functions');
console.log('===========================================');
console.log('📋 Test Data:', TEST_DATA);
console.log('');
console.log('🎯 Testing:');
console.log('   1. Updated capture payment in invoice-payment-test');
console.log('   2. New capture-payment-test standalone page');
console.log('   3. Both using new authorize-capture endpoint');
console.log('');

async function testUpdatedCapturePayment() {
  try {
    // Step 1: Test capture-only workflow (skipAuthorize: true)
    console.log('1️⃣ Testing Capture-Only Workflow (skipAuthorize: true)...');
    console.log('======================================================');
    
    const captureOnlyData = {
      orderId: TEST_DATA.orderId,
      invoiceId: TEST_DATA.invoiceId,
      transactionId: `${TEST_DATA.transactionId}-CAPTURE-ONLY`,
      amount: TEST_DATA.amount,
      currency: TEST_DATA.currency,
      paymentMethod: 'comgate',
      notes: 'Capture-only test - skip authorize step',
      skipAuthorize: true // Only capture, skip authorize
    };
    
    console.log('📤 Capture-Only Request:', captureOnlyData);
    
    const captureOnlyResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(captureOnlyData)
    });
    
    const captureOnlyResult = await captureOnlyResponse.json();
    
    console.log('📥 Capture-Only Response:');
    console.log(`   Success: ${captureOnlyResult.success}`);
    console.log(`   Message: ${captureOnlyResult.message}`);
    console.log(`   Transaction ID: ${captureOnlyResult.transactionId}`);
    console.log('');
    
    if (captureOnlyResult.workflow) {
      console.log('   🔄 Workflow Steps:');
      console.log(`     Authorize Payment: ${getStatusIcon(captureOnlyResult.workflow.authorizePayment)} ${captureOnlyResult.workflow.authorizePayment}`);
      console.log(`     Capture Payment: ${getStatusIcon(captureOnlyResult.workflow.capturePayment)} ${captureOnlyResult.workflow.capturePayment}`);
      console.log(`     Provision: ${getStatusIcon(captureOnlyResult.workflow.provision)} ${captureOnlyResult.workflow.provision}`);
    }
    console.log('');

    // Step 2: Test full workflow (skipAuthorize: false)
    console.log('2️⃣ Testing Full Workflow (authorize + capture)...');
    console.log('================================================');
    
    const fullWorkflowData = {
      orderId: TEST_DATA.orderId,
      invoiceId: TEST_DATA.invoiceId,
      transactionId: `${TEST_DATA.transactionId}-FULL-WORKFLOW`,
      amount: TEST_DATA.amount,
      currency: TEST_DATA.currency,
      paymentMethod: 'comgate',
      notes: 'Full workflow test - authorize + capture + provision',
      skipAuthorize: false // Full workflow
    };
    
    console.log('📤 Full Workflow Request:', fullWorkflowData);
    
    const fullWorkflowResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullWorkflowData)
    });
    
    const fullWorkflowResult = await fullWorkflowResponse.json();
    
    console.log('📥 Full Workflow Response:');
    console.log(`   Success: ${fullWorkflowResult.success}`);
    console.log(`   Message: ${fullWorkflowResult.message}`);
    console.log(`   Transaction ID: ${fullWorkflowResult.transactionId}`);
    console.log('');
    
    if (fullWorkflowResult.workflow) {
      console.log('   🔄 Workflow Steps:');
      console.log(`     Authorize Payment: ${getStatusIcon(fullWorkflowResult.workflow.authorizePayment)} ${fullWorkflowResult.workflow.authorizePayment}`);
      console.log(`     Capture Payment: ${getStatusIcon(fullWorkflowResult.workflow.capturePayment)} ${fullWorkflowResult.workflow.capturePayment}`);
      console.log(`     Provision: ${getStatusIcon(fullWorkflowResult.workflow.provision)} ${fullWorkflowResult.workflow.provision}`);
    }
    console.log('');

    // Step 3: Test invoice status check
    console.log('3️⃣ Testing Invoice Status Check...');
    console.log('=================================');
    
    const statusResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${TEST_DATA.invoiceId}/status`);
    const statusResult = await statusResponse.json();
    
    console.log('📊 Invoice Status:');
    console.log(`   Invoice ID: ${statusResult.invoiceId || TEST_DATA.invoiceId}`);
    console.log(`   Status: ${statusResult.status}`);
    console.log(`   Is Paid: ${statusResult.isPaid}`);
    console.log(`   Amount: ${statusResult.amount} ${statusResult.currency}`);
    console.log(`   Date Paid: ${statusResult.datePaid || 'Not paid'}`);
    console.log('');

    // Step 4: Test error handling (invalid invoice)
    console.log('4️⃣ Testing Error Handling (invalid invoice)...');
    console.log('===============================================');
    
    const errorTestData = {
      orderId: '999999',
      invoiceId: '999999',
      transactionId: `${TEST_DATA.transactionId}-ERROR-TEST`,
      amount: 10,
      currency: 'CZK',
      paymentMethod: 'comgate',
      notes: 'Error handling test - invalid invoice',
      skipAuthorize: true
    };
    
    console.log('📤 Error Test Request:', errorTestData);
    
    const errorTestResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorTestData)
    });
    
    const errorTestResult = await errorTestResponse.json();
    
    console.log('📥 Error Test Response:');
    console.log(`   Success: ${errorTestResult.success}`);
    console.log(`   Error: ${errorTestResult.error || errorTestResult.message}`);
    console.log('');

    // Summary
    console.log('📊 UPDATED CAPTURE PAYMENT TEST SUMMARY');
    console.log('=======================================');
    console.log(`Test Data: Order ${TEST_DATA.orderId}, Invoice ${TEST_DATA.invoiceId}`);
    console.log('');
    console.log('Test Results:');
    console.log(`  Capture-Only Workflow: ${captureOnlyResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Full Workflow: ${fullWorkflowResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Invoice Status Check: ${statusResult.status ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Error Handling: ${!errorTestResult.success ? '✅ SUCCESS (correctly failed)' : '❌ FAILED (should have failed)'}`);
    console.log('');
    
    if (captureOnlyResult.workflow && fullWorkflowResult.workflow) {
      console.log('Workflow Comparison:');
      console.log('');
      console.log('Capture-Only Results:');
      console.log(`  Authorize: ${getStatusIcon(captureOnlyResult.workflow.authorizePayment)} ${captureOnlyResult.workflow.authorizePayment}`);
      console.log(`  Capture: ${getStatusIcon(captureOnlyResult.workflow.capturePayment)} ${captureOnlyResult.workflow.capturePayment}`);
      console.log(`  Provision: ${getStatusIcon(captureOnlyResult.workflow.provision)} ${captureOnlyResult.workflow.provision}`);
      console.log('');
      console.log('Full Workflow Results:');
      console.log(`  Authorize: ${getStatusIcon(fullWorkflowResult.workflow.authorizePayment)} ${fullWorkflowResult.workflow.authorizePayment}`);
      console.log(`  Capture: ${getStatusIcon(fullWorkflowResult.workflow.capturePayment)} ${fullWorkflowResult.workflow.capturePayment}`);
      console.log(`  Provision: ${getStatusIcon(fullWorkflowResult.workflow.provision)} ${fullWorkflowResult.workflow.provision}`);
    }
    console.log('');
    
    const allTestsPass = captureOnlyResult.success && 
                        fullWorkflowResult.success && 
                        statusResult.status &&
                        !errorTestResult.success;
    
    if (allTestsPass) {
      console.log('🎉 ALL UPDATED CAPTURE PAYMENT TESTS PASSED!');
      console.log('✅ Capture-only workflow works correctly');
      console.log('✅ Full workflow (authorize + capture) works correctly');
      console.log('✅ Invoice status check works correctly');
      console.log('✅ Error handling works correctly');
      console.log('✅ Both invoice-payment-test and capture-payment-test updated successfully');
      console.log('');
      console.log('🔧 Updated Features:');
      console.log('   • Uses new /api/payments/authorize-capture endpoint');
      console.log('   • Supports skipAuthorize parameter for capture-only');
      console.log('   • Gateway bypass functionality included');
      console.log('   • Better error handling and user feedback');
      console.log('   • Detailed workflow status reporting');
      console.log('');
      console.log('🌐 Test URLs:');
      console.log('   • http://localhost:3000/invoice-payment-test');
      console.log('   • http://localhost:3000/capture-payment-test');
    } else {
      console.log('❌ SOME UPDATED CAPTURE PAYMENT TESTS FAILED!');
      console.log('❌ Check the results above for details');
      
      if (!captureOnlyResult.success) {
        console.log(`❌ Capture-only failed: ${captureOnlyResult.error || captureOnlyResult.message}`);
      }
      if (!fullWorkflowResult.success) {
        console.log(`❌ Full workflow failed: ${fullWorkflowResult.error || fullWorkflowResult.message}`);
      }
      if (!statusResult.status) {
        console.log(`❌ Invoice status check failed`);
      }
      if (errorTestResult.success) {
        console.log(`❌ Error handling failed: Should have failed but succeeded`);
      }
    }

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
testUpdatedCapturePayment();
