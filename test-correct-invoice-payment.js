/**
 * Test Correct Invoice Payment Methods
 * Uses correct HostBill API parameters based on existing working code
 */

// Set environment variables directly
process.env.HOSTBILL_API_URL = 'https://vps.kabel1it.cz/admin/api.php';
process.env.HOSTBILL_API_ID = 'adcdebb0e3b6f583052d';
process.env.HOSTBILL_API_KEY = '341697c41aeb1c842f0d';
process.env.HOSTBILL_BASE_URL = 'https://vps.kabel1it.cz';

const HostBillClient = require('./systrix-middleware-nextjs/lib/hostbill-client');

async function testCorrectInvoicePayment() {
  console.log('🧪 === CORRECT INVOICE PAYMENT TEST ===\n');
  console.log('🎯 Testing correct HostBill API parameters for invoice 218');

  const invoiceId = '218';

  try {
    const hostbillClient = new HostBillClient();
    
    // Step 1: Check current invoice status with correct parameters
    console.log('1️⃣ Checking current invoice status with correct parameters...');
    
    try {
      // Use correct parameter name 'id' instead of 'invoice_id'
      const result = await hostbillClient.makeApiCall({
        call: 'getInvoice',
        id: invoiceId
      });

      console.log('✅ getInvoice result:', JSON.stringify(result, null, 2));
      
      if (result && result.invoice) {
        console.log('   Invoice found:');
        console.log('   Status:', result.invoice.status);
        console.log('   Total:', result.invoice.total);
        console.log('   Currency:', result.invoice.currency);
        console.log('   Credit:', result.invoice.credit);
      } else {
        console.log('   ⚠️ Invoice data not found in response');
      }
    } catch (statusError) {
      console.log('❌ Error getting invoice:', statusError.message);
    }

    // Step 2: Try addInvoicePayment with correct parameters (based on working code)
    console.log('\n2️⃣ Method: addInvoicePayment with correct parameters...');
    
    try {
      // Based on working code in systrix-middleware/lib/hostbill-client.js
      const paymentParams = {
        call: 'addInvoicePayment',
        id: invoiceId, // Use 'id' instead of 'invoice_id'
        amount: 604,
        paymentmodule: 'manual', // Payment module name
        fee: 0,
        date: new Date().toISOString().split('T')[0],
        transnumber: `TEST-CORRECT-${Date.now()}`,
        send_email: 0
      };

      console.log('📤 Calling addInvoicePayment with params:', paymentParams);
      
      const paymentResult = await hostbillClient.makeApiCall(paymentParams);
      
      console.log('✅ addInvoicePayment result:', JSON.stringify(paymentResult, null, 2));
      
      if (paymentResult && !paymentResult.error) {
        console.log('✅ Payment added successfully!');
      } else {
        console.log('❌ Payment failed:', paymentResult.error);
      }
    } catch (paymentError) {
      console.log('❌ Error adding payment:', paymentError.message);
    }

    // Step 3: Try alternative method - direct API call with different approach
    console.log('\n3️⃣ Method: Direct API call with manual payment...');
    
    try {
      const manualPaymentParams = {
        call: 'addInvoicePayment',
        id: invoiceId,
        amount: '604.00',
        currency: 'CZK',
        paymentmodule: 'manual',
        date: new Date().toISOString().split('T')[0],
        transnumber: `MANUAL-${Date.now()}`,
        notes: 'Manual payment via API test',
        send_email: '0'
      };

      console.log('📤 Manual payment params:', manualPaymentParams);
      
      const manualResult = await hostbillClient.makeApiCall(manualPaymentParams);
      
      console.log('✅ Manual payment result:', JSON.stringify(manualResult, null, 2));
      
    } catch (manualError) {
      console.log('❌ Manual payment error:', manualError.message);
    }

    // Step 4: Try chargeCreditCard method (if available)
    console.log('\n4️⃣ Method: chargeCreditCard...');
    
    try {
      const chargeParams = {
        call: 'chargeCreditCard',
        id: invoiceId
      };

      console.log('📤 Charge params:', chargeParams);
      
      const chargeResult = await hostbillClient.makeApiCall(chargeParams);
      
      console.log('✅ Charge result:', JSON.stringify(chargeResult, null, 2));
      
    } catch (chargeError) {
      console.log('❌ Charge error:', chargeError.message);
    }

    // Step 5: Try to get available payment methods
    console.log('\n5️⃣ Getting available payment methods...');
    
    try {
      const methodsResult = await hostbillClient.makeApiCall({
        call: 'getPaymentGateways'
      });

      console.log('✅ Payment methods result:', JSON.stringify(methodsResult, null, 2));
      
    } catch (methodsError) {
      console.log('❌ Payment methods error:', methodsError.message);
    }

    // Step 6: Final status check
    console.log('\n6️⃣ Final invoice status check...');
    
    try {
      const finalResult = await hostbillClient.makeApiCall({
        call: 'getInvoice',
        id: invoiceId
      });

      console.log('✅ Final invoice status:', JSON.stringify(finalResult, null, 2));
      
      if (finalResult && finalResult.invoice) {
        const invoice = finalResult.invoice;
        const isPaid = invoice.status === 'Paid' || 
                      invoice.status === 'paid' ||
                      parseFloat(invoice.credit || 0) >= parseFloat(invoice.total || 0);
        
        console.log('\n📊 Final Status Summary:');
        console.log('   Invoice ID:', invoiceId);
        console.log('   Status:', invoice.status);
        console.log('   Total:', invoice.total, invoice.currency);
        console.log('   Credit:', invoice.credit, invoice.currency);
        console.log('   Is Paid:', isPaid ? 'YES' : 'NO');
        
        if (isPaid) {
          console.log('\n🎉 SUCCESS: Invoice 218 is marked as PAID!');
        } else {
          console.log('\n⚠️ WARNING: Invoice 218 is still UNPAID');
        }
      }
    } catch (finalError) {
      console.log('❌ Final check error:', finalError.message);
    }

    console.log('\n🎯 === CORRECT PAYMENT TEST SUMMARY ===');
    console.log('✅ Test completed with correct HostBill API parameters');
    
    console.log('\n📋 Key Findings:');
    console.log('   • Use "id" parameter instead of "invoice_id"');
    console.log('   • Use "paymentmodule" for payment method');
    console.log('   • Use "transnumber" for transaction ID');
    console.log('   • Manual payment module should work');
    
    console.log('\n🌐 Next Steps:');
    console.log('   1. Check HostBill admin panel for invoice 218');
    console.log('   2. Verify if payment was added');
    console.log('   3. Check if status changed to PAID');
    console.log('   4. Update middleware code with correct parameters');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testCorrectInvoicePayment();
}

module.exports = { testCorrectInvoicePayment };
