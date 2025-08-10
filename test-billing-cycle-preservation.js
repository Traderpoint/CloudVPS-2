/**
 * Test Billing Cycle Preservation with PayU Module
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

async function testBillingCyclePreservation() {
  console.log('🚀 Testing Billing Cycle Preservation with PayU Module');
  console.log('================================================================================');

  const testCases = [
    { cycle: 'm', name: 'Monthly', expectedCycle: 'Monthly' },
    { cycle: 'q', name: 'Quarterly', expectedCycle: 'Quarterly' },
    { cycle: 'a', name: 'Annually', expectedCycle: 'Annually' }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing ${testCase.name} billing cycle (${testCase.cycle})`);
    console.log('================================================================================');

    try {
      // Create test order with specific billing cycle
      console.log(`1️⃣ Creating test order with ${testCase.name} billing cycle...`);
      
      const orderData = {
        customer: {
          firstName: "Test",
          lastName: `Cycle${testCase.name}`,
          email: `test.cycle.${testCase.cycle}.${Date.now()}@example.com`,
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
          cycle: testCase.cycle
        }],
        paymentMethod: "10", // PayU module ID
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

      // Check order details via HostBill API
      console.log('2️⃣ Checking order details in HostBill...');
      
      const https = require('https');
      const querystring = require('querystring');
      
      const orderParams = querystring.stringify({
        api_id: 'adcdebb0e3b6f583052d',
        api_key: '341697c41aeb1c842f0d',
        call: 'getOrderDetails',
        id: order.orderId
      });

      const orderDetails = await new Promise((resolve, reject) => {
        const req = https.request('https://vps.kabel1it.cz/admin/api.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(orderParams)
          },
          rejectUnauthorized: false
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({ error: 'Invalid JSON', raw: data });
            }
          });
        });
        
        req.on('error', reject);
        req.write(orderParams);
        req.end();
      });

      if (orderDetails.success && orderDetails.details) {
        const hosting = orderDetails.details.hosting[0];
        console.log('📋 Order details:', {
          orderId: order.orderId,
          paymentModule: orderDetails.details.payment_module,
          invoiceId: orderDetails.details.invoice_id,
          billingCycle: hosting.billingcycle,
          total: hosting.total,
          status: hosting.status
        });

        // Check if billing cycle is preserved
        if (hosting.billingcycle === testCase.expectedCycle) {
          console.log(`✅ SUCCESS: Billing cycle preserved (${hosting.billingcycle})`);
        } else if (hosting.billingcycle === 'Free') {
          console.log(`⚠️ WARNING: Billing cycle changed to Free (expected: ${testCase.expectedCycle})`);
        } else {
          console.log(`❌ ERROR: Unexpected billing cycle (${hosting.billingcycle}, expected: ${testCase.expectedCycle})`);
        }

        // Check invoice creation
        if (orderDetails.details.invoice_id === '0') {
          console.log('✅ SUCCESS: No invoice auto-created (waiting for payment)');
        } else {
          console.log(`⚠️ WARNING: Invoice auto-created (${orderDetails.details.invoice_id})`);
        }
      } else {
        console.log('❌ Failed to get order details:', orderDetails.error);
      }

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  console.log('\n✅ All tests completed!');
}

// Run the test
testBillingCyclePreservation();
