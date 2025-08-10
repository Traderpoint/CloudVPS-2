# Billing Period Mapping Test

## 🧪 **Test správného mapování billing period z čísel na HostBill formát**

### **Problém:**
CloudVPS používá billing period jako čísla (1, 3, 6, 12, 24, 36), ale HostBill očekává zkratky (m, q, s, a, b, t). Middleware musí správně mapovat a používat billing period pro výpočet cen.

### **1. Test mapování billing period:**

Otevři browser console na http://localhost:3000/payment a spusť:

```javascript
// Test mapování billing period
console.log('🧪 Testing billing period mapping...');

// Simuluj mapBillingPeriod funkci
const mapBillingPeriod = (period) => {
  const periodMapping = {
    '1': 'm',     // 1 měsíc -> monthly
    '3': 'q',     // 3 měsíce -> quarterly  
    '6': 's',     // 6 měsíců -> semiannually
    '12': 'a',    // 12 měsíců -> annually
    '24': 'b',    // 24 měsíců -> biennially
    '36': 't',    // 36 měsíců -> triennially
  };
  return periodMapping[String(period)] || 'm';
};

// Test všechny podporované periody
const testPeriods = ['1', '3', '6', '12', '24', '36'];
testPeriods.forEach(period => {
  const mapped = mapBillingPeriod(period);
  console.log(`${period} měsíců → ${mapped} (${
    period === '1' ? 'monthly' :
    period === '3' ? 'quarterly' :
    period === '6' ? 'semiannually' :
    period === '12' ? 'annually' :
    period === '24' ? 'biennially' :
    period === '36' ? 'triennially' : 'unknown'
  })`);
});
```

### **2. Test order creation s billing period:**

```javascript
// Simuluj cart settings s různými billing periods
const testBillingPeriods = [
  { period: '1', expectedCycle: 'm', name: '1 měsíc' },
  { period: '12', expectedCycle: 'a', name: '12 měsíců' },
  { period: '24', expectedCycle: 'b', name: '24 měsíců' }
];

testBillingPeriods.forEach(test => {
  console.log(`\n🔄 Testing ${test.name} billing period...`);
  
  const cartSettings = {
    selectedPeriod: test.period,
    selectedOS: 'linux',
    selectedApps: ['wordpress'],
    appliedPromo: null
  };
  
  sessionStorage.setItem('cartSettings', JSON.stringify(cartSettings));
  
  console.log('Cart settings:', cartSettings);
  console.log('Expected billing cycle:', test.expectedCycle);
  console.log('Mapped billing cycle:', mapBillingPeriod(test.period));
  
  // Simuluj order item
  const orderItem = {
    productId: '1',
    productName: 'VPS Basic',
    price: 299, // Base price per month
    quantity: 1,
    period: test.period,
    billingCycle: mapBillingPeriod(test.period),
    cycle: mapBillingPeriod(test.period)
  };
  
  console.log('Order item:', orderItem);
  
  // Očekávaná celková cena (bez slev pro jednoduchost)
  const expectedTotal = 299 * parseInt(test.period);
  console.log(`Expected total: ${expectedTotal} CZK (299 × ${test.period} měsíců)`);
});
```

### **3. Test payment initialization s billing period:**

Po nastavení cart settings a kliknutí "Dokončit a objednat":

```javascript
// Sleduj payment initialization request
console.log('🔍 Monitoring payment initialization...');

// Očekávané údaje v payment request:
const expectedPaymentData = {
  orderId: 'ORDER-123456789',
  invoiceId: '470',
  method: 'comgate',
  amount: 7176, // Příklad pro 24 měsíců s Windows a slevami
  currency: 'CZK',
  billingPeriod: '24',
  billingCycle: 'b', // 24 měsíců = biennially
  selectedOS: 'windows',
  selectedApps: ['wordpress', 'mysql'],
  cartSettings: {
    selectedPeriod: '24',
    selectedOS: 'windows',
    periodDiscount: 30, // 30% sleva za 24 měsíců
    osModifier: 500 // +500 Kč/měsíc za Windows
  }
};

console.log('Expected payment data:', expectedPaymentData);
```

### **4. Test middleware response:**

V middleware logs by mělo být:

```
💰 Payment initialization - amount validation: {
  originalAmount: 7176,
  numericAmount: 7176,
  method: 'comgate',
  billingPeriod: '24',
  billingCycle: 'b',
  selectedOS: 'windows',
  cartSettings: { ... },
  note: 'Amount already calculated with billing period in payment-method page'
}

🔍 DEBUG: Comgate payment data prepared: {
  orderId: 'ORDER-123456789',
  invoiceId: '470',
  amount: 7176,
  description: 'Payment for order ORDER-123456789 (24 months)',
  returnUrl: '...&amount=7176&period=24&os=windows...'
}
```

### **5. Test ComGate gateway:**

ComGate by měl dostat:

```
Amount: 7176 CZK (ne 299 CZK)
Description: "Payment for order ORDER-123456789 (24 months)"
Return URL: obsahuje &amount=7176&period=24&os=windows
```

### **6. Očekávané výsledky:**

#### **✅ Billing Period Mapping:**
- `1` → `m` (monthly)
- `3` → `q` (quarterly)
- `6` → `s` (semiannually)
- `12` → `a` (annually)
- `24` → `b` (biennially)
- `36` → `t` (triennially)

#### **✅ Order Creation:**
- Items obsahují správný `cycle` a `billingCycle`
- Price je vypočítaná s billing period adjustments
- HostBill dostane správné billing cycle zkratky

#### **✅ Payment Initialization:**
- Amount odpovídá billing period výpočtu
- Billing period údaje se předávají do middleware
- Return URLs obsahují billing period parametry

#### **✅ ComGate Gateway:**
- Dostane správnou celkovou částku (ne měsíční)
- Description obsahuje billing period info
- Return flow zachová billing period údaje

### **7. Troubleshooting:**

#### **❌ Pokud se stále používá měsíční cena:**
- Zkontroluj mapBillingPeriod funkci
- Ověř, že se používá v order item mapping
- Zkontroluj payment initialization request

#### **❌ Pokud middleware nerozpozná billing cycle:**
- Zkontroluj middleware logs pro billing period údaje
- Ověř mapování v order-processor.js
- Zkontroluj HostBill API volání

#### **❌ Pokud ComGate dostane špatnou částku:**
- Zkontroluj payment initialization amount
- Ověř výpočet ceny v getCartTotalWithSettings
- Zkontroluj middleware payment data preparation

### **8. Finální test scénář:**

1. **Nastav cart settings** na 24 měsíců + Windows
2. **Otevři payment stránku** - ověř správné ceny
3. **Klikni "Dokončit a objednat"** - sleduj order creation
4. **Zkontroluj order data** - billing cycle = 'b'
5. **Sleduj payment initialization** - amount = celková částka
6. **Ověř ComGate** - dostane správnou částku
7. **Dokončí platbu** - return obsahuje billing period

**Po těchto opravách by middleware měl používat správné billing period pro výpočet cen místo fixní měsíční ceny!** 🎯
