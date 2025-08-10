// Detailní debug test payment-flow-test - krok za krokem
const http = require('http');

async function debugPaymentFlow() {
  console.log('🔍 DETAILNÍ DEBUG TEST payment-flow-test');
  console.log('📋 Testuji každý krok flow samostatně...\n');

  try {
    // KROK 1: Create Order
    console.log('=== KROK 1: CREATE ORDER ===');
    const orderData = {
      customer: {
        firstName: 'Debug',
        lastName: 'Test',
        email: 'debug.test@example.com',
        phone: '+420123456789',
        address: 'Debug Address 123',
        city: 'Prague',
        postalCode: '12000',
        country: 'CZ'
      },
      items: [
        {
          productId: '1',
          name: 'Debug Test VPS',
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
    console.log(`   Amount: ${initialStatus.amount}`);
    console.log(`   Date paid: ${initialStatus.datePaid}`);

    if (initialStatus.isPaid) {
      console.log('⚠️ WARNING: Invoice is already PAID at creation - this is wrong!');
    } else {
      console.log('✅ CORRECT: Invoice starts as Unpaid');
    }

    // KROK 2: Initialize Payment
    console.log('\n=== KROK 2: INITIALIZE PAYMENT ===');
    const paymentData = {
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      amount: 604,
      currency: 'CZK',
      method: 'comgate',
      customerEmail: 'debug.test@example.com',
      customerName: 'Debug Test',
      customerPhone: '+420123456789',
      description: 'Debug Test VPS'
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

    // KROK 3: Simulate Test Payment (jako tlačítko "Test Payment")
    console.log('\n=== KROK 3: SIMULATE TEST PAYMENT ===');
    console.log('Simuluji kliknutí na "Test Payment" tlačítko...');

    // Toto je to, co dělá simulateCallback funkce
    const returnUrl = `http://localhost:3005/api/payments/return?` +
      `invoiceId=${order.invoiceId}&` +
      `status=success&` +
      `amount=604&` +
      `paymentMethod=comgate&` +
      `transactionId=TEST-FLOW-${order.invoiceId}`;

    console.log('📤 Calling payment return URL:', returnUrl);

    const returnResponse = await makeRequest('GET', 'localhost', 3005, 
      `/api/payments/return?invoiceId=${order.invoiceId}&status=success&amount=604&paymentMethod=comgate&transactionId=TEST-FLOW-${order.invoiceId}`);

    console.log('📥 Payment return response:', returnResponse.success ? 'Success' : 'Failed');
    if (returnResponse.error) {
      console.log('   Error:', returnResponse.error);
    }

    // Zkontroluj status po return
    await new Promise(resolve => setTimeout(resolve, 500));
    const afterReturnStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    console.log('📊 Invoice status after return:');
    console.log(`   Status: ${afterReturnStatus.status}`);
    console.log(`   isPaid: ${afterReturnStatus.isPaid}`);
    console.log(`   Date paid: ${afterReturnStatus.datePaid}`);

    if (afterReturnStatus.isPaid) {
      console.log('⚠️ WARNING: Invoice is PAID after return - this should not happen!');
    } else {
      console.log('✅ CORRECT: Invoice is still Unpaid after return');
    }

    // KROK 4: Capture Payment (toto by měl dělat simulateCallback)
    console.log('\n=== KROK 4: CAPTURE PAYMENT ===');
    console.log('Volám Capture Payment (toto by měl dělat simulateCallback automaticky)...');

    const captureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
      invoice_id: order.invoiceId,
      amount: 604,
      module: 'Comgate',
      trans_id: `TEST-FLOW-${order.invoiceId}`,
      note: 'Payment captured after successful comgate test payment'
    });

    if (captureResult.success) {
      console.log('✅ KROK 4 SUCCESS - Capture Payment:');
      console.log(`   Message: ${captureResult.message}`);
      console.log(`   Previous Status: ${captureResult.data?.previous_status}`);
      console.log(`   Current Status: ${captureResult.data?.current_status}`);
      console.log(`   Transaction ID: ${captureResult.data?.transaction_id}`);
    } else {
      console.log('❌ KROK 4 FAILED - Capture Payment:', captureResult.error);
      console.log('   Details:', captureResult.details);
    }

    // KROK 5: Final Status Check
    console.log('\n=== KROK 5: FINAL STATUS CHECK ===');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    const finalStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
    console.log('📊 FINAL invoice status:');
    console.log(`   Status: ${finalStatus.status}`);
    console.log(`   isPaid: ${finalStatus.isPaid}`);
    console.log(`   Amount: ${finalStatus.amount}`);
    console.log(`   Date paid: ${finalStatus.datePaid}`);

    if (finalStatus.isPaid && finalStatus.status === 'Paid') {
      console.log('🎉 SUCCESS: Invoice is properly marked as PAID!');
    } else {
      console.log('❌ PROBLEM: Invoice is NOT properly marked as PAID!');
      console.log('   This is the root cause of the issue.');
    }

    // ANALÝZA PROBLÉMU
    console.log('\n=== ANALÝZA PROBLÉMU ===');
    
    if (!finalStatus.isPaid) {
      console.log('🔍 Možné příčiny proč faktura není PAID:');
      console.log('   1. Capture Payment API nefunguje správně');
      console.log('   2. HostBill API neaktualizuje status');
      console.log('   3. Invoice status endpoint má špatnou logiku');
      console.log('   4. simulateCallback funkce nevolá Capture Payment');
      
      // Test přímého HostBill API
      console.log('\n🧪 Test přímého HostBill API...');
      
      try {
        const directHostBillTest = await makeRequest('POST', 'localhost', 3005, '/api/invoices/capture-payment', {
          invoice_id: order.invoiceId,
          amount: 604,
          module: 'BankTransfer',
          trans_id: `DIRECT-TEST-${Date.now()}`,
          note: 'Direct HostBill API test'
        });
        
        if (directHostBillTest.success) {
          console.log('✅ Direct HostBill API works');
          
          // Check status again
          await new Promise(resolve => setTimeout(resolve, 1000));
          const afterDirectTest = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
          console.log('📊 Status after direct HostBill test:');
          console.log(`   Status: ${afterDirectTest.status}`);
          console.log(`   isPaid: ${afterDirectTest.isPaid}`);
          
          if (afterDirectTest.isPaid) {
            console.log('✅ Direct HostBill API successfully marked invoice as PAID');
            console.log('🔍 Problem is in payment-flow-test logic, not in HostBill API');
          } else {
            console.log('❌ Even direct HostBill API did not mark invoice as PAID');
            console.log('🔍 Problem is in HostBill API or invoice status logic');
          }
        } else {
          console.log('❌ Direct HostBill API failed:', directHostBillTest.error);
        }
      } catch (error) {
        console.log('❌ Direct HostBill API test error:', error.message);
      }
    }

  } catch (error) {
    console.error('💥 Debug test failed:', error.message);
  }

  console.log('\n🎯 === DEBUG SUMMARY ===');
  console.log('Zkontroluj výše uvedené kroky a identifikuj kde se flow láme.');
  console.log('Nejčastější problémy:');
  console.log('1. simulateCallback nevolá Capture Payment');
  console.log('2. Capture Payment API má chybu');
  console.log('3. Invoice status logika je špatná');
  console.log('4. HostBill API neaktualizuje status správně');
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

// Run the debug test
debugPaymentFlow();
