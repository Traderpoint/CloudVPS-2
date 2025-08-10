/**
 * Real Comgate Payment Test
 * Tests Comgate with real API calls (no mock mode)
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

async function testRealComgatePayment() {
  console.log('🚀 === REAL COMGATE PAYMENT TEST ===\n');
  console.log('⚠️  Mock mode disabled - using real Comgate API');
  console.log('📋 Credentials: Merchant 498008, Test Mode: true\n');

  try {
    // Step 1: Test Comgate configuration
    console.log('1️⃣ Testing Comgate configuration...');
    
    // Check if Comgate is available in payment methods
    const methodsResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/methods`);
    const methodsData = await methodsResponse.json();
    
    if (methodsData.success) {
      const comgateMethod = methodsData.methods.find(m => m.method === 'comgate');
      if (comgateMethod) {
        console.log('✅ Comgate found in payment methods:', comgateMethod.name);
      } else {
        console.log('❌ Comgate not found in payment methods');
        return;
      }
    }

    // Step 2: Test Comgate methods endpoint
    console.log('\n2️⃣ Testing Comgate methods endpoint...');
    try {
      const comgateMethodsResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/comgate/methods`);
      const comgateMethodsData = await comgateMethodsResponse.json();
      
      if (comgateMethodsData.success) {
        console.log('✅ Comgate methods retrieved successfully');
        console.log(`   Available methods: ${comgateMethodsData.methods.length}`);
        if (comgateMethodsData.methods.length > 0) {
          console.log('   Sample methods:', comgateMethodsData.methods.slice(0, 3).map(m => m.name || m.id).join(', '));
        }
      } else {
        console.log('❌ Failed to get Comgate methods:', comgateMethodsData.error);
      }
    } catch (error) {
      console.log('❌ Comgate methods endpoint error:', error.message);
    }

    // Step 3: Create test order
    console.log('\n3️⃣ Creating test order for Comgate payment...');
    const orderData = {
      type: 'complete',
      customer: {
        firstName: 'Comgate',
        lastName: 'RealTest',
        email: 'comgate.real.test@example.com',
        phone: '+420777123456'
      },
      items: [{
        productId: '1', // VPS Basic
        name: 'VPS Basic - Comgate Test',
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
      throw new Error('Failed to create order: ' + (orderResult.error || 'Unknown error'));
    }

    const order = orderResult.orders[0];
    console.log('✅ Order created successfully');
    console.log(`   Order ID: ${order.orderId}`);
    console.log(`   Invoice ID: ${order.invoiceId}`);
    console.log(`   Price: ${order.priceFormatted}`);

    // Step 4: Initialize real Comgate payment
    console.log('\n4️⃣ Initializing REAL Comgate payment...');
    console.log('⚠️  This will make actual API call to Comgate');
    
    const paymentData = {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: 299,
      currency: 'CZK',
      customerEmail: 'comgate.real.test@example.com',
      customerName: 'Comgate RealTest',
      customerPhone: '+420777123456',
      description: 'VPS Basic - Real Comgate Test'
    };

    const paymentResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/comgate/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const paymentResult = await paymentResponse.json();
    
    if (paymentResult.success) {
      console.log('🎉 REAL Comgate payment initialized successfully!');
      console.log(`   Transaction ID: ${paymentResult.transactionId}`);
      console.log(`   Redirect URL: ${paymentResult.redirectUrl}`);
      console.log(`   Status: ${paymentResult.status}`);
      console.log(`   Message: ${paymentResult.message}`);

      // Step 5: Check payment status
      console.log('\n5️⃣ Checking real payment status...');
      const statusResponse = await fetch(
        `${MIDDLEWARE_URL}/api/payments/comgate/status?transactionId=${paymentResult.transactionId}`
      );
      const statusResult = await statusResponse.json();
      
      if (statusResult.success) {
        console.log('✅ Payment status retrieved successfully');
        console.log(`   Status: ${statusResult.status}`);
        console.log(`   Paid: ${statusResult.paid}`);
        console.log(`   Amount: ${statusResult.amount} ${statusResult.currency}`);
        console.log(`   Test Mode: ${statusResult.testMode}`);
        if (statusResult.email) {
          console.log(`   Email: ${statusResult.email}`);
        }
      } else {
        console.log('❌ Failed to get payment status:', statusResult.error);
      }

      // Step 6: Test via main payment endpoint
      console.log('\n6️⃣ Testing via main payment initialize endpoint...');
      const mainPaymentData = {
        orderId: order.orderId,
        invoiceId: order.invoiceId,
        method: 'comgate',
        amount: 299,
        currency: 'CZK'
      };

      const mainPaymentResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mainPaymentData)
      });

      const mainPaymentResult = await mainPaymentResponse.json();
      
      if (mainPaymentResult.success) {
        console.log('✅ Main payment endpoint with Comgate successful');
        console.log(`   Redirect required: ${mainPaymentResult.redirectRequired}`);
        console.log(`   Payment URL: ${mainPaymentResult.paymentUrl}`);
        console.log(`   Transaction ID: ${mainPaymentResult.transactionId}`);
      } else {
        console.log('❌ Main payment endpoint failed:', mainPaymentResult.error);
      }

      console.log('\n🎯 === REAL TEST SUMMARY ===');
      console.log('🎉 REAL Comgate payment test completed successfully!');
      console.log('\n📋 Results:');
      console.log('   ✅ Comgate API connection: Working');
      console.log('   ✅ Payment initialization: Success');
      console.log('   ✅ Transaction created: ' + paymentResult.transactionId);
      console.log('   ✅ Payment gateway URL: Available');
      console.log('\n🌐 Next steps:');
      console.log('   1. Open payment URL in browser to complete payment');
      console.log('   2. Test payment flow in browser portals');
      console.log('   3. Verify callback handling');
      
      console.log('\n🔗 Payment URL:');
      console.log(`   ${paymentResult.redirectUrl}`);

      return {
        success: true,
        transactionId: paymentResult.transactionId,
        paymentUrl: paymentResult.redirectUrl,
        orderId: order.orderId
      };

    } else {
      console.log('❌ REAL Comgate payment initialization failed');
      console.log(`   Error: ${paymentResult.error}`);
      
      // Check if it's IP whitelist issue
      if (paymentResult.error && paymentResult.error.includes('unauthorized location')) {
        console.log('\n💡 IP Whitelist Issue Detected:');
        console.log('   Your IP needs to be added to Comgate whitelist');
        console.log('   Go to: https://portal.comgate.cz');
        console.log('   Section: Integrace > Nastavení obchodu > Propojení obchodu');
        console.log('   Add your IP to allowed addresses');
      }

      return {
        success: false,
        error: paymentResult.error
      };
    }

  } catch (error) {
    console.error('❌ Real Comgate test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testRealComgatePayment();
}

module.exports = { testRealComgatePayment };
