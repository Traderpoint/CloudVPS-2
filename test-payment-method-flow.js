/**
 * Test Payment Method Flow - Debug where PayU gets lost
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

async function testPaymentMethodFlow() {
  console.log('🚀 Testing Payment Method Flow - Debug PayU');
  console.log('================================================================================');

  try {
    // Create test order with PayU
    console.log('1️⃣ Creating test order with PayU (ID 10)...');
    
    const orderData = {
      customer: {
        firstName: "Test",
        lastName: "PayUDebug",
        email: `test.payu.debug.${Date.now()}@example.com`,
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
      paymentMethod: "10", // PayU module ID
      total: 361.79
    };

    console.log('📤 Sending order data:', {
      paymentMethod: orderData.paymentMethod,
      customerEmail: orderData.customer.email
    });

    const orderResult = await makeRequest('POST', 'localhost', 3000, '/api/orders/create', orderData);
    
    if (!orderResult.success) {
      console.log('❌ Order creation failed:', orderResult.error);
      return;
    }

    const order = orderResult.orders[0];
    console.log('✅ Order created successfully:', {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: order.totalAmount
    });

    console.log('📋 Full order result mapping:', {
      originalPaymentMethod: orderData.paymentMethod,
      transformedData: orderResult.mapping?.transformedData?.paymentMethod,
      summary: orderResult.summary
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
      console.log('📋 HostBill order details:', {
        orderId: order.orderId,
        paymentModule: orderDetails.details.payment_module,
        module: orderDetails.details.module,
        invoiceId: orderDetails.details.invoice_id,
        metadata: orderDetails.details.metadata
      });

      // Check if PayU module is preserved
      if (orderDetails.details.payment_module === '10') {
        console.log('✅ SUCCESS: PayU module preserved in order');
      } else {
        console.log(`❌ ERROR: PayU module lost (got: ${orderDetails.details.payment_module}, expected: 10)`);
      }
    } else {
      console.log('❌ Failed to get order details:', orderDetails.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n✅ Test completed!');
}

// Run the test
testPaymentMethodFlow();
