/**
 * Check Orders After Time - Monitor Balance Changes
 * Check if newly created orders change from Incomplete to Completed/Authorized over time
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

async function checkOrderStatus(orderId, orderName) {
  console.log(`\n🔍 Checking Order ${orderId} (${orderName}):`);
  
  try {
    const orderDetails = await makeHostBillApiCall({
      call: 'getOrderDetails',
      id: orderId
    });

    if (!orderDetails.success) {
      console.log(`❌ Failed to get order ${orderId}:`, orderDetails.error);
      return null;
    }

    const details = orderDetails.details;
    const hosting = details.hosting[0];
    
    const status = {
      orderId: orderId,
      orderName: orderName,
      orderStatus: details.status,
      invStatus: details.invstatus,
      balance: details.balance,
      paymentModule: details.payment_module,
      module: details.module,
      gatewayId: details.metadata?.gateway_id,
      hostingStatus: hosting?.status,
      invCredit: details.invcredit,
      total: details.total
    };

    console.log('📊 Current Status:', {
      balance: status.balance,
      orderStatus: status.orderStatus,
      invStatus: status.invStatus,
      paymentModule: status.paymentModule,
      module: status.module,
      gatewayId: status.gatewayId
    });

    // Check for changes
    const isPaymentAuthorized = status.balance === 'Authorized' || 
                               status.invStatus === 'Authorized' ||
                               status.orderStatus === 'Authorized';

    const isCompleted = status.balance === 'Completed';
    const isCancelled = status.orderStatus === 'Cancelled';
    const hasCredit = status.invCredit && status.invCredit !== '0';

    if (isPaymentAuthorized) {
      console.log('🎉 PAYMENT AUTHORIZED STATE DETECTED!');
    } else if (isCompleted) {
      console.log('✅ Balance is now Completed');
    } else if (isCancelled) {
      console.log('❌ Order has been Cancelled');
    } else {
      console.log('⏳ Still Incomplete - no change yet');
    }

    if (hasCredit) {
      console.log(`💰 Invoice Credit: ${status.invCredit} CZK`);
    }

    status.paymentAuthorized = isPaymentAuthorized;
    status.completed = isCompleted;
    status.cancelled = isCancelled;
    status.hasCredit = hasCredit;

    return status;

  } catch (error) {
    console.error(`❌ Error checking order ${orderId}:`, error.message);
    return null;
  }
}

async function checkOrdersAfterTime() {
  console.log('🚀 Checking Orders After Time - Monitor Balance Changes');
  console.log('================================================================================');
  console.log('Checking if newly created orders (603-610) have changed status over time');
  console.log('Looking for transition from Incomplete to Completed/Authorized');
  console.log('================================================================================');

  // Recently created orders from previous test
  const ordersToCheck = [
    { id: 603, name: 'PayU Test 1', type: 'PayU' },
    { id: 604, name: 'PayU Test 2', type: 'PayU' },
    { id: 605, name: 'Credit Balance Test 1', type: 'Credit Balance' },
    { id: 606, name: 'BankTransfer Test 1', type: 'BankTransfer' },
    { id: 607, name: 'ComGate Test 1', type: 'ComGate' },
    { id: 608, name: 'PayU Sequence 1', type: 'PayU' },
    { id: 609, name: 'Credit Balance Sequence 1', type: 'Credit Balance' },
    { id: 610, name: 'ComGate Sequence 1', type: 'ComGate' }
  ];

  const results = [];
  const changedOrders = [];
  const paymentAuthorizedOrders = [];
  const completedOrders = [];

  console.log('⏰ Current time:', new Date().toISOString());
  console.log('📋 Checking orders created approximately 10-15 minutes ago...');

  for (const order of ordersToCheck) {
    const status = await checkOrderStatus(order.id, order.name);
    
    if (status) {
      status.type = order.type;
      results.push(status);
      
      // Check for changes from initial "Incomplete" state
      if (status.balance !== 'Incomplete') {
        changedOrders.push(status);
      }
      
      if (status.paymentAuthorized) {
        paymentAuthorizedOrders.push(status);
      }
      
      if (status.completed) {
        completedOrders.push(status);
      }
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📊 ORDERS STATUS CHECK SUMMARY');
  console.log('================================================================================');
  
  console.log(`✅ Orders checked: ${results.length}`);
  console.log(`🔄 Orders changed from Incomplete: ${changedOrders.length}`);
  console.log(`🎯 Payment Authorized orders: ${paymentAuthorizedOrders.length}`);
  console.log(`✅ Completed orders: ${completedOrders.length}`);

  if (changedOrders.length > 0) {
    console.log('\n🔄 ORDERS THAT CHANGED STATUS:');
    console.log('================================================================================');
    
    changedOrders.forEach(order => {
      console.log(`${order.orderName} (${order.type}):`);
      console.log(`  Order: ${order.orderId}`);
      console.log(`  Balance: Incomplete → ${order.balance}`);
      console.log(`  Status: ${order.orderStatus}`);
      console.log(`  Payment Module: ${order.paymentModule}`);
      console.log(`  Has Credit: ${order.hasCredit} (${order.invCredit || '0'} CZK)`);
      console.log('');
    });
  } else {
    console.log('\n⏳ NO STATUS CHANGES DETECTED');
    console.log('All orders still show balance: "Incomplete"');
  }

  if (paymentAuthorizedOrders.length > 0) {
    console.log('\n🎉 PAYMENT AUTHORIZED ORDERS FOUND:');
    console.log('================================================================================');
    
    paymentAuthorizedOrders.forEach(order => {
      console.log(`${order.orderName} (${order.type}):`);
      console.log(`  Order: ${order.orderId}`);
      console.log(`  Balance: ${order.balance}`);
      console.log(`  Status: ${order.orderStatus}`);
      console.log(`  Payment Module: ${order.paymentModule} (${order.module})`);
      console.log('');
    });
  }

  // Comparison with old orders pattern
  console.log('\n🔍 COMPARISON WITH OLD ORDERS PATTERN:');
  console.log('================================================================================');
  console.log('Old orders 529-549 pattern (according to user):');
  console.log('  - Status: Cancelled');
  console.log('  - Balance: Completed');
  console.log('  - Shows as: "Payment Authorized" in UI');
  console.log('');
  console.log('New orders 603-610 current pattern:');
  
  // Group by balance status
  const balanceGroups = {};
  results.forEach(order => {
    if (!balanceGroups[order.balance]) {
      balanceGroups[order.balance] = [];
    }
    balanceGroups[order.balance].push(order.orderId);
  });

  Object.keys(balanceGroups).forEach(balance => {
    console.log(`  Balance "${balance}": Orders ${balanceGroups[balance].join(', ')}`);
  });

  // Type analysis
  console.log('\n📋 ANALYSIS BY ORDER TYPE:');
  console.log('================================================================================');
  
  const typeGroups = {};
  results.forEach(order => {
    if (!typeGroups[order.type]) {
      typeGroups[order.type] = [];
    }
    typeGroups[order.type].push(order);
  });

  Object.keys(typeGroups).forEach(type => {
    const orders = typeGroups[type];
    const authorizedCount = orders.filter(o => o.paymentAuthorized).length;
    const completedCount = orders.filter(o => o.completed).length;
    const incompleteCount = orders.filter(o => o.balance === 'Incomplete').length;
    
    console.log(`${type} orders (${orders.length} total):`);
    console.log(`  Incomplete: ${incompleteCount}`);
    console.log(`  Completed: ${completedCount}`);
    console.log(`  Authorized: ${authorizedCount}`);
    console.log(`  Order IDs: ${orders.map(o => o.orderId).join(', ')}`);
    console.log('');
  });

  console.log('🎯 KEY FINDINGS:');
  console.log('================================================================================');
  console.log('1. Time Factor Analysis:');
  if (changedOrders.length > 0) {
    console.log('   ✅ Some orders changed status over time');
    console.log('   ✅ Time is a factor in order processing');
  } else {
    console.log('   ❌ No orders changed status yet');
    console.log('   ❌ May need more time or different trigger');
  }
  console.log('');
  console.log('2. PayU Module Analysis:');
  const payuOrders = results.filter(o => o.type === 'PayU');
  const payuAuthorized = payuOrders.filter(o => o.paymentAuthorized).length;
  console.log(`   PayU orders: ${payuOrders.length}`);
  console.log(`   PayU authorized: ${payuAuthorized}`);
  console.log(`   PayU authorization rate: ${payuOrders.length > 0 ? Math.round(payuAuthorized/payuOrders.length*100) : 0}%`);
  console.log('');
  console.log('3. Next Steps:');
  console.log('   - Check these orders again in 30-60 minutes');
  console.log('   - Compare with HostBill admin interface');
  console.log('   - Look for batch processing or cron job triggers');

  console.log('\n✅ Orders status check completed!');
  return { results, changedOrders, paymentAuthorizedOrders, completedOrders };
}

// Run the script
checkOrdersAfterTime();
