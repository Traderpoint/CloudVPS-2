// Test payment modules endpoint
const http = require('http');

async function testPaymentModules() {
  console.log('🚀 Testing payment modules endpoint...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/payment-modules',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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

      req.end();
    });

    if (result.success) {
      console.log('✅ Payment modules endpoint works!');
      console.log('💳 Available modules:', result.modules?.length || 0);
      if (result.modules) {
        result.modules.forEach((module, index) => {
          console.log(`   ${index + 1}. ${module.name} (${module.method})`);
        });
      }
    } else {
      console.log('❌ Payment modules endpoint failed:', result.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testPaymentModules();
