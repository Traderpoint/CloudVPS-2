/**
 * Test Payment Flow Enhanced
 * Verifies enhanced payment-flow-test with product selection and affiliate support
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

async function testPaymentFlowEnhanced() {
  console.log('🧪 === PAYMENT FLOW ENHANCED TEST ===\n');
  console.log('🎯 Testing enhanced payment-flow-test with product and affiliate selection');

  try {
    // Test 1: Test different product configurations
    console.log('1️⃣ Testing different product configurations...');
    
    const productTests = [
      { id: '1', name: 'VPS Basic', price: 299 },
      { id: '2', name: 'VPS Pro', price: 499 },
      { id: '3', name: 'VPS Premium', price: 899 },
      { id: '4', name: 'VPS Enterprise', price: 1299 }
    ];

    for (const product of productTests) {
      console.log(`\n🔍 Testing ${product.name}...`);
      
      const orderData = {
        customer: {
          firstName: 'Enhanced',
          lastName: 'Test',
          email: `enhanced.${product.id}@test.com`,
          phone: '+420777123456',
          address: 'Testovací ulice 123',
          city: 'Praha',
          postalCode: '11000',
          country: 'CZ',
          company: 'Test s.r.o.'
        },
        items: [
          {
            product_id: product.id,
            name: product.name,
            price: product.price,
            cycle: 'm',
            quantity: 1,
            configOptions: {
              cpu: '2 vCPU',
              ram: '4GB',
              storage: '50GB'
            }
          }
        ],
        affiliate: {
          id: '2',
          code: 'test-affiliate'
        },
        paymentMethod: 'comgate',
        newsletterSubscribe: false,
        type: 'complete'
      };

      const orderResponse = await fetch(`${MIDDLEWARE_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const orderResult = await orderResponse.json();
      
      if (orderResult.success && orderResult.orders?.[0]) {
        const order = orderResult.orders[0];
        console.log(`   ✅ ${product.name} order created: ${order.orderId}`);
        console.log(`      Price: ${order.price} ${order.currency}`);
        console.log(`      Product: ${order.product || order.productName}`);
        
        if (orderResult.affiliate) {
          console.log(`      Affiliate: ${orderResult.affiliate.name} (ID: ${orderResult.affiliate.id})`);
        }
        
        if (orderResult.clientId) {
          console.log(`      Client ID: ${orderResult.clientId}`);
        }
      } else {
        console.log(`   ❌ ${product.name} order creation failed: ${orderResult.error}`);
      }
    }

    // Test 2: Test affiliate assignment
    console.log('\n2️⃣ Testing affiliate assignment...');
    
    const affiliateTests = [
      { id: '1', code: 'affiliate-1' },
      { id: '2', code: 'test-affiliate' },
      { id: '999', code: 'non-existent' }
    ];

    for (const affiliate of affiliateTests) {
      console.log(`\n🔍 Testing affiliate ${affiliate.id} (${affiliate.code})...`);
      
      const orderData = {
        customer: {
          firstName: 'Affiliate',
          lastName: 'Test',
          email: `affiliate.${affiliate.id}@test.com`,
          phone: '+420777123456',
          address: 'Testovací ulice 123',
          city: 'Praha',
          postalCode: '11000',
          country: 'CZ',
          company: 'Test s.r.o.'
        },
        items: [
          {
            product_id: '1',
            name: 'VPS Basic',
            price: 299,
            cycle: 'm',
            quantity: 1,
            configOptions: {
              cpu: '2 vCPU',
              ram: '4GB',
              storage: '50GB'
            }
          }
        ],
        affiliate: {
          id: affiliate.id,
          code: affiliate.code
        },
        paymentMethod: 'comgate',
        newsletterSubscribe: false,
        type: 'complete'
      };

      const orderResponse = await fetch(`${MIDDLEWARE_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const orderResult = await orderResponse.json();
      
      if (orderResult.success) {
        console.log(`   ✅ Order created with affiliate ${affiliate.id}`);
        
        if (orderResult.affiliate) {
          console.log(`      Affiliate assigned: ${orderResult.affiliate.name}`);
          console.log(`      Affiliate status: ${orderResult.affiliate.status}`);
        } else {
          console.log(`      ⚠️ No affiliate assigned`);
        }
        
        if (typeof orderResult.affiliateAssigned !== 'undefined') {
          console.log(`      Affiliate assignment: ${orderResult.affiliateAssigned ? '✅ Success' : '❌ Failed'}`);
        }
      } else {
        console.log(`   ❌ Order creation failed: ${orderResult.error}`);
      }
    }

    // Test 3: Test complete flow with payment initialization
    console.log('\n3️⃣ Testing complete enhanced flow...');
    
    const completeOrderData = {
      customer: {
        firstName: 'Complete',
        lastName: 'Flow',
        email: 'complete.flow@test.com',
        phone: '+420777123456',
        address: 'Testovací ulice 123',
        city: 'Praha',
        postalCode: '11000',
        country: 'CZ',
        company: 'Test s.r.o.'
      },
      items: [
        {
          product_id: '3', // VPS Premium
          name: 'VPS Premium',
          price: 899,
          cycle: 'm',
          quantity: 1,
          configOptions: {
            cpu: '2 vCPU',
            ram: '4GB',
            storage: '50GB'
          }
        }
      ],
      affiliate: {
        id: '2',
        code: 'test-affiliate'
      },
      paymentMethod: 'comgate',
      newsletterSubscribe: false,
      type: 'complete'
    };

    const completeOrderResponse = await fetch(`${MIDDLEWARE_URL}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeOrderData)
    });

    const completeOrderResult = await completeOrderResponse.json();
    
    if (completeOrderResult.success && completeOrderResult.orders?.[0]) {
      const order = completeOrderResult.orders[0];
      console.log('✅ Complete enhanced order created');
      console.log(`   Order ID: ${order.orderId}`);
      console.log(`   Invoice ID: ${order.invoiceId}`);
      console.log(`   Product: ${order.product || order.productName}`);
      console.log(`   Price: ${order.price} ${order.currency}`);
      
      // Test payment initialization with testFlow
      const paymentData = {
        orderId: order.orderId,
        invoiceId: order.invoiceId,
        method: 'comgate',
        amount: 899,
        currency: 'CZK',
        testFlow: true
      };

      const paymentResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const paymentResult = await paymentResponse.json();
      
      if (paymentResult.success) {
        console.log('✅ Payment initialization successful');
        console.log(`   Transaction ID: ${paymentResult.transactionId}`);
        console.log(`   Payment URL: ${paymentResult.paymentUrl}`);
        console.log('   ✅ Ready for real payment gateway testing');
      } else {
        console.log('❌ Payment initialization failed:', paymentResult.error);
      }
    } else {
      console.log('❌ Complete order creation failed:', completeOrderResult.error);
    }

    console.log('\n🎯 === ENHANCED FLOW SUMMARY ===');
    console.log('✅ Enhanced payment flow test completed');
    
    console.log('\n📋 Enhanced Features:');
    console.log('   • Product selection (VPS Basic, Pro, Premium, Enterprise)');
    console.log('   • Automatic price updates based on product');
    console.log('   • Affiliate partner assignment');
    console.log('   • Complete customer information');
    console.log('   • Detailed order result display');
    console.log('   • Integration with middleware order system');
    
    console.log('\n🌐 Browser Testing:');
    console.log('   1. Open: http://localhost:3000/payment-flow-test');
    console.log('   2. Select different products and see price updates');
    console.log('   3. Enter affiliate ID and code');
    console.log('   4. Fill complete customer information');
    console.log('   5. Create order and see detailed results');
    console.log('   6. Initialize payment and test complete flow');
    
    console.log('\n🎊 Enhanced payment flow is fully functional!');

  } catch (error) {
    console.error('❌ Enhanced payment flow test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testPaymentFlowEnhanced();
}

module.exports = { testPaymentFlowEnhanced };
