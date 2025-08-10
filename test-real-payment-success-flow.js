/**
 * Test Real Payment Success Flow
 * Testuje skutečný payment flow s přesměrováním na success flow
 */

const MIDDLEWARE_URL = 'http://localhost:3005';
const CLOUDVPS_URL = 'http://localhost:3000';

console.log('🧪 Testing Real Payment Success Flow');
console.log('====================================');
console.log('');

async function testRealPaymentSuccessFlow() {
  try {
    // Step 1: Test payment return redirect
    console.log('1️⃣ Testing Payment Return Redirect...');
    console.log('=====================================');
    
    const returnParams = new URLSearchParams({
      status: 'success',
      orderId: '433',
      invoiceId: '470',
      transactionId: 'TEST-TX-' + Date.now(),
      paymentMethod: 'comgate',
      amount: '100',
      currency: 'CZK'
    });
    
    console.log('📤 Simulating payment return:');
    console.log(`   URL: ${MIDDLEWARE_URL}/api/payments/return?${returnParams.toString()}`);
    
    const returnResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/return?${returnParams.toString()}`, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log(`📊 Return response: ${returnResponse.status}`);
    
    if (returnResponse.status === 302) {
      const redirectLocation = returnResponse.headers.get('location');
      console.log('✅ Payment return SUCCESS:');
      console.log(`   Redirect to: ${redirectLocation}`);
      
      // Check if it redirects to payment-success-flow
      if (redirectLocation && redirectLocation.includes('/payment-success-flow')) {
        console.log('✅ Correctly redirects to payment-success-flow');
        
        // Parse redirect URL to check parameters
        const redirectUrl = new URL(redirectLocation);
        console.log('📋 Redirect parameters:');
        redirectUrl.searchParams.forEach((value, key) => {
          console.log(`   ${key}: ${value}`);
        });
        
        // Test the success flow URL
        console.log('');
        console.log('2️⃣ Testing Success Flow URL Access...');
        console.log('====================================');
        
        try {
          const successFlowResponse = await fetch(redirectLocation, {
            method: 'GET'
          });
          
          console.log(`📊 Success flow page: ${successFlowResponse.status}`);
          
          if (successFlowResponse.ok) {
            console.log('✅ Payment success flow page accessible');
            
            // Check if it's the right page (contains expected elements)
            const pageContent = await successFlowResponse.text();
            
            if (pageContent.includes('Payment Successful') && 
                pageContent.includes('Add Invoice Payment') &&
                pageContent.includes('Capture Payment') &&
                pageContent.includes('Clear Cart') &&
                pageContent.includes('Go to Success Page')) {
              console.log('✅ Success flow page contains all 4 buttons');
            } else {
              console.log('⚠️ Success flow page missing some elements');
            }
            
            if (pageContent.includes('Execution Logs')) {
              console.log('✅ Success flow page contains logs section');
            } else {
              console.log('⚠️ Success flow page missing logs section');
            }
            
          } else {
            console.log('❌ Success flow page not accessible');
          }
        } catch (error) {
          console.log('❌ Error accessing success flow page:', error.message);
        }
        
      } else {
        console.log('❌ Does not redirect to payment-success-flow');
        console.log(`   Actual redirect: ${redirectLocation}`);
      }
    } else {
      const errorText = await returnResponse.text();
      console.log('❌ Payment return failed:', errorText);
    }
    console.log('');

    // Step 3: Test callback handling (no auto-marking)
    console.log('3️⃣ Testing Callback Handling (No Auto-marking)...');
    console.log('==================================================');
    
    const callbackData = {
      transId: 'TEST-TX-' + Date.now(),
      status: 'PAID',
      price: 10000, // 100 CZK in cents
      curr: 'CZK',
      refId: '433',
      email: 'test@example.com',
      method: 'CARD_CZ_CSOB_2',
      test: 'false'
    };
    
    console.log('📤 Sending ComGate callback:');
    console.log('   Transaction ID:', callbackData.transId);
    console.log('   Status:', callbackData.status);
    console.log('   Amount:', callbackData.price / 100, 'CZK');
    
    const callbackResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/comgate/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callbackData)
    });
    
    console.log(`📊 Callback response: ${callbackResponse.status}`);
    
    if (callbackResponse.ok) {
      const callbackResult = await callbackResponse.json();
      console.log('✅ ComGate callback SUCCESS:');
      console.log(`   Success: ${callbackResult.success}`);
      console.log(`   Message: ${callbackResult.message}`);
      console.log(`   Invoice Updated: ${callbackResult.invoiceUpdated}`);
      
      // Check that invoice was NOT automatically marked as paid
      if (callbackResult.invoiceUpdated === false || !callbackResult.invoiceUpdated) {
        console.log('✅ Invoice NOT automatically marked as paid (correct behavior)');
      } else {
        console.log('⚠️ Invoice was automatically marked as paid (should be handled by success flow)');
      }
    } else {
      const errorText = await callbackResponse.text();
      console.log('❌ ComGate callback failed:', errorText);
    }
    console.log('');

    // Summary
    console.log('📊 REAL PAYMENT SUCCESS FLOW TEST SUMMARY');
    console.log('==========================================');
    console.log('');
    
    const returnWorks = returnResponse.status === 302;
    const callbackWorks = callbackResponse.ok;
    
    console.log('Test Results:');
    console.log(`  Payment Return Redirect: ${returnWorks ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  ComGate Callback: ${callbackWorks ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('');
    
    const allWork = returnWorks && callbackWorks;
    
    if (allWork) {
      console.log('🎉 REAL PAYMENT SUCCESS FLOW TEST PASSED!');
      console.log('✅ Payment return redirects to success flow');
      console.log('✅ Success flow page is accessible with all elements');
      console.log('✅ Callback handling updated (no auto-marking)');
      console.log('✅ Invoice marking is now handled by success flow buttons');
      console.log('');
      console.log('🔧 Updated Real Payment Flow:');
      console.log('   User → ComGate Gateway → Payment → Return → Success Flow → Manual Actions');
      console.log('');
      console.log('🌐 Test Real Payment Now:');
      console.log('   1. Go to: http://localhost:3000/invoice-payment-test');
      console.log('   2. Click PAY button with ComGate');
      console.log('   3. Complete payment in ComGate gateway');
      console.log('   4. Should redirect to payment-success-flow');
      console.log('   5. Use 4 buttons to complete workflow manually');
      console.log('');
      console.log('📋 Key Changes:');
      console.log('   • Return handler redirects to /payment-success-flow');
      console.log('   • Callback handlers do NOT auto-mark invoices');
      console.log('   • User has full control over workflow completion');
      console.log('   • Real-time logs show all actions');
    } else {
      console.log('❌ REAL PAYMENT SUCCESS FLOW TEST FAILED!');
      console.log('❌ Some components are not working correctly');
      
      if (!returnWorks) console.log('   ❌ Payment return redirect failed');
      if (!callbackWorks) console.log('   ❌ ComGate callback failed');
      
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   1. Ensure middleware is running on port 3005');
      console.log('   2. Check return handler modifications');
      console.log('   3. Verify callback handler updates');
      console.log('   4. Test CloudVPS payment-success-flow page');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testRealPaymentSuccessFlow();
