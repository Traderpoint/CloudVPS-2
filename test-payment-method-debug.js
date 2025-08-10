// Test payment-method.js real flow with detailed debugging
// This test simulates exactly what happens when user clicks "Dokončit a odeslat"

const BASE_URL = 'http://localhost:3000';
const MIDDLEWARE_URL = 'http://localhost:3005';

async function testPaymentMethodDebug() {
  console.log('🔍 Testing Payment-Method Real Flow with Debug...\n');

  try {
    // Step 1: Create test order (simulate billing page)
    console.log('1️⃣ STEP 1: Create test order (simulate billing page)');
    console.log('===================================================');
    
    const testOrderData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+420123456789',
      address: 'Test Street 123',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ',
      items: [
        {
          id: 'vps-start',
          name: 'VPS Start',
          price: 604,
          quantity: 1,
          billingPeriod: 12
        }
      ]
    };

    console.log('🔄 Creating test order...');
    
    const orderResponse = await fetch(`${MIDDLEWARE_URL}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData)
    });

    if (!orderResponse.ok) {
      throw new Error(`Order creation failed: ${orderResponse.status}`);
    }

    const orderResult = await orderResponse.json();
    
    if (!orderResult.success) {
      throw new Error(`Order creation failed: ${orderResult.error}`);
    }

    console.log('✅ Order created successfully');
    const firstOrder = orderResult.orders[0];
    console.log('   Order ID:', firstOrder.order_id);
    console.log('   Invoice ID:', firstOrder.invoice_id);

    // Step 2: Test RealPaymentProcessor flow (simulate payment-method.js)
    console.log('\n2️⃣ STEP 2: Test RealPaymentProcessor flow');
    console.log('==========================================');
    
    // Simulate exactly what payment-method.js does
    const realPaymentOrderData = {
      orderId: firstOrder.order_id,
      invoiceId: firstOrder.invoice_id,
      customerEmail: testOrderData.email,
      customerName: `${testOrderData.firstName} ${testOrderData.lastName}`,
      customerPhone: testOrderData.phone,
      paymentMethod: 'comgate',
      amount: 604,
      currency: 'CZK',
      billingPeriod: 12,
      billingCycle: 'annually',
      selectedOS: 'linux',
      selectedApps: [],
      appliedPromo: null,
      testMode: false // This is REAL payment, not test
    };

    console.log('💳 Calling RealPaymentProcessor API...');
    console.log('📋 Payment data:', realPaymentOrderData);

    const paymentResponse = await fetch(`${BASE_URL}/api/middleware/initialize-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(realPaymentOrderData)
    });

    if (!paymentResponse.ok) {
      throw new Error(`Payment initialization failed: ${paymentResponse.status}`);
    }

    const paymentResult = await paymentResponse.json();
    
    console.log('📤 Payment API response:', paymentResult);

    if (paymentResult.success) {
      console.log('✅ Payment initialized successfully');
      console.log('   Transaction ID:', paymentResult.transactionId);
      console.log('   Payment ID:', paymentResult.paymentId);
      console.log('   Payment URL:', paymentResult.paymentUrl?.substring(0, 60) + '...');
      console.log('   Redirect Required:', paymentResult.redirectRequired);
      
      // Check if transaction ID is real or mock
      if (paymentResult.transactionId) {
        if (paymentResult.transactionId.startsWith('MOCK-')) {
          console.log('   ⚠️ WARNING: Mock transaction ID detected!');
          console.log('   🔍 This means ComGate is in mock mode');
        } else {
          console.log('   ✅ Real ComGate transaction ID detected');
        }
      } else {
        console.log('   ❌ No transaction ID in response');
      }

      // Step 3: Test middleware environment variables
      console.log('\n3️⃣ STEP 3: Test middleware environment variables');
      console.log('===============================================');
      
      const envResponse = await fetch(`${MIDDLEWARE_URL}/api/debug/env`, {
        method: 'GET'
      });

      if (envResponse.ok) {
        const envData = await envResponse.json();
        console.log('✅ Middleware environment variables:');
        console.log('   COMGATE_MERCHANT_ID:', envData.COMGATE_MERCHANT_ID ? 'SET' : 'NOT SET');
        console.log('   COMGATE_SECRET:', envData.COMGATE_SECRET ? 'SET' : 'NOT SET');
        console.log('   COMGATE_TEST_MODE:', envData.COMGATE_TEST_MODE);
        console.log('   COMGATE_MOCK_MODE:', envData.COMGATE_MOCK_MODE);
      } else {
        console.log('⚠️ Could not fetch environment variables');
      }

      // Step 4: Simulate ComGate callback (if real transaction ID)
      if (paymentResult.transactionId && !paymentResult.transactionId.startsWith('MOCK-')) {
        console.log('\n4️⃣ STEP 4: Simulate ComGate callback');
        console.log('===================================');
        
        const callbackParams = {
          status: 'success',
          transId: paymentResult.transactionId,
          refId: realPaymentOrderData.orderId,
          price: (realPaymentOrderData.amount * 100).toString(), // ComGate uses cents
          curr: 'CZK',
          method: 'CARD_CZ_CSOB_2',
          testFlow: 'false'
        };

        console.log('🔄 Simulating ComGate callback...');
        console.log('📋 Callback parameters:', callbackParams);

        const callbackResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/return`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(callbackParams).toString()
        });

        if (callbackResponse.ok) {
          console.log('✅ ComGate callback processed successfully');
          console.log('   Response status:', callbackResponse.status);
          
          // Check if user would be redirected to payment-complete
          const redirectUrl = callbackResponse.headers.get('location');
          if (redirectUrl) {
            console.log('   Redirect URL:', redirectUrl);
            
            if (redirectUrl.includes('payment-complete')) {
              console.log('   ✅ User would be redirected to payment-complete');
              
              // Extract transaction ID from redirect URL
              const urlParams = new URLSearchParams(redirectUrl.split('?')[1]);
              const redirectTransactionId = urlParams.get('transactionId');
              
              if (redirectTransactionId) {
                console.log('   ✅ Transaction ID in redirect URL:', redirectTransactionId);
                
                if (redirectTransactionId === paymentResult.transactionId) {
                  console.log('   ✅ Transaction ID matches original');
                } else {
                  console.log('   ⚠️ Transaction ID mismatch!');
                  console.log('      Original:', paymentResult.transactionId);
                  console.log('      Redirect:', redirectTransactionId);
                }
              } else {
                console.log('   ❌ No transaction ID in redirect URL');
              }
            } else {
              console.log('   ⚠️ User would NOT be redirected to payment-complete');
            }
          } else {
            console.log('   ⚠️ No redirect URL in response');
          }
        } else {
          console.log('❌ ComGate callback failed:', callbackResponse.status);
        }
      }

      // Step 5: Test payment-complete page
      console.log('\n5️⃣ STEP 5: Test payment-complete page');
      console.log('====================================');
      
      if (paymentResult.transactionId) {
        const completeUrl = `${BASE_URL}/payment-complete?transactionId=${paymentResult.transactionId}&paymentId=${paymentResult.paymentId}&orderId=${realPaymentOrderData.orderId}&invoiceId=${realPaymentOrderData.invoiceId}&amount=${realPaymentOrderData.amount}&currency=CZK&paymentMethod=comgate&status=success`;
        
        console.log('🔗 Payment complete URL:', completeUrl);
        
        const completeResponse = await fetch(completeUrl);
        
        if (completeResponse.ok) {
          const completeHtml = await completeResponse.text();
          
          console.log('✅ Payment complete page loaded');
          
          if (completeHtml.includes(paymentResult.transactionId)) {
            console.log('   ✅ Transaction ID found in HTML');
          } else {
            console.log('   ❌ Transaction ID NOT found in HTML');
            console.log('   🔍 This indicates client-side rendering issue');
          }
        } else {
          console.log('❌ Payment complete page error:', completeResponse.status);
        }
      }

    } else {
      console.log('❌ Payment initialization failed:', paymentResult.error);
    }

    // Step 6: Summary and recommendations
    console.log('\n🎯 SUMMARY AND ANALYSIS');
    console.log('========================');
    
    console.log('\n📊 Flow Analysis:');
    console.log('   1. Order Creation: ✅ Working');
    console.log('   2. Payment Initialization: ' + (paymentResult.success ? '✅ Working' : '❌ Failed'));
    console.log('   3. Transaction ID Type: ' + (paymentResult.transactionId?.startsWith('MOCK-') ? '⚠️ Mock' : '✅ Real'));
    console.log('   4. ComGate Integration: ' + (paymentResult.transactionId?.startsWith('MOCK-') ? '❌ Mock Mode' : '✅ Real Mode'));
    
    console.log('\n🔍 Root Cause Analysis:');
    if (paymentResult.transactionId?.startsWith('MOCK-')) {
      console.log('   ❌ ComGate is in MOCK MODE');
      console.log('   🔧 Solution: Check middleware environment variables');
      console.log('   📋 Verify: COMGATE_MERCHANT_ID and COMGATE_SECRET are loaded');
      console.log('   🔄 Action: Restart middleware with proper .env loading');
    } else {
      console.log('   ✅ ComGate is in REAL MODE');
      console.log('   🔍 Issue: Client-side rendering problem on payment-complete page');
      console.log('   🔧 Solution: Fix useEffect dependency in payment-complete.js');
    }
    
    console.log('\n✅ DEBUG TEST COMPLETE!');

  } catch (error) {
    console.error('❌ Payment-method debug test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure both servers are running (CloudVPS:3000, Middleware:3005)');
    console.log('   2. Check middleware .env file is loaded correctly');
    console.log('   3. Verify ComGate credentials are set');
    console.log('   4. Test with browser dev tools open');
  }
}

// Run the debug test
if (require.main === module) {
  testPaymentMethodDebug();
}

module.exports = { testPaymentMethodDebug };
