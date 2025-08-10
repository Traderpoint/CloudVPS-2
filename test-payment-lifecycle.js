/**
 * Test Payment Lifecycle - Simulate Payment Authorization and Capture
 * Testing how balance field changes during payment process
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function makeHostBillApiCall(params) {
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const curlCommand = `curl -k -X POST "https://vps.kabel1it.cz/admin/api.php" -H "Content-Type: application/x-www-form-urlencoded" -d "api_id=adcdebb0e3b6f583052d&api_key=341697c41aeb1c842f0d&${paramString}"`;
  
  try {
    const { stdout, stderr } = await execAsync(curlCommand);
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Curl error:', error.message);
    return { error: error.message };
  }
}

async function createOrderAndTestPaymentStates(paymentMethod, testName) {
  console.log(`\n🧪 Testing Payment Lifecycle: ${testName}`);
  console.log('================================================================================');
  console.log(`Payment Method: ${paymentMethod}`);

  try {
    const timestamp = Date.now();
    
    // Create order via our API
    const orderData = {
      customer: {
        firstName: testName.replace(/\s+/g, ''),
        lastName: "LifecycleTest",
        email: `${testName.toLowerCase().replace(/\s+/g, '.')}.lifecycle.${timestamp}@test.com`,
        phone: "+420123456789",
        address: `${testName} Lifecycle Street 123`,
        city: "Praha",
        postalCode: "11000",
        country: "CZ",
        company: `${testName} Lifecycle s.r.o. ${timestamp}`
      },
      items: [{
        productId: "1",
        name: "VPS Start",
        quantity: 1,
        price: 299,
        cycle: "q"
      }],
      paymentMethod: paymentMethod,
      total: 897
    };

    // Create order via Node.js HTTP request
    const http = require('http');
    const postData = JSON.stringify(orderData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const orderResult = await new Promise((resolve, reject) => {
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
            resolve({ error: 'Invalid JSON', raw: responseData });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(postData);
      req.end();
    });

    if (!orderResult.success) {
      console.log('❌ Order creation failed:', orderResult.error);
      return null;
    }

    const order = orderResult.orders[0];
    console.log('✅ Order created:', {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: order.totalAmount
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Function to check order status
    async function checkOrderStatus(stage) {
      console.log(`\n📊 Checking order status - ${stage}:`);
      
      const orderDetails = await makeHostBillApiCall({
        call: 'getOrderDetails',
        id: order.orderId
      });

      if (orderDetails.success && orderDetails.details) {
        const status = {
          orderId: order.orderId,
          invoiceId: orderDetails.details.invoice_id,
          orderStatus: orderDetails.details.status,
          invStatus: orderDetails.details.invstatus,
          balance: orderDetails.details.balance,
          paymentModule: orderDetails.details.payment_module,
          module: orderDetails.details.module,
          hostingStatus: orderDetails.details.hosting[0]?.status
        };

        console.log('📋 Status:', status);
        return status;
      } else {
        console.log('❌ Failed to get order status');
        return null;
      }
    }

    // 1. Initial status
    const initialStatus = await checkOrderStatus('Initial');

    // 2. Try to simulate payment authorization
    console.log('\n💳 Attempting to simulate payment authorization...');
    
    // Try various API calls that might trigger payment authorization
    const authorizationAttempts = [
      { call: 'authorizePayment', order_id: order.orderId },
      { call: 'authorizePayment', invoice_id: order.invoiceId },
      { call: 'setOrderStatus', id: order.orderId, status: 'Authorized' },
      { call: 'setInvoiceStatus', id: order.invoiceId, status: 'Authorized' },
      { call: 'updateOrderBalance', id: order.orderId, balance: 'Authorized' },
      { call: 'processPayment', order_id: order.orderId, action: 'authorize' },
      { call: 'processPayment', invoice_id: order.invoiceId, action: 'authorize' }
    ];

    for (const attempt of authorizationAttempts) {
      console.log(`🔄 Trying: ${JSON.stringify(attempt)}`);
      
      const result = await makeHostBillApiCall(attempt);
      
      if (result.error) {
        console.log(`❌ ${Array.isArray(result.error) ? result.error.join(', ') : result.error}`);
      } else if (result.success) {
        console.log('✅ SUCCESS - checking if status changed...');
        
        const statusAfterAuth = await checkOrderStatus('After Authorization Attempt');
        
        if (statusAfterAuth && statusAfterAuth.balance !== initialStatus?.balance) {
          console.log('🎯 BALANCE CHANGED! Payment authorization might be working');
          console.log(`Previous: ${initialStatus?.balance} → Current: ${statusAfterAuth.balance}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Try to mark invoice as paid to see full lifecycle
    console.log('\n💰 Attempting to mark invoice as paid...');
    
    const paymentAttempts = [
      { call: 'setInvoiceStatus', id: order.invoiceId, status: 'Paid' },
      { call: 'markInvoicePaid', id: order.invoiceId },
      { call: 'addPayment', invoice_id: order.invoiceId, amount: '1085', method: paymentMethod },
      { call: 'processPayment', invoice_id: order.invoiceId, action: 'capture' },
      { call: 'capturePayment', invoice_id: order.invoiceId }
    ];

    for (const attempt of paymentAttempts) {
      console.log(`🔄 Trying: ${JSON.stringify(attempt)}`);
      
      const result = await makeHostBillApiCall(attempt);
      
      if (result.error) {
        console.log(`❌ ${Array.isArray(result.error) ? result.error.join(', ') : result.error}`);
      } else if (result.success) {
        console.log('✅ SUCCESS - checking final status...');
        
        const finalStatus = await checkOrderStatus('After Payment');
        
        if (finalStatus) {
          console.log('🎯 PAYMENT LIFECYCLE COMPLETE');
          console.log('Status progression:');
          console.log(`Initial: ${initialStatus?.balance} / ${initialStatus?.invStatus}`);
          console.log(`Final: ${finalStatus.balance} / ${finalStatus.invStatus}`);
          
          return {
            testName,
            paymentMethod,
            orderId: order.orderId,
            invoiceId: order.invoiceId,
            initialStatus,
            finalStatus,
            paymentSuccessful: finalStatus.invStatus === 'Paid'
          };
        }
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. Final status check
    const finalStatus = await checkOrderStatus('Final');
    
    return {
      testName,
      paymentMethod,
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      initialStatus,
      finalStatus,
      paymentSuccessful: finalStatus?.invStatus === 'Paid'
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

async function testPaymentLifecycle() {
  console.log('🚀 Testing Payment Lifecycle - Authorization and Capture States');
  console.log('================================================================================');
  console.log('Testing how balance field changes during payment authorization and capture');
  console.log('================================================================================');

  const paymentTests = [
    { paymentMethod: "10", testName: "PayU Lifecycle" },
    { paymentMethod: "banktransfer", testName: "BankTransfer Lifecycle" }
  ];

  const results = [];

  for (const test of paymentTests) {
    const result = await createOrderAndTestPaymentStates(test.paymentMethod, test.testName);
    
    if (result) {
      results.push(result);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n📊 PAYMENT LIFECYCLE TEST SUMMARY');
  console.log('================================================================================');
  
  results.forEach(result => {
    console.log(`\n${result.testName}:`);
    console.log(`  Payment Method: ${result.paymentMethod}`);
    console.log(`  Order: ${result.orderId}, Invoice: ${result.invoiceId}`);
    console.log(`  Initial Status: ${result.initialStatus?.balance} / ${result.initialStatus?.invStatus}`);
    console.log(`  Final Status: ${result.finalStatus?.balance} / ${result.finalStatus?.invStatus}`);
    console.log(`  Payment Successful: ${result.paymentSuccessful ? 'YES' : 'NO'}`);
    
    if (result.initialStatus?.balance !== result.finalStatus?.balance) {
      console.log(`  🎯 Balance Changed: ${result.initialStatus?.balance} → ${result.finalStatus?.balance}`);
    }
  });

  console.log('\n🔍 BALANCE FIELD ANALYSIS:');
  console.log('================================================================================');
  console.log('Possible balance values observed:');
  console.log('- "Incomplete" = Initial state, payment not processed');
  console.log('- "Authorized" = Payment authorized but not captured (if this state exists)');
  console.log('- "Complete" = Payment fully processed and captured (if this state exists)');
  console.log('');
  console.log('The balance field appears to be the key indicator for payment lifecycle status.');
  console.log('Payment Authorized state would likely show as balance: "Authorized"');

  console.log('\n✅ Payment lifecycle test completed!');
  return results;
}

// Run the script
testPaymentLifecycle();
