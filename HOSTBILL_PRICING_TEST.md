# HostBill Product Pricing Test

## 🔍 **NOVÝ PRICING TEST PRO DIAGNOSTIKU HOSTBILL CEN**

### **Problém identifikován:**
- ✅ **Billing cycle mapping**: Správně mapuje '24' → 'b'
- ❌ **HostBill ceny**: Billing cycle "Annually" ale cena 0 CZK
- ❌ **Product pricing**: HostBill produkty nemají správně nastavené ceny pro různá období

### **🛠️ Implementovaný test:**

#### **1. Nový API endpoint:**
```
POST /api/hostbill/product-pricing
{
  "product_id": "5",
  "cycle": "b"
}
```

#### **2. Rozšířený test portál:**
```
http://localhost:3000/middleware-affiliate-products
```

#### **3. Test funkcionalita:**
- **Product Selection**: VPS Start (5), VPS Profi (10), VPS Premium (11), VPS Enterprise (12)
- **Billing Cycles**: Monthly (m), Quarterly (q), Semiannually (s), Annually (a), Biennially (b), Triennially (t)
- **Multiple Methods**: getProducts, getProductInfo, basePriceCalculation

### **🧪 Test Scenarios:**

#### **Test 1: VPS Start (Product ID 5)**
```javascript
// Test všechna billing období
const billingCycles = [
  { code: 'm', name: 'Monthly (1 month)', period: '1' },
  { code: 'q', name: 'Quarterly (3 months)', period: '3' },
  { code: 's', name: 'Semiannually (6 months)', period: '6' },
  { code: 'a', name: 'Annually (12 months)', period: '12' },
  { code: 'b', name: 'Biennially (24 months)', period: '24' },
  { code: 't', name: 'Triennially (36 months)', period: '36' }
];
```

#### **Expected Results:**
```
✅ Monthly (m): 299 CZK
✅ Quarterly (q): 299 CZK (nebo jiná cena)
✅ Semiannually (s): 299 CZK (nebo jiná cena)
❌ Annually (a): 0 CZK (problém!)
❌ Biennially (b): 0 CZK (problém!)
❌ Triennially (t): 0 CZK (problém!)
```

### **📊 API Methods:**

#### **Method 1: getProducts**
```javascript
const productsResult = await hostbillClient.makeApiCall({
  call: 'getProducts'
});

// Extract pricing for specific cycle
if (product.pricing && product.pricing[cycle]) {
  price = parseFloat(product.pricing[cycle].price || 0);
  setupFee = parseFloat(product.pricing[cycle].setup || 0);
}
```

#### **Method 2: getProductInfo**
```javascript
const productInfoResult = await hostbillClient.makeApiCall({
  call: 'getProductInfo',
  id: product_id
});
```

#### **Method 3: Base Price Calculation (Fallback)**
```javascript
const basePrices = {
  '5': 299,   // VPS Start
  '10': 599,  // VPS Profi
  '11': 999,  // VPS Premium
  '12': 1999  // VPS Enterprise
};
```

### **🌐 Browser Test:**

#### **1. Otevři test portál:**
```
http://localhost:3000/middleware-affiliate-products
```

#### **2. Najdi "Product Pricing Test" sekci**

#### **3. Vyber produkt:**
- VPS Start (5) - základní test
- VPS Profi (10) - pokročilý test

#### **4. Klikni "Test Pricing"**

#### **5. Sleduj výsledky:**
```
📊 Pricing Results for Product 5

✅ Monthly (1 month): 299 CZK
✅ Quarterly (3 months): 299 CZK
✅ Semiannually (6 months): 299 CZK
❌ Annually (12 months): 0 CZK - Error: No pricing data
❌ Biennially (24 months): 0 CZK - Error: No pricing data
❌ Triennially (36 months): 0 CZK - Error: No pricing data
```

### **🔍 Expected Findings:**

