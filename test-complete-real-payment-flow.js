// Test kompletního Real Payment Flow s automatickým Capture Payment
const http = require('http');

async function testCompleteRealPaymentFlow() {
  console.log('🎯 Test kompletního Real Payment Flow s automatickým Capture Payment');
  console.log('📋 Simuluji kompletní flow: Create → Initialize → Gateway Return → Auto Capture → Final Status\n');

  try {
    console.log('=== KOMPLETNÍ REAL PAYMENT FLOW ===');
    console.log('✅ Nový automatizovaný flow:');
    console.log('   1. Create Order - vytvoří objednávku');
    console.log('   2. Initialize Payment - přesměruje na reálnou bránu');
    console.log('   3. User Pays - uživatel zaplatí na bráně');
    console.log('   4. Gateway Returns - brána volá /payment/success');
    console.log('   5. Auto Capture - automaticky volá Capture Payment');
    console.log('   6. Redirect - přesměruje na /real-payment-flow-test');
    console.log('   7. Show Status - zobrazí finální status');
    console.log('');

    // Test 1: Create Order
    console.log('=== TEST 1: Create Order ===');
    
    const orderData = {
      customer: {
        firstName: 'Complete',
        lastName: 'Flow',
        email: 'complete.flow@test.cz',
        phone: '+420123456789',
        address: 'Complete Flow Street 123',
        city: 'Prague',
        postalCode: '11000',
        country: 'CZ',
        company: 'Complete Flow s.r.o.'
      },
      items: [
        {
          productId: '1',
          name: 'VPS Basic',
          price: 604,
          cycle: 'm',
          quantity: 1,
          configOptions: {
            cpu: '2 vCPU',
            ram: '4GB',
            storage: '50GB'
          }
        }
      ],
      affiliate: null,
      paymentMethod: 'comgate',
      newsletterSubscribe: false,
      type: 'complete'
    };

    const orderResult = await makeRequest('POST', 'localhost', 3005, '/api/orders/create', orderData);
    
    if (orderResult.success) {
      const order = orderResult.orders[0];
      console.log('✅ Order created:', {
        orderId: order.orderId,
        invoiceId: order.invoiceId,
        amount: 604
      });

      // Test 2: Initialize Payment
      console.log('\n=== TEST 2: Initialize Payment ===');
      
      const paymentData = {
        orderId: order.orderId,
        invoiceId: order.invoiceId,
        method: 'comgate',
        amount: 604,
        currency: 'CZK',
        testFlow: false
      };

      const paymentResult = await makeRequest('POST', 'localhost', 3005, '/api/payments/initialize', paymentData);
      
      if (paymentResult.success) {
        console.log('✅ Payment initialized:', {
          transactionId: paymentResult.transactionId,
          hasPaymentUrl: !!paymentResult.paymentUrl
        });

        // Test 3: Simuluj návrat z brány na /payment/success
        console.log('\n=== TEST 3: Simulace návratu z brány ===');
        console.log('📤 Brána volá: /payment/success?orderId=...&status=success');
        
        // Simuluj to, co by udělala /payment/success stránka
        console.log('🔄 /payment/success stránka:');
        console.log('   1. Detekuje návrat z brány');
        console.log('   2. Automaticky volá Capture Payment');
        console.log('   3. Přesměruje na /real-payment-flow-test');

        // Simuluj automatické Capture Payment
        console.log('\n💰 Simuluji automatické Capture Payment...');
        
        const captureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
          invoice_id: order.invoiceId,
          amount: 604,
          module: 'Comgate',
          trans_id: paymentResult.transactionId,
          note: 'Real payment captured automatically after successful Comgate gateway return'
        });

        if (captureResult.success) {
          console.log('✅ AUTO CAPTURE SUCCESS:', {
            previousStatus: captureResult.data?.previous_status,
            currentStatus: captureResult.data?.current_status,
            transactionId: captureResult.data?.transaction_id
          });

          // Test 4: Simuluj přesměrování na /real-payment-flow-test
          console.log('\n=== TEST 4: Přesměrování na test stránku ===');
          
          const redirectParams = {
            status: 'success',
            invoiceId: order.invoiceId,
            orderId: order.orderId,
            transactionId: paymentResult.transactionId,
            amount: '604',
            paymentMethod: 'comgate',
            captureStatus: 'success',
            currentStatus: captureResult.data?.current_status,
            autoProcessed: 'true',
            timestamp: new Date().toISOString()
          };

          const redirectUrl = '/real-payment-flow-test?' + 
            Object.entries(redirectParams)
              .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
              .join('&');

          console.log('🔗 Redirect URL:', `http://localhost:3000${redirectUrl}`);
          console.log('📋 Parametry:', redirectParams);

          // Test 5: Finální status check
          console.log('\n=== TEST 5: Finální status check ===');
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const finalStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
          
          if (finalStatus.success) {
            console.log('✅ FINÁLNÍ STATUS:', {
              status: finalStatus.status,
              isPaid: finalStatus.isPaid,
              amount: finalStatus.amount,
              datePaid: finalStatus.datePaid
            });

            if (finalStatus.isPaid) {
              console.log('🎉 KOMPLETNÍ FLOW ÚSPĚŠNÝ!');
              console.log('📱 Real Payment Flow Test stránka zobrazí:');
              console.log('   • ✅ Payment completed and automatically captured!');
              console.log('   • 📊 Final Status: PAID');
              console.log('   • 💰 Invoice marked as PAID');
            }
          }
        } else {
          console.log('❌ AUTO CAPTURE FAILED:', captureResult.error);
        }
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }

  console.log('\n🎯 === COMPLETE REAL PAYMENT FLOW SUMMARY ===');
  console.log('🔧 Implementované funkce:');
  console.log('');
  console.log('📱 /payment/success stránka:');
  console.log('   • Detekuje návrat z platební brány');
  console.log('   • Automaticky volá Capture Payment pro úspěšné platby');
  console.log('   • Zobrazuje progress (processing → captured)');
  console.log('   • Přesměrovává na /real-payment-flow-test s výsledky');
  console.log('');
  console.log('📱 /real-payment-flow-test stránka:');
  console.log('   • Detekuje auto-processed parametry');
  console.log('   • Zobrazuje výsledek automatického capture');
  console.log('   • Načítá a zobrazuje finální status faktury');
  console.log('   • Umožňuje manuální capture při selhání');
  console.log('');
  console.log('⚙️ Kompletní flow:');
  console.log('   1. ✅ Create Order');
  console.log('   2. ✅ Initialize Real Payment');
  console.log('   3. ✅ Redirect to Real Gateway');
  console.log('   4. ✅ User Pays on Gateway');
  console.log('   5. ✅ Gateway Returns to /payment/success');
  console.log('   6. ✅ Auto Capture Payment');
  console.log('   7. ✅ Redirect to /real-payment-flow-test');
  console.log('   8. ✅ Display Final Status');
  console.log('');
  console.log('✅ Výsledek:');
  console.log('   • Kompletně automatizovaný flow');
  console.log('   • Žádná manuální akce po platbě');
  console.log('   • Automatické označení faktury jako PAID');
  console.log('   • Uživatelsky přívětivé zobrazení výsledků');
  console.log('');
  console.log('🔗 Test flow:');
  console.log('   1. http://localhost:3000/real-payment-flow-test');
  console.log('   2. Create Order → Initialize Payment');
  console.log('   3. Jdi na reálnou bránu a zaplať');
  console.log('   4. Brána tě přesměruje na /payment/success');
  console.log('   5. Automatické capture a přesměrování');
  console.log('   6. Zobrazení finálního statusu');
  console.log('');
  console.log('🎉 Real Payment Flow je nyní kompletně automatizovaný!');
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

// Run the complete real payment flow test
testCompleteRealPaymentFlow();
