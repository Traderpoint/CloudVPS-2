/**
 * Check Orders 541-549 - Payment Authorized Investigation
 * Checking specific orders where Payment Authorized state is visible
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

async function checkOrderDetails(orderId) {
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

    console.log('📋 Order Details:', {
      orderId: orderInfo.orderId,
      orderNumber: orderInfo.orderNumber,
      invoiceId: orderInfo.invoiceId,
      paymentModule: orderInfo.paymentModule,
      module: orderInfo.module,
      gatewayId: orderInfo.gatewayId
    });

    console.log('📊 Status Information:', {
      orderStatus: orderInfo.orderStatus,
      invStatus: orderInfo.invStatus,
      balance: orderInfo.balance,
      billingCycle: orderInfo.billingCycle
    });

    console.log('💰 Financial Information:', {
      total: orderInfo.total,
      invTotal: orderInfo.invTotal,
      invCredit: orderInfo.invCredit
    });

    console.log('👤 Customer Information:', {
      customerName: orderInfo.customerName,
      company: orderInfo.company,
      dateCreated: orderInfo.dateCreated
    });

    // Get invoice details via our API
    if (orderInfo.invoiceId && orderInfo.invoiceId !== '0') {
      console.log('\n💳 Getting invoice details via our API...');
      
      const invoiceDetails = await getInvoiceDetails(orderInfo.invoiceId);
      
      if (invoiceDetails.success) {
        console.log('💳 Invoice Details:', {
          invoiceId: orderInfo.invoiceId,
          status: invoiceDetails.invoice.status,
          amount: invoiceDetails.invoice.amount,
          credit: invoiceDetails.invoice.credit,
          paymentMethod: invoiceDetails.invoice.paymentMethod,
          autoMarkedAsPaid: invoiceDetails.invoice.autoMarkedAsPaid
        });

        orderInfo.invoiceStatus = invoiceDetails.invoice.status;
        orderInfo.invoiceAmount = invoiceDetails.invoice.amount;
        orderInfo.invoiceCredit = invoiceDetails.invoice.credit;
        orderInfo.invoicePaymentMethod = invoiceDetails.invoice.paymentMethod;
        orderInfo.autoMarkedAsPaid = invoiceDetails.invoice.autoMarkedAsPaid;
      }
    }

    // Check for Payment Authorized indicators
    const isPaymentAuthorized = orderInfo.balance === 'Authorized' || 
                               orderInfo.invStatus === 'Authorized' ||
                               orderInfo.orderStatus === 'Authorized';

    if (isPaymentAuthorized) {
      console.log('\n🎯 PAYMENT AUTHORIZED STATE DETECTED!');
      console.log('   This order shows Payment Authorized status');
    } else if (orderInfo.balance === 'Incomplete') {
      console.log('\n⏳ Payment Incomplete - waiting for payment processing');
    } else if (orderInfo.balance === 'Completed') {
      console.log('\n✅ Payment Completed - fully processed');
    }

    // Check for Credit Balance usage
    if (orderInfo.paymentModule === '0' && orderInfo.invCredit !== '0') {
      console.log('\n💰 CREDIT BALANCE DETECTED!');
      console.log(`   Invoice Credit: ${orderInfo.invCredit} CZK`);
      console.log('   This order used Credit Balance payment method');
    }

    return orderInfo;

  } catch (error) {
    console.error(`❌ Error checking order ${orderId}:`, error.message);
    return null;
  }
}

async function checkOrders541to549() {
  console.log('🚀 Checking Orders 541-549 - Payment Authorized Investigation');
  console.log('================================================================================');
  console.log('Investigating orders where Payment Authorized state is visible');
  console.log('Focusing on PayU orders and Credit Balance orders');
  console.log('================================================================================');

  const orderIds = [541, 542, 543, 544, 545, 546, 547, 548, 549];
  const results = [];
  const paymentAuthorizedOrders = [];
  const creditBalanceOrders = [];
  const payuOrders = [];

  for (const orderId of orderIds) {
    const orderInfo = await checkOrderDetails(orderId);
    
    if (orderInfo) {
      results.push(orderInfo);
      
      // Categorize orders
      if (orderInfo.balance === 'Authorized' || 
          orderInfo.invStatus === 'Authorized' ||
          orderInfo.orderStatus === 'Authorized') {
        paymentAuthorizedOrders.push(orderInfo);
      }
      
      if (orderInfo.paymentModule === '0' && orderInfo.invCredit !== '0') {
        creditBalanceOrders.push(orderInfo);
      }
      
      if (orderInfo.paymentModule === '10' || orderInfo.module === 'payU') {
        payuOrders.push(orderInfo);
      }
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n📊 ORDERS 541-549 ANALYSIS SUMMARY');
  console.log('================================================================================');
  
  console.log(`✅ Total orders checked: ${results.length}`);
  console.log(`🎯 Payment Authorized orders: ${paymentAuthorizedOrders.length}`);
  console.log(`💰 Credit Balance orders: ${creditBalanceOrders.length}`);
  console.log(`💳 PayU orders: ${payuOrders.length}`);

  if (paymentAuthorizedOrders.length > 0) {
    console.log('\n🎯 PAYMENT AUTHORIZED ORDERS:');
    console.log('================================================================================');
    
    paymentAuthorizedOrders.forEach(order => {
      console.log(`Order ${order.orderId}:`);
      console.log(`  Payment Module: ${order.paymentModule} (${order.module})`);
      console.log(`  Gateway: ${order.gatewayId}`);
      console.log(`  Balance: ${order.balance}`);
      console.log(`  Invoice Status: ${order.invStatus}`);
      console.log(`  Customer: ${order.customerName}`);
      console.log('');
    });
  }

  if (creditBalanceOrders.length > 0) {
    console.log('\n💰 CREDIT BALANCE ORDERS:');
    console.log('================================================================================');
    
    creditBalanceOrders.forEach(order => {
      console.log(`Order ${order.orderId}:`);
      console.log(`  Payment Module: ${order.paymentModule}`);
      console.log(`  Gateway: ${order.gatewayId}`);
      console.log(`  Balance: ${order.balance}`);
      console.log(`  Invoice Status: ${order.invStatus}`);
      console.log(`  Invoice Credit: ${order.invCredit} CZK`);
      console.log(`  Auto Marked as Paid: ${order.autoMarkedAsPaid}`);
      console.log(`  Customer: ${order.customerName}`);
      console.log('');
    });
  }

  if (payuOrders.length > 0) {
    console.log('\n💳 PAYU ORDERS:');
    console.log('================================================================================');
    
    payuOrders.forEach(order => {
      console.log(`Order ${order.orderId}:`);
      console.log(`  Payment Module: ${order.paymentModule} (${order.module})`);
      console.log(`  Gateway: ${order.gatewayId}`);
      console.log(`  Balance: ${order.balance}`);
      console.log(`  Invoice Status: ${order.invStatus}`);
      console.log(`  Customer: ${order.customerName}`);
      console.log('');
    });
  }

  // Detailed comparison
  console.log('\n📋 DETAILED COMPARISON TABLE:');
  console.log('================================================================================');
  console.log('Order | Payment Module | Gateway | Balance | Invoice Status | Credit | Customer');
  console.log('------|----------------|---------|---------|----------------|--------|----------');
  
  results.forEach(order => {
    const moduleDisplay = order.module ? `${order.paymentModule} (${order.module})` : order.paymentModule;
    const creditDisplay = order.invCredit !== '0' ? `${order.invCredit} CZK` : 'None';
    
    console.log(`${order.orderId.toString().padEnd(5)} | ${moduleDisplay.padEnd(14)} | ${(order.gatewayId || 'N/A').padEnd(7)} | ${order.balance.padEnd(7)} | ${order.invStatus.padEnd(14)} | ${creditDisplay.padEnd(6)} | ${order.customerName}`);
  });

  console.log('\n🔍 KEY FINDINGS:');
  console.log('================================================================================');
  console.log('1. Payment Authorized state analysis:');
  console.log(`   - Found in ${paymentAuthorizedOrders.length} orders`);
  console.log('   - Typically appears with specific payment gateways');
  console.log('');
  console.log('2. Credit Balance usage analysis:');
  console.log(`   - Found in ${creditBalanceOrders.length} orders`);
  console.log('   - Shows non-zero invoice credit values');
  console.log('');
  console.log('3. PayU gateway analysis:');
  console.log(`   - Found in ${payuOrders.length} orders`);
  console.log('   - Payment Module 10 with payU module');

  console.log('\n✅ Orders 541-549 investigation completed!');
  return { results, paymentAuthorizedOrders, creditBalanceOrders, payuOrders };
}

// Run the script
checkOrders541to549();
