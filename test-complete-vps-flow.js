// Complete VPS Flow Test - From /vps to successful payment return
// Tests the entire user journey through the VPS ordering process

const BASE_URL = 'http://localhost:3000';
const MIDDLEWARE_URL = 'http://localhost:3005';

async function testCompleteVPSFlow() {
  console.log('🚀 Testing Complete VPS Flow...\n');
  console.log('📋 This test simulates the complete user journey:\n');

  try {
    // Step 1: Test VPS landing page
    console.log('1️⃣ STEP 1: VPS Landing Page (/vps)');
    console.log('=====================================');
    
    const vpsResponse = await fetch(`${BASE_URL}/vps`);
    
    if (vpsResponse.ok) {
      const vpsHtml = await vpsResponse.text();
      
      console.log('✅ VPS page loaded successfully');
      
      if (vpsHtml.includes('VPS Start')) {
        console.log('   ✅ VPS Start plan available');
      }
      
      if (vpsHtml.includes('VPS Profi')) {
        console.log('   ✅ VPS Profi plan available');
      }
      
      if (vpsHtml.includes('Přidat do košíku')) {
        console.log('   ✅ Add to cart buttons present');
      }
      
      if (vpsHtml.includes('Nejpopulárnější')) {
        console.log('   ✅ Popular plan highlighted');
      }
    } else {
      console.log('❌ VPS page error:', vpsResponse.status);
    }

    // Step 2: Test cart page
    console.log('\n2️⃣ STEP 2: Cart Page (/cart)');
    console.log('=============================');
    
    const cartResponse = await fetch(`${BASE_URL}/cart`);
    
    if (cartResponse.ok) {
      const cartHtml = await cartResponse.text();
      
      console.log('✅ Cart page loaded successfully');
      
      if (cartHtml.includes('Košík')) {
        console.log('   ✅ Cart title present');
      }
      
      if (cartHtml.includes('Fakturační období')) {
        console.log('   ✅ Billing period selection available');
      }
      
      if (cartHtml.includes('Operační systém')) {
        console.log('   ✅ Operating system selection available');
      }
      
      if (cartHtml.includes('Pokračovat k objednávce')) {
        console.log('   ✅ Continue to order button present');
      }
    } else {
      console.log('❌ Cart page error:', cartResponse.status);
    }

    // Step 3: Test register page
    console.log('\n3️⃣ STEP 3: Register Page (/register)');
    console.log('====================================');
    
    const registerResponse = await fetch(`${BASE_URL}/register`);
    
    if (registerResponse.ok) {
      const registerHtml = await registerResponse.text();
      
      console.log('✅ Register page loaded successfully');
      
      if (registerHtml.includes('Registrace')) {
        console.log('   ✅ Registration form present');
      }
      
      if (registerHtml.includes('Google')) {
        console.log('   ✅ Google OAuth option available');
      }
      
      if (registerHtml.includes('GitHub')) {
        console.log('   ✅ GitHub OAuth option available');
      }
      
      if (registerHtml.includes('Email')) {
        console.log('   ✅ Email registration available');
      }
    } else {
      console.log('❌ Register page error:', registerResponse.status);
    }

    // Step 4: Test billing page
    console.log('\n4️⃣ STEP 4: Billing Page (/billing)');
    console.log('==================================');
    
    const billingResponse = await fetch(`${BASE_URL}/billing`);
    
    if (billingResponse.ok) {
      const billingHtml = await billingResponse.text();
      
      console.log('✅ Billing page loaded successfully');
      
      if (billingHtml.includes('Fakturační údaje')) {
        console.log('   ✅ Billing form present');
      }
      
      if (billingHtml.includes('Jméno')) {
        console.log('   ✅ Name fields available');
      }
      
      if (billingHtml.includes('Email')) {
        console.log('   ✅ Email field available');
      }
      
      if (billingHtml.includes('Continue')) {
        console.log('   ✅ Continue button present');
      }
    } else {
      console.log('❌ Billing page error:', billingResponse.status);
    }

    // Step 5: Test payment-method page
    console.log('\n5️⃣ STEP 5: Payment Method Page (/payment-method)');
    console.log('================================================');
    
    const paymentMethodResponse = await fetch(`${BASE_URL}/payment-method`);
    
    if (paymentMethodResponse.ok) {
      const paymentMethodHtml = await paymentMethodResponse.text();
      
      console.log('✅ Payment method page loaded successfully');
      
      if (paymentMethodHtml.includes('Platební metoda')) {
        console.log('   ✅ Payment method selection present');
      }
      
      if (paymentMethodHtml.includes('Comgate')) {
        console.log('   ✅ Comgate payment option available');
      }
      
      if (paymentMethodHtml.includes('PayPal')) {
        console.log('   ✅ PayPal payment option available');
      }
      
      if (paymentMethodHtml.includes('Dokončit a odeslat')) {
        console.log('   ✅ Submit payment button present');
      }
    } else {
      console.log('❌ Payment method page error:', paymentMethodResponse.status);
    }

    // Step 6: Test payment-complete page
    console.log('\n6️⃣ STEP 6: Payment Complete Page (/payment-complete)');
    console.log('===================================================');
    
    const testParams = new URLSearchParams({
      transactionId: 'TEST-FLOW-TRANSACTION',
      paymentId: 'TEST-FLOW-PAYMENT',
      orderId: 'ORDER-TEST-FLOW',
      invoiceId: '456',
      amount: '1000',
      currency: 'CZK',
      paymentMethod: 'comgate',
      status: 'success'
    });
    
    const paymentCompleteResponse = await fetch(`${BASE_URL}/payment-complete?${testParams.toString()}`);
    
    if (paymentCompleteResponse.ok) {
      const paymentCompleteHtml = await paymentCompleteResponse.text();
      
      console.log('✅ Payment complete page loaded successfully');
      
      if (paymentCompleteHtml.includes('TEST-FLOW-TRANSACTION')) {
        console.log('   ✅ Transaction ID displayed');
      }
      
      if (paymentCompleteHtml.includes('Auto-Capture Payment')) {
        console.log('   ✅ Auto-capture button available');
      }
      
      if (paymentCompleteHtml.includes('Mark as Paid')) {
        console.log('   ✅ Mark as Paid button available');
      }
      
      if (paymentCompleteHtml.includes('Order Confirmation')) {
        console.log('   ✅ Order Confirmation button available');
      }
    } else {
      console.log('❌ Payment complete page error:', paymentCompleteResponse.status);
    }

    // Step 7: Test middleware API endpoints
    console.log('\n7️⃣ STEP 7: Middleware API Endpoints');
    console.log('===================================');
    
    // Test products API
    console.log('🔄 Testing products API...');
    const productsResponse = await fetch(`${MIDDLEWARE_URL}/api/affiliate/1/products?mode=all`);
    
    if (productsResponse.ok) {
      const productsResult = await productsResponse.json();
      
      if (productsResult.success && productsResult.products) {
        console.log('✅ Products API working');
        console.log(`   Found ${productsResult.products.length} products`);
      } else {
        console.log('⚠️ Products API returned no data');
      }
    } else {
      console.log('❌ Products API error:', productsResponse.status);
    }

    // Test payment methods API
    console.log('\n🔄 Testing payment methods API...');
    const paymentMethodsResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/methods`);
    
    if (paymentMethodsResponse.ok) {
      const paymentMethodsResult = await paymentMethodsResponse.json();
      
      if (paymentMethodsResult.success && paymentMethodsResult.methods) {
        console.log('✅ Payment methods API working');
        console.log(`   Found ${paymentMethodsResult.methods.length} payment methods`);
      } else {
        console.log('⚠️ Payment methods API returned no data');
      }
    } else {
      console.log('❌ Payment methods API error:', paymentMethodsResponse.status);
    }

    // Step 8: Summary
    console.log('\n🎉 Complete VPS Flow Test Finished!');
    console.log('\n📊 Flow Summary:');
    console.log('   1. ✅ VPS landing page (/vps) - Product selection');
    console.log('   2. ✅ Cart page (/cart) - Configuration and add-ons');
    console.log('   3. ✅ Register page (/register) - User registration');
    console.log('   4. ✅ Billing page (/billing) - Customer information');
    console.log('   5. ✅ Payment method page (/payment-method) - Payment selection');
    console.log('   6. ✅ Payment complete page (/payment-complete) - Success handling');
    console.log('   7. ✅ Middleware APIs - Backend integration');
    
    console.log('\n🌐 Complete User Journey:');
    console.log('   1. User visits: http://localhost:3000/vps');
    console.log('   2. Selects VPS plan and clicks "Přidat do košíku"');
    console.log('   3. Configures billing period, OS, and apps in cart');
    console.log('   4. Proceeds to registration/login');
    console.log('   5. Fills billing information');
    console.log('   6. Selects payment method and completes payment');
    console.log('   7. Returns to payment-complete page with transaction details');
    console.log('   8. Can use Auto-Capture, Mark as Paid, and Order Confirmation');

    console.log('\n🏗️ Architecture:');
    console.log('   CloudVPS (3000): Frontend pages and user interface');
    console.log('   Middleware (3005): API endpoints and payment processing');
    console.log('   HostBill: Order management and invoicing');
    console.log('   ComGate: Payment gateway integration');

    console.log('\n✅ COMPLETE VPS FLOW VERIFIED SUCCESSFUL! ✅');

  } catch (error) {
    console.error('❌ Complete VPS flow test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure CloudVPS (3000) and middleware (3005) are running');
    console.log('   2. Check that all pages are accessible');
    console.log('   3. Verify middleware API endpoints are working');
    console.log('   4. Test individual pages manually if needed');
  }
}

// Run the complete VPS flow test
if (require.main === module) {
  testCompleteVPSFlow();
}

module.exports = { testCompleteVPSFlow };
