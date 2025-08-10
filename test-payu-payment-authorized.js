/**
 * Test PayU Payment Authorized State
 * Creating PayU orders to test for actual Payment Authorized state
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

async function createPayUOrder(testName) {
  console.log(`\n🧪 Creating PayU Order: ${testName}`);
  console.log('================================================================================');

  try {
    const timestamp = Date.now();
    
    // Create PayU order
    const orderData = {
      customer: {
        firstName: testName.replace(/\s+/g, ''),
        lastName: "PayUTest",
        email: `${testName.toLowerCase().replace(/\s+/g, '.')}.payu.${timestamp}@test.com`,
        phone: "+420123456789",
        address: `${testName} PayU Street 123`,
        city: "Praha",
        postalCode: "11000",
        country: "CZ",
        company: `${testName} PayU s.r.o. ${timestamp}`
      },
      items: [{
        productId: "1",
        name: "VPS Start",
        quantity: 1,
        price: 299,
        cycle: "q"
      }],
      paymentMethod: "10", // PayU
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
    console.log('✅ PayU Order created:', {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: order.totalAmount
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Function to check order status
    async function checkOrderStatus(stage) {
      console.log(`\n📊 Checking PayU order status - ${stage}:`);
      
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
          gatewayId: orderDetails.details.metadata?.gateway_id,
          hostingStatus: orderDetails.details.hosting[0]?.status,
          invTotal: orderDetails.details.invtotal,
          invCredit: orderDetails.details.invcredit
        };

        console.log('📋 PayU Status:', status);
        return status;
      } else {
        console.log('❌ Failed to get PayU order status');
        return null;
      }
    }

    // 1. Initial status
    const initialStatus = await checkOrderStatus('Initial');

    // 2. Monitor for changes over time
    console.log('\n⏰ Monitoring PayU order for Payment Authorized state...');
    
    for (let i = 1; i <= 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const currentStatus = await checkOrderStatus(`Check ${i}`);
      
      if (currentStatus && currentStatus.balance !== initialStatus?.balance) {
        console.log(`🎯 BALANCE CHANGED! ${initialStatus?.balance} → ${currentStatus.balance}`);
        
        if (currentStatus.balance === 'Authorized') {
          console.log('🎉 PAYMENT AUTHORIZED STATE DETECTED!');
          console.log('   PayU order shows Payment Authorized status');
          
          return {
            testName,
            orderId: order.orderId,
            invoiceId: order.invoiceId,
            initialStatus,
            authorizedStatus: currentStatus,
            paymentAuthorized: true
          };
        }
      }
    }

    // 3. Final status
    const finalStatus = await checkOrderStatus('Final');
    
    return {
      testName,
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      initialStatus,
      finalStatus,
      paymentAuthorized: finalStatus?.balance === 'Authorized'
    };

  } catch (error) {
    console.error('❌ PayU test failed:', error.message);
    return null;
  }
}

async function testPayUPaymentAuthorized() {
  console.log('🚀 Testing PayU Payment Authorized State');
  console.log('================================================================================');
  console.log('Creating PayU orders to test for actual Payment Authorized state');
  console.log('PayU should show balance: "Authorized" when payment is authorized but not captured');
  console.log('================================================================================');

  const payuTests = [
    "PayU Test 1",
    "PayU Test 2"
  ];

  const results = [];
  const authorizedResults = [];

  for (const testName of payuTests) {
    const result = await createPayUOrder(testName);
    
    if (result) {
      results.push(result);
      
      if (result.paymentAuthorized) {
        authorizedResults.push(result);
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n📊 PAYU PAYMENT AUTHORIZED TEST SUMMARY');
  console.log('================================================================================');
  
  console.log(`✅ Total PayU tests: ${results.length}`);
  console.log(`🎯 Payment Authorized found: ${authorizedResults.length}`);

  if (authorizedResults.length > 0) {
    console.log('\n🎉 PAYU PAYMENT AUTHORIZED DETECTED:');
    console.log('================================================================================');
    
    authorizedResults.forEach(result => {
      console.log(`${result.testName}:`);
      console.log(`  Order: ${result.orderId}, Invoice: ${result.invoiceId}`);
      console.log(`  Initial Balance: ${result.initialStatus?.balance}`);
      console.log(`  Authorized Balance: ${result.authorizedStatus?.balance}`);
      console.log(`  Payment Module: ${result.authorizedStatus?.paymentModule}`);
      console.log(`  Module: ${result.authorizedStatus?.module}`);
      console.log('');
    });
  } else {
    console.log('\n⚠️ NO PAYU PAYMENT AUTHORIZED STATE FOUND');
    console.log('Possible reasons:');
    console.log('1. PayU gateway not configured for authorization/capture flow');
    console.log('2. PayU processes payments immediately without authorization step');
    console.log('3. Payment Authorized state requires actual payment gateway interaction');
    console.log('4. Test environment may not support authorization flow');
  }

  // All results
  console.log('\n📋 ALL PAYU TEST RESULTS:');
  console.log('================================================================================');
  
  results.forEach(result => {
    console.log(`${result.testName}:`);
    console.log(`  Order: ${result.orderId}, Invoice: ${result.invoiceId}`);
    console.log(`  Initial Balance: ${result.initialStatus?.balance}`);
    console.log(`  Final Balance: ${result.finalStatus?.balance || result.authorizedStatus?.balance}`);
    console.log(`  Payment Module: ${result.finalStatus?.paymentModule || result.authorizedStatus?.paymentModule}`);
    console.log(`  Module: ${result.finalStatus?.module || result.authorizedStatus?.module}`);
    console.log(`  Payment Authorized: ${result.paymentAuthorized ? 'YES' : 'NO'}`);
  });

  console.log('\n🔍 COMPARISON WITH ORDERS 541-549:');
  console.log('================================================================================');
  console.log('Orders 541-549 Analysis:');
  console.log('- All used Credit Balance (Payment Module 0)');
  console.log('- All showed balance: "Completed" (not "Authorized")');
  console.log('- Gateway ID varied: "0" and "10"');
  console.log('- Invoice Credit was non-zero');
  console.log('');
  console.log('PayU Orders Analysis:');
  console.log('- Use PayU gateway (Payment Module 10)');
  console.log('- Should show balance: "Authorized" when payment is authorized');
  console.log('- Gateway ID should be "10"');
  console.log('- Invoice Credit should be zero');
  console.log('');
  console.log('Conclusion:');
  console.log('- Payment Authorized state is specific to online payment gateways');
  console.log('- Credit Balance orders skip authorization phase');
  console.log('- PayU orders may show Payment Authorized in production environment');

  console.log('\n✅ PayU Payment Authorized test completed!');
  return { results, authorizedResults };
}

// Run the script
testPayUPaymentAuthorized();
