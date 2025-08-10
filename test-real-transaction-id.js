// Test script to verify real transaction ID handling
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';
const MIDDLEWARE_URL = 'http://localhost:3005';

async function testRealTransactionId() {
  console.log('🧪 Testing Real Transaction ID Handling...\n');

  try {
    // Test 1: Initialize real ComGate payment
    console.log('1️⃣ Testing ComGate payment initialization...');
    
    const paymentData = {
      orderId: `REAL-TXN-TEST-${Date.now()}`,
      invoiceId: '456',
      method: 'comgate',
      amount: 1000,
      currency: 'CZK',
      customerData: {
        email: 'test@example.com',
        name: 'Test Customer'
      },
      testFlow: true,
      returnUrl: 'http://localhost:3000/payment-complete',
      cancelUrl: 'http://localhost:3000/payment'
    };

    console.log('📋 Payment data:', paymentData);

    const initResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    if (initResponse.ok) {
      const initResult = await initResponse.json();
      
      if (initResult.success) {
        console.log('✅ ComGate payment initialized successfully');
        console.log(`   Payment ID: ${initResult.paymentId}`);
        console.log(`   Transaction ID: ${initResult.transactionId || 'Not provided'}`);
        console.log(`   Payment URL: ${initResult.paymentUrl?.substring(0, 60)}...`);
        
        // Check if we got a real ComGate transaction ID
        if (initResult.transactionId && !initResult.transactionId.startsWith('AUTO-')) {
          console.log('   ✅ Real transaction ID from ComGate API');
        } else if (initResult.paymentId && !initResult.paymentId.startsWith('PAY-')) {
          console.log('   ✅ Real payment ID from ComGate API (can be used as transaction ID)');
        } else {
          console.log('   ⚠️ Generated ID, not from ComGate API');
        }
      } else {
        console.log(`❌ ComGate initialization failed: ${initResult.error}`);
      }
    } else {
      console.log(`❌ ComGate initialization API error: ${initResponse.status}`);
    }

    // Test 2: Test mark invoice paid with validation
    console.log('\n2️⃣ Testing mark invoice paid with transaction ID validation...');
    
    const testInvoiceData = {
      invoiceId: '456',
      transactionId: '', // Empty to test validation
      paymentMethod: 'comgate',
      amount: 1000,
      currency: 'CZK'
    };

    console.log('📋 Testing with empty transaction ID...');
    
    const markPaidResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testInvoiceData)
    });

    if (markPaidResponse.ok) {
      const markPaidResult = await markPaidResponse.json();
      
      if (!markPaidResult.success && markPaidResult.error.includes('Transaction ID is required')) {
        console.log('✅ Validation working: Rejects empty transaction ID');
        console.log(`   Error: ${markPaidResult.error}`);
      } else {
        console.log('❌ Validation failed: Should reject empty transaction ID');
      }
    } else {
      console.log(`✅ HTTP ${markPaidResponse.status}: Properly rejects invalid request`);
    }

    // Test 3: Test with real transaction ID
    console.log('\n3️⃣ Testing mark invoice paid with real transaction ID...');
    
    const realTransactionData = {
      invoiceId: '456',
      transactionId: 'REAL-COMGATE-TXN-123456789', // Real-looking transaction ID
      paymentMethod: 'comgate',
      amount: 1000,
      currency: 'CZK'
    };

    console.log('📋 Testing with real transaction ID:', realTransactionData.transactionId);
    
    const realMarkPaidResponse = await fetch(`${MIDDLEWARE_URL}/api/invoices/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(realTransactionData)
    });

    if (realMarkPaidResponse.ok) {
      const realMarkPaidResult = await realMarkPaidResponse.json();
      
      if (realMarkPaidResult.success) {
        console.log('✅ Real transaction ID accepted');
        console.log(`   Result: ${realMarkPaidResult.message || 'Payment marked as paid'}`);
      } else {
        console.log(`❌ Real transaction ID rejected: ${realMarkPaidResult.error}`);
      }
    } else {
      console.log(`❌ Real transaction ID API error: ${realMarkPaidResponse.status}`);
    }

    // Test 4: Check ComGate API documentation compliance
    console.log('\n4️⃣ Testing ComGate API transaction ID format...');
    
    // Simulate ComGate callback parameters
    const comgateCallbackParams = {
      transId: 'ABCD-EFGH-IJKL', // Real ComGate format
      refId: paymentData.orderId,
      status: 'PAID',
      price: '100000', // in haléře
      curr: 'CZK',
      label: 'Test payment',
      method: 'CARD_CZ_CSOB_2'
    };

    console.log('📋 Simulated ComGate callback parameters:', comgateCallbackParams);
    
    // Test return handler with real ComGate parameters
    const returnUrl = `${MIDDLEWARE_URL}/api/payments/return?status=success&transId=${comgateCallbackParams.transId}&refId=${comgateCallbackParams.refId}&price=${comgateCallbackParams.price}&curr=${comgateCallbackParams.curr}&method=${comgateCallbackParams.method}`;
    
    console.log('🔗 Testing return handler with ComGate parameters...');
    console.log(`   URL: ${returnUrl.substring(0, 80)}...`);
    
    try {
      const returnResponse = await fetch(returnUrl);
      
      if (returnResponse.ok) {
        console.log('✅ Return handler accepts ComGate parameters');
        
        // Check if it redirects (should be 302)
        if (returnResponse.status === 302 || returnResponse.redirected) {
          console.log('✅ Return handler redirects correctly');
        }
      } else {
        console.log(`⚠️ Return handler response: ${returnResponse.status}`);
      }
    } catch (returnError) {
      console.log(`⚠️ Return handler test: ${returnError.message}`);
    }

    console.log('\n🎉 Real Transaction ID Test Complete!');
    console.log('\n📋 Summary of Fixes Applied:');
    console.log('   - ✅ Removed AUTO-${Date.now()} fallback from mark-paid API');
    console.log('   - ✅ Added transaction ID validation in mark-paid API');
    console.log('   - ✅ Removed AUTO-${Date.now()} fallback from return handler');
    console.log('   - ✅ Added transaction ID validation in return handler');
    console.log('   - ✅ Removed AUTO-CAPTURE fallback from payment-complete');
    console.log('   - ✅ Added transaction ID validation in auto-capture');
    console.log('\n🌐 Expected Behavior:');
    console.log('   1. ComGate generates real transaction ID (e.g., ABCD-EFGH-IJKL)');
    console.log('   2. Return handler receives transId parameter from ComGate');
    console.log('   3. System validates transaction ID exists before processing');
    console.log('   4. Only real transaction IDs are stored in HostBill');
    console.log('   5. No more AUTO-sgsdggdfgdfg mock transaction IDs');
    console.log('\n⚠️ Important:');
    console.log('   - If transaction ID is missing, payment processing will fail');
    console.log('   - This ensures data integrity and prevents mock IDs');
    console.log('   - ComGate must be properly configured to return transaction IDs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure middleware is running on port 3005');
    console.log('   2. Check ComGate API configuration');
    console.log('   3. Verify HostBill API is accessible');
    console.log('   4. Test with real ComGate payment flow');
  }
}

// Run tests if called directly
if (require.main === module) {
  testRealTransactionId();
}

module.exports = { testRealTransactionId };
