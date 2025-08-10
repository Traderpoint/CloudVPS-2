# Payment-Method Loads Cart from Billing

## 🎯 **PAYMENT-METHOD NAČÍTÁ STEJNÉ ČÁSTKY A SLEVY JAKO BILLING!**

### ✅ **Implementované změny:**

#### **1. ✅ Payment-method načítá z billing:**
- **PŘED**: Používal `useCart()` context (původní cart)
- **PO**: Načítá `billingCartData` ze sessionStorage
- **Same source**: Stejný zdroj dat jako billing stránka

#### **2. ✅ Billing pricing functions:**
- **PŘED**: Vlastní `calculateItemPrices()` s hardcoded discounts
- **PO**: Používá billing pricing data z sessionStorage
- **Consistent**: Stejné ceny a slevy jako billing

#### **3. ✅ CartSidebar integration:**
- **PŘED**: CartSidebar používal cart context calculations
- **PO**: CartSidebar používá billing pricing functions
- **Professional**: Konzistentní pricing napříč celým flow

### **🔧 Implementation Details:**

#### **Payment-method.js - Load from billing:**
```javascript
// pages/payment-method.js
export default function PaymentMethod() {
  const { clearCart } = useCart(); // Only need clearCart, items will come from billing
  const [items, setItems] = useState([]); // Load items from billing
  const [billingCartData, setBillingCartData] = useState(null); // Load from billing

  // Load billing cart data from sessionStorage
  useEffect(() => {
    const savedBillingCartData = sessionStorage.getItem('billingCartData');
    
    if (savedBillingCartData) {
      try {
        const billingData = JSON.parse(savedBillingCartData);
        console.log('💾 Billing cart data found:', billingData);
        
        setBillingCartData(billingData);
        setItems(billingData.items || []);
        setSelectedPeriod(billingData.selectedPeriod || '12');
        setSelectedOS(billingData.selectedOS || 'linux');
        setSelectedApps(billingData.selectedApps || []);
        
        console.log('✅ Payment-method loaded from billing:', {
          items: billingData.items?.length || 0,
          period: billingData.selectedPeriod,
          os: billingData.selectedOS,
          total: billingData.cartTotal
        });
      } catch (error) {
        console.error('❌ Error loading billing cart data:', error);
      }
    }
  }, []);

  // Pricing functions using billing cart data
  const getTotalPrice = () => {
    if (billingCartData && billingCartData.cartTotal !== undefined) {
      console.log('💰 Payment-method: Using billing cart total:', billingCartData.cartTotal);
      return billingCartData.cartTotal;
    }
    // Fallback calculation
  };

  const getMonthlyTotal = () => {
    if (billingCartData && billingCartData.cartMonthlyTotal !== undefined) {
      return billingCartData.cartMonthlyTotal;
    }
    // Fallback calculation
  };

  const getTotalSavings = () => {
    if (billingCartData && billingCartData.totalSavings !== undefined) {
      return billingCartData.totalSavings;
    }
    return 0;
  };

  // CartSidebar with billing pricing functions
  return (
    <CartSidebar
      // ... standard props
      // Custom pricing functions from billing data
      getCartTotal={getTotalPrice}
      getCartMonthlyTotal={getMonthlyTotal}
      getTotalSavings={getTotalSavings}
    />
  );
};
```

### **📊 Data Flow:**

#### **✅ Complete billing → payment-method flow:**
```
1. Billing Page:
   - User fills billing form
   - Cart items with real savings loaded
   - Billing calculates pricing using own functions
   - User clicks "Pokračovat k platbě"

2. Billing handleSubmit:
   - Create order in HostBill
   - Calculate all pricing data (total, monthly, savings)
   - Save billingCartData to sessionStorage
   - Redirect to /payment-method

3. Payment-method Page:
   - Load billingCartData from sessionStorage
   - Set items, period, OS, apps from billing data
   - Use billing pricing functions for calculations
   - Display same totals as billing page

4. CartSidebar in Payment-method:
   - Use payment-method's pricing functions (which use billing data)
   - Display consistent pricing with billing
   - Professional and accurate UX
```

### **🧪 Expected Results:**

#### **✅ VPS Start example:**
```
Billing Page:
- VPS Start: 3237 CZK (299 CZK/měsíc)
- Sleva: 351 CZK (10%)
- Celkem za 12 měsíců: 3237 CZK

billingCartData saved:
{
  "cartTotal": 3237,
  "cartMonthlyTotal": 299,
  "totalSavings": 351,
  "items": [{ VPS Start with all pricing data }]
}

Payment-method Page:
- VPS Start: 3237 CZK (299 CZK/měsíc) ✅ (same as billing)
- Sleva: 351 CZK (10%) ✅ (same as billing)
- Celkem za 12 měsíců: 3237 CZK ✅ (same as billing)
```

#### **✅ Console verification:**
```
Billing Page:
💾 Billing cart data saved for payment: { cartTotal: 3237, totalSavings: 351, ... }

Payment-method Page:
💾 Billing cart data found: { cartTotal: 3237, totalSavings: 351, ... }
✅ Payment-method loaded from billing: { items: 1, period: "12", total: 3237 }
💰 Payment-method: Using billing cart total: 3237
💰 Payment-method: Using billing total savings: 351
```

### **🔍 Before vs After:**

