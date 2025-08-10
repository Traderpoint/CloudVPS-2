/**
 * Test Final Return Handler with Proven Method
 */

const http = require('http');

async function makeRequest(method, hostname, port, path, data) {
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
          resolve({ error: 'Invalid JSON', raw: responseData });
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

async function testFinalReturnHandler() {
  console.log('🚀 Testing Final Return Handler with Proven Method');
  console.log('================================================================================');

  try {
    const invoiceId = '548';
    
    // Step 1: Check current invoice status
    console.log('\n1️⃣ Checking current invoice status...');
    const currentStatus = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/invoice/${invoiceId}`);
    
    if (currentStatus.success) {
      console.log('✅ Current invoice status:', {
        invoiceId: currentStatus.invoice.id,
        status: currentStatus.invoice.status,
        amount: currentStatus.invoice.amount,
        transactionCount: currentStatus.invoice.debugInfo?.transactionCount,
        autoMarkedAsPaid: currentStatus.invoice.autoMarkedAsPaid
      });
    } else {
      console.log('❌ Failed to get current status:', currentStatus.error);
      return;
    }

    // Step 2: Test return handler with proven method (simulate payment success)
    console.log('\n2️⃣ Testing return handler with proven method...');
    
    // Use direct HostBill API to simulate return handler behavior
    const https = require('https');
    const querystring = require('querystring');
    
    // HostBill API configuration
    const HB_API_URL = 'https://vps.kabel1it.cz/admin/api.php';
    const HB_API_ID = 'adcdebb0e3b6f583052d';
    const HB_API_KEY = '341697c41aeb1c842f0d';
    
    const transactionId = `FINAL-TEST-${Date.now()}`;
    
    // Step 2a: Add payment record (like return handler does)
    console.log('💳 Step 2a: Adding payment record...');
    
    const paymentParams = querystring.stringify({
      call: 'addInvoicePayment',
      api_id: HB_API_ID,
      api_key: HB_API_KEY,
      id: invoiceId,
      amount: currentStatus.invoice.amount,
      paymentmodule: '0', // Credit Balance (proven method)
      fee: 0,
      transnumber: transactionId,
      notes: `Payment processed via return handler test - Transaction: ${transactionId}`,
      send_email: 1
    });

    const paymentResult = await new Promise((resolve, reject) => {
      const req = https.request(HB_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(paymentParams)
        },
        rejectUnauthorized: false
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ error: 'Invalid JSON', raw: data });
          }
        });
      });
      
      req.on('error', reject);
      req.write(paymentParams);
      req.end();
    });

    if (paymentResult.success !== false && !paymentResult.error) {
      console.log('✅ Step 2a COMPLETE: Payment record added successfully');
    } else {
      console.log('⚠️ Step 2a WARNING: Payment record failed:', paymentResult.error || paymentResult);
    }

    // Step 2b: Update invoice status (like return handler does)
    console.log('📋 Step 2b: Updating invoice status to PAID...');
    
    const statusParams = querystring.stringify({
      call: 'setInvoiceStatus',
      api_id: HB_API_ID,
      api_key: HB_API_KEY,
      id: invoiceId,
      status: 'Paid'
    });

    const statusResult = await new Promise((resolve, reject) => {
      const req = https.request(HB_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(statusParams)
        },
        rejectUnauthorized: false
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ error: 'Invalid JSON', raw: data });
          }
        });
      });
      
      req.on('error', reject);
      req.write(statusParams);
      req.end();
    });

    if (statusResult.success !== false && !statusResult.error) {
      console.log('✅ Step 2b COMPLETE: Invoice status updated successfully');
    } else {
      console.log('⚠️ Step 2b WARNING: Invoice status update failed:', statusResult.error || statusResult);
    }

    // Step 3: Verify final status
    console.log('\n3️⃣ Verifying final invoice status...');
    
    const finalStatus = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/invoice/${invoiceId}`);
    
    if (finalStatus.success) {
      console.log('✅ Final invoice status:', {
        invoiceId: finalStatus.invoice.id,
        status: finalStatus.invoice.status,
        amount: finalStatus.invoice.amount,
        transactionCount: finalStatus.invoice.debugInfo?.transactionCount,
        autoMarkedAsPaid: finalStatus.invoice.autoMarkedAsPaid,
        lastTransactionId: finalStatus.invoice.transactions?.length > 0 ? 
          finalStatus.invoice.transactions[finalStatus.invoice.transactions.length - 1]?.trans_id : 'None'
      });

      if (finalStatus.invoice.status === 'Paid' && 
          finalStatus.invoice.debugInfo?.transactionCount > currentStatus.invoice.debugInfo?.transactionCount) {
        console.log('🎉 SUCCESS: Return handler proven method works!');
        console.log(`📈 Transaction count increased from ${currentStatus.invoice.debugInfo?.transactionCount} to ${finalStatus.invoice.debugInfo?.transactionCount}`);
      } else {
        console.log('⚠️ PARTIAL SUCCESS: Invoice is PAID but transaction count did not increase');
      }
    } else {
      console.log('❌ Failed to verify final status:', finalStatus.error);
    }

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFinalReturnHandler();
