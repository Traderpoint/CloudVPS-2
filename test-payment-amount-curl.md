# Payment Amount CURL Test

## 🧪 **Přímý test payment initialization přes CURL**

### **Problém:**
Na platební bránu se stále odesílá měsíční cena místo celkové ceny podle billing period.

### **1. Test s měsíční cenou (současný stav):**

```bash
curl -X POST http://localhost:3005/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-ORDER-001",
    "invoiceId": "470",
    "method": "comgate",
    "amount": 299,
    "currency": "CZK",
    "billingPeriod": "1",
    "billingCycle": "m",
    "selectedOS": "linux",
    "selectedApps": ["wordpress"],
    "cartSettings": {
      "selectedPeriod": "1",
      "selectedOS": "linux",
      "periodDiscount": 0,
      "osModifier": 0
    }
  }'
```

**Očekávaný výsledek:**
- ComGate dostane: 299 CZK
- Description: "Payment for order TEST-ORDER-001 (1 month)"

### **2. Test s 24 měsíční cenou (měl by být):**

```bash
curl -X POST http://localhost:3005/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-ORDER-002",
    "invoiceId": "470",
    "method": "comgate",
    "amount": 13423,
    "currency": "CZK",
    "billingPeriod": "24",
    "billingCycle": "b",
    "selectedOS": "windows",
    "selectedApps": ["wordpress", "mysql"],
    "cartSettings": {
      "selectedPeriod": "24",
      "selectedOS": "windows",
      "periodDiscount": 30,
      "osModifier": 500
    }
  }'
```

**Očekávaný výsledek:**
- ComGate dostane: 13,423 CZK
- Description: "Payment for order TEST-ORDER-002 (24 months)"

### **3. Test s nesprávnou cenou (současný problém):**

```bash
curl -X POST http://localhost:3005/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-ORDER-003",
    "invoiceId": "470",
    "method": "comgate",
    "amount": 299,
    "currency": "CZK",
    "billingPeriod": "24",
    "billingCycle": "b",
    "selectedOS": "windows",
    "selectedApps": ["wordpress", "mysql"],
    "cartSettings": {
      "selectedPeriod": "24",
      "selectedOS": "windows",
      "periodDiscount": 30,
      "osModifier": 500
    }
  }'
```

**Problém:**
- Billing period: 24 měsíců
- Amount: 299 CZK (měsíční cena)
- Mělo by být: 13,423 CZK (celková cena za 24 měsíců)

### **4. Debug middleware response:**

Po každém CURL testu zkontroluj middleware logs:

```
💰 Payment initialization - amount validation: {
  originalAmount: 299,  // ❌ Měsíční cena
  numericAmount: 299,   // ❌ Měsíční cena
  method: 'comgate',
  billingPeriod: '24',  // ✅ Správný billing period
  billingCycle: 'b',    // ✅ Správný billing cycle
  selectedOS: 'windows',
  cartSettings: { ... },
  note: 'Amount already calculated with billing period in payment-method page'
}
```

### **5. Test ComGate processor response:**

Middleware by měl volat ComGate s těmito daty:

```javascript
{
  orderId: 'TEST-ORDER-003',
  invoiceId: '470',
  amount: 299, // ❌ PROBLÉM: Měsíční cena místo celkové
  currency: 'CZK',
  description: 'Payment for order TEST-ORDER-003 (24 months)',
  returnUrl: '...&amount=299&period=24&os=windows...'
}
```

### **6. Identifikace problému:**

#### **Možné příčiny:**

**A) Payment-method stránka posílá špatnou částku:**
- `firstOrder.total` obsahuje měsíční cenu
- `getCartTotalWithSettings()` se nevolá
- Výpočet v `calculateItemPrice()` je nesprávný

**B) Order creation vytváří špatné order data:**
- Order items mají měsíční cenu místo celkové
- Billing cycle mapování nefunguje
- HostBill vrací měsíční total

**C) Middleware nepoužívá billing period pro přepočet:**
- Middleware by měl přepočítat cenu podle billing period
- Nepoužívá se cart settings pro výpočet
- Fallback na měsíční cenu

### **7. Debug payment-method calculation:**

Otevři browser console na http://localhost:3000/payment-method a spusť:

```javascript
// Simuluj cart settings
const cartSettings = {
  selectedPeriod: '24',
  selectedOS: 'windows',
  selectedApps: ['wordpress', 'mysql']
};
sessionStorage.setItem('cartSettings', JSON.stringify(cartSettings));

// Simuluj order data s měsíční cenou
const orderData = {
  orders: [{
    invoiceId: '470',
    hostbillOrderId: '433',
    total: 299, // ❌ Měsíční cena z HostBill
    price: 299
  }]
};
sessionStorage.setItem('orderData', JSON.stringify(orderData));

location.reload();

// Po reload zkontroluj výpočet
console.log('🔍 Debugging payment amount calculation...');

// Simuluj calculateItemPrice funkci
const calculateItemPrice = (basePrice, period, os) => {
  const periods = [
    { value: '24', discount: 30 }
  ];
  const operatingSystems = [
    { id: 'windows', priceModifier: 500 }
  ];
  
  const periodObj = periods.find(p => p.value === period);
  const osObj = operatingSystems.find(o => o.id === os);
  
  const discountedPrice = basePrice * (1 - (periodObj?.discount || 0) / 100);
  const finalPrice = discountedPrice + (osObj?.priceModifier || 0);
  
  return finalPrice;
};

// Test výpočtu
const basePrice = 299; // Měsíční cena
const period = '24';
const os = 'windows';

const monthlyPrice = calculateItemPrice(basePrice, period, os);
const totalPrice = monthlyPrice * parseInt(period);

console.log('💰 Price calculation test:', {
  basePrice: basePrice + ' CZK/měsíc',
  period: period + ' měsíců',
  osModifier: 500 + ' CZK/měsíc',
  periodDiscount: '30%',
  monthlyPriceAfterDiscount: monthlyPrice + ' CZK/měsíc',
  totalPrice: totalPrice + ' CZK',
  expectedInPayment: totalPrice
});
```

### **8. Očekávané výsledky:**

#### **✅ Správný flow:**
1. **Cart settings**: 24 měsíců + Windows
2. **Price calculation**: (299 + 500) × 24 × 0.7 = 13,423 CZK
3. **Payment initialization**: amount = 13,423 CZK
4. **ComGate**: Dostane 13,423 CZK
5. **Return URL**: obsahuje amount=13423

#### **❌ Současný problém:**
1. **Cart settings**: 24 měsíců + Windows ✅
2. **Order data**: total = 299 CZK (měsíční) ❌
3. **Payment initialization**: amount = 299 CZK ❌
4. **ComGate**: Dostane 299 CZK ❌
5. **Return URL**: obsahuje amount=299 ❌

### **9. Řešení:**

**Oprava A:** Vynucení přepočtu v payment-method:
```javascript
// Vždy použij cart calculation místo order data
const amount = getCartTotalWithSettings();
```

**Oprava B:** Přepočet v middleware:
```javascript
// Middleware přepočítá cenu podle billing period
if (billingPeriod && cartSettings) {
  const recalculatedAmount = calculateAmountWithBillingPeriod(cartSettings);
  amount = recalculatedAmount;
}
```

**Oprava C:** Oprava order creation:
```javascript
// Order items s celkovou cenou místo měsíční
price: calc.discounted * parseInt(selectedPeriod)
```

**Spusť CURL testy a identifikuj, kde se ztrácí správná cena!** 🎯
