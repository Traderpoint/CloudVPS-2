/**
 * Test script for PayU payment flow
 * Tests the complete order creation and payment initialization process
 */

const axios = require('axios');

// Configuration
const CLOUDVPS_URL = 'http://localhost:3000';
const MIDDLEWARE_URL = 'http://localhost:3005';

// Test data
const testOrderData = {
  customer: {
    firstName: 'Jan',
    lastName: 'Novák',
    email: 'jan.novak@test.cz',
    phone: '+420123456789',
    address: 'Testovací 123',
    city: 'Praha',
    postalCode: '12000',
    country: 'CZ',
    company: 'Test s.r.o.'
  },
  items: [
    {
      productId: '1', // VPS Basic
      name: 'VPS Basic',
      price: '299',
      cycle: 'm',
      quantity: 1,
      configOptions: {
        os: 'ubuntu-20.04',
        ram: '2GB',
        cpu: '1 vCPU',
        storage: '20GB SSD',
        bandwidth: '1TB'
      }
    }
  ],
  addons: [],
  affiliate: null,
  payment: {
    method: 'payu',
    total: 299
  },
  total: 299
};

async function testPayUPayment() {
  console.log('🧪 Testing PayU payment flow...\n');

  try {
    // Step 1: Create order
    console.log('📦 Step 1: Creating order...');
    const orderResponse = await axios.post(`${CLOUDVPS_URL}/api/orders/create`, testOrderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!orderResponse.data.success) {
      throw new Error(`Order creation failed: ${orderResponse.data.error}`);
    }

    console.log('✅ Order created successfully');
    console.log('📋 Full order response:', JSON.stringify(orderResponse.data, null, 2));

    // Get first order for payment
    const firstOrder = orderResponse.data.orders?.[0];
    if (!firstOrder) {
      throw new Error('No orders found in response');
    }

    console.log('\n📄 First order:', JSON.stringify(firstOrder, null, 2));

    // Step 2: Initialize PayU payment
    console.log('\n💳 Step 2: Initializing PayU payment...');
    const paymentData = {
      orderId: firstOrder.hostbillOrderId || firstOrder.order_id,
      invoiceId: firstOrder.invoiceId || firstOrder.invoice_id,
      method: 'payu',
      amount: testOrderData.total,
      currency: 'CZK'
    };

    console.log('📤 Payment data:', paymentData);

    const paymentResponse = await axios.post(`${CLOUDVPS_URL}/api/payments/initialize`, paymentData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!paymentResponse.data.success) {
      throw new Error(`Payment initialization failed: ${paymentResponse.data.error}`);
    }

    console.log('✅ Payment initialized successfully');
    console.log('💰 Payment details:', {
      paymentId: paymentResponse.data.paymentId,
      method: paymentResponse.data.method,
      amount: paymentResponse.data.amount,
      currency: paymentResponse.data.currency,
      status: paymentResponse.data.status,
      redirectRequired: paymentResponse.data.redirectRequired,
      hasPaymentUrl: !!paymentResponse.data.paymentUrl,
      gateway: paymentResponse.data.gateway
    });

    if (paymentResponse.data.paymentUrl) {
      console.log('\n🔗 Payment URL:', paymentResponse.data.paymentUrl);
      console.log('\n🎯 Test completed successfully!');
      console.log('📝 Next steps:');
      console.log('   1. Open the payment URL in browser');
      console.log('   2. Complete the test payment');
      console.log('   3. Verify payment status in HostBill');
    } else {
      console.log('\n⚠️  No payment URL provided - check payment method configuration');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📄 Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Test middleware availability first
async function testMiddlewareHealth() {
  try {
    console.log('🔍 Checking middleware health...');
    const response = await axios.get(`${MIDDLEWARE_URL}/api/health`, { timeout: 5000 });
    console.log('✅ Middleware is running');
    return true;
  } catch (error) {
    console.log('⚠️  Middleware not available, will use fallback');
    return false;
  }
}

// Test CloudVPS availability
async function testCloudVPSHealth() {
  try {
    console.log('🔍 Checking CloudVPS health...');
    const response = await axios.get(`${CLOUDVPS_URL}/api/health`, { timeout: 5000 });
    console.log('✅ CloudVPS is running');
    return true;
  } catch (error) {
    console.error('❌ CloudVPS not available');
    throw new Error('CloudVPS application is not running on port 3000');
  }
}

// Main execution
async function main() {
  console.log('🚀 PayU Payment Test Suite');
  console.log('==========================\n');

  // Check services
  await testCloudVPSHealth();
  await testMiddlewareHealth();
  
  console.log('\n🧪 Starting payment test...\n');
  
  // Run the test
  await testPayUPayment();
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testPayUPayment, testMiddlewareHealth, testCloudVPSHealth };
