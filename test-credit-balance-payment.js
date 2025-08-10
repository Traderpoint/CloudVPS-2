// Test mark-invoice-paid with Credit balance payment method
const http = require('http');

async function testCreditBalancePayment() {
  console.log('🚀 Testing mark-invoice-paid with Credit balance payment method...');
  
  // Use a recent invoice ID
  const invoiceId = '268'; // From recent order creation
  
  const requestData = {
    invoiceId,
    status: 'Paid'
  };

  try {
    console.log('📤 Sending mark-invoice-paid request with Credit balance...');
    console.log('   Invoice ID:', invoiceId);
    console.log('   Status:', 'Paid');
    console.log('   Expected Payment Method: Credit balance');
    
    const postData = JSON.stringify(requestData);
    
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/mark-invoice-paid',
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
      console.log('✅ Invoice marked as PAID with Credit balance successfully!');
      console.log('🆔 Invoice ID:', result.invoiceId);
      console.log('📊 Status:', result.status);
      console.log('📝 Message:', result.message);
      console.log('🔍 HostBill Result:', result.result);
      
      console.log('\n💰 Payment Method Details:');
      console.log('   • Payment record added with "Credit balance" method');
      console.log('   • Invoice status updated to "Paid"');
      console.log('   • Both steps completed successfully');
    } else {
      console.log('❌ Failed to mark invoice as PAID:', result.error);
      if (result.details) {
        console.log('   Details:', result.details);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testCreditBalancePayment();
