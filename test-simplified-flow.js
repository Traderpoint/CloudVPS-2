// Test zjednodušeného 3-krokového payment flow
const http = require('http');

async function testSimplifiedFlow() {
  console.log('🎯 Test zjednodušeného 3-krokového payment flow');
  console.log('📋 Kroky: 1. Create Order → 2. Initialize Payment → 3. Return & Capture Payment\n');

  try {
    // KROK 1: Create Order
    console.log('=== KROK 1: CREATE ORDER ===');
    const orderData = {
      customer: {
        firstName: 'Simplified',
        lastName: 'Flow',
        email: 'simplified.flow@example.com',
        phone: '+420123456789',
        address: 'Simplified Flow Address 123',
        city: 'Prague',
        postalCode: '12000',
        country: 'CZ'
      },
      items: [
        {
          productId: '1',
          name: 'Simplified Flow VPS',
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
      console.log('❌ KROK 1 FAILED - Create Order:', orderResult.error);
      return;
    }

    const order = orderResult.orders[0];
    console.log('✅ KROK 1 SUCCESS - Order created:');
    console.log(`   Order ID: ${order.orderId}`);
    console.log(`   Invoice ID: ${order.invoiceId}`);
    console.log(`   Amount: ${order.price} CZK`);

    // Zkontroluj initial invoice status
    const initialStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    console.log('📊 Initial invoice status:');
    console.log(`   Status: ${initialStatus.status}`);
    console.log(`   isPaid: ${initialStatus.isPaid}`);

    if (!initialStatus.isPaid) {
      console.log('✅ CORRECT: Invoice starts as Unpaid');
    } else {
      console.log('⚠️ WARNING: Invoice is already PAID initially');
    }

    // KROK 2: Initialize Payment
    console.log('\n=== KROK 2: INITIALIZE PAYMENT ===');
    const paymentData = {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: 604,
      currency: 'CZK',
      method: 'comgate',
      customerEmail: 'simplified.flow@example.com',
      customerName: 'Simplified Flow',
      customerPhone: '+420123456789',
      description: 'Simplified Flow VPS'
    };

    const paymentResult = await makeRequest('POST', 'localhost', 3005, '/api/payments/comgate/initialize', paymentData);
    
    if (!paymentResult.success) {
      console.log('❌ KROK 2 FAILED - Initialize Payment:', paymentResult.error);
      return;
    }

    console.log('✅ KROK 2 SUCCESS - Payment initialized:');
    console.log(`   Transaction ID: ${paymentResult.transactionId}`);
    console.log(`   Status: ${paymentResult.status}`);
    console.log(`   Payment URL: ${paymentResult.redirectUrl ? 'Generated' : 'Not generated'}`);

    // KROK 3: Return & Capture Payment (nová zjednodušená logika)
    console.log('\n=== KROK 3: RETURN & CAPTURE PAYMENT ===');
    console.log('Simuluji kliknutí na "Return from Payment" tlačítko...');
    console.log('Toto nyní dělá:');
    console.log('1. Simuluje návrat z platební brány');
    console.log('2. OKAMŽITĚ volá Capture Payment');
    console.log('3. Označí fakturu jako PAID');
    console.log('4. Zobrazí finální status');

    // Simuluji payment return
    const returnUrl = `http://localhost:3005/api/payments/return?` +
      `invoiceId=${order.invoiceId}&` +
      `status=success&` +
      `amount=604&` +
      `paymentMethod=comgate&` +
      `transactionId=SIMPLIFIED-${order.invoiceId}`;

    console.log('📤 Processing payment return:', returnUrl);

    let returnResult;
    try {
      const returnResponse = await fetch(returnUrl, { method: 'GET' });
      const contentType = returnResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('text/html')) {
        returnResult = { success: true, htmlResponse: true };
      } else {
        returnResult = await returnResponse.json();
      }
    } catch (error) {
      returnResult = { error: 'Return processing failed', details: error.message };
    }

    console.log('📥 Payment return result:', returnResult.success ? 'Success' : 'Failed');

    // OKAMŽITĚ volej Capture Payment (klíčová část)
    console.log('💰 OKAMŽITĚ volám Capture Payment...');
    
    const captureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
      invoice_id: order.invoiceId,
      amount: 604,
      module: 'Comgate',
      trans_id: `SIMPLIFIED-${order.invoiceId}`,
      note: 'Payment captured in simplified 3-step flow'
    });

    if (captureResult.success) {
      console.log('✅ KROK 3 SUCCESS - Capture Payment completed:');
      console.log(`   Previous Status: ${captureResult.data?.previous_status}`);
      console.log(`   Current Status: ${captureResult.data?.current_status}`);
      console.log(`   Transaction ID: ${captureResult.data?.transaction_id}`);
    } else {
      console.log('❌ KROK 3 FAILED - Capture Payment:', captureResult.error);
      return;
    }

    // Finální status check (po 1 sekundě)
    console.log('\n⏱️ Čekám 1 sekundu a kontroluji finální status...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    
    console.log('📊 FINÁLNÍ STATUS:');
    console.log(`   Status: ${finalStatus.status}`);
    console.log(`   isPaid: ${finalStatus.isPaid}`);
    console.log(`   Amount: ${finalStatus.amount}`);
    console.log(`   Date paid: ${finalStatus.datePaid}`);

    if (finalStatus.isPaid && finalStatus.status === 'Paid') {
      console.log('🎉 ✅ ZJEDNODUŠENÝ FLOW FUNGUJE PERFEKTNĚ!');
      console.log('📱 UI zobrazí: "✅ Payment Completed & Verified - PAID"');
    } else {
      console.log('❌ PROBLÉM: Faktura není označena jako PAID');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }

  console.log('\n🎯 === ZJEDNODUŠENÝ FLOW SUMMARY ===');
  console.log('📋 Nový 3-krokový flow:');
  console.log('   1. ✅ Create Order - vytvoří objednávku a fakturu');
  console.log('   2. ✅ Initialize Payment - inicializuje platbu');
  console.log('   3. ✅ Return & Capture Payment - simuluje návrat + capture + zobrazí status');
  console.log('');
  console.log('🔧 Změny oproti původnímu flow:');
  console.log('   ❌ Odstraněn krok 4 "Verify Status"');
  console.log('   ✅ Krok 3 nyní dělá vše: return + capture + status');
  console.log('   ✅ Jednodušší a rychlejší pro uživatele');
  console.log('   ✅ Méně klikání, stejný výsledek');
  console.log('');
  console.log('🔗 Otestuj na: http://localhost:3000/payment-flow-test');
  console.log('   → Nyní jen 3 tlačítka místo 4!');
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

// Run the simplified flow test
testSimplifiedFlow();
