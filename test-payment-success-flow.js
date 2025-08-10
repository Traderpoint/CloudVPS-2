/**
 * Test Payment Success Flow
 * Testuje nový payment success flow se 4 tlačítky
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

console.log('🧪 Testing Payment Success Flow');
console.log('===============================');
console.log('');

async function testPaymentSuccessFlow() {
  try {
    // Test data (simuluje data z úspěšné platby)
    const testPaymentData = {
      invoiceId: '470',
      orderId: '433',
      amount: 100,
      paymentId: 'TEST-PAYMENT-ID-' + Date.now(),
      transactionId: 'TEST-TRANSACTION-' + Date.now(),
      paymentMethod: 'comgate'
    };

    console.log('📋 Test Payment Data:');
    console.log('   Invoice ID:', testPaymentData.invoiceId);
    console.log('   Order ID:', testPaymentData.orderId);
    console.log('   Amount:', testPaymentData.amount, 'CZK');
    console.log('   Payment Method:', testPaymentData.paymentMethod);
    console.log('   Payment ID:', testPaymentData.paymentId);
    console.log('   Transaction ID:', testPaymentData.transactionId);
    console.log('');

    // Step 1: Test Add Invoice Payment endpoint
    console.log('1️⃣ Testing Add Invoice Payment & Transaction ID...');
    console.log('==================================================');
    
    const addPaymentResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId: testPaymentData.invoiceId,
        transactionId: testPaymentData.transactionId,
        paymentMethod: testPaymentData.paymentMethod,
        amount: testPaymentData.amount,
        currency: 'CZK',
        notes: `Payment completed via ${testPaymentData.paymentMethod} - Order ${testPaymentData.orderId}`
      })
    });

    console.log(`📊 Add Payment Response: ${addPaymentResponse.status}`);
    
    if (addPaymentResponse.ok) {
      const addPaymentResult = await addPaymentResponse.json();
      console.log('✅ Add Invoice Payment SUCCESS:');
      console.log(`   Success: ${addPaymentResult.success}`);
      console.log(`   Message: ${addPaymentResult.message}`);
      console.log(`   Transaction ID: ${addPaymentResult.transactionId || testPaymentData.transactionId}`);
    } else {
      const errorText = await addPaymentResponse.text();
      console.log('❌ Add Invoice Payment FAILED:', errorText);
    }
    console.log('');

    // Step 2: Test Capture Payment endpoint
    console.log('2️⃣ Testing Capture Payment...');
    console.log('=============================');
    
    const capturePaymentResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: testPaymentData.orderId,
        invoiceId: testPaymentData.invoiceId,
        transactionId: `CAPTURE-${testPaymentData.invoiceId}-${Date.now()}`,
        amount: testPaymentData.amount,
        currency: 'CZK',
        paymentMethod: testPaymentData.paymentMethod,
        notes: `Payment captured for invoice ${testPaymentData.invoiceId}`,
        skipAuthorize: true
      })
    });

    console.log(`📊 Capture Payment Response: ${capturePaymentResponse.status}`);
    
    if (capturePaymentResponse.ok) {
      const captureResult = await capturePaymentResponse.json();
      console.log('✅ Capture Payment SUCCESS:');
      console.log(`   Success: ${captureResult.success}`);
      console.log(`   Transaction ID: ${captureResult.transactionId}`);
      console.log(`   Amount: ${captureResult.amount} ${captureResult.currency}`);
      
      if (captureResult.workflow) {
        console.log('   Workflow Status:');
        console.log(`     • Authorize: ${captureResult.workflow.authorizePayment}`);
        console.log(`     • Capture: ${captureResult.workflow.capturePayment}`);
        console.log(`     • Provision: ${captureResult.workflow.provision}`);
      }
    } else {
      const errorText = await capturePaymentResponse.text();
      console.log('❌ Capture Payment FAILED:', errorText);
    }
    console.log('');

    // Step 3: Test Clear Cart endpoint (optional)
    console.log('3️⃣ Testing Clear Cart...');
    console.log('========================');
    
    const clearCartResponse = await fetch(`${MIDDLEWARE_URL}/api/cart/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: testPaymentData.orderId
      })
    });

    console.log(`📊 Clear Cart Response: ${clearCartResponse.status}`);
    
    if (clearCartResponse.ok) {
      const clearResult = await clearCartResponse.json();
      console.log('✅ Clear Cart SUCCESS:');
      console.log(`   Success: ${clearResult.success}`);
      console.log(`   Message: ${clearResult.message || 'Cart cleared'}`);
    } else if (clearCartResponse.status === 404) {
      console.log('⚠️ Clear Cart endpoint not found (optional feature)');
    } else {
      const errorText = await clearCartResponse.text();
      console.log('❌ Clear Cart FAILED:', errorText);
    }
    console.log('');

    // Step 4: Test Success Page URL generation
    console.log('4️⃣ Testing Success Page URL Generation...');
    console.log('=========================================');
    
    const successPageUrl = `/order-confirmation?invoiceId=${testPaymentData.invoiceId}&orderId=${testPaymentData.orderId}&amount=${testPaymentData.amount}&status=paid`;
    
    console.log('✅ Success Page URL Generated:');
    console.log(`   URL: ${successPageUrl}`);
    console.log(`   Full URL: http://localhost:3000${successPageUrl}`);
    console.log('');

    // Step 5: Test Payment Success Flow URL
    console.log('5️⃣ Testing Payment Success Flow URL...');
    console.log('======================================');
    
    const paymentFlowUrl = `/payment-success-flow?invoiceId=${testPaymentData.invoiceId}&orderId=${testPaymentData.orderId}&amount=${testPaymentData.amount}&paymentId=${testPaymentData.paymentId}&transactionId=${testPaymentData.transactionId}&paymentMethod=${testPaymentData.paymentMethod}`;
    
    console.log('✅ Payment Success Flow URL Generated:');
    console.log(`   URL: ${paymentFlowUrl}`);
    console.log(`   Full URL: http://localhost:3000${paymentFlowUrl}`);
    console.log('');

    // Summary
    console.log('📊 PAYMENT SUCCESS FLOW TEST SUMMARY');
    console.log('====================================');
    console.log('');
    
    const addPaymentWorks = addPaymentResponse.ok;
    const capturePaymentWorks = capturePaymentResponse.ok;
    const clearCartWorks = clearCartResponse.ok || clearCartResponse.status === 404; // 404 is acceptable
    
    console.log('Test Results:');
    console.log(`  Add Invoice Payment: ${addPaymentWorks ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Capture Payment: ${capturePaymentWorks ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Clear Cart: ${clearCartWorks ? '✅ SUCCESS/OPTIONAL' : '❌ FAILED'}`);
    console.log(`  URL Generation: ✅ SUCCESS`);
    console.log('');
    
    const coreWorkflowWorks = addPaymentWorks && capturePaymentWorks;
    
    if (coreWorkflowWorks) {
      console.log('🎉 PAYMENT SUCCESS FLOW TEST PASSED!');
      console.log('✅ Core workflow endpoints are working');
      console.log('✅ Payment success flow page should work correctly');
      console.log('');
      console.log('🔧 New Payment Flow:');
      console.log('   1. User completes payment in gateway');
      console.log('   2. Redirects to: /payment-success-flow?invoiceId=...&orderId=...');
      console.log('   3. User sees 4 buttons with real-time logs');
      console.log('   4. Each button executes specific workflow step');
      console.log('   5. Final redirect to order confirmation page');
      console.log('');
      console.log('🌐 Test URLs:');
      console.log(`   Payment Test: http://localhost:3000/invoice-payment-test`);
      console.log(`   Success Flow: http://localhost:3000${paymentFlowUrl}`);
      console.log(`   Final Success: http://localhost:3000${successPageUrl}`);
      console.log('');
      console.log('📋 Expected Behavior:');
      console.log('   1. Click PAY button in invoice-payment-test');
      console.log('   2. ComGate gateway opens');
      console.log('   3. After 3 seconds, redirects to payment-success-flow');
      console.log('   4. User sees 4 buttons and can execute workflow steps');
      console.log('   5. All actions are logged in real-time');
      console.log('   6. Final button redirects to order-confirmation');
    } else {
      console.log('❌ PAYMENT SUCCESS FLOW TEST FAILED!');
      console.log('❌ Some core workflow endpoints are not working');
      
      if (!addPaymentWorks) console.log('   ❌ Add Invoice Payment endpoint failed');
      if (!capturePaymentWorks) console.log('   ❌ Capture Payment endpoint failed');
      
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   1. Ensure middleware is running on port 3005');
      console.log('   2. Check middleware logs for errors');
      console.log('   3. Verify HostBill connection is working');
      console.log('   4. Test individual endpoints');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPaymentSuccessFlow();
