// Test to get payment modules with their IDs for Credit Balance
const http = require('http');

async function testPaymentModulesIds() {
  console.log('🚀 Testing payment modules to find Credit Balance ID...');
  
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

    if (result.success && result.modules) {
      console.log('✅ Payment modules found:', result.modules.length);
      
      console.log('\n📋 Available Payment Modules:');
      result.modules.forEach((module, index) => {
        console.log(`   ${index + 1}. ID: ${module.id} | Method: ${module.method} | Name: ${module.name}`);
        if (module.method.toLowerCase().includes('credit') || 
            module.name.toLowerCase().includes('credit') ||
            module.name.toLowerCase().includes('balance')) {
          console.log('      ⭐ POTENTIAL CREDIT BALANCE MODULE');
        }
      });

      console.log('\n🔍 Raw modules mapping:');
      console.log(JSON.stringify(result.rawModules, null, 2));

      // Look for credit balance or manual payment
      const creditModule = result.modules.find(m => 
        m.method.toLowerCase().includes('credit') || 
        m.name.toLowerCase().includes('credit') ||
        m.name.toLowerCase().includes('balance') ||
        m.method.toLowerCase().includes('manual') ||
        m.name.toLowerCase().includes('manual')
      );

      if (creditModule) {
        console.log('\n🎯 Found potential Credit Balance module:');
        console.log(`   ID: ${creditModule.id}`);
        console.log(`   Name: ${creditModule.name}`);
        console.log(`   Method: ${creditModule.method}`);
      } else {
        console.log('\n❌ No Credit Balance module found in available modules');
        console.log('💡 Suggestion: Use ID "0" for manual/credit balance payments');
      }

    } else {
      console.log('❌ Failed to get payment modules:', result.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testPaymentModulesIds();
