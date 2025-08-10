/**
 * Test script for UpdatePaymentMethod functionality
 * Tests the new API endpoint for updating invoice payment methods
 */

const http = require('http');

async function testUpdatePaymentMethod() {
  console.log('🧪 Testing UpdatePaymentMethod API endpoint...\n');

  // Test data
  const testInvoiceId = '681'; // Unpaid invoice from HostBill
  const testPaymentMethod = 'payu'; // Change to PayU

  console.log(`📋 Test Parameters:`);
  console.log(`   Invoice ID: ${testInvoiceId}`);
  console.log(`   New Payment Method: ${testPaymentMethod}`);
  console.log('');

  try {
    // Step 1: Get current invoice details
    console.log('1️⃣ Getting current invoice details...');
    const currentInvoice = await getInvoiceDetails(testInvoiceId);
    
    if (currentInvoice.success) {
      console.log(`✅ Current invoice status: ${currentInvoice.invoice.status}`);
      console.log(`   Current payment method: ${currentInvoice.invoice.gateway || 'Not set'}`);
    } else {
      console.log(`❌ Failed to get invoice details: ${currentInvoice.error}`);
      return;
    }

    // Step 2: Test the UpdatePaymentMethod API
    console.log('\n2️⃣ Testing UpdatePaymentMethod API...');
    const updateResult = await callUpdatePaymentMethodAPI(testInvoiceId, testPaymentMethod);
    
    if (updateResult.success) {
      console.log('✅ UpdatePaymentMethod API call successful!');
      console.log(`   Response: ${updateResult.message}`);
      console.log(`   HostBill Response:`, updateResult.hostbillResponse);
    } else {
      console.log('❌ UpdatePaymentMethod API call failed!');
      console.log(`   Error: ${updateResult.error}`);
      if (updateResult.hostbillResponse) {
        console.log(`   HostBill Response:`, updateResult.hostbillResponse);
      }
    }

    // Step 3: Verify the change
    console.log('\n3️⃣ Verifying the payment method change...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const updatedInvoice = await getInvoiceDetails(testInvoiceId);
    
    if (updatedInvoice.success) {
      console.log(`✅ Updated invoice status: ${updatedInvoice.invoice.status}`);
      console.log(`   Updated payment method: ${updatedInvoice.invoice.gateway || 'Not set'}`);
      
      if (updatedInvoice.invoice.gateway === testPaymentMethod) {
        console.log('🎉 SUCCESS: Payment method was updated correctly!');
      } else {
        console.log('⚠️ WARNING: Payment method may not have been updated or change is not reflected yet');
      }
    } else {
      console.log(`❌ Failed to verify invoice details: ${updatedInvoice.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

/**
 * Call the UpdatePaymentMethod API endpoint
 */
async function callUpdatePaymentMethodAPI(invoiceId, paymentMethod) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      invoiceId,
      paymentMethod
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/hostbill/update-invoice-payment-method',
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

/**
 * Get invoice details from HostBill
 */
async function getInvoiceDetails(invoiceId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/hostbill/invoice/${invoiceId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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

    req.end();
  });
}

// Run the test
if (require.main === module) {
  testUpdatePaymentMethod()
    .then(() => {
      console.log('\n🏁 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testUpdatePaymentMethod };
