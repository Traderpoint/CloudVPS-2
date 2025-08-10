/**
 * Test Payment Modules with Curl - Payment Authorized State Investigation
 * Testing various payment modules to find "Payment Authorized" state
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
    if (stderr) {
      console.warn('Curl stderr:', stderr);
    }
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Curl error:', error.message);
    return { error: error.message };
  }
}

async function createOrderWithPaymentMethod(paymentMethod, testName) {
  console.log(`\n🧪 Testing Payment Module: ${testName}`);
  console.log('================================================================================');
  console.log(`Payment Method: ${paymentMethod}`);

  try {
    const timestamp = Date.now();
    
    // Create order via our API
    const orderData = {
      customer: {
        firstName: testName.replace(/\s+/g, ''),
        lastName: "PaymentTest",
        email: `${testName.toLowerCase().replace(/\s+/g, '.')}.${timestamp}@paymenttest.com`,
        phone: "+420123456789",
        address: `${testName} Payment Street 123`,
        city: "Praha",
        postalCode: "11000",
        country: "CZ",
        company: `${testName} Payment s.r.o. ${timestamp}`
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

    // Get order details via HostBill API
    console.log('🔍 Getting order details via HostBill API...');
    const orderDetails = await makeHostBillApiCall({
      call: 'getOrderDetails',
      id: order.orderId
    });

    if (!orderDetails.success) {
      console.log('❌ Failed to get order details:', orderDetails.error);
      return null;
    }

    const hosting = orderDetails.details.hosting[0];
    
    const result = {
      testName: testName,
      paymentMethodInput: paymentMethod,
      orderId: order.orderId,
      invoiceId: orderDetails.details.invoice_id,
      paymentModule: orderDetails.details.payment_module,
      module: orderDetails.details.module,
      gatewayId: orderDetails.details.metadata?.gateway_id,
      invStatus: orderDetails.details.invstatus,
      invCredit: orderDetails.details.invcredit,
      billingCycle: hosting.billingcycle,
      balance: orderDetails.details.balance
    };

    console.log('📋 Order details:', {
      orderId: result.orderId,
      invoiceId: result.invoiceId,
      paymentModule: result.paymentModule,
      module: result.module,
      gatewayId: result.gatewayId,
      invStatus: result.invStatus,
      balance: result.balance
    });

    // Get invoice details via HostBill API
    console.log('💰 Getting invoice details via HostBill API...');
    const invoiceDetails = await makeHostBillApiCall({
      call: 'getInvoiceDetails',
      id: result.invoiceId
    });

    if (invoiceDetails.success && invoiceDetails.invoice) {
      result.invoiceStatus = invoiceDetails.invoice.status;
      result.invoiceTotal = invoiceDetails.invoice.total;
      result.invoiceCredit = invoiceDetails.invoice.credit;
      result.invoicePaymentModule = invoiceDetails.invoice.payment_module;
      result.invoiceTransactions = invoiceDetails.transactions || [];
      
      console.log('💰 Invoice details:', {
        invoiceId: result.invoiceId,
        status: result.invoiceStatus,
        total: result.invoiceTotal,
        credit: result.invoiceCredit,
        paymentModule: result.invoicePaymentModule,
        transactionCount: result.invoiceTransactions.length
      });
    }

    // Check for payment authorization status
    console.log('🔐 Checking payment authorization status...');
    
    // Try to get payment gateway status
    const gatewayStatus = await makeHostBillApiCall({
      call: 'getPaymentGatewayStatus',
      order_id: result.orderId
    });

    if (gatewayStatus.success) {
      result.gatewayStatus = gatewayStatus;
      console.log('🔐 Gateway status:', gatewayStatus);
    } else {
      console.log('⚠️ Gateway status not available:', gatewayStatus.error);
    }

    // Try to get order lifecycle/status
    const orderStatus = await makeHostBillApiCall({
      call: 'getOrderStatus',
      id: result.orderId
    });

    if (orderStatus.success) {
      result.orderStatus = orderStatus;
      console.log('📊 Order status:', orderStatus);
    } else {
      console.log('⚠️ Order status not available:', orderStatus.error);
    }

    // Check if payment is authorized
    const isPaymentAuthorized = result.balance === 'Authorized' || 
                               result.invStatus === 'Authorized' ||
                               (result.gatewayStatus && result.gatewayStatus.status === 'Authorized') ||
                               (result.orderStatus && result.orderStatus.status === 'Authorized');

    result.paymentAuthorized = isPaymentAuthorized;

    console.log(`🎯 Payment Authorized: ${isPaymentAuthorized ? 'YES' : 'NO'}`);
    
    if (isPaymentAuthorized) {
      console.log('🎉 FOUND PAYMENT AUTHORIZED STATE!');
      console.log('   This payment method supports Payment Authorized status');
    }

    return result;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

async function testPaymentModules() {
  console.log('🚀 Testing Payment Modules for Payment Authorized State');
  console.log('================================================================================');
  console.log('Investigating which payment modules support "Payment Authorized" status');
  console.log('================================================================================');

  const paymentModuleTests = [
    { paymentMethod: "10", testName: "PayU Gateway" },
    { paymentMethod: "comgate", testName: "ComGate Gateway" },
    { paymentMethod: "banktransfer", testName: "Bank Transfer" },
    { paymentMethod: "0", testName: "Credit Balance" },
    { paymentMethod: "", testName: "Empty Payment" },
    { paymentMethod: "paypal", testName: "PayPal Gateway" },
    { paymentMethod: "stripe", testName: "Stripe Gateway" },
    { paymentMethod: "2checkout", testName: "2Checkout Gateway" }
  ];

  const results = [];
  const authorizedResults = [];

  for (const test of paymentModuleTests) {
    const result = await createOrderWithPaymentMethod(test.paymentMethod, test.testName);
    
    if (result) {
      results.push(result);
      
      if (result.paymentAuthorized) {
        authorizedResults.push(result);
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n📊 PAYMENT MODULES TEST SUMMARY');
  console.log('================================================================================');
  
  console.log(`✅ Total tests: ${results.length}`);
  console.log(`🔐 Payment Authorized found: ${authorizedResults.length}`);

  if (authorizedResults.length > 0) {
    console.log('\n🎉 PAYMENT MODULES WITH AUTHORIZED STATE:');
    console.log('================================================================================');
    
    authorizedResults.forEach(result => {
      console.log(`${result.testName}:`);
      console.log(`  Payment Method: ${result.paymentMethodInput}`);
      console.log(`  Payment Module: ${result.paymentModule}`);
      console.log(`  Gateway ID: ${result.gatewayId}`);
      console.log(`  Order: ${result.orderId}, Invoice: ${result.invoiceId}`);
      console.log(`  Balance: ${result.balance}`);
      console.log(`  Invoice Status: ${result.invStatus}`);
      console.log('');
    });
  } else {
    console.log('\n⚠️ NO PAYMENT AUTHORIZED STATE FOUND');
    console.log('Payment Authorized might require specific gateway configuration or different API calls');
  }

  // All results
  console.log('\n📋 ALL TEST RESULTS:');
  console.log('================================================================================');
  
  results.forEach(result => {
    console.log(`${result.testName}:`);
    console.log(`  Input: ${result.paymentMethodInput} → Module: ${result.paymentModule}`);
    console.log(`  Gateway: ${result.gatewayId}, Balance: ${result.balance}`);
    console.log(`  Invoice Status: ${result.invStatus}, Authorized: ${result.paymentAuthorized ? 'YES' : 'NO'}`);
  });

  console.log('\n✅ Payment modules test completed!');
  return { results, authorizedResults };
}

// Run the script
testPaymentModules();
