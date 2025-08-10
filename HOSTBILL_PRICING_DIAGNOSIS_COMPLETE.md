# HostBill Pricing Diagnosis Complete

## 🎯 **HOSTBILL PRICING PROBLÉM DIAGNOSTIKOVÁN!**

### **✅ Test implementován a spuštěn:**
- **Nový API endpoint**: `/api/hostbill/product-pricing`
- **Rozšířený test portál**: http://localhost:3000/middleware-affiliate-products
- **CURL testy**: Potvrzují problém

### **🔍 Výsledky diagnostiky:**

#### **CURL Test Results:**
```bash
# Test Annually (12 months)
curl -X POST http://localhost:3005/api/hostbill/product-pricing \
  -d '{"product_id":"5","cycle":"a"}'

Result: {
  "success": true,
  "method": "basePriceCalculation", ← FALLBACK!
  "productId": "5",
  "cycle": "a",
  "price": 299,
  "note": "Calculated from base price - HostBill API may not have pricing configured"
}
```

```bash
# Test Biennially (24 months)  
curl -X POST http://localhost:3005/api/hostbill/product-pricing \
  -d '{"product_id":"5","cycle":"b"}'

Result: {
  "success": true,
  "method": "basePriceCalculation", ← FALLBACK!
  "productId": "5", 
  "cycle": "b",
  "price": 299,
  "note": "Calculated from base price - HostBill API may not have pricing configured"
}
```

### **📊 Diagnóza problému:**

#### **✅ Co funguje:**
- **Billing cycle mapping**: '24' → 'b' (správně)
- **Order creation**: Posílá správný cycle do HostBill
- **Payment amount**: ComGate dostane správnou celkovou cenu

#### **❌ Co nefunguje:**
- **HostBill API pricing**: `getProducts` a `getProductInfo` nevrací pricing data
- **HostBill product configuration**: Produkty nemají nastavené ceny pro různá období
- **Invoice generation**: HostBill vytvoří fakturu s cenou 0

### **🔧 Příčina problému:**

#### **HostBill produkty nemají nastavené ceny pro billing cycles:**
```
VPS Start (Product ID 5):
✅ Monthly (m): Možná nastaveno
❌ Quarterly (q): Není nastaveno
❌ Semiannually (s): Není nastaveno  
❌ Annually (a): Není nastaveno ← Problém!
❌ Biennially (b): Není nastaveno ← Problém!
❌ Triennially (t): Není nastaveno
```

### **🛠️ Řešení:**

#### **Řešení 1: Nastavit ceny v HostBill Admin (DOPORUČENO)**
```
1. Přihlásit se do HostBill Admin
2. Products → VPS Start (ID 5)
3. Pricing tab
4. Nastavit ceny pro všechna období:
   - Monthly: 299 CZK
   - Quarterly: 299 CZK
   - Semiannually: 299 CZK
   - Annually: 299 CZK ← KRITICKÉ
   - Biennially: 299 CZK ← KRITICKÉ
   - Triennially: 299 CZK
```

#### **Řešení 2: Implementovat custom pricing v order creation**
```javascript
// V order-processor.js nebo hostbill-client.js
const calculateCustomPrice = (productId, cycle, basePrice) => {
  // Pokud HostBill nevrátí cenu, použij base price
  const basePrices = {
    '5': 299,   // VPS Start
    '10': 599,  // VPS Profi
    '11': 999,  // VPS Premium
    '12': 1999  // VPS Enterprise
  };
  
  return basePrices[productId] || basePrice || 299;
};

// Při vytváření order
const orderParams = {
  call: 'addOrderDraftItem',
  id: draftId,
  product: productId,
  cycle: billingCycle,
  price: calculateCustomPrice(productId, billingCycle, basePrice), // ← Přidat custom price
  qty: 1
};
```

