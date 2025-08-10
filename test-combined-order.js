// Test script for combined order creation
// Using built-in fetch (Node.js 18+)

const middlewareUrl = 'http://localhost:3005';

async function testCombinedOrder() {
  console.log('🧪 Testing combined order creation...');

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
      },
      {
        productId: '2', // VPS Pro
        name: 'VPS Pro',
        price: 1190,
        quantity: 1,
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
    total: 2390, // Combined total
    currency: 'CZK'
  };

  try {
    console.log('📤 Sending order to middleware...');
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
      console.log('✅ Combined order created successfully!');
      console.log(`📋 Orders count: ${result.orders?.length || 0}`);
      console.log(`💰 Total amount: ${result.orders?.[0]?.totalAmount || 'N/A'}`);
      
      if (result.orders?.[0]?.type === 'combined_invoice') {
        console.log('🎯 SUCCESS: Created combined invoice instead of separate orders!');
        console.log(`📄 Invoice ID: ${result.orders[0].invoiceId}`);
        console.log(`📦 Items in invoice: ${result.orders[0].items?.length || 0}`);
      } else {
        console.log('⚠️  WARNING: Still creating separate orders');
      }
    } else {
      console.log('❌ Order creation failed:', result.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run test
testCombinedOrder();
