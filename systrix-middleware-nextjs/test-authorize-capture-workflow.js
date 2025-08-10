/**
 * Test script for HostBill Authorize + Capture workflow
 * Tests complete payment workflow: Authorize Payment → Capture Payment → Provision
 */

async function testAuthorizeCaptureWorkflow() {
  console.log('🧪 Testing HostBill Authorize + Capture Workflow...');
  console.log('====================================================');
  
  const baseUrl = 'http://localhost:3005';
  const timestamp = Date.now();
  
  // Test data
  const testData = {
    orderId: '405',        // Existing order from previous tests
    invoiceId: '447',      // New test invoice
    transactionId: `WORKFLOW-TEST-${timestamp}`,
    amount: 362,
    currency: 'CZK',
    paymentMethod: 'comgate'
  };
  
  console.log('📋 Test data:', testData);
  console.log('');

  try {
    // Test 1: Check initial invoice status
    console.log('🔄 Test 1: Checking initial invoice status...');
    console.log('===============================================');
    
    const initialStatusResponse = await fetch(`${baseUrl}/api/invoices/${testData.invoiceId}/status`);
    const initialStatus = await initialStatusResponse.json();
    
    console.log('Initial Invoice Status:', {
      invoiceId: initialStatus.invoiceId,
      status: initialStatus.status,
      isPaid: initialStatus.isPaid,
      amount: initialStatus.amount
    });
    console.log('');

    // Test 2: Complete workflow (Authorize + Capture)
    console.log('🔄 Test 2: Running complete Authorize + Capture workflow...');
    console.log('============================================================');
    
    const workflowResponse = await fetch(`${baseUrl}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('Workflow Response Status:', workflowResponse.status);
    
    if (workflowResponse.ok) {
      const workflowResult = await workflowResponse.json();
      console.log('✅ Workflow Response:', JSON.stringify(workflowResult, null, 2));
      
      // Analyze workflow results
      console.log('');
      console.log('📊 Workflow Analysis:');
      console.log('=====================');
      console.log('Overall Success:', workflowResult.success);
      console.log('Authorize Payment:', workflowResult.workflow.authorizePayment);
      console.log('Capture Payment:', workflowResult.workflow.capturePayment);
      console.log('Provision Status:', workflowResult.workflow.provision);
      
      if (workflowResult.details.authorize) {
        console.log('Authorize Details:', workflowResult.details.authorize.success ? '✅ Success' : '❌ Failed');
      }
      
      if (workflowResult.details.capture) {
        console.log('Capture Details:', workflowResult.details.capture.success ? '✅ Success' : '❌ Failed');
      }
      
    } else {
      const errorResult = await workflowResponse.text();
      console.log('❌ Workflow Failed:', errorResult);
    }
    console.log('');

    // Test 3: Wait and check final invoice status
    console.log('⏳ Waiting 3 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
    
    console.log('🔄 Test 3: Checking final invoice status...');
    console.log('============================================');
    
    const finalStatusResponse = await fetch(`${baseUrl}/api/invoices/${testData.invoiceId}/status`);
    const finalStatus = await finalStatusResponse.json();
    
    console.log('Final Invoice Status:', {
      invoiceId: finalStatus.invoiceId,
      status: finalStatus.status,
      isPaid: finalStatus.isPaid,
      amount: finalStatus.amount,
      datePaid: finalStatus.datePaid
    });
    
    // Compare before and after
    console.log('');
    console.log('📊 Before vs After Comparison:');
    console.log('==============================');
    console.log('Status:', `${initialStatus.status} → ${finalStatus.status}`);
    console.log('isPaid:', `${initialStatus.isPaid} → ${finalStatus.isPaid}`);
    console.log('datePaid:', `${initialStatus.datePaid} → ${finalStatus.datePaid}`);
    console.log('');

    // Test 4: Test individual steps
    console.log('🔄 Test 4: Testing individual workflow steps...');
    console.log('================================================');
    
    // Test 4a: Authorize only
    console.log('4a. Testing Authorize only...');
    const authorizeOnlyResponse = await fetch(`${baseUrl}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: testData.orderId,
        invoiceId: '448', // Different invoice
        transactionId: `${testData.transactionId}-AUTH-ONLY`,
        skipCapture: true
      })
    });
    
    if (authorizeOnlyResponse.ok) {
      const authResult = await authorizeOnlyResponse.json();
      console.log('✅ Authorize only result:', {
        success: authResult.success,
        authorizePayment: authResult.workflow.authorizePayment,
        capturePayment: authResult.workflow.capturePayment
      });
    } else {
      console.log('❌ Authorize only failed:', authorizeOnlyResponse.status);
    }
    
    // Test 4b: Capture only
    console.log('4b. Testing Capture only...');
    const captureOnlyResponse = await fetch(`${baseUrl}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invoiceId: '449', // Different invoice
        transactionId: `${testData.transactionId}-CAPTURE-ONLY`,
        amount: 150,
        paymentMethod: 'comgate',
        skipAuthorize: true
      })
    });
    
    if (captureOnlyResponse.ok) {
      const captureResult = await captureOnlyResponse.json();
      console.log('✅ Capture only result:', {
        success: captureResult.success,
        authorizePayment: captureResult.workflow.authorizePayment,
        capturePayment: captureResult.workflow.capturePayment
      });
    } else {
      console.log('❌ Capture only failed:', captureOnlyResponse.status);
    }
    console.log('');

    // Test 5: Error handling
    console.log('🔄 Test 5: Testing error handling...');
    console.log('====================================');
    
    const errorResponse = await fetch(`${baseUrl}/api/payments/authorize-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Missing invoiceId
        orderId: testData.orderId,
        transactionId: 'ERROR-TEST'
      })
    });
    
    console.log('Error handling response status:', errorResponse.status);
    if (!errorResponse.ok) {
      const errorResult = await errorResponse.json();
      console.log('✅ Error handling works:', errorResult.error);
    }
    console.log('');

    // Summary
    console.log('📊 SUMMARY');
    console.log('==========');
    console.log('Test Invoice ID:', testData.invoiceId);
    console.log('Transaction ID:', testData.transactionId);
    console.log('Initial Status:', initialStatus.status);
    console.log('Final Status:', finalStatus.status);
    console.log('Payment Success:', finalStatus.isPaid);
    
    if (finalStatus.isPaid && finalStatus.status === 'Paid') {
      console.log('🎉 AUTHORIZE + CAPTURE WORKFLOW TEST PASSED!');
      console.log('✅ HostBill workflow completed successfully:');
      console.log('   • Authorize Payment: Completed');
      console.log('   • Capture Payment: Completed');
      console.log('   • Invoice marked as PAID');
      console.log('   • Provision should be ready');
    } else {
      console.log('❌ AUTHORIZE + CAPTURE WORKFLOW TEST FAILED!');
      console.log('❌ Workflow did not complete successfully');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAuthorizeCaptureWorkflow();
