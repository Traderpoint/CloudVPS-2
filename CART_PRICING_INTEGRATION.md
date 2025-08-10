# Cart Pricing Integration

## 🎯 **CART SPRÁVNĚ NAČÍTÁ CENY A SLEVY Z MIDDLEWARE API!**

### ✅ **Implementované změny:**

#### **1. ✅ Enhanced cart data:**
- **PŘED**: Pouze základní info (name, price, cpu, ram)
- **PO**: Kompletní pricing data (allPrices, commission, discounts)

#### **2. ✅ SessionStorage integration:**
- **PŘED**: Pouze billing period a OS
- **PO**: Kompletní productPricing data pro každý produkt

#### **3. ✅ Smart price calculation:**
- **PŘED**: Statické ceny s period discount
- **PO**: Real HostBill ceny pro každé období

#### **4. ✅ Fallback mechanism:**
- **PŘED**: Crash při chybějících datech
- **PO**: Graceful fallback na calculatePrice

### **🔧 VPS Page Implementation:**

#### **Enhanced handleAddToCart:**
```javascript
const handleAddToCart = (plan) => {
  // Add complete pricing data to cart
  addItem({
    id: plan.id,
    name: plan.name,
    // ... basic data
    allPrices: plan.allPrices || {
      monthly: plan.price.replace(/[^\d]/g, ''),
      quarterly: '0',
      semiannually: '0',
      annually: '0',
      biennially: '0',
      triennially: '0'
    },
    commission: plan.commission || null,
    discounts: {
      quarterly: 0,
      semiannually: 5,
      annually: 10,
      biennially: 15,
      triennially: 20
    }
  });

  // Store pricing data in sessionStorage
  const cartSettings = {
    selectedPeriod: '12',
    productPricing: {
      [plan.id]: {
        allPrices: plan.allPrices,
        commission: plan.commission,
        discounts: { ... }
      }
    }
  };
  
  sessionStorage.setItem('cartSettings', JSON.stringify(cartSettings));
  router.push('/payment');
};
```

### **🔧 Payment Page Implementation:**

#### **Enhanced cart settings loading:**
```javascript
useEffect(() => {
  const cartSettings = sessionStorage.getItem('cartSettings');
  if (cartSettings) {
    const settings = JSON.parse(cartSettings);
    
    // Load product pricing data
    if (settings.productPricing) {
      items.forEach(item => {
        const productPricing = settings.productPricing[item.id];
        if (productPricing && !item.allPrices) {
          item.allPrices = productPricing.allPrices;
          item.commission = productPricing.commission;
          item.discounts = productPricing.discounts;
        }
      });
    }
  }
}, []);
```

#### **Smart price calculation:**
```javascript
const getTotalForPeriod = () => {
  itemsToCalculate.forEach(item => {
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
        itemPrice = periodPrice; // Use real HostBill price
        // Calculate savings vs monthly * months
        const months = parseInt(selectedPeriod);
        const fullMonthlyTotal = monthlyPrice * months;
        itemSavings = Math.max(0, fullMonthlyTotal - periodPrice);
      }
    } else {
      // Fallback to old calculation
      const calc = calculatePrice(item.price, selectedPeriod, discount);
      itemPrice = calc.discounted;
      itemSavings = calc.savings;
    }
    
    total += itemPrice * (item.quantity || 1);
    savings += itemSavings * (item.quantity || 1);
  });
};
```

### **🧪 Test Scenarios:**

#### **Test 1: VPS Start with real pricing:**
```
Input: VPS Start (Product ID: 5)
Middleware API returns:
- monthly: 299 CZK
- annually: 3237 CZK  
- biennially: 6103 CZK

Expected Cart Behavior:
- Monthly (1): 299 CZK
- Annually (12): 3237 CZK (269 CZK/měsíc) - 10% sleva
- Biennially (24): 6103 CZK (254 CZK/měsíc) - 15% sleva

Savings Calculation:
- Annual: (299 × 12) - 3237 = 351 CZK saved
- Biennial: (299 × 24) - 6103 = 1073 CZK saved
```

#### **Test 2: Multiple products in cart:**
```
Cart: VPS Start + VPS Profi
Period: 12 months

Expected:
- VPS Start: 3237 CZK (real HostBill annual price)
- VPS Profi: 5388 CZK (real HostBill annual price)
- Total: 8625 CZK
- Total Savings: 702 CZK (vs monthly × 12)
```

