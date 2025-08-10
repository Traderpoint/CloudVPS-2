/**
 * Test Correct Rounding - Verify 13,423.2 rounds to 13,423 not 13,416
 */

console.log('🧪 Testing Correct Rounding Logic');
console.log('=================================');

// Test data
const testScenarios = [
  {
    name: '24 měsíců + Windows (30% sleva)',
    basePrice: 299,
    osModifier: 500,
    billingPeriod: 24,
    periodDiscount: 30,
    expectedTotal: 13423.2,
    expectedRounded: 13423
  },
  {
    name: '12 měsíců + Linux (20% sleva)',
    basePrice: 299,
    osModifier: 0,
    billingPeriod: 12,
    periodDiscount: 20,
    expectedTotal: 2870.4,
    expectedRounded: 2870
  },
  {
    name: '1 měsíc + Linux (0% sleva)',
    basePrice: 299,
    osModifier: 0,
    billingPeriod: 1,
    periodDiscount: 0,
    expectedTotal: 299,
    expectedRounded: 299
  }
];

// Corrected calculation function
function calculateCorrectPrices(basePrice, osModifier, billingPeriod, periodDiscount) {
  // Step 1: Monthly price with OS modifier
  const monthlyPriceWithOS = basePrice + osModifier;
  
  // Step 2: Total BEFORE discount
  const totalBeforeDiscount = monthlyPriceWithOS * billingPeriod;
  
  // Step 3: Apply discount to TOTAL (not monthly)
  const totalAfterDiscount = totalBeforeDiscount * (1 - periodDiscount / 100);
  
  // Step 4: Monthly price with discount (for HostBill)
  const monthlyPriceWithDiscount = totalAfterDiscount / billingPeriod;
  
  return {
    monthlyPriceWithOS,
    totalBeforeDiscount,
    totalAfterDiscount,
    totalRounded: Math.round(totalAfterDiscount),
    monthlyPriceWithDiscount
  };
}

// Test all scenarios
testScenarios.forEach((scenario, index) => {
  console.log(`\n📋 Test ${index + 1}: ${scenario.name}`);
  console.log('----------------------------------------');
  
  const result = calculateCorrectPrices(
    scenario.basePrice,
    scenario.osModifier,
    scenario.billingPeriod,
    scenario.periodDiscount
  );
  
  console.log('Input:', {
    basePrice: scenario.basePrice + ' CZK/měsíc',
    osModifier: '+' + scenario.osModifier + ' CZK/měsíc',
    billingPeriod: scenario.billingPeriod + ' měsíců',
    periodDiscount: scenario.periodDiscount + '%'
  });
  
  console.log('Calculation Steps:');
  console.log('  1. Monthly with OS:', result.monthlyPriceWithOS + ' CZK/měsíc');
  console.log('  2. Total before discount:', result.totalBeforeDiscount + ' CZK');
  console.log('  3. Apply ' + scenario.periodDiscount + '% discount to total');
  console.log('  4. Total after discount:', result.totalAfterDiscount.toFixed(2) + ' CZK');
  console.log('  5. Rounded total:', result.totalRounded + ' CZK');
  
  console.log('Verification:');
  console.log('  Expected total:', scenario.expectedTotal + ' CZK');
  console.log('  Calculated total:', result.totalAfterDiscount.toFixed(1) + ' CZK');
  console.log('  Expected rounded:', scenario.expectedRounded + ' CZK');
  console.log('  Calculated rounded:', result.totalRounded + ' CZK');
  console.log('  Match:', result.totalRounded === scenario.expectedRounded ? '✅' : '❌');
  
  // Generate CURL command with correct amount
  const curlData = {
    orderId: `ROUNDING-TEST-${scenario.billingPeriod}M`,
    invoiceId: '470',
    method: 'comgate',
    amount: result.totalRounded,
    currency: 'CZK',
    billingPeriod: scenario.billingPeriod.toString(),
    comgateAmount: result.totalRounded,
    hostbillMonthlyAmount: Math.round(result.monthlyPriceWithDiscount * 100) / 100 // Round to 2 decimals
  };
  
  console.log('CURL Test:');
  console.log(`curl -X POST http://localhost:3005/api/payments/initialize -H "Content-Type: application/json" -d '${JSON.stringify(curlData)}'`);
});

console.log('\n🎯 Rounding Verification:');
console.log('========================');
console.log('✅ 13,423.2 CZK → 13,423 CZK (correct)');
console.log('❌ 13,423.2 CZK → 13,416 CZK (incorrect - was happening before)');
console.log('');
console.log('🔍 The issue was:');
console.log('WRONG: Apply discount to monthly price, then multiply');
console.log('  (299 + 500) × 0.7 × 24 = 559.3 × 24 = 13,423.2 → rounds to 13,423');
console.log('  But if 559.3 gets rounded to 559 first: 559 × 24 = 13,416 ❌');
console.log('');
console.log('CORRECT: Multiply first, then apply discount');
console.log('  (299 + 500) × 24 × 0.7 = 19,176 × 0.7 = 13,423.2 → rounds to 13,423 ✅');
console.log('');
console.log('🎯 This ensures proper rounding without intermediate rounding errors!');
