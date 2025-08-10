/**
 * Test script for Authorize Payment functionality
 * This simulates a successful payment return and tests the authorize payment flow
 */

// Using built-in fetch (Node.js 18+)

async function testAuthorizePayment() {
  console.log('🧪 Testing Authorize Payment functionality...');
  
  // Test data - using existing invoice for testing the complete workflow
  const testData = {
    orderId: '405',
    invoiceId: '448',  // Use existing invoice
    transactionId: 'COMPLETE-WORKFLOW-' + Date.now(),
    status: 'success',
    paymentMethod: 'comgate'
  };

  console.log('📋 Test data:', testData);

  try {
    // Simulate payment return URL call
    const returnUrl = `http://localhost:3005/api/payments/return?status=${testData.status}&orderId=${testData.orderId}&invoiceId=${testData.invoiceId}&paymentMethod=${testData.paymentMethod}&transId=${testData.transactionId}`;
    
    console.log('🔗 Calling payment return URL:', returnUrl);
    
    const response = await fetch(returnUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Authorize-Payment/1.0'
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.status === 302) {
      console.log('✅ Payment return handler executed (redirect response)');
      console.log('🔗 Redirect location:', response.headers.get('location'));
    } else {
      const responseText = await response.text();
      console.log('📄 Response body:', responseText);
    }

    // Wait a moment for processing
    console.log('⏳ Waiting 3 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check invoice status to verify payment was processed
    console.log('🔍 Checking invoice status...');
    const statusResponse = await fetch(`http://localhost:3005/api/invoices/${testData.invoiceId}/status`);
    const statusData = await statusResponse.json();
    
    console.log('📊 Invoice status check result:', statusData);

    if (statusData.isPaid) {
      console.log('✅ Invoice is marked as PAID');
    } else {
      console.log('❌ Invoice is NOT marked as PAID');
    }

    console.log('🎯 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAuthorizePayment();
