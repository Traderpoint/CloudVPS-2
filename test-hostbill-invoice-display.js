/**
 * Test script for HostBill invoice display in payment-method page
 * Run this in browser console to test the integration
 * Updated to use systrix-middleware-nextjs
 */

console.log('🧪 Setting up test data for HostBill invoice display (via systrix-middleware-nextjs)...');

// Test order data with invoice ID 456 (which we know exists in HostBill)
const testOrderData = {
  orders: [{
    invoiceId: '456',
    hostbillOrderId: 'ORDER-TEST-456',
    totalAmount: 598,
    orderDetails: {
      invoice_id: '456',
      total: 598
    }
  }],
  customer: {
    email: 'petr.testovaci@example.com',
    firstName: 'Petr',
    lastName: 'Testovací',
    phone: '+420123456789'
  },
  billingData: {
    firstName: 'Petr',
    lastName: 'Testovací',
    email: 'petr.testovaci@example.com',
    companyName: 'Test s.r.o.'
  }
};

// Test billing cart data
const testBillingCartData = {
  items: [{
    id: '1',
    name: 'VPS Start',
    price: '299 Kč',
    quantity: 2,
    cpu: '1 vCPU',
    ram: '1 GB',
    storage: '20 GB SSD'
  }],
  selectedPeriod: '1',
  selectedOS: 'linux',
  selectedApps: [],
  cartTotal: 598, // Should match HostBill invoice amount
  cartMonthlyTotal: 598,
  totalSavings: 0,
  itemPricing: [{
    id: '1',
    name: 'VPS Start',
    monthlyPrice: 299,
    periodPrice: 299,
    savings: 0,
    quantity: 2
  }],
  timestamp: new Date().toISOString()
};

// Set sessionStorage data
sessionStorage.setItem('orderData', JSON.stringify(testOrderData));
sessionStorage.setItem('billingCartData', JSON.stringify(testBillingCartData));

console.log('✅ Test data set in sessionStorage:');
console.log('📋 Order Data:', testOrderData);
console.log('🛒 Billing Cart Data:', testBillingCartData);
console.log('');
console.log('🔄 Now refresh the page to see the integration in action!');
console.log('');
console.log('Expected behavior (via systrix-middleware-nextjs):');
console.log('1. ✅ Page should load without redirecting to /billing');
console.log('2. ✅ Should show "Loading HostBill invoice data for ID: 456" in console');
console.log('3. ✅ Should show "Using systrix-middleware-nextjs for HostBill API call" in console');
console.log('4. ✅ Should display HostBill amount (598 CZK) in cart sidebar');
console.log('5. ✅ HostBill section should show:');
console.log('   - Hodnota v HostBill: 598 CZK');
console.log('   - Faktura #INV-456');
console.log('   - Status: Paid');
console.log('6. ✅ When clicking "Dokončit k platbě", should use HostBill amount (598 CZK)');

// Test API endpoint directly
console.log('');
console.log('🧪 Testing API endpoint directly...');
fetch('/api/hostbill/invoice/456')
  .then(response => response.json())
  .then(data => {
    console.log('📋 API Response:', data);
    if (data.success) {
      console.log('✅ API endpoint working correctly');
      console.log(`💰 Invoice amount: ${data.invoice.amount} ${data.invoice.currency}`);
      console.log(`📄 Invoice status: ${data.invoice.status}`);
      console.log(`👤 Client: ${data.invoice.clientInfo.firstName} ${data.invoice.clientInfo.lastName}`);
    } else {
      console.log('❌ API endpoint failed:', data.error);
    }
  })
  .catch(error => {
    console.log('❌ API test failed:', error);
  });