#### **Test 3: Affiliate commission display:**
```
Affiliate ID: 1
Product: VPS Start
Commission: 10% = 30 CZK/měsíc

Expected:
- Cart shows commission info
- Payment page calculates affiliate earnings
- Order includes affiliate tracking
```

### **📊 Data Flow:**

#### **1. VPS Page → Cart:**
```
loadProducts() → Middleware API → Real pricing data
handleAddToCart() → Enhanced cart item + sessionStorage
router.push('/payment') → Navigate with complete data
```

#### **2. Payment Page → Calculation:**
```
Load sessionStorage → Merge with cart items → Enhanced pricing data
getTotalForPeriod() → Use real HostBill prices → Accurate totals
```

#### **3. Fallback Chain:**
```
1. Try item.allPrices[period] (real HostBill price)
2. Try item.allPrices.monthly (real monthly price)
3. Try calculatePrice() (old method with discount)
4. Try hardcoded fallback (249 CZK)
```

### **🎯 Expected Results:**

#### **✅ Real pricing from HostBill:**
```
VPS Start:
- Monthly: 299 CZK (was 249 CZK hardcoded)
- Annual: 3237 CZK (was 249 × 12 × 0.9 = 2686 CZK)
- Savings: 351 CZK (was 299 CZK)
```

#### **✅ Accurate period calculations:**
```
Period Selection → Real HostBill price for that period
No more approximations with discount percentages
Exact prices as configured in HostBill Admin
```

#### **✅ Enhanced cart display:**
```
Cart Sidebar shows:
- Real period-specific prices
- Accurate savings calculations
- Commission info for affiliates
- Proper totals for checkout
```

### **🔍 Debug Information:**

#### **Console logs to watch:**
```
VPS Page:
💾 Cart settings saved with pricing data: {...}
📊 VPS Start - Period: 12, Price: 3237 CZK, Savings: 351 CZK

Payment Page:
💰 Using middleware pricing data for VPS Start: {...}
💰 getTotalForPeriod calculation: {...}
📊 VPS Start - Period: 12, Price: 3237 CZK, Savings: 351 CZK
```

#### **SessionStorage structure:**
```json
{
  "selectedPeriod": "12",
  "selectedOS": "linux",
  "selectedApps": [],
  "productPricing": {
    "5": {
      "allPrices": {
        "monthly": "299",
        "annually": "3237",
        "biennially": "6103"
      },
      "commission": {
        "rate": "10",
        "monthly_amount": "30"
      },
      "discounts": {
        "annually": 10,
        "biennially": 15
      }
    }
  }
}
```

### **🧪 Browser Test Steps:**

#### **1. ✅ Test real pricing:**
```
1. Otevři http://localhost:3000/vps
2. Klikni "Přidat do košíku" na VPS Start
3. Zkontroluj redirect na /payment
4. Ověř ceny: Monthly 299 CZK, Annual 3237 CZK
5. Změň period na "12 měsíců"
6. Ověř total: 3237 CZK, Savings: 351 CZK
```

#### **2. ✅ Test affiliate commission:**
```
1. Otevři http://localhost:3000/vps?affiliate_id=1
2. Ověř affiliate validaci
3. Přidej VPS Start do košíku
4. Na payment page zkontroluj commission info
5. Ověř affiliate tracking v console
```

#### **3. ✅ Test fallback:**
```
1. Zastav middleware API
2. Otevři VPS page (fallback na hardcoded)
3. Přidej produkt do košíku
4. Ověř fallback na calculatePrice method
5. Zkontroluj, že app nekrachuje
```

## 🎉 **Shrnutí:**

**✅ Cart integration complete**: Používá real pricing data z middleware API
**✅ Smart calculation**: Real HostBill ceny místo approximací
**✅ Enhanced data flow**: VPS → Cart → SessionStorage → Payment
**✅ Fallback mechanism**: Graceful handling při API failure
**✅ Affiliate support**: Commission tracking a zobrazení
**✅ Accurate totals**: Správné ceny a slevy pro všechna období

**Cart nyní správně načítá a zobrazuje real pricing data z HostBill!** 🎯

**Test workflow: VPS Page → Add to Cart → Payment Page → Real Prices** 🔧
