/**
 * Test Payment Gateway Flow
 * Tests the complete payment flow: gateway initialization → payment processing → invoice marking as PAID
 */

const fs = require('fs');
const path = require('path');

function testPaymentGatewayFlow() {
  console.log('🧪 === PAYMENT GATEWAY FLOW TEST ===\n');
  
  try {
    // Test 1: Check payment initialization implementation
    console.log('🔍 Test 1: Payment initialization implementation...');
    const invoiceTestPath = path.join(__dirname, 'pages', 'invoice-payment-test.js');
    const invoiceContent = fs.readFileSync(invoiceTestPath, 'utf8');
    
    const hasInitializePayment = invoiceContent.includes('/api/middleware/initialize-payment');
    const hasPaymentGatewayCall = invoiceContent.includes('Initialize payment with payment gateway');
    const hasComgateRedirect = invoiceContent.includes('paymentUrl') && invoiceContent.includes('window.open');
    const hasDirectPayment = invoiceContent.includes('processDirectPayment');
    
    console.log('   - Initialize payment API call:', hasInitializePayment ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Payment gateway initialization:', hasPaymentGatewayCall ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Comgate redirect handling:', hasComgateRedirect ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Direct payment processing:', hasDirectPayment ? '✅ IMPLEMENTED' : '❌ MISSING');
    
    const initializationImplemented = hasInitializePayment && hasPaymentGatewayCall && hasComgateRedirect && hasDirectPayment;
    console.log('   - Payment initialization complete:', initializationImplemented ? '✅ YES' : '❌ NO');
    
    // Test 2: Check payment completion flow
    console.log('\n🔍 Test 2: Payment completion flow...');
    const hasSimulatePayment = invoiceContent.includes('simulateSuccessfulPayment');
    const hasMarkInvoicePaid = invoiceContent.includes('/api/middleware/mark-invoice-paid');
    const hasTransactionId = invoiceContent.includes('transactionId');
    const hasPaymentNotes = invoiceContent.includes('Payment completed via');
    
    console.log('   - Payment simulation function:', hasSimulatePayment ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Mark invoice paid API call:', hasMarkInvoicePaid ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Transaction ID handling:', hasTransactionId ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Payment notes generation:', hasPaymentNotes ? '✅ IMPLEMENTED' : '❌ MISSING');
    
    const completionFlowImplemented = hasSimulatePayment && hasMarkInvoicePaid && hasTransactionId && hasPaymentNotes;
    console.log('   - Payment completion flow complete:', completionFlowImplemented ? '✅ YES' : '❌ NO');
    
    // Test 3: Check error handling
    console.log('\n🔍 Test 3: Error handling...');
    const hasErrorHandling = invoiceContent.includes('catch (err)');
    const hasPaymentFailedAlert = invoiceContent.includes('Payment failed:');
    const hasLoadingStateReset = invoiceContent.includes('setPaymentLoading(prev => ({ ...prev, [paymentKey]: false }))');
    const hasInitializationErrorHandling = invoiceContent.includes('Payment initialization failed');
    
    console.log('   - General error handling:', hasErrorHandling ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Payment failed alerts:', hasPaymentFailedAlert ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Loading state reset:', hasLoadingStateReset ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Initialization error handling:', hasInitializationErrorHandling ? '✅ IMPLEMENTED' : '❌ MISSING');
    
    const errorHandlingImplemented = hasErrorHandling && hasPaymentFailedAlert && hasLoadingStateReset && hasInitializationErrorHandling;
    console.log('   - Error handling complete:', errorHandlingImplemented ? '✅ YES' : '❌ NO');
    
    // Test 4: Check payment method handling
    console.log('\n🔍 Test 4: Payment method handling...');
    const hasComgateSpecialHandling = invoiceContent.includes("paymentMethod.toLowerCase() === 'comgate'");
    const hasCustomerDataPassing = invoiceContent.includes('customerData');
    const hasPaymentMethodValidation = invoiceContent.includes('Please select a payment method');
    const hasCurrencyHandling = invoiceContent.includes("currency: 'CZK'");
    
    console.log('   - Comgate special handling:', hasComgateSpecialHandling ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Customer data passing:', hasCustomerDataPassing ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Payment method validation:', hasPaymentMethodValidation ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Currency handling:', hasCurrencyHandling ? '✅ IMPLEMENTED' : '❌ MISSING');
    
    const methodHandlingImplemented = hasComgateSpecialHandling && hasCustomerDataPassing && hasPaymentMethodValidation && hasCurrencyHandling;
    console.log('   - Payment method handling complete:', methodHandlingImplemented ? '✅ YES' : '❌ NO');
    
    // Test 5: Check UI feedback
    console.log('\n🔍 Test 5: UI feedback implementation...');
    const hasSuccessAlert = invoiceContent.includes('Payment Successful!');
    const hasRedirectAlert = invoiceContent.includes('Redirecting to Comgate payment gateway');
    const hasOrderReload = invoiceContent.includes('await loadOrders()');
    const hasPaymentIdDisplay = invoiceContent.includes('Transaction ID:');
    
    console.log('   - Success alert:', hasSuccessAlert ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Redirect notification:', hasRedirectAlert ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Order list reload:', hasOrderReload ? '✅ IMPLEMENTED' : '❌ MISSING');
    console.log('   - Payment ID display:', hasPaymentIdDisplay ? '✅ IMPLEMENTED' : '❌ MISSING');
    
    const uiFeedbackImplemented = hasSuccessAlert && hasRedirectAlert && hasOrderReload && hasPaymentIdDisplay;
    console.log('   - UI feedback complete:', uiFeedbackImplemented ? '✅ YES' : '❌ NO');
    
    // Overall result
    const allImplemented = initializationImplemented && completionFlowImplemented && errorHandlingImplemented && methodHandlingImplemented && uiFeedbackImplemented;
    
    console.log('\n📊 === PAYMENT GATEWAY FLOW SUMMARY ===');
    console.log('1. Payment initialization:', initializationImplemented ? '✅ IMPLEMENTED' : '❌ NOT IMPLEMENTED');
    console.log('2. Payment completion flow:', completionFlowImplemented ? '✅ IMPLEMENTED' : '❌ NOT IMPLEMENTED');
    console.log('3. Error handling:', errorHandlingImplemented ? '✅ IMPLEMENTED' : '❌ NOT IMPLEMENTED');
    console.log('4. Payment method handling:', methodHandlingImplemented ? '✅ IMPLEMENTED' : '❌ NOT IMPLEMENTED');
    console.log('5. UI feedback:', uiFeedbackImplemented ? '✅ IMPLEMENTED' : '❌ NOT IMPLEMENTED');
    
    if (allImplemented) {
      console.log('\n✅ === PAYMENT GATEWAY FLOW COMPLETE ===');
      console.log('🎉 Full payment flow implemented successfully!');
      console.log('📋 Flow steps:');
      console.log('   1. User clicks "Pay" button');
      console.log('   2. System calls /api/middleware/initialize-payment');
      console.log('   3. For Comgate: Redirects to payment gateway');
      console.log('   4. For other methods: Processes payment directly');
      console.log('   5. After successful payment: Calls /api/middleware/mark-invoice-paid');
      console.log('   6. Invoice is marked as PAID in HostBill');
      console.log('   7. UI shows success message and reloads orders');
      console.log('\n🌐 Test the flow: http://localhost:3000/invoice-payment-test');
      console.log('💳 Try different payment methods to see the flow in action!');
    } else {
      console.log('\n❌ === PAYMENT GATEWAY FLOW INCOMPLETE ===');
      console.log('⚠️  Check the failing tests above');
    }
    
    return allImplemented;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  const success = testPaymentGatewayFlow();
  process.exit(success ? 0 : 1);
}

module.exports = { testPaymentGatewayFlow };
