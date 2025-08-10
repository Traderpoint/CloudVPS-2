/**
 * Test Invoice Data Loading
 * Testuje, zda se data objednávek a platebních metod načítají správně
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

console.log('🔍 Testing Invoice Data Loading');
console.log('===============================');
console.log('');

async function testInvoiceDataLoading() {
  try {
    // Step 1: Test recent orders endpoint
    console.log('1️⃣ Testing Recent Orders Endpoint...');
    console.log('====================================');
    
    console.log(`🔍 Calling: ${MIDDLEWARE_URL}/api/orders/recent?limit=10`);
    
    const ordersResponse = await fetch(`${MIDDLEWARE_URL}/api/orders/recent?limit=10`);
    console.log(`📊 Response status: ${ordersResponse.status}`);
    
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      console.log('✅ Orders Response:');
      console.log(`   Success: ${ordersData.success}`);
      console.log(`   Orders count: ${ordersData.orders?.length || 0}`);
      
      if (ordersData.orders && ordersData.orders.length > 0) {
        const firstOrder = ordersData.orders[0];
        console.log('📋 First order structure:');
        console.log(`   Order ID: ${firstOrder.id}`);
        console.log(`   Status: ${firstOrder.status}`);
        console.log(`   Date: ${firstOrder.date}`);
        
        if (firstOrder.invoices && firstOrder.invoices.length > 0) {
          const firstInvoice = firstOrder.invoices[0];
          console.log('📋 First invoice structure:');
          console.log(`   Invoice ID: ${firstInvoice.id}`);
          console.log(`   Total: ${firstInvoice.total}`);
          console.log(`   Status: ${firstInvoice.status}`);
          console.log(`   Currency: ${firstInvoice.currency}`);
        } else {
          console.log('⚠️ No invoices found in first order');
        }
      } else {
        console.log('⚠️ No orders found');
      }
    } else {
      const errorText = await ordersResponse.text();
      console.log('❌ Orders endpoint failed:', errorText);
    }
    
    console.log('');

    // Step 2: Test payment methods endpoint
    console.log('2️⃣ Testing Payment Methods Endpoint...');
    console.log('======================================');
    
    console.log(`🔍 Calling: ${MIDDLEWARE_URL}/api/payment-methods`);
    
    const methodsResponse = await fetch(`${MIDDLEWARE_URL}/api/payment-methods`);
    console.log(`📊 Response status: ${methodsResponse.status}`);
    
    if (methodsResponse.ok) {
      const methodsData = await methodsResponse.json();
      console.log('✅ Payment Methods Response:');
      console.log(`   Success: ${methodsData.success}`);
      
      if (methodsData.modules) {
        const methods = Object.entries(methodsData.modules);
        console.log(`   Methods count: ${methods.length}`);
        console.log('📋 Available methods:');
        methods.forEach(([id, name]) => {
          console.log(`     ${id}: ${name}`);
        });
      } else if (methodsData.methods) {
        console.log(`   Methods count: ${methodsData.methods.length}`);
        console.log('📋 Available methods:');
        methodsData.methods.forEach(method => {
          console.log(`     ${method.id}: ${method.name}`);
        });
      } else {
        console.log('⚠️ No payment methods found in response');
        console.log('📋 Full response:', methodsData);
      }
    } else {
      const errorText = await methodsResponse.text();
      console.log('❌ Payment methods endpoint failed:', errorText);
    }
    
    console.log('');

    // Step 3: Test alternative endpoints if main ones fail
    console.log('3️⃣ Testing Alternative Endpoints...');
    console.log('===================================');
    
    const alternativeOrdersEndpoints = [
      '/api/orders',
      '/api/hostbill/orders',
      '/api/recent-orders',
      '/api/orders/list'
    ];
    
    console.log('🔍 Testing alternative orders endpoints...');
    for (const endpoint of alternativeOrdersEndpoints) {
      try {
        const response = await fetch(`${MIDDLEWARE_URL}${endpoint}?limit=10`);
        if (response.status !== 404) {
          console.log(`   ${endpoint}: ${response.status} (exists)`);
          if (response.ok) {
            const data = await response.json();
            if (data.orders || data.data) {
              console.log(`     ✅ Has orders data`);
            }
          }
        }
      } catch (error) {
        // Ignore connection errors
      }
    }
    
    const alternativePaymentEndpoints = [
      '/api/payments/methods',
      '/api/hostbill/payment-modules',
      '/api/payment-gateways',
      '/api/methods'
    ];
    
    console.log('🔍 Testing alternative payment methods endpoints...');
    for (const endpoint of alternativePaymentEndpoints) {
      try {
        const response = await fetch(`${MIDDLEWARE_URL}${endpoint}`);
        if (response.status !== 404) {
          console.log(`   ${endpoint}: ${response.status} (exists)`);
          if (response.ok) {
            const data = await response.json();
            if (data.modules || data.methods || data.gateways) {
              console.log(`     ✅ Has payment methods data`);
            }
          }
        }
      } catch (error) {
        // Ignore connection errors
      }
    }
    
    console.log('');

    // Step 4: Test with specific order/invoice IDs
    console.log('4️⃣ Testing Specific Order/Invoice Data...');
    console.log('========================================');
    
    const testOrderId = '426';
    const testInvoiceId = '446';
    
    // Test specific order
    try {
      console.log(`🔍 Testing specific order: ${testOrderId}`);
      const orderResponse = await fetch(`${MIDDLEWARE_URL}/api/orders/${testOrderId}`);
      console.log(`   Order ${testOrderId}: ${orderResponse.status}`);
      
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        console.log(`   ✅ Order data available`);
        console.log(`   Order ID: ${orderData.id || orderData.order?.id}`);
        console.log(`   Status: ${orderData.status || orderData.order?.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing order ${testOrderId}:`, error.message);
    }
    
    // Test specific invoice
    try {
      console.log(`🔍 Testing specific invoice: ${testInvoiceId}`);
      const invoiceResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${testInvoiceId}`);
      console.log(`   Invoice ${testInvoiceId}: ${invoiceResponse.status}`);
      
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        console.log(`   ✅ Invoice data available`);
        console.log(`   Invoice ID: ${invoiceData.id || invoiceData.invoice?.id}`);
        console.log(`   Total: ${invoiceData.total || invoiceData.invoice?.total}`);
        console.log(`   Status: ${invoiceData.status || invoiceData.invoice?.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing invoice ${testInvoiceId}:`, error.message);
    }

    console.log('');
    console.log('📊 INVOICE DATA LOADING TEST SUMMARY');
    console.log('====================================');
    console.log('');
    console.log('🔧 Debugging checklist:');
    console.log('   1. ✅ Middleware is running on port 3005');
    console.log('   2. Check if orders endpoint returns valid data structure');
    console.log('   3. Check if payment methods endpoint returns valid data');
    console.log('   4. Verify order.id, invoice.id, invoice.total are not undefined');
    console.log('   5. Check browser console for data loading logs');
    console.log('');
    console.log('🌐 Next steps:');
    console.log('   1. Open http://localhost:3000/invoice-payment-test');
    console.log('   2. Check browser console for data loading messages');
    console.log('   3. Verify that orders and payment methods load correctly');
    console.log('   4. Try clicking PAY button and check parameter validation logs');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testInvoiceDataLoading();
