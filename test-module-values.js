/**
 * Test Different Module Values for convertOrderDraft
 */

const http = require('http');

async function makeRequest(method, hostname, port, path, data) {
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
          resolve({ error: 'Invalid JSON', raw: responseData });
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

async function testModuleValues() {
  console.log('🚀 Testing Different Module Values for convertOrderDraft');
  console.log('================================================================================');

  const testCases = [
    { name: 'NULL module', value: null },
    { name: 'Empty string module', value: '' },
    { name: 'PayU module (ID 10)', value: '10' },
    { name: 'Paypal module (ID 112)', value: '112' },
    { name: 'Stripe module (ID 121)', value: '121' },
    { name: 'Non-existent module (ID 999)', value: '999' },
    { name: 'ComGate module (original)', value: 'comgate' }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name} (value: ${testCase.value})`);
    console.log('================================================================================');

    try {
      // Step 1: Create test order
      console.log('1️⃣ Creating test order...');
      
      const orderData = {
        customer: {
          firstName: "Test",
          lastName: `Module${testCase.value || 'NULL'}`,
          email: `test.module.${Date.now()}@example.com`,
          phone: "+420123456789",
          address: "Test Street 123",
          city: "Prague",
          postalCode: "12000",
          country: "CZ",
          company: "Test Company"
        },
        items: [{
          productId: "1",
          name: "VPS Start",
          quantity: 1,
          price: 299,
          cycle: "m"
        }],
        paymentMethod: testCase.value,
        total: 361.79
      };

      const orderResult = await makeRequest('POST', 'localhost', 3000, '/api/orders/create', orderData);
      
      if (!orderResult.success) {
        console.log('❌ Order creation failed:', orderResult.error);
        continue;
      }

      const order = orderResult.orders[0];
      console.log('✅ Order created successfully:', {
        orderId: order.orderId,
        invoiceId: order.invoiceId,
        amount: order.totalAmount
      });

      // Step 2: Check invoice status immediately
      console.log('2️⃣ Checking invoice status immediately after creation...');
      
      const invoiceResult = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/invoice/${order.invoiceId}`);
      
      if (invoiceResult.success) {
        console.log('📋 Invoice status:', {
          invoiceId: order.invoiceId,
          status: invoiceResult.invoice.status,
          amount: invoiceResult.invoice.amount,
          autoMarkedAsPaid: invoiceResult.invoice.autoMarkedAsPaid,
          transactionCount: invoiceResult.invoice.debugInfo?.transactionCount,
          paymentMethod: invoiceResult.invoice.paymentMethod
        });

        // Determine result
        if (invoiceResult.invoice.status === 'Paid' && invoiceResult.invoice.autoMarkedAsPaid) {
          console.log('🔴 RESULT: Invoice automatically marked as PAID (no transactions)');
        } else if (invoiceResult.invoice.status === 'Paid' && !invoiceResult.invoice.autoMarkedAsPaid) {
          console.log('🟡 RESULT: Invoice marked as PAID with transactions');
        } else {
          console.log('🟢 RESULT: Invoice remains UNPAID (correct behavior)');
        }
      } else {
        console.log('❌ Failed to check invoice status:', invoiceResult.error);
      }

      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  console.log('\n✅ All tests completed!');
}

// Run the test
testModuleValues();
