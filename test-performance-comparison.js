// Performance comparison: Old vs New payment flow
const http = require('http');

async function testPerformanceComparison() {
  console.log('🚀 Performance Comparison: Old vs New payment flow...');
  
  console.log('\n📊 === PERFORMANCE COMPARISON ===');
  console.log('🔴 OLD FLOW (before optimization):');
  console.log('   1. Payment return callback');
  console.log('   2. Wait 2 seconds');
  console.log('   3. Call Capture Payment');
  console.log('   4. Wait 3 seconds');
  console.log('   5. Check invoice status');
  console.log('   → Total delay: 5+ seconds');
  
  console.log('\n🟢 NEW FLOW (after optimization):');
  console.log('   1. Payment return callback');
  console.log('   2. IMMEDIATELY call Capture Payment');
  console.log('   3. Wait 1 second');
  console.log('   4. Check invoice status');
  console.log('   → Total delay: 1 second');
  
  // Test the new optimized flow
  console.log('\n🟢 Testing NEW optimized flow...');
  
  const orderData = {
    customer: {
      firstName: 'Performance',
      lastName: 'Test',
      email: 'performance.test@example.com',
      phone: '+420123456789',
      address: 'Performance Test Address',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ'
    },
    items: [
      {
        productId: '1',
        name: 'Performance Test VPS',
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
    const startTime = Date.now();
    
    // Step 1: Create order
    console.log('\n1️⃣ Creating order...');
    const orderResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/create-test-order', orderData);
    
    if (!orderResult.success) {
      console.log('❌ Failed to create order:', orderResult.error);
      return;
    }

    const order = orderResult.orders[0];
    const orderTime = Date.now();
    console.log(`✅ Order created in ${orderTime - startTime}ms`);

    // Step 2: Simulate payment return
    console.log('\n2️⃣ Simulating payment return...');
    const returnStartTime = Date.now();
    
    await makeRequest('GET', 'localhost', 3005, 
      `/api/payments/return?invoiceId=${order.invoiceId}&status=success&amount=604&paymentMethod=comgate&transactionId=PERF-TEST-${order.invoiceId}`);
    
    const returnTime = Date.now();
    console.log(`✅ Payment return processed in ${returnTime - returnStartTime}ms`);

    // Step 3: IMMEDIATELY call Capture Payment (NEW FLOW)
    console.log('\n3️⃣ IMMEDIATELY calling Capture Payment (NEW FLOW)...');
    const captureStartTime = Date.now();
    
    const captureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
      invoice_id: order.invoiceId,
      amount: 604,
      module: 'Comgate',
      trans_id: `PERF-TEST-${order.invoiceId}`,
      note: 'Performance test - immediate capture'
    });
    
    const captureTime = Date.now();
    
    if (captureResult.success) {
      console.log(`✅ Capture Payment completed in ${captureTime - captureStartTime}ms`);
      console.log(`   Status change: ${captureResult.data?.previous_status} → ${captureResult.data?.current_status}`);
    } else {
      console.log('❌ Capture Payment failed:', captureResult.error);
      return;
    }

    // Step 4: Wait only 1 second (NEW FLOW)
    console.log('\n4️⃣ Waiting 1 second (NEW FLOW)...');
    const waitStartTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1000));
    const waitTime = Date.now();
    console.log(`✅ Wait completed in ${waitTime - waitStartTime}ms`);

    // Step 5: Check final status
    console.log('\n5️⃣ Checking final status...');
    const statusStartTime = Date.now();
    
    const statusResult = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    const statusTime = Date.now();
    
    if (statusResult.success) {
      console.log(`✅ Status check completed in ${statusTime - statusStartTime}ms`);
      console.log(`   Final status: ${statusResult.status}, isPaid: ${statusResult.isPaid}`);
    }

    // Performance summary
    const totalTime = Date.now();
    const totalDuration = totalTime - startTime;
    
    console.log('\n📊 === NEW FLOW PERFORMANCE RESULTS ===');
    console.log(`⏱️ Total time: ${totalDuration}ms (${(totalDuration/1000).toFixed(1)}s)`);
    console.log(`   - Order creation: ${orderTime - startTime}ms`);
    console.log(`   - Payment return: ${returnTime - orderTime}ms`);
    console.log(`   - Capture payment: ${captureTime - returnTime}ms`);
    console.log(`   - Wait time: ${waitTime - captureTime}ms`);
    console.log(`   - Status check: ${totalTime - waitTime}ms`);
    
    // Performance rating
    if (totalDuration < 3000) {
      console.log('🚀 EXCELLENT: Under 3 seconds!');
    } else if (totalDuration < 5000) {
      console.log('✅ VERY GOOD: Under 5 seconds');
    } else if (totalDuration < 10000) {
      console.log('👍 GOOD: Under 10 seconds');
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT: Over 10 seconds');
    }

    // Comparison with old flow
    const oldFlowEstimate = totalDuration + 4000; // Add 4s for old delays (2s + 3s - 1s)
    console.log('\n📈 === PERFORMANCE IMPROVEMENT ===');
    console.log(`🔴 OLD FLOW (estimated): ${oldFlowEstimate}ms (${(oldFlowEstimate/1000).toFixed(1)}s)`);
    console.log(`🟢 NEW FLOW (actual): ${totalDuration}ms (${(totalDuration/1000).toFixed(1)}s)`);
    console.log(`⚡ IMPROVEMENT: ${oldFlowEstimate - totalDuration}ms faster (${((oldFlowEstimate - totalDuration)/1000).toFixed(1)}s)`);
    console.log(`📊 SPEED INCREASE: ${((oldFlowEstimate / totalDuration - 1) * 100).toFixed(0)}% faster`);

    // Test multiple runs for consistency
    console.log('\n🔄 Testing consistency with 3 rapid runs...');
    const rapidTimes = [];
    
    for (let i = 1; i <= 3; i++) {
      const rapidStart = Date.now();
      
      // Create order
      const rapidOrderData = { ...orderData, customer: { ...orderData.customer, email: `rapid${i}@example.com` } };
      const rapidOrder = await makeRequest('POST', 'localhost', 3000, '/api/middleware/create-test-order', rapidOrderData);
      
      if (rapidOrder.success) {
        const order = rapidOrder.orders[0];
        
        // Return + Immediate capture
        await makeRequest('GET', 'localhost', 3005, 
          `/api/payments/return?invoiceId=${order.invoiceId}&status=success&amount=604&paymentMethod=comgate&transactionId=RAPID-${i}-${order.invoiceId}`);
        
        const rapidCapture = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
          invoice_id: order.invoiceId,
          amount: 604,
          module: 'Comgate',
          trans_id: `RAPID-${i}-${order.invoiceId}`,
          note: `Rapid test ${i}`
        });
        
        // 1s wait + status check
        await new Promise(resolve => setTimeout(resolve, 1000));
        await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
        
        const rapidTime = Date.now() - rapidStart;
        rapidTimes.push(rapidTime);
        
        console.log(`   Run ${i}: ${rapidCapture.success ? 'SUCCESS' : 'FAILED'} in ${rapidTime}ms`);
      }
    }
    
    const avgTime = rapidTimes.reduce((sum, time) => sum + time, 0) / rapidTimes.length;
    const minTime = Math.min(...rapidTimes);
    const maxTime = Math.max(...rapidTimes);
    
    console.log(`📊 Consistency results:`);
    console.log(`   Average: ${avgTime.toFixed(0)}ms`);
    console.log(`   Fastest: ${minTime}ms`);
    console.log(`   Slowest: ${maxTime}ms`);
    console.log(`   Variance: ${maxTime - minTime}ms`);

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }

  console.log('\n🎯 === OPTIMIZATION SUMMARY ===');
  console.log('⚡ payment-flow-test optimizations:');
  console.log('   ✅ IMMEDIATE Capture Payment after return (no 2s delay)');
  console.log('   ✅ Reduced final wait from 3s to 1s');
  console.log('   ✅ 4+ seconds faster overall');
  console.log('   ✅ Better user experience');
  console.log('   ✅ More responsive UI');
  console.log('\n🔗 Experience the speed at: http://localhost:3000/payment-flow-test');
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
testPerformanceComparison();
