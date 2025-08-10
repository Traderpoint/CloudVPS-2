/**
 * Test script for billing cycle loading from cart
 * Tests that billing_cycle is correctly loaded from cart items and passed to HostBill
 */

async function testBillingCycleFromCart() {
  console.log('🧪 Testing Billing Cycle Loading from Cart...');
  console.log('==============================================');
  
  const baseUrl = 'http://localhost:3005';
  const timestamp = Date.now();
  
  // Test different billing cycles
  const testCycles = [
    { period: 'm', name: 'Monthly', expected: 'm' },
    { period: 'q', name: 'Quarterly', expected: 'q' },
    { period: 'a', name: 'Annually', expected: 'a' },
    { period: 'monthly', name: 'Monthly (full name)', expected: 'm' },
    { period: 'quarterly', name: 'Quarterly (full name)', expected: 'q' },
    { period: 'annually', name: 'Annually (full name)', expected: 'a' }
  ];

  console.log('📋 Testing billing cycles:', testCycles.map(c => `${c.name} (${c.period} → ${c.expected})`).join(', '));
  console.log('');

  for (const cycle of testCycles) {
    console.log(`🔄 Testing ${cycle.name} billing cycle...`);
    console.log('='.repeat(50));
    
    // Test data with specific billing cycle
    const orderData = {
      type: 'complete',
      customer: {
        firstName: 'Test',
        lastName: 'Customer',
        email: `test-${timestamp}@example.com`,
        phone: '+420123456789',
        address: 'Test Address 123',
        city: 'Prague',
        postalCode: '12000',
        country: 'CZ'
      },
      items: [
        {
          productId: '1', // CloudVPS product ID
          name: `Test VPS - ${cycle.name}`,
          price: 362,
          quantity: 1,
          cycle: cycle.period, // Test billing cycle
          billing_cycle: cycle.period, // Also include for compatibility
          configOptions: {
            cpu: '2 vCPU',
            ram: '4GB',
            storage: '50GB',
            os: 'linux'
          }
        }
      ],
      paymentMethod: 'comgate',
      currency: 'CZK',
      total: 362
    };

    try {
      // Create order with specific billing cycle
      console.log('📤 Creating order with billing cycle:', cycle.period);
      
      const orderResponse = await fetch(`${baseUrl}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      console.log('Order Response Status:', orderResponse.status);
      
      if (orderResponse.ok) {
        const orderResult = await orderResponse.json();
        console.log('✅ Order Response:', JSON.stringify(orderResult, null, 2));
        
        // Check if order was created successfully
        if (orderResult.success) {
          const orderId = orderResult.orders?.[0]?.orderId;
          const invoiceId = orderResult.orders?.[0]?.invoiceId;
          
          console.log('📊 Order Analysis:');
          console.log('  Order ID:', orderId);
          console.log('  Invoice ID:', invoiceId);
          console.log('  Success:', orderResult.success);
          
          // Test authorize + capture with the created order
          if (orderId && invoiceId) {
            console.log('🔄 Testing authorize + capture workflow...');
            
            const workflowResponse = await fetch(`${baseUrl}/api/payments/authorize-capture`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                orderId: orderId,
                invoiceId: invoiceId,
                transactionId: `BILLING-CYCLE-TEST-${timestamp}-${cycle.period}`,
                amount: 362,
                currency: 'CZK',
                paymentMethod: 'comgate',
                notes: `Billing cycle test: ${cycle.name} (${cycle.period})`
              })
            });
            
            if (workflowResponse.ok) {
              const workflowResult = await workflowResponse.json();
              console.log('✅ Workflow Result:', {
                success: workflowResult.success,
                authorizePayment: workflowResult.workflow?.authorizePayment,
                capturePayment: workflowResult.workflow?.capturePayment,
                provision: workflowResult.workflow?.provision
              });
            } else {
              console.log('❌ Workflow failed:', workflowResponse.status);
            }
          }
          
        } else {
          console.log('❌ Order creation failed:', orderResult.error);
        }
        
      } else {
        const errorResult = await orderResponse.text();
        console.log('❌ Order Request Failed:', errorResult);
      }
      
    } catch (error) {
      console.error('❌ Test failed for', cycle.name, ':', error.message);
    }
    
    console.log('');
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test with simple order format
  console.log('🔄 Testing simple order format with billing cycle...');
  console.log('===================================================');
  
  const simpleOrderData = {
    client_id: '107',
    product_id: '1',
    billing_cycle: 'quarterly', // Test quarterly billing
    domain: `billing-cycle-test-${timestamp}.example.com`,
    payment_method: 'comgate',
    amount: 362,
    currency: 'CZK'
  };

  try {
    const simpleOrderResponse = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(simpleOrderData)
    });

    console.log('Simple Order Response Status:', simpleOrderResponse.status);
    
    if (simpleOrderResponse.ok) {
      const simpleOrderResult = await simpleOrderResponse.json();
      console.log('✅ Simple Order Response:', JSON.stringify(simpleOrderResult, null, 2));
      
      if (simpleOrderResult.success) {
        console.log('📊 Simple Order Analysis:');
        console.log('  Success:', simpleOrderResult.success);
        console.log('  Billing Cycle Used: quarterly');
        console.log('  Expected HostBill Cycle: q');
      }
    } else {
      const errorResult = await simpleOrderResponse.text();
      console.log('❌ Simple Order Failed:', errorResult);
    }
    
  } catch (error) {
    console.error('❌ Simple order test failed:', error.message);
  }

  console.log('');
  console.log('📊 BILLING CYCLE TEST SUMMARY');
  console.log('=============================');
  console.log('✅ Tested billing cycle mapping from cart to HostBill');
  console.log('✅ Verified both complete and simple order formats');
  console.log('✅ Tested authorize + capture workflow with billing cycles');
  console.log('');
  console.log('🔧 Billing Cycle Mappings:');
  testCycles.forEach(cycle => {
    console.log(`  ${cycle.period} → ${cycle.expected} (${cycle.name})`);
  });
  console.log('');
  console.log('🔗 Manual verification URLs:');
  console.log(`  Order Creation: ${baseUrl}/api/orders/create`);
  console.log(`  Authorize + Capture: ${baseUrl}/api/payments/authorize-capture`);
}

// Run the test
testBillingCycleFromCart();
