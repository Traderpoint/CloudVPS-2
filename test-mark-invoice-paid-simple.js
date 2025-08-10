// Test the successful mark-invoice-paid endpoint using setInvoiceStatus
const http = require('http');

async function testMarkInvoicePaidSimple() {
  console.log('🚀 Testing mark-invoice-paid endpoint with setInvoiceStatus...');
  
  // Use a recent invoice ID from our tests
  const invoiceId = '269'; // From recent order creation
  
  const requestData = {
    invoiceId,
    status: 'Paid'
  };

  try {
    console.log('📤 Sending mark-invoice-paid request...');
    console.log('   Invoice ID:', invoiceId);
    console.log('   Status:', 'Paid');
    
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
      console.log('✅ Invoice marked as PAID successfully!');
      console.log('🆔 Invoice ID:', result.invoiceId);
      console.log('📊 Status:', result.status);
      console.log('📝 Message:', result.message);
      console.log('🔍 HostBill Result:', result.result);
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
testMarkInvoicePaidSimple();
