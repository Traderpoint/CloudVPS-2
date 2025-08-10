// Test script for direct HostBill API call
// Using built-in fetch (Node.js 18+)

async function testHostBillDirect() {
  console.log('🧪 Testing direct HostBill API call...');

  const hostbillUrl = 'https://vps.kabel1it.cz/admin/api.php';
  const apiId = 'adcdebb0e3b6f583052d';
  const apiKey = '341697c41aeb1c842f0d';

  // Test data according to your example
  const email = 'test@example.com';
  const products = [
    { product_id: 5, qty: 1 },  // VPS Basic (mapped from CloudVPS ID 1)
    { product_id: 10, qty: 1 }  // VPS Pro (mapped from CloudVPS ID 2)
  ];

  try {
    // Build parameters exactly like in your example
    const params = new URLSearchParams({
      call: 'addOrder',
      api_id: apiId,
      api_key: apiKey,
      client_email: email,
      gateway: 'banktransfer',
      send_email: 0,
      status: 'pending'
    });

    // Add each product as items
    products.forEach((prod, idx) => {
      params.append(`items[${idx}][product_id]`, prod.product_id);
      params.append(`items[${idx}][qty]`, prod.qty || 1);
    });

    console.log('📤 Sending to HostBill API...');
    console.log('URL:', hostbillUrl);
    console.log('Params:', params.toString());

    const response = await fetch(hostbillUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const result = await response.json();
    console.log('📥 HostBill response:', JSON.stringify(result, null, 2));

    if (result && result.success) {
      console.log('✅ DIRECT HOSTBILL SUCCESS!');
      console.log(`🎯 Order ID: ${result.order_id}`);
      console.log(`📄 Invoice ID: ${result.invoice_id}`);
    } else {
      console.log('❌ HostBill API failed:', result?.error || result?.message || 'Unknown error');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run test
testHostBillDirect();
