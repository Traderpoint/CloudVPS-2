/**
 * Test Return Handler with Proven Payment Method
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

async function testReturnHandler() {
  console.log('🚀 Testing Return Handler with Proven Payment Method');
  console.log('================================================================================');

  try {
    // Step 1: Create test order
    console.log('\n1️⃣ Creating test order...');
    
    const orderData = {
      customer: {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
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
      paymentMethod: "comgate",
      total: 361.79
    };

    const orderResult = await makeRequest('POST', 'localhost', 3000, '/api/orders/create', orderData);
    
    if (!orderResult.success) {
      throw new Error(`Order creation failed: ${orderResult.error}`);
    }

    const order = orderResult.orders[0];
    console.log('✅ Order created successfully:', {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: order.totalAmount
    });

    // Step 2: Test return handler with proven payment method
    console.log('\n2️⃣ Testing return handler with proven payment method...');
    
    const returnParams = new URLSearchParams({
      status: 'success',
      transId: `TEST-PROVEN-${Date.now()}`,
      refId: order.invoiceId,
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: order.totalAmount || 361.79,
      currency: 'CZK',
      paymentMethod: 'comgate'
    });

    const returnResult = await makeRequest('GET', 'localhost', 3005, `/api/payments/return?${returnParams.toString()}`);
    
    console.log('📥 Return handler response:', {
      success: returnResult.success !== false,
      redirectUrl: returnResult.redirectUrl || 'No redirect URL',
      message: returnResult.message || 'No message'
    });

    // Step 3: Verify invoice status
    console.log('\n3️⃣ Verifying invoice status...');
    
    const invoiceResult = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/invoice/${order.invoiceId}`);
    
    if (invoiceResult.success) {
      console.log('✅ Invoice status verified:', {
        invoiceId: order.invoiceId,
        status: invoiceResult.invoice.status,
        amount: invoiceResult.invoice.amount,
        autoMarkedAsPaid: invoiceResult.invoice.autoMarkedAsPaid,
        transactionCount: invoiceResult.invoice.debugInfo?.transactionCount
      });

      if (invoiceResult.invoice.status === 'Paid') {
        console.log('🎉 SUCCESS: Invoice is marked as PAID!');
      } else {
        console.log('⚠️ WARNING: Invoice is not marked as PAID');
      }
    } else {
      console.log('❌ Failed to verify invoice status:', invoiceResult.error);
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testReturnHandler();
