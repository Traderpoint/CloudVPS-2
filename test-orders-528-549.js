/**
 * Test Orders 528-549 - Payment Authorized Investigation
 * Testing all orders from 528-549 to identify Payment Authorized state
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

async function getInvoiceDetails(invoiceId) {
  try {
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/hostbill/invoice/${invoiceId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    return new Promise((resolve, reject) => {
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

      req.end();
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkOrderForPaymentAuthorized(orderId) {
  console.log(`\n🔍 Checking Order ${orderId}:`);
  console.log('================================================================================');

  try {
    // Get order details via HostBill API
    const orderDetails = await makeHostBillApiCall({
      call: 'getOrderDetails',
      id: orderId
    });

    if (!orderDetails.success) {
      console.log(`❌ Failed to get order ${orderId} details:`, orderDetails.error);
      return null;
    }

    const details = orderDetails.details;
    const hosting = details.hosting[0];
    
    const orderInfo = {
      orderId: orderId,
      orderNumber: details.number,
      invoiceId: details.invoice_id,
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
      company: details.companyname,
      dateCreated: details.date_created
    };

    console.log('📋 Basic Info:', {
      orderId: orderInfo.orderId,
      orderNumber: orderInfo.orderNumber,
      invoiceId: orderInfo.invoiceId,
      customerName: orderInfo.customerName,
      dateCreated: orderInfo.dateCreated
    });

    console.log('💳 Payment Info:', {
      paymentModule: orderInfo.paymentModule,
      module: orderInfo.module,
      gatewayId: orderInfo.gatewayId
    });

    console.log('📊 Status Info:', {
      orderStatus: orderInfo.orderStatus,
      invStatus: orderInfo.invStatus,
      balance: orderInfo.balance,
      billingCycle: orderInfo.billingCycle
    });

    console.log('💰 Financial Info:', {
      total: orderInfo.total,
      invTotal: orderInfo.invTotal,
      invCredit: orderInfo.invCredit
    });

    // Get invoice details via our API
    if (orderInfo.invoiceId && orderInfo.invoiceId !== '0') {
      const invoiceDetails = await getInvoiceDetails(orderInfo.invoiceId);
      
      if (invoiceDetails.success) {
        orderInfo.invoiceStatus = invoiceDetails.invoice.status;
        orderInfo.invoiceAmount = invoiceDetails.invoice.amount;
        orderInfo.invoiceCredit = invoiceDetails.invoice.credit;
        orderInfo.invoicePaymentMethod = invoiceDetails.invoice.paymentMethod;
        orderInfo.autoMarkedAsPaid = invoiceDetails.invoice.autoMarkedAsPaid;

        console.log('💳 Invoice API Info:', {
          invoiceStatus: orderInfo.invoiceStatus,
          invoiceAmount: orderInfo.invoiceAmount,
          invoiceCredit: orderInfo.invoiceCredit,
          autoMarkedAsPaid: orderInfo.autoMarkedAsPaid
        });
      }
    }

    // Check for Payment Authorized indicators
    const isPaymentAuthorized = orderInfo.balance === 'Authorized' || 
                               orderInfo.invStatus === 'Authorized' ||
                               orderInfo.orderStatus === 'Authorized';

    const isPaymentIncomplete = orderInfo.balance === 'Incomplete';
    const isPaymentCompleted = orderInfo.balance === 'Completed';
    const isCreditBalance = orderInfo.paymentModule === '0' && orderInfo.invCredit !== '0';
    const isPayU = orderInfo.paymentModule === '10' || orderInfo.module === 'payU';

    console.log('🎯 Analysis:', {
      paymentAuthorized: isPaymentAuthorized,
      paymentIncomplete: isPaymentIncomplete,
      paymentCompleted: isPaymentCompleted,
      creditBalance: isCreditBalance,
      payU: isPayU
    });

    if (isPaymentAuthorized) {
      console.log('🎉 PAYMENT AUTHORIZED STATE DETECTED!');
    } else if (isPaymentIncomplete) {
      console.log('⏳ Payment Incomplete - waiting for payment processing');
    } else if (isPaymentCompleted) {
      console.log('✅ Payment Completed - fully processed');
    }

    if (isCreditBalance) {
      console.log('💰 Credit Balance order detected');
    }

    if (isPayU) {
      console.log('💳 PayU order detected');
    }

    orderInfo.paymentAuthorized = isPaymentAuthorized;
    orderInfo.paymentIncomplete = isPaymentIncomplete;
    orderInfo.paymentCompleted = isPaymentCompleted;
    orderInfo.creditBalance = isCreditBalance;
    orderInfo.payU = isPayU;

    return orderInfo;

  } catch (error) {
    console.error(`❌ Error checking order ${orderId}:`, error.message);
    return null;
  }
}

async function testOrders528to549() {
  console.log('🚀 Testing Orders 528-549 - Payment Authorized Investigation');
  console.log('================================================================================');
  console.log('Testing all orders from 528-549 to identify Payment Authorized state');
  console.log('According to user: Orders 529-549 are Payment Authorized, but 528 is not');
  console.log('================================================================================');

  // Generate order IDs from 528 to 549
  const orderIds = [];
  for (let i = 528; i <= 549; i++) {
    orderIds.push(i);
  }

  const results = [];
  const paymentAuthorizedOrders = [];
  const paymentIncompleteOrders = [];
  const paymentCompletedOrders = [];
  const creditBalanceOrders = [];
  const payuOrders = [];

  for (const orderId of orderIds) {
    const orderInfo = await checkOrderForPaymentAuthorized(orderId);
    
    if (orderInfo) {
      results.push(orderInfo);
      
      // Categorize orders
      if (orderInfo.paymentAuthorized) {
        paymentAuthorizedOrders.push(orderInfo);
      }
      
      if (orderInfo.paymentIncomplete) {
        paymentIncompleteOrders.push(orderInfo);
      }
      
      if (orderInfo.paymentCompleted) {
        paymentCompletedOrders.push(orderInfo);
      }
      
      if (orderInfo.creditBalance) {
        creditBalanceOrders.push(orderInfo);
      }
      
      if (orderInfo.payU) {
        payuOrders.push(orderInfo);
      }
    }
    
    // Wait between requests to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📊 ORDERS 528-549 ANALYSIS SUMMARY');
  console.log('================================================================================');
  
  console.log(`✅ Total orders checked: ${results.length}`);
  console.log(`🎯 Payment Authorized orders: ${paymentAuthorizedOrders.length}`);
  console.log(`⏳ Payment Incomplete orders: ${paymentIncompleteOrders.length}`);
  console.log(`✅ Payment Completed orders: ${paymentCompletedOrders.length}`);
  console.log(`💰 Credit Balance orders: ${creditBalanceOrders.length}`);
  console.log(`💳 PayU orders: ${payuOrders.length}`);

  // Detailed analysis
  console.log('\n📋 DETAILED COMPARISON TABLE:');
  console.log('================================================================================');
  console.log('Order | Balance    | Inv Status | Payment Module | Gateway | Credit | Customer');
  console.log('------|------------|------------|----------------|---------|--------|----------');
  
  results.forEach(order => {
    const moduleDisplay = order.module ? `${order.paymentModule} (${order.module})` : order.paymentModule;
    const creditDisplay = order.invCredit !== '0' ? `${order.invCredit}` : 'None';
    const customerDisplay = order.customerName.length > 15 ? order.customerName.substring(0, 12) + '...' : order.customerName;
    
    console.log(`${order.orderId.toString().padEnd(5)} | ${order.balance.padEnd(10)} | ${order.invStatus.padEnd(10)} | ${moduleDisplay.padEnd(14)} | ${(order.gatewayId || 'N/A').padEnd(7)} | ${creditDisplay.padEnd(6)} | ${customerDisplay}`);
  });

  // User's claim verification
  console.log('\n🔍 USER CLAIM VERIFICATION:');
  console.log('================================================================================');
  console.log('User claim: "Orders 529-549 are Payment Authorized, but 528 is not"');
  console.log('');

  // Check order 528
  const order528 = results.find(o => o.orderId === 528);
  if (order528) {
    console.log(`Order 528: Balance="${order528.balance}", Payment Authorized=${order528.paymentAuthorized}`);
  } else {
    console.log('Order 528: Not found or failed to load');
  }

  // Check orders 529-549
  const orders529to549 = results.filter(o => o.orderId >= 529 && o.orderId <= 549);
  const authorizedCount529to549 = orders529to549.filter(o => o.paymentAuthorized).length;
  
  console.log(`Orders 529-549: ${authorizedCount529to549}/${orders529to549.length} are Payment Authorized`);

  if (order528 && !order528.paymentAuthorized && authorizedCount529to549 === orders529to549.length) {
    console.log('✅ USER CLAIM VERIFIED: Order 528 is NOT Payment Authorized, Orders 529-549 ARE Payment Authorized');
  } else if (order528 && !order528.paymentAuthorized && authorizedCount529to549 > 0) {
    console.log('⚠️ PARTIAL VERIFICATION: Order 528 is NOT Payment Authorized, but only some of 529-549 are Payment Authorized');
  } else {
    console.log('❌ USER CLAIM NOT VERIFIED: Different pattern found');
  }

  // Pattern analysis
  console.log('\n🔍 PATTERN ANALYSIS:');
  console.log('================================================================================');
  
  // Group by balance status
  const balanceGroups = {};
  results.forEach(order => {
    if (!balanceGroups[order.balance]) {
      balanceGroups[order.balance] = [];
    }
    balanceGroups[order.balance].push(order.orderId);
  });

  console.log('Orders grouped by balance status:');
  Object.keys(balanceGroups).forEach(balance => {
    console.log(`  ${balance}: Orders ${balanceGroups[balance].join(', ')}`);
  });

  // Group by payment module
  const moduleGroups = {};
  results.forEach(order => {
    const moduleKey = order.module ? `${order.paymentModule} (${order.module})` : order.paymentModule;
    if (!moduleGroups[moduleKey]) {
      moduleGroups[moduleKey] = [];
    }
    moduleGroups[moduleKey].push(order.orderId);
  });

  console.log('\nOrders grouped by payment module:');
  Object.keys(moduleGroups).forEach(module => {
    console.log(`  ${module}: Orders ${moduleGroups[module].join(', ')}`);
  });

  console.log('\n✅ Orders 528-549 investigation completed!');
  return { 
    results, 
    paymentAuthorizedOrders, 
    paymentIncompleteOrders, 
    paymentCompletedOrders, 
    creditBalanceOrders, 
    payuOrders 
  };
}

// Run the script
testOrders528to549();