#### **✅ Pokud HostBill má správně nastavené ceny:**
```
Monthly (m): 299 CZK
Quarterly (q): 299 CZK
Semiannually (s): 299 CZK
Annually (a): 299 CZK
Biennially (b): 299 CZK
Triennially (t): 299 CZK
```

#### **❌ Pokud HostBill nemá nastavené ceny (současný stav):**
```
Monthly (m): 299 CZK (funguje)
Quarterly (q): 0 CZK (chybí)
Semiannually (s): 0 CZK (chybí)
Annually (a): 0 CZK (chybí) ← Problém!
Biennially (b): 0 CZK (chybí) ← Problém!
Triennially (t): 0 CZK (chybí)
```

### **📋 Diagnostic Steps:**

#### **1. Test všechny produkty:**
```
Product 5 (VPS Start): Test všechna období
Product 10 (VPS Profi): Test všechna období
Product 11 (VPS Premium): Test všechna období
Product 12 (VPS Enterprise): Test všechna období
```

#### **2. Identifikuj chybějící ceny:**
```
Které billing cycles mají cenu 0?
Které produkty mají problém?
Které API metody fungují?
```

#### **3. Ověř HostBill konfiguraci:**
```
Admin → Products → VPS Start → Pricing
Zkontroluj, zda jsou nastavené ceny pro:
- Monthly
- Quarterly  
- Semiannually
- Annually ← Pravděpodobně chybí
- Biennially ← Pravděpodobně chybí
- Triennially
```

### **🛠️ Možná řešení:**

#### **Řešení 1: Nastavit ceny v HostBill Admin**
```
1. Přihlásit se do HostBill Admin
2. Products → VPS Start (ID 5)
3. Pricing tab
4. Nastavit ceny pro všechna období:
   - Annually: 299 CZK
   - Biennially: 299 CZK
   - Triennially: 299 CZK
```

#### **Řešení 2: Použít fallback pricing v kódu**
```javascript
// Pokud HostBill nevrátí cenu, použij base price
const fallbackPrice = basePrices[product_id] || 299;
if (price === 0 && fallbackPrice > 0) {
  price = fallbackPrice;
}
```

#### **Řešení 3: Custom pricing logic**
```javascript
// Implementovat vlastní pricing logiku
const calculatePrice = (basePrice, cycle) => {
  switch(cycle) {
    case 'm': return basePrice;
    case 'q': return basePrice; // Nebo jiná logika
    case 's': return basePrice;
    case 'a': return basePrice;
    case 'b': return basePrice;
    case 't': return basePrice;
    default: return basePrice;
  }
};
```

### **🎯 Expected Test Results:**

#### **Pokud test ukáže problém:**
```
❌ Annually (a): 0 CZK - HostBill nemá nastavené ceny
❌ Biennially (b): 0 CZK - HostBill nemá nastavené ceny

→ Řešení: Nastavit ceny v HostBill Admin
```

#### **Pokud test ukáže správné ceny:**
```
✅ Annually (a): 299 CZK - HostBill má správné ceny
✅ Biennially (b): 299 CZK - HostBill má správné ceny

→ Problém je jinde (možná v order creation)
```

### **📊 CURL Test Commands:**

#### **Test VPS Start - Annually:**
```bash
curl -X POST http://localhost:3005/api/hostbill/product-pricing \
  -H "Content-Type: application/json" \
  -d '{"product_id":"5","cycle":"a"}'
```

#### **Test VPS Start - Biennially:**
```bash
curl -X POST http://localhost:3005/api/hostbill/product-pricing \
  -H "Content-Type: application/json" \
  -d '{"product_id":"5","cycle":"b"}'
```

## 🎉 **Shrnutí:**

**✅ Nový pricing test implementován**
**✅ Diagnostika všech billing cycles**
**✅ Multiple API methods pro testování**
**✅ UI pro snadné testování**

**Test odhalí, zda je problém v HostBill pricing konfiguraci nebo v našem kódu!** 🎯

**Spusť test na: http://localhost:3000/middleware-affiliate-products**
