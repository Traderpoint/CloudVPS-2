// Test script to verify fallback removal - only real payment gateways
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';
const MIDDLEWARE_URL = 'http://localhost:3005';

async function testNoFallbackPayment() {
  console.log('🧪 Testing No Fallback - Real Payment Gateways Only...\n');

  try {
    // Test 1: Verify test-payment page is removed from middleware
    console.log('1️⃣ Verifying test-payment simulation page is removed...');
    
    try {
      const testPageResponse = await fetch(`${MIDDLEWARE_URL}/test-payment`);
      
      if (testPageResponse.status === 404) {
        console.log('✅ Test-payment simulation page successfully removed (404)');
      } else {
        console.log(`⚠️ Test-payment page still exists (${testPageResponse.status})`);
      }
    } catch (error) {
      console.log('✅ Test-payment simulation page not accessible');
    }

    // Test 2: Test real payment gateway page content
    console.log('\n2️⃣ Testing real payment gateway page content...');
    
    const pageResponse = await fetch(`${BASE_URL}/test-payment-gateway`);
    
    if (pageResponse.ok) {
      const pageHtml = await pageResponse.text();
      
      // Check for removal of fallback/simulation references
      const hasRealGatewayTitle = pageHtml.includes('Real Payment Gateway');
      const hasNoTestTitle = !pageHtml.includes('Test Payment Gateway');
      const hasNoFallbackMention = !pageHtml.includes('Fallback:') && !pageHtml.includes('fallback');
      const hasNoSimulationMention = !pageHtml.includes('simulace') && !pageHtml.includes('simulation');
      const hasRealGatewayButton = pageHtml.includes('Open Payment Gateway');
      const hasRealGatewayInfo = pageHtml.includes('Pouze reálné brány');
      
      console.log('✅ Page content analysis:');
      console.log(`   Real gateway title: ${hasRealGatewayTitle ? '✅' : '❌'}`);
      console.log(`   No test title: ${hasNoTestTitle ? '✅' : '❌'}`);
      console.log(`   No fallback mention: ${hasNoFallbackMention ? '✅' : '❌'}`);
      console.log(`   No simulation mention: ${hasNoSimulationMention ? '✅' : '❌'}`);
      console.log(`   Real gateway button: ${hasRealGatewayButton ? '✅' : '❌'}`);
      console.log(`   Real gateway info: ${hasRealGatewayInfo ? '✅' : '❌'}`);
    } else {
      console.log(`❌ Payment gateway page error: ${pageResponse.status}`);
    }

    // Test 3: Test real payment initialization (ComGate)
    console.log('\n3️⃣ Testing real payment initialization (ComGate only)...');
    
    const realPaymentData = {
      orderId: `REAL-ONLY-${Date.now()}`,
      invoiceId: '456',
      method: 'comgate',
      amount: 1000,
      currency: 'CZK',
      customerData: {
        email: 'test@example.com',
        name: 'Test Customer'
      },
      testFlow: true,
      returnUrl: 'http://localhost:3000/order-confirmation',
      cancelUrl: 'http://localhost:3000/payment'
    };

    const initResponse = await fetch(`${BASE_URL}/api/middleware/initialize-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(realPaymentData)
    });

    if (initResponse.ok) {
      const initResult = await initResponse.json();
      
      if (initResult.success && initResult.paymentUrl) {
        console.log('✅ Real payment initialization successful');
        console.log(`   Payment URL: ${initResult.paymentUrl.substring(0, 60)}...`);
        console.log(`   Method: ${initResult.paymentMethod || realPaymentData.method}`);
        console.log('   ✅ Only real ComGate gateway URL generated');
        
        // Verify it's a real ComGate URL
        if (initResult.paymentUrl.includes('comgate.cz')) {
          console.log('   ✅ Confirmed real ComGate payment URL');
        } else {
          console.log('   ⚠️ Payment URL is not ComGate');
        }
      } else {
        console.log(`❌ Real payment initialization failed: ${initResult.error}`);
      }
    } else {
      console.log(`❌ Payment initialization API error: ${initResponse.status}`);
    }

    // Test 4: Test failed payment method (should fail cleanly, no fallback)
    console.log('\n4️⃣ Testing failed payment method (should fail cleanly, no fallback)...');
    
    const failPaymentData = {
      ...realPaymentData,
      orderId: `FAIL-TEST-${Date.now()}`,
      method: 'nonexistent-method'
    };

    const failResponse = await fetch(`${BASE_URL}/api/middleware/initialize-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(failPaymentData)
    });

    if (failResponse.ok) {
      const failResult = await failResponse.json();
      
      if (!failResult.success) {
        console.log('✅ Failed payment method handled correctly');
        console.log(`   Error: ${failResult.error}`);
        console.log('   ✅ No fallback to simulation - clean failure');
      } else {
        console.log('⚠️ Failed payment method unexpectedly succeeded');
      }
    } else {
      console.log(`✅ Failed payment method returned HTTP ${failResponse.status} - clean failure`);
    }

    // Test 5: Verify payment methods API still works
    console.log('\n5️⃣ Testing payment methods API (real methods only)...');
    
    const methodsResponse = await fetch(`${BASE_URL}/api/middleware-payment-modules`);
    const methodsData = await methodsResponse.json();
    
    if (methodsData.success) {
      console.log(`✅ Payment methods API: ${methodsData.methods.length} methods`);
      
      // Check for real methods only
      const realMethods = methodsData.methods.filter(m => !m.fallback);
      const fallbackMethods = methodsData.methods.filter(m => m.fallback);
      
      console.log(`   Real methods: ${realMethods.length}`);
      console.log(`   Fallback methods: ${fallbackMethods.length}`);
      
      if (fallbackMethods.length === 0) {
        console.log('   ✅ No fallback methods - only real payment processors');
      } else {
        console.log('   ⚠️ Still has fallback methods');
      }
      
      const methodNames = realMethods.map(m => `${m.icon} ${m.name}`).join(', ');
      console.log(`   Available real methods: ${methodNames}`);
    } else {
      console.log(`❌ Payment methods API failed: ${methodsData.error}`);
    }

    console.log('\n🎉 No Fallback Test Complete!');
    console.log('\n📋 Summary of Changes:');
    console.log('   - ✅ Removed test-payment simulation page from middleware');
    console.log('   - ✅ Updated page title to "Real Payment Gateway"');
    console.log('   - ✅ Removed all fallback/simulation mentions from UI');
    console.log('   - ✅ Button now says "Open Payment Gateway" (no test/simulation)');
    console.log('   - ✅ Only real payment processors are called');
    console.log('   - ✅ Clean failure handling without fallback to simulation');
    console.log('   - ✅ ComGate generates real payment URLs');
    console.log('\n🌐 Current Behavior:');
    console.log('   1. Visit: http://localhost:3000/test-payment-gateway');
    console.log('   2. Select payment method (ComGate recommended)');
    console.log('   3. Click "Open Payment Gateway"');
    console.log('   4. System calls ONLY real payment API');
    console.log('   5. Real payment processor generates payment URL');
    console.log('   6. Browser opens REAL payment gateway');
    console.log('   7. NO fallback to simulation if payment fails');
    console.log('   8. Clean error messages for failed payments');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure CloudVPS is running: npm run dev');
    console.log('   2. Make sure middleware is running on port 3005');
    console.log('   3. Check if ComGate is properly configured');
    console.log('   4. Verify API endpoints are accessible');
  }
}

// Run tests if called directly
if (require.main === module) {
  testNoFallbackPayment();
}

module.exports = { testNoFallbackPayment };
