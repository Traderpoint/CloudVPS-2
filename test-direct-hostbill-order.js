/**
 * Test Direct HostBill Order Creation (Bypass Middleware)
 * This will show us the default HostBill behavior without our modifications
 */

const https = require('https');
const querystring = require('querystring');

async function makeHostBillApiCall(params) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      api_id: 'adcdebb0e3b6f583052d',
      api_key: '341697c41aeb1c842f0d',
      ...params
    });

    const req = https.request('https://vps.kabel1it.cz/admin/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
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
    req.write(postData);
    req.end();
  });
}

async function testDirectHostBillOrder() {
  console.log('🚀 Testing Direct HostBill Order Creation (No Middleware)');
  console.log('================================================================================');
  console.log('This will show us the default HostBill behavior');
  console.log('================================================================================');

  try {
    // Use existing client ID 113 (TrueOldStyle Customer)
    const clientId = '113';
    
    console.log('1️⃣ Creating direct HostBill order...');
    
    // Create order directly via HostBill API
    const orderParams = {
      call: 'addOrder',
      client_id: clientId,
      pid: '5', // VPS Start product ID
      billingcycle: 'Quarterly',
      payment_method: '0' // Credit Balance
    };

    console.log('📤 Direct HostBill API call:', orderParams);

    const orderResult = await makeHostBillApiCall(orderParams);
    
    if (!orderResult.success || !orderResult.order_id) {
      console.log('❌ Direct order creation failed:', orderResult);
      return;
    }

    console.log('✅ Direct HostBill order created:', {
      orderId: orderResult.order_id,
      success: orderResult.success
    });

    // Wait for HostBill to process
    console.log('⏳ Waiting for HostBill to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get order details
    console.log('2️⃣ Getting direct order details...');
    
    const orderDetails = await makeHostBillApiCall({
      call: 'getOrderDetails',
      id: orderResult.order_id
    });

    if (orderDetails.success && orderDetails.details) {
      const hosting = orderDetails.details.hosting[0];
      
      console.log('📋 Direct HostBill order details:');
      console.log('================================================================================');
      
      const directOrder = {
        orderId: orderResult.order_id,
        invoiceId: orderDetails.details.invoice_id,
        invStatus: orderDetails.details.invstatus,
        invCredit: orderDetails.details.invcredit,
        billingCycle: hosting.billingcycle,
        total: hosting.total,
        paymentModule: orderDetails.details.payment_module,
        clientId: orderDetails.details.client_id,
        balance: orderDetails.details.balance
      };

      console.log(`Order ID:        ${directOrder.orderId}`);
      console.log(`Invoice ID:      ${directOrder.invoiceId}`);
      console.log(`Invoice Status:  ${directOrder.invStatus}`);
      console.log(`Invoice Credit:  ${directOrder.invCredit} CZK`);
      console.log(`Billing Cycle:   ${directOrder.billingCycle}`);
      console.log(`Total:           ${directOrder.total} CZK`);
      console.log(`Payment Module:  ${directOrder.paymentModule}`);
      console.log(`Balance:         ${directOrder.balance}`);

      // Get client details
      console.log('\n3️⃣ Getting client details...');
      
      const clientDetails = await makeHostBillApiCall({
        call: 'getClientDetails',
        id: directOrder.clientId
      });

      if (clientDetails.success && clientDetails.client) {
        const clientCredit = clientDetails.client.credit;
        
        console.log('👤 Client details:', {
          clientId: directOrder.clientId,
          firstName: clientDetails.client.firstname,
          lastName: clientDetails.client.lastname,
          email: clientDetails.client.email,
          credit: clientCredit
        });

        // Final evaluation
        console.log('\n🎯 DIRECT HOSTBILL BEHAVIOR EVALUATION:');
        console.log('================================================================================');
        
        const billingCycleOK = directOrder.billingCycle === 'Quarterly';
        const paymentMethodOK = directOrder.paymentModule === '0';
        const invoicePaid = directOrder.invStatus === 'Paid';
        const hasPositiveCredit = parseFloat(directOrder.invCredit || 0) > 0;
        const clientHasCredit = parseFloat(clientCredit || 0) > 0;
        
        console.log(`✅ Billing Cycle: ${billingCycleOK ? 'CORRECT' : 'INCORRECT'} (${directOrder.billingCycle})`);
        console.log(`✅ Payment Method: ${paymentMethodOK ? 'CORRECT' : 'INCORRECT'} (ID: ${directOrder.paymentModule})`);
        console.log(`✅ Invoice Status: ${invoicePaid ? 'PAID (DEFAULT)' : 'UNPAID (DEFAULT)'} (${directOrder.invStatus})`);
        console.log(`✅ Invoice Credit: ${hasPositiveCredit ? 'POSITIVE (DEFAULT)' : 'ZERO (DEFAULT)'} (${directOrder.invCredit} CZK)`);
        console.log(`✅ Client Credit: ${clientHasCredit ? 'POSITIVE' : 'ZERO'} (${clientCredit} CZK)`);
        console.log(`✅ Balance: ${directOrder.balance}`);

        console.log('\n📊 COMPARISON WITH MIDDLEWARE ORDERS:');
        console.log('================================================================================');
        
        if (invoicePaid && hasPositiveCredit) {
          console.log('🎉 DEFAULT HOSTBILL BEHAVIOR: Auto-Paid with positive credit!');
          console.log('   - This means our middleware is modifying the default behavior');
          console.log('   - HostBill naturally creates Paid invoices with positive credit');
          console.log('   - Our middleware must be resetting them to Unpaid');
        } else {
          console.log('⚠️ DEFAULT HOSTBILL BEHAVIOR: Unpaid with zero credit');
          console.log('   - This means HostBill itself creates Unpaid invoices');
          console.log('   - Our middleware is not the cause of Unpaid status');
          console.log('   - This might be a HostBill configuration issue');
        }

        // Summary
        console.log('\n📊 DIRECT HOSTBILL SUMMARY:');
        console.log('================================================================================');
        console.log(`Order: ${directOrder.orderId} (Direct HostBill)`);
        console.log(`Invoice: ${directOrder.invoiceId}`);
        console.log(`Billing Cycle: ${directOrder.billingCycle}`);
        console.log(`Invoice Status: ${directOrder.invStatus}`);
        console.log(`Invoice Credit: ${directOrder.invCredit} CZK`);
        console.log(`Client Credit: ${clientCredit} CZK`);
        console.log(`Balance: ${directOrder.balance}`);
        console.log(`Behavior: ${invoicePaid && hasPositiveCredit ? 'Auto-Paid (Original)' : 'Manual (Modified)'}`);
      }
    } else {
      console.log('❌ Failed to get direct order details:', orderDetails.error);
    }

  } catch (error) {
    console.error('❌ Direct test failed:', error.message);
  }

  console.log('\n✅ Direct HostBill test completed!');
}

// Run the script
testDirectHostBillOrder();
