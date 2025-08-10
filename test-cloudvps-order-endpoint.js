// Test CloudVPS order endpoint
const http = require('http');

async function testCloudVPSOrderEndpoint() {
  console.log('🚀 Testing CloudVPS order endpoint...');
  
  const testOrderData = {
    customer: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+420123456789',
      address: 'Test Address 123',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ'
    },
    items: [
      {
        productId: '1',
        name: 'Test VPS Basic',
        price: 100,
        cycle: 'm'
      }
    ],
    addons: [],
    affiliate: null,
    payment: {
      method: 'banktransfer',
      total: 100
    },
    type: 'complete'
  };

  try {
    console.log('📤 Sending order data to CloudVPS endpoint...');
    
    const postData = JSON.stringify(testOrderData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/middleware/create-test-order',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        console.log('📥 Response status:', res.statusCode);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            console.log('📋 Response data:', JSON.stringify(jsonData, null, 2));
            resolve(jsonData);
          } catch (e) {
            console.log('📋 Raw response:', data);
            resolve({ error: 'Invalid JSON response', raw: data });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(postData);
      req.end();
    });

    if (result.success) {
      console.log('✅ CloudVPS order endpoint works!');
      console.log('🆔 Processing ID:', result.processingId);
      if (result.orders && result.orders.length > 0) {
        console.log('📦 Orders created:', result.orders.length);
        result.orders.forEach((order, index) => {
          console.log(`   Order ${index + 1}: ID ${order.orderId}, Invoice: ${order.invoiceId}`);
        });
      }
    } else {
      console.log('❌ CloudVPS order endpoint failed:', result.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testCloudVPSOrderEndpoint();