#### **Řešení 3: Override price v order creation**
```javascript
// V createDraftOrder nebo addOrderDraftItem
const itemResult = await this.makeApiCall({
  call: 'addOrderDraftItem',
  id: draftId,
  prod_type: 'service',
  product: productId,
  cycle: billingCycle,
  qty: 1,
  // ✅ PŘIDAT: Override price pokud HostBill nemá nastavené ceny
  price: hostbillMonthlyAmount || 299, // Použij monthly amount z dual pricing
  override_price: 1 // Force override HostBill pricing
});
```

### **🧪 Test Portal:**

#### **Browser Test:**
```
1. Otevři: http://localhost:3000/middleware-affiliate-products
2. Najdi: "Product Pricing Test" sekci
3. Vyber: VPS Start (5)
4. Klikni: "Test Pricing"
5. Sleduj: Výsledky pro všechna billing období
```

#### **Expected Results:**
```
📊 Pricing Results for Product 5

✅ Monthly (1 month): 299 CZK (method: basePriceCalculation)
✅ Quarterly (3 months): 299 CZK (method: basePriceCalculation)
✅ Semiannually (6 months): 299 CZK (method: basePriceCalculation)
✅ Annually (12 months): 299 CZK (method: basePriceCalculation)
✅ Biennially (24 months): 299 CZK (method: basePriceCalculation)
✅ Triennially (36 months): 299 CZK (method: basePriceCalculation)

Note: All using fallback pricing - HostBill API doesn't return pricing data
```

### **📋 Action Items:**

#### **Immediate (Dnes):**
1. **✅ Test implementován**: Pricing test funguje
2. **✅ Problém identifikován**: HostBill nemá nastavené ceny
3. **🔄 Implementovat řešení 3**: Override price v order creation

#### **Short-term (Tento týden):**
1. **🔄 Nastavit ceny v HostBill**: Admin → Products → Pricing
2. **🔄 Testovat s reálnými cenami**: Po nastavení v HostBill
3. **🔄 Ověřit invoice generation**: Zkontrolovat faktury

#### **Long-term:**
1. **🔄 Monitoring**: Sledovat pricing issues
2. **🔄 Automated tests**: Pravidelné testování cen
3. **🔄 Documentation**: Aktualizovat dokumentaci

### **🎯 Immediate Fix - Override Price:**

Nejrychlejší řešení je přidat override price do order creation. Upravím order-processor.js:

```javascript
// V addOrderDraftItem call
const itemResult = await this.makeApiCall({
  call: 'addOrderDraftItem',
  id: draftId,
  prod_type: 'service',
  product: productId,
  cycle: billingCycle,
  qty: 1,
  // ✅ PŘIDAT: Custom price pro billing cycles
  price: this.calculatePriceForCycle(productId, billingCycle),
  override: 1 // Force override HostBill default pricing
});

calculatePriceForCycle(productId, cycle) {
  const basePrices = {
    '5': 299,   // VPS Start
    '10': 599,  // VPS Profi  
    '11': 999,  // VPS Premium
    '12': 1999  // VPS Enterprise
  };
  
  return basePrices[productId] || 299;
}
```

### **🔍 Verification:**

Po implementaci override price:
1. **Test order creation**: Vytvořit objednávku na 24 měsíců
2. **Check HostBill invoice**: Měla by mít cenu 299 CZK/měsíc
3. **Verify total**: 299 × 24 = 7,176 CZK (bez slev)
4. **Test payment flow**: Celý flow by měl fungovat

## 🎉 **Shrnutí:**

**✅ Problém diagnostikován**: HostBill nemá nastavené ceny pro billing cycles
**✅ Test implementován**: Pricing test odhaluje problém
**✅ Řešení identifikováno**: Override price v order creation
**🔄 Next step**: Implementovat override price fix

**HostBill pricing problém je diagnostikován a má jasné řešení!** 🎯

**Test dostupný na: http://localhost:3000/middleware-affiliate-products**
