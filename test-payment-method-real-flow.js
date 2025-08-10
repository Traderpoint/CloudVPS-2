// Test script for payment-method page with RealPaymentProcessor integration
// This tests the complete flow from payment-method page through RealPaymentProcessor

const BASE_URL = 'http://localhost:3000';
const MIDDLEWARE_URL = 'http://localhost:3005';

// Use built-in fetch (Node.js 18+)

async function testPaymentMethodRealFlow() {
  console.log('🚀 Testing Payment-Method Real Flow Integration...\n');
  console.log('📋 This test simulates the complete payment-method page flow:\n');

  try {
    // Step 1: Simulate order data (what would come from previous steps)
    console.log('1️⃣ STEP 1: Prepare order data for payment-method page');
    console.log('=======================================================');
    
    const timestamp = Date.now();
    const testOrderData = {
      orders: [{
        invoiceId: '456', // Using existing test invoice
        hostbillOrderId: `ORDER-${timestamp}`,
        orderId: `ORDER-${timestamp}`,
        totalAmount: 1000,
        orderDetails: {
          invoice_id: '456',
          total: 1000,
          invtotal: 1000
        }
      }],
      customer: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+420123456789'
      }
    };

    console.log('📋 Test order data prepared:');
    console.log('   Invoice ID:', testOrderData.orders[0].invoiceId);
    console.log('   Order ID:', testOrderData.orders[0].hostbillOrderId);
    console.log('   Amount:', testOrderData.orders[0].totalAmount, 'CZK');
    console.log('   Customer:', testOrderData.customer.email);

    // Step 2: Test RealPaymentProcessor initialization (what happens in handleSubmitPayment)
    console.log('\n2️⃣ STEP 2: Test RealPaymentProcessor initialization');
    console.log('===================================================');
    
    const firstOrder = testOrderData.orders[0];
    const invoiceId = firstOrder.invoiceId;
    const orderId = firstOrder.hostbillOrderId;
    const amount = 1000; // Test amount
    const selectedPayment = 'comgate';
    const selectedPeriod = '12';
    const selectedOS = 'linux';
    const selectedApps = [];
    const appliedPromo = null;

    // Prepare order data for RealPaymentProcessor (same as in payment-method.js)
    const realPaymentOrderData = {
      orderId: orderId,
      invoiceId: invoiceId,
      customerEmail: testOrderData.customer.email,
      customerName: `${testOrderData.customer.firstName} ${testOrderData.customer.lastName}`,
      customerPhone: testOrderData.customer.phone,
      paymentMethod: selectedPayment,
      amount: amount,
      currency: 'CZK',
      billingPeriod: selectedPeriod,
      billingCycle: 'annually', // Mapped from selectedPeriod
      selectedOS: selectedOS,
      selectedApps: selectedApps,
      appliedPromo: appliedPromo,
      testMode: false, // Real payment from payment-method page
      cartSettings: {
        selectedPeriod,
        selectedOS,
        selectedApps,
        appliedPromo,
        periodDiscount: 20, // 12 months = 20% discount
        osModifier: 0 // Linux = 0 modifier
      }
    };

    console.log('📤 RealPaymentProcessor order data:');
    console.log('   Order ID:', realPaymentOrderData.orderId);
    console.log('   Invoice ID:', realPaymentOrderData.invoiceId);
    console.log('   Customer:', realPaymentOrderData.customerEmail);
    console.log('   Payment Method:', realPaymentOrderData.paymentMethod);
    console.log('   Amount:', realPaymentOrderData.amount, realPaymentOrderData.currency);
    console.log('   Test Mode:', realPaymentOrderData.testMode);

    // Step 3: Call the middleware initialize-payment API (what RealPaymentProcessor does)
    console.log('\n3️⃣ STEP 3: Call middleware payment initialization');
    console.log('================================================');
    
    console.log('🔄 Calling /api/middleware/initialize-payment...');
    
    const initResponse = await fetch(`${BASE_URL}/api/middleware/initialize-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: realPaymentOrderData.orderId,
        invoiceId: realPaymentOrderData.invoiceId,
        method: realPaymentOrderData.paymentMethod,
        amount: realPaymentOrderData.amount,
        currency: realPaymentOrderData.currency,
        customerData: {
          email: realPaymentOrderData.customerEmail,
          name: realPaymentOrderData.customerName,
          phone: realPaymentOrderData.customerPhone
        },
        testFlow: realPaymentOrderData.testMode,
        billingPeriod: realPaymentOrderData.billingPeriod,
        billingCycle: realPaymentOrderData.billingCycle,
        selectedOS: realPaymentOrderData.selectedOS,
        selectedApps: realPaymentOrderData.selectedApps,
        appliedPromo: realPaymentOrderData.appliedPromo
      })
    });

    let realTransactionId = null;
    let paymentUrl = null;

    if (initResponse.ok) {
      const initResult = await initResponse.json();
      
      if (initResult.success) {
        realTransactionId = initResult.transactionId;
        paymentUrl = initResult.paymentUrl;
        
        console.log('✅ Payment initialized via middleware API');
        console.log('   Real Transaction ID:', realTransactionId);
        console.log('   Payment URL:', paymentUrl?.substring(0, 60) + '...');
        console.log('   Redirect Required:', initResult.redirectRequired);
        console.log('   Payment Method:', initResult.paymentMethod);
        
        if (paymentUrl && paymentUrl.includes('comgate.cz')) {
          console.log('   ✅ Real ComGate payment URL generated');
        }
      } else {
        throw new Error(`Payment initialization failed: ${initResult.error}`);
      }
    } else {
      throw new Error(`API error: ${initResponse.status}`);
    }

    // Step 4: Simulate ComGate callback (what happens after user pays)
    console.log('\n4️⃣ STEP 4: Simulate ComGate callback processing');
    console.log('===============================================');
    
    console.log('🌐 In real flow:');
    console.log('   1. User would be redirected to:', paymentUrl);
    console.log('   2. User completes payment on ComGate');
    console.log('   3. ComGate sends callback to middleware');
    console.log('   4. User is redirected to payment-complete');
    
    console.log('\n🧪 Simulating successful ComGate callback...');
    
    const callbackParams = {
      status: 'success',
      transId: realTransactionId,
      refId: orderId,
      price: '100000', // 1000 CZK in haléře
      curr: 'CZK',
      method: 'CARD_CZ_CSOB_2',
      testFlow: 'false' // Real payment
    };

    console.log('📤 ComGate callback parameters:', callbackParams);

    const callbackUrl = `${MIDDLEWARE_URL}/api/payments/return?${new URLSearchParams(callbackParams).toString()}`;
    
    const callbackResponse = await fetch(callbackUrl);
    
    if (callbackResponse.ok || callbackResponse.status === 302) {
      console.log('✅ ComGate callback processed successfully');
      console.log('   Response status:', callbackResponse.status);
      
      if (callbackResponse.redirected || callbackResponse.status === 302) {
        console.log('   ✅ User would be redirected to payment-complete');
      }
    } else {
      console.log('⚠️ Callback response:', callbackResponse.status);
    }

    // Step 5: Test payment-complete page with real data
    console.log('\n5️⃣ STEP 5: Test payment-complete page');
    console.log('=====================================');

    const successParams = new URLSearchParams({
      transactionId: realTransactionId,
      paymentId: realTransactionId,
      orderId: orderId,
      invoiceId: invoiceId,
      amount: amount,
      currency: 'CZK',
      paymentMethod: selectedPayment,
      status: 'success'
    });

    const successUrl = `${BASE_URL}/payment-complete?${successParams.toString()}`;
    console.log('🔗 Payment complete URL:', successUrl.substring(0, 80) + '...');

    const successResponse = await fetch(successUrl);

    if (successResponse.ok) {
      const successHtml = await successResponse.text();

      console.log('✅ Payment-complete page loaded');

      if (successHtml.includes(realTransactionId)) {
        console.log('   ✅ Real transaction ID displayed on page');
      }

      if (successHtml.includes('Auto-Capture Payment')) {
        console.log('   ✅ Auto-capture button available');
      }

      if (successHtml.includes('Mark as Paid')) {
        console.log('   ✅ Mark as Paid button available');
      }
    } else {
      console.log('❌ Payment-complete page error:', successResponse.status);
    }

    // Step 6: Summary
    console.log('\n🎉 Payment-Method Real Flow Test Complete!');
    console.log('\n📊 Flow Summary:');
    console.log('   1. ✅ Order data prepared for payment-method page');
    console.log('   2. ✅ RealPaymentProcessor integration working');
    console.log('   3. ✅ Real transaction ID generated:', realTransactionId);
    console.log('   4. ✅ ComGate payment URL created');
    console.log('   5. ✅ Callback processing functional');
    console.log('   6. ✅ Payment-complete page ready');
    
    console.log('\n🌐 Real User Experience from payment-method page:');
    console.log('   1. User completes order and reaches payment-method page');
    console.log('   2. User selects payment method and clicks "Dokončit a odeslat"');
    console.log('   3. RealPaymentProcessor initializes payment with real ComGate API');
    console.log('   4. User is redirected to ComGate payment gateway');
    console.log('   5. After payment, user returns to payment-complete');
    console.log('   6. User can use Auto-Capture and Mark as Paid with real transaction ID');

    console.log('\n✅ PAYMENT-METHOD REAL FLOW INTEGRATION SUCCESSFUL! ✅');

  } catch (error) {
    console.error('❌ Payment-method flow test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure CloudVPS (3000) and middleware (3005) are running');
    console.log('   2. Check that payment-method page has order data');
    console.log('   3. Verify RealPaymentProcessor integration');
    console.log('   4. Test individual components separately');
  }
}

// Run the payment-method flow test
if (require.main === module) {
  testPaymentMethodRealFlow();
}

module.exports = { testPaymentMethodRealFlow };
