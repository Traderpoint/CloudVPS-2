/**
 * Simple ComGate API Test
 * Testuje, zda ComGate processor dokáže získat skutečná data
 */

console.log('🧪 Testing ComGate API Data Retrieval');
console.log('====================================');

async function testComGateAPI() {
  try {
    // Import ComGate processor
    const ComgateProcessor = require('./systrix-middleware-nextjs/lib/comgate-processor');
    const comgateProcessor = new ComgateProcessor();
    
    console.log('📋 ComGate processor initialized');
    console.log('Config:', comgateProcessor.getConfigInfo());
    console.log('');
    
    // Test with a fake transaction ID
    const testTransactionId = 'TEST-COMGATE-TX-123';
    
    console.log(`🔍 Testing payment status check for: ${testTransactionId}`);
    
    const result = await comgateProcessor.checkPaymentStatus(testTransactionId);
    
    console.log('📊 ComGate API Response:');
    console.log('  Success:', result.success);
    
    if (result.success) {
      console.log('  Transaction ID:', result.transactionId);
      console.log('  Status:', result.status);
      console.log('  Amount:', result.amount);
      console.log('  Currency:', result.currency);
      console.log('  Paid:', result.paid);
      console.log('  Ref ID:', result.refId);
      console.log('  Test Mode:', result.testMode);
    } else {
      console.log('  Error:', result.error);
    }
    
    console.log('');
    console.log('🎯 Test Result:');
    
    if (result.success && result.paid) {
      console.log('✅ ComGate API returned valid payment data');
      console.log(`   Amount: ${result.amount} ${result.currency}`);
      console.log('   This data will be used in payment-success-flow');
    } else if (result.success && !result.paid) {
      console.log('⚠️ ComGate API returned data but payment not paid');
      console.log('   This is expected for test transaction IDs');
    } else {
      console.log('❌ ComGate API call failed');
      console.log('   Return handler will use fallback URL parameters');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Possible issues:');
    console.log('   1. ComGate processor not properly configured');
    console.log('   2. ComGate API credentials missing');
    console.log('   3. Network connectivity issues');
    console.log('   4. ComGate API temporarily unavailable');
  }
}

// Run the test
testComGateAPI();
