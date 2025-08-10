// Test to compare Real Flow vs Test Flow
// Identifies differences between test payment flow and real user flow

const BASE_URL = 'http://localhost:3000';
const MIDDLEWARE_URL = 'http://localhost:3005';

async function compareRealVsTestFlow() {
  console.log('🔍 Comparing Real Flow vs Test Flow...\n');

  try {
    // Step 1: Test payment-method page directly (simulating real user flow)
    console.log('1️⃣ STEP 1: Test payment-method page (Real User Flow)');
    console.log('=========================================================');
    
    const paymentMethodResponse = await fetch(`${BASE_URL}/payment-method`);
    
    if (paymentMethodResponse.ok) {
      const paymentMethodHtml = await paymentMethodResponse.text();
      
      console.log('✅ Payment-method page loaded');
      
      // Check if RealPaymentProcessor is imported
      if (paymentMethodHtml.includes('RealPaymentProcessor')) {
        console.log('   ✅ RealPaymentProcessor import detected in HTML');
      } else {
        console.log('   ❌ RealPaymentProcessor import NOT detected in HTML');
      }
      
      // Check if old PaymentProcessor is used
      if (paymentMethodHtml.includes('PaymentProcessor')) {
        console.log('   ⚠️ PaymentProcessor component detected (could be old system)');
      }
      
      // Check for API endpoints
      if (paymentMethodHtml.includes('/api/payments/initialize')) {
        console.log('   ⚠️ Old /api/payments/initialize endpoint detected');
      }
      
      if (paymentMethodHtml.includes('/api/middleware/initialize-payment')) {
        console.log('   ✅ New /api/middleware/initialize-payment endpoint detected');
      }
      
      // Check for handleSubmitPayment function
      if (paymentMethodHtml.includes('handleSubmitPayment')) {
        console.log('   ✅ handleSubmitPayment function detected');
      }
    } else {
      console.log('❌ Payment-method page error:', paymentMethodResponse.status);
    }

    // Step 2: Test order creation flow (billing → payment-method)
    console.log('\n2️⃣ STEP 2: Test order creation flow');
    console.log('===================================');
    
    const testOrderData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+420123456789',
      address: 'Test Street 123',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ',
      items: [
        {
          id: 'vps-start',
          name: 'VPS Start',
          price: 604,
          quantity: 1,
          billingPeriod: 12
        }
      ]
    };

    console.log('🔄 Creating test order...');
    
    const orderResponse = await fetch(`${MIDDLEWARE_URL}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData)
    });

    if (orderResponse.ok) {
      const orderResult = await orderResponse.json();
      
      if (orderResult.success) {
        console.log('✅ Order created successfully');
        console.log('   Order ID:', orderResult.orders?.[0]?.order_id);
        console.log('   Invoice ID:', orderResult.orders?.[0]?.invoice_id);
        
        // Step 3: Test payment initialization with RealPaymentProcessor
        console.log('\n3️⃣ STEP 3: Test RealPaymentProcessor initialization');
        console.log('==================================================');
        
        const firstOrder = orderResult.orders[0];
        const realPaymentData = {
          orderId: firstOrder.order_id,
          invoiceId: firstOrder.invoice_id,
          amount: firstOrder.price || 604,
          currency: 'CZK',
          paymentMethod: 'comgate',
          billingData: testOrderData,
          items: testOrderData.items
        };

        console.log('🔄 Testing RealPaymentProcessor API...');
        
        const realPaymentResponse = await fetch(`${BASE_URL}/api/middleware/initialize-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(realPaymentData)
        });

        if (realPaymentResponse.ok) {
          const realPaymentResult = await realPaymentResponse.json();
          
          if (realPaymentResult.success) {
            console.log('✅ RealPaymentProcessor API working');
            console.log('   Transaction ID:', realPaymentResult.transactionId);
            console.log('   Payment URL:', realPaymentResult.paymentUrl?.substring(0, 50) + '...');
            console.log('   Uses RealPaymentProcessor: ✅');
          } else {
            console.log('❌ RealPaymentProcessor API failed:', realPaymentResult.error);
          }
        } else {
          console.log('❌ RealPaymentProcessor API error:', realPaymentResponse.status);
        }

        // Step 4: Test old payment initialization
        console.log('\n4️⃣ STEP 4: Test old payment initialization');
        console.log('==========================================');
        
        const oldPaymentData = {
          orderId: firstOrder.order_id,
          invoiceId: firstOrder.invoice_id,
          method: 'comgate',
          amount: firstOrder.price || 604,
          currency: 'CZK'
        };

        console.log('🔄 Testing old /api/payments/initialize...');
        
        const oldPaymentResponse = await fetch(`${BASE_URL}/api/payments/initialize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(oldPaymentData)
        });

        if (oldPaymentResponse.ok) {
          const oldPaymentResult = await oldPaymentResponse.json();
          
          if (oldPaymentResult.success) {
            console.log('⚠️ Old payment API still working');
            console.log('   Transaction ID:', oldPaymentResult.transactionId);
            console.log('   Payment URL:', oldPaymentResult.paymentUrl?.substring(0, 50) + '...');
            console.log('   Uses old system: ⚠️');
          } else {
            console.log('❌ Old payment API failed:', oldPaymentResult.error);
          }
        } else {
          console.log('❌ Old payment API error:', oldPaymentResponse.status);
        }

      } else {
        console.log('❌ Order creation failed:', orderResult.error);
      }
    } else {
      console.log('❌ Order creation error:', orderResponse.status);
    }

    // Step 5: Check which system is actually used in payment-method.js
    console.log('\n5️⃣ STEP 5: Analyze payment-method.js source code');
    console.log('================================================');
    
    try {
      const fs = require('fs');
      const paymentMethodSource = fs.readFileSync('pages/payment-method.js', 'utf8');
      
      console.log('📄 Analyzing payment-method.js source...');
      
      if (paymentMethodSource.includes('import RealPaymentProcessor')) {
        console.log('   ✅ RealPaymentProcessor imported');
      } else {
        console.log('   ❌ RealPaymentProcessor NOT imported');
      }
      
      if (paymentMethodSource.includes('import PaymentProcessor')) {
        console.log('   ⚠️ Old PaymentProcessor imported');
      }
      
      if (paymentMethodSource.includes('paymentProcessor.initializePayment')) {
        console.log('   ✅ RealPaymentProcessor.initializePayment() used');
      } else {
        console.log('   ❌ RealPaymentProcessor.initializePayment() NOT used');
      }
      
      if (paymentMethodSource.includes('/api/payments/initialize')) {
        console.log('   ⚠️ Old /api/payments/initialize endpoint used');
      }
      
      if (paymentMethodSource.includes('/api/middleware/initialize-payment')) {
        console.log('   ✅ New /api/middleware/initialize-payment endpoint used');
      }
      
      // Check for handleSubmitPayment function
      const handleSubmitMatch = paymentMethodSource.match(/const handleSubmitPayment = async \(\) => \{([\s\S]*?)\};/);
      if (handleSubmitMatch) {
        console.log('   ✅ handleSubmitPayment function found');
        const functionBody = handleSubmitMatch[1];
        
        if (functionBody.includes('RealPaymentProcessor')) {
          console.log('   ✅ handleSubmitPayment uses RealPaymentProcessor');
        } else {
          console.log('   ❌ handleSubmitPayment does NOT use RealPaymentProcessor');
        }
        
        if (functionBody.includes('fetch(\'/api/payments/initialize\'')) {
          console.log('   ⚠️ handleSubmitPayment uses old API endpoint');
        }
      } else {
        console.log('   ❌ handleSubmitPayment function NOT found');
      }
      
    } catch (error) {
      console.log('❌ Could not analyze source code:', error.message);
    }

    // Step 6: Summary and recommendations
    console.log('\n🎯 SUMMARY AND ANALYSIS');
    console.log('========================');
    
    console.log('\n📊 Flow Comparison:');
    console.log('   Test Flow: Uses RealPaymentProcessor → /api/middleware/initialize-payment');
    console.log('   Real Flow: Should use same system, but may have issues');
    
    console.log('\n🔍 Potential Issues:');
    console.log('   1. Check if payment-method.js actually uses RealPaymentProcessor');
    console.log('   2. Verify that handleSubmitPayment function is correctly implemented');
    console.log('   3. Ensure no fallback to old /api/payments/initialize endpoint');
    console.log('   4. Check if there are multiple payment pages or components');
    
    console.log('\n🛠️ Debugging Steps:');
    console.log('   1. Open browser dev tools on payment-method page');
    console.log('   2. Check console logs during payment submission');
    console.log('   3. Verify which API endpoint is actually called');
    console.log('   4. Check if transaction ID is real or mock');
    
    console.log('\n✅ COMPARISON COMPLETE!');

  } catch (error) {
    console.error('❌ Flow comparison failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure CloudVPS (3000) and middleware (3005) are running');
    console.log('   2. Check that all API endpoints are accessible');
    console.log('   3. Verify payment-method.js source code manually');
  }
}

// Run the comparison
if (require.main === module) {
  compareRealVsTestFlow();
}

module.exports = { compareRealVsTestFlow };
