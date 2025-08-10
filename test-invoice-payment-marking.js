/**
 * Test Invoice Payment Marking
 * Verifies that invoices are properly marked as paid after successful payment
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

async function testInvoicePaymentMarking() {
  console.log('🧪 === INVOICE PAYMENT MARKING TEST ===\n');
  console.log('🎯 Testing automatic invoice payment marking after successful payment');

  try {
    // Step 1: Create order and get invoice
    console.log('1️⃣ Creating order to get invoice...');
    
    const orderData = {
      customer: {
        firstName: 'Payment',
        lastName: 'Test',
        email: 'payment.test@example.com',
        phone: '+420777123456',
        address: 'Test Street 123',
        city: 'Prague',
        postalCode: '11000',
        country: 'CZ',
        company: 'Payment Test s.r.o.'
      },
      items: [
        {
          productId: '1',
          name: 'VPS Basic',
          price: 299,
          cycle: 'm',
          quantity: 1,
          configOptions: {
            cpu: '2 vCPU',
            ram: '4GB',
            storage: '50GB'
          }
        }
      ],
      affiliate: {
        id: '2',
        code: 'test-affiliate'
      },
      paymentMethod: 'comgate',
      newsletterSubscribe: false,
      type: 'complete'
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
    console.log(`✅ Order created: ${order.orderId}, Invoice: ${order.invoiceId}`);

    // Step 2: Check initial invoice status
    console.log('\n2️⃣ Checking initial invoice status...');
    
    const initialStatusResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${order.invoiceId}/status`);
    const initialStatus = await initialStatusResponse.json();
    
    if (initialStatus.success) {
      console.log(`✅ Initial invoice status: ${initialStatus.status}`);
      console.log(`   Amount: ${initialStatus.amount} ${initialStatus.currency}`);
      console.log(`   Paid: ${initialStatus.paid ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ Failed to get initial invoice status');
      return;
    }

    // Step 3: Simulate successful payment return
    console.log('\n3️⃣ Simulating successful payment return...');
    
    const returnParams = {
      status: 'success',
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      transactionId: `TEST-${Date.now()}`,
      paymentMethod: 'comgate',
      amount: '299',
      currency: 'CZK'
    };

    const returnUrl = `${MIDDLEWARE_URL}/api/payments/return?${new URLSearchParams(returnParams).toString()}`;
    
    console.log('📤 Calling return endpoint:', returnUrl);
    
    const returnResponse = await fetch(returnUrl, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects
    });

    console.log(`✅ Return endpoint called: ${returnResponse.status}`);
    
    if (returnResponse.status === 302) {
      const location = returnResponse.headers.get('location');
      console.log(`   Redirect to: ${location}`);
    }

    // Step 4: Wait a moment for processing
    console.log('\n4️⃣ Waiting for payment processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Check invoice status after payment
    console.log('\n5️⃣ Checking invoice status after payment...');
    
    const finalStatusResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${order.invoiceId}/status`);
    const finalStatus = await finalStatusResponse.json();
    
    if (finalStatus.success) {
      console.log(`✅ Final invoice status: ${finalStatus.status}`);
      console.log(`   Amount: ${finalStatus.amount} ${finalStatus.currency}`);
      console.log(`   Paid: ${finalStatus.paid ? 'YES' : 'NO'}`);
      
      if (finalStatus.paid) {
        console.log('\n🎉 SUCCESS: Invoice was marked as PAID!');
      } else {
        console.log('\n⚠️ WARNING: Invoice is still UNPAID');
      }
    } else {
      console.log('❌ Failed to get final invoice status');
    }

    // Step 6: Test callback endpoint directly
    console.log('\n6️⃣ Testing callback endpoint directly...');
    
    const callbackData = {
      status: 'success',
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      transactionId: `CALLBACK-${Date.now()}`,
      paymentMethod: 'comgate',
      amount: '299',
      currency: 'CZK'
    };

    const callbackResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callbackData)
    });

    const callbackResult = await callbackResponse.json();
    
    if (callbackResult.success) {
      console.log('✅ Callback endpoint processed successfully');
      console.log(`   Payment ID: ${callbackResult.paymentId}`);
      console.log(`   Transaction ID: ${callbackResult.transactionId}`);
    } else {
      console.log('❌ Callback endpoint failed:', callbackResult.error);
    }

    // Step 7: Final verification
    console.log('\n7️⃣ Final verification...');
    
    const verificationResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${order.invoiceId}/status`);
    const verificationStatus = await verificationResponse.json();
    
    if (verificationStatus.success) {
      console.log(`✅ Verification status: ${verificationStatus.status}`);
      console.log(`   Paid: ${verificationStatus.paid ? 'YES' : 'NO'}`);
      
      if (verificationStatus.paid) {
        console.log('\n🎊 FINAL SUCCESS: Invoice payment marking is working correctly!');
      } else {
        console.log('\n❌ FINAL FAILURE: Invoice is still not marked as paid');
      }
    }

    console.log('\n🎯 === INVOICE PAYMENT MARKING SUMMARY ===');
    console.log('✅ Invoice payment marking test completed');
    
    console.log('\n📋 Payment Marking Process:');
    console.log('   1. Order created with invoice');
    console.log('   2. Payment return endpoint called');
    console.log('   3. Invoice automatically marked as paid');
    console.log('   4. Callback endpoint available for direct notifications');
    console.log('   5. HostBill addInvoicePayment API called');
    
    console.log('\n🌐 Testing Instructions:');
    console.log('   1. Open: http://localhost:3000/payment-flow-test');
    console.log('   2. Create order and initialize payment');
    console.log('   3. Complete payment in Comgate');
    console.log('   4. Return to application');
    console.log('   5. Check HostBill - invoice should be marked as PAID');
    
    console.log('\n🔧 Implementation Details:');
    console.log('   • Return handler calls HostBillClient.addInvoicePayment()');
    console.log('   • Callback endpoint available at /api/payments/callback');
    console.log('   • Supports multiple payment gateway formats');
    console.log('   • Automatic transaction ID generation if missing');
    console.log('   • Comprehensive error handling and logging');

  } catch (error) {
    console.error('❌ Invoice payment marking test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testInvoicePaymentMarking();
}

module.exports = { testInvoicePaymentMarking };
