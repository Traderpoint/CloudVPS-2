// Test script for single order creation via middleware
// Using built-in fetch (Node.js 18+)

const middlewareUrl = 'http://localhost:3005';

async function testSingleOrder() {
  console.log('🧪 Testing single order creation...');

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
        productId: '1', // VPS Basic
        name: 'VPS Basic',
        price: 1200,
        quantity: 1,
        cycle: 'm',
        configOptions: {
          cpu: '2 vCPU',
          ram: '4GB',
          storage: '50GB',
          os: 'linux'
        }
      }
    ],
    paymentMethod: 'banktransfer',
    total: 1200,
    currency: 'CZK'
  };

  try {
    console.log('📤 Sending single order to middleware...');
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
      console.log('✅ Single order created successfully!');
      console.log(`📋 Orders count: ${result.orders?.length || 0}`);
      
      if (result.orders?.[0]) {
        const order = result.orders[0];
        console.log(`🎯 Order type: ${order.type}`);
        console.log(`📄 Order/Invoice ID: ${order.orderId || order.invoiceId}`);
        console.log(`💰 Amount: ${order.totalAmount || order.amount || 'N/A'}`);
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
testSingleOrder();
