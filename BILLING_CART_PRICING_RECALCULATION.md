# Billing Cart Pricing Recalculation

## 🎯 **BILLING NAČÍTÁ KOŠÍK Z CART A POČÍTÁ SLEVY ZNOVA!**

### ✅ **Implementované změny:**

#### **1. ✅ Billing pricing functions:**
- **PŘED**: Billing neměl vlastní pricing calculations
- **PO**: Kompletní pricing functions v billing.js
- **Recalculation**: Billing si počítá slevy znova z cart items

#### **2. ✅ Enhanced CartSidebar:**
- **PŘED**: CartSidebar měl pouze hardcoded calculations
- **PO**: CartSidebar přijímá custom pricing functions jako props
- **Flexibility**: Může používat různé calculations pro různé stránky

#### **3. ✅ Real savings integration:**
- **PŘED**: Billing nepoužíval real savings
- **PO**: Billing používá real savings z cart items
- **Consistency**: Stejné úspory jako na VPS a Cart stránkách

### **🔧 Implementation Details:**

#### **Billing.js - Pricing functions:**
```javascript
// Calculate monthly price for an item
const calculateMonthlyPrice = (item) => {
  if (item.allPrices) {
    const monthlyPrice = parseFloat(item.allPrices.monthly || 0);
    const os = operatingSystems.find(os => os.id === selectedOS);
    return monthlyPrice + (os?.priceModifier || 0);
  }
  
  // Fallback calculation
  const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
  const os = operatingSystems.find(os => os.id === selectedOS);
  return basePrice + (os?.priceModifier || 0);
};

// Calculate total price for selected period
const calculatePeriodPrice = (item) => {
  if (item.allPrices) {
    const periodMapping = {
      '1': 'monthly', '3': 'quarterly', '6': 'semiannually',
      '12': 'annually', '24': 'biennially', '36': 'triennially'
    };
    
    const priceField = periodMapping[selectedPeriod] || 'monthly';
    const periodPrice = parseFloat(item.allPrices[priceField] || item.allPrices.monthly || 0);
    const os = operatingSystems.find(os => os.id === selectedOS);
    
    if (periodPrice > 0 && priceField !== 'monthly') {
      // Use real period price + OS modifier for the period
      const osModifierForPeriod = (os?.priceModifier || 0) * parseInt(selectedPeriod);
      return periodPrice + osModifierForPeriod;
    } else {
      // Calculate monthly × period
      const monthlyPrice = parseFloat(item.allPrices.monthly || 0);
      const monthlyWithOS = monthlyPrice + (os?.priceModifier || 0);
      return monthlyWithOS * parseInt(selectedPeriod);
    }
  }
  
  // Fallback calculation
  const monthlyPrice = calculateMonthlyPrice(item);
  return monthlyPrice * parseInt(selectedPeriod);
};

// Calculate savings using real savings data
const calculateItemSavings = (item) => {
  // Use real savings if available
  if (item.realSavings) {
    const periodMapping = { '6': 'semiannually', '12': 'annually', '24': 'biennially' };
    const periodKey = periodMapping[selectedPeriod];
    const realSavings = item.realSavings[periodKey];
    
    if (realSavings && realSavings.amount > 0) {
      return realSavings.amount;  // Use real savings amount
    }
  }
  
  // Fallback to calculated savings
  const monthlyPrice = calculateMonthlyPrice(item);
  const periodPrice = calculatePeriodPrice(item);
  const originalPrice = monthlyPrice * parseInt(selectedPeriod);
  return Math.max(0, originalPrice - periodPrice);
};

// Cart totals
const getCartTotal = () => {
  return items.reduce((total, item) => {
    return total + calculatePeriodPrice(item) * item.quantity;
  }, 0);
};

const getCartMonthlyTotal = () => {
  return items.reduce((total, item) => {
    return total + calculateMonthlyPrice(item) * item.quantity;
  }, 0);
};

const getTotalSavings = () => {
  return items.reduce((total, item) => {
    return total + calculateItemSavings(item) * item.quantity;
  }, 0);
};
```

#### **CartSidebar.js - Enhanced with custom functions:**
```javascript
export default function CartSidebar({
  // ... existing props
  // Custom pricing functions (optional)
  calculateMonthlyPrice = null,
  calculatePeriodPrice = null,
  calculateItemSavings = null,
  getCartTotal = null,
  getCartMonthlyTotal = null,
  getTotalSavings = null
}) {
  // Use custom pricing functions if provided
  const calculateItemPrice = (item) => {
    if (calculatePeriodPrice) {
      return calculatePeriodPrice(item);  // Use custom function
    }
    
    // Default calculation
    const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
    const period = periods.find(p => p.value === selectedPeriod);
    const os = operatingSystems.find(os => os.id === selectedOS);
    
    const discountedPrice = basePrice * (1 - (period?.discount || 0) / 100);
    return discountedPrice + (os?.priceModifier || 0);
  };

  const getCartTotalPrice = () => {
    if (getCartTotal) {
      return getCartTotal();  // Use custom function
    }
    
    // Default calculation
    return items.reduce((total, item) => {
      return total + calculateItemPrice(item) * item.quantity;
    }, 0);
  };

  const getCartMonthlyPrice = () => {
    if (getCartMonthlyTotal) {
      return getCartMonthlyTotal();  // Use custom function
    }
    
    // Default calculation
    return items.reduce((total, item) => {
      const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
      const os = operatingSystems.find(os => os.id === selectedOS);
      return total + (basePrice + (os?.priceModifier || 0)) * item.quantity;
    }, 0);
  };

  const getTotalSavingsAmount = () => {
    if (getTotalSavings) {
      return getTotalSavings();  // Use custom function
    }
    
    return 0;  // Default: no savings calculation
  };
}
```

