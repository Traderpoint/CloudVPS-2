# Pricing Test Improved

## 🎯 **PRICING TEST UPRAVEN A VYLEPŠEN!**

### ✅ **Provedené úpravy:**

#### **1. ✅ Odstraněna duplicitní sekce:**
- **PŘED**: Dvě identické "Quick Affiliate Links" sekce
- **PO**: Pouze jedna sekce, čistší UI

#### **2. ✅ Přidána affiliate podpora do pricing testu:**
- **PŘED**: Test ignoroval affiliate ID
- **PO**: Test používá aktuální affiliate ID

#### **3. ✅ Rozšířené API endpoint:**
- **PŘED**: Pouze product_id a cycle
- **PO**: Přidán affiliate_id parametr

#### **4. ✅ Vylepšené UI zobrazení:**
- **PŘED**: Základní informace
- **PO**: Zobrazuje affiliate ID, method, detailní informace

### **🔧 Implementované změny:**

#### **Frontend (middleware-affiliate-products.js):**
```javascript
// ✅ Přidán affiliate_id do API call
body: JSON.stringify({
  product_id: productId,
  cycle: cycle.code,
  affiliate_id: affiliateId // ← NOVÉ
})

// ✅ Rozšířené zobrazení výsledků
<h4>📊 Pricing Results for Product {pricingData.productId} (Affiliate #{pricingData.affiliateId})</h4>

// ✅ Zobrazení method pro každý výsledek
{result.method && (
  <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
    Method: {result.method}
  </div>
)}
```

#### **Backend (product-pricing.js):**
```javascript
// ✅ Přidán affiliate_id parametr
const { product_id, cycle = 'm', affiliate_id } = req.body;

// ✅ Affiliate info v logu
logger.info('🔍 Testing product pricing', {
  productId: product_id,
  cycle: cycle,
  affiliateId: affiliate_id || 'not specified'
});

// ✅ Affiliate ID v response
return res.status(200).json({
  success: true,
  method: 'basePriceCalculation',
  productId: product_id,
  cycle: cycle,
  price: basePrice,
  affiliateId: affiliate_id || null, // ← NOVÉ
  timestamp: new Date().toISOString()
});
```

### **🧪 Test Results:**

#### **✅ CURL Test s affiliate ID:**
```bash
curl -X POST http://localhost:3005/api/hostbill/product-pricing \
  -H "Content-Type: application/json" \
  -d '{"product_id":"5","cycle":"b","affiliate_id":"1"}'

Response: {
  "success": true,
  "method": "basePriceCalculation",
  "productId": "5",
  "cycle": "b",
  "price": 299,
  "affiliateId": "1", ← NOVÉ
  "note": "Calculated from base price - HostBill API may not have pricing configured"
}
```

#### **✅ Browser Test:**
```
1. Otevři: http://localhost:3000/middleware-affiliate-products
2. Vyber affiliate (např. #1 - Ales Kabel)
3. Najdi "Product Pricing Test" sekci
4. Zobrazí: "Current Affiliate: #1 | View Mode: affiliate"
5. Vyber produkt a klikni "Test Pricing"
6. Výsledky ukážou affiliate ID a method pro každé období
```

### **📊 Expected UI:**

#### **Pricing Test Section:**
```
🔍 Product Pricing Test
Test HostBill product pricing for different billing cycles to diagnose pricing issues.
Current Affiliate: #1 | View Mode: affiliate

Product ID: [VPS Start (5) ▼]  [🔍 Test Pricing]

📊 Pricing Results for Product 5 (Affiliate #1)

✅ Monthly (1 month): 299 CZK
   Code: m | Period: 1 months
   Method: basePriceCalculation

✅ Biennially (24 months): 299 CZK  
   Code: b | Period: 24 months
   Method: basePriceCalculation

Tested at: 4.8.2025, 20:23:43
```

### **🔍 Diagnostic Information:**

#### **✅ Co test nyní zobrazuje:**
- **Affiliate ID**: Který affiliate se testuje
- **Method**: Jaká metoda se použila (getProducts, getProductInfo, basePriceCalculation)
- **Pricing Source**: Odkud pochází cena
- **Error Details**: Detailní chybové zprávy

#### **✅ Možné výsledky:**
```
Method: getProducts → HostBill API vrátil pricing data ✅
Method: getProductInfo → HostBill API vrátil product info ✅  
Method: basePriceCalculation → Fallback pricing ⚠️
Method: error → API call selhal ❌
```

### **🎯 Význam pro diagnostiku:**

#### **Pokud vidíš "basePriceCalculation":**
```
✅ API funguje
❌ HostBill nemá nastavené ceny pro billing cycles
→ Řešení: Nastavit ceny v HostBill Admin
```

#### **Pokud vidíš "getProducts" nebo "getProductInfo":**
```
✅ API funguje
✅ HostBill má nastavené ceny
→ Problém je jinde (možná v order creation)
```

#### **Pokud vidíš "error":**
```
❌ API nefunguje
❌ Middleware problém
→ Řešení: Zkontrolovat middleware a HostBill API
```

### **📋 Verification Checklist:**

- [ ] ✅ **Duplicitní sekce odstraněna**: Pouze jedna Quick Affiliate Links
- [ ] ✅ **Affiliate ID podporováno**: Test používá aktuální affiliate
- [ ] ✅ **Method zobrazeno**: Vidíš, jaká metoda se použila
- [ ] ✅ **UI vylepšeno**: Čistší a informativnější zobrazení
- [ ] ✅ **API rozšířeno**: Podporuje affiliate_id parametr
- [ ] ✅ **CURL test funguje**: S affiliate ID parametrem

### **🌐 Browser Test Steps:**

#### **1. Otevři test portál:**
```
http://localhost:3000/middleware-affiliate-products
```

#### **2. Vyber affiliate:**
```
Klikni na: "#1 - Ales Kabel" (nebo jiný affiliate)
```

#### **3. Najdi Pricing Test:**
```
Scroll dolů k "🔍 Product Pricing Test" sekci
```

#### **4. Spusť test:**
```
Product ID: VPS Start (5)
Klikni: "🔍 Test Pricing"
```

#### **5. Sleduj výsledky:**
```
📊 Pricing Results for Product 5 (Affiliate #1)

Každý řádek ukáže:
- Billing cycle name
- Code a period
- Method (basePriceCalculation, getProducts, atd.)
- Price nebo error
```

### **🔧 Next Steps:**

#### **Immediate:**
1. **✅ Test upraven**: Funguje s affiliate ID
2. **🔄 Browser test**: Otestovat v prohlížeči
3. **🔄 Verify results**: Zkontrolovat všechny billing cycles

#### **Short-term:**
1. **🔄 HostBill Admin**: Nastavit ceny pro billing cycles
2. **🔄 Re-test**: Po nastavení cen testovat znovu
3. **🔄 Order creation**: Implementovat override price

## 🎉 **Shrnutí:**

**✅ Duplicitní sekce odstraněna**: Čistší UI
**✅ Affiliate podpora přidána**: Test respektuje aktuální affiliate
**✅ API rozšířeno**: Podporuje affiliate_id
**✅ UI vylepšeno**: Více informací, lepší UX
**✅ Diagnostika vylepšena**: Method zobrazení pro lepší debugging

**Test je nyní připraven pro diagnostiku HostBill pricing problémů s affiliate podporou!** 🎯

**Spusť test na: http://localhost:3000/middleware-affiliate-products**
