// Test script for cart quantities and pricing
// Using built-in fetch (Node.js 18+)

const middlewareUrl = 'http://localhost:3005';

async function testCartQuantities() {
  console.log('🧪 Testing cart quantities and pricing...');

  // Simulate cart with different quantities
  const orderData = {
    type: 'complete',
    customer: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com',
      phone: '+420123456789',
      address: 'Test Address 123',
      city: 'Prague',
      zip: '12000',
      country: 'CZ'
    },
    items: [
      {
        productId: '1', // VPS Basic -> HostBill ID 5
        name: 'VPS Basic',
        price: 1200,    // Individual price
        quantity: 3,    // 3x VPS Basic
        cycle: 'm',
        configOptions: {
          cpu: '2 vCPU',
          ram: '4GB',
          storage: '50GB',
          os: 'linux'
        }
      },
      {
        productId: '2', // VPS Pro -> HostBill ID 10
        name: 'VPS Pro',
        price: 1190,    // Individual price
        quantity: 2,    // 2x VPS Pro
        cycle: 'm',
        configOptions: {
          cpu: '4 vCPU',
          ram: '8GB',
          storage: '100GB',
          os: 'linux'
        }
      }
    ],
    paymentMethod: 'banktransfer',
    total: (1200 * 3) + (1190 * 2), // 3600 + 2380 = 5980
    currency: 'CZK'
  };

  try {
    console.log('📤 Sending order with quantities...');
    console.log('Expected totals:');
    console.log('  - 3x VPS Basic (1200 Kč each) = 3600 Kč');
    console.log('  - 2x VPS Pro (1190 Kč each) = 2380 Kč');
    console.log('  - Total: 5980 Kč');
    console.log('');
    console.log('Order data:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${middlewareUrl}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    console.log('📥 Response from middleware:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ ORDER WITH QUANTITIES SUCCESS!');
      
      if (result.raw?.orders?.[0]) {
        const order = result.raw.orders[0];
        console.log('');
        console.log('🎯 Order Details:');
        console.log(`📋 Order ID: ${order.orderId}`);
        console.log(`📄 Invoice ID: ${order.invoiceId}`);
        console.log(`💰 Total Amount: ${order.totalAmount} ${order.currency}`);
        console.log(`📦 Items Count: ${order.items?.length || 0}`);
        
        if (order.items) {
          console.log('');
          console.log('📦 Items breakdown:');
          order.items.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.productName}`);
            console.log(`     - CloudVPS ID: ${item.cloudVpsProductId}`);
            console.log(`     - HostBill ID: ${item.hostbillProductId}`);
            console.log(`     - Quantity: ${item.quantity}`);
            console.log(`     - Price: ${item.price} Kč each`);
            console.log(`     - Subtotal: ${item.price * item.quantity} Kč`);
          });
        }

        // Check HostBill order details
        if (order.orderDetails?.hosting) {
          console.log('');
          console.log('🏢 HostBill Services:');
          order.orderDetails.hosting.forEach((service, index) => {
            console.log(`  ${index + 1}. ${service.name} (ID: ${service.id})`);
            console.log(`     - Product ID: ${service.product_id}`);
            console.log(`     - Quantity: ${service.qty}`);
            console.log(`     - Total: ${service.total} Kč`);
            console.log(`     - Status: ${service.status}`);
          });
        }

        console.log('');
        console.log('🎉 QUANTITIES TEST RESULTS:');
        console.log(`✅ Total services created: ${order.orderDetails?.hosting?.length || 0}`);
        console.log(`✅ Expected: 5 services (3 VPS Basic + 2 VPS Pro)`);
        
        const actualTotal = order.orderDetails?.hosting?.reduce((sum, service) => 
          sum + (parseFloat(service.total) * parseInt(service.qty)), 0) || 0;
        console.log(`💰 HostBill total: ${actualTotal} Kč`);
        console.log(`💰 Expected total: 5980 Kč`);
        
      }
    } else {
      console.log('❌ Order creation failed:', result.error);
      if (result.errors) {
        console.log('Errors:', result.errors);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run test
testCartQuantities();
