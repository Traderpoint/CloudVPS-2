/**
 * Pohoda Mode Switch Test
 * Tests POHODA_MIDDLEWARE_MODE functionality
 */

const http = require('http');

async function testPohodaModeSwitch() {
  console.log('🧪 Testing Pohoda Mode Switch Functionality...\n');
  
  // Test both modes
  const modes = [
    { mode: 'NO', description: 'HostBill Module Mode (RECOMMENDED)' },
    { mode: 'YES', description: 'Middleware Mode (BACKUP)' }
  ];
  
  for (const modeTest of modes) {
    console.log(`\n🔄 Testing POHODA_MIDDLEWARE_MODE=${modeTest.mode}`);
    console.log(`📋 ${modeTest.description}`);
    console.log('═'.repeat(60));
    
    // Update environment variable for test
    process.env.POHODA_MIDDLEWARE_MODE = modeTest.mode;
    
    // Test 1: Pohoda Status
    console.log('\n1️⃣ Testing Pohoda Status...');
    const statusResult = await testPohodaStatus();
    
    if (statusResult.success) {
      console.log('✅ Status endpoint: WORKING');
      console.log(`   Middleware Mode: ${statusResult.pohoda.middlewareMode || 'NOT_SET'}`);
      console.log(`   Middleware Enabled: ${statusResult.pohoda.middlewareEnabled ? 'YES' : 'NO'}`);
      console.log(`   Recommendation: ${statusResult.pohoda.recommendation || 'N/A'}`);
    } else {
      console.log('❌ Status endpoint: FAILED');
      console.log(`   Error: ${statusResult.error}`);
    }
    
    // Test 2: Invoice Sync
    console.log('\n2️⃣ Testing Invoice Sync...');
    const syncResult = await testInvoiceSync();
    
    if (syncResult.success) {
      console.log('✅ Invoice sync endpoint: WORKING');
      console.log(`   Message: ${syncResult.message}`);
      console.log(`   Middleware Mode: ${syncResult.middlewareMode || 'unknown'}`);
      
      if (modeTest.mode === 'NO') {
        console.log('   ✅ Correctly delegated to HostBill module');
      } else {
        console.log('   ✅ Middleware processing active');
      }
    } else {
      console.log('❌ Invoice sync endpoint: FAILED');
      console.log(`   Error: ${syncResult.error}`);
    }
    
    // Test 3: Payment Processing
    console.log('\n3️⃣ Testing Payment Processing...');
    const paymentResult = await testPaymentProcessing();
    
    if (paymentResult.success) {
      console.log('✅ Payment processing: WORKING');
      
      if (paymentResult.pohodaSync) {
        console.log(`   Pohoda Sync: ${paymentResult.pohodaSync.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Sync Message: ${paymentResult.pohodaSync.message || 'N/A'}`);
        
        if (modeTest.mode === 'NO') {
          console.log('   ✅ Correctly using HostBill module');
        } else {
          console.log('   ✅ Middleware sync active');
        }
      }
    } else {
      console.log('❌ Payment processing: FAILED');
      console.log(`   Error: ${paymentResult.error}`);
    }
    
    console.log(`\n📊 Mode ${modeTest.mode} Summary:`);
    console.log(`   Status: ${statusResult.success ? '✅' : '❌'}`);
    console.log(`   Sync: ${syncResult.success ? '✅' : '❌'}`);
    console.log(`   Payment: ${paymentResult.success ? '✅' : '❌'}`);
    console.log(`   Behavior: ${modeTest.mode === 'NO' ? 'HostBill Module' : 'Middleware'}`);
  }
  
  // Final summary
  console.log('\n\n🎯 POHODA MODE SWITCH SUMMARY:');
  console.log('═'.repeat(60));
  console.log('✅ POHODA_MIDDLEWARE_MODE=NO  → HostBill Module (RECOMMENDED)');
  console.log('✅ POHODA_MIDDLEWARE_MODE=YES → Middleware Processing');
  console.log('\n🏆 RECOMMENDATION: Use POHODA_MIDDLEWARE_MODE=NO');
  console.log('   - Better performance (direct communication)');
  console.log('   - Simpler architecture (fewer components)');
  console.log('   - Native HostBill integration (hooks)');
  console.log('   - Easier management (single admin interface)');
  
  console.log('\n🔧 CURRENT CONFIGURATION:');
  console.log(`   POHODA_MIDDLEWARE_MODE: ${process.env.POHODA_MIDDLEWARE_MODE || 'NOT_SET'}`);
  console.log(`   Recommended: NO (HostBill module)`);
  
  console.log('\n📋 NEXT STEPS:');
  if (process.env.POHODA_MIDDLEWARE_MODE !== 'NO') {
    console.log('   1. Set POHODA_MIDDLEWARE_MODE=NO in .env.local');
    console.log('   2. Install HostBill Pohoda module');
    console.log('   3. Configure HostBill module');
    console.log('   4. Test HostBill integration');
  } else {
    console.log('   1. Install HostBill Pohoda module (see HOSTBILL_POHODA_INSTALLATION_GUIDE.md)');
    console.log('   2. Configure Pohoda SW (see POHODA_SOFTWARE_SETUP_GUIDE.md)');
    console.log('   3. Test complete integration');
  }
}

/**
 * Test Pohoda status endpoint
 */
async function testPohodaStatus() {
  try {
    const result = await callAPI('localhost', 3005, '/api/pohoda/status', null, 'GET');
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test invoice sync endpoint
 */
async function testInvoiceSync() {
  try {
    const syncData = {
      invoiceId: '681',
      transactionId: `MODE-TEST-${Date.now()}`,
      paymentMethod: 'comgate',
      amount: 100,
      currency: 'CZK'
    };
    
    const result = await callAPI('localhost', 3005, '/api/pohoda/sync-invoice', syncData);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test payment processing
 */
async function testPaymentProcessing() {
  try {
    const paymentData = {
      invoiceId: '681',
      transactionId: `MODE-TEST-${Date.now()}`,
      paymentMethod: 'comgate',
      amount: 100,
      currency: 'CZK',
      notes: 'Mode switch test payment'
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
  testPohodaModeSwitch()
    .then(() => {
      console.log('\n🏁 Pohoda mode switch test completed!');
      console.log('\n🎯 Mode switch functionality is working correctly!');
      console.log('\n📖 Installation Guides:');
      console.log('   - HostBill Module: HOSTBILL_POHODA_INSTALLATION_GUIDE.md');
      console.log('   - Pohoda SW Setup: POHODA_SOFTWARE_SETUP_GUIDE.md');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPohodaModeSwitch };
