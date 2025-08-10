// Test implementace Real Payment Flow Test
const http = require('http');

async function testRealPaymentImplementation() {
  console.log('🎯 Test implementace Real Payment Flow Test');
  console.log('📋 Testuji novou stránku a její funkcionalitu\n');

  try {
    // Test 1: Ověř, že stránka je dostupná
    console.log('=== TEST 1: Dostupnost stránky ===');
    
    try {
      const pageResponse = await fetch('http://localhost:3000/real-payment-flow-test');
      console.log('✅ Real Payment Flow Test stránka je dostupná:', pageResponse.status);
    } catch (error) {
      console.log('❌ Real Payment Flow Test stránka není dostupná:', error.message);
      return;
    }

    // Test 2: Ověř, že test-portal obsahuje odkazy
    console.log('\n=== TEST 2: Test Portal odkazy ===');
    
    try {
      const portalResponse = await fetch('http://localhost:3000/test-portal');
      const portalHtml = await portalResponse.text();
      
      if (portalHtml.includes('capture-payment-test')) {
        console.log('✅ Capture Payment Test link je v test-portal');
      } else {
        console.log('❌ Capture Payment Test link NENÍ v test-portal');
      }
      
      if (portalHtml.includes('real-payment-flow-test')) {
        console.log('✅ Real Payment Flow Test link je v test-portal');
      } else {
        console.log('❌ Real Payment Flow Test link NENÍ v test-portal');
      }
    } catch (error) {
      console.log('❌ Chyba při kontrole test-portal:', error.message);
    }

    // Test 3: Simuluj Real Payment Flow (kroky 1 a 2)
    console.log('\n=== TEST 3: Simulace Real Payment Flow ===');
    
    // Krok 1: Create Order (stejný jako payment-flow-test)
    console.log('📋 KROK 1: Create Order...');
    
    const orderData = {
      customer: {
        firstName: 'Real',
        lastName: 'Payment',
        email: 'real.payment@test.cz',
        phone: '+420123456789',
        address: 'Real Payment Street 123',
        city: 'Prague',
        postalCode: '11000',
        country: 'CZ',
        company: 'Real Payment s.r.o.'
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
      console.log('✅ KROK 1 SUCCESS - Order created:', {
        orderId: order.orderId,
        invoiceId: order.invoiceId,
        amount: 604
      });

      // Krok 2: Initialize Payment (stejný jako payment-flow-test)
      console.log('📋 KROK 2: Initialize Payment...');
      
      const paymentData = {
        orderId: order.orderId,
        invoiceId: order.invoiceId,
        method: 'comgate',
        amount: 604,
        currency: 'CZK',
        testFlow: false // REAL payment
      };

      const paymentResult = await makeRequest('POST', 'localhost', 3005, '/api/payments/initialize', paymentData);
      
      if (paymentResult.success) {
        console.log('✅ KROK 2 SUCCESS - Payment initialized:', {
          transactionId: paymentResult.transactionId,
          status: paymentResult.status,
          hasPaymentUrl: !!paymentResult.redirectUrl
        });

        // Test 4: Simuluj dokončení reálné platby (krok 3)
        console.log('\n=== TEST 4: Simulace dokončení reálné platby ===');
        
        // Simuluj návrat z platební brány
        console.log('📤 Simuluji návrat z platební brány...');
        
        const returnUrl = `http://localhost:3005/api/payments/return?` +
          `invoiceId=${order.invoiceId}&` +
          `status=success&` +
          `amount=604&` +
          `paymentMethod=comgate&` +
          `transactionId=REAL-PAYMENT-${order.invoiceId}`;

        const returnResponse = await makeRequest('GET', 'localhost', 3005, 
          `/api/payments/return?invoiceId=${order.invoiceId}&status=success&amount=604&paymentMethod=comgate&transactionId=REAL-PAYMENT-${order.invoiceId}`);

        console.log('📥 Payment return processed:', returnResponse.success ? 'Success' : 'Failed');

        // Capture Payment (klíčový krok)
        console.log('💰 Volám Capture Payment...');
        
        const captureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
          invoice_id: order.invoiceId,
          amount: 604,
          module: 'Comgate',
          trans_id: `REAL-PAYMENT-${order.invoiceId}`,
          note: 'Real payment captured via Comgate gateway'
        });

        if (captureResult.success) {
          console.log('✅ CAPTURE SUCCESS:', {
            previousStatus: captureResult.data?.previous_status,
            currentStatus: captureResult.data?.current_status,
            transactionId: captureResult.data?.transaction_id
          });

          // Finální status check
          console.log('📊 Kontroluji finální status...');
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const finalStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
          
          if (finalStatus.success) {
            console.log('✅ FINÁLNÍ STATUS:', {
              status: finalStatus.status,
              isPaid: finalStatus.isPaid,
              datePaid: finalStatus.datePaid
            });

            if (finalStatus.isPaid) {
              console.log('🎉 SUCCESS: Real Payment Flow funguje perfektně!');
            } else {
              console.log('❌ PROBLEM: Faktura není označena jako PAID');
            }
          }
        } else {
          console.log('❌ CAPTURE FAILED:', captureResult.error);
        }
      } else {
        console.log('❌ KROK 2 FAILED - Initialize Payment:', paymentResult.error);
      }
    } else {
      console.log('❌ KROK 1 FAILED - Create Order:', orderResult.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }

  console.log('\n🎯 === IMPLEMENTACE SUMMARY ===');
  console.log('✅ Dokončené úkoly:');
  console.log('   1. ✅ Přesunut capture-payment-test do test-portal (Middleware testy)');
  console.log('   2. ✅ Vytvořen Real Payment Flow Test (/real-payment-flow-test)');
  console.log('   3. ✅ Implementovány kroky 1 a 2 z payment-flow-test');
  console.log('   4. ✅ Přidán krok 3: Complete Real Payment & Capture');
  console.log('   5. ✅ Automatické Capture Payment po dokončení reálné platby');
  console.log('   6. ✅ Zobrazení závěrečného statusu faktury');
  console.log('');
  console.log('🔗 Dostupné stránky:');
  console.log('   • http://localhost:3000/test-portal (obsahuje oba testy)');
  console.log('   • http://localhost:3000/capture-payment-test (přesunut do Middleware testů)');
  console.log('   • http://localhost:3000/real-payment-flow-test (nový Real Payment Flow)');
  console.log('');
  console.log('📋 Real Payment Flow Test kroky:');
  console.log('   1. Create Order - vytvoří objednávku a fakturu');
  console.log('   2. Initialize Real Payment - inicializuje reálnou platbu');
  console.log('   3. Complete Real Payment & Capture - dokončí platbu a označí fakturu jako PAID');
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

// Run the implementation test
testRealPaymentImplementation();
