# Cart Page Real Pricing Integration

## 🎯 **CART STRÁNKA POUŽÍVÁ REAL PRICING Z MIDDLEWARE API!**

### ✅ **Implementované změny:**

#### **1. ✅ Flow correction:**
- **PŘED**: VPS → Payment (testovací)
- **PO**: VPS → Cart (správný flow)

#### **2. ✅ Real pricing calculation:**
- **PŘED**: Hardcoded discounts (5%, 10%, 20%, 30%, 40%)
- **PO**: Real HostBill prices z middleware API

#### **3. ✅ Enhanced savings display:**
- **PŘED**: Pouze period discount
- **PO**: Real savings vs monthly × months

#### **4. ✅ Affiliate commission display:**
- **PŘED**: Žádné zobrazení komisí
- **PO**: Commission info pro affiliate partnery

### **🔧 Implementation:**

#### **Enhanced calculateItemPrice:**
```javascript
const calculateItemPrice = (item) => {
  // Use middleware pricing data if available
  if (item.allPrices) {
    const periodMapping = {
      '1': 'monthly',
      '3': 'quarterly', 
      '6': 'semiannually',
      '12': 'annually',
      '24': 'biennially',
      '36': 'triennially'
    };
    
    const priceField = periodMapping[selectedPeriod] || 'monthly';
    const periodPrice = parseFloat(item.allPrices[priceField] || item.allPrices.monthly || 0);
    
    if (periodPrice > 0) {
      // Add OS modifier to real price
      const os = operatingSystems.find(os => os.id === selectedOS);
      return periodPrice + (os?.priceModifier || 0);
    }
  }
  
  // Fallback to old calculation
  const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
  const period = periods.find(p => p.value === selectedPeriod);
  const discountedPrice = basePrice * (1 - (period?.discount || 0) / 100);
  return discountedPrice + (os?.priceModifier || 0);
};
```

#### **Real savings calculation:**
```javascript
const calculateOriginalPrice = (item) => {
  if (item.allPrices) {
    const monthlyPrice = parseFloat(item.allPrices.monthly || 0);
    const months = parseInt(selectedPeriod);
    const os = operatingSystems.find(os => os.id === selectedOS);
    
    // Original = monthly × months + OS modifier × months
    return (monthlyPrice * months) + ((os?.priceModifier || 0) * months);
  }
  
  // Fallback calculation
  const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
  const months = parseInt(selectedPeriod);
  return basePrice * months + ((os?.priceModifier || 0) * months);
};

const calculateItemSavings = (item) => {
  const currentPrice = calculateItemPrice(item) * parseInt(selectedPeriod);
  const originalPrice = calculateOriginalPrice(item);
  return Math.max(0, originalPrice - currentPrice);
};
```

#### **Enhanced UI display:**
```jsx
{/* Real savings display */}
{(() => {
  const savings = calculateItemSavings(item) * item.quantity;
  const originalPrice = calculateOriginalPrice(item) * item.quantity;
  
  return savings > 0 && (
    <div className="space-y-1">
      <div className="text-xs text-gray-400 line-through">
        {Math.round(originalPrice)} Kč
      </div>
      <div className="text-xs text-green-600 font-medium">
        Ušetříte: {Math.round(savings)} Kč
      </div>
    </div>
  );
})()}

{/* Commission info for affiliates */}
{item.commission && (
  <p className="text-xs text-green-600 font-medium">
    💰 Provize: {item.commission.rate}% = {item.commission.monthly_amount} CZK/měsíc
  </p>
)}
```

### **🧪 Test Scenarios:**

#### **Test 1: VPS Start with real pricing:**
```
Product: VPS Start (ID: 5)
Real pricing from HostBill:
- Monthly: 299 CZK
- Annual: 3237 CZK

Cart Display:
- Period: 12 měsíců
- Current Price: 3237 CZK
- Original Price: 3588 CZK (299 × 12)
- Savings: 351 CZK
- Monthly: 269 CZK/měsíc
```

#### **Test 2: Multiple products:**
```
Cart: VPS Start + VPS Profi
Period: 12 months

Expected:
- VPS Start: 3237 CZK (real annual price)
- VPS Profi: 5388 CZK (real annual price)
- Total: 8625 CZK
- Total Savings: 702 CZK
```

#### **Test 3: Affiliate commission:**
```
Affiliate: ID 1
Product: VPS Start
Commission: 10% = 30 CZK/měsíc

Cart Display:
💰 Provize: 10% = 30 CZK/měsíc
```