#### **Billing.js - CartSidebar usage:**
```javascript
<CartSidebar
  selectedPeriod={selectedPeriod}
  selectedOS={selectedOS}
  selectedApps={selectedApps}
  onPeriodChange={setSelectedPeriod}
  onOSChange={setSelectedOS}
  nextStepText="Pokračovat k platbě"
  onNextStep={handleSubmit}
  isLoading={isLoading}
  // Custom pricing functions for billing calculations
  calculateMonthlyPrice={calculateMonthlyPrice}
  calculatePeriodPrice={calculatePeriodPrice}
  calculateItemSavings={calculateItemSavings}
  getCartTotal={getCartTotal}
  getCartMonthlyTotal={getCartMonthlyTotal}
  getTotalSavings={getTotalSavings}
/>
```

### **📊 Data Flow:**

#### **✅ Complete recalculation flow:**
```
1. Cart Page:
   - Cart items with real savings stored
   - User proceeds to billing

2. Billing Page:
   - Loads cart items via useCart() hook
   - Loads cart settings from sessionStorage
   - Implements own pricing functions
   - Recalculates all prices and savings

3. CartSidebar in Billing:
   - Uses billing's custom pricing functions
   - Displays recalculated totals
   - Shows real savings amounts
   - Updates when period/OS changes

4. Order Creation:
   - Uses billing's calculated totals
   - Consistent pricing for order processing
```

### **🧪 Expected Results:**

#### **✅ VPS Start example (299 CZK/měs):**
```
Cart Items from VPS:
- allPrices: { monthly: "299", annually: "3237" }
- realSavings: { annually: { amount: 351, percent: 10 } }

Billing Recalculation:
- calculateMonthlyPrice(item) = 299 CZK
- calculatePeriodPrice(item) = 3237 CZK (for 12 months)
- calculateItemSavings(item) = 351 CZK (from realSavings)

CartSidebar Display:
- Celkem za 12 měsíců: 3237 CZK
- 299 CZK/měsíc
- Ušetříte: 351 CZK
```

#### **✅ Console verification:**
```
📊 Billing: VPS Start - Monthly: 299 CZK + OS: 0 = 299 CZK/měs
📊 Billing: VPS Start - Period: 12, Real period price: 3237 CZK + OS period: 0 = 3237 CZK
💰 Billing: Using real savings for VPS Start (12 months): 351 CZK
💰 Billing: Using middleware pricing data for VPS Start: {...}
```

### **🎯 Benefits:**

#### **✅ Independent calculations:**
- **Fresh calculations**: Billing počítá slevy znova z cart items
- **No dependency**: Nezávislé na předchozích calculations
- **Flexibility**: Může použít jiné logic než cart page

#### **✅ Real savings integration:**
- **Consistent data**: Používá real savings z cart items
- **Accurate display**: Správné CZK i % úspory
- **Trust building**: Zákazník vidí konzistentní úspory

#### **✅ Enhanced CartSidebar:**
- **Reusable**: Může být použit s různými pricing functions
- **Flexible**: Fallback na default calculations
- **Professional**: Zobrazuje měsíční i period totals + úspory

### **🧪 Browser Test Steps:**

#### **1. ✅ Test Cart → Billing flow:**
```
1. Otevři http://localhost:3000/vps
2. Přidej VPS Start do košíku
3. Jdi na cart page → zkontroluj pricing
4. Klikni "Pokračovat k objednávce"
5. Billing page:
   - Zkontroluj CartSidebar pricing
   - Ověř, že se zobrazují úspory
   - Změň period a ověř recalculation
```

#### **2. ✅ Test period changes:**
```
1. Na billing page změň period
2. Zkontroluj recalculation v CartSidebar:
   - Celkem za X měsíců: Y CZK
   - Z CZK/měsíc
   - Ušetříte: W CZK
3. Ověř console logs pro calculations
```

#### **3. ✅ Test OS changes:**
```
1. Změň OS na Windows Server
2. Zkontroluj přidání OS modifier:
   - Monthly: 299 + 500 = 799 CZK/měs
   - Period: Správné calculations s OS modifier
3. Ověř konzistentní pricing
```

#### **4. ✅ Test console logs:**
```
1. Otevři Developer Tools → Console
2. Reload billing page
3. Hledej: "📊 Billing:" a "💰 Billing:" logs
4. Ověř správné calculations a real savings usage
```

### **📋 Verification Checklist:**

- [ ] ✅ **Cart loading**: Billing načítá cart items z useCart()
- [ ] ✅ **Settings loading**: Billing načítá cart settings ze sessionStorage
- [ ] ✅ **Pricing functions**: Kompletní pricing calculations v billing.js
- [ ] ✅ **Real savings**: Používá real savings z cart items
- [ ] ✅ **CartSidebar integration**: Custom functions předány do CartSidebar
- [ ] ✅ **Recalculation**: Billing počítá slevy znova
- [ ] ✅ **Period changes**: Správné recalculation při změně období
- [ ] ✅ **OS modifier**: Správné calculations s OS modifier
- [ ] ✅ **Console logs**: Debug logs pro troubleshooting

## 🎉 **Shrnutí:**

**✅ Independent recalculation**: Billing počítá slevy znova z cart items
**✅ Real savings integration**: Používá real savings z VPS calculations
**✅ Enhanced CartSidebar**: Flexible s custom pricing functions
**✅ Consistent pricing**: Stejné calculations jako cart page
**✅ Professional UX**: Měsíční + period totals + úspory
**✅ Debug support**: Console logs pro troubleshooting

**Billing stránka nyní načítá košík z Cart a počítá si slevy znova s real savings!** 🎯

**Test dostupný na: http://localhost:3000/cart → Billing → Independent recalculation** 🔧
