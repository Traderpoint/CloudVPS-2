/**
 * Test Proven Method for Marking Invoice as Paid
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

async function testProvenMethod() {
  console.log('🚀 Testing Proven Method for Marking Invoice as Paid');
  console.log('================================================================================');

  try {
    // Test invoice ID 548 (from our previous test)
    const invoiceId = '548';
    
    console.log('\n1️⃣ Testing proven method: addInvoicePayment + updateInvoiceStatus...');
    
    // Step 1: Check current invoice status
    console.log('\n📋 Step 1: Checking current invoice status...');
    const currentStatus = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/invoice/${invoiceId}`);
    
    if (currentStatus.success) {
      console.log('✅ Current invoice status:', {
        invoiceId: currentStatus.invoice.id,
        status: currentStatus.invoice.status,
        amount: currentStatus.invoice.amount,
        transactionCount: currentStatus.invoice.debugInfo?.transactionCount
      });
    } else {
      console.log('❌ Failed to get current status:', currentStatus.error);
      return;
    }

    // Step 2: Use proven method via direct HostBill API calls
    console.log('\n💰 Step 2: Using proven method - addInvoicePayment...');
    
    // We'll use the HostBill API directly
    const https = require('https');
    const querystring = require('querystring');
    
    // HostBill API configuration
    const HB_API_URL = 'https://vps.kabel1it.cz/admin/api.php';
    const HB_API_ID = 'adcdebb0e3b6f583052d';
    const HB_API_KEY = '341697c41aeb1c842f0d';
    
    // Step 2a: Add payment record
    const paymentParams = querystring.stringify({
      call: 'addInvoicePayment',
      api_id: HB_API_ID,
      api_key: HB_API_KEY,
      id: invoiceId,
      amount: currentStatus.invoice.amount,
      paymentmodule: '0', // Credit Balance
      fee: 0,
      transnumber: `PROVEN-METHOD-${Date.now()}`,
      notes: 'Payment added via proven method test',
      send_email: 1
    });

    console.log('📤 Adding payment record to invoice...');
    
    const paymentResult = await new Promise((resolve, reject) => {
      const req = https.request(HB_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(paymentParams)
        },
        rejectUnauthorized: false // Ignore SSL certificate errors
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
      console.log('✅ Payment record added successfully:', {
        paymentId: paymentResult.payment_id || 'Unknown',
        result: paymentResult
      });
    } else {
      console.log('⚠️ Payment record failed:', paymentResult.error || paymentResult);
    }

    // Step 2b: Update invoice status
    console.log('\n📋 Step 2b: Updating invoice status to PAID...');
    
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
        rejectUnauthorized: false // Ignore SSL certificate errors
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
      console.log('✅ Invoice status updated successfully:', statusResult);
    } else {
      console.log('⚠️ Invoice status update failed:', statusResult.error || statusResult);
    }

    // Step 3: Verify final status
    console.log('\n🔍 Step 3: Verifying final invoice status...');
    
    const finalStatus = await makeRequest('GET', 'localhost', 3000, `/api/hostbill/invoice/${invoiceId}`);
    
    if (finalStatus.success) {
      console.log('✅ Final invoice status:', {
        invoiceId: finalStatus.invoice.id,
        status: finalStatus.invoice.status,
        amount: finalStatus.invoice.amount,
        transactionCount: finalStatus.invoice.debugInfo?.transactionCount,
        autoMarkedAsPaid: finalStatus.invoice.autoMarkedAsPaid
      });

      if (finalStatus.invoice.status === 'Paid' && finalStatus.invoice.debugInfo?.transactionCount > 0) {
        console.log('🎉 SUCCESS: Invoice is marked as PAID with transaction record!');
      } else if (finalStatus.invoice.status === 'Paid') {
        console.log('⚠️ PARTIAL SUCCESS: Invoice is PAID but no transaction record');
      } else {
        console.log('❌ FAILED: Invoice is not marked as PAID');
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
testProvenMethod();
