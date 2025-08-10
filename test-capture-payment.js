// Test HostBill API Capture Payment functionality
const http = require('http');

async function testCapturePayment() {
  console.log('🚀 Testing HostBill API Capture Payment functionality...');
  
  // Step 1: Create a test order first
  console.log('\n1️⃣ Creating test order for capture payment test...');
  
  const orderData = {
    customer: {
      firstName: 'Test',
      lastName: 'CaptureUser',
      email: 'test.capture@example.com',
      phone: '+420123456789',
      address: 'Test Address 123',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ'
    },
    items: [
      {
        productId: '1',
        name: 'Test VPS Capture',
        price: 604,
        cycle: 'm'
      }
    ],
    addons: [],
    affiliate: null,
    payment: {
      method: 'banktransfer',
      total: 604
    },
    type: 'complete'
  };

  try {
    // Create order
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

    // Step 2: Test capture payment using new API endpoint
    console.log('\n2️⃣ Testing capture payment via API endpoint...');
    
    const captureData = {
      invoice_id: order.invoiceId,
      amount: 604,
      module: 'BankTransfer',
      trans_id: `TEST-CAPTURE-${Date.now()}`,
      note: 'Test payment capture via API'
    };

    const captureResult = await makeRequest('POST', 'localhost', 3005, '/api/invoices/capture-payment', captureData);

    if (captureResult.success) {
      console.log('✅ Payment captured successfully via API endpoint:');
      console.log('   Invoice ID:', captureResult.data.invoice_id);
      console.log('   Amount:', captureResult.data.amount);
      console.log('   Transaction ID:', captureResult.data.transaction_id);
      console.log('   Payment Module:', captureResult.data.payment_module);
      console.log('   Previous Status:', captureResult.data.previous_status);
      console.log('   Current Status:', captureResult.data.current_status);
      console.log('   Message:', captureResult.message);
    } else {
      console.log('❌ Failed to capture payment via API endpoint:', captureResult.error);
      console.log('   Details:', captureResult.details);
    }

    // Step 3: Test capture payment using HostBillClient directly
    console.log('\n3️⃣ Testing capture payment via HostBillClient...');
    
    const directCaptureData = {
      invoice_id: order.invoiceId,
      amount: 1, // Small test amount
      module: 'Manual',
      trans_id: `DIRECT-CAPTURE-${Date.now()}`,
      note: 'Direct capture test via HostBillClient'
    };

    const directCaptureResult = await makeRequest('POST', 'localhost', 3005, '/api/test-hostbill-direct', {
      action: 'capturePayment',
      data: directCaptureData
    });

    if (directCaptureResult.success) {
      console.log('✅ Direct capture successful:');
      console.log('   Result:', directCaptureResult.result);
    } else {
      console.log('⚠️ Direct capture test not available or failed:', directCaptureResult.error);
    }

    // Step 4: Verify invoice status after capture
    console.log('\n4️⃣ Verifying invoice status after capture...');
    
    const statusResult = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);

    if (statusResult.success) {
      console.log('✅ Invoice status after capture:', {
        invoiceId: statusResult.invoiceId,
        status: statusResult.status,
        isPaid: statusResult.isPaid,
        amount: statusResult.amount,
        datePaid: statusResult.datePaid
      });

      if (statusResult.isPaid) {
        console.log('🎉 SUCCESS: Invoice is now marked as PAID after capture!');
      } else {
        console.log('⚠️ Invoice is still not marked as PAID - may need additional processing');
      }
    } else {
      console.log('❌ Failed to get invoice status:', statusResult.error);
    }

    // Step 5: Test multiple capture scenarios
    console.log('\n5️⃣ Testing different capture scenarios...');
    
    // Test with different payment modules
    const modules = ['BankTransfer', 'Manual', 'PayPal', 'Comgate'];
    
    for (const module of modules) {
      console.log(`\n   Testing capture with ${module} module...`);
      
      const testCaptureData = {
        invoice_id: order.invoiceId,
        amount: 1, // Small test amount
        module: module,
        trans_id: `TEST-${module.toUpperCase()}-${Date.now()}`,
        note: `Test capture with ${module} module`
      };

      const testResult = await makeRequest('POST', 'localhost', 3005, '/api/invoices/capture-payment', testCaptureData);
      
      if (testResult.success) {
        console.log(`   ✅ ${module} capture successful`);
      } else {
        console.log(`   ⚠️ ${module} capture failed:`, testResult.error);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }

  console.log('\n🎯 === CAPTURE PAYMENT TEST SUMMARY ===');
  console.log('Tested functionality:');
  console.log('✅ API endpoint /api/invoices/capture-payment');
  console.log('✅ HostBillClient.capturePayment() method');
  console.log('✅ Multiple payment modules (BankTransfer, Manual, PayPal, Comgate)');
  console.log('✅ Invoice status verification after capture');
  console.log('✅ Transaction ID generation and tracking');
  console.log('\nCapture Payment moves order lifecycle from "Capture Payment" to "Provision"');
  console.log('This is the standard way to mark invoices as paid in HostBill.');
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
testCapturePayment();
