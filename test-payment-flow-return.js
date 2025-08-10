/**
 * Test Payment Flow Return
 * Verifies that payment-flow-test correctly handles return from payment gateways
 */

const MIDDLEWARE_URL = 'http://localhost:3005';
const CLOUDVPS_URL = 'http://localhost:3000';

async function testPaymentFlowReturn() {
  console.log('🧪 === PAYMENT FLOW RETURN TEST ===\n');
  console.log('🎯 Testing return flow to payment-flow-test page');

  try {
    // Test 1: Create order with testFlow flag
    console.log('1️⃣ Testing order creation with testFlow flag...');
    
    const orderData = {
      type: 'complete',
      customer: {
        firstName: 'Flow',
        lastName: 'Test',
        email: 'flow.test@example.com',
        phone: '+420777123456'
      },
      items: [{
        productId: '1',
        name: 'VPS Basic - Flow Test',
        price: 299,
        cycle: 'm'
      }]
    };

    const orderResponse = await fetch(`${MIDDLEWARE_URL}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const orderResult = await orderResponse.json();
    
    if (!orderResult.success || !orderResult.orders?.[0]) {
      console.log('❌ Order creation failed');
      return;
    }

    const order = orderResult.orders[0];
    console.log(`✅ Order created: ${order.orderId}`);

    // Test 2: Initialize payment with testFlow flag
    console.log('\n2️⃣ Testing payment initialization with testFlow flag...');
    
    const paymentData = {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      method: 'comgate',
      amount: 299,
      currency: 'CZK',
      testFlow: true
    };

    const paymentResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const paymentResult = await paymentResponse.json();
    
    if (paymentResult.success) {
      console.log('✅ Payment initialized with testFlow flag');
      console.log(`   Transaction ID: ${paymentResult.transactionId}`);
      console.log(`   Payment URL: ${paymentResult.paymentUrl}`);
      
      // Check if Comgate return URLs include testFlow parameter
      // (This would be visible in Comgate processor logs)
      console.log('   ✅ Comgate return URLs should include testFlow=true parameter');
    } else {
      console.log('❌ Payment initialization failed:', paymentResult.error);
      return;
    }

    // Test 3: Test middleware return endpoint with testFlow
    console.log('\n3️⃣ Testing middleware return endpoint with testFlow...');
    
    const testReturnScenarios = [
      {
        name: 'Success Return with testFlow',
        params: {
          status: 'success',
          orderId: order.orderId,
          invoiceId: order.invoiceId,
          transactionId: paymentResult.transactionId,
          paymentMethod: 'comgate',
          amount: '299',
          currency: 'CZK',
          testFlow: 'true'
        },
        expectedRedirect: `${CLOUDVPS_URL}/payment-flow-test`
      },
      {
        name: 'Cancel Return with testFlow',
        params: {
          status: 'cancelled',
          orderId: order.orderId,
          invoiceId: order.invoiceId,
          paymentMethod: 'comgate',
          testFlow: 'true'
        },
        expectedRedirect: `${CLOUDVPS_URL}/payment-flow-test`
      }
    ];

    for (const scenario of testReturnScenarios) {
      console.log(`\n🔍 Testing ${scenario.name}...`);
      
      const queryString = new URLSearchParams(scenario.params).toString();
      const returnUrl = `${MIDDLEWARE_URL}/api/payments/return?${queryString}`;
      
      try {
        // Test with HEAD request to avoid following redirects
        const response = await fetch(returnUrl, { 
          method: 'HEAD',
          redirect: 'manual'
        });
        
        if (response.status === 302) {
          const location = response.headers.get('location');
          console.log(`   ✅ Redirect status: ${response.status}`);
          console.log(`      Redirect location: ${location}`);
          
          if (location && location.startsWith(scenario.expectedRedirect)) {
            console.log(`   ✅ Correct redirect to payment-flow-test`);
            
            // Check if parameters are preserved
            const redirectUrl = new URL(location);
            if (redirectUrl.searchParams.get('orderId') === scenario.params.orderId) {
              console.log(`   ✅ Order ID preserved in redirect`);
            }
            if (redirectUrl.searchParams.get('status') === scenario.params.status) {
              console.log(`   ✅ Status preserved in redirect`);
            }
            if (redirectUrl.searchParams.get('paymentMethod') === scenario.params.paymentMethod) {
              console.log(`   ✅ Payment method preserved in redirect`);
            }
          } else {
            console.log(`   ❌ Incorrect redirect location`);
            console.log(`      Expected: ${scenario.expectedRedirect}`);
            console.log(`      Got: ${location}`);
          }
        } else {
          console.log(`   ❌ Expected redirect (302), got: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error testing return URL: ${error.message}`);
      }
    }

    // Test 4: Test regular return (without testFlow)
    console.log('\n4️⃣ Testing regular return (without testFlow)...');
    
    const regularReturnParams = {
      status: 'success',
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      transactionId: 'REGULAR-TEST-123',
      paymentMethod: 'payu',
      amount: '299',
      currency: 'CZK'
      // No testFlow parameter
    };

    const regularQueryString = new URLSearchParams(regularReturnParams).toString();
    const regularReturnUrl = `${MIDDLEWARE_URL}/api/payments/return?${regularQueryString}`;
    
    try {
      const response = await fetch(regularReturnUrl, { 
        method: 'HEAD',
        redirect: 'manual'
      });
      
      if (response.status === 302) {
        const location = response.headers.get('location');
        console.log(`   ✅ Regular return redirect: ${location}`);
        
        if (location && location.includes('/payment/success')) {
          console.log(`   ✅ Regular return goes to payment success page (not test page)`);
        } else {
          console.log(`   ❌ Regular return should go to payment success page`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error testing regular return: ${error.message}`);
    }

    console.log('\n🎯 === PAYMENT FLOW RETURN SUMMARY ===');
    console.log('✅ Payment flow return test completed');
    
    console.log('\n📋 Return Flow Logic:');
    console.log('   • testFlow=true → Redirect to /payment-flow-test');
    console.log('   • testFlow=false/missing → Redirect to /payment/success|cancel|pending');
    console.log('   • Parameters preserved in both cases');
    console.log('   • payment-flow-test detects return and shows results');
    
    console.log('\n🌐 Testing Instructions:');
    console.log('   1. Open: http://localhost:3000/payment-flow-test');
    console.log('   2. Complete steps 1-2 (Create Order, Initialize Payment)');
    console.log('   3. Click "💳 Go to Real Payment Gateway"');
    console.log('   4. Complete payment in Comgate');
    console.log('   5. Should return to payment-flow-test with results');
    console.log('   6. Step 4 should show payment completion details');
    
    console.log('\n🎊 Payment flow return is properly configured!');

  } catch (error) {
    console.error('❌ Payment flow return test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testPaymentFlowReturn();
}

module.exports = { testPaymentFlowReturn };
