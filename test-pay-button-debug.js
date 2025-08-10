/**
 * Test PAY Button Debug
 * Testuje, jaká data se skutečně posílají do middleware
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

console.log('🔍 Testing PAY Button Data Debug');
console.log('================================');
console.log('');

async function testPayButtonData() {
  try {
    // Step 1: Test s různými typy dat
    console.log('1️⃣ Testing different data types...');
    console.log('==================================');
    
    const testCases = [
      {
        name: 'Valid data (strings)',
        data: {
          orderId: '426',
          invoiceId: '446',
          method: 'comgate',
          amount: 25,
          currency: 'CZK'
        }
      },
      {
        name: 'Valid data (numbers)',
        data: {
          orderId: 426,
          invoiceId: 446,
          method: 'comgate',
          amount: 25,
          currency: 'CZK'
        }
      },
      {
        name: 'Missing orderId',
        data: {
          invoiceId: '446',
          method: 'comgate',
          amount: 25,
          currency: 'CZK'
        }
      },
      {
        name: 'Missing method',
        data: {
          orderId: '426',
          invoiceId: '446',
          amount: 25,
          currency: 'CZK'
        }
      },
      {
        name: 'Empty strings',
        data: {
          orderId: '',
          invoiceId: '',
          method: '',
          amount: 0,
          currency: 'CZK'
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Test: ${testCase.name}`);
      console.log('📤 Sending data:', testCase.data);
      
      try {
        const response = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase.data)
        });
        
        console.log(`📊 Response status: ${response.status}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ SUCCESS:', result.message || 'Payment initialized');
        } else {
          const errorText = await response.text();
          console.log('❌ FAILED:', errorText);
        }
      } catch (error) {
        console.log('❌ ERROR:', error.message);
      }
    }
    
    console.log('\n');

    // Step 2: Test middleware endpoint requirements
    console.log('2️⃣ Testing middleware endpoint requirements...');
    console.log('==============================================');
    
    // Check what the middleware actually expects
    try {
      const response = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Empty body to see what's required
      });
      
      console.log(`📊 Empty request response: ${response.status}`);
      const errorText = await response.text();
      console.log('📝 Error message:', errorText);
      
      // Try to parse as JSON to see if it gives more details
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📋 Parsed error:', errorJson);
      } catch (parseError) {
        console.log('📋 Raw error text:', errorText);
      }
      
    } catch (error) {
      console.log('❌ Error testing empty request:', error.message);
    }
    
    console.log('\n');

    // Step 3: Test with exact CloudVPS data format
    console.log('3️⃣ Testing with CloudVPS data format...');
    console.log('=======================================');
    
    const cloudVpsData = {
      orderId: '426',
      invoiceId: '446',
      method: 'comgate',
      amount: parseFloat('100'),
      currency: 'CZK',
      customerData: {
        email: 'test@example.com',
        name: 'Test Customer'
      },
      testFlow: true,
      returnUrl: 'http://localhost:3000/invoice-payment-test'
    };
    
    console.log('📤 CloudVPS format data:', cloudVpsData);
    
    try {
      const response = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cloudVpsData)
      });
      
      console.log(`📊 Response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ CloudVPS format SUCCESS:', result);
      } else {
        const errorText = await response.text();
        console.log('❌ CloudVPS format FAILED:', errorText);
        
        // Try to parse error for more details
        try {
          const errorJson = JSON.parse(errorText);
          console.log('📋 Detailed error:', errorJson);
        } catch (parseError) {
          console.log('📋 Raw error:', errorText);
        }
      }
    } catch (error) {
      console.log('❌ CloudVPS format ERROR:', error.message);
    }
    
    console.log('\n');

    // Step 4: Check middleware health and available endpoints
    console.log('4️⃣ Checking middleware health...');
    console.log('================================');
    
    try {
      const healthResponse = await fetch(`${MIDDLEWARE_URL}/api/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Middleware health:', healthData);
      } else {
        console.log('❌ Middleware health check failed');
      }
    } catch (error) {
      console.log('❌ Cannot reach middleware:', error.message);
    }
    
    // Check if there are other payment endpoints
    const alternativeEndpoints = [
      '/api/payment/initialize',
      '/api/initialize-payment',
      '/api/payments/init',
      '/api/payments/create'
    ];
    
    console.log('\n🔍 Testing alternative endpoints...');
    for (const endpoint of alternativeEndpoints) {
      try {
        const response = await fetch(`${MIDDLEWARE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cloudVpsData)
        });
        
        if (response.status !== 404) {
          console.log(`   ${endpoint}: ${response.status} (exists)`);
        }
      } catch (error) {
        // Ignore connection errors
      }
    }

    console.log('\n');
    console.log('📊 PAY BUTTON DEBUG SUMMARY');
    console.log('===========================');
    console.log('');
    console.log('🔧 Debugging steps:');
    console.log('   1. Check browser console for parameter validation logs');
    console.log('   2. Verify invoice.id, order.id, invoice.total are not undefined');
    console.log('   3. Check if payment method dropdown has valid value');
    console.log('   4. Ensure middleware is running on port 3005');
    console.log('   5. Verify middleware /api/payments/initialize endpoint exists');
    console.log('');
    console.log('🌐 Test in browser: http://localhost:3000/invoice-payment-test');
    console.log('   Open browser console and click PAY button to see debug logs');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPayButtonData();
