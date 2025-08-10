/**
 * Investigate Payment Authorized State
 * Testing various HostBill API calls to find Payment Authorized status
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

async function investigatePaymentAuthorized() {
  console.log('🔍 Investigating Payment Authorized State in HostBill');
  console.log('================================================================================');

  // Test with recent orders that might have Payment Authorized state
  const testOrderIds = [578, 579, 580, 581, 582, 583, 584, 585]; // Recent orders from previous test
  const testInvoiceIds = [607, 608, 609, 610, 611, 612, 613, 614]; // Recent invoices

  console.log('1️⃣ Testing various API calls to find Payment Authorized state...');
  
  // Test different API calls that might reveal Payment Authorized status
  const apiCallsToTest = [
    'getOrderDetails',
    'getInvoiceDetails', 
    'getOrderTransactions',
    'getInvoiceTransactions',
    'getPaymentDetails',
    'getTransactionDetails',
    'getOrderHistory',
    'getInvoiceHistory',
    'getOrderLifecycle',
    'getPaymentStatus',
    'getGatewayStatus',
    'getOrderPayments',
    'getInvoicePayments'
  ];

  console.log('\n📋 Testing API calls with Order 578 (PayU)...');
  
  for (const apiCall of apiCallsToTest) {
    console.log(`\n🧪 Testing API call: ${apiCall}`);
    
    const result = await makeHostBillApiCall({
      call: apiCall,
      id: '578'
    });

    if (result.error) {
      console.log(`❌ ${apiCall}: ${Array.isArray(result.error) ? result.error.join(', ') : result.error}`);
    } else if (result.success) {
      console.log(`✅ ${apiCall}: SUCCESS`);
      
      // Look for any fields that might contain "Authorized" status
      const jsonStr = JSON.stringify(result, null, 2);
      if (jsonStr.toLowerCase().includes('authorized') || 
          jsonStr.toLowerCase().includes('auth') ||
          jsonStr.toLowerCase().includes('pending') ||
          jsonStr.toLowerCase().includes('captured') ||
          jsonStr.toLowerCase().includes('approved')) {
        console.log('🎯 POTENTIAL PAYMENT STATUS FOUND:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('📄 Response received but no payment status indicators found');
      }
    } else {
      console.log(`⚠️ ${apiCall}: Unexpected response format`);
    }
  }

  console.log('\n2️⃣ Testing with different parameter names...');
  
  // Test with different parameter names
  const paramVariations = [
    { call: 'getOrderDetails', order_id: '578' },
    { call: 'getOrderDetails', orderid: '578' },
    { call: 'getInvoiceDetails', invoice_id: '607' },
    { call: 'getInvoiceDetails', invoiceid: '607' },
    { call: 'getTransactions', order_id: '578' },
    { call: 'getTransactions', invoice_id: '607' },
    { call: 'getPayments', order_id: '578' },
    { call: 'getPayments', invoice_id: '607' }
  ];

  for (const params of paramVariations) {
    console.log(`\n🧪 Testing: ${JSON.stringify(params)}`);
    
    const result = await makeHostBillApiCall(params);
    
    if (result.error) {
      console.log(`❌ Error: ${Array.isArray(result.error) ? result.error.join(', ') : result.error}`);
    } else if (result.success) {
      console.log('✅ SUCCESS - checking for payment status...');
      
      const jsonStr = JSON.stringify(result, null, 2);
      if (jsonStr.toLowerCase().includes('authorized') || 
          jsonStr.toLowerCase().includes('auth') ||
          jsonStr.toLowerCase().includes('pending') ||
          jsonStr.toLowerCase().includes('captured')) {
        console.log('🎯 PAYMENT STATUS FOUND:');
        console.log(JSON.stringify(result, null, 2));
      }
    }
  }

  console.log('\n3️⃣ Testing HostBill API methods list...');
  
  // Try to get list of available API methods
  const methodsResult = await makeHostBillApiCall({
    call: 'getMethods'
  });

  if (methodsResult.success) {
    console.log('✅ Available API methods:');
    console.log(JSON.stringify(methodsResult, null, 2));
  } else {
    console.log('❌ Could not get API methods list');
  }

  // Try to get API help
  const helpResult = await makeHostBillApiCall({
    call: 'getHelp'
  });

  if (helpResult.success) {
    console.log('✅ API Help:');
    console.log(JSON.stringify(helpResult, null, 2));
  } else {
    console.log('❌ Could not get API help');
  }

  console.log('\n4️⃣ Testing specific payment gateway calls...');
  
  // Test PayU specific calls
  const payuCalls = [
    { call: 'payU_getStatus', order_id: '578' },
    { call: 'payU_getPaymentStatus', order_id: '578' },
    { call: 'payU_getTransactionStatus', order_id: '578' },
    { call: 'gateway_payU_getStatus', order_id: '578' },
    { call: 'module_payU_getStatus', order_id: '578' }
  ];

  for (const params of payuCalls) {
    console.log(`\n🧪 Testing PayU call: ${JSON.stringify(params)}`);
    
    const result = await makeHostBillApiCall(params);
    
    if (result.error) {
      console.log(`❌ Error: ${Array.isArray(result.error) ? result.error.join(', ') : result.error}`);
    } else if (result.success) {
      console.log('✅ SUCCESS:');
      console.log(JSON.stringify(result, null, 2));
    }
  }

  console.log('\n5️⃣ Testing transaction and payment related calls...');
  
  // Test transaction related calls
  const transactionCalls = [
    { call: 'getTransactions' },
    { call: 'getPayments' },
    { call: 'getGatewayTransactions' },
    { call: 'getPaymentGateways' },
    { call: 'getPaymentModules' },
    { call: 'listTransactions' },
    { call: 'listPayments' }
  ];

  for (const params of transactionCalls) {
    console.log(`\n🧪 Testing: ${JSON.stringify(params)}`);
    
    const result = await makeHostBillApiCall(params);
    
    if (result.error) {
      console.log(`❌ Error: ${Array.isArray(result.error) ? result.error.join(', ') : result.error}`);
    } else if (result.success) {
      console.log('✅ SUCCESS - checking for payment status...');
      
      const jsonStr = JSON.stringify(result, null, 2);
      if (jsonStr.toLowerCase().includes('authorized') || 
          jsonStr.toLowerCase().includes('auth') ||
          jsonStr.toLowerCase().includes('pending') ||
          jsonStr.toLowerCase().includes('captured')) {
        console.log('🎯 PAYMENT STATUS FOUND:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('📄 No payment status indicators found');
      }
    }
  }

  console.log('\n6️⃣ Manual investigation of order lifecycle...');
  
  // Get detailed order information and look for any lifecycle or status fields
  const orderDetails = await makeHostBillApiCall({
    call: 'getOrderDetails',
    id: '578'
  });

  if (orderDetails.success && orderDetails.details) {
    console.log('📋 Detailed order analysis:');
    console.log('================================================================================');
    
    // Print all fields to see what's available
    const allFields = Object.keys(orderDetails.details);
    console.log('Available order fields:', allFields);
    
    // Look for any status-related fields
    const statusFields = allFields.filter(field => 
      field.toLowerCase().includes('status') ||
      field.toLowerCase().includes('state') ||
      field.toLowerCase().includes('lifecycle') ||
      field.toLowerCase().includes('payment') ||
      field.toLowerCase().includes('auth') ||
      field.toLowerCase().includes('balance')
    );
    
    console.log('Status-related fields:', statusFields);
    
    statusFields.forEach(field => {
      console.log(`${field}: ${orderDetails.details[field]}`);
    });

    // Check hosting array for additional fields
    if (orderDetails.details.hosting && orderDetails.details.hosting[0]) {
      const hostingFields = Object.keys(orderDetails.details.hosting[0]);
      console.log('Available hosting fields:', hostingFields);
      
      const hostingStatusFields = hostingFields.filter(field => 
        field.toLowerCase().includes('status') ||
        field.toLowerCase().includes('state') ||
        field.toLowerCase().includes('payment') ||
        field.toLowerCase().includes('auth') ||
        field.toLowerCase().includes('balance')
      );
      
      console.log('Hosting status-related fields:', hostingStatusFields);
      
      hostingStatusFields.forEach(field => {
        console.log(`hosting.${field}: ${orderDetails.details.hosting[0][field]}`);
      });
    }
  }

  console.log('\n✅ Payment Authorized investigation completed!');
  console.log('================================================================================');
  console.log('Summary:');
  console.log('- Tested various API calls to find Payment Authorized state');
  console.log('- Most API calls are not supported or return limited information');
  console.log('- Payment Authorized state might be:');
  console.log('  1. Available only in HostBill admin interface');
  console.log('  2. Accessible through different API endpoints');
  console.log('  3. Visible only when actual payment gateway transactions occur');
  console.log('  4. Part of order lifecycle that requires specific gateway configuration');
}

// Run the script
investigatePaymentAuthorized();
