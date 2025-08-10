// Test payment-flow-test issue - why invoice shows as UNPAID after successful payment
const http = require('http');

async function testPaymentFlowIssue() {
  console.log('🚀 Testing payment-flow-test issue...');
  
  // Step 1: Create a test order first
  console.log('\n1️⃣ Creating test order...');
  
  const orderData = {
    type: 'complete',
    customer: {
      firstName: 'Test',
      lastName: 'FlowUser',
      email: 'testflow@example.com',
      phone: '+420123456789',
      address: 'Test Address 123',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ'
    },
    items: [
      {
        productId: '1',
        name: 'Test VPS Flow',
        price: 604,
        cycle: 'm'
      }
    ],
    paymentMethod: 'comgate',
    total: 604,
    source: 'payment_flow_test',
    test_mode: true
  };

  try {
    const orderResult = await makeRequest('POST', 'localhost', 3005, '/api/orders/create', orderData);
    
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

    // Step 2: Mark invoice as PAID using the functional method
    console.log('\n2️⃣ Marking invoice as PAID using functional method...');
    
    const markPaidResult = await makeRequest('POST', 'localhost', 3005, '/api/mark-invoice-paid', {
      invoiceId: order.invoiceId,
      status: 'Paid'
    });

    if (markPaidResult.success) {
      console.log('✅ Invoice marked as PAID:', markPaidResult.message);
      console.log('🔍 HostBill response:', markPaidResult.result?.info?.[0] || 'No info');
    } else {
      console.log('❌ Failed to mark invoice as PAID:', markPaidResult.error);
      return;
    }

    // Step 3: Wait a moment for HostBill to process
    console.log('\n3️⃣ Waiting for HostBill to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Check invoice status using the same endpoint as payment-flow-test
    console.log('\n4️⃣ Checking invoice status (same as payment-flow-test)...');
    
    const statusResult = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);

    if (statusResult.success) {
      console.log('✅ Invoice status retrieved:', {
        invoiceId: statusResult.invoiceId,
        status: statusResult.status,
        isPaid: statusResult.isPaid,
        amount: statusResult.amount,
        datePaid: statusResult.datePaid
      });

      if (statusResult.isPaid) {
        console.log('🎉 SUCCESS: Invoice shows as PAID correctly!');
      } else {
        console.log('❌ PROBLEM: Invoice still shows as UNPAID');
        console.log('🔍 Debug info:', {
          status: statusResult.status,
          credit: statusResult.invoiceDetails?.credit,
          grandtotal: statusResult.invoiceDetails?.grandtotal,
          datepaid: statusResult.invoiceDetails?.datepaid
        });
      }
    } else {
      console.log('❌ Failed to get invoice status:', statusResult.error);
    }

    // Step 5: Try direct HostBill API call to verify
    console.log('\n5️⃣ Direct HostBill verification...');
    
    const directResult = await makeRequest('POST', 'localhost', 3005, '/api/test-direct-hostbill', {
      call: 'getInvoices',
      'filter[id]': order.invoiceId
    });

    if (directResult.success && directResult.invoices) {
      const invoice = directResult.invoices.find(inv => inv.id == order.invoiceId);
      if (invoice) {
        console.log('✅ Direct HostBill check:', {
          id: invoice.id,
          status: invoice.status,
          datepaid: invoice.datepaid,
          credit: invoice.credit,
          total: invoice.total,
          grandtotal: invoice.grandtotal
        });
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
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
testPaymentFlowIssue();