#### **❌ Before (inconsistent):**
```javascript
// Payment-method používal vlastní calculations:
const calculateItemPrices = (item) => {
  const basePrice = parseFloat(item.price.replace(/[^\d]/g, ''));
  const period = periods.find(p => p.value === selectedPeriod);
  const totalAfterDiscount = totalBeforeDiscount * (1 - (period?.discount || 0) / 100);
  // Hardcoded discount percentages (20% místo real 10%)
};

// Result: Jiné ceny než na billing
VPS Start: Jiná cena než 3237 CZK ❌
Sleva: 20% místo 10% ❌
```

#### **✅ After (consistent):**
```javascript
// Payment-method používá billing data:
const getTotalPrice = () => {
  if (billingCartData && billingCartData.cartTotal !== undefined) {
    return billingCartData.cartTotal; // 3237 CZK z billing
  }
  // Fallback
};

const getTotalSavings = () => {
  if (billingCartData && billingCartData.totalSavings !== undefined) {
    return billingCartData.totalSavings; // 351 CZK z billing
  }
  return 0;
};

// Result: Stejné ceny jako na billing
VPS Start: 3237 CZK ✅ (same as billing)
Sleva: 351 CZK (10%) ✅ (same as billing)
```

### **🎯 Benefits:**

#### **✅ Consistent pricing:**
- **Same source**: Payment-method používá billing calculations
- **No differences**: Žádné rozdíly mezi billing a payment-method
- **Professional flow**: Konzistentní pricing napříč celým flow

#### **✅ Accurate savings:**
- **Real savings**: Používá skutečné slevy z billing (10% místo hardcoded 20%)
- **CZK amounts**: Zobrazuje skutečné CZK částky úspor
- **Trust building**: Zákazník vidí konzistentní slevy

#### **✅ Maintainable:**
- **Single source**: Billing jako zdroj pro payment-method pricing
- **No duplication**: Žádné duplicate calculations
- **Debug friendly**: Console logs pro troubleshooting

### **🧪 Browser Test Steps:**

#### **1. ✅ Test billing → payment-method flow:**
```
1. Otevři http://localhost:3000/billing
2. Vyplň billing form
3. Zkontroluj pricing na billing:
   - VPS Start: 3237 CZK
   - Sleva: 351 CZK (10%)
   - Celkem: 3237 CZK
4. Klikni "Pokračovat k platbě"
5. Payment-method page:
   - Zkontroluj, že pricing je stejné jako na billing
   - Ověř console logs pro billing data loading
```

#### **2. ✅ Test console logs:**
```
1. Otevři Developer Tools → Console
2. Na billing page klikni "Pokračovat k platbě"
3. Hledej: "💾 Billing cart data saved for payment"
4. Na payment-method page hledej: "💾 Billing cart data found"
5. Ověř: "💰 Payment-method: Using billing cart total"
```

#### **3. ✅ Test pricing consistency:**
```
1. Porovnej pricing mezi billing a payment-method:
   - Individual item prices
   - Total amounts
   - Monthly equivalents
   - Savings amounts (CZK i %)
2. Ověř, že jsou identické
```

#### **4. ✅ Test sessionStorage:**
```
1. Otevři Developer Tools → Application → Session Storage
2. Po přechodu z billing na payment-method zkontroluj:
   - billingCartData object s kompletními pricing data
   - Správné hodnoty pro cartTotal, totalSavings
```

### **📋 Verification Checklist:**

- [ ] ✅ **Payment-method loads from billing**: billingCartData ze sessionStorage
- [ ] ✅ **Same items**: Stejné items jako na billing
- [ ] ✅ **Same pricing**: Stejné ceny jako billing (3237 CZK)
- [ ] ✅ **Same savings**: Stejné slevy jako billing (351 CZK, 10%)
- [ ] ✅ **CartSidebar integration**: Custom functions předány do CartSidebar
- [ ] ✅ **Console logs**: Debug logs pro troubleshooting
- [ ] ✅ **No hardcoded discounts**: Žádné hardcoded 20% discounts
- [ ] ✅ **Professional UX**: Konzistentní pricing napříč flow

## 🎉 **Shrnutí:**

**✅ Payment-method loads from billing**: Načítá billingCartData ze sessionStorage
**✅ Same pricing as billing**: Stejné ceny a slevy jako billing stránka
**✅ No hardcoded discounts**: Žádné hardcoded discount percentages
**✅ Consistent flow**: Konzistentní pricing napříč billing → payment-method
**✅ Professional UX**: Trustworthy a accurate pricing display
**✅ Debug support**: Console logs pro troubleshooting

**Payment-method nyní načítá stejné částky a slevy jako košík na billing!** 🎯

**Expected display:**
- **VPS Start**: 3237 CZK (299 CZK/měsíc) - same as billing
- **Sleva**: 351 CZK (10%) - same as billing  
- **Celkem**: 3237 CZK - same as billing

**Test workflow:**
1. **Billing Page** → Fill form → Calculate pricing
2. **"Pokračovat k platbě"** → Save billingCartData → Redirect
3. **Payment-method Page** → Load billing data → Display same pricing
4. **Consistent UX** → Same totals, savings, items across pages

**Test dostupný na: http://localhost:3000/billing → Payment-method → Consistent cart from billing** 🔧
