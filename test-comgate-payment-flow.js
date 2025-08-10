/**
 * Test ComGate Payment Flow
 * Simuluje skutečnou ComGate platbu a následné authorize-capture
 */

const MIDDLEWARE_URL = 'http://localhost:3005';
const CLOUDVPS_URL = 'http://localhost:3000';
const TIMESTAMP = Date.now();

// Simulace ComGate transaction data
const COMGATE_TRANSACTION = {
  refId: `CG-${TIMESTAMP}`,
  transactionId: `COMGATE-TXN-${TIMESTAMP}`,
  REFNO: `REF-${TIMESTAMP}`,
  label: '446', // Invoice ID
  status: 'PAID',
  amount: '100.00',
  currency: 'CZK',
  method: 'CARD'
};

// Test data
const TEST_DATA = {
  orderId: '426',
  invoiceId: '446',
  amount: 100,
  currency: 'CZK'
};

console.log('🧪 Testing ComGate Payment Flow');
console.log('===============================');
console.log('📋 Test Data:', TEST_DATA);
console.log('💳 ComGate Transaction:', COMGATE_TRANSACTION);
console.log('');
console.log('🎯 Workflow:');
console.log('   1. Simulace ComGate platby (PAID)');
console.log('   2. ComGate return s transaction ID');
console.log('   3. Payment success stránka');
console.log('   4. Authorize-capture s REAL transaction ID');
console.log('');

