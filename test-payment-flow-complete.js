// Complete test of payment-flow-test functionality
const http = require('http');

async function testPaymentFlowComplete() {
  console.log('🚀 Testing complete payment-flow-test functionality...');
  
  // Step 1: Create order (same as payment-flow-test does)
  console.log('\n1️⃣ Creating order via CloudVPS API...');
  
  const orderData = {
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
    addons: [],
    affiliate: null,
    payment: {
      method: 'comgate',
      total: 604
    },
    type: 'complete'
  };

  try {
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

    // Step 2: Simulate "Real Test Payment" (same as payment-flow-test does)
    console.log('\n2️⃣ Simulating real test payment processing...');
    
    // First call the return endpoint (simulates payment gateway callback)
    const returnUrl = `http://localhost:3005/api/payments/return?` +
      `invoiceId=${order.invoiceId}&` +
      `status=success&` +
      `amount=${604}&` +
      `paymentMethod=comgate&` +
      `transactionId=TEST-FLOW-${order.invoiceId}`;

    console.log('📤 Calling return endpoint:', returnUrl);
    
    const returnResult = await makeRequest('GET', 'localhost', 3005, 
      `/api/payments/return?invoiceId=${order.invoiceId}&status=success&amount=604&paymentMethod=comgate&transactionId=TEST-FLOW-${order.invoiceId}`);

    console.log('✅ Return endpoint called:', returnResult.success ? 'Success' : 'Failed');

    // Step 3: Mark invoice as PAID (same as payment-flow-test does)
    console.log('\n3️⃣ Marking invoice as PAID using functional method...');
    
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

    // Step 4: Wait for HostBill processing (same timing as payment-flow-test)
    console.log('\n4️⃣ Waiting 4 seconds for HostBill processing...');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Step 5: Check invoice status (same endpoint as payment-flow-test uses)
    console.log('\n5️⃣ Checking invoice status (same as payment-flow-test)...');
    
    const statusResult = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);

    if (statusResult.success) {
      console.log('✅ Invoice status retrieved:', {
        invoiceId: statusResult.invoiceId,
        status: statusResult.status,
        isPaid: statusResult.isPaid,
        amount: statusResult.amount,
        datePaid: statusResult.datePaid
      });

      // This is the key check - same logic as payment-flow-test UI
      if (statusResult.isPaid) {
        console.log('🎉 SUCCESS: payment-flow-test should show "✅ Payment Completed & Verified - PAID"');
      } else {
        console.log('❌ PROBLEM: payment-flow-test will show "⚠️ Payment Completed - UNPAID"');
        console.log('🔍 Debug - why isPaid is false:');
        console.log('   Status:', statusResult.status);
        console.log('   DatePaid:', statusResult.datePaid);
        console.log('   Invoice details:', statusResult.invoiceDetails);
      }
    } else {
      console.log('❌ Failed to get invoice status:', statusResult.error);
    }

    // Step 6: Additional verification
    console.log('\n6️⃣ Additional verification - direct HostBill check...');
    
    try {
      const directCheck = await makeRequest('POST', 'localhost', 3005, '/api/test-hostbill-direct', {
        call: 'getInvoices',
        'filter[id]': order.invoiceId
      });

      if (directCheck.success && directCheck.invoices) {
        const invoice = directCheck.invoices.find(inv => inv.id == order.invoiceId);
        if (invoice) {
          console.log('✅ Direct HostBill verification:', {
            id: invoice.id,
            status: invoice.status,
            datepaid: invoice.datepaid,
            credit: invoice.credit,
            total: invoice.total
          });

          // Check if HostBill really shows it as paid
          const hostbillPaid = invoice.status === 'Paid' || invoice.status === 'paid';
          console.log(`🔍 HostBill considers invoice ${hostbillPaid ? 'PAID' : 'UNPAID'}`);
        }
      }
    } catch (directError) {
      console.log('⚠️ Could not perform direct HostBill check');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }

  console.log('\n🎯 === PAYMENT FLOW TEST SUMMARY ===');
  console.log('This test simulates exactly what payment-flow-test.js does:');
  console.log('1. ✅ Create order via CloudVPS API');
  console.log('2. ✅ Call payment return endpoint');
  console.log('3. ✅ Mark invoice as PAID using functional method');
  console.log('4. ✅ Wait 4 seconds for HostBill processing');
  console.log('5. ✅ Check invoice status via middleware API');
  console.log('6. ✅ Verify the isPaid flag that controls UI display');
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
testPaymentFlowComplete();
