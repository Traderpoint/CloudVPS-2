/**
 * Test script for /api/invoices/mark-paid endpoint
 * Tests both methods according to HostBill API documentation
 */

async function testMarkPaidAPI() {
  console.log('🧪 Testing /api/invoices/mark-paid API endpoint...');
  
  const baseUrl = 'http://localhost:3005';
  
  // Test data
  const testInvoiceId = '443'; // New invoice for testing
  const testTransactionId = 'TEST-MARK-PAID-' + Date.now();
  
  console.log('📋 Test data:', {
    invoiceId: testInvoiceId,
    transactionId: testTransactionId
  });

  try {
    // Test 1: Method 1 - addInvoicePayment (recommended by HostBill API docs)
    console.log('\n🔄 Test 1: Using addInvoicePayment method (recommended)...');
    
    const method1Response = await fetch(`${baseUrl}/api/invoices/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invoiceId: testInvoiceId,
        amount: 100.50,
        currency: 'CZK',
        paymentMethod: 'comgate',
        transactionId: testTransactionId,
        date: '2025-08-04',
        notes: 'Test payment via addInvoicePayment method'
      })
    });

    console.log('📊 Method 1 Response status:', method1Response.status);
    
    if (method1Response.ok) {
      const method1Data = await method1Response.json();
      console.log('✅ Method 1 Success:', method1Data);
    } else {
      const method1Error = await method1Response.text();
      console.log('❌ Method 1 Failed:', method1Error);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Method 2 - setInvoiceStatus (direct status update)
    console.log('\n🔄 Test 2: Using setInvoiceStatus method (direct)...');
    
    const testInvoiceId2 = '444'; // Another invoice for testing
    
    const method2Response = await fetch(`${baseUrl}/api/invoices/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invoiceId: testInvoiceId2,
        useDirectStatusUpdate: true
      })
    });

    console.log('📊 Method 2 Response status:', method2Response.status);
    
    if (method2Response.ok) {
      const method2Data = await method2Response.json();
      console.log('✅ Method 2 Success:', method2Data);
    } else {
      const method2Error = await method2Response.text();
      console.log('❌ Method 2 Failed:', method2Error);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Verify invoice statuses
    console.log('\n🔍 Test 3: Verifying invoice statuses...');
    
    for (const invoiceId of [testInvoiceId, testInvoiceId2]) {
      try {
        const statusResponse = await fetch(`${baseUrl}/api/invoices/${invoiceId}/status`);
        const statusData = await statusResponse.json();
        
        console.log(`📊 Invoice ${invoiceId} status:`, {
          isPaid: statusData.isPaid,
          status: statusData.status,
          amount: statusData.amount,
          datePaid: statusData.datePaid
        });
      } catch (statusError) {
        console.log(`⚠️ Could not check status for invoice ${invoiceId}:`, statusError.message);
      }
    }

    // Test 4: Error handling - missing invoiceId
    console.log('\n🔄 Test 4: Error handling (missing invoiceId)...');
    
    const errorResponse = await fetch(`${baseUrl}/api/invoices/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 50.00,
        currency: 'CZK'
        // Missing invoiceId
      })
    });

    console.log('📊 Error test response status:', errorResponse.status);
    
    if (!errorResponse.ok) {
      const errorData = await errorResponse.json();
      console.log('✅ Error handling works correctly:', errorData);
    } else {
      console.log('❌ Error handling failed - should have returned error');
    }

    console.log('\n🎯 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testMarkPaidAPI();
