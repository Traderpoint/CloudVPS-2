/**
 * Complete Pohoda Automation Test
 * Tests the full automatic workflow from order creation to payment sync
 */

const http = require('http');

async function testFullPohodaAutomation() {
  console.log('🧪 Testing COMPLETE Pohoda automation workflow...\n');

  const testData = {
    invoiceId: '681',
    orderId: `ORDER-AUTO-${Date.now()}`,
    transactionId: `TX-AUTO-${Date.now()}`,
    paymentMethod: 'comgate',
    amount: 100,
    currency: 'CZK'
  };

  console.log('📋 Test Parameters:');
  console.log(`   Invoice ID: ${testData.invoiceId}`);
  console.log(`   Order ID: ${testData.orderId}`);
  console.log(`   Transaction ID: ${testData.transactionId}`);
  console.log(`   Payment Method: ${testData.paymentMethod}`);
  console.log(`   Amount: ${testData.amount} ${testData.currency}`);
  console.log('');

  try {
    // Step 1: Test order creation sync (existing functionality)
    console.log('1️⃣ Testing order creation sync to Pohoda...');
    const orderSyncResult = await testOrderSync(testData);
    
    if (orderSyncResult.success) {
      console.log('✅ Order creation sync: SUCCESS');
    } else {
      console.log('❌ Order creation sync: FAILED -', orderSyncResult.error);
    }

    // Step 2: Test payment processing with automatic Pohoda sync
    console.log('\n2️⃣ Testing payment processing with automatic Pohoda sync...');
    const paymentResult = await testPaymentWithPohodaSync(testData);
    
    if (paymentResult.success) {
      console.log('✅ Payment with Pohoda sync: SUCCESS');
      console.log(`   Payment ID: ${paymentResult.paymentId}`);
      console.log(`   Pohoda Synced: ${paymentResult.pohodaSynced ? 'YES' : 'NO'}`);
      
      if (paymentResult.pohodaSync) {
        console.log(`   Pohoda Sync Result: ${paymentResult.pohodaSync.success ? 'SUCCESS' : 'FAILED'}`);
        if (!paymentResult.pohodaSync.success) {
          console.log(`   Pohoda Error: ${paymentResult.pohodaSync.error}`);
        }
      }
    } else {
      console.log('❌ Payment with Pohoda sync: FAILED -', paymentResult.error);
    }

    // Step 3: Test direct Pohoda payment sync endpoint
    console.log('\n3️⃣ Testing direct Pohoda payment sync endpoint...');
    const directSyncResult = await testDirectPohodaPaymentSync(testData);
    
    if (directSyncResult.success) {
      console.log('✅ Direct Pohoda payment sync: SUCCESS');
      console.log(`   Pohoda Order ID: ${directSyncResult.pohodaOrderId}`);
    } else {
      console.log('❌ Direct Pohoda payment sync: FAILED -', directSyncResult.error);
    }

    // Summary
    console.log('\n📊 AUTOMATION TEST SUMMARY:');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Order Creation Sync: ${orderSyncResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Payment Processing: ${paymentResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Automatic Pohoda Sync: ${paymentResult.pohodaSynced ? 'ENABLED' : 'DISABLED'}`);
    console.log(`✅ Direct Pohoda Sync: ${directSyncResult.success ? 'WORKING' : 'FAILED'}`);
    
    const allWorking = orderSyncResult.success && paymentResult.success && directSyncResult.success;
    console.log(`\n🎯 OVERALL STATUS: ${allWorking ? '✅ FULLY AUTOMATED' : '⚠️ NEEDS CONFIGURATION'}`);

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
}

/**
 * Test order creation sync to Pohoda
 */
async function testOrderSync(testData) {
  try {
    const orderData = {
      clientId: 'TEST-CLIENT-123',
      orderId: testData.orderId,
      cartItems: [
        {
          id: 'VPS-001',
          name: 'VPS Basic Test',
          quantity: 1,
          price: testData.amount
        }
      ],
      totalPrice: testData.amount,
      companyData: {
        obchodniJmeno: 'Test s.r.o.',
        ico: '12345678',
        dic: 'CZ12345678',
        adresa: 'Praha, Testovací 123'
      },
      email: 'test@example.com',
      name: 'Jan Testovací'
    };

    const result = await callAPI('localhost', 3001, '/api/sync-pohoda', orderData);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test payment processing with automatic Pohoda sync
 */
async function testPaymentWithPohodaSync(testData) {
  try {
    const paymentData = {
      invoiceId: testData.invoiceId,
      transactionId: testData.transactionId,
      paymentMethod: testData.paymentMethod,
      amount: testData.amount,
      currency: testData.currency,
      notes: `Automated test payment - ${testData.transactionId}`
    };

    const result = await callAPI('localhost', 3005, '/api/invoices/mark-paid', paymentData);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test direct Pohoda payment sync endpoint
 */
async function testDirectPohodaPaymentSync(testData) {
  try {
    const syncData = {
      orderId: testData.orderId,
      invoiceId: testData.invoiceId,
      transactionId: testData.transactionId,
      paymentMethod: testData.paymentMethod,
      amount: testData.amount,
      currency: testData.currency,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Direct sync test - ${testData.transactionId}`,
      status: 'PAID'
    };

    const result = await callAPI('localhost', 3001, '/api/sync-pohoda-payment', syncData);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generic API call helper
 */
async function callAPI(hostname, port, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname,
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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
          resolve({ 
            success: false, 
            error: 'Invalid JSON response', 
            raw: responseData 
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
if (require.main === module) {
  testFullPohodaAutomation()
    .then(() => {
      console.log('\n🏁 Complete Pohoda automation test finished!');
      console.log('\n📖 Next Steps:');
      console.log('   1. Configure real Dativery API credentials');
      console.log('   2. Set up Pohoda database connection');
      console.log('   3. Test with real orders and payments');
      console.log('   4. Monitor logs for automatic sync operations');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testFullPohodaAutomation };
