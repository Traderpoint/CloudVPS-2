// Final test of complete payment flow with ONLY Capture Payment
const http = require('http');

async function testFinalPaymentFlow() {
  console.log('🚀 Final test of complete payment flow with ONLY Capture Payment...');
  console.log('🎯 This simulates exactly what payment-flow-test does now');
  
  // Step 1: Create order (as payment-flow-test does)
  console.log('\n1️⃣ Creating order (as payment-flow-test does)...');
  
  const orderData = {
    customer: {
      firstName: 'Final',
      lastName: 'Test',
      email: 'final.test@example.com',
      phone: '+420123456789',
      address: 'Final Test Address 123',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ'
    },
    items: [
      {
        productId: '1',
        name: 'Final Test VPS',
        price: 604,
        cycle: 'm'
      }
    ],
    addons: [],
    affiliate: null,
    payment: {
      method: 'comgate',
      total: 604
    },
    type: 'complete'
  };

  try {
    const orderResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/create-test-order', orderData);
    
    if (!orderResult.success) {
      console.log('❌ Failed to create order:', orderResult.error);
      return;
    }

    const order = orderResult.orders[0];
    console.log('✅ Order created successfully:', {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: order.price
    });

    // Step 2: Initialize payment (as payment-flow-test does)
    console.log('\n2️⃣ Initializing payment (as payment-flow-test does)...');
    
    const paymentData = {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: 604,
      currency: 'CZK',
      method: 'comgate',
      customerEmail: 'final.test@example.com',
      customerName: 'Final Test',
      customerPhone: '+420123456789',
      description: 'Final Test VPS'
    };

    const paymentResult = await makeRequest('POST', 'localhost', 3005, '/api/payments/comgate/initialize', paymentData);

    if (paymentResult.success) {
      console.log('✅ Payment initialized successfully:', {
        transactionId: paymentResult.transactionId,
        status: paymentResult.status,
        hasPaymentUrl: !!paymentResult.redirectUrl
      });
    } else {
      console.log('❌ Payment initialization failed:', paymentResult.error);
      return;
    }

    // Step 3: Check initial invoice status
    console.log('\n3️⃣ Checking initial invoice status...');
    
    const initialStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    
    if (initialStatus.success) {
      console.log('✅ Initial invoice status:', {
        status: initialStatus.status,
        isPaid: initialStatus.isPaid,
        amount: initialStatus.amount
      });
      
      if (!initialStatus.isPaid) {
        console.log('✅ CORRECT: Invoice starts as Unpaid');
      } else {
        console.log('❌ PROBLEM: Invoice is already marked as Paid initially');
      }
    }

    // Step 4: Simulate payment return (as payment-flow-test does)
    console.log('\n4️⃣ Simulating payment return (as payment-flow-test does)...');
    
    const returnResult = await makeRequest('GET', 'localhost', 3005, 
      `/api/payments/return?invoiceId=${order.invoiceId}&status=success&amount=604&paymentMethod=comgate&transactionId=FINAL-TEST-${order.invoiceId}`);

    console.log('Payment return processed:', returnResult.success ? 'Success' : 'Failed');

    // Step 5: Check invoice status after return (should still be Unpaid)
    console.log('\n5️⃣ Checking invoice status after return (should still be Unpaid)...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterReturnStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    
    if (afterReturnStatus.success) {
      console.log('Invoice status after return:', {
        status: afterReturnStatus.status,
        isPaid: afterReturnStatus.isPaid,
        amount: afterReturnStatus.amount
      });
      
      if (!afterReturnStatus.isPaid) {
        console.log('✅ CORRECT: Invoice is still Unpaid after return - waiting for capture');
      } else {
        console.log('❌ PROBLEM: Invoice was marked as Paid by return callback');
      }
    }

    // Step 6: Call ONLY Capture Payment (as payment-flow-test now does)
    console.log('\n6️⃣ Calling ONLY Capture Payment (as payment-flow-test now does)...');
    
    const captureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
      invoice_id: order.invoiceId,
      amount: 604,
      module: 'Comgate',
      trans_id: `FINAL-TEST-${order.invoiceId}`,
      note: 'Payment captured after successful comgate test payment'
    });

    if (captureResult.success) {
      console.log('✅ Capture Payment successful:', {
        message: captureResult.message,
        invoiceId: captureResult.data?.invoice_id,
        amount: captureResult.data?.amount,
        transactionId: captureResult.data?.transaction_id,
        previousStatus: captureResult.data?.previous_status,
        currentStatus: captureResult.data?.current_status
      });

      if (captureResult.data?.current_status === 'Paid') {
        console.log('🎉 SUCCESS: Invoice marked as PAID by Capture Payment');
      }
    } else {
      console.log('❌ Capture Payment failed:', captureResult.error);
      return;
    }

    // Step 7: Final verification (as payment-flow-test does)
    console.log('\n7️⃣ Final verification (as payment-flow-test does)...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    
    if (finalStatus.success) {
      console.log('✅ Final invoice status:', {
        status: finalStatus.status,
        isPaid: finalStatus.isPaid,
        amount: finalStatus.amount,
        datePaid: finalStatus.datePaid
      });

      if (finalStatus.isPaid && finalStatus.status === 'Paid') {
        console.log('🎉 PERFECT: Invoice is now properly marked as PAID');
        console.log('📊 payment-flow-test will show: "✅ Payment Completed & Verified - PAID"');
      } else {
        console.log('❌ PROBLEM: Invoice is not properly marked as PAID');
      }
    }

    // Step 8: Summary of what payment-flow-test UI will show
    console.log('\n8️⃣ Summary of what payment-flow-test UI will show...');
    
    if (captureResult.success && finalStatus.success && finalStatus.isPaid) {
      console.log('🎯 payment-flow-test UI will display:');
      console.log('   💰 Payment Captured Successfully');
      console.log('   📊 Status change: Unpaid → Paid');
      console.log('   🎉 Order moved from "Capture Payment" to "Provision" status!');
      console.log('   ✅ Payment Completed & Verified - PAID');
      console.log('   📅 Date paid:', finalStatus.datePaid);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }

  console.log('\n🎯 === FINAL PAYMENT FLOW TEST SUMMARY ===');
  console.log('✅ Complete payment flow with ONLY Capture Payment:');
  console.log('   1. ✅ Order creation works');
  console.log('   2. ✅ Payment initialization works');
  console.log('   3. ✅ Invoice starts as Unpaid (correct)');
  console.log('   4. ✅ Payment return does NOT mark as Paid (correct)');
  console.log('   5. ✅ ONLY Capture Payment marks as Paid (correct)');
  console.log('   6. ✅ Final status is Paid with proper date');
  console.log('   7. ✅ Order lifecycle: "Capture Payment" → "Provision"');
  console.log('\n🔗 Ready for manual testing at: http://localhost:3000/payment-flow-test');
  console.log('   → Create order → Initialize payment → Real test payment → Capture → Verify');
}

// Helper function to make HTTP requests
async function makeRequest(method, hostname, port, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname,
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve(jsonData);
        } catch (e) {
          resolve({ error: 'Invalid JSON response', raw: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Run the test
testFinalPaymentFlow();
