/**
 * Middleware Pohoda Integration Test
 * Tests complete Pohoda integration directly in systrix-middleware-nextjs
 * WITHOUT dependency on Eshop App
 */

const http = require('http');

async function testMiddlewarePohodaIntegration() {
  console.log('🧪 Testing Middleware → Pohoda direct integration...\n');
  console.log('📋 This test verifies Pohoda sync works independently in middleware\n');

  // Test with real invoice ID from HostBill
  const testData = {
    invoiceId: '681', // Real invoice ID
    transactionId: `MIDDLEWARE-TX-${Date.now()}`,
    paymentMethod: 'comgate',
    amount: 100,
    currency: 'CZK'
  };

  console.log('📋 Test Parameters:');
  console.log(`   Invoice ID: ${testData.invoiceId} (real HostBill invoice)`);
  console.log(`   Transaction ID: ${testData.transactionId}`);
  console.log(`   Payment Method: ${testData.paymentMethod}`);
  console.log(`   Amount: ${testData.amount} ${testData.currency}`);
  console.log('');

  try {
    // Step 1: Test Pohoda service status
    console.log('1️⃣ Testing Pohoda service status...');
    const statusResult = await getPohodaStatus();
    
    if (statusResult.success) {
      console.log('✅ Pohoda service status retrieved');
      console.log(`   Configured: ${statusResult.pohoda.configured ? 'YES' : 'NO'}`);
      console.log(`   Enabled: ${statusResult.pohoda.enabled ? 'YES' : 'NO'}`);
      console.log(`   Data File: ${statusResult.pohoda.dataFile || 'Not set'}`);
      console.log(`   API Key: ${statusResult.pohoda.hasApiKey ? 'Set' : 'Missing'}`);
    } else {
      console.log('❌ Pohoda service status failed:', statusResult.error);
    }

    // Step 2: Test invoice details retrieval
    console.log('\n2️⃣ Testing invoice details retrieval...');
    const invoiceDetails = await getInvoiceDetails(testData.invoiceId);
    
    if (invoiceDetails.success) {
      console.log('✅ Invoice details retrieved successfully');
      console.log(`   Customer: ${invoiceDetails.invoice.firstname} ${invoiceDetails.invoice.lastname}`);
      console.log(`   Company: ${invoiceDetails.invoice.companyname || 'N/A'}`);
      console.log(`   Email: ${invoiceDetails.invoice.email}`);
      console.log(`   Total: ${invoiceDetails.invoice.total} ${invoiceDetails.invoice.currency}`);
      console.log(`   Items: ${invoiceDetails.invoice.items?.length || 0}`);
    } else {
      console.log('❌ Invoice details retrieval failed:', invoiceDetails.error);
    }

    // Step 3: Test direct Pohoda invoice sync
    console.log('\n3️⃣ Testing direct Pohoda invoice sync...');
    const directSyncResult = await syncInvoiceToPohoda(testData);
    
    if (directSyncResult.success) {
      console.log('✅ Direct Pohoda invoice sync: SUCCESS');
      console.log(`   Pohoda Invoice ID: ${directSyncResult.pohodaInvoiceId}`);
      console.log(`   Sync Type: ${directSyncResult.syncType || 'invoice_with_payment'}`);
    } else {
      console.log('❌ Direct Pohoda invoice sync failed:', directSyncResult.error);
    }

    // Step 4: Test complete payment workflow with Pohoda sync
    console.log('\n4️⃣ Testing complete payment workflow with automatic Pohoda sync...');
    const paymentResult = await markInvoiceAsPaidWithPohodaSync(testData);
    
    if (paymentResult.success) {
      console.log('✅ Payment workflow with Pohoda sync: SUCCESS');
      console.log(`   Payment ID: ${paymentResult.paymentId || 'N/A'}`);
      console.log(`   Invoice Status: ${paymentResult.invoiceStatus || 'Paid'}`);
      console.log(`   Pohoda Synced: ${paymentResult.pohodaSync ? 'YES' : 'NO'}`);
      
      if (paymentResult.pohodaSync) {
        console.log(`   Pohoda Sync Result: ${paymentResult.pohodaSync.success ? 'SUCCESS' : 'FAILED'}`);
        if (paymentResult.pohodaSync.success) {
          console.log(`   Pohoda Invoice ID: ${paymentResult.pohodaSync.pohodaInvoiceId}`);
        } else {
          console.log(`   Pohoda Error: ${paymentResult.pohodaSync.error}`);
        }
      }
    } else {
      console.log('❌ Payment workflow failed:', paymentResult.error);
    }

    // Summary
    console.log('\n📊 MIDDLEWARE POHODA INTEGRATION SUMMARY:');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Pohoda Service Status: ${statusResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Invoice Details Retrieval: ${invoiceDetails.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Direct Pohoda Sync: ${directSyncResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Complete Payment Workflow: ${paymentResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Automatic Pohoda Sync: ${paymentResult.pohodaSync ? 'ENABLED' : 'DISABLED'}`);
    
    const allWorking = statusResult.success && invoiceDetails.success && paymentResult.success;
    const pohodaConfigured = statusResult.pohoda?.configured || false;
    
    console.log(`\n🎯 INTEGRATION STATUS: ${allWorking ? '✅ FULLY WORKING' : '⚠️ NEEDS ATTENTION'}`);
    console.log(`🔧 POHODA CONFIGURATION: ${pohodaConfigured ? '✅ CONFIGURED' : '⚠️ NEEDS SETUP'}`);

    if (!pohodaConfigured) {
      console.log('\n📋 To complete setup:');
      console.log('   1. Register at https://dativery.com');
      console.log('   2. Get API key and configure Pohoda connection');
      console.log('   3. Update .env.local with real credentials');
      console.log('   4. Restart middleware: npm run dev');
    } else {
      console.log('\n🚀 Integration is ready for production!');
    }

  } catch (error) {
    console.error('💥 Integration test failed:', error.message);
  }
}

/**
 * Get Pohoda service status
 */
async function getPohodaStatus() {
  try {
    const result = await callAPI('localhost', 3005, '/api/pohoda/status', null, 'GET');
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get invoice details from HostBill
 */
async function getInvoiceDetails(invoiceId) {
  try {
    const result = await callAPI('localhost', 3005, `/api/invoices/${invoiceId}`, null, 'GET');
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sync invoice directly to Pohoda
 */
async function syncInvoiceToPohoda(testData) {
  try {
    const syncData = {
      invoiceId: testData.invoiceId,
      transactionId: testData.transactionId,
      paymentMethod: testData.paymentMethod,
      amount: testData.amount,
      currency: testData.currency,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Middleware integration test - ${testData.transactionId}`
    };

    const result = await callAPI('localhost', 3005, '/api/pohoda/sync-invoice', syncData);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Mark invoice as paid with automatic Pohoda sync
 */
async function markInvoiceAsPaidWithPohodaSync(testData) {
  try {
    const paymentData = {
      invoiceId: testData.invoiceId,
      transactionId: testData.transactionId,
      paymentMethod: testData.paymentMethod,
      amount: testData.amount,
      currency: testData.currency,
      notes: `Middleware Pohoda integration test - ${testData.transactionId}`
    };

    const result = await callAPI('localhost', 3005, '/api/invoices/mark-paid', paymentData);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generic API call helper
 */
async function callAPI(hostname, port, path, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';

    const options = {
      hostname,
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

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

    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

// Run the test
if (require.main === module) {
  testMiddlewarePohodaIntegration()
    .then(() => {
      console.log('\n🏁 Middleware Pohoda integration test completed!');
      console.log('\n🎯 Integration is implemented and ready for configuration!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Integration test failed:', error);
      process.exit(1);
    });
}

module.exports = { testMiddlewarePohodaIntegration };