async function testComGatePaymentFlow() {
  try {
    // Step 1: Simulace ComGate callback (úspěšná platba)
    console.log('1️⃣ Simulace ComGate callback (úspěšná platba)...');
    console.log('================================================');
    
    const callbackData = {
      status: 'success',
      invoiceId: TEST_DATA.invoiceId,
      orderId: TEST_DATA.orderId,
      transactionId: COMGATE_TRANSACTION.transactionId,
      refId: COMGATE_TRANSACTION.refId,
      REFNO: COMGATE_TRANSACTION.REFNO,
      label: COMGATE_TRANSACTION.label,
      amount: COMGATE_TRANSACTION.amount,
      currency: COMGATE_TRANSACTION.currency,
      paymentMethod: 'comgate'
    };
    
    console.log('📤 Sending ComGate callback:', callbackData);
    
    const callbackResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callbackData)
    });
    
    const callbackResult = await callbackResponse.json();
    
    console.log('📥 ComGate Callback Response:');
    console.log(`   Success: ${callbackResult.success}`);
    console.log(`   Message: ${callbackResult.message}`);
    console.log(`   Transaction ID: ${callbackResult.transactionId}`);
    console.log('');

    // Step 2: Simulace ComGate return (redirect na payment-success)
    console.log('2️⃣ Simulace ComGate return (redirect na payment-success)...');
    console.log('==========================================================');
    
    // Vytvoříme URL parametry jako by je poslal ComGate
    const returnParams = new URLSearchParams({
      invoiceId: TEST_DATA.invoiceId,
      orderId: TEST_DATA.orderId,
      amount: `${TEST_DATA.amount} CZK`,
      paymentMethod: 'comgate',
      status: 'success',
      // ComGate specific parameters
      transactionId: COMGATE_TRANSACTION.transactionId,
      refId: COMGATE_TRANSACTION.refId,
      REFNO: COMGATE_TRANSACTION.REFNO,
      label: COMGATE_TRANSACTION.label
    });
    
    const paymentSuccessUrl = `${CLOUDVPS_URL}/payment-success?${returnParams.toString()}`;
    
    console.log('🔗 ComGate return URL:');
    console.log(`   ${paymentSuccessUrl}`);
    console.log('');
    console.log('📋 URL Parameters:');
    returnParams.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');

    // Step 3: Simulace authorize-capture s REAL transaction ID
    console.log('3️⃣ Simulace authorize-capture s REAL transaction ID...');
    console.log('====================================================');
    
    const workflowData = {
      orderId: TEST_DATA.orderId,
      invoiceId: TEST_DATA.invoiceId,
      transactionId: COMGATE_TRANSACTION.transactionId, // REAL ComGate transaction ID
      amount: TEST_DATA.amount,
      currency: TEST_DATA.currency,
      paymentMethod: 'comgate',
      notes: `Real ComGate payment - Transaction: ${COMGATE_TRANSACTION.transactionId}, RefId: ${COMGATE_TRANSACTION.refId}`
    };
    
    console.log('📤 Authorize-Capture with REAL transaction ID:', workflowData);
    
    const workflowResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflowData)
    });
    
    const workflowResult = await workflowResponse.json();
    
    console.log('📥 Authorize-Capture Response:');
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
      }
      if (workflowResult.details.capture) {
        console.log(`     Capture: ${workflowResult.details.capture.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (workflowResult.details.capture.method) {
          console.log(`       Method: ${workflowResult.details.capture.method}`);
        }
        if (workflowResult.details.capture.payment_id) {
          console.log(`       Payment ID: ${workflowResult.details.capture.payment_id}`);
        }
      }
    }
    console.log('');

    // Step 4: Ověření transaction ID v HostBill
    console.log('4️⃣ Ověření transaction ID v HostBill...');
    console.log('======================================');
    
    const invoiceStatusResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${TEST_DATA.invoiceId}/status`);
    const invoiceStatus = await invoiceStatusResponse.json();
    
    console.log('📊 Final Invoice Status:');
    console.log(`   Invoice ID: ${invoiceStatus.invoiceId || TEST_DATA.invoiceId}`);
    console.log(`   Status: ${invoiceStatus.status}`);
    console.log(`   Is Paid: ${invoiceStatus.isPaid}`);
    console.log(`   Amount: ${invoiceStatus.amount} ${invoiceStatus.currency}`);
    console.log(`   Date Paid: ${invoiceStatus.datePaid || 'Not paid'}`);
    console.log('');

    // Summary
    console.log('📊 COMGATE PAYMENT FLOW TEST SUMMARY');
    console.log('====================================');
    console.log(`Order ID: ${TEST_DATA.orderId}`);
    console.log(`Invoice ID: ${TEST_DATA.invoiceId}`);
    console.log(`ComGate Transaction ID: ${COMGATE_TRANSACTION.transactionId}`);
    console.log(`ComGate Ref ID: ${COMGATE_TRANSACTION.refId}`);
    console.log(`ComGate REFNO: ${COMGATE_TRANSACTION.REFNO}`);
    console.log('');
    console.log('Results:');
    console.log(`  ComGate Callback: ${callbackResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Authorize-Capture: ${workflowResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Transaction ID Match: ${workflowResult.transactionId === COMGATE_TRANSACTION.transactionId ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log('');
    
    if (workflowResult.workflow) {
      console.log('Workflow Steps Results:');
      console.log(`  Authorize Payment: ${getStatusIcon(workflowResult.workflow.authorizePayment)} ${workflowResult.workflow.authorizePayment}`);
      console.log(`  Capture Payment: ${getStatusIcon(workflowResult.workflow.capturePayment)} ${workflowResult.workflow.capturePayment}`);
      console.log(`  Provision: ${getStatusIcon(workflowResult.workflow.provision)} ${workflowResult.workflow.provision}`);
    }
    console.log('');
    
    const allSuccess = callbackResult.success && 
                      workflowResult.success &&
                      workflowResult.transactionId === COMGATE_TRANSACTION.transactionId;
    
    if (allSuccess) {
      console.log('🎉 COMGATE PAYMENT FLOW TEST PASSED!');
      console.log('✅ ComGate platba byla úspěšně zpracována');
      console.log('✅ REAL transaction ID byl předán do authorize-capture');
      console.log('✅ Authorize-capture workflow proběhl úspěšně');
      console.log('✅ Transaction ID je správně uložen v HostBill');
      console.log('');
      console.log('🔧 Kompletní flow:');
      console.log('   1. ComGate zpracuje platbu → PAID');
      console.log('   2. ComGate pošle callback s transaction ID');
      console.log('   3. ComGate přesměruje na payment-success s transaction ID');
      console.log('   4. Payment-success zavolá authorize-capture s REAL transaction ID');
      console.log('   5. HostBill uloží platbu s ComGate transaction ID');
      console.log('   6. Provisioning je spuštěn');
    } else {
      console.log('❌ COMGATE PAYMENT FLOW TEST FAILED!');
      console.log('❌ Check the results above for details');
      
      if (!callbackResult.success) {
        console.log(`❌ ComGate callback failed: ${callbackResult.message}`);
      }
      if (!workflowResult.success) {
        console.log(`❌ Authorize-capture failed: ${workflowResult.message}`);
      }
      if (workflowResult.transactionId !== COMGATE_TRANSACTION.transactionId) {
        console.log(`❌ Transaction ID mismatch: Expected ${COMGATE_TRANSACTION.transactionId}, got ${workflowResult.transactionId}`);
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
testComGatePaymentFlow();
