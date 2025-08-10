/**
 * Test script to verify Comgate appears in dropdown menus
 * Tests both middleware-order-test and payment-flow-test
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

async function testComgateInDropdowns() {
  console.log('🧪 === COMGATE DROPDOWN TEST ===\n');

  try {
    // Test 1: Check payment-modules endpoint (used by middleware-order-test)
    console.log('1️⃣ Testing payment-modules endpoint (middleware-order-test)...');
    const modulesResponse = await fetch(`${MIDDLEWARE_URL}/api/payment-modules`);
    const modulesData = await modulesResponse.json();
    
    if (modulesData.success) {
      const comgateModule = modulesData.modules.find(m => m.method === 'comgate');
      if (comgateModule) {
        console.log('✅ Comgate found in payment-modules:', comgateModule.name);
        console.log(`   Icon: ${comgateModule.icon}, Type: ${comgateModule.type}`);
      } else {
        console.log('❌ Comgate NOT found in payment-modules');
        console.log('   Available modules:', modulesData.modules.map(m => m.method).join(', '));
      }
    } else {
      console.log('❌ Failed to get payment-modules:', modulesData.error);
    }

    // Test 2: Check payments/methods endpoint (used by payment-flow-test)
    console.log('\n2️⃣ Testing payments/methods endpoint (payment-flow-test)...');
    const methodsResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/methods`);
    const methodsData = await methodsResponse.json();
    
    if (methodsData.success) {
      const comgateMethod = methodsData.methods.find(m => m.method === 'comgate');
      if (comgateMethod) {
        console.log('✅ Comgate found in payments/methods:', comgateMethod.name);
        console.log(`   ID: ${comgateMethod.id}, Type: ${comgateMethod.type}`);
      } else {
        console.log('❌ Comgate NOT found in payments/methods');
        console.log('   Available methods:', methodsData.methods.map(m => m.method).join(', '));
      }
    } else {
      console.log('❌ Failed to get payments/methods:', methodsData.error);
    }

    // Test 3: Test Comgate payment initialization
    console.log('\n3️⃣ Testing Comgate payment initialization...');
    const paymentData = {
      orderId: 'TEST-' + Date.now(),
      invoiceId: 'INV-' + Date.now(),
      method: 'comgate',
      amount: 690,
      currency: 'CZK'
    };

    try {
      const paymentResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const paymentResult = await paymentResponse.json();
      
      if (paymentResult.success) {
        console.log('✅ Comgate payment initialization successful');
        console.log(`   Transaction ID: ${paymentResult.transactionId}`);
        console.log(`   Payment URL: ${paymentResult.paymentUrl}`);
        console.log(`   Redirect required: ${paymentResult.redirectRequired}`);
      } else {
        console.log('❌ Comgate payment initialization failed:', paymentResult.error);
      }
    } catch (error) {
      console.log('❌ Comgate payment initialization error:', error.message);
    }

    console.log('\n🎯 === DROPDOWN TEST SUMMARY ===');
    console.log('✅ Comgate should now be visible in both test portals:');
    console.log('   • http://localhost:3000/middleware-order-test');
    console.log('   • http://localhost:3000/payment-flow-test');
    console.log('\n📋 Steps to test in browser:');
    console.log('1. Open middleware-order-test');
    console.log('2. Look for "🌐 Comgate Payments (comgate)" in Payment Method dropdown');
    console.log('3. Open payment-flow-test');
    console.log('4. Look for "🌐 Comgate Payments" in payment method selection');
    console.log('5. Create test order and select Comgate as payment method');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testComgateInDropdowns();
}

module.exports = { testComgateInDropdowns };
