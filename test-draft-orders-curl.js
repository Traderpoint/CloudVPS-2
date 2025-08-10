/**
 * Test Draft Orders via Curl - Draft Billing Cycle Investigation
 * Testing order creation with draft billing cycle and various payment methods
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

async function createDraftOrder(paymentMethod, billingCycle, testName) {
  console.log(`\n🧪 Testing Draft Order: ${testName}`);
  console.log('================================================================================');
  console.log(`Payment Method: ${paymentMethod}`);
  console.log(`Billing Cycle: ${billingCycle}`);

  try {
    const timestamp = Date.now();
    
    // Create draft order via HostBill API
    const orderParams = {
      call: 'addOrder',
      client_id: '113', // Using existing client
      product_id: '5', // VPS Start product
      domain: '',
      billingcycle: billingCycle,
      payment_module: paymentMethod,
      promocode: '',
      notes: `Draft order test - ${testName} - ${timestamp}`,
      status: 'Draft' // Try to create as draft
    };

    console.log('📤 Creating draft order with params:', {
      client_id: orderParams.client_id,
      product_id: orderParams.product_id,
      billingcycle: orderParams.billingcycle,
      payment_module: orderParams.payment_module,
      status: orderParams.status
    });

    const orderResult = await makeHostBillApiCall(orderParams);
    
    if (!orderResult.success) {
      console.log('❌ Draft order creation failed:', orderResult.error);
      
      // Try without status parameter
      console.log('🔄 Retrying without status parameter...');
      delete orderParams.status;
      
      const retryResult = await makeHostBillApiCall(orderParams);
      
      if (!retryResult.success) {
        console.log('❌ Retry also failed:', retryResult.error);
        return null;
      } else {
        console.log('✅ Order created on retry:', retryResult);
        return await analyzeCreatedOrder(retryResult, testName, paymentMethod, billingCycle);
      }
    } else {
      console.log('✅ Draft order created successfully:', orderResult);
      return await analyzeCreatedOrder(orderResult, testName, paymentMethod, billingCycle);
    }

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
    await new Promise(resolve => setTimeout(resolve, 2000));

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
      isFree: isFree
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

    return analysis;

  } catch (error) {
    console.error('❌ Order analysis failed:', error.message);
    return { testName, paymentMethod, billingCycle, success: false, error: error.message };
  }
}

async function testDraftOrders() {
  console.log('🚀 Testing Draft Orders via Curl');
  console.log('================================================================================');
  console.log('Testing order creation with draft billing cycle and various payment methods');
  console.log('Looking for Payment Authorized state in draft orders');
  console.log('================================================================================');

  const draftTests = [
    // Draft billing cycle tests
    { paymentMethod: '0', billingCycle: 'draft', testName: 'Draft Credit Balance' },
    { paymentMethod: '10', billingCycle: 'draft', testName: 'Draft PayU' },
    { paymentMethod: 'banktransfer', billingCycle: 'draft', testName: 'Draft BankTransfer' },
    { paymentMethod: 'comgate', billingCycle: 'draft', testName: 'Draft ComGate' },
    
    // Free billing cycle tests
    { paymentMethod: '0', billingCycle: 'free', testName: 'Free Credit Balance' },
    { paymentMethod: '10', billingCycle: 'free', testName: 'Free PayU' },
    { paymentMethod: 'banktransfer', billingCycle: 'free', testName: 'Free BankTransfer' },
    
    // Other potential draft variations
    { paymentMethod: '0', billingCycle: 'onetime', testName: 'OneTime Credit Balance' },
    { paymentMethod: '10', billingCycle: 'onetime', testName: 'OneTime PayU' },
    
    // Test with different case
    { paymentMethod: '0', billingCycle: 'Draft', testName: 'Draft (Capital) Credit Balance' },
    { paymentMethod: '10', billingCycle: 'Free', testName: 'Free (Capital) PayU' }
  ];

  const results = [];
  const paymentAuthorizedOrders = [];
  const draftOrders = [];
  const freeOrders = [];

  for (const test of draftTests) {
    const result = await createDraftOrder(test.paymentMethod, test.billingCycle, test.testName);
    
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
  console.log('\n📊 DRAFT ORDERS TEST SUMMARY');
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

  if (draftOrders.length > 0) {
    console.log('\n📝 DRAFT ORDERS FOUND:');
    console.log('================================================================================');
    
    draftOrders.forEach(order => {
      console.log(`${order.testName}:`);
      console.log(`  Order: ${order.orderId}, Status: ${order.orderStatus}`);
      console.log(`  Billing Cycle: ${order.billingCycle} → Actual: ${order.actualBillingCycle}`);
      console.log(`  Balance: ${order.balance}`);
      console.log('');
    });
  }

  if (freeOrders.length > 0) {
    console.log('\n🆓 FREE ORDERS FOUND:');
    console.log('================================================================================');
    
    freeOrders.forEach(order => {
      console.log(`${order.testName}:`);
      console.log(`  Order: ${order.orderId}, Total: ${order.total}`);
      console.log(`  Billing Cycle: ${order.billingCycle} → Actual: ${order.actualBillingCycle}`);
      console.log(`  Balance: ${order.balance}`);
      console.log('');
    });
  }

  // Detailed comparison
  console.log('\n📋 DETAILED COMPARISON TABLE:');
  console.log('================================================================================');
  console.log('Test Name | Order | Billing Cycle | Actual Cycle | Balance | Status | Payment Module');
  console.log('----------|-------|---------------|--------------|---------|--------|---------------');
  
  results.forEach(order => {
    const testNameShort = order.testName.length > 15 ? order.testName.substring(0, 12) + '...' : order.testName;
    const moduleDisplay = order.module ? `${order.paymentModule} (${order.module})` : order.paymentModule;
    
    console.log(`${testNameShort.padEnd(15)} | ${order.orderId.toString().padEnd(5)} | ${order.billingCycle.padEnd(13)} | ${(order.actualBillingCycle || 'N/A').padEnd(12)} | ${order.balance.padEnd(7)} | ${order.orderStatus.padEnd(6)} | ${moduleDisplay}`);
  });

  console.log('\n🔍 KEY FINDINGS:');
  console.log('================================================================================');
  console.log('1. Draft billing cycle behavior:');
  console.log(`   - Successfully created: ${results.filter(r => r.billingCycle.toLowerCase().includes('draft')).length} orders`);
  console.log(`   - Actually marked as draft: ${draftOrders.length} orders`);
  console.log('');
  console.log('2. Free billing cycle behavior:');
  console.log(`   - Successfully created: ${results.filter(r => r.billingCycle.toLowerCase().includes('free')).length} orders`);
  console.log(`   - Actually marked as free: ${freeOrders.length} orders`);
  console.log('');
  console.log('3. Payment Authorized detection:');
  console.log(`   - Found in: ${paymentAuthorizedOrders.length} orders`);
  console.log('   - This might be the key to finding Payment Authorized state!');

  console.log('\n✅ Draft orders test completed!');
  return { results, paymentAuthorizedOrders, draftOrders, freeOrders };
}

// Run the script
testDraftOrders();
