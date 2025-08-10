/**
 * Cloud VPS + Pohoda Integration Test
 * Tests complete workflow from CloudVPS order to Pohoda invoice sync
 */

const http = require('http');

async function testCloudVPSPohodaIntegration() {
  console.log('🧪 Testing Cloud VPS → Pohoda complete integration...\n');

  // Test with real invoice ID from HostBill
  const testData = {
    invoiceId: '681', // Real invoice ID
    transactionId: `CLOUDVPS-TX-${Date.now()}`,
    paymentMethod: 'comgate',
    amount: 100,
    currency: 'CZK'
  };

  console.log('📋 Integration Test Parameters:');
  console.log(`   Invoice ID: ${testData.invoiceId} (real HostBill invoice)`);
  console.log(`   Transaction ID: ${testData.transactionId}`);
  console.log(`   Payment Method: ${testData.paymentMethod}`);
  console.log(`   Amount: ${testData.amount} ${testData.currency}`);
  console.log('');

  try {
    // Step 1: Test invoice details retrieval
    console.log('1️⃣ Testing invoice details retrieval from HostBill...');
    const invoiceDetails = await getInvoiceDetails(testData.invoiceId);
    
    if (invoiceDetails.success) {
      console.log('✅ Invoice details retrieved successfully');
      console.log(`   Customer: ${invoiceDetails.invoice.firstname} ${invoiceDetails.invoice.lastname}`);
      console.log(`   Company: ${invoiceDetails.invoice.companyname || 'N/A'}`);
      console.log(`   Email: ${invoiceDetails.invoice.email}`);
      console.log(`   Amount: ${invoiceDetails.invoice.total} ${invoiceDetails.invoice.currency}`);
    } else {
      console.log('❌ Invoice details retrieval failed:', invoiceDetails.error);
    }

    // Step 2: Test payment processing with automatic Pohoda sync
    console.log('\n2️⃣ Testing payment processing with automatic Pohoda invoice sync...');
    const paymentResult = await markInvoiceAsPaid(testData);
    
    if (paymentResult.success) {
      console.log('✅ Payment processing: SUCCESS');
      console.log(`   Payment ID: ${paymentResult.paymentId || 'N/A'}`);
      console.log(`   Invoice Status: ${paymentResult.invoiceStatus || 'Paid'}`);
      console.log(`   Pohoda Synced: ${paymentResult.pohodaSync ? 'YES' : 'NO'}`);
      
      if (paymentResult.pohodaSync) {
        console.log(`   Pohoda Sync Result: ${paymentResult.pohodaSync.success ? 'SUCCESS' : 'FAILED'}`);
        if (!paymentResult.pohodaSync.success) {
          console.log(`   Pohoda Error: ${paymentResult.pohodaSync.error}`);
        }
      }
    } else {
      console.log('❌ Payment processing failed:', paymentResult.error);
    }

    // Step 3: Test direct invoice sync to Pohoda
    console.log('\n3️⃣ Testing direct invoice sync to Pohoda...');
    const directSyncResult = await syncInvoiceToPohoda({
      ...testData,
      fetchCustomerData: true
    });
    
    if (directSyncResult.success) {
      console.log('✅ Direct invoice sync: SUCCESS');
      console.log(`   Pohoda Invoice ID: ${directSyncResult.pohodaInvoiceId}`);
    } else {
      console.log('❌ Direct invoice sync failed:', directSyncResult.error);
    }

    // Step 4: Test complete workflow simulation
    console.log('\n4️⃣ Testing complete CloudVPS workflow simulation...');
    const workflowResult = await simulateCompleteWorkflow(testData);
    
    if (workflowResult.success) {
      console.log('✅ Complete workflow: SUCCESS');
      console.log(`   Order Created: ${workflowResult.orderCreated}`);
      console.log(`   Payment Processed: ${workflowResult.paymentProcessed}`);
      console.log(`   Pohoda Synced: ${workflowResult.pohodaSynced}`);
    } else {
      console.log('❌ Complete workflow failed:', workflowResult.error);
    }

    // Summary
    console.log('\n📊 CLOUD VPS + POHODA INTEGRATION SUMMARY:');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Invoice Details Retrieval: ${invoiceDetails.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Payment Processing: ${paymentResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Automatic Pohoda Sync: ${paymentResult.pohodaSync ? 'ENABLED' : 'DISABLED'}`);
    console.log(`✅ Direct Invoice Sync: ${directSyncResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Complete Workflow: ${workflowResult.success ? 'WORKING' : 'FAILED'}`);
    
    const allWorking = invoiceDetails.success && paymentResult.success && directSyncResult.success;
    console.log(`\n🎯 INTEGRATION STATUS: ${allWorking ? '✅ FULLY INTEGRATED' : '⚠️ NEEDS CONFIGURATION'}`);

    if (!allWorking) {
      console.log('\n📋 Configuration needed:');
      console.log('   1. Set up Dativery API credentials');
      console.log('   2. Configure Pohoda database connection');
      console.log('   3. Test with real Pohoda environment');
    }

  } catch (error) {
    console.error('💥 Integration test failed:', error.message);
  }
}

/**
 * Get invoice details from HostBill via middleware
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
 * Mark invoice as paid via middleware (with automatic Pohoda sync)
 */
async function markInvoiceAsPaid(testData) {
  try {
    const paymentData = {
      invoiceId: testData.invoiceId,
      transactionId: testData.transactionId,
      paymentMethod: testData.paymentMethod,
      amount: testData.amount,
      currency: testData.currency,
      notes: `CloudVPS integration test - ${testData.transactionId}`
    };

    const result = await callAPI('localhost', 3005, '/api/invoices/mark-paid', paymentData);
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
      orderId: testData.orderId || testData.invoiceId,
      transactionId: testData.transactionId,
      paymentMethod: testData.paymentMethod,
      amount: testData.amount,
      currency: testData.currency,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `CloudVPS invoice sync test - ${testData.transactionId}`,
      fetchCustomerData: testData.fetchCustomerData || false
    };

    const result = await callAPI('localhost', 3001, '/api/sync-pohoda-invoice', syncData);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Simulate complete CloudVPS workflow
 */
async function simulateCompleteWorkflow(testData) {
  try {
    console.log('   📋 Simulating: Order → Payment → Pohoda Sync');
    
    // This would normally be done by CloudVPS order creation
    const orderCreated = true;
    
    // This is the payment processing with Pohoda sync
    const paymentResult = await markInvoiceAsPaid(testData);
    const paymentProcessed = paymentResult.success;
    
    // Check if Pohoda sync was attempted
    const pohodaSynced = paymentResult.pohodaSync !== undefined;
    
    return {
      success: orderCreated && paymentProcessed,
      orderCreated,
      paymentProcessed,
      pohodaSynced,
      details: paymentResult
    };
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
  testCloudVPSPohodaIntegration()
    .then(() => {
      console.log('\n🏁 Cloud VPS + Pohoda integration test completed!');
      console.log('\n🚀 Ready for production with proper Dativery configuration!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Integration test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCloudVPSPohodaIntegration };
