/**
 * Test PayU and Following Module - Payment Authorized Investigation
 * Focus on PayU (ID 10) and the module used right after PayU in tests
 */

const http = require('http');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

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

async function getInvoiceDetails(invoiceId) {
  try {
    const invoiceResult = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/invoice/${invoiceId}`);
    return invoiceResult;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createOrderWithModule(paymentMethod, testName, moduleDescription) {
  console.log(`\n🧪 Testing ${moduleDescription}: ${testName}`);
  console.log('================================================================================');
  console.log(`Payment Method: ${paymentMethod}`);

  try {
    const timestamp = Date.now();
    
    const orderData = {
      customer: {
        firstName: testName.replace(/\s+/g, ''),
        lastName: "ModuleTest",
        email: `${testName.toLowerCase().replace(/\s+/g, '.')}.module.${timestamp}@test.com`,
        phone: "+420123456789",
        address: `${testName} Module Street 123`,
        city: "Praha",
        postalCode: "11000",
        country: "CZ",
        company: `${testName} Module s.r.o. ${timestamp}`
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

    console.log('📤 Creating order:', {
      customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
      email: orderData.customer.email,
      paymentMethod: paymentMethod,
      total: orderData.total
    });

    const orderResult = await makeRequest('POST', 'localhost', 3000, '/api/orders/create', orderData);
    
    if (!orderResult.success) {
      console.log('❌ Order creation failed:', orderResult.error);
      return null;
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

    // Get order details via HostBill API
    console.log('📋 Getting order details...');
    const orderDetails = await makeHostBillApiCall({
      call: 'getOrderDetails',
      id: order.orderId
    });

    if (!orderDetails.success) {
      console.log('❌ Failed to get order details:', orderDetails.error);
      return null;
    }

    const details = orderDetails.details;
    const hosting = details.hosting[0];
    
    const result = {
      testName,
      paymentMethod,
      moduleDescription,
      orderId: order.orderId,
      invoiceId: orderDetails.details.invoice_id,
      paymentModule: details.payment_module,
      module: details.module,
      gatewayId: details.metadata?.gateway_id,
      orderStatus: details.status,
      invStatus: details.invstatus,
      balance: details.balance,
      billingCycle: hosting?.billingcycle,
      total: details.total,
      invTotal: details.invtotal,
      invCredit: details.invcredit,
      customerName: `${details.firstname} ${details.lastname}`,
      dateCreated: details.date_created
    };

    console.log('📊 Order Details:', {
      orderId: result.orderId,
      invoiceId: result.invoiceId,
      paymentModule: result.paymentModule,
      module: result.module,
      gatewayId: result.gatewayId,
      orderStatus: result.orderStatus,
      balance: result.balance
    });

    // Get invoice details via our API
    console.log('💰 Getting invoice details...');
    const invoiceDetails = await getInvoiceDetails(result.invoiceId);
    
    if (invoiceDetails.success) {
      result.invoiceStatus = invoiceDetails.invoice.status;
      result.invoiceAmount = invoiceDetails.invoice.amount;
      result.invoiceCredit = invoiceDetails.invoice.credit;
      result.invoicePaymentMethod = invoiceDetails.invoice.paymentMethod;
      result.autoMarkedAsPaid = invoiceDetails.invoice.autoMarkedAsPaid;

      console.log('💰 Invoice Details:', {
        invoiceId: result.invoiceId,
        status: result.invoiceStatus,
        amount: result.invoiceAmount,
        credit: result.invoiceCredit,
        paymentMethod: result.invoicePaymentMethod,
        autoMarkedAsPaid: result.autoMarkedAsPaid
      });
    }

    // Check for Payment Authorized indicators
    const isPaymentAuthorized = result.balance === 'Authorized' || 
                               result.invStatus === 'Authorized' ||
                               result.orderStatus === 'Authorized';

    const isPaymentIncomplete = result.balance === 'Incomplete';
    const isPaymentCompleted = result.balance === 'Completed';
    const isPayU = result.paymentModule === '10' || result.module === 'payU';

    result.paymentAuthorized = isPaymentAuthorized;
    result.paymentIncomplete = isPaymentIncomplete;
    result.paymentCompleted = isPaymentCompleted;
    result.isPayU = isPayU;

    console.log('🎯 Analysis:', {
      paymentAuthorized: isPaymentAuthorized,
      paymentIncomplete: isPaymentIncomplete,
      paymentCompleted: isPaymentCompleted,
      isPayU: isPayU
    });

    if (isPaymentAuthorized) {
      console.log('🎉 PAYMENT AUTHORIZED STATE DETECTED!');
      console.log('   This module shows Payment Authorized status');
    } else if (isPaymentIncomplete) {
      console.log('⏳ Payment Incomplete - waiting for payment processing');
    } else if (isPaymentCompleted) {
      console.log('✅ Payment Completed - fully processed');
    }

    if (isPayU) {
      console.log('💳 PayU module confirmed');
    }

    return result;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

async function testPayUAndFollowingModule() {
  console.log('🚀 Testing PayU and Following Module - Payment Authorized Investigation');
  console.log('================================================================================');
  console.log('Focus on PayU (ID 10) and the module used right after PayU in tests');
  console.log('User says: "PayU module is always authorized, and then also the module used right after PayU"');
  console.log('================================================================================');

  const moduleTests = [
    // PayU tests
    { paymentMethod: "10", testName: "PayU Test 1", moduleDescription: "PayU Module (ID 10)" },
    { paymentMethod: "10", testName: "PayU Test 2", moduleDescription: "PayU Module (ID 10)" },
    
    // The module typically used after PayU in tests (Credit Balance)
    { paymentMethod: "0", testName: "Credit Balance Test 1", moduleDescription: "Credit Balance (ID 0) - After PayU" },
    { paymentMethod: "banktransfer", testName: "BankTransfer Test 1", moduleDescription: "BankTransfer - After PayU" },
    
    // ComGate (another common module)
    { paymentMethod: "comgate", testName: "ComGate Test 1", moduleDescription: "ComGate Module" },
    
    // Test sequence: PayU → Credit Balance → ComGate
    { paymentMethod: "10", testName: "PayU Sequence 1", moduleDescription: "PayU in Sequence" },
    { paymentMethod: "0", testName: "Credit Balance Sequence 1", moduleDescription: "Credit Balance after PayU" },
    { paymentMethod: "comgate", testName: "ComGate Sequence 1", moduleDescription: "ComGate after Credit Balance" }
  ];

  const results = [];
  const paymentAuthorizedOrders = [];
  const payuOrders = [];
  const creditBalanceOrders = [];

  for (const test of moduleTests) {
    const result = await createOrderWithModule(test.paymentMethod, test.testName, test.moduleDescription);
    
    if (result) {
      results.push(result);
      
      if (result.paymentAuthorized) {
        paymentAuthorizedOrders.push(result);
      }
      
      if (result.isPayU) {
        payuOrders.push(result);
      }
      
      if (result.paymentModule === '0') {
        creditBalanceOrders.push(result);
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n📊 PAYU AND FOLLOWING MODULE TEST SUMMARY');
  console.log('================================================================================');
  
  console.log(`✅ Total tests: ${results.length}`);
  console.log(`🎯 Payment Authorized orders: ${paymentAuthorizedOrders.length}`);
  console.log(`💳 PayU orders: ${payuOrders.length}`);
  console.log(`💰 Credit Balance orders: ${creditBalanceOrders.length}`);

  if (paymentAuthorizedOrders.length > 0) {
    console.log('\n🎉 PAYMENT AUTHORIZED ORDERS FOUND:');
    console.log('================================================================================');
    
    paymentAuthorizedOrders.forEach(order => {
      console.log(`${order.testName}:`);
      console.log(`  Module Description: ${order.moduleDescription}`);
      console.log(`  Payment Method: ${order.paymentMethod} → Module: ${order.paymentModule}`);
      console.log(`  Gateway ID: ${order.gatewayId}`);
      console.log(`  Order: ${order.orderId}, Invoice: ${order.invoiceId}`);
      console.log(`  Balance: ${order.balance}, Status: ${order.orderStatus}`);
      console.log('');
    });
  }

  // PayU analysis
  if (payuOrders.length > 0) {
    console.log('\n💳 PAYU ORDERS ANALYSIS:');
    console.log('================================================================================');
    
    payuOrders.forEach(order => {
      console.log(`${order.testName}:`);
      console.log(`  Order: ${order.orderId}, Invoice: ${order.invoiceId}`);
      console.log(`  Payment Module: ${order.paymentModule} (${order.module})`);
      console.log(`  Balance: ${order.balance}, Status: ${order.orderStatus}`);
      console.log(`  Payment Authorized: ${order.paymentAuthorized ? 'YES' : 'NO'}`);
      console.log('');
    });

    const payuAuthorized = payuOrders.filter(o => o.paymentAuthorized).length;
    console.log(`PayU Authorization Rate: ${payuAuthorized}/${payuOrders.length} (${Math.round(payuAuthorized/payuOrders.length*100)}%)`);
  }

  // Credit Balance analysis (module after PayU)
  if (creditBalanceOrders.length > 0) {
    console.log('\n💰 CREDIT BALANCE ORDERS ANALYSIS (Module after PayU):');
    console.log('================================================================================');
    
    creditBalanceOrders.forEach(order => {
      console.log(`${order.testName}:`);
      console.log(`  Order: ${order.orderId}, Invoice: ${order.invoiceId}`);
      console.log(`  Payment Module: ${order.paymentModule}`);
      console.log(`  Gateway ID: ${order.gatewayId}`);
      console.log(`  Balance: ${order.balance}, Status: ${order.orderStatus}`);
      console.log(`  Payment Authorized: ${order.paymentAuthorized ? 'YES' : 'NO'}`);
      console.log(`  Invoice Credit: ${order.invCredit || '0'} CZK`);
      console.log('');
    });

    const creditAuthorized = creditBalanceOrders.filter(o => o.paymentAuthorized).length;
    console.log(`Credit Balance Authorization Rate: ${creditAuthorized}/${creditBalanceOrders.length} (${Math.round(creditAuthorized/creditBalanceOrders.length*100)}%)`);
  }

  // Detailed comparison table
  console.log('\n📋 DETAILED COMPARISON TABLE:');
  console.log('================================================================================');
  console.log('Test Name | Order | Payment Module | Gateway | Balance | Status | Authorized | Credit');
  console.log('----------|-------|----------------|---------|---------|--------|------------|-------');
  
  results.forEach(order => {
    const testNameShort = order.testName.length > 12 ? order.testName.substring(0, 9) + '...' : order.testName;
    const moduleDisplay = order.module ? `${order.paymentModule} (${order.module})` : order.paymentModule;
    const creditDisplay = order.invCredit && order.invCredit !== '0' ? `${order.invCredit}` : 'None';
    
    console.log(`${testNameShort.padEnd(12)} | ${order.orderId.toString().padEnd(5)} | ${moduleDisplay.padEnd(14)} | ${(order.gatewayId || 'N/A').padEnd(7)} | ${order.balance.padEnd(7)} | ${order.orderStatus.padEnd(6)} | ${order.paymentAuthorized ? 'YES' : 'NO'.padEnd(3)} | ${creditDisplay}`);
  });

  // Pattern analysis
  console.log('\n🔍 PATTERN ANALYSIS:');
  console.log('================================================================================');
  
  // Group by payment module
  const moduleGroups = {};
  results.forEach(order => {
    const moduleKey = order.module ? `${order.paymentModule} (${order.module})` : order.paymentModule;
    if (!moduleGroups[moduleKey]) {
      moduleGroups[moduleKey] = [];
    }
    moduleGroups[moduleKey].push(order);
  });

  console.log('Orders grouped by payment module:');
  Object.keys(moduleGroups).forEach(module => {
    const orders = moduleGroups[module];
    const authorizedCount = orders.filter(o => o.paymentAuthorized).length;
    console.log(`  ${module}: ${orders.length} orders, ${authorizedCount} authorized (${Math.round(authorizedCount/orders.length*100)}%)`);
  });

  // Sequence analysis
  console.log('\nSequence analysis (PayU → Credit Balance → ComGate):');
  const sequenceOrders = results.filter(o => o.testName.includes('Sequence'));
  sequenceOrders.forEach(order => {
    console.log(`  ${order.testName}: ${order.paymentMethod} → Balance: ${order.balance}, Authorized: ${order.paymentAuthorized ? 'YES' : 'NO'}`);
  });

  console.log('\n🎯 KEY FINDINGS:');
  console.log('================================================================================');
  console.log('1. PayU Module Analysis:');
  console.log(`   - PayU orders created: ${payuOrders.length}`);
  console.log(`   - PayU orders authorized: ${payuOrders.filter(o => o.paymentAuthorized).length}`);
  console.log('   - PayU always shows specific balance/status pattern');
  console.log('');
  console.log('2. Module After PayU Analysis:');
  console.log(`   - Credit Balance orders: ${creditBalanceOrders.length}`);
  console.log(`   - Credit Balance authorized: ${creditBalanceOrders.filter(o => o.paymentAuthorized).length}`);
  console.log('   - Pattern correlation with PayU usage');
  console.log('');
  console.log('3. Payment Authorized Detection:');
  console.log(`   - Total authorized: ${paymentAuthorizedOrders.length}/${results.length}`);
  console.log('   - Specific modules showing authorization pattern');

  console.log('\n✅ PayU and following module test completed!');
  return { results, paymentAuthorizedOrders, payuOrders, creditBalanceOrders };
}

// Run the script
testPayUAndFollowingModule();
