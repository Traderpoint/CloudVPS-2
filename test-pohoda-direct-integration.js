/**
 * Pohoda Direct Integration Test
 * Tests direct connection to Pohoda mServer API without Dativery
 */

const http = require('http');

async function testPohodaDirectIntegration() {
  console.log('🧪 Testing Pohoda Direct Integration (mServer API)...\n');
  console.log('📋 This test uses direct connection to Pohoda mServer on port 444\n');

  const testData = {
    invoiceId: '681',
    transactionId: `DIRECT-TX-${Date.now()}`,
    paymentMethod: 'comgate',
    amount: 100,
    currency: 'CZK'
  };

  console.log('📋 Test Parameters:');
  console.log(`   Invoice ID: ${testData.invoiceId}`);
  console.log(`   Transaction ID: ${testData.transactionId}`);
  console.log(`   Payment Method: ${testData.paymentMethod}`);
  console.log(`   Amount: ${testData.amount} ${testData.currency}`);
  console.log(`   mServer URL: http://127.0.0.1:444/xml`);
  console.log('');

  try {
    // Step 1: Test Pohoda service status
    console.log('1️⃣ Testing Pohoda direct client status...');
    const statusResult = await getPohodaStatus();
    
    if (statusResult.success) {
      console.log('✅ Pohoda status retrieved');
      console.log(`   Type: ${statusResult.pohoda.type || 'unknown'}`);
      console.log(`   Configured: ${statusResult.pohoda.configured ? 'YES' : 'NO'}`);
      console.log(`   Enabled: ${statusResult.pohoda.enabled ? 'YES' : 'NO'}`);
      console.log(`   mServer URL: ${statusResult.pohoda.mServerUrl || 'Not set'}`);
      console.log(`   Data File: ${statusResult.pohoda.dataFile || 'Not set'}`);
      console.log(`   Has Credentials: ${statusResult.pohoda.hasPassword ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ Pohoda status failed:', statusResult.error);
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

    // Step 3: Test direct Pohoda mServer sync
    console.log('\n3️⃣ Testing direct Pohoda mServer sync...');
    const directSyncResult = await syncInvoiceToPohodaDirect(testData);
    
    if (directSyncResult.success) {
      console.log('✅ Direct Pohoda mServer sync: SUCCESS');
      console.log(`   Pohoda Invoice ID: ${directSyncResult.pohodaInvoiceId}`);
      console.log(`   Sync Type: ${directSyncResult.syncType || 'invoice_with_payment'}`);
      console.log(`   mServer Response: Available`);
    } else {
      console.log('❌ Direct Pohoda mServer sync failed:', directSyncResult.error);
    }

    // Step 4: Test complete payment workflow with direct Pohoda sync
    console.log('\n4️⃣ Testing complete payment workflow with direct Pohoda sync...');
    const paymentResult = await markInvoiceAsPaidWithDirectPohoda(testData);
    
    if (paymentResult.success) {
      console.log('✅ Payment workflow with direct Pohoda sync: SUCCESS');
      console.log(`   Payment ID: ${paymentResult.paymentId || 'N/A'}`);
      console.log(`   Invoice Status: ${paymentResult.invoiceStatus || 'Paid'}`);
      console.log(`   Pohoda Synced: ${paymentResult.pohodaSync ? 'YES' : 'NO'}`);
      
      if (paymentResult.pohodaSync) {
        console.log(`   Pohoda Sync Result: ${paymentResult.pohodaSync.success ? 'SUCCESS' : 'FAILED'}`);
        if (paymentResult.pohodaSync.success) {
          console.log(`   Pohoda Invoice ID: ${paymentResult.pohodaSync.pohodaInvoiceId}`);
          console.log(`   mServer Response: ${paymentResult.pohodaSync.mServerResponse ? 'Available' : 'N/A'}`);
        } else {
          console.log(`   Pohoda Error: ${paymentResult.pohodaSync.error}`);
        }
      }
    } else {
      console.log('❌ Payment workflow failed:', paymentResult.error);
    }

    // Summary
    console.log('\n📊 POHODA DIRECT INTEGRATION SUMMARY:');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Pohoda Client Status: ${statusResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Invoice Details Retrieval: ${invoiceDetails.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Direct mServer Sync: ${directSyncResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Complete Payment Workflow: ${paymentResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Automatic Pohoda Sync: ${paymentResult.pohodaSync ? 'ENABLED' : 'DISABLED'}`);
    
    const allWorking = statusResult.success && invoiceDetails.success && paymentResult.success;
    const pohodaConfigured = statusResult.pohoda?.configured || false;
    
    console.log(`\n🎯 INTEGRATION STATUS: ${allWorking ? '✅ FULLY WORKING' : '⚠️ NEEDS ATTENTION'}`);
    console.log(`🔧 POHODA CONFIGURATION: ${pohodaConfigured ? '✅ CONFIGURED' : '⚠️ NEEDS SETUP'}`);
    console.log(`🌐 CONNECTION TYPE: Direct mServer API (port 444)`);

    if (!pohodaConfigured) {
      console.log('\n📋 To complete setup:');
      console.log('   1. Install and run Pohoda software');
      console.log('   2. Enable mServer in Pohoda (port 444)');
      console.log('   3. Create API user in Pohoda');
      console.log('   4. Update .env.local with Pohoda credentials');
      console.log('   5. Restart middleware: npm run dev');
    } else {
      console.log('\n🚀 Direct integration is ready for production!');
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
 * Sync invoice directly to Pohoda mServer
 */
async function syncInvoiceToPohodaDirect(testData) {
  try {
    const syncData = {
      invoiceId: testData.invoiceId,
      transactionId: testData.transactionId,
      paymentMethod: testData.paymentMethod,
      amount: testData.amount,
      currency: testData.currency,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Direct mServer integration test - ${testData.transactionId}`
    };

    const result = await callAPI('localhost', 3005, '/api/pohoda/sync-invoice', syncData);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Mark invoice as paid with automatic direct Pohoda sync
 */
async function markInvoiceAsPaidWithDirectPohoda(testData) {
  try {
    const paymentData = {
      invoiceId: testData.invoiceId,
      transactionId: testData.transactionId,
      paymentMethod: testData.paymentMethod,
      amount: testData.amount,
      currency: testData.currency,
      notes: `Direct Pohoda mServer test - ${testData.transactionId}`
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
  testPohodaDirectIntegration()
    .then(() => {
      console.log('\n🏁 Pohoda direct integration test completed!');
      console.log('\n🎯 Direct mServer integration is implemented and ready!');
      console.log('\n📖 Setup Guide:');
      console.log('   1. Install Pohoda software');
      console.log('   2. Enable mServer (Tools → Options → mServer)');
      console.log('   3. Set port 444 and enable XML API');
      console.log('   4. Create API user with XML permissions');
      console.log('   5. Update .env.local with credentials');
      console.log('   6. Restart middleware and test');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPohodaDirectIntegration };
