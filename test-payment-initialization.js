// Test payment initialization with proper returnUrl and cancelUrl
const http = require('http');

async function testPaymentInitialization() {
  console.log('🚀 Testing payment initialization with returnUrl and cancelUrl...');
  
  const paymentData = {
    orderId: '236',
    invoiceId: '269',
    method: 'comgate',
    amount: 604,
    currency: 'CZK',
    customerData: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    },
    returnUrl: 'http://localhost:3000/payment-return?status=success',
    cancelUrl: 'http://localhost:3000/payment-return?status=cancelled',
    testFlow: true
  };

  try {
    console.log('📤 Sending payment initialization data...');
    
    const postData = JSON.stringify(paymentData);
    
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/payments/initialize',
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
      console.log('✅ Payment initialization successful!');
      console.log('🆔 Payment ID:', result.paymentId);
      console.log('🔗 Payment URL:', result.paymentUrl);
      console.log('🔄 Redirect required:', result.redirectRequired);
    } else {
      console.log('❌ Payment initialization failed:', result.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testPaymentInitialization();
