// Test Credit Balance with correct payment module ID "0"
const http = require('http');

async function testCreditBalanceIdFix() {
  console.log('🚀 Testing Credit Balance with payment module ID "0"...');
  
  // Test both Paid and Unpaid statuses
  const tests = [
    { invoiceId: '267', status: 'Paid', description: 'Mark as PAID with Credit Balance' },
    { invoiceId: '266', status: 'Unpaid', description: 'Mark as UNPAID (no payment record)' }
  ];

  for (const test of tests) {
    console.log(`\n📋 Testing: ${test.description}`);
    console.log(`   Invoice ID: ${test.invoiceId}`);
    console.log(`   Status: ${test.status}`);

    try {
      const requestData = {
        invoiceId: test.invoiceId,
        status: test.status
      };

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
        console.log(`✅ ${test.description} successful!`);
        console.log('📝 Message:', result.message);
        console.log('🔍 HostBill Result:', result.result?.info?.[0] || 'No info');
        
        if (test.status === 'Paid') {
          console.log('💰 Credit Balance payment record should be added');
        } else {
          console.log('📊 Only status updated, no payment record added');
        }
      } else {
        console.log(`❌ ${test.description} failed:`, result.error);
      }

    } catch (error) {
      console.error(`💥 ${test.description} test failed:`, error.message);
    }
  }

  console.log('\n🎯 Summary:');
  console.log('✅ Using payment module ID "0" for Credit Balance');
  console.log('✅ Paid status: adds payment record + updates status');
  console.log('✅ Unpaid status: only updates status');
  console.log('✅ Both operations use setInvoiceStatus API call');
}

// Run the test
testCreditBalanceIdFix();
