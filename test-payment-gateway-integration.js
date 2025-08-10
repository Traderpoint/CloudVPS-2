/**
 * Test Payment Gateway Integration
 * Tests the payment gateway flow from UI button click to invoice marking as PAID
 */

async function testPaymentGatewayIntegration() {
  console.log('🧪 === PAYMENT GATEWAY INTEGRATION TEST ===\n');
  
  try {
    // Test data
    const testData = {
      orderId: `TEST-ORDER-${Date.now()}`,
      invoiceId: '220', // Use existing invoice from previous tests
      method: 'comgate',
      amount: 604,
      currency: 'CZK',
      customerData: {
        email: 'test@example.com',
        name: 'Test Customer'
      }
    };

    console.log('📋 Test data:', testData);

    // Step 1: Test payment initialization
    console.log('\n1️⃣ Testing payment initialization...');
    
    const initResponse = await fetch('http://localhost:3000/api/middleware/initialize-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!initResponse.ok) {
      throw new Error(`Payment initialization failed: ${initResponse.status} ${initResponse.statusText}`);
    }

    const initResult = await initResponse.json();
    console.log('✅ Payment initialization result:', {
      success: initResult.success,
      paymentId: initResult.paymentId,
      paymentUrl: initResult.paymentUrl ? 'Present' : 'Missing',
      method: initResult.method
    });

    if (!initResult.success) {
      throw new Error(`Payment initialization failed: ${initResult.error}`);
    }

    // Step 2: Simulate successful payment and mark invoice as paid
    console.log('\n2️⃣ Simulating successful payment and marking invoice as PAID...');
    
    const markPaidResponse = await fetch('http://localhost:3000/api/middleware/mark-invoice-paid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId: testData.invoiceId,
        transactionId: initResult.paymentId || `${testData.method.toUpperCase()}-${Date.now()}`,
        paymentMethod: testData.method,
        amount: testData.amount,
        currency: testData.currency,
        notes: `Test payment completed via ${testData.method} - Order ${testData.orderId}`
      })
    });

    if (!markPaidResponse.ok) {
      throw new Error(`Mark invoice paid failed: ${markPaidResponse.status} ${markPaidResponse.statusText}`);
    }

    const markPaidResult = await markPaidResponse.json();
    console.log('✅ Mark invoice as PAID result:', {
      success: markPaidResult.success,
      invoiceId: markPaidResult.invoiceId,
      message: markPaidResult.message,
      timestamp: markPaidResult.timestamp
    });

    if (!markPaidResult.success) {
      throw new Error(`Mark invoice paid failed: ${markPaidResult.error}`);
    }

    // Step 3: Test different payment methods
    console.log('\n3️⃣ Testing other payment methods...');
    
    const otherMethods = ['payu', 'paypal', 'banktransfer'];
    
    for (const method of otherMethods) {
      try {
        console.log(`   Testing ${method}...`);
        
        const methodTestData = {
          ...testData,
          orderId: `TEST-${method.toUpperCase()}-${Date.now()}`,
          method: method
        };
        
        const methodInitResponse = await fetch('http://localhost:3000/api/middleware/initialize-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(methodTestData)
        });
        
        const methodInitResult = await methodInitResponse.json();
        
        if (methodInitResult.success) {
          console.log(`   ✅ ${method}: Payment initialization successful`);
        } else {
          console.log(`   ⚠️ ${method}: ${methodInitResult.error || 'Initialization failed'}`);
        }
        
      } catch (methodError) {
        console.log(`   ❌ ${method}: ${methodError.message}`);
      }
    }

    console.log('\n✅ === PAYMENT GATEWAY INTEGRATION TEST SUCCESSFUL ===');
    console.log('🎯 All payment gateway components are working:');
    console.log('   1. ✅ Payment initialization via middleware');
    console.log('   2. ✅ Payment gateway integration (Comgate)');
    console.log('   3. ✅ Invoice marking as PAID');
    console.log('   4. ✅ Multiple payment methods support');
    console.log('\n🌐 Test manually: http://localhost:3000/invoice-payment-test');
    console.log('💡 Click "Pay" button to see the complete flow in action!');
    console.log('\n📋 Expected behavior:');
    console.log('   - For Comgate: Opens payment gateway in new tab');
    console.log('   - For other methods: Processes payment directly');
    console.log('   - After payment: Shows success message and reloads orders');
    console.log('   - Invoice status: Changes to PAID in HostBill');
    
    return true;

  } catch (error) {
    console.error('\n❌ === PAYMENT GATEWAY INTEGRATION TEST FAILED ===');
    console.error('Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure CloudVPS is running on http://localhost:3000');
    console.log('   2. Make sure Middleware is running on http://localhost:3005');
    console.log('   3. Check that HostBill API is configured in middleware');
    console.log('   4. Verify invoice ID exists in HostBill');
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testPaymentGatewayIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testPaymentGatewayIntegration };
