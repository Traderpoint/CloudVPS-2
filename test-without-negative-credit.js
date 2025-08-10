/**
 * Test Quarterly Order Creation WITHOUT Negative Credit Logic
 * Should behave like the original system with auto-Paid invoices
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

async function testWithoutNegativeCredit() {
  console.log('🚀 Testing Quarterly Order WITHOUT Negative Credit Logic');
  console.log('================================================================================');
  console.log('Expected Behavior (Original System):');
  console.log('- Invoice Status: Paid (automatic)');
  console.log('- Invoice Credit: 1085 CZK (positive)');
  console.log('- Client Credit: 1085 CZK (positive)');
  console.log('- No reset to Unpaid');
  console.log('================================================================================');

  try {
    const timestamp = Date.now();
    
    const orderData = {
      customer: {
        firstName: "NoNegativeCredit",
        lastName: "TestCustomer",
        email: `no.negative.credit.${timestamp}@testcustomer.com`,
        phone: "+420777666555",
        address: "No Negative Credit Street 456",
        city: "Brno",
        postalCode: "60200",
        country: "CZ",
        company: `No Negative Credit s.r.o. ${timestamp}`
      },
      items: [{
        productId: "1",
        name: "VPS Start",
        quantity: 1,
        price: 299,
        cycle: "q" // Quarterly billing cycle
      }],
      paymentMethod: "banktransfer", // Credit Balance
      total: 897 // 299 * 3 months for quarterly
    };

    console.log('📤 Creating order WITHOUT negative credit logic:', {
      customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
      email: orderData.customer.email,
      company: orderData.customer.company,
      cycle: 'Quarterly',
      paymentMethod: 'banktransfer',
      total: orderData.total,
      expectedBehavior: 'Auto-Paid with positive credit (original behavior)'
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

    // Wait for HostBill to process (without negative credit logic)
    console.log('⏳ Waiting for HostBill to process (original behavior)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check order details via HostBill API
    console.log('2️⃣ Checking order details...');
    
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
      
      console.log('📋 Order details (without negative credit):');
      console.log('================================================================================');
      
      const currentOrder = {
        orderId: order.orderId,
        invoiceId: orderDetails.details.invoice_id,
        invStatus: orderDetails.details.invstatus,
        invCredit: orderDetails.details.invcredit,
        billingCycle: hosting.billingcycle,
        total: hosting.total,
        paymentModule: orderDetails.details.payment_module,
        clientId: orderDetails.details.client_id
      };

      console.log(`Order ID:        ${currentOrder.orderId}`);
      console.log(`Invoice ID:      ${currentOrder.invoiceId}`);
      console.log(`Invoice Status:  ${currentOrder.invStatus}`);
      console.log(`Invoice Credit:  ${currentOrder.invCredit} CZK`);
      console.log(`Billing Cycle:   ${currentOrder.billingCycle}`);
      console.log(`Total:           ${currentOrder.total} CZK`);
      console.log(`Payment Module:  ${currentOrder.paymentModule}`);

      // Check client details
      console.log('\n3️⃣ Checking client details...');
      
      const clientParams = querystring.stringify({
        api_id: 'adcdebb0e3b6f583052d',
        api_key: '341697c41aeb1c842f0d',
        call: 'getClientDetails',
        id: currentOrder.clientId
      });

      const clientDetails = await new Promise((resolve, reject) => {
        const req = https.request('https://vps.kabel1it.cz/admin/api.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(clientParams)
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
        req.write(clientParams);
        req.end();
      });

      if (clientDetails.success && clientDetails.client) {
        const clientCredit = clientDetails.client.credit;
        
        console.log('👤 Client details:', {
          clientId: currentOrder.clientId,
          firstName: clientDetails.client.firstname,
          lastName: clientDetails.client.lastname,
          email: clientDetails.client.email,
          company: clientDetails.client.companyname,
          credit: clientCredit,
          creditBalance: parseFloat(clientCredit || 0)
        });

        // Check invoice details
        if (currentOrder.invoiceId && currentOrder.invoiceId !== '0') {
          console.log('4️⃣ Checking invoice details...');
          
          const invoiceResult = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/invoice/${currentOrder.invoiceId}`);
          
          if (invoiceResult.success) {
            console.log('💰 Invoice details:', {
              invoiceId: currentOrder.invoiceId,
              status: invoiceResult.invoice.status,
              amount: invoiceResult.invoice.amount,
              credit: invoiceResult.invoice.credit,
              autoMarkedAsPaid: invoiceResult.invoice.autoMarkedAsPaid
            });
          }
        }

        // Final evaluation
        console.log('\n🎯 WITHOUT NEGATIVE CREDIT EVALUATION:');
        console.log('================================================================================');
        
        const billingCycleOK = currentOrder.billingCycle === 'Quarterly';
        const paymentMethodOK = currentOrder.paymentModule === '0';
        const invoicePaid = currentOrder.invStatus === 'Paid';
        const hasPositiveCredit = parseFloat(currentOrder.invCredit || 0) > 0;
        const clientHasCredit = parseFloat(clientCredit || 0) > 0;
        
        console.log(`✅ Billing Cycle: ${billingCycleOK ? 'CORRECT' : 'INCORRECT'} (${currentOrder.billingCycle})`);
        console.log(`✅ Payment Method: ${paymentMethodOK ? 'CORRECT' : 'INCORRECT'} (ID: ${currentOrder.paymentModule})`);
        console.log(`✅ Invoice Status: ${invoicePaid ? 'PAID (ORIGINAL)' : 'UNPAID (NEW LOGIC)'} (${currentOrder.invStatus})`);
        console.log(`✅ Invoice Credit: ${hasPositiveCredit ? 'POSITIVE (ORIGINAL)' : 'ZERO (NEW LOGIC)'} (${currentOrder.invCredit} CZK)`);
        console.log(`✅ Client Credit: ${clientHasCredit ? 'POSITIVE (ORIGINAL)' : 'ZERO (NEW LOGIC)'} (${clientCredit} CZK)`);

        if (billingCycleOK && paymentMethodOK && invoicePaid && hasPositiveCredit && clientHasCredit) {
          console.log('\n🎉 SUCCESS: Original behavior restored!');
          console.log('   - Quarterly billing cycle preserved ✅');
          console.log('   - Invoice automatically marked as Paid ✅');
          console.log('   - Invoice has positive credit ✅');
          console.log('   - Client has positive credit ✅');
          console.log('   - No negative credit logic applied ✅');
        } else {
          console.log('\n⚠️ PARTIAL: Some new logic still active');
          console.log(`   - Invoice Status: ${currentOrder.invStatus} (expected: Paid)`);
          console.log(`   - Invoice Credit: ${currentOrder.invCredit} (expected: > 0)`);
          console.log(`   - Client Credit: ${clientCredit} (expected: > 0)`);
        }

        // Summary
        console.log('\n📊 SUMMARY:');
        console.log('================================================================================');
        console.log(`Customer: ${clientDetails.client.firstname} ${clientDetails.client.lastname}`);
        console.log(`Order: ${currentOrder.orderId}`);
        console.log(`Invoice: ${currentOrder.invoiceId}`);
        console.log(`Billing Cycle: ${currentOrder.billingCycle}`);
        console.log(`Invoice Status: ${currentOrder.invStatus}`);
        console.log(`Invoice Credit: ${currentOrder.invCredit} CZK`);
        console.log(`Client Credit: ${clientCredit} CZK`);
        console.log(`Behavior: ${invoicePaid && hasPositiveCredit ? 'Original (Auto-Paid)' : 'Modified (Manual)'}`);
      }
    } else {
      console.log('❌ Failed to get order details:', orderDetails.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n✅ Test without negative credit completed!');
}

// Run the script
testWithoutNegativeCredit();
