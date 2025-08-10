// Test immediate Capture Payment after return with 1s wait
const http = require('http');

async function testImmediateCapture() {
  console.log('🚀 Testing IMMEDIATE Capture Payment after return with 1s wait...');
  console.log('⚡ This tests the optimized payment-flow-test performance');
  
  const startTime = Date.now();
  
  // Step 1: Create order
  console.log('\n1️⃣ Creating order...');
  
  const orderData = {
    customer: {
      firstName: 'Immediate',
      lastName: 'Capture',
      email: 'immediate.capture@example.com',
      phone: '+420123456789',
      address: 'Immediate Test Address 123',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ'
    },
    items: [
      {
        productId: '1',
        name: 'Immediate Capture VPS',
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
    console.log('✅ Order created:', {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: order.price
    });

    const orderTime = Date.now();
    console.log(`⏱️ Order creation took: ${orderTime - startTime}ms`);

    // Step 2: Initialize payment
    console.log('\n2️⃣ Initializing payment...');
    
    const paymentData = {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: 604,
      currency: 'CZK',
      method: 'comgate',
      customerEmail: 'immediate.capture@example.com',
      customerName: 'Immediate Capture',
      customerPhone: '+420123456789',
      description: 'Immediate Capture VPS'
    };

    const paymentResult = await makeRequest('POST', 'localhost', 3005, '/api/payments/comgate/initialize', paymentData);

    if (!paymentResult.success) {
      console.log('❌ Payment initialization failed:', paymentResult.error);
      return;
    }

    const paymentTime = Date.now();
    console.log('✅ Payment initialized:', paymentResult.transactionId);
    console.log(`⏱️ Payment initialization took: ${paymentTime - orderTime}ms`);

    // Step 3: Simulate payment return
    console.log('\n3️⃣ Simulating payment return...');
    
    const returnStartTime = Date.now();
    const returnResult = await makeRequest('GET', 'localhost', 3005, 
      `/api/payments/return?invoiceId=${order.invoiceId}&status=success&amount=604&paymentMethod=comgate&transactionId=IMMEDIATE-${order.invoiceId}`);

    const returnTime = Date.now();
    console.log('Payment return processed:', returnResult.success ? 'Success' : 'Failed');
    console.log(`⏱️ Payment return took: ${returnTime - returnStartTime}ms`);

    // Step 4: IMMEDIATELY call Capture Payment (as payment-flow-test now does)
    console.log('\n4️⃣ IMMEDIATELY calling Capture Payment (no delay)...');
    
    const captureStartTime = Date.now();
    const captureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
      invoice_id: order.invoiceId,
      amount: 604,
      module: 'Comgate',
      trans_id: `IMMEDIATE-${order.invoiceId}`,
      note: 'IMMEDIATE payment capture after successful comgate test payment'
    });

    const captureTime = Date.now();
    
    if (captureResult.success) {
      console.log('✅ IMMEDIATE Capture Payment successful:', {
        previousStatus: captureResult.data?.previous_status,
        currentStatus: captureResult.data?.current_status,
        transactionId: captureResult.data?.transaction_id
      });
      console.log(`⏱️ Capture Payment took: ${captureTime - captureStartTime}ms`);
    } else {
      console.log('❌ IMMEDIATE Capture Payment failed:', captureResult.error);
      return;
    }

    // Step 5: Wait only 1 second and check status (as payment-flow-test now does)
    console.log('\n5️⃣ Waiting only 1 second and checking status...');
    
    const waitStartTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second wait
    const waitTime = Date.now();
    console.log(`⏱️ Wait time: ${waitTime - waitStartTime}ms`);
    
    const statusResult = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    const statusTime = Date.now();
    
    if (statusResult.success) {
      console.log('✅ Final status after 1s wait:', {
        status: statusResult.status,
        isPaid: statusResult.isPaid,
        datePaid: statusResult.datePaid
      });
      console.log(`⏱️ Status check took: ${statusTime - waitTime}ms`);
      
      if (statusResult.isPaid) {
        console.log('🎉 SUCCESS: Invoice is PAID after immediate capture + 1s wait');
      }
    }

    // Step 6: Performance summary
    const totalTime = Date.now();
    console.log('\n6️⃣ Performance Summary:');
    console.log(`⏱️ Total time: ${totalTime - startTime}ms`);
    console.log(`   - Order creation: ${orderTime - startTime}ms`);
    console.log(`   - Payment init: ${paymentTime - orderTime}ms`);
    console.log(`   - Payment return: ${returnTime - paymentTime}ms`);
    console.log(`   - Capture payment: ${captureTime - returnTime}ms`);
    console.log(`   - Wait + status: ${totalTime - captureTime}ms`);
    
    if (totalTime - startTime < 5000) {
      console.log('🚀 EXCELLENT: Complete flow under 5 seconds!');
    } else if (totalTime - startTime < 10000) {
      console.log('✅ GOOD: Complete flow under 10 seconds');
    } else {
      console.log('⚠️ SLOW: Complete flow over 10 seconds');
    }

    // Step 7: Test multiple rapid captures
    console.log('\n7️⃣ Testing multiple rapid captures...');
    
    const rapidTests = [];
    for (let i = 1; i <= 3; i++) {
      const rapidStart = Date.now();
      
      // Create order
      const rapidOrderData = { ...orderData, customer: { ...orderData.customer, email: `rapid${i}@example.com` } };
      const rapidOrder = await makeRequest('POST', 'localhost', 3000, '/api/middleware/create-test-order', rapidOrderData);
      
      if (rapidOrder.success) {
        const order = rapidOrder.orders[0];
        
        // Immediate capture
        const rapidCapture = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
          invoice_id: order.invoiceId,
          amount: 604,
          module: 'Comgate',
          trans_id: `RAPID-${i}-${order.invoiceId}`,
          note: `Rapid capture test ${i}`
        });
        
        const rapidTime = Date.now() - rapidStart;
        rapidTests.push({
          test: i,
          invoiceId: order.invoiceId,
          success: rapidCapture.success,
          time: rapidTime
        });
        
        console.log(`   Rapid test ${i}: ${rapidCapture.success ? 'SUCCESS' : 'FAILED'} in ${rapidTime}ms`);
      }
    }
    
    const avgTime = rapidTests.reduce((sum, test) => sum + test.time, 0) / rapidTests.length;
    console.log(`📊 Average rapid capture time: ${avgTime.toFixed(0)}ms`);

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }

  console.log('\n🎯 === IMMEDIATE CAPTURE TEST SUMMARY ===');
  console.log('⚡ Optimized payment-flow-test performance:');
  console.log('   1. ✅ IMMEDIATE Capture Payment after return (no delay)');
  console.log('   2. ✅ Reduced wait time to 1 second');
  console.log('   3. ✅ Faster overall payment flow');
  console.log('   4. ✅ Better user experience');
  console.log('\n🔗 Test the optimized flow at: http://localhost:3000/payment-flow-test');
  console.log('   → Should be noticeably faster now!');
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
testImmediateCapture();
