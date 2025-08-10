// Test script that simulates frontend payment-method.js logic
// Using built-in fetch (Node.js 18+)

const cloudVpsUrl = 'http://localhost:3000';

async function testFrontendLogic() {
  console.log('🧪 Testing frontend payment logic...');

  // Simulate order data that would be in sessionStorage
  const orderData = {
    success: true,
    orders: [
      {
        type: 'combined_invoice',
        invoiceId: '402',
        clientId: '107',
        items: [
          {
            cloudVpsProductId: '1',
            hostbillProductId: '5',
            productName: 'VPS Basic',
            quantity: 1,
            price: 1200
          },
          {
            cloudVpsProductId: '2',
            hostbillProductId: '10',
            productName: 'VPS Pro',
            quantity: 1,
            price: 1190
          }
        ],
        totalAmount: 2390,
        currency: 'CZK',
        status: 'created'
      }
    ]
  };

  const selectedPayment = 'comgate';

  try {
    console.log('📋 OrderData:', orderData);

    // Step 2: Initialize payment according to real-payment-flow-test
    const firstOrder = orderData.orders?.[0];
    console.log('📦 First order data:', firstOrder);
    
    if (!firstOrder) {
      throw new Error('Chybí údaje objednávky');
    }

    // Extract payment data with fallbacks (SAME LOGIC AS FRONTEND)
    const invoiceId = firstOrder.invoiceId || firstOrder.invoice_id || 'unknown';
    const orderId = firstOrder.hostbillOrderId || firstOrder.orderId || firstOrder.order_id || invoiceId; // Use invoiceId as fallback for combined invoices
    const amount = firstOrder.totalAmount || firstOrder.total || firstOrder.price || 0;

    console.log('💰 Payment data extracted:', {
      orderId,
      invoiceId,
      amount,
      method: selectedPayment
    });

    // Validate required fields
    if (!invoiceId || invoiceId === 'unknown') {
      throw new Error('Chybí ID faktury');
    }
    if (!amount || amount <= 0) {
      throw new Error('Chybí nebo neplatná částka');
    }

    const paymentData = {
      orderId: orderId,
      invoiceId: invoiceId,
      method: selectedPayment,
      amount: amount,
      currency: 'CZK',
      testFlow: false,
      returnUrl: `${cloudVpsUrl}/payment-success?invoiceId=${invoiceId}&orderId=${orderId}&amount=${amount}&paymentMethod=${selectedPayment}`,
      cancelUrl: `${cloudVpsUrl}/payment-failed?reason=cancelled&invoiceId=${invoiceId}&orderId=${orderId}&amount=${amount}&paymentMethod=${selectedPayment}`,
      pendingUrl: `${cloudVpsUrl}/payment-success?status=pending&invoiceId=${invoiceId}&orderId=${orderId}&amount=${amount}&paymentMethod=${selectedPayment}`,
      customerData: {
        email: 'test@example.com',
        name: 'Test Customer'
      }
    };

    console.log('📤 Sending payment data:', paymentData);

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
      console.log('✅ FRONTEND LOGIC SUCCESS!');
      console.log(`🎯 Order ID: ${orderId}`);
      console.log(`📄 Invoice ID: ${invoiceId}`);
      console.log(`💰 Amount: ${amount} CZK`);
      console.log(`🔗 Payment URL: ${paymentResult.paymentUrl}`);
      
      if (paymentResult.paymentUrl && paymentResult.redirectRequired) {
        console.log('🚀 Payment URL received, would redirect to:', paymentResult.paymentUrl);
      }
    } else {
      console.log('❌ Payment initialization failed:', paymentResult.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run test
testFrontendLogic();
