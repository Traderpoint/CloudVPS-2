/**
 * Test Banktransfer Module with as_free: 0
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

async function testBankTransferModule() {
  console.log('🚀 Testing Banktransfer Module with as_free: 0');
  console.log('================================================================================');

  try {
    // Create test order with banktransfer
    console.log('1️⃣ Creating test order with banktransfer...');
    
    const orderData = {
      customer: {
        firstName: "Test",
        lastName: "BankTransfer",
        email: `test.banktransfer.${Date.now()}@example.com`,
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
      paymentMethod: "banktransfer", // Banktransfer (maps to ID 0)
      total: 361.79
    };

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

    // Check invoice status
    console.log('2️⃣ Checking invoice status...');
    
    if (order.invoiceId && order.invoiceId !== '0') {
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
    } else {
      console.log('🟢 RESULT: No invoice created (correct behavior)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n✅ Test completed!');
}

// Run the test
testBankTransferModule();
