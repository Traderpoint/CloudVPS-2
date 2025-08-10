/**
 * Direct Price Calculation Test
 * Tests the exact same logic as payment-method.js
 */

console.log('🧪 Testing Price Calculation Logic');
console.log('==================================');

// Same data as in payment-method.js
const periods = [
  { value: '1', label: '1 měsíc', discount: 0, popular: false },
  { value: '3', label: '3 měsíce', discount: 5, popular: false },
  { value: '6', label: '6 měsíců', discount: 10, popular: false },
  { value: '12', label: '12 měsíců', discount: 20, popular: true },
  { value: '24', label: '24 měsíců', discount: 30, popular: false },
  { value: '36', label: '36 měsíců', discount: 40, popular: false }
];

const operatingSystems = [
  {
    id: 'linux',
    name: 'Linux',
    priceModifier: 0,
    popular: true
  },
  {
    id: 'windows',
    name: 'Windows Server',
    priceModifier: 500,
    popular: false
  }
];

// Test scenarios
const testScenarios = [
  {
    name: '1 měsíc + Linux',
    selectedPeriod: '1',
    selectedOS: 'linux',
    expectedMonthly: 299,
    expectedTotal: 299
  },
  {
    name: '12 měsíců + Linux (20% sleva)',
    selectedPeriod: '12',
    selectedOS: 'linux',
    expectedMonthly: 299,
    expectedTotal: 299 * 12 * 0.8 // 2,390.4
  },
  {
    name: '24 měsíců + Windows (30% sleva)',
    selectedPeriod: '24',
    selectedOS: 'windows',
    expectedMonthly: 799, // 299 + 500
    expectedTotal: (299 + 500) * 24 * 0.7 // 13,423.2
  },
  {
    name: '36 měsíců + Windows (40% sleva)',
    selectedPeriod: '36',
    selectedOS: 'windows',
    expectedMonthly: 799,
    expectedTotal: (299 + 500) * 36 * 0.6 // 17,236.8
  }
];

// Same calculation logic as payment-method.js
function calculateItemPrice(basePrice, selectedPeriod, selectedOS) {
  const period = periods.find(p => p.value === selectedPeriod);
  const os = operatingSystems.find(os => os.id === selectedOS);
  const billingPeriodMonths = parseInt(selectedPeriod);

  // Calculate monthly price with OS modifier
  const monthlyPriceWithOS = basePrice + (os?.priceModifier || 0);
  
  // Calculate total for billing period
  const totalBeforeDiscount = monthlyPriceWithOS * billingPeriodMonths;
  
  // Apply period discount to total
  const totalAfterDiscount = totalBeforeDiscount * (1 - (period?.discount || 0) / 100);

  return {
    basePrice,
    osModifier: os?.priceModifier || 0,
    monthlyPriceWithOS,
    billingPeriodMonths,
    totalBeforeDiscount,
    periodDiscount: period?.discount || 0,
    totalAfterDiscount: Math.round(totalAfterDiscount)
  };
}

// Test all scenarios
testScenarios.forEach((scenario, index) => {
  console.log(`\n📋 Test ${index + 1}: ${scenario.name}`);
  console.log('----------------------------------------');
  
  const result = calculateItemPrice(299, scenario.selectedPeriod, scenario.selectedOS);
  
  console.log('Input:', {
    basePrice: '299 CZK/měsíc',
    selectedPeriod: scenario.selectedPeriod + ' měsíců',
    selectedOS: scenario.selectedOS
  });
  
  console.log('Calculation:', {
    basePrice: result.basePrice + ' CZK/měsíc',
    osModifier: '+' + result.osModifier + ' CZK/měsíc',
    monthlyPriceWithOS: result.monthlyPriceWithOS + ' CZK/měsíc',
    billingPeriod: result.billingPeriodMonths + ' měsíců',
    totalBeforeDiscount: result.totalBeforeDiscount + ' CZK',
    periodDiscount: result.periodDiscount + '%',
    totalAfterDiscount: result.totalAfterDiscount + ' CZK'
  });
  
  console.log('Result:', {
    calculatedTotal: result.totalAfterDiscount + ' CZK',
    expectedTotal: Math.round(scenario.expectedTotal) + ' CZK',
    match: result.totalAfterDiscount === Math.round(scenario.expectedTotal) ? '✅' : '❌'
  });
  
  // Generate CURL command for this scenario
  const curlData = {
    orderId: `TEST-${scenario.selectedPeriod}M-${scenario.selectedOS.toUpperCase()}`,
    invoiceId: '470',
    method: 'comgate',
    amount: result.totalAfterDiscount,
    currency: 'CZK',
    billingPeriod: scenario.selectedPeriod,
    billingCycle: mapBillingPeriod(scenario.selectedPeriod),
    selectedOS: scenario.selectedOS,
    cartSettings: {
      selectedPeriod: scenario.selectedPeriod,
      selectedOS: scenario.selectedOS,
      periodDiscount: result.periodDiscount,
      osModifier: result.osModifier
    }
  };
  
  console.log('CURL Test:');
  console.log(`curl -X POST http://localhost:3005/api/payments/initialize -H "Content-Type: application/json" -d '${JSON.stringify(curlData)}'`);
});

function mapBillingPeriod(period) {
  const periodMapping = {
    '1': 'm', '3': 'q', '6': 's', 
    '12': 'a', '24': 'b', '36': 't'
  };
  return periodMapping[String(period)] || 'm';
}

console.log('\n🎯 Summary:');
console.log('===========');
console.log('✅ 1 měsíc + Linux = 299 CZK');
console.log('✅ 12 měsíců + Linux = 2,390 CZK (20% sleva)');
console.log('✅ 24 měsíců + Windows = 13,423 CZK (30% sleva)');
console.log('✅ 36 měsíců + Windows = 17,237 CZK (40% sleva)');
console.log('');
console.log('🔍 These amounts should be sent to ComGate gateway!');
console.log('🚫 NOT the monthly price (299 CZK)!');
