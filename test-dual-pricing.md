# Dual Pricing Test - ComGate vs HostBill

## 🎯 **DUAL PRICING SYSTÉM - RŮZNÉ CENY PRO COMGATE A HOSTBILL**

### **Problém:**
- **ComGate** potřebuje celkovou cenu za billing period (13,423 CZK za 24 měsíců)
- **HostBill** potřebuje měsíční cenu a billing cycle, pak si sám spočítá celkovou cenu

### **Řešení:**
Implementoval jsem dual pricing systém, který počítá obě ceny:

#### **1. Pro ComGate (celková cena):**
```javascript
// Výpočet celkové ceny za billing period
const totalForComGate = monthlyPriceWithDiscount * billingPeriodMonths;
// Příklad: 559 CZK/měsíc × 24 měsíců = 13,416 CZK
```

#### **2. Pro HostBill (měsíční cena):**
```javascript
// Výpočet měsíční ceny s discount
const monthlyPriceWithDiscount = monthlyPriceWithOS * (1 - periodDiscount/100);
// Příklad: 799 CZK/měsíc × 0.7 = 559 CZK/měsíc
```

### **🧪 Test Calculations:**

#### **Test 1: 24 měsíců + Windows (30% sleva)**
```
Base Price: 299 CZK/měsíc
OS Modifier: +500 CZK/měsíc (Windows)
Monthly Price with OS: 799 CZK/měsíc
Period Discount: 30%
Monthly Price with Discount: 799 × 0.7 = 559 CZK/měsíc

For HostBill: 559 CZK/měsíc + cycle: 'b' (24 months)
For ComGate: 559 × 24 = 13,416 CZK (total)
```

#### **Test 2: 12 měsíců + Linux (20% sleva)**
```
Base Price: 299 CZK/měsíc
OS Modifier: +0 CZK/měsíc (Linux)
Monthly Price with OS: 299 CZK/měsíc
Period Discount: 20%
Monthly Price with Discount: 299 × 0.8 = 239 CZK/měsíc

For HostBill: 239 CZK/měsíc + cycle: 'a' (12 months)
For ComGate: 239 × 12 = 2,868 CZK (total)
```

### **📊 CURL Test Commands:**

#### **Test 1: 24 měsíců + Windows**
```bash
curl -X POST http://localhost:3005/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "DUAL-TEST-24M",
    "invoiceId": "470",
    "method": "comgate",
    "amount": 13416,
    "currency": "CZK",
    "billingPeriod": "24",
    "billingCycle": "b",
    "selectedOS": "windows",
    "comgateAmount": 13416,
    "hostbillMonthlyAmount": 559,
    "cartSettings": {
      "selectedPeriod": "24",
      "selectedOS": "windows",
      "periodDiscount": 30,
      "osModifier": 500
    }
  }'
```

**Expected Result:**
- ComGate dostane: 13,416 CZK (celková cena)
- HostBill by měl dostat: 559 CZK/měsíc + cycle: 'b'

#### **Test 2: 12 měsíců + Linux**
```bash
curl -X POST http://localhost:3005/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "DUAL-TEST-12M",
    "invoiceId": "470",
    "method": "comgate",
    "amount": 2868,
    "currency": "CZK",
    "billingPeriod": "12",
    "billingCycle": "a",
    "selectedOS": "linux",
    "comgateAmount": 2868,
    "hostbillMonthlyAmount": 239,
    "cartSettings": {
      "selectedPeriod": "12",
      "selectedOS": "linux",
      "periodDiscount": 20,
      "osModifier": 0
    }
  }'
```

**Expected Result:**
- ComGate dostane: 2,868 CZK (celková cena)
- HostBill by měl dostat: 239 CZK/měsíc + cycle: 'a'

### **🔍 Expected Middleware Logs:**

```
💰 Payment initialization - dual pricing: {
  originalAmount: 13416,
  numericAmount: 13416,
  finalAmount: 13416,
  comgateAmount: 13416,
  hostbillMonthlyAmount: 559,
  method: 'comgate',
  billingPeriod: '24',
  billingCycle: 'b',
  selectedOS: 'windows',
  note: 'ComGate gets total amount, HostBill should get monthly amount + billing cycle'
}
```

### **🌐 Browser Test:**

#### **1. Otevři payment-method stránku:**
```
http://localhost:3000/payment-method
```

#### **2. Nastav cart settings:**
```javascript
const cartSettings = {
  selectedPeriod: '24',
  selectedOS: 'windows',
  selectedApps: ['wordpress', 'mysql']
};
sessionStorage.setItem('cartSettings', JSON.stringify(cartSettings));
location.reload();
```

#### **3. Sleduj console logs:**
```
💰 calculateItemPrices debug: {
  basePrice: '299 CZK/měsíc',
  osModifier: '500 CZK/měsíc',
  monthlyPriceWithOS: '799 CZK/měsíc',
  periodDiscount: '30%',
  monthlyPriceWithDiscount: '559 CZK/měsíc (for HostBill)',
  billingPeriod: '24 měsíců',
  totalForComGate: '13416 CZK (for ComGate)'
}

💰 Dual pricing calculation: {
  comgateAmount: '13416 CZK (total for 24 months)',
  hostbillMonthlyAmount: '559 CZK/month',
  note: 'ComGate gets total amount, HostBill gets monthly amount + billing cycle'
}
```

#### **4. Klikni "Dokončit a odeslat":**
- Payment initialization pošle obě ceny
- ComGate dostane 13,416 CZK
- HostBill by měl dostat 559 CZK/měsíc + cycle: 'b'

### **📋 Verification Checklist:**

- [ ] ✅ **calculateItemPrices()** počítá obě ceny
- [ ] ✅ **getCartTotalForComGate()** vrací celkovou cenu
- [ ] ✅ **getCartMonthlyForHostBill()** vrací měsíční cenu
- [ ] ✅ **Payment initialization** posílá obě ceny
- [ ] ✅ **Middleware** loguje dual pricing
- [ ] ✅ **ComGate** dostane celkovou cenu
- [ ] ✅ **HostBill** by měl dostat měsíční cenu + billing cycle

### **🎯 Expected Results:**

#### **✅ ComGate Payment:**
- **Amount**: 13,416 CZK (celková cena za 24 měsíců)
- **Description**: "Payment for order ... (24 months)"
- **Gateway**: Zobrazí správnou celkovou částku

#### **✅ HostBill Invoice (budoucí implementace):**
- **Monthly Price**: 559 CZK/měsíc
- **Billing Cycle**: 'b' (24 months)
- **Total**: HostBill si spočítá 559 × 24 = 13,416 CZK
- **Invoice**: Faktura na 24 měsíců s měsíční cenou 559 CZK

### **🔧 Next Steps:**

1. **Test dual pricing** pomocí CURL commands
2. **Verify ComGate** dostane správnou celkovou cenu
3. **Implement HostBill integration** pro měsíční ceny
4. **Test complete flow** od košíku po fakturu

**Dual pricing systém je implementován - ComGate dostane celkovou cenu, HostBill dostane měsíční cenu + billing cycle!** 🎯
