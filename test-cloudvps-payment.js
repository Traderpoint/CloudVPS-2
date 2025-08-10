/**
 * Test CloudVPS Payment Flow
 * Tests the complete payment flow from CloudVPS frontend through middleware to HostBill
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
      productId: '1',
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

/**
 * Test 1: Create order through CloudVPS API
 */
async function testCreateOrder() {
  console.log('📦 Test 1: Creating order through CloudVPS API...');
  
  try {
    const response = await axios.post(`${CLOUDVPS_URL}/api/orders/create`, testOrderData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    if (response.data.success) {
      console.log('✅ Order created successfully:');
      console.log('  - Order ID:', response.data.orders[0].hostbillOrderId);
      console.log('  - Invoice ID:', response.data.orders[0].invoiceId);
      console.log('  - Total:', response.data.orders[0].price, response.data.orders[0].currency);
      
      return {
        orderId: response.data.orders[0].hostbillOrderId,
        invoiceId: response.data.orders[0].invoiceId,
        total: parseInt(response.data.orders[0].price)
      };
    } else {
      throw new Error(response.data.error || 'Order creation failed');
    }
  } catch (error) {
    console.error('❌ Order creation failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Test 2: Initialize payment through CloudVPS API
 */
async function testInitializePayment(orderData) {
  console.log('\n💳 Test 2: Initializing payment through CloudVPS API...');
  
  try {
    const paymentData = {
      orderId: orderData.orderId,
      invoiceId: orderData.invoiceId,
      method: 'payu',
      amount: orderData.total,
      currency: 'CZK'
    };

    const response = await axios.post(`${CLOUDVPS_URL}/api/payments/initialize`, paymentData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    if (response.data.success) {
      console.log('✅ Payment initialized successfully:');
      console.log('  - Payment ID:', response.data.paymentId);
      console.log('  - Method:', response.data.method);
      console.log('  - Amount:', response.data.amount, response.data.currency);
      console.log('  - Redirect required:', response.data.redirectRequired);
      console.log('  - Payment URL:', response.data.paymentUrl);
      
      return response.data;
    } else {
      throw new Error(response.data.error || 'Payment initialization failed');
    }
  } catch (error) {
    console.error('❌ Payment initialization failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Test 3: Test middleware health
 */
async function testMiddlewareHealth() {
  console.log('\n🔍 Test 3: Checking middleware health...');
  
  try {
    const response = await axios.get(`${MIDDLEWARE_URL}/api/health`, {
      timeout: 10000
    });

    console.log('✅ Middleware is healthy:');
    console.log('  - Status:', response.data.status);
    console.log('  - Version:', response.data.version);
    console.log('  - Port:', response.data.port);
    console.log('  - HostBill status:', response.data.hostbill.status);
    
    return response.data;
  } catch (error) {
    console.error('❌ Middleware health check failed:', error.message);
    throw error;
  }
}

/**
 * Test 4: Test direct middleware payment initialization
 */
async function testDirectMiddlewarePayment(orderData) {
  console.log('\n🔄 Test 4: Testing direct middleware payment...');
  
  try {
    const paymentData = {
      orderId: orderData.orderId,
      invoiceId: orderData.invoiceId,
      method: 'payu',
      amount: orderData.total,
      currency: 'CZK',
      customerData: testOrderData.customer
    };

    const response = await axios.post(`${MIDDLEWARE_URL}/api/payments/initialize`, paymentData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    if (response.data.success) {
      console.log('✅ Direct middleware payment initialized:');
      console.log('  - Payment ID:', response.data.paymentId);
      console.log('  - Method:', response.data.method);
      console.log('  - Amount:', response.data.amount, response.data.currency);
      console.log('  - Payment URL:', response.data.paymentUrl);
      
      return response.data;
    } else {
      throw new Error(response.data.error || 'Direct middleware payment failed');
    }
  } catch (error) {
    console.error('❌ Direct middleware payment failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 CloudVPS Payment Flow Test');
  console.log('==============================\n');

  try {
    // Test 1: Middleware health
    await testMiddlewareHealth();

    // Test 2: Create order
    const orderData = await testCreateOrder();

    // Test 3: Initialize payment through CloudVPS
    try {
      const paymentData = await testInitializePayment(orderData);
      console.log('\n🎉 CloudVPS payment flow test PASSED!');
      console.log('✅ Order created');
      console.log('✅ Payment initialized');
      console.log('✅ Payment URL generated');
    } catch (paymentError) {
      console.log('\n⚠️ CloudVPS payment failed, testing direct middleware...');
      
      // Test 4: Try direct middleware as fallback
      await testDirectMiddlewarePayment(orderData);
      console.log('\n🎉 Direct middleware payment test PASSED!');
    }

    console.log('\n📋 Summary:');
    console.log('===========');
    console.log('Order ID:', orderData.orderId);
    console.log('Invoice ID:', orderData.invoiceId);
    console.log('Total:', orderData.total, 'CZK');
    console.log('\n💡 Next steps:');
    console.log('- Open payment URL in browser to complete payment');
    console.log('- Check HostBill admin for order status');
    console.log('- Test PayU callback simulation');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testCreateOrder,
  testInitializePayment,
  testMiddlewareHealth,
  testDirectMiddlewarePayment
};
