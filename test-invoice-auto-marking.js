/**
 * Test Invoice Auto-marking
 * Zjišťuje, kde se faktura automaticky označuje jako PAID
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

console.log('🔍 Testing Invoice Auto-marking');
console.log('===============================');
console.log('');

async function testInvoiceAutoMarking() {
  try {
    // Step 1: Get current invoice status
    console.log('1️⃣ Checking current invoice status...');
    console.log('====================================');
    
    const testInvoiceId = '470';
    
    // Check invoice status before any operations
    const statusResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${testInvoiceId}`);
    
    if (statusResponse.ok) {
      const invoiceData = await statusResponse.json();
      console.log('📋 Current invoice status:');
      console.log(`   Invoice ID: ${invoiceData.id || testInvoiceId}`);
      console.log(`   Status: ${invoiceData.status}`);
      console.log(`   Total: ${invoiceData.total}`);
      console.log(`   Paid: ${invoiceData.paid || 0}`);
      console.log(`   Balance: ${invoiceData.balance || invoiceData.total}`);
    } else {
      console.log('⚠️ Could not get invoice status');
    }
    console.log('');

    // Step 2: Test payment initialization (should not mark invoice)
    console.log('2️⃣ Testing payment initialization...');
    console.log('===================================');
    
    const initResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: '433',
        invoiceId: testInvoiceId,
        method: 'comgate',
        amount: 100,
        currency: 'CZK',
        customerData: {
          email: 'test@example.com',
          name: 'Test Customer'
        },
        testFlow: true,
        returnUrl: 'http://localhost:3000/payment-success-flow'
      })
    });
    
    if (initResponse.ok) {
      const initResult = await initResponse.json();
      console.log('✅ Payment initialization completed');
      console.log(`   Payment ID: ${initResult.paymentId}`);
      console.log(`   Transaction ID: ${initResult.transactionId}`);
      
      // Check invoice status after initialization
      const statusAfterInit = await fetch(`${MIDDLEWARE_URL}/api/invoices/${testInvoiceId}`);
      if (statusAfterInit.ok) {
        const invoiceAfterInit = await statusAfterInit.json();
        console.log('📋 Invoice status after initialization:');
        console.log(`   Status: ${invoiceAfterInit.status}`);
        console.log(`   Paid: ${invoiceAfterInit.paid || 0}`);
        
        if (invoiceAfterInit.status === 'Paid' || invoiceAfterInit.paid > 0) {
          console.log('⚠️ INVOICE WAS MARKED AS PAID DURING INITIALIZATION!');
        } else {
          console.log('✅ Invoice NOT marked as paid during initialization (correct)');
        }
      }
    } else {
      console.log('❌ Payment initialization failed');
    }
    console.log('');

    // Step 3: Test ComGate callback (should not mark invoice)
    console.log('3️⃣ Testing ComGate callback...');
    console.log('==============================');
    
    const callbackResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/comgate/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transId: 'TEST-TX-' + Date.now(),
        status: 'PAID',
        price: 10000, // 100 CZK in cents
        curr: 'CZK',
        refId: '433',
        email: 'test@example.com',
        method: 'CARD_CZ_CSOB_2',
        test: 'true'
      })
    });
    
    if (callbackResponse.ok) {
      const callbackResult = await callbackResponse.json();
      console.log('✅ ComGate callback completed');
      console.log(`   Success: ${callbackResult.success}`);
      console.log(`   Message: ${callbackResult.message}`);
      console.log(`   Invoice Updated: ${callbackResult.invoiceUpdated}`);
      
      // Check invoice status after callback
      const statusAfterCallback = await fetch(`${MIDDLEWARE_URL}/api/invoices/${testInvoiceId}`);
      if (statusAfterCallback.ok) {
        const invoiceAfterCallback = await statusAfterCallback.json();
        console.log('📋 Invoice status after callback:');
        console.log(`   Status: ${invoiceAfterCallback.status}`);
        console.log(`   Paid: ${invoiceAfterCallback.paid || 0}`);
        
        if (invoiceAfterCallback.status === 'Paid' || invoiceAfterCallback.paid > 0) {
          console.log('⚠️ INVOICE WAS MARKED AS PAID DURING CALLBACK!');
        } else {
          console.log('✅ Invoice NOT marked as paid during callback (correct)');
        }
      }
    } else {
      console.log('❌ ComGate callback failed');
    }
    console.log('');

    // Step 4: Test payment return (should not mark invoice)
    console.log('4️⃣ Testing payment return...');
    console.log('============================');
    
    const returnParams = new URLSearchParams({
      status: 'success',
      orderId: '433',
      invoiceId: testInvoiceId,
      transactionId: 'TEST-TX-' + Date.now(),
      paymentMethod: 'comgate',
      amount: '100',
      currency: 'CZK'
    });
    
    const returnResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/return?${returnParams.toString()}`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log(`📊 Return response: ${returnResponse.status}`);
    
    if (returnResponse.status === 302) {
      const redirectLocation = returnResponse.headers.get('location');
      console.log('✅ Payment return completed');
      console.log(`   Redirect: ${redirectLocation}`);
      
      // Check invoice status after return
      const statusAfterReturn = await fetch(`${MIDDLEWARE_URL}/api/invoices/${testInvoiceId}`);
      if (statusAfterReturn.ok) {
        const invoiceAfterReturn = await statusAfterReturn.json();
        console.log('📋 Invoice status after return:');
        console.log(`   Status: ${invoiceAfterReturn.status}`);
        console.log(`   Paid: ${invoiceAfterReturn.paid || 0}`);
        
        if (invoiceAfterReturn.status === 'Paid' || invoiceAfterReturn.paid > 0) {
          console.log('⚠️ INVOICE WAS MARKED AS PAID DURING RETURN!');
        } else {
          console.log('✅ Invoice NOT marked as paid during return (correct)');
        }
      }
    } else {
      console.log('❌ Payment return failed');
    }
    console.log('');

    // Step 5: Check for any automatic processes
    console.log('5️⃣ Checking for automatic processes...');
    console.log('=====================================');
    
    // Wait a bit to see if any background processes mark the invoice
    console.log('⏳ Waiting 3 seconds for any background processes...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalStatusResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/${testInvoiceId}`);
    if (finalStatusResponse.ok) {
      const finalInvoiceData = await finalStatusResponse.json();
      console.log('📋 Final invoice status:');
      console.log(`   Status: ${finalInvoiceData.status}`);
      console.log(`   Paid: ${finalInvoiceData.paid || 0}`);
      console.log(`   Balance: ${finalInvoiceData.balance || finalInvoiceData.total}`);
      
      if (finalInvoiceData.status === 'Paid' || finalInvoiceData.paid > 0) {
        console.log('⚠️ INVOICE WAS MARKED AS PAID BY SOME AUTOMATIC PROCESS!');
        console.log('🔍 This indicates there is still automatic invoice marking happening');
      } else {
        console.log('✅ Invoice remains unpaid (correct behavior)');
      }
    }
    console.log('');

    // Summary
    console.log('📊 INVOICE AUTO-MARKING TEST SUMMARY');
    console.log('====================================');
    console.log('');
    console.log('🔍 Analysis:');
    console.log('   This test simulates the complete payment flow without');
    console.log('   using the payment-success-flow buttons to see where');
    console.log('   automatic invoice marking might be happening.');
    console.log('');
    console.log('📋 Expected behavior:');
    console.log('   ✅ Payment initialization: Should NOT mark invoice');
    console.log('   ✅ ComGate callback: Should NOT mark invoice');
    console.log('   ✅ Payment return: Should NOT mark invoice');
    console.log('   ✅ Background processes: Should NOT mark invoice');
    console.log('');
    console.log('🎯 If invoice gets marked automatically, check:');
    console.log('   1. ComGate callback handler');
    console.log('   2. Payment return handler');
    console.log('   3. Payment initialization process');
    console.log('   4. Any background/scheduled processes');
    console.log('   5. HostBill automatic payment processing');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testInvoiceAutoMarking();
