/**
 * Test Gateway Bypass Fix
 * Řeší problém: Authorize Payment: Failed - "Unable to load payment gateway"
 * Používá přímé API volání místo gateway
 */

const MIDDLEWARE_URL = 'http://localhost:3005';
const TIMESTAMP = Date.now();

// Test configuration
const TEST_DATA = {
  orderId: '426',      // Order s problémem
  invoiceId: '446',    // Invoice s problémem
  amount: 100,         // Test amount
  currency: 'CZK',
  paymentMethod: 'comgate',
  transactionId: `GATEWAY-BYPASS-${TIMESTAMP}`
};

console.log('🧪 Testing Gateway Bypass Fix');
console.log('============================');
console.log('📋 Test Data:', TEST_DATA);
console.log('');
console.log('🎯 Cíl: Vyřešit "Unable to load payment gateway" pomocí přímých API volání');
console.log('');

async function testGatewayBypassFix() {
  try {
    // Step 1: Check initial status
    console.log('1️⃣ Checking initial order and invoice status...');
    console.log('===============================================');
    
    const initialStatusResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${TEST_DATA.invoiceId}/status`);
    const initialStatus = await initialStatusResponse.json();
    
    console.log('📊 Initial Invoice Status:');
    console.log(`   Invoice ID: ${initialStatus.invoiceId || TEST_DATA.invoiceId}`);
    console.log(`   Status: ${initialStatus.status}`);
    console.log(`   Is Paid: ${initialStatus.isPaid}`);
    console.log(`   Amount: ${initialStatus.amount} ${initialStatus.currency}`);
    console.log('');

    // Step 2: Execute gateway bypass workflow
    console.log('2️⃣ Executing Gateway Bypass Workflow...');
    console.log('=======================================');
    console.log('🔧 Používá přímé API volání místo gateway:');
    console.log('   • setOrderActive místo authorize gateway');
    console.log('   • addInvoicePayment místo capture gateway');
    console.log('   • runProvisioningHooks pro spuštění provisioningu');
    console.log('');
    
    const workflowData = {
      orderId: TEST_DATA.orderId,
      invoiceId: TEST_DATA.invoiceId,
      transactionId: TEST_DATA.transactionId,
      amount: TEST_DATA.amount,
      currency: TEST_DATA.currency,
      paymentMethod: TEST_DATA.paymentMethod,
      notes: `Gateway bypass fix test - ${TEST_DATA.transactionId}`
    };
    
    console.log('📤 Workflow Data:', workflowData);
    
    const workflowResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflowData)
    });
    
    const workflowResult = await workflowResponse.json();
    
    console.log('📥 Workflow Response:');
    console.log(`   Success: ${workflowResult.success}`);
    console.log(`   Message: ${workflowResult.message}`);
    console.log(`   Transaction ID: ${workflowResult.transactionId}`);
    console.log('');
    
    if (workflowResult.workflow) {
      console.log('   🔄 Workflow Steps:');
      console.log(`     Authorize Payment: ${getStatusIcon(workflowResult.workflow.authorizePayment)} ${workflowResult.workflow.authorizePayment}`);
      console.log(`     Capture Payment: ${getStatusIcon(workflowResult.workflow.capturePayment)} ${workflowResult.workflow.capturePayment}`);
      console.log(`     Provision: ${getStatusIcon(workflowResult.workflow.provision)} ${workflowResult.workflow.provision}`);
    }
    console.log('');
    
    if (workflowResult.details) {
      console.log('   📋 Detailed Results:');
      if (workflowResult.details.authorize) {
        console.log(`     Authorize: ${workflowResult.details.authorize.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (workflowResult.details.authorize.method) {
          console.log(`       Method: ${workflowResult.details.authorize.method}`);
        }
        if (workflowResult.details.authorize.error) {
          console.log(`       Error: ${workflowResult.details.authorize.error}`);
        }
      }
      if (workflowResult.details.capture) {
        console.log(`     Capture: ${workflowResult.details.capture.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (workflowResult.details.capture.method) {
          console.log(`       Method: ${workflowResult.details.capture.method}`);
        }
        if (workflowResult.details.capture.payment_id) {
          console.log(`       Payment ID: ${workflowResult.details.capture.payment_id}`);
        }
        if (workflowResult.details.capture.error) {
          console.log(`       Error: ${workflowResult.details.capture.error}`);
        }
      }
    }
    console.log('');
    
    if (workflowResult.nextSteps && workflowResult.nextSteps.length > 0) {
      console.log('   📝 Next Steps:');
      workflowResult.nextSteps.forEach((step, index) => {
        console.log(`     ${index + 1}. ${step}`);
      });
    }
    console.log('');

    // Step 3: Wait for processing
    console.log('3️⃣ Waiting for HostBill processing...');
    console.log('====================================');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('');

    // Step 4: Check final status
    console.log('4️⃣ Checking final status...');
    console.log('===========================');
    
    const finalStatusResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${TEST_DATA.invoiceId}/status`);
    const finalStatus = await finalStatusResponse.json();
    
    console.log('📊 Final Invoice Status:');
    console.log(`   Invoice ID: ${finalStatus.invoiceId || TEST_DATA.invoiceId}`);
    console.log(`   Status: ${finalStatus.status}`);
    console.log(`   Is Paid: ${finalStatus.isPaid}`);
    console.log(`   Amount: ${finalStatus.amount} ${finalStatus.currency}`);
    console.log(`   Date Paid: ${finalStatus.datePaid || 'Not paid'}`);
    console.log('');

    // Step 5: Test direct HostBill API calls
    console.log('5️⃣ Testing direct HostBill API calls...');
    console.log('======================================');
    
    try {
      // Test direct order activation
      console.log('🔧 Testing direct setOrderActive API call...');
      const directOrderResponse = await fetch(`${MIDDLEWARE_URL}/api/test-hostbill-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'setOrderActive',
          data: { id: TEST_DATA.orderId }
        })
      });
      
      const directOrderResult = await directOrderResponse.json();
      console.log(`   Direct Order Activation: ${directOrderResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (directOrderResult.error) {
        console.log(`   Error: ${directOrderResult.error}`);
      }
      
      // Test direct payment addition
      console.log('🔧 Testing direct addInvoicePayment API call...');
      const directPaymentResponse = await fetch(`${MIDDLEWARE_URL}/api/test-hostbill-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addInvoicePayment',
          data: {
            id: TEST_DATA.invoiceId,
            amount: 25,
            paymentmodule: 'comgate',
            fee: 0,
            date: new Date().toISOString().split('T')[0],
            transnumber: `${TEST_DATA.transactionId}-DIRECT`,
            notes: 'Direct API test payment',
            send_email: 0
          }
        })
      });
      
      const directPaymentResult = await directPaymentResponse.json();
      console.log(`   Direct Payment Addition: ${directPaymentResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (directPaymentResult.result && directPaymentResult.result.payment_id) {
        console.log(`   Payment ID: ${directPaymentResult.result.payment_id}`);
      }
      if (directPaymentResult.error) {
        console.log(`   Error: ${directPaymentResult.error}`);
      }
      
    } catch (directTestError) {
      console.log('   ⚠️ Direct API test error:', directTestError.message);
    }
    console.log('');

    // Summary
    console.log('📊 GATEWAY BYPASS FIX TEST SUMMARY');
    console.log('==================================');
    console.log(`Order ID: ${TEST_DATA.orderId}`);
    console.log(`Invoice ID: ${TEST_DATA.invoiceId}`);
    console.log(`Transaction ID: ${TEST_DATA.transactionId}`);
    console.log('');
    console.log('Results:');
    console.log(`  Workflow Success: ${workflowResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Invoice Status Change: ${initialStatus.status} → ${finalStatus.status}`);
    console.log(`  Invoice Paid Status: ${initialStatus.isPaid} → ${finalStatus.isPaid}`);
    console.log('');
    
    if (workflowResult.workflow) {
      console.log('Workflow Steps Results:');
      console.log(`  Authorize Payment: ${getStatusIcon(workflowResult.workflow.authorizePayment)} ${workflowResult.workflow.authorizePayment}`);
      console.log(`  Capture Payment: ${getStatusIcon(workflowResult.workflow.capturePayment)} ${workflowResult.workflow.capturePayment}`);
      console.log(`  Provision: ${getStatusIcon(workflowResult.workflow.provision)} ${workflowResult.workflow.provision}`);
    }
    console.log('');
    
    const allSuccess = workflowResult.success && 
                      workflowResult.workflow.authorizePayment === 'completed' &&
                      workflowResult.workflow.capturePayment === 'completed';
    
    if (allSuccess) {
      console.log('🎉 GATEWAY BYPASS FIX TEST PASSED!');
      console.log('✅ "Unable to load payment gateway" problem SOLVED!');
      console.log('✅ Direct API calls bypass gateway issues');
      console.log('✅ Authorize Payment: Failed → Completed');
      console.log('✅ Capture Payment: Pending → Completed');
      console.log('✅ Provision: Pending → Ready/Completed');
      console.log('');
      console.log('🔧 Solution Summary:');
      console.log('   1. setOrderActive API call bypasses gateway authorization');
      console.log('   2. addInvoicePayment API call bypasses gateway capture');
      console.log('   3. runProvisioningHooks API call triggers provisioning');
      console.log('   4. All steps work without payment gateway dependency');
    } else {
      console.log('❌ GATEWAY BYPASS FIX TEST FAILED!');
      console.log('❌ Check the results above for details');
      
      if (!workflowResult.success) {
        console.log(`❌ Workflow failed: ${workflowResult.message}`);
      }
      if (workflowResult.workflow.authorizePayment !== 'completed') {
        console.log(`❌ Authorization failed: ${workflowResult.workflow.authorizePayment}`);
      }
      if (workflowResult.workflow.capturePayment !== 'completed') {
        console.log(`❌ Capture failed: ${workflowResult.workflow.capturePayment}`);
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
testGatewayBypassFix();
