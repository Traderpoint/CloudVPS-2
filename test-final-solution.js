/**
 * Test Final Solution - Billing Cycle Preservation with Unpaid Status
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

async function testFinalSolution() {
  console.log('🚀 Testing Final Solution - Billing Cycle + Unpaid Status');
  console.log('================================================================================');

  try {
    // Create test order with Monthly billing cycle
    console.log('1️⃣ Creating test order with Monthly billing cycle...');
    
    const orderData = {
      customer: {
        firstName: "Test",
        lastName: "FinalSolution",
        email: `test.final.${Date.now()}@example.com`,
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

    // Wait a bit for HostBill to process
    await new Promise(resolve => setTimeout(resolve, 3000));

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
        status: hosting.status,
        invStatus: orderDetails.details.invstatus
      });

      // Check invoice status if created
      if (orderDetails.details.invoice_id && orderDetails.details.invoice_id !== '0') {
        console.log('3️⃣ Checking invoice status...');
        
        const invoiceResult = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/invoice/${orderDetails.details.invoice_id}`);
        
        if (invoiceResult.success) {
          console.log('📋 Invoice status:', {
            invoiceId: orderDetails.details.invoice_id,
            status: invoiceResult.invoice.status,
            amount: invoiceResult.invoice.amount,
            autoMarkedAsPaid: invoiceResult.invoice.autoMarkedAsPaid,
            transactionCount: invoiceResult.invoice.debugInfo?.transactionCount,
            paymentMethod: invoiceResult.invoice.paymentMethod
          });

          // Final evaluation
          const billingCycleOK = hosting.billingcycle === 'Monthly';
          const invoiceUnpaid = invoiceResult.invoice.status === 'Unpaid';
          const noAutoTransactions = invoiceResult.invoice.autoMarkedAsPaid === false;

          console.log('\n🎯 FINAL EVALUATION:');
          console.log(`✅ Billing cycle preserved: ${billingCycleOK ? 'YES' : 'NO'} (${hosting.billingcycle})`);
          console.log(`✅ Invoice status correct: ${invoiceUnpaid ? 'YES (Unpaid)' : 'NO (' + invoiceResult.invoice.status + ')'}`);
          console.log(`✅ No auto-transactions: ${noAutoTransactions ? 'YES' : 'NO'}`);

          if (billingCycleOK && invoiceUnpaid && noAutoTransactions) {
            console.log('🎉 SUCCESS: All requirements met!');
          } else {
            console.log('⚠️ PARTIAL SUCCESS: Some requirements not met');
          }
        } else {
          console.log('❌ Failed to check invoice status:', invoiceResult.error);
        }
      } else {
        console.log('ℹ️ No invoice created (order only)');
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
testFinalSolution();
