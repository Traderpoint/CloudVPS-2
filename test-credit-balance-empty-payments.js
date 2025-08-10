/**
 * Test Credit Balance with Empty/Undefined Payment Methods
 * Tests undefined, null, and empty string payment methods with Credit Balance
 */

const http = require('http');

async function makeRequest(method, hostname, port, path, data) {
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
          resolve({ error: 'Invalid JSON', raw: responseData });
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

async function getOrderDetails(orderId) {
  const https = require('https');
  const querystring = require('querystring');
  
  const orderParams = querystring.stringify({
    api_id: 'adcdebb0e3b6f583052d',
    api_key: '341697c41aeb1c842f0d',
    call: 'getOrderDetails',
    id: orderId
  });

  return new Promise((resolve, reject) => {
    const req = https.request('https://vps.kabel1it.cz/admin/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(orderParams)
      },
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Invalid JSON', raw: data });
        }
      });
    });
    
    req.on('error', reject);
    req.write(orderParams);
    req.end();
  });
}

async function getInvoiceDetails(invoiceId) {
  try {
    const invoiceResult = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/invoice/${invoiceId}`);
    return invoiceResult;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testCreditBalancePayment(paymentMethod, testName, description) {
  console.log(`\n🧪 Testing Credit Balance: ${testName}`);
  console.log('================================================================================');
  console.log(`Description: ${description}`);
  console.log(`Payment Method: ${paymentMethod === undefined ? 'undefined' : paymentMethod === null ? 'null' : `"${paymentMethod}"`}`);
  console.log('Expected: Credit Balance (Module 0) with banktransfer gateway');

  try {
    const timestamp = Date.now();
    
    const orderData = {
      customer: {
        firstName: "CreditBalance",
        lastName: testName.replace(/\s+/g, ''),
        email: `credit.balance.${testName.toLowerCase().replace(/\s+/g, '.')}.${timestamp}@testcustomer.com`,
        phone: "+420111222333",
        address: `Credit Balance ${testName} Street 456`,
        city: "Brno",
        postalCode: "60200",
        country: "CZ",
        company: `Credit Balance ${testName} s.r.o. ${timestamp}`
      },
      items: [{
        productId: "1",
        name: "VPS Start",
        quantity: 1,
        price: 299,
        cycle: "q" // Quarterly billing cycle
      }],
      total: 897 // 299 * 3 months for quarterly
    };

    // Add payment method only if it's not undefined
    if (paymentMethod !== undefined) {
      orderData.paymentMethod = paymentMethod;
    }

    console.log('📤 Creating Credit Balance order:', {
      customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
      email: orderData.customer.email,
      paymentMethod: paymentMethod === undefined ? 'undefined (not set)' : paymentMethod === null ? 'null' : paymentMethod,
      total: orderData.total,
      expectedModule: '0 (Credit Balance)'
    });

    const orderResult = await makeRequest('POST', 'localhost', 3000, '/api/orders/create', orderData);
    
    if (!orderResult.success) {
      console.log('❌ Order creation failed:', orderResult.error);
      return { success: false, error: orderResult.error };
    }

    const order = orderResult.orders[0];
    console.log('✅ Order created successfully:', {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: order.totalAmount
    });

    // Wait for HostBill to process
    console.log('⏳ Waiting for HostBill to process...');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Get order details
    console.log('2️⃣ Getting order details...');
    const orderDetails = await getOrderDetails(order.orderId);

    if (orderDetails.success && orderDetails.details) {
      const hosting = orderDetails.details.hosting[0];
      
      const result = {
        success: true,
        testName: testName,
        paymentMethodInput: paymentMethod,
        orderId: order.orderId,
        invoiceId: orderDetails.details.invoice_id,
        invStatus: orderDetails.details.invstatus,
        invCredit: orderDetails.details.invcredit,
        billingCycle: hosting.billingcycle,
        total: hosting.total,
        paymentModule: orderDetails.details.payment_module,
        module: orderDetails.details.module,
        gatewayId: orderDetails.details.metadata?.gateway_id,
        clientId: orderDetails.details.client_id,
        balance: orderDetails.details.balance
      };

      console.log('📋 Order details:', {
        orderId: result.orderId,
        invoiceId: result.invoiceId,
        invStatus: result.invStatus,
        invCredit: result.invCredit,
        billingCycle: result.billingCycle,
        paymentModule: result.paymentModule,
        module: result.module,
        gatewayId: result.gatewayId,
        balance: result.balance
      });

      // Get invoice details
      console.log('3️⃣ Getting invoice details...');
      const invoiceDetails = await getInvoiceDetails(result.invoiceId);
      
      if (invoiceDetails.success) {
        console.log('💰 Invoice details:', {
          invoiceId: result.invoiceId,
          status: invoiceDetails.invoice.status,
          amount: invoiceDetails.invoice.amount,
          credit: invoiceDetails.invoice.credit,
          currency: invoiceDetails.invoice.currency,
          autoMarkedAsPaid: invoiceDetails.invoice.autoMarkedAsPaid,
          paymentMethod: invoiceDetails.invoice.paymentMethod
        });

        result.invoiceStatus = invoiceDetails.invoice.status;
        result.invoiceAmount = invoiceDetails.invoice.amount;
        result.invoiceCredit = invoiceDetails.invoice.credit;
      }

      // Evaluation
      console.log('\n🎯 CREDIT BALANCE EVALUATION:');
      console.log('================================================================================');
      
      const isCreditBalance = result.paymentModule === '0';
      const isBankTransferGateway = result.gatewayId === 'banktransfer';
      const isQuarterly = result.billingCycle === 'Quarterly';
      const isUnpaid = result.invStatus === 'Unpaid';
      const hasZeroCredit = result.invCredit === '0';
      
      console.log(`✅ Payment Module: ${isCreditBalance ? 'CORRECT' : 'INCORRECT'} (${result.paymentModule} - ${isCreditBalance ? 'Credit Balance' : 'Other'})`);
      console.log(`✅ Gateway ID: ${isBankTransferGateway ? 'CORRECT' : 'DIFFERENT'} (${result.gatewayId})`);
      console.log(`✅ Billing Cycle: ${isQuarterly ? 'PRESERVED' : 'MODIFIED'} (${result.billingCycle})`);
      console.log(`✅ Invoice Status: ${isUnpaid ? 'UNPAID (NEW LOGIC)' : 'PAID (OLD LOGIC)'} (${result.invStatus})`);
      console.log(`✅ Invoice Credit: ${hasZeroCredit ? 'ZERO (NEGATIVE APPLIED)' : 'POSITIVE (NO NEGATIVE)'} (${result.invCredit} CZK)`);
      console.log(`✅ Balance: ${result.balance}`);

      if (isCreditBalance && isQuarterly && isUnpaid && hasZeroCredit) {
        console.log('\n🎉 SUCCESS: Credit Balance configured correctly!');
        console.log('   ✅ Credit Balance payment method (Module 0)');
        console.log('   ✅ Quarterly billing cycle preserved');
        console.log('   ✅ Invoice marked as Unpaid');
        console.log('   ✅ Negative credit applied (zero balance)');
        console.log('   ✅ Ready for manual payment processing');
      } else {
        console.log('\n⚠️ PARTIAL: Some configuration issues detected');
      }

      return result;
    } else {
      console.log('❌ Failed to get order details:', orderDetails.error);
      return { success: false, error: orderDetails.error };
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testCreditBalanceEmptyPayments() {
  console.log('🚀 Testing Credit Balance with Empty/Undefined Payment Methods');
  console.log('================================================================================');
  console.log('Testing Credit Balance behavior with various empty payment method inputs');
  console.log('All should result in Credit Balance (Module 0) with banktransfer gateway');
  console.log('================================================================================');

  const creditBalanceTests = [
    {
      paymentMethod: undefined,
      testName: "Undefined Payment",
      description: "No paymentMethod property in request (should default to Credit Balance)"
    },
    {
      paymentMethod: null,
      testName: "Null Payment",
      description: "paymentMethod explicitly set to null (should default to Credit Balance)"
    },
    {
      paymentMethod: "",
      testName: "Empty String Payment",
      description: "paymentMethod set to empty string (should default to Credit Balance)"
    }
  ];

  const results = [];

  for (const test of creditBalanceTests) {
    const result = await testCreditBalancePayment(test.paymentMethod, test.testName, test.description);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n📊 CREDIT BALANCE EMPTY PAYMENTS SUMMARY');
  console.log('================================================================================');
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);

  console.log(`✅ Successful tests: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Failed tests: ${failedTests.length}/${results.length}`);

  if (successfulTests.length > 0) {
    console.log('\n✅ SUCCESSFUL CREDIT BALANCE TESTS:');
    console.log('================================================================================');
    
    successfulTests.forEach(result => {
      const inputDisplay = result.paymentMethodInput === undefined ? 'undefined' : 
                           result.paymentMethodInput === null ? 'null' : 
                           `"${result.paymentMethodInput}"`;
      
      console.log(`${result.testName}:`);
      console.log(`  Input: ${inputDisplay}`);
      console.log(`  Order: ${result.orderId}, Invoice: ${result.invoiceId}`);
      console.log(`  Payment Module: ${result.paymentModule} (Credit Balance)`);
      console.log(`  Gateway ID: ${result.gatewayId}`);
      console.log(`  Status: ${result.invStatus}, Credit: ${result.invCredit} CZK`);
      console.log(`  Billing Cycle: ${result.billingCycle}`);
      console.log(`  Balance: ${result.balance}`);
      console.log('');
    });
  }

  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    console.log('================================================================================');
    
    failedTests.forEach(result => {
      console.log(`${result.testName}: ${result.error}`);
    });
  }

  // Final analysis
  console.log('\n🔍 CREDIT BALANCE BEHAVIOR ANALYSIS:');
  console.log('================================================================================');
  
  const allCreditBalance = successfulTests.every(r => r.paymentModule === '0');
  const allBankTransfer = successfulTests.every(r => r.gatewayId === 'banktransfer');
  const allQuarterly = successfulTests.every(r => r.billingCycle === 'Quarterly');
  const allUnpaid = successfulTests.every(r => r.invStatus === 'Unpaid');
  const allZeroCredit = successfulTests.every(r => r.invCredit === '0');

  console.log(`Payment Module Consistency: ${allCreditBalance ? '✅ All Credit Balance (0)' : '❌ Mixed modules'}`);
  console.log(`Gateway ID Consistency: ${allBankTransfer ? '✅ All banktransfer' : '❌ Mixed gateways'}`);
  console.log(`Billing Cycle Consistency: ${allQuarterly ? '✅ All Quarterly' : '❌ Mixed cycles'}`);
  console.log(`Invoice Status Consistency: ${allUnpaid ? '✅ All Unpaid' : '❌ Mixed statuses'}`);
  console.log(`Credit Consistency: ${allZeroCredit ? '✅ All Zero Credit' : '❌ Mixed credits'}`);

  if (allCreditBalance && allBankTransfer && allQuarterly && allUnpaid && allZeroCredit) {
    console.log('\n🎉 PERFECT: All empty payment methods correctly default to Credit Balance!');
    console.log('   ✅ Consistent Credit Balance mapping (Module 0)');
    console.log('   ✅ Consistent banktransfer gateway');
    console.log('   ✅ Quarterly billing cycles preserved');
    console.log('   ✅ All invoices marked as Unpaid');
    console.log('   ✅ Negative credit logic applied consistently');
  } else {
    console.log('\n⚠️ INCONSISTENT: Some variations in Credit Balance behavior detected');
  }

  console.log('\n✅ Credit Balance empty payments test completed!');
  return results;
}

// Run the script
testCreditBalanceEmptyPayments();
