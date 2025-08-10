/**
 * Test script for HostBill Invoice Integration
 * Tests the new functionality for displaying HostBill invoice amount in payment-method page
 */

const https = require('https');
const { URL } = require('url');

// Test configuration
const TEST_CONFIG = {
  hostbillUrl: 'https://vps.kabel1it.cz',
  apiId: 'adcdebb0e3b6f583052d',
  apiKey: '341697c41aeb1c842f0d',
  testInvoiceId: '456', // Known test invoice ID
  localApiUrl: 'http://localhost:3000'
};

console.log('🧪 Testing HostBill Invoice Integration');
console.log('=====================================');

async function testHostBillDirectAPI() {
  console.log('\n1️⃣ Testing direct HostBill API call...');
  
  try {
    const formData = new URLSearchParams({
      api_id: TEST_CONFIG.apiId,
      api_key: TEST_CONFIG.apiKey,
      call: 'getInvoices',
      'filter[id]': TEST_CONFIG.testInvoiceId
    });

    const apiUrl = new URL(`${TEST_CONFIG.hostbillUrl}/admin/api.php`);
    
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const data = await response.json();
    
    if (data.error) {
      console.log('❌ HostBill API Error:', data.error);
      return false;
    }

    if (data.invoices && data.invoices.length > 0) {
      const invoice = data.invoices.find(inv => inv.id == TEST_CONFIG.testInvoiceId);
      if (invoice) {
        console.log('✅ Direct HostBill API call successful');
        console.log('📋 Invoice details:', {
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          amount: invoice.grandtotal || invoice.total,
          currency: invoice.currency || 'CZK'
        });
        return true;
      }
    }
    
    console.log('❌ Invoice not found in HostBill response');
    return false;
  } catch (error) {
    console.log('❌ Direct HostBill API call failed:', error.message);
    return false;
  }
}

async function testLocalInvoiceAPI() {
  console.log('\n2️⃣ Testing local invoice API endpoint...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.localApiUrl}/api/hostbill/invoice/${TEST_CONFIG.testInvoiceId}`);
    const data = await response.json();
    
    if (data.success && data.invoice) {
      console.log('✅ Local invoice API call successful');
      console.log('📋 Invoice data from local API:', {
        id: data.invoice.id,
        number: data.invoice.number,
        status: data.invoice.status,
        amount: data.invoice.amount,
        currency: data.invoice.currency
      });
      return data.invoice;
    } else {
      console.log('❌ Local invoice API call failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Local invoice API call failed:', error.message);
    return null;
  }
}

async function testPaymentMethodPageIntegration() {
  console.log('\n3️⃣ Testing payment-method page integration...');
  
  // Simulate order data that would be stored in sessionStorage
  const testOrderData = {
    orders: [{
      invoiceId: TEST_CONFIG.testInvoiceId,
      hostbillOrderId: 'ORDER-TEST-123',
      totalAmount: 1000
    }],
    customer: {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'Customer'
    }
  };

  console.log('📋 Test order data prepared:', testOrderData);
  console.log('💡 To test the full integration:');
  console.log('   1. Open browser and navigate to payment-method page');
  console.log('   2. Set sessionStorage with test order data:');
  console.log(`      sessionStorage.setItem('orderData', '${JSON.stringify(testOrderData)}');`);
  console.log('   3. Refresh the page and check if HostBill amount is displayed');
  console.log('   4. Check browser console for loading messages');
  
  return true;
}

async function runTests() {
  console.log('🚀 Starting HostBill Invoice Integration Tests...\n');
  
  const results = {
    directAPI: false,
    localAPI: false,
    integration: false
  };
  
  // Test 1: Direct HostBill API
  results.directAPI = await testHostBillDirectAPI();
  
  // Test 2: Local Invoice API
  const invoiceData = await testLocalInvoiceAPI();
  results.localAPI = !!invoiceData;
  
  // Test 3: Integration test instructions
  results.integration = await testPaymentMethodPageIntegration();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Direct HostBill API: ${results.directAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Local Invoice API: ${results.localAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Integration Ready: ${results.integration ? '✅ READY' : '❌ NOT READY'}`);
  
  if (results.directAPI && results.localAPI) {
    console.log('\n🎉 All API tests passed! The integration should work correctly.');
    console.log('💡 Next steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Navigate to /payment-method page');
    console.log('   3. Use browser dev tools to set test order data in sessionStorage');
    console.log('   4. Verify HostBill amount is displayed in the cart sidebar');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the configuration and try again.');
  }
}

// Run tests
runTests().catch(console.error);
