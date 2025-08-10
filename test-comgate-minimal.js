/**
 * Minimal Comgate Test
 * Tests just the Comgate client directly
 */

// Set environment variables manually for testing
process.env.COMGATE_MERCHANT_ID = '498008';
process.env.COMGATE_SECRET = 'WCJmtaUl94nEKQGMSj1JaYnOLcJORoVI';
process.env.COMGATE_TEST_MODE = 'true';
process.env.COMGATE_MOCK_MODE = 'false';

// Import the Comgate client directly
const ComgateClient = require('./systrix-middleware-nextjs/lib/comgate-client');

async function testComgateMinimal() {
  console.log('🧪 Testing Comgate Client Directly');
  console.log('================================================================================');

  try {
    const client = new ComgateClient();
    
    console.log('📋 Client configuration:');
    console.log(`   Base URL: ${client.baseUrl}`);
    console.log(`   Merchant: ${client.merchant}`);
    console.log(`   Secret: ${client.secret ? client.secret.substring(0, 8) + '***' : 'not set'}`);
    console.log(`   Test Mode: ${client.testMode}`);
    console.log(`   Mock Mode: ${client.mockMode}`);
    console.log(`   Configured: ${client.isConfigured()}`);

    if (!client.isConfigured()) {
      console.log('❌ Client is not configured properly');
      return;
    }

    // Test payment creation
    const paymentData = {
      price: 100,
      currency: 'CZK',
      label: 'Test Payment',
      refId: 'TEST-' + Date.now(),
      email: 'test@example.com',
      fullName: 'Test User',
      phone: '+420123456789',
      method: 'ALL',
      country: 'CZ',
      lang: 'cs',
      returnUrl: 'http://localhost:3005/api/payments/return?status=success',
      cancelUrl: 'http://localhost:3005/api/payments/return?status=cancelled',
      pendingUrl: 'http://localhost:3005/api/payments/return?status=pending'
    };

    console.log('\n📤 Creating payment with data:', JSON.stringify(paymentData, null, 2));

    const result = await client.createPayment(paymentData);
    
    console.log('\n📥 Payment creation result:', JSON.stringify(result, null, 2));

    if (result.transId) {
      console.log('✅ SUCCESS: Payment created successfully!');
      console.log(`   Transaction ID: ${result.transId}`);
      console.log(`   Redirect URL: ${result.redirect}`);
    } else {
      console.log('❌ FAILED: No transaction ID returned');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testComgateMinimal().catch(console.error);
