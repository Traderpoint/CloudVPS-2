/**
 * Simple Test: Mark Invoice 218 as Paid
 * Tests different HostBill API methods to mark invoice as paid
 */

// Set environment variables directly
process.env.HOSTBILL_API_URL = 'https://vps.kabel1it.cz/admin/api.php';
process.env.HOSTBILL_API_ID = 'adcdebb0e3b6f583052d';
process.env.HOSTBILL_API_KEY = '341697c41aeb1c842f0d';
process.env.HOSTBILL_BASE_URL = 'https://vps.kabel1it.cz';

const HostBillClient = require('./systrix-middleware-nextjs/lib/hostbill-client');

async function testMarkInvoice218Paid() {
  console.log('🧪 === MARK INVOICE 218 AS PAID TEST ===\n');
  console.log('🎯 Testing different methods to mark invoice ID 218 as PAID');

  const invoiceId = '218';

  try {
    const hostbillClient = new HostBillClient();
    
    // Step 1: Check current invoice status
    console.log('1️⃣ Checking current invoice status...');
    
    try {
      const currentStatus = await hostbillClient.getInvoice(invoiceId);
      if (currentStatus.success) {
        console.log('✅ Current invoice details:');
        console.log('   Invoice ID:', invoiceId);
        console.log('   Status:', currentStatus.invoice?.status || 'Unknown');
        console.log('   Total:', currentStatus.invoice?.total || 'Unknown');
        console.log('   Currency:', currentStatus.invoice?.currency || 'Unknown');
        console.log('   Credit:', currentStatus.invoice?.credit || 'Unknown');
      } else {
        console.log('❌ Failed to get current invoice status');
      }
    } catch (statusError) {
      console.log('⚠️ Could not check current status:', statusError.message);
    }

    // Step 2: Try Method 1 - addInvoicePayment
    console.log('\n2️⃣ Method 1: Adding payment to invoice...');
    
    try {
      const paymentData = {
        invoice_id: invoiceId,
        amount: 604, // Amount from the screenshot
        currency: 'CZK',
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        method: 'Test Payment',
        transaction_id: `TEST-MARK-${Date.now()}`,
        notes: 'Test payment to mark invoice as paid'
      };

      console.log('📤 Adding payment with data:', paymentData);
      
      const paymentResult = await hostbillClient.addInvoicePayment(paymentData);
      
      if (paymentResult.success) {
        console.log('✅ Payment added successfully');
        console.log('   Payment ID:', paymentResult.payment_id);
      } else {
        console.log('❌ Failed to add payment:', paymentResult.error);
      }
    } catch (paymentError) {
      console.log('❌ Error adding payment:', paymentError.message);
    }

    // Step 3: Try Method 2 - markInvoiceAsPaid
    console.log('\n3️⃣ Method 2: Marking invoice as paid...');
    
    try {
      console.log('📤 Calling markInvoiceAsPaid for invoice:', invoiceId);
      
      const markResult = await hostbillClient.markInvoiceAsPaid(invoiceId);
      
      if (markResult.success) {
        console.log('✅ Invoice marked as paid successfully');
        console.log('   Result:', markResult.result);
      } else {
        console.log('❌ Failed to mark invoice as paid:', markResult.error);
      }
    } catch (markError) {
      console.log('❌ Error marking invoice as paid:', markError.message);
    }

    // Step 4: Try Method 3 - updateInvoiceStatus
    console.log('\n4️⃣ Method 3: Updating invoice status to Paid...');
    
    try {
      console.log('📤 Calling updateInvoiceStatus for invoice:', invoiceId);
      
      const updateResult = await hostbillClient.updateInvoiceStatus(invoiceId, 'Paid');
      
      if (updateResult.success) {
        console.log('✅ Invoice status updated successfully');
        console.log('   Result:', updateResult.result);
      } else {
        console.log('❌ Failed to update invoice status:', updateResult.error);
      }
    } catch (updateError) {
      console.log('❌ Error updating invoice status:', updateError.message);
    }

    // Step 5: Try alternative API calls
    console.log('\n5️⃣ Method 4: Trying alternative API calls...');
    
    // Try different API call names that might work
    const alternativeCalls = [
      { call: 'payInvoice', params: { invoice_id: invoiceId } },
      { call: 'setInvoicePaid', params: { invoice_id: invoiceId } },
      { call: 'updateInvoice', params: { invoice_id: invoiceId, status: 'Paid' } },
      { call: 'editInvoice', params: { invoice_id: invoiceId, status: 'Paid' } }
    ];

    for (const alternative of alternativeCalls) {
      try {
        console.log(`📤 Trying ${alternative.call}...`);
        
        const result = await hostbillClient.makeApiCall({
          call: alternative.call,
          ...alternative.params
        });
        
        console.log(`✅ ${alternative.call} succeeded:`, result);
        break; // If one succeeds, stop trying others
        
      } catch (altError) {
        console.log(`❌ ${alternative.call} failed:`, altError.message);
      }
    }

    // Step 6: Check final status
    console.log('\n6️⃣ Checking final invoice status...');
    
    try {
      const finalStatus = await hostbillClient.getInvoice(invoiceId);
      if (finalStatus.success) {
        console.log('✅ Final invoice details:');
        console.log('   Invoice ID:', invoiceId);
        console.log('   Status:', finalStatus.invoice?.status || 'Unknown');
        console.log('   Total:', finalStatus.invoice?.total || 'Unknown');
        console.log('   Credit:', finalStatus.invoice?.credit || 'Unknown');
        
        const isPaid = finalStatus.invoice?.status === 'Paid' || 
                      finalStatus.invoice?.status === 'paid' ||
                      parseFloat(finalStatus.invoice?.credit || 0) >= parseFloat(finalStatus.invoice?.total || 0);
        
        if (isPaid) {
          console.log('\n🎉 SUCCESS: Invoice 218 is now marked as PAID!');
        } else {
          console.log('\n⚠️ WARNING: Invoice 218 is still NOT PAID');
          console.log('   Current status:', finalStatus.invoice?.status);
        }
      } else {
        console.log('❌ Failed to get final invoice status');
      }
    } catch (finalError) {
      console.log('❌ Error checking final status:', finalError.message);
    }

    console.log('\n🎯 === TEST SUMMARY ===');
    console.log('✅ Test completed for invoice ID 218');
    console.log('\n📋 Methods tested:');
    console.log('   1. addInvoicePayment - adds payment record');
    console.log('   2. markInvoiceAsPaid - marks as paid');
    console.log('   3. updateInvoiceStatus - updates status');
    console.log('   4. Alternative API calls - various methods');
    
    console.log('\n🌐 Check HostBill Admin:');
    console.log('   Go to HostBill admin panel');
    console.log('   Find invoice ID 218');
    console.log('   Check if status changed to PAID');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testMarkInvoice218Paid();
}

module.exports = { testMarkInvoice218Paid };
