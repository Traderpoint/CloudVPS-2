/**
 * Test Payment Authorized State
 * Testing how to achieve and detect "Payment Authorized" state (balance: "Authorized")
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

async function createOrderAndTestAuthorizedState(paymentMethod, testName) {
  console.log(`\n🧪 Testing Payment Authorized State: ${testName}`);
  console.log('================================================================================');
  console.log(`Payment Method: ${paymentMethod}`);

  try {
    const timestamp = Date.now();
    
    // Create order via our API
    const orderData = {
      customer: {
        firstName: testName.replace(/\s+/g, ''),
        lastName: "AuthTest",
        email: `${testName.toLowerCase().replace(/\s+/g, '.')}.auth.${timestamp}@test.com`,
        phone: "+420123456789",
        address: `${testName} Auth Street 123`,
        city: "Praha",
        postalCode: "11000",
        country: "CZ",
        company: `${testName} Auth s.r.o. ${timestamp}`
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

    // 2. Try to set Payment Authorized state
    console.log('\n🔐 Attempting to set Payment Authorized state...');
    
    // Method 1: Try to set invoice status to "Authorized"
    console.log('🔄 Method 1: Setting invoice status to "Authorized"...');
    const authResult1 = await makeHostBillApiCall({
      call: 'setInvoiceStatus',
      id: order.invoiceId,
      status: 'Authorized'
    });

    if (authResult1.success) {
      console.log('✅ Invoice status set to Authorized');
      const statusAfterAuth1 = await checkOrderStatus('After Invoice Authorized');
      
      if (statusAfterAuth1 && statusAfterAuth1.balance === 'Authorized') {
        console.log('🎯 SUCCESS! Payment Authorized state achieved!');
        console.log('   Balance: "Authorized" - This is the Payment Authorized state!');
        
        return {
          testName,
          paymentMethod,
          orderId: order.orderId,
          invoiceId: order.invoiceId,
          initialStatus,
          authorizedStatus: statusAfterAuth1,
          paymentAuthorized: true,
          method: 'setInvoiceStatus to Authorized'
        };
      }
    } else {
      console.log('❌ Failed to set invoice status to Authorized');
    }

    // Method 2: Try other approaches to achieve Authorized state
    console.log('\n🔄 Method 2: Testing other authorization approaches...');
    
    const authMethods = [
      { call: 'updateOrder', id: order.orderId, balance: 'Authorized' },
      { call: 'setOrderBalance', id: order.orderId, balance: 'Authorized' },
      { call: 'authorizeOrder', id: order.orderId },
      { call: 'authorizeInvoice', id: order.invoiceId }
    ];

    for (const method of authMethods) {
      console.log(`🔄 Trying: ${JSON.stringify(method)}`);
      
      const result = await makeHostBillApiCall(method);
      
      if (result.success) {
        console.log('✅ Method succeeded - checking status...');
        
        const statusAfterAuth = await checkOrderStatus('After Authorization Method');
        
        if (statusAfterAuth && statusAfterAuth.balance === 'Authorized') {
          console.log('🎯 SUCCESS! Payment Authorized state achieved!');
          
          return {
            testName,
            paymentMethod,
            orderId: order.orderId,
            invoiceId: order.invoiceId,
            initialStatus,
            authorizedStatus: statusAfterAuth,
            paymentAuthorized: true,
            method: JSON.stringify(method)
          };
        }
      } else {
        console.log(`❌ ${Array.isArray(result.error) ? result.error.join(', ') : result.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Final status check
    const finalStatus = await checkOrderStatus('Final');
    
    return {
      testName,
      paymentMethod,
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      initialStatus,
      finalStatus,
      paymentAuthorized: finalStatus?.balance === 'Authorized',
      method: 'None - Authorized state not achieved'
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

async function testPaymentAuthorizedState() {
  console.log('🚀 Testing Payment Authorized State Detection');
  console.log('================================================================================');
  console.log('Testing how to achieve balance: "Authorized" state');
  console.log('This corresponds to "Authorize Payment" step in order lifecycle');
  console.log('================================================================================');

  const paymentTests = [
    { paymentMethod: "10", testName: "PayU Authorized" },
    { paymentMethod: "comgate", testName: "ComGate Authorized" },
    { paymentMethod: "banktransfer", testName: "BankTransfer Authorized" }
  ];

  const results = [];
  const authorizedResults = [];

  for (const test of paymentTests) {
    const result = await createOrderAndTestAuthorizedState(test.paymentMethod, test.testName);
    
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
  console.log('\n📊 PAYMENT AUTHORIZED STATE TEST SUMMARY');
  console.log('================================================================================');
  
  console.log(`✅ Total tests: ${results.length}`);
  console.log(`🔐 Payment Authorized achieved: ${authorizedResults.length}`);

  if (authorizedResults.length > 0) {
    console.log('\n🎉 PAYMENT AUTHORIZED STATE ACHIEVED:');
    console.log('================================================================================');
    
    authorizedResults.forEach(result => {
      console.log(`${result.testName}:`);
      console.log(`  Payment Method: ${result.paymentMethod}`);
      console.log(`  Order: ${result.orderId}, Invoice: ${result.invoiceId}`);
      console.log(`  Method Used: ${result.method}`);
      console.log(`  Initial Balance: ${result.initialStatus?.balance}`);
      console.log(`  Authorized Balance: ${result.authorizedStatus?.balance}`);
      console.log(`  Invoice Status: ${result.authorizedStatus?.invStatus}`);
      console.log('');
    });
  }

  // All results
  console.log('\n📋 ALL TEST RESULTS:');
  console.log('================================================================================');
  
  results.forEach(result => {
    console.log(`${result.testName}:`);
    console.log(`  Payment Method: ${result.paymentMethod}`);
    console.log(`  Order: ${result.orderId}, Invoice: ${result.invoiceId}`);
    console.log(`  Initial Balance: ${result.initialStatus?.balance}`);
    console.log(`  Final Balance: ${result.finalStatus?.balance || result.authorizedStatus?.balance}`);
    console.log(`  Payment Authorized: ${result.paymentAuthorized ? 'YES' : 'NO'}`);
    console.log(`  Method: ${result.method}`);
  });

  console.log('\n🔍 PAYMENT AUTHORIZED STATE ANALYSIS:');
  console.log('================================================================================');
  console.log('Key Findings:');
  console.log('1. Balance field is the key indicator for payment lifecycle');
  console.log('2. "Incomplete" = Initial state (payment not processed)');
  console.log('3. "Authorized" = Payment authorized but not captured');
  console.log('4. "Completed" = Payment fully processed and captured');
  console.log('');
  console.log('To detect Payment Authorized state in your application:');
  console.log('- Check order.balance === "Authorized"');
  console.log('- This indicates payment gateway has authorized the payment');
  console.log('- Payment can still be captured or cancelled from this state');
  console.log('');
  console.log('API Call to check: getOrderDetails → details.balance');

  console.log('\n✅ Payment Authorized state test completed!');
  return { results, authorizedResults };
}

// Run the script
testPaymentAuthorizedState();