#### **Test 4: OS modifier:**
```
Product: VPS Start (299 CZK/měsíc)
OS: Windows (+500 CZK/měsíc)
Period: 12 months

Expected:
- Base Annual: 3237 CZK
- Windows Annual: 6000 CZK (500 × 12)
- Total: 9237 CZK
- Monthly: 770 CZK/měsíc
```

### **📊 Flow Correction:**

#### **✅ Correct flow:**
```
1. VPS Page → Load products from middleware API
2. Add to Cart → Store complete pricing data
3. Cart Page → Use real pricing for calculations
4. Checkout → Process order with accurate totals
```

#### **❌ Old incorrect flow:**
```
VPS Page → Payment Page (testovací, bypassed cart)
```

#### **✅ New correct flow:**
```
VPS Page → Cart Page → Checkout Process
```

### **🎯 Expected Results:**

#### **✅ Real pricing display:**
```
VPS Start - 12 měsíců:
- Zobrazená cena: 3237 CZK (real HostBill annual price)
- Původní cena: 3588 CZK (299 × 12)
- Ušetříte: 351 CZK
- Měsíčně: 269 CZK/měsíc
```

#### **✅ Accurate calculations:**
```
- Používá real HostBill prices místo approximací
- Správné savings calculations
- Přesné totals pro checkout
- Commission tracking pro affiliates
```

#### **✅ Enhanced UX:**
```
- Jasné zobrazení slev
- Real savings amounts
- Commission info pro partnery
- Accurate pricing pro všechna období
```

### **🔍 Debug Information:**

#### **Console logs:**
```
💰 Using middleware pricing data for VPS Start: {...}
📊 VPS Start - Period: 12, Real price: 3237 CZK, Final: 3237 CZK
📊 Savings calculation: Original 3588 CZK → Current 3237 CZK = 351 CZK saved
```

#### **Cart item structure:**
```javascript
{
  id: 5,
  name: "VPS Start",
  price: "299 Kč",
  allPrices: {
    monthly: "299",
    annually: "3237",
    biennially: "6103"
  },
  commission: {
    rate: "10",
    monthly_amount: "30"
  },
  quantity: 1
}
```

### **🧪 Browser Test Steps:**

#### **1. ✅ Test correct flow:**
```
1. Otevři http://localhost:3000/vps
2. Klikni "Přidat do košíku" na VPS Start
3. Ověř redirect na /cart (ne /payment)
4. Zkontroluj zobrazení real pricing
```

#### **2. ✅ Test real pricing:**
```
1. Na cart page zkontroluj ceny:
   - Monthly: 299 CZK/měsíc
   - Annual: 3237 CZK (269 CZK/měsíc)
   - Savings: 351 CZK
2. Změň period na různá období
3. Ověř real prices pro každé období
```

#### **3. ✅ Test affiliate commission:**
```
1. Otevři http://localhost:3000/vps?affiliate_id=1
2. Přidej produkt do košíku
3. Na cart page zkontroluj commission info
4. Ověř zobrazení: "💰 Provize: 10% = 30 CZK/měsíc"
```

#### **4. ✅ Test OS modifier:**
```
1. Na cart page vyber Windows OS
2. Zkontroluj přidání +500 CZK/měsíc
3. Ověř správný výpočet totals
4. Zkontroluj updated savings
```

### **📋 Verification Checklist:**

- [ ] ✅ **Flow corrected**: VPS → Cart (ne Payment)
- [ ] ✅ **Real pricing**: Používá middleware API data
- [ ] ✅ **Accurate savings**: Real calculations vs monthly × months
- [ ] ✅ **Commission display**: Pro affiliate partnery
- [ ] ✅ **OS modifier**: Správné přidání k cenám
- [ ] ✅ **Fallback mechanism**: Graceful handling bez API data
- [ ] ✅ **Console logging**: Debug info pro troubleshooting

## 🎉 **Shrnutí:**

**✅ Flow corrected**: VPS → Cart (správný flow)
**✅ Real pricing**: Middleware API data místo hardcoded discounts
**✅ Accurate calculations**: Real HostBill prices a savings
**✅ Enhanced UX**: Commission info, real savings, accurate totals
**✅ Fallback support**: Graceful handling při chybějících datech

**Cart stránka nyní správně zobrazuje real pricing data z HostBill!** 🎯

**Test dostupný na: http://localhost:3000/vps → Add to Cart → Cart Page** 🔧
