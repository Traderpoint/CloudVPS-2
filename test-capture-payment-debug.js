// Debug test pro Capture Payment chybu
const http = require('http');

async function testCapturePaymentDebug() {
  console.log('🔍 Debug test pro Capture Payment chybu');
  console.log('📋 Zjišťuji, proč Capture Payment selhává\n');

  try {
    // Test 1: Vytvoř novou objednávku pro debug
    console.log('=== TEST 1: Vytvoření nové objednávky ===');
    
    const orderData = {
      customer: {
        firstName: 'Debug',
        lastName: 'Capture',
        email: 'debug.capture@test.cz',
        phone: '+420123456789',
        address: 'Debug Capture Street 123',
        city: 'Prague',
        postalCode: '11000',
        country: 'CZ',
        company: 'Debug Capture s.r.o.'
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
      console.log('✅ Order created for debug:', {
        orderId: order.orderId,
        invoiceId: order.invoiceId,
        amount: 604
      });

      // Test 2: Zkontroluj initial status faktury
      console.log('\n=== TEST 2: Initial invoice status ===');
      
      const initialStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
      
      if (initialStatus.success) {
        console.log('📊 Initial invoice status:', {
          status: initialStatus.status,
          isPaid: initialStatus.isPaid,
          amount: initialStatus.amount,
          datePaid: initialStatus.datePaid
        });

        if (initialStatus.isPaid) {
          console.log('⚠️ WARNING: Invoice is already PAID! This might cause capture to fail.');
        } else {
          console.log('✅ GOOD: Invoice is Unpaid, ready for capture.');
        }
      }

      // Test 3: Zkus Capture Payment s detailním logováním
      console.log('\n=== TEST 3: Capture Payment s debug ===');
      
      const captureData = {
        invoice_id: order.invoiceId,
        amount: 604,
        module: 'Comgate',
        trans_id: `DEBUG-CAPTURE-${Date.now()}`,
        note: 'Debug test - Real payment captured after successful gateway return'
      };

      console.log('📤 Capture request data:', captureData);

      const captureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', captureData);
      
      console.log('📥 Capture response:', captureResult);

      if (captureResult.success) {
        console.log('✅ CAPTURE SUCCESS:', {
          message: captureResult.message,
          previousStatus: captureResult.data?.previous_status,
          currentStatus: captureResult.data?.current_status,
          transactionId: captureResult.data?.transaction_id
        });
      } else {
        console.log('❌ CAPTURE FAILED:', {
          error: captureResult.error,
          details: captureResult.details,
          hostbill_result: captureResult.hostbill_result
        });

        // Test 4: Zkus alternativní parametry
        console.log('\n=== TEST 4: Zkouším alternativní parametry ===');
        
        const altCaptureData = {
          invoice_id: order.invoiceId,
          amount: 604,
          module: 'BankTransfer', // Jiný modul
          trans_id: `ALT-DEBUG-${Date.now()}`,
          note: 'Alternative debug test with BankTransfer module'
        };

        console.log('📤 Alternative capture request:', altCaptureData);

        const altCaptureResult = await makeRequest('POST', 'localhost', 3000, '/api/middleware/capture-payment', altCaptureData);
        
        console.log('📥 Alternative capture response:', altCaptureResult);

        if (altCaptureResult.success) {
          console.log('✅ ALTERNATIVE CAPTURE SUCCESS!');
        } else {
          console.log('❌ ALTERNATIVE CAPTURE ALSO FAILED:', altCaptureResult.error);
        }
      }

      // Test 5: Zkontroluj final status
      console.log('\n=== TEST 5: Final invoice status ===');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalStatus = await makeRequest('GET', 'localhost', 3005, `/api/invoices/${order.invoiceId}/status`);
      
      if (finalStatus.success) {
        console.log('📊 Final invoice status:', {
          status: finalStatus.status,
          isPaid: finalStatus.isPaid,
          amount: finalStatus.amount,
          datePaid: finalStatus.datePaid
        });
      }

      // Test 6: Zkus přímé volání middleware
      console.log('\n=== TEST 6: Přímé volání middleware ===');
      
      const directCaptureData = {
        invoice_id: order.invoiceId,
        amount: 604,
        module: 'Manual',
        trans_id: `DIRECT-DEBUG-${Date.now()}`,
        note: 'Direct middleware call debug test'
      };

      console.log('📤 Direct middleware request:', directCaptureData);

      const directResult = await makeRequest('POST', 'localhost', 3005, '/api/invoices/capture-payment', directCaptureData);
      
      console.log('📥 Direct middleware response:', directResult);

      if (directResult.success) {
        console.log('✅ DIRECT MIDDLEWARE CAPTURE SUCCESS!');
      } else {
        console.log('❌ DIRECT MIDDLEWARE CAPTURE FAILED:', directResult.error);
      }

    } else {
      console.log('❌ Failed to create order for debug:', orderResult.error);
    }

  } catch (error) {
    console.error('💥 Debug test failed:', error.message);
  }

  console.log('\n🔍 === CAPTURE PAYMENT DEBUG SUMMARY ===');
  console.log('🔧 Možné příčiny selhání:');
  console.log('');
  console.log('1. 📋 Faktura už je PAID:');
  console.log('   • HostBill nepovoluje přidání platby k už zaplacené faktuře');
  console.log('   • Řešení: Kontrolovat status před capture');
  console.log('');
  console.log('2. 🔧 Špatné parametry:');
  console.log('   • module: "Comgate" vs "BankTransfer" vs "Manual"');
  console.log('   • amount: musí být číslo, ne string');
  console.log('   • trans_id: musí být unikátní');
  console.log('');
  console.log('3. 🌐 Middleware komunikace:');
  console.log('   • CloudVPS → Middleware proxy může selhat');
  console.log('   • Middleware → HostBill API může selhat');
  console.log('   • Řešení: Testovat přímé volání');
  console.log('');
  console.log('4. 🔐 HostBill API:');
  console.log('   • addInvoicePayment API může mít omezení');
  console.log('   • Faktura nemusí existovat nebo být dostupná');
  console.log('   • Řešení: Kontrolovat HostBill logy');
  console.log('');
  console.log('🔗 Doporučené opravy:');
  console.log('   1. Přidat kontrolu status faktury před capture');
  console.log('   2. Použít fallback na jiný payment module');
  console.log('   3. Přidat lepší error handling');
  console.log('   4. Logovat detailní chyby z HostBill');
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

// Run the capture payment debug test
testCapturePaymentDebug();
