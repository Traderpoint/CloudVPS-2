// Debug script to check cart data structure
// This simulates what billing.js receives from useCart()

console.log('🔍 Debugging cart data structure...');

// Simulate cart data as it would appear in localStorage
const simulatedCartData = {
  items: [
    {
      id: 1,
      name: 'VPS Start',
      cpu: '2 jádra',
      ram: '4 GB',
      storage: '50 GB',
      price: '249 Kč',
      hostbillPid: 5,
      quantity: 2  // This should be 2 according to the image
    },
    {
      id: 2,
      name: 'VPS Profi',
      cpu: '4 jádra',
      ram: '8 GB',
      storage: '100 GB',
      price: '499 Kč',
      hostbillPid: 10,
      quantity: 1  // This should be 1 according to the image
    }
  ],
  total: 0,
  itemCount: 0,
  affiliateId: null,
  affiliateCode: null
};

console.log('📋 Simulated cart data:');
console.log(JSON.stringify(simulatedCartData, null, 2));

console.log('\n🔄 Processing items like billing.js does:');

simulatedCartData.items.forEach((item, index) => {
  // Parse price from string format (e.g., "249 Kč" -> 249)
  const itemPrice = typeof item.price === 'string' 
    ? parseFloat(item.price.replace(/[^\d]/g, '')) 
    : parseFloat(item.price) || 0;
  
  console.log(`\n📦 Item ${index + 1}:`);
  console.log(`  Name: ${item.name}`);
  console.log(`  Original price: ${item.price}`);
  console.log(`  Parsed price: ${itemPrice}`);
  console.log(`  Quantity: ${item.quantity || 1}`);
  console.log(`  HostBill PID: ${item.hostbillPid}`);
  console.log(`  Subtotal: ${itemPrice * (item.quantity || 1)} Kč`);
  
  // This is what gets sent to the API
  const apiItem = {
    productId: item.hostbillPid || item.id,
    name: item.name,
    price: itemPrice,
    cycle: 'm',
    quantity: item.quantity || 1,
    configOptions: {
      cpu: item.cpu || '2 vCPU',
      ram: item.ram || '4GB',
      storage: item.storage || '50GB',
      os: 'linux',
      bandwidth: '1TB'
    }
  };
  
  console.log(`  API item:`, JSON.stringify(apiItem, null, 4));
});

console.log('\n💰 Expected totals:');
const expectedTotal = simulatedCartData.items.reduce((total, item) => {
  const itemPrice = typeof item.price === 'string' 
    ? parseFloat(item.price.replace(/[^\d]/g, '')) 
    : parseFloat(item.price) || 0;
  return total + (itemPrice * (item.quantity || 1));
}, 0);

console.log(`  Total: ${expectedTotal} Kč`);
console.log(`  VPS Start: 249 × 2 = ${249 * 2} Kč`);
console.log(`  VPS Profi: 499 × 1 = ${499 * 1} Kč`);
console.log(`  Sum: ${249 * 2 + 499 * 1} Kč`);

console.log('\n✅ If this matches the image, the problem is elsewhere.');
console.log('❌ If this doesn\'t match, the problem is in cart data structure.');
