// Test script for full order + payment flow
// Using built-in fetch (Node.js 18+)

const cloudVpsUrl = 'http://localhost:3000';

async function testFullFlow() {
  console.log('🧪 Testing full order + payment flow...');

  // Step 1: Create order
  const orderData = {
    customer: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com',
      phone: '+420123456789',
      address: 'Test Address 123',
      city: 'Prague',
      postalCode: '12000',
      country: 'CZ',
      company: ''
    },
    items: [
      {
        productId: '1',
        name: 'VPS Basic',
        price: 1200,
        cycle: 'm',
        quantity: 1,
        configOptions: {
          cpu: '2 vCPU',
          ram: '4GB',
          storage: '50GB',
          os: 'linux'
        }
      },
      {
        productId: '2', 
        name: 'VPS Pro',
        price: 1190,
        cycle: 'm',
        quantity: 1,
        configOptions: {
          cpu: '4 vCPU',
          ram: '8GB',
          storage: '100GB',
          os: 'linux'
        }
      }
    ],
    paymentMethod: 'comgate',
    cartTotal: 2390,
    total: 2390,
    type: 'complete'
  };

  try {
    console.log('📤 Step 1: Creating order...');
    
    const orderResponse = await fetch(`${cloudVpsUrl}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const orderResult = await orderResponse.json();
    console.log('📥 Order result:', JSON.stringify(orderResult, null, 2));

    if (!orderResult.success) {
      throw new Error(`Order creation failed: ${orderResult.error}`);
    }

    // Step 2: Extract payment data from order result
    const firstOrder = orderResult.orders?.[0];
    if (!firstOrder) {
      throw new Error('No orders found in result');
    }

    console.log('📦 First order:', firstOrder);

    // Step 3: Initialize payment with extracted data
    const paymentData = {
      orderId: firstOrder.hostbillOrderId || firstOrder.orderId || firstOrder.order_id || 'unknown',
      invoiceId: firstOrder.invoiceId || firstOrder.invoice_id || 'unknown',
      method: 'comgate',
      amount: firstOrder.totalAmount || firstOrder.total || firstOrder.price || 2390,
      currency: 'CZK',
      testFlow: false,
      returnUrl: `${cloudVpsUrl}/payment-success`,
      cancelUrl: `${cloudVpsUrl}/payment-failed`,
      pendingUrl: `${cloudVpsUrl}/payment-success?status=pending`,
      customerData: {
        email: orderData.customer.email,
        name: `${orderData.customer.firstName} ${orderData.customer.lastName}`
      }
    };

    console.log('💰 Payment data:', paymentData);

    console.log('📤 Step 2: Initializing payment...');
    
    const paymentResponse = await fetch(`${cloudVpsUrl}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    const paymentResult = await paymentResponse.json();
    console.log('📥 Payment result:', JSON.stringify(paymentResult, null, 2));

    if (paymentResult.success) {
      console.log('✅ FULL FLOW SUCCESS!');
      console.log(`🎯 Order ID: ${paymentData.orderId}`);
      console.log(`📄 Invoice ID: ${paymentData.invoiceId}`);
      console.log(`💰 Amount: ${paymentData.amount} CZK`);
      console.log(`🔗 Payment URL: ${paymentResult.paymentUrl}`);
    } else {
      console.log('❌ Payment initialization failed:', paymentResult.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run test
testFullFlow();
