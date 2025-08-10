/**
 * Test Payment Methods API Format
 * Verifies that the API returns the correct format expected by Invoice Payment Test
 */

const http = require('http');

async function testPaymentMethodsFormat() {
  console.log('🧪 === PAYMENT METHODS FORMAT TEST ===\n');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/api/hostbill/payment-modules', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (error) {
            resolve({ status: res.statusCode, data: data, error: error.message });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ API Response successful');
      console.log('📊 Response structure:');
      console.log('   - success:', response.data.success);
      console.log('   - modules type:', typeof response.data.modules);
      console.log('   - modules is object:', typeof response.data.modules === 'object' && !Array.isArray(response.data.modules));
      console.log('   - modules keys:', Object.keys(response.data.modules || {}));
      
      console.log('\n📋 Payment Methods:');
      if (response.data.modules && typeof response.data.modules === 'object') {
        Object.entries(response.data.modules).forEach(([id, name]) => {
          console.log(`   - ${id}: ${name}`);
        });
        
        console.log('\n✅ Format is CORRECT for Invoice Payment Test');
        console.log('   Expected: modules as object with key-value pairs');
        console.log('   Received: modules as object with key-value pairs');
        
        // Test the transformation that Invoice Payment Test does
        const methods = Object.entries(response.data.modules).map(([id, name]) => ({
          id,
          name
        }));
        
        console.log('\n🔄 Transformed for UI:');
        methods.forEach(method => {
          console.log(`   - ID: ${method.id}, Name: ${method.name}`);
        });
        
        return true;
      } else {
        console.log('❌ Format is INCORRECT');
        console.log('   Expected: modules as object');
        console.log('   Received: modules as', Array.isArray(response.data.modules) ? 'array' : typeof response.data.modules);
        return false;
      }
    } else {
      console.log('❌ API call failed');
      console.log('   Status:', response.status);
      console.log('   Error:', response.data.error || 'Unknown error');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testPaymentMethodsFormat()
    .then((success) => {
      console.log('\n📊 === TEST RESULT ===');
      if (success) {
        console.log('✅ Payment Methods API format is CORRECT');
        console.log('🎉 Invoice Payment Test should work without errors!');
      } else {
        console.log('❌ Payment Methods API format needs fixing');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testPaymentMethodsFormat };
