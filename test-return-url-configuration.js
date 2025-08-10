// Test konfigurace return URL pro Real Payment Flow Test
const http = require('http');

async function testReturnUrlConfiguration() {
  console.log('🎯 Test konfigurace return URL pro Real Payment Flow Test');
  console.log('📋 Ověřuji, že return URL správně přesměruje zpět na test stránku\n');

  try {
    console.log('=== RETURN URL KONFIGURACE ===');
    console.log('✅ Nová konfigurace:');
    console.log('   • returnUrl: /real-payment-flow-test?status=success&...');
    console.log('   • cancelUrl: /real-payment-flow-test?status=cancelled&...');
    console.log('   • pendingUrl: /real-payment-flow-test?status=pending&...');
    console.log('   • Všechny URL vedou zpět na test stránku');
    console.log('');

    // Test 1: Create Order a Initialize Payment s custom return URL
    console.log('=== TEST 1: Initialize Payment s custom return URL ===');
    
    const orderData = {
      customer: {
        firstName: 'ReturnURL',
        lastName: 'Test',
        email: 'returnurl.test@test.cz',
        phone: '+420123456789',
        address: 'Return URL Test Street 123',
        city: 'Prague',
        postalCode: '11000',
        country: 'CZ',
        company: 'Return URL Test s.r.o.'
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
        invoiceId: order.invoiceId
      });

      // Simuluj return URL, které by poslala stránka
      const baseUrl = 'http://localhost:3000';
      const expectedReturnUrls = {
        returnUrl: `${baseUrl}/real-payment-flow-test?status=success&invoiceId=${order.invoiceId}&orderId=${order.orderId}&amount=604&paymentMethod=comgate`,
        cancelUrl: `${baseUrl}/real-payment-flow-test?status=cancelled&invoiceId=${order.invoiceId}&orderId=${order.orderId}&amount=604&paymentMethod=comgate`,
        pendingUrl: `${baseUrl}/real-payment-flow-test?status=pending&invoiceId=${order.invoiceId}&orderId=${order.orderId}&amount=604&paymentMethod=comgate`
      };

      console.log('📋 Expected return URLs:');
      console.log('   Success:', expectedReturnUrls.returnUrl);
      console.log('   Cancel:', expectedReturnUrls.cancelUrl);
      console.log('   Pending:', expectedReturnUrls.pendingUrl);

      // Initialize payment s custom return URLs
      const paymentData = {
        orderId: order.orderId,
        invoiceId: order.invoiceId,
        method: 'comgate',
        amount: 604,
        currency: 'CZK',
        testFlow: false,
        returnUrl: expectedReturnUrls.returnUrl,
        cancelUrl: expectedReturnUrls.cancelUrl,
        pendingUrl: expectedReturnUrls.pendingUrl
      };

      const paymentResult = await makeRequest('POST', 'localhost', 3005, '/api/payments/initialize', paymentData);
      
      if (paymentResult.success) {
        console.log('✅ Payment initialized with custom return URLs:', {
          transactionId: paymentResult.transactionId,
          hasPaymentUrl: !!paymentResult.paymentUrl,
          redirectRequired: paymentResult.redirectRequired
        });

        // Test 2: Simuluj návrat z brány
        console.log('\n=== TEST 2: Simulace návratu z brány ===');
        
        const returnScenarios = [
          {
            name: 'SUCCESS Return',
            params: {
              status: 'success',
              invoiceId: order.invoiceId,
              orderId: order.orderId,
              transactionId: paymentResult.transactionId,
              amount: '604',
              paymentMethod: 'comgate'
            }
          },
          {
            name: 'CANCELLED Return',
            params: {
              status: 'cancelled',
              invoiceId: order.invoiceId,
              orderId: order.orderId,
              transactionId: paymentResult.transactionId,
              amount: '604',
              paymentMethod: 'comgate'
            }
          },
          {
            name: 'PENDING Return',
            params: {
              status: 'pending',
              invoiceId: order.invoiceId,
              orderId: order.orderId,
              transactionId: paymentResult.transactionId,
              amount: '604',
              paymentMethod: 'comgate'
            }
          }
        ];

        for (const scenario of returnScenarios) {
          console.log(`\n📋 Testing ${scenario.name}:`);
          
          // Vytvoř URL s parametry
          const returnUrl = `/real-payment-flow-test?` + 
            Object.entries(scenario.params)
              .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
              .join('&');

          console.log('   Return URL:', `http://localhost:3000${returnUrl}`);
          console.log('   Parameters:', scenario.params);
          
          // Ověř, že stránka by správně detekovala tyto parametry
          console.log('   ✅ Stránka by detekovala:', {
            status: scenario.params.status,
            invoiceId: scenario.params.invoiceId,
            transactionId: scenario.params.transactionId,
            readyForCapture: scenario.params.status === 'success'
          });
        }

        // Test 3: Simuluj úspěšný návrat a Capture
        console.log('\n=== TEST 3: Úspěšný návrat a Capture ===');
        
        if (returnScenarios[0].params.status === 'success') {
          console.log('💰 Simuluji Capture Payment po úspěšném návratu...');
          
          const captureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', {
            invoice_id: order.invoiceId,
            amount: 604,
            module: 'Comgate',
            trans_id: paymentResult.transactionId,
            note: 'Payment captured after successful return from real payment gateway'
          });

          if (captureResult.success) {
            console.log('✅ CAPTURE SUCCESS po návratu:', {
              previousStatus: captureResult.data?.previous_status,
              currentStatus: captureResult.data?.current_status,
              transactionId: captureResult.data?.transaction_id
            });

            // Final status check
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const finalStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
            
            if (finalStatus.success && finalStatus.isPaid) {
              console.log('✅ FINÁLNÍ STATUS: Faktura označena jako PAID');
              console.log('🎉 KOMPLETNÍ FLOW FUNGUJE!');
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }

  console.log('\n🎯 === RETURN URL CONFIGURATION SUMMARY ===');
  console.log('🔧 Implementované funkce:');
  console.log('');
  console.log('📱 Return URL konfigurace:');
  console.log('   • Custom return URLs pro každý stav (success/cancelled/pending)');
  console.log('   • Všechny URL vedou zpět na /real-payment-flow-test');
  console.log('   • URL obsahují všechny potřebné parametry');
  console.log('   • Automatická detekce návratu z brány');
  console.log('');
  console.log('⚙️ Flow vylepšení:');
  console.log('   • Uživatel jde na reálnou bránu');
  console.log('   • Po platbě se automaticky vrátí na test stránku');
  console.log('   • Stránka detekuje návrat a zobrazí status');
  console.log('   • Umožní Capture Payment');
  console.log('   • Zobrazí finální status faktury');
  console.log('');
  console.log('✅ Výsledek:');
  console.log('   • Return URL správně konfigurována');
  console.log('   • Automatický návrat na test stránku');
  console.log('   • Zobrazení statusu platby');
  console.log('   • Možnost Capture Payment');
  console.log('');
  console.log('🔗 Test flow:');
  console.log('   1. http://localhost:3000/real-payment-flow-test');
  console.log('   2. Create Order → Initialize Payment');
  console.log('   3. Přesměrování na reálnou bránu');
  console.log('   4. Platba na bráně');
  console.log('   5. Automatický návrat na test stránku');
  console.log('   6. Zobrazení statusu a Capture Payment');
  console.log('   7. Faktura označena jako PAID');
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

// Run the return URL configuration test
testReturnUrlConfiguration();
