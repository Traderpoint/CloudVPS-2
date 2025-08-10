// Test script for proper order creation
// Using built-in fetch (Node.js 18+)

const cloudVpsUrl = 'http://localhost:3000';

async function testProperOrder() {
  console.log('🧪 Testing proper order creation...');

  // Test data - košík s více produkty
  const orderData = {
    customer: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com',
      phone: '+420123456789',
      address: 'Test Address 123',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ'
    },
    items: [
      {
        productId: '1', // VPS Basic -> HostBill ID 5
        name: 'VPS Basic',
        quantity: 2,    // 2x VPS Basic
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
        quantity: 1,    // 1x VPS Pro
        configOptions: {
          cpu: '4 vCPU',
          ram: '8GB',
          storage: '100GB',
          os: 'linux'
        }
      }
    ]
  };

  try {
    console.log('📤 Sending proper order...');
    console.log('Order data:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${cloudVpsUrl}/api/create-order-proper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    console.log('📥 Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ PROPER ORDER SUCCESS!');
      console.log(`🎯 Order ID: ${result.order_id}`);
      console.log(`📄 Invoice ID: ${result.invoice_id}`);
      console.log(`📦 Items count: ${result.items_count}`);
      console.log(`🔗 Invoice URL: ${result.invoice_url || 'N/A'}`);
      console.log('');
      console.log('🎉 ONE ORDER WITH MULTIPLE PRODUCTS CREATED!');
      console.log('   - 2x VPS Basic (HostBill ID: 5)');
      console.log('   - 1x VPS Pro (HostBill ID: 10)');
      console.log('   - Total: 3 VPS servers in ONE order');
    } else {
      console.log('❌ Order creation failed:', result.error);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run test
testProperOrder();
