/**
 * Test Cancel Order - Payment Authorized Investigation
 * Create order and then cancel it to see if it shows as "Payment Authorized"
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

async function createAndCancelOrder(paymentMethod, testName) {
  console.log(`\n🧪 Testing Cancel Order: ${testName}`);
  console.log('================================================================================');
  console.log(`Payment Method: ${paymentMethod}`);

  try {
    const timestamp = Date.now();
    
    // 1. Create order
    console.log('1️⃣ Creating order...');
    
    const orderData = {
      customer: {
        firstName: testName.replace(/\s+/g, ''),
        lastName: "CancelTest",
        email: `${testName.toLowerCase().replace(/\s+/g, '.')}.cancel.${timestamp}@test.com`,
        phone: "+420123456789",
        address: `${testName} Cancel Street 123`,
        city: "Praha",
        postalCode: "11000",
        country: "CZ",
        company: `${testName} Cancel s.r.o. ${timestamp}`
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

    // Create order via our API
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

    // 2. Check initial status
    console.log('2️⃣ Checking initial order status...');
    
    const initialDetails = await makeHostBillApiCall({
      call: 'getOrderDetails',
      id: order.orderId
    });

    if (initialDetails.success) {
      const details = initialDetails.details;
      const hosting = details.hosting[0];
      
      console.log('📊 Initial Status:', {
        orderId: order.orderId,
        orderStatus: details.status,
        invStatus: details.invstatus,
        balance: details.balance,
        hostingStatus: hosting?.status,
        paymentModule: details.payment_module
      });
    }

    // 3. Cancel the order
    console.log('3️⃣ Cancelling order...');
    
    const cancelResult = await makeHostBillApiCall({
      call: 'cancelOrder',
      id: order.orderId,
      reason: `Test cancellation - ${testName}`
    });

    if (cancelResult.success) {
      console.log('✅ Order cancelled successfully');
    } else {
      console.log('❌ Order cancellation failed:', cancelResult.error);
      
      // Try alternative cancellation methods
      console.log('🔄 Trying alternative cancellation methods...');
      
      const altMethods = [
        { call: 'setOrderStatus', id: order.orderId, status: 'Cancelled' },
        { call: 'updateOrder', id: order.orderId, status: 'Cancelled' },
        { call: 'terminateOrder', id: order.orderId }
      ];

      for (const method of altMethods) {
        console.log(`🔄 Trying: ${JSON.stringify(method)}`);
        
        const result = await makeHostBillApiCall(method);
        
        if (result.success) {
          console.log('✅ Alternative cancellation successful');
          break;
        } else {
          console.log(`❌ ${Array.isArray(result.error) ? result.error.join(', ') : result.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Wait for cancellation to process
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Check status after cancellation
    console.log('4️⃣ Checking status after cancellation...');
    
    const finalDetails = await makeHostBillApiCall({
      call: 'getOrderDetails',
      id: order.orderId
    });

    if (finalDetails.success) {
      const details = finalDetails.details;
      const hosting = details.hosting[0];
      
      const finalStatus = {
        orderId: order.orderId,
        orderStatus: details.status,
        invStatus: details.invstatus,
        balance: details.balance,
        hostingStatus: hosting?.status,
        paymentModule: details.payment_module,
        invCredit: details.invcredit
      };

      console.log('📊 Final Status:', finalStatus);

      // 5. Analysis
      console.log('5️⃣ Cancellation Analysis:');
      console.log('================================================================================');
      
      const isCancelled = details.status === 'Cancelled' || hosting?.status === 'Cancelled';
      const hasCompletedBalance = details.balance === 'Completed';
      const hasCredit = details.invcredit && details.invcredit !== '0';

      console.log(`✅ Order Cancelled: ${isCancelled}`);
      console.log(`✅ Balance Completed: ${hasCompletedBalance}`);
      console.log(`✅ Has Invoice Credit: ${hasCredit} (${details.invcredit || '0'} CZK)`);

      if (isCancelled && hasCompletedBalance) {
        console.log('\n🎯 PATTERN MATCH!');
        console.log('   This matches the pattern of orders 529-549:');
        console.log('   - Status: Cancelled');
        console.log('   - Balance: Completed');
        console.log('   - This might be what shows as "Payment Authorized" in UI');
      }

      return {
        testName,
        paymentMethod,
        orderId: order.orderId,
        invoiceId: order.invoiceId,
        initialStatus: initialDetails.success ? {
          status: initialDetails.details.status,
          balance: initialDetails.details.balance
        } : null,
        finalStatus: finalStatus,
        cancelled: isCancelled,
        completedBalance: hasCompletedBalance,
        hasCredit: hasCredit
      };
    }

    return null;

  } catch (error) {
    console.error('❌ Cancel order test failed:', error.message);
    return null;
  }
}

async function testCancelOrderPaymentAuthorized() {
  console.log('🚀 Testing Cancel Order - Payment Authorized Investigation');
  console.log('================================================================================');
  console.log('Creating orders and then cancelling them to see if they show as "Payment Authorized"');
  console.log('Testing hypothesis: Cancelled orders with Completed balance = Payment Authorized in UI');
  console.log('================================================================================');

  const cancelTests = [
    { paymentMethod: '0', testName: 'Cancel Credit Balance' },
    { paymentMethod: '10', testName: 'Cancel PayU' },
    { paymentMethod: 'banktransfer', testName: 'Cancel BankTransfer' }
  ];

  const results = [];
  const cancelledOrders = [];

  for (const test of cancelTests) {
    const result = await createAndCancelOrder(test.paymentMethod, test.testName);
    
    if (result) {
      results.push(result);
      
      if (result.cancelled && result.completedBalance) {
        cancelledOrders.push(result);
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n📊 CANCEL ORDER TEST SUMMARY');
  console.log('================================================================================');
  
  console.log(`✅ Total tests: ${results.length}`);
  console.log(`🎯 Cancelled with Completed balance: ${cancelledOrders.length}`);

  if (cancelledOrders.length > 0) {
    console.log('\n🎯 CANCELLED ORDERS WITH COMPLETED BALANCE:');
    console.log('================================================================================');
    
    cancelledOrders.forEach(order => {
      console.log(`${order.testName}:`);
      console.log(`  Order: ${order.orderId}, Invoice: ${order.invoiceId}`);
      console.log(`  Payment Method: ${order.paymentMethod}`);
      console.log(`  Final Status: ${order.finalStatus.orderStatus}`);
      console.log(`  Final Balance: ${order.finalStatus.balance}`);
      console.log(`  Invoice Credit: ${order.finalStatus.invCredit || '0'} CZK`);
      console.log('');
    });
  }

  // Comparison with orders 529-549
  console.log('\n🔍 COMPARISON WITH ORDERS 529-549:');
  console.log('================================================================================');
  console.log('Orders 529-549 pattern:');
  console.log('  - Status: Cancelled');
  console.log('  - Balance: Completed');
  console.log('  - User sees: "Payment Authorized"');
  console.log('');
  console.log('New cancelled orders pattern:');
  results.forEach(order => {
    if (order.cancelled && order.completedBalance) {
      console.log(`  Order ${order.orderId}: Status=Cancelled, Balance=Completed`);
      console.log('    → This should show as "Payment Authorized" in HostBill UI');
    }
  });

  console.log('\n🎯 HYPOTHESIS CONFIRMATION:');
  console.log('================================================================================');
  console.log('If new cancelled orders show as "Payment Authorized" in HostBill admin:');
  console.log('  ✅ CONFIRMED: Cancelled + Completed = Payment Authorized in UI');
  console.log('  ✅ This explains why orders 529-549 show as Payment Authorized');
  console.log('  ✅ API shows technical state, UI shows business interpretation');
  console.log('');
  console.log('To verify:');
  console.log('  1. Check HostBill admin for newly created cancelled orders');
  console.log('  2. Look for "Payment Authorized" or similar status');
  console.log('  3. Compare with orders 529-549 in admin interface');

  console.log('\n✅ Cancel order test completed!');
  return { results, cancelledOrders };
}

// Run the script
testCancelOrderPaymentAuthorized();
