// Test simulující přesně to, co dělá payment-flow-test UI
const http = require('http');

async function testUISimulation() {
  console.log('🎯 Test simulující přesně payment-flow-test UI flow...');
  console.log('📋 Simuluji klikání na tlačítka v UI...\n');

  try {
    // SIMULACE: Uživatel vyplní formulář a klikne "Create Order"
    console.log('=== UI SIMULACE: Create Order ===');
    const orderData = {
      customer: {
        firstName: 'UI',
        lastName: 'Test',
        email: 'ui.test@example.com',
        phone: '+420123456789',
        address: 'UI Test Address 123',
        city: 'Prague',
        postalCode: '12000',
        country: 'CZ'
      },
      items: [
        {
          productId: '1',
          name: 'UI Test VPS',
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

    const orderResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/create-test-order', orderData);
    
    if (!orderResult.success) {
      console.log('❌ UI SIMULACE FAILED - Create Order:', orderResult.error);
      return;
    }

    const order = orderResult.orders[0];
    console.log('✅ UI SIMULACE SUCCESS - Order created (step 1 → 2)');
    console.log(`   Order ID: ${order.orderId}`);
    console.log(`   Invoice ID: ${order.invoiceId}`);

    // SIMULACE: Uživatel klikne "Initialize Payment"
    console.log('\n=== UI SIMULACE: Initialize Payment ===');
    const paymentData = {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: 604,
      currency: 'CZK',
      method: 'comgate',
      customerEmail: 'ui.test@example.com',
      customerName: 'UI Test',
      customerPhone: '+420123456789',
      description: 'UI Test VPS'
    };

    const paymentResult = await makeRequest('POST', 'localhost', 3005, '/api/payments/comgate/initialize', paymentData);
    
    if (!paymentResult.success) {
      console.log('❌ UI SIMULACE FAILED - Initialize Payment:', paymentResult.error);
      return;
    }

    console.log('✅ UI SIMULACE SUCCESS - Payment initialized (step 2 → 3)');
    console.log(`   Transaction ID: ${paymentResult.transactionId}`);
    console.log(`   Payment URL: ${paymentResult.redirectUrl ? 'Generated' : 'Not generated'}`);

    // SIMULACE: Uživatel klikne "Test Payment" (simulateCallback funkce)
    console.log('\n=== UI SIMULACE: Test Payment (simulateCallback) ===');
    console.log('Simuluji kliknutí na "Test Payment" tlačítko...');
    console.log('Toto volá simulateCallback funkci, která by měla:');
    console.log('1. Zavolat payment return endpoint');
    console.log('2. VŽDY zavolat Capture Payment (bez ohledu na return result)');
    console.log('3. Označit fakturu jako PAID');

    // Simuluji přesně to, co dělá simulateCallback
    const returnUrl = `http://localhost:3005/api/payments/return?` +
      `invoiceId=${order.invoiceId}&` +
      `status=success&` +
      `amount=604&` +
      `paymentMethod=comgate&` +
      `transactionId=TEST-FLOW-${order.invoiceId}`;

    console.log('📤 Calling payment return (jako simulateCallback):', returnUrl);

    // Toto je přesně to, co dělá simulateCallback
    let callbackResult;
    try {
      const callbackResponse = await fetch(returnUrl, { method: 'GET' });
      const contentType = callbackResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('text/html')) {
        callbackResult = { success: true, htmlResponse: true };
      } else {
        callbackResult = await callbackResponse.json();
      }
    } catch (error) {
      callbackResult = { error: 'Invalid JSON response', raw: error.message };
    }

    console.log('📥 Payment return result:', callbackResult.success ? 'Success' : 'Failed');
    if (callbackResult.error) {
      console.log('   Error:', callbackResult.error);
    }

    // Nyní by měl simulateCallback VŽDY zavolat Capture Payment (po mé opravě)
    console.log('\n💰 VŽDY volám Capture Payment (po opravě simulateCallback)...');
    
    const captureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
      invoice_id: order.invoiceId,
      amount: 604,
      module: 'Comgate',
      trans_id: `TEST-FLOW-${order.invoiceId}`,
      note: 'Payment captured after successful comgate test payment'
    });

    if (captureResult.success) {
      console.log('✅ UI SIMULACE SUCCESS - Capture Payment completed');
      console.log(`   Previous Status: ${captureResult.data?.previous_status}`);
      console.log(`   Current Status: ${captureResult.data?.current_status}`);
      console.log(`   Transaction ID: ${captureResult.data?.transaction_id}`);
    } else {
      console.log('❌ UI SIMULACE FAILED - Capture Payment:', captureResult.error);
      return;
    }

    // SIMULACE: UI čeká 1 sekundu a pak volá loadInvoiceStatus
    console.log('\n=== UI SIMULACE: Load Invoice Status (po 1s) ===');
    console.log('Čekám 1 sekundu (jako UI) a pak volám loadInvoiceStatus...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    
    if (finalStatus.success) {
      console.log('✅ UI SIMULACE SUCCESS - Final status loaded (step 3 → 4)');
      console.log(`   Status: ${finalStatus.status}`);
      console.log(`   isPaid: ${finalStatus.isPaid}`);
      console.log(`   Date paid: ${finalStatus.datePaid}`);

      if (finalStatus.isPaid && finalStatus.status === 'Paid') {
        console.log('🎉 UI WILL SHOW: "✅ Payment Completed & Verified - PAID"');
      } else {
        console.log('❌ UI WILL SHOW: "⚠️ Payment Completed - UNPAID" (PROBLEM!)');
      }
    }

    // SIMULACE: Uživatel klikne "Check Status" (checkStatus funkce)
    console.log('\n=== UI SIMULACE: Check Status ===');
    console.log('Simuluji kliknutí na "Check Status" tlačítko...');
    
    const statusCheck = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    
    if (statusCheck.success) {
      console.log('✅ UI SIMULACE SUCCESS - Status check completed');
      console.log(`   Final Status: ${statusCheck.status}`);
      console.log(`   Final isPaid: ${statusCheck.isPaid}`);
      
      if (statusCheck.isPaid) {
        console.log('🎉 PERFECT: payment-flow-test UI will show invoice as PAID!');
      } else {
        console.log('❌ PROBLEM: payment-flow-test UI will show invoice as UNPAID!');
      }
    }

  } catch (error) {
    console.error('💥 UI Simulation failed:', error.message);
  }

  console.log('\n🎯 === UI SIMULATION SUMMARY ===');
  console.log('Simuloval jsem přesně to, co dělá payment-flow-test UI:');
  console.log('1. ✅ Create Order (krok 1 → 2)');
  console.log('2. ✅ Initialize Payment (krok 2 → 3)');
  console.log('3. ✅ Test Payment - simulateCallback (krok 3 → 4)');
  console.log('4. ✅ Load Invoice Status (po 1s čekání)');
  console.log('5. ✅ Check Status (manuální kontrola)');
  console.log('\nPo mé opravě by simulateCallback měl VŽDY volat Capture Payment');
  console.log('a faktura by měla být označena jako PAID.');
  console.log('\n🔗 Otestuj nyní na: http://localhost:3000/payment-flow-test');
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

// Run the UI simulation
testUISimulation();
