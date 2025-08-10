/**
 * Test Complete Invoice Payment Process
 * Verifies the complete process of marking invoices as paid after successful payment
 */

const MIDDLEWARE_URL = 'http://localhost:3005';

async function testCompleteInvoicePayment() {
  console.log('🧪 === COMPLETE INVOICE PAYMENT TEST ===\n');
  console.log('🎯 Testing complete process: Order → Payment → Invoice Marking as PAID');

  try {
    // Step 1: Create order with proper amount
    console.log('1️⃣ Creating order with proper amount...');
    
    const orderData = {
      customer: {
        firstName: 'Complete',
        lastName: 'Payment',
        email: 'complete.payment@example.com',
        phone: '+420777123456',
        address: 'Complete Street 123',
        city: 'Prague',
        postalCode: '11000',
        country: 'CZ',
        company: 'Complete Payment s.r.o.'
      },
      items: [
        {
          productId: '1',
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
    
    if (!orderResult.success || !orderResult.orders?.[0]) {
      console.log('❌ Order creation failed:', orderResult.error);
      return;
    }

    const order = orderResult.orders[0];
    console.log(`✅ Order created: ${order.orderId}, Invoice: ${order.invoiceId}`);
    console.log(`   Product: ${order.product}, Price: ${order.priceFormatted}`);

    // Step 2: Check initial invoice status using new method
    console.log('\n2️⃣ Checking initial invoice status...');
    
    try {
      const HostBillClient = require('./systrix-middleware-nextjs/lib/hostbill-client');
      const hostbillClient = new HostBillClient();
      
      const initialStatus = await hostbillClient.getInvoiceStatus(order.invoiceId);
      
      if (initialStatus.success) {
        console.log(`✅ Initial invoice status: ${initialStatus.status}`);
        console.log(`   Total: ${initialStatus.total} ${initialStatus.currency}`);
        console.log(`   Credit: ${initialStatus.credit} ${initialStatus.currency}`);
        console.log(`   Is Paid: ${initialStatus.isPaid ? 'YES' : 'NO'}`);
      } else {
        console.log('❌ Failed to get initial invoice status');
      }
    } catch (statusError) {
      console.log('⚠️ Could not check initial status:', statusError.message);
    }

    // Step 3: Simulate successful payment with proper amount
    console.log('\n3️⃣ Simulating successful payment with proper amount...');
    
    const returnParams = {
      status: 'success',
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      transactionId: `COMPLETE-${Date.now()}`,
      paymentMethod: 'comgate',
      amount: '299', // Use the actual order amount
      currency: 'CZK'
    };

    const returnUrl = `${MIDDLEWARE_URL}/api/payments/return?${new URLSearchParams(returnParams).toString()}`;
    
    console.log('📤 Calling return endpoint with amount:', returnParams.amount);
    
    const returnResponse = await fetch(returnUrl, {
      method: 'GET',
      redirect: 'manual'
    });

    console.log(`✅ Return endpoint called: ${returnResponse.status}`);
    
    if (returnResponse.status === 302) {
      const location = returnResponse.headers.get('location');
      console.log(`   Redirect to: ${location}`);
    }

    // Step 4: Wait for processing
    console.log('\n4️⃣ Waiting for payment processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 5: Check invoice status after payment
    console.log('\n5️⃣ Checking invoice status after payment...');
    
    try {
      const HostBillClient = require('./systrix-middleware-nextjs/lib/hostbill-client');
      const hostbillClient = new HostBillClient();
      
      const finalStatus = await hostbillClient.getInvoiceStatus(order.invoiceId);
      
      if (finalStatus.success) {
        console.log(`✅ Final invoice status: ${finalStatus.status}`);
        console.log(`   Total: ${finalStatus.total} ${finalStatus.currency}`);
        console.log(`   Credit: ${finalStatus.credit} ${finalStatus.currency}`);
        console.log(`   Is Paid: ${finalStatus.isPaid ? 'YES' : 'NO'}`);
        
        if (finalStatus.isPaid) {
          console.log('\n🎉 SUCCESS: Invoice is marked as PAID!');
        } else {
          console.log('\n⚠️ WARNING: Invoice is still NOT PAID');
          
          // Try manual marking
          console.log('\n6️⃣ Trying manual invoice marking...');
          try {
            const markResult = await hostbillClient.markInvoiceAsPaid(order.invoiceId);
            if (markResult.success) {
              console.log('✅ Manual marking successful');
              
              // Check again
              const recheck = await hostbillClient.getInvoiceStatus(order.invoiceId);
              if (recheck.success && recheck.isPaid) {
                console.log('✅ Invoice is now marked as PAID after manual marking!');
              }
            }
          } catch (markError) {
            console.log('❌ Manual marking failed:', markError.message);
            
            // Try status update
            try {
              const updateResult = await hostbillClient.updateInvoiceStatus(order.invoiceId, 'Paid');
              if (updateResult.success) {
                console.log('✅ Status update successful');
              }
            } catch (updateError) {
              console.log('❌ Status update failed:', updateError.message);
            }
          }
        }
      } else {
        console.log('❌ Failed to get final invoice status');
      }
    } catch (statusError) {
      console.log('❌ Error checking final status:', statusError.message);
    }

    // Step 6: Test callback endpoint
    console.log('\n7️⃣ Testing callback endpoint...');
    
    const callbackData = {
      status: 'success',
      orderId: order.orderId,
      invoiceId: order.invoiceId,
      transactionId: `CALLBACK-${Date.now()}`,
      paymentMethod: 'comgate',
      amount: '299',
      currency: 'CZK'
    };

    try {
      const callbackResponse = await fetch(`${MIDDLEWARE_URL}/api/payments/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callbackData)
      });

      const callbackResult = await callbackResponse.json();
      
      if (callbackResult.success) {
        console.log('✅ Callback endpoint processed successfully');
        console.log(`   Payment ID: ${callbackResult.paymentId}`);
        console.log(`   Transaction ID: ${callbackResult.transactionId}`);
      } else {
        console.log('❌ Callback endpoint failed:', callbackResult.error);
      }
    } catch (callbackError) {
      console.log('❌ Callback test failed:', callbackError.message);
    }

    console.log('\n🎯 === COMPLETE INVOICE PAYMENT SUMMARY ===');
    console.log('✅ Complete invoice payment test completed');
    
    console.log('\n📋 Enhanced Payment Process:');
    console.log('   1. Order created with proper amount');
    console.log('   2. Payment return endpoint called');
    console.log('   3. Payment added to invoice (addInvoicePayment)');
    console.log('   4. Invoice marked as paid (markInvoiceAsPaid)');
    console.log('   5. Fallback to status update if needed');
    console.log('   6. Comprehensive status checking');
    
    console.log('\n🌐 Browser Testing:');
    console.log('   1. Open: http://localhost:3000/payment-flow-test');
    console.log('   2. Create order and initialize payment');
    console.log('   3. Complete payment in Comgate');
    console.log('   4. Return to application');
    console.log('   5. Check HostBill admin - invoice should be PAID');
    
    console.log('\n🔧 Implementation Details:');
    console.log('   • addInvoicePayment() - adds payment record');
    console.log('   • markInvoiceAsPaid() - marks invoice as paid');
    console.log('   • updateInvoiceStatus() - fallback method');
    console.log('   • getInvoiceStatus() - comprehensive status check');
    console.log('   • Dual approach: return handler + callback endpoint');

  } catch (error) {
    console.error('❌ Complete invoice payment test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testCompleteInvoicePayment();
}

module.exports = { testCompleteInvoicePayment };
