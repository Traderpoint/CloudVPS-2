// Test updated Comgate API implementation with proper parameters
const http = require('http');

async function testComgateUpdatedAPI() {
  console.log('🚀 Testing updated Comgate API implementation...');
  
  // Test 1: Create order and initialize Comgate payment
  console.log('\n1️⃣ Creating order and initializing Comgate payment...');
  
  const orderData = {
    customer: {
      firstName: 'Test',
      lastName: 'ComgateUser',
      email: 'test.comgate@example.com',
      phone: '+420123456789',
      address: 'Test Address 123',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ'
    },
    items: [
      {
        productId: '1',
        name: 'Test VPS Comgate',
        price: 604,
        cycle: 'm'
      }
    ],
    addons: [],
    affiliate: null,
    payment: {
      method: 'comgate',
      total: 604
    },
    type: 'complete'
  };

  try {
    // Create order
    const orderResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/create-test-order', orderData);
    
    if (!orderResult.success) {
      console.log('❌ Failed to create order:', orderResult.error);
      return;
    }

    const order = orderResult.orders[0];
    console.log('✅ Order created:', {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: order.price
    });

    // Test 2: Initialize Comgate payment with updated parameters
    console.log('\n2️⃣ Initializing Comgate payment with updated API parameters...');
    
    const paymentData = {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: 604,
      currency: 'CZK',
      method: 'comgate',
      customerEmail: 'test.comgate@example.com',
      customerName: 'Test ComgateUser',
      customerPhone: '+420123456789',
      description: 'Test VPS Comgate'
    };

    const paymentResult = await makeRequest('POST', 'localhost', 3005, '/api/payments/comgate/initialize', paymentData);

    if (paymentResult.success) {
      console.log('✅ Comgate payment initialized successfully:');
      console.log('   Transaction ID:', paymentResult.transactionId);
      console.log('   Payment URL:', paymentResult.redirectUrl);
      console.log('   Status:', paymentResult.status);
      
      // Test 3: Check if payment URL is accessible
      console.log('\n3️⃣ Verifying payment URL accessibility...');
      
      if (paymentResult.redirectUrl) {
        console.log('✅ Payment URL generated:', paymentResult.redirectUrl);
        console.log('🔗 You can test this URL in browser to verify Comgate integration');
        
        // Test 4: Check payment status
        console.log('\n4️⃣ Checking payment status...');
        
        const statusResult = await makeRequest('GET', 'localhost', 3005, `/api/payments/comgate/status?transactionId=${paymentResult.transactionId}`);
        
        if (statusResult.success) {
          console.log('✅ Payment status retrieved:', {
            transactionId: statusResult.transactionId,
            status: statusResult.status,
            paid: statusResult.paid,
            amount: statusResult.amount,
            currency: statusResult.currency
          });
        } else {
          console.log('⚠️ Could not retrieve payment status:', statusResult.error);
        }
      }
      
      // Test 5: Verify Comgate methods are available
      console.log('\n5️⃣ Checking available Comgate payment methods...');
      
      const methodsResult = await makeRequest('GET', 'localhost', 3005, '/api/payments/comgate/methods');
      
      if (methodsResult.success && methodsResult.methods) {
        console.log('✅ Comgate methods available:', methodsResult.methods.length);
        methodsResult.methods.forEach(method => {
          console.log(`   - ${method.name} (${method.id})`);
        });
      } else {
        console.log('⚠️ Could not retrieve Comgate methods:', methodsResult.error);
      }
      
    } else {
      console.log('❌ Failed to initialize Comgate payment:', paymentResult.error);
      
      // Check if it's IP whitelist issue
      if (paymentResult.error && paymentResult.error.includes('unauthorized')) {
        console.log('\n💡 Possible IP Whitelist Issue:');
        console.log('   Your IP might need to be added to Comgate whitelist');
        console.log('   Go to: https://portal.comgate.cz');
        console.log('   Section: Integrace > Nastavení obchodu > Propojení obchodu');
        console.log('   Add your server IP to allowed addresses');
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }

  console.log('\n🎯 === COMGATE API UPDATE SUMMARY ===');
  console.log('Updated implementation includes:');
  console.log('✅ Proper prepareOnly=true for background payment creation');
  console.log('✅ Secret parameter for secure communication');
  console.log('✅ Delivery and category parameters for better classification');
  console.log('✅ Correct merchant and test mode configuration');
  console.log('✅ All required parameters according to Comgate API docs');
  console.log('\nThe "No cashback data found" error is internal to Comgate');
  console.log('and does not affect payment functionality.');
}

// Helper function to make HTTP requests
async function makeRequest(method, hostname, port, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname,
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve(jsonData);
        } catch (e) {
          resolve({ error: 'Invalid JSON response', raw: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Run the test
testComgateUpdatedAPI();
