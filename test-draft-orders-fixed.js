/**
 * Test Draft Orders via Curl - Fixed Version
 * Testing order creation with proper parameters for draft billing cycle
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

async function createDraftOrderFixed(paymentMethod, billingCycle, testName) {
  console.log(`\n🧪 Testing Draft Order (Fixed): ${testName}`);
  console.log('================================================================================');
  console.log(`Payment Method: ${paymentMethod}`);
  console.log(`Billing Cycle: ${billingCycle}`);

  try {
    const timestamp = Date.now();
    
    // Method 1: Try addOrder with proper item parameters
    console.log('📤 Method 1: addOrder with item parameters...');
    
    const orderParams1 = {
      call: 'addOrder',
      client_id: '113',
      'items[0][product_id]': '5',
      'items[0][domain]': '',
      'items[0][billingcycle]': billingCycle,
      'items[0][qty]': '1',
      payment_module: paymentMethod,
      notes: `Draft order test - ${testName} - ${timestamp}`
    };

    const orderResult1 = await makeHostBillApiCall(orderParams1);
    
    if (orderResult1.success) {
      console.log('✅ Method 1 successful:', orderResult1);
      return await analyzeCreatedOrder(orderResult1, testName, paymentMethod, billingCycle);
    } else {
      console.log('❌ Method 1 failed:', orderResult1.error);
    }

    // Method 2: Try createOrder
    console.log('📤 Method 2: createOrder...');
    
    const orderParams2 = {
      call: 'createOrder',
      client_id: '113',
      product_id: '5',
      domain: '',
      billingcycle: billingCycle,
      payment_module: paymentMethod,
      notes: `Draft order test - ${testName} - ${timestamp}`
    };

    const orderResult2 = await makeHostBillApiCall(orderParams2);
    
    if (orderResult2.success) {
      console.log('✅ Method 2 successful:', orderResult2);
      return await analyzeCreatedOrder(orderResult2, testName, paymentMethod, billingCycle);
    } else {
      console.log('❌ Method 2 failed:', orderResult2.error);
    }

    // Method 3: Try with different parameter structure
    console.log('📤 Method 3: Alternative parameter structure...');
    
    const orderParams3 = {
      call: 'addOrder',
      client_id: '113',
      product_id: '5',
      domain: '',
      billingcycle: billingCycle,
      payment_module: paymentMethod,
      qty: '1',
      notes: `Draft order test - ${testName} - ${timestamp}`,
      autosetup: '0'
    };

    const orderResult3 = await makeHostBillApiCall(orderParams3);
    
    if (orderResult3.success) {
      console.log('✅ Method 3 successful:', orderResult3);
      return await analyzeCreatedOrder(orderResult3, testName, paymentMethod, billingCycle);
    } else {
      console.log('❌ Method 3 failed:', orderResult3.error);
    }

    // Method 4: Try with our API (which works) but with draft billing cycle
    console.log('📤 Method 4: Using our working API with draft billing cycle...');
    
    const orderData = {
      customer: {
        firstName: testName.replace(/\s+/g, ''),
        lastName: "DraftTest",
        email: `${testName.toLowerCase().replace(/\s+/g, '.')}.draft.${timestamp}@test.com`,
        phone: "+420123456789",
        address: `${testName} Draft Street 123`,
        city: "Praha",
        postalCode: "11000",
        country: "CZ",
        company: `${testName} Draft s.r.o. ${timestamp}`
      },
      items: [{
        productId: "5",
        name: "VPS Start",
        quantity: 1,
        price: billingCycle === 'free' ? 0 : 299,
        cycle: billingCycle
      }],
      paymentMethod: paymentMethod,
      total: billingCycle === 'free' ? 0 : 897
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

    const orderResult4 = await new Promise((resolve, reject) => {
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

    if (orderResult4.success) {
      console.log('✅ Method 4 successful:', {
        orderId: orderResult4.orders[0].orderId,
        invoiceId: orderResult4.orders[0].invoiceId,
        amount: orderResult4.orders[0].totalAmount
      });
      
      return await analyzeCreatedOrder({
        order_id: orderResult4.orders[0].orderId,
        success: true
      }, testName, paymentMethod, billingCycle);
    } else {
      console.log('❌ Method 4 failed:', orderResult4.error);
    }

    return null;

  } catch (error) {
    console.error('❌ Draft order test failed:', error.message);
    return null;
  }
}

async function analyzeCreatedOrder(orderResult, testName, paymentMethod, billingCycle) {
  try {
    // Extract order ID from result
    let orderId = null;
    if (orderResult.order_id) {
      orderId = orderResult.order_id;
    } else if (orderResult.id) {
      orderId = orderResult.id;
    } else if (orderResult.details && orderResult.details.id) {
      orderId = orderResult.details.id;
    }

    if (!orderId) {
      console.log('⚠️ Could not extract order ID from result');
      return { testName, paymentMethod, billingCycle, success: false, error: 'No order ID' };
    }

    console.log(`📋 Analyzing created order ${orderId}...`);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get order details
    const orderDetails = await makeHostBillApiCall({
      call: 'getOrderDetails',
      id: orderId
    });

    if (!orderDetails.success) {
      console.log('❌ Failed to get order details:', orderDetails.error);
      return { testName, paymentMethod, billingCycle, orderId, success: false, error: orderDetails.error };
    }

    const details = orderDetails.details;
    const hosting = details.hosting[0];
    
    const analysis = {
      testName,
      paymentMethod,
      billingCycle,
      orderId: orderId,
      orderNumber: details.number,
      invoiceId: details.invoice_id,
      paymentModule: details.payment_module,
      module: details.module,
      gatewayId: details.metadata?.gateway_id,
      orderStatus: details.status,
      invStatus: details.invstatus,
      balance: details.balance,
      actualBillingCycle: hosting?.billingcycle,
      total: details.total,
      invTotal: details.invtotal,
      invCredit: details.invcredit,
      customerName: `${details.firstname} ${details.lastname}`,
      dateCreated: details.date_created,
      success: true
    };

    console.log('📊 Order Analysis:', {
      orderId: analysis.orderId,
      orderNumber: analysis.orderNumber,
      invoiceId: analysis.invoiceId,
      orderStatus: analysis.orderStatus,
      balance: analysis.balance,
      actualBillingCycle: analysis.actualBillingCycle,
      paymentModule: analysis.paymentModule,
      module: analysis.module
    });

    // Check for Payment Authorized indicators
    const isPaymentAuthorized = analysis.balance === 'Authorized' || 
                               analysis.invStatus === 'Authorized' ||
                               analysis.orderStatus === 'Authorized';

    const isDraft = analysis.orderStatus === 'Draft' || 
                   analysis.actualBillingCycle === 'Draft' ||
                   analysis.balance === 'Draft';

    const isFree = analysis.actualBillingCycle === 'Free' || 
                  analysis.total === '0';

    analysis.paymentAuthorized = isPaymentAuthorized;
    analysis.isDraft = isDraft;
    analysis.isFree = isFree;

    console.log('🎯 Status Analysis:', {
      paymentAuthorized: isPaymentAuthorized,
      isDraft: isDraft,
      isFree: isFree,
      requestedCycle: billingCycle,
      actualCycle: analysis.actualBillingCycle
    });

    if (isPaymentAuthorized) {
      console.log('🎉 PAYMENT AUTHORIZED STATE DETECTED!');
    }

    if (isDraft) {
      console.log('📝 DRAFT ORDER DETECTED!');
    }

    if (isFree) {
      console.log('🆓 FREE ORDER DETECTED!');
    }

    // Special check for draft/free billing cycles
    if (billingCycle.toLowerCase() === 'draft' && analysis.actualBillingCycle !== 'Draft') {
      console.log(`⚠️ Requested 'draft' but got '${analysis.actualBillingCycle}'`);
    }

    if (billingCycle.toLowerCase() === 'free' && analysis.actualBillingCycle !== 'Free') {
      console.log(`⚠️ Requested 'free' but got '${analysis.actualBillingCycle}'`);
    }

    return analysis;

  } catch (error) {
    console.error('❌ Order analysis failed:', error.message);
    return { testName, paymentMethod, billingCycle, success: false, error: error.message };
  }
}

async function testDraftOrdersFixed() {
  console.log('🚀 Testing Draft Orders via Curl - Fixed Version');
  console.log('================================================================================');
  console.log('Testing order creation with proper parameters for draft/free billing cycles');
  console.log('Looking for Payment Authorized state in draft/free orders');
  console.log('================================================================================');

  const draftTests = [
    // Draft billing cycle tests
    { paymentMethod: '0', billingCycle: 'draft', testName: 'Draft Credit Balance' },
    { paymentMethod: '10', billingCycle: 'draft', testName: 'Draft PayU' },
    
    // Free billing cycle tests
    { paymentMethod: '0', billingCycle: 'free', testName: 'Free Credit Balance' },
    { paymentMethod: '10', billingCycle: 'free', testName: 'Free PayU' },
    
    // OneTime tests
    { paymentMethod: '0', billingCycle: 'onetime', testName: 'OneTime Credit Balance' },
    { paymentMethod: '10', billingCycle: 'onetime', testName: 'OneTime PayU' }
  ];

  const results = [];
  const paymentAuthorizedOrders = [];
  const draftOrders = [];
  const freeOrders = [];

  for (const test of draftTests) {
    const result = await createDraftOrderFixed(test.paymentMethod, test.billingCycle, test.testName);
    
    if (result && result.success) {
      results.push(result);
      
      if (result.paymentAuthorized) {
        paymentAuthorizedOrders.push(result);
      }
      
      if (result.isDraft) {
        draftOrders.push(result);
      }
      
      if (result.isFree) {
        freeOrders.push(result);
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n📊 DRAFT ORDERS FIXED TEST SUMMARY');
  console.log('================================================================================');
  
  console.log(`✅ Total successful tests: ${results.length}`);
  console.log(`🎯 Payment Authorized orders: ${paymentAuthorizedOrders.length}`);
  console.log(`📝 Draft orders: ${draftOrders.length}`);
  console.log(`🆓 Free orders: ${freeOrders.length}`);

  if (paymentAuthorizedOrders.length > 0) {
    console.log('\n🎉 PAYMENT AUTHORIZED ORDERS FOUND:');
    console.log('================================================================================');
    
    paymentAuthorizedOrders.forEach(order => {
      console.log(`${order.testName}:`);
      console.log(`  Order: ${order.orderId}, Invoice: ${order.invoiceId}`);
      console.log(`  Payment Method: ${order.paymentMethod} → Module: ${order.paymentModule}`);
      console.log(`  Billing Cycle: ${order.billingCycle} → Actual: ${order.actualBillingCycle}`);
      console.log(`  Balance: ${order.balance}, Status: ${order.orderStatus}`);
      console.log('');
    });
  }

  // Detailed comparison
  console.log('\n📋 DETAILED COMPARISON TABLE:');
  console.log('================================================================================');
  console.log('Test Name | Order | Requested Cycle | Actual Cycle | Balance | Status | Authorized');
  console.log('----------|-------|-----------------|--------------|---------|--------|----------');
  
  results.forEach(order => {
    const testNameShort = order.testName.length > 15 ? order.testName.substring(0, 12) + '...' : order.testName;
    
    console.log(`${testNameShort.padEnd(15)} | ${order.orderId.toString().padEnd(5)} | ${order.billingCycle.padEnd(15)} | ${(order.actualBillingCycle || 'N/A').padEnd(12)} | ${order.balance.padEnd(7)} | ${order.orderStatus.padEnd(6)} | ${order.paymentAuthorized ? 'YES' : 'NO'}`);
  });

  console.log('\n🔍 KEY FINDINGS:');
  console.log('================================================================================');
  
  // Billing cycle mapping analysis
  const cycleMapping = {};
  results.forEach(order => {
    const key = `${order.billingCycle} → ${order.actualBillingCycle}`;
    if (!cycleMapping[key]) {
      cycleMapping[key] = 0;
    }
    cycleMapping[key]++;
  });

  console.log('Billing cycle mapping:');
  Object.keys(cycleMapping).forEach(mapping => {
    console.log(`  ${mapping}: ${cycleMapping[mapping]} orders`);
  });

  console.log('\nPayment Authorized detection:');
  console.log(`  Found in: ${paymentAuthorizedOrders.length} orders`);
  if (paymentAuthorizedOrders.length > 0) {
    console.log('  🎯 This confirms draft/free orders can show Payment Authorized state!');
  }

  console.log('\n✅ Draft orders fixed test completed!');
  return { results, paymentAuthorizedOrders, draftOrders, freeOrders };
}

// Run the script
testDraftOrdersFixed();
