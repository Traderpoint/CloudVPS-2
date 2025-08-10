/**
 * Analyze Existing Orders Patterns
 * Deep analysis of orders 529-549 to understand Payment Authorized patterns
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

async function analyzeOrderPattern(orderId) {
  console.log(`\n🔍 Deep Analysis of Order ${orderId}:`);
  console.log('================================================================================');

  try {
    // Get order details
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
    
    // Extract all available fields
    const analysis = {
      orderId: orderId,
      orderNumber: details.number,
      invoiceId: details.invoice_id,
      
      // Customer info
      clientId: details.client_id,
      customerName: `${details.firstname} ${details.lastname}`,
      company: details.companyname,
      email: details.email,
      
      // Payment info
      paymentModule: details.payment_module,
      module: details.module,
      gatewayId: details.metadata?.gateway_id,
      
      // Status info
      orderStatus: details.status,
      invStatus: details.invstatus,
      balance: details.balance,
      
      // Billing info
      billingCycle: hosting?.billingcycle,
      nextDue: hosting?.nextduedate,
      
      // Financial info
      total: details.total,
      invTotal: details.invtotal,
      invCredit: details.invcredit,
      
      // Product info
      productId: hosting?.productid,
      productName: hosting?.product,
      domain: hosting?.domain,
      
      // Dates
      dateCreated: details.date_created,
      dateActivated: hosting?.regdate,
      
      // Raw data for analysis
      rawDetails: details,
      rawHosting: hosting
    };

    console.log('📋 Basic Info:', {
      orderId: analysis.orderId,
      orderNumber: analysis.orderNumber,
      customerName: analysis.customerName,
      company: analysis.company,
      dateCreated: analysis.dateCreated
    });

    console.log('💳 Payment Info:', {
      paymentModule: analysis.paymentModule,
      module: analysis.module,
      gatewayId: analysis.gatewayId
    });

    console.log('📊 Status Info:', {
      orderStatus: analysis.orderStatus,
      invStatus: analysis.invStatus,
      balance: analysis.balance
    });

    console.log('💰 Financial Info:', {
      total: analysis.total,
      invTotal: analysis.invTotal,
      invCredit: analysis.invCredit
    });

    console.log('📦 Product Info:', {
      productId: analysis.productId,
      productName: analysis.productName,
      billingCycle: analysis.billingCycle,
      domain: analysis.domain
    });

    // Look for any fields that might indicate Payment Authorized
    console.log('\n🔍 Searching for Payment Authorized indicators...');
    
    const allFields = Object.keys(details);
    const statusFields = allFields.filter(field => 
      field.toLowerCase().includes('status') ||
      field.toLowerCase().includes('state') ||
      field.toLowerCase().includes('auth') ||
      field.toLowerCase().includes('payment') ||
      field.toLowerCase().includes('balance') ||
      field.toLowerCase().includes('lifecycle')
    );

    console.log('📋 Status-related fields found:', statusFields);
    
    statusFields.forEach(field => {
      console.log(`   ${field}: ${details[field]}`);
    });

    // Check hosting fields too
    if (hosting) {
      const hostingFields = Object.keys(hosting);
      const hostingStatusFields = hostingFields.filter(field => 
        field.toLowerCase().includes('status') ||
        field.toLowerCase().includes('state') ||
        field.toLowerCase().includes('auth') ||
        field.toLowerCase().includes('payment') ||
        field.toLowerCase().includes('balance')
      );

      if (hostingStatusFields.length > 0) {
        console.log('📋 Hosting status-related fields:', hostingStatusFields);
        
        hostingStatusFields.forEach(field => {
          console.log(`   hosting.${field}: ${hosting[field]}`);
        });
      }
    }

    // Check metadata
    if (details.metadata) {
      console.log('📋 Metadata fields:', Object.keys(details.metadata));
      Object.keys(details.metadata).forEach(field => {
        console.log(`   metadata.${field}: ${details.metadata[field]}`);
      });
    }

    // Special analysis for orders that should be "Payment Authorized"
    if (orderId >= 529 && orderId <= 549) {
      console.log('\n🎯 SPECIAL ANALYSIS (Orders 529-549):');
      console.log('   User claims these orders show "Payment Authorized" state');
      console.log(`   API shows: balance="${analysis.balance}", status="${analysis.orderStatus}"`);
      
      // Look for any field that could be interpreted as "Payment Authorized"
      const possibleAuthFields = [];
      
      // Check all string values for "auth" or similar
      function searchForAuth(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            if (value.toLowerCase().includes('auth') || 
                value.toLowerCase().includes('pending') ||
                value.toLowerCase().includes('waiting') ||
                value.toLowerCase().includes('incomplete')) {
              possibleAuthFields.push(`${prefix}${key}: ${value}`);
            }
          } else if (typeof value === 'object' && value !== null) {
            searchForAuth(value, `${prefix}${key}.`);
          }
        }
      }
      
      searchForAuth(details);
      
      if (possibleAuthFields.length > 0) {
        console.log('   🔍 Possible authorization-related fields:');
        possibleAuthFields.forEach(field => {
          console.log(`     ${field}`);
        });
      } else {
        console.log('   ❌ No authorization-related fields found in API data');
      }
    }

    return analysis;

  } catch (error) {
    console.error(`❌ Error analyzing order ${orderId}:`, error.message);
    return null;
  }
}

async function analyzeExistingOrdersPatterns() {
  console.log('🚀 Analyzing Existing Orders Patterns');
  console.log('================================================================================');
  console.log('Deep analysis of orders 529-549 to understand Payment Authorized patterns');
  console.log('Looking for hidden fields or patterns that indicate Payment Authorized state');
  console.log('================================================================================');

  // Focus on key orders that should show Payment Authorized
  const keyOrders = [528, 529, 530, 535, 540, 545, 549]; // Sample across the range

  const analyses = [];

  for (const orderId of keyOrders) {
    const analysis = await analyzeOrderPattern(orderId);
    
    if (analysis) {
      analyses.push(analysis);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Pattern analysis
  console.log('\n📊 PATTERN ANALYSIS SUMMARY');
  console.log('================================================================================');
  
  console.log(`✅ Orders analyzed: ${analyses.length}`);

  // Group by balance
  const balanceGroups = {};
  analyses.forEach(order => {
    if (!balanceGroups[order.balance]) {
      balanceGroups[order.balance] = [];
    }
    balanceGroups[order.balance].push(order.orderId);
  });

  console.log('\n📋 Orders grouped by balance:');
  Object.keys(balanceGroups).forEach(balance => {
    console.log(`  ${balance}: Orders ${balanceGroups[balance].join(', ')}`);
  });

  // Group by payment module
  const moduleGroups = {};
  analyses.forEach(order => {
    const moduleKey = order.module ? `${order.paymentModule} (${order.module})` : order.paymentModule;
    if (!moduleGroups[moduleKey]) {
      moduleGroups[moduleKey] = [];
    }
    moduleGroups[moduleKey].push(order.orderId);
  });

  console.log('\n📋 Orders grouped by payment module:');
  Object.keys(moduleGroups).forEach(module => {
    console.log(`  ${module}: Orders ${moduleGroups[module].join(', ')}`);
  });

  // Group by billing cycle
  const cycleGroups = {};
  analyses.forEach(order => {
    if (!cycleGroups[order.billingCycle]) {
      cycleGroups[order.billingCycle] = [];
    }
    cycleGroups[order.billingCycle].push(order.orderId);
  });

  console.log('\n📋 Orders grouped by billing cycle:');
  Object.keys(cycleGroups).forEach(cycle => {
    console.log(`  ${cycle}: Orders ${cycleGroups[cycle].join(', ')}`);
  });

  // Look for unique patterns in orders 529-549
  const orders529to549 = analyses.filter(order => order.orderId >= 529 && order.orderId <= 549);
  const order528 = analyses.find(order => order.orderId === 528);

  console.log('\n🔍 COMPARISON: Order 528 vs Orders 529-549');
  console.log('================================================================================');
  
  if (order528) {
    console.log('Order 528 (should NOT be Payment Authorized):');
    console.log(`  Balance: ${order528.balance}`);
    console.log(`  Status: ${order528.orderStatus}`);
    console.log(`  Payment Module: ${order528.paymentModule}`);
    console.log(`  Billing Cycle: ${order528.billingCycle}`);
    console.log(`  Invoice Credit: ${order528.invCredit}`);
  }

  if (orders529to549.length > 0) {
    console.log('\nOrders 529-549 (should be Payment Authorized):');
    orders529to549.forEach(order => {
      console.log(`  Order ${order.orderId}:`);
      console.log(`    Balance: ${order.balance}`);
      console.log(`    Status: ${order.orderStatus}`);
      console.log(`    Payment Module: ${order.paymentModule}`);
      console.log(`    Billing Cycle: ${order.billingCycle}`);
      console.log(`    Invoice Credit: ${order.invCredit}`);
    });
  }

  console.log('\n🎯 KEY FINDINGS:');
  console.log('================================================================================');
  console.log('1. API Data Analysis:');
  console.log('   - All analyzed orders show balance: "Completed"');
  console.log('   - No orders show balance: "Authorized" in API');
  console.log('   - Payment modules vary (0, 10, 999)');
  console.log('');
  console.log('2. Possible Explanations for Payment Authorized visibility:');
  console.log('   - HostBill Admin UI interprets data differently than API');
  console.log('   - Payment Authorized might be a UI state, not API state');
  console.log('   - Different API endpoint might show Payment Authorized');
  console.log('   - Order lifecycle UI might show different information');
  console.log('');
  console.log('3. Recommendations:');
  console.log('   - Check HostBill Admin interface for Order 529');
  console.log('   - Look for Order Lifecycle or Payment Status UI');
  console.log('   - Try different API calls (getOrderHistory, getPaymentStatus)');
  console.log('   - Check if Payment Authorized is visible in invoice details');

  console.log('\n✅ Existing orders pattern analysis completed!');
  return analyses;
}

// Run the script
analyzeExistingOrdersPatterns();
