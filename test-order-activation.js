/**
 * Test Order Activation - What happens when setOrderActive is called
 */

const HostBillClient = require('./lib/hostbill-client.js');

async function testOrderActivation() {
  console.log('🔄 Testing Order Activation Process...');
  console.log('=====================================');

  const hostbillClient = new HostBillClient();
  
  // Test with a known order ID
  const testOrderId = '405'; // Known test order
  
  try {
    console.log(`\n📋 Step 1: Getting order details BEFORE activation...`);
    console.log(`Order ID: ${testOrderId}`);
    
    // Get order details before activation
    const orderBefore = await hostbillClient.makeApiCall({
      call: 'getOrder',
      id: testOrderId
    });
    
    console.log('📊 Order details BEFORE activation:');
    if (orderBefore && !orderBefore.error) {
      console.log(`  Status: ${orderBefore.status || 'N/A'}`);
      console.log(`  Client ID: ${orderBefore.client_id || 'N/A'}`);
      console.log(`  Product ID: ${orderBefore.product_id || 'N/A'}`);
      console.log(`  Invoice ID: ${orderBefore.invoice_id || 'N/A'}`);
      console.log(`  Date Created: ${orderBefore.date || 'N/A'}`);
      console.log(`  Amount: ${orderBefore.amount || 'N/A'}`);
      console.log(`  Full order data:`, JSON.stringify(orderBefore, null, 2));
    } else {
      console.log(`  Error getting order: ${orderBefore?.error || 'Unknown error'}`);
    }

    console.log(`\n🔐 Step 2: Activating order using setOrderActive...`);
    
    // Activate the order
    const activationResult = await hostbillClient.activateOrder(testOrderId);
    
    console.log('📊 Activation result:');
    console.log(`  Success: ${activationResult.success}`);
    console.log(`  Result: ${activationResult.result || 'N/A'}`);
    console.log(`  Error: ${activationResult.error || 'None'}`);
    console.log(`  Full result:`, JSON.stringify(activationResult, null, 2));

    console.log(`\n📋 Step 3: Getting order details AFTER activation...`);
    
    // Get order details after activation
    const orderAfter = await hostbillClient.makeApiCall({
      call: 'getOrder',
      id: testOrderId
    });
    
    console.log('📊 Order details AFTER activation:');
    if (orderAfter && !orderAfter.error) {
      console.log(`  Status: ${orderAfter.status || 'N/A'}`);
      console.log(`  Client ID: ${orderAfter.client_id || 'N/A'}`);
      console.log(`  Product ID: ${orderAfter.product_id || 'N/A'}`);
      console.log(`  Invoice ID: ${orderAfter.invoice_id || 'N/A'}`);
      console.log(`  Date Created: ${orderAfter.date || 'N/A'}`);
      console.log(`  Amount: ${orderAfter.amount || 'N/A'}`);
      
      // Compare before and after
      console.log(`\n🔍 Status comparison:`);
      console.log(`  Before: ${orderBefore?.status || 'N/A'}`);
      console.log(`  After:  ${orderAfter?.status || 'N/A'}`);
      console.log(`  Changed: ${orderBefore?.status !== orderAfter?.status ? '✅ YES' : '❌ NO'}`);
      
    } else {
      console.log(`  Error getting order: ${orderAfter?.error || 'Unknown error'}`);
    }

    console.log(`\n📋 Step 4: Getting related services/accounts...`);
    
    // Try to get services for this client
    const services = await hostbillClient.makeApiCall({
      call: 'getClientServices',
      client_id: orderBefore?.client_id || '107'
    });
    
    console.log('📊 Client services:');
    if (services && !services.error && services.services) {
      console.log(`  Total services: ${services.services.length}`);
      services.services.forEach((service, index) => {
        console.log(`  Service ${index + 1}:`);
        console.log(`    ID: ${service.id}`);
        console.log(`    Status: ${service.status}`);
        console.log(`    Product: ${service.product_name || service.name}`);
        console.log(`    Domain: ${service.domain}`);
        console.log(`    Created: ${service.date_created}`);
      });
    } else {
      console.log(`  Error or no services: ${services?.error || 'No services found'}`);
    }

    console.log(`\n✅ Order activation test completed!`);
    
  } catch (error) {
    console.error('❌ Error during order activation test:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testOrderActivation().catch(console.error);
